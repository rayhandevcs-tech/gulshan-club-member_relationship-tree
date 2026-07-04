// quotaTreeLayout.ts
// ─────────────────────────────────────────────────────────────────────────────
// Pure graph-building + layout logic for the quota family diagram.
// No React imports (only type-only reactflow imports), so this module can be
// unit-tested in plain Node.
//
// DATA MODEL (the new, explicit model):
//   type      — member class (Permanent / Donor / Life / A4D...). DERIVED from
//               the ID prefix when not provided:  P→Permanent, D→Donor,
//               L→Life, AFD→A4D (has quota access but no own A/C yet).
//               type ONLY controls colors/badges — never placement.
//   via       — 'core' | 'a4d'. THE placement switch:
//                 core → independently-held membership → full card in tree
//                 a4d  → holds a slot off someone's 4(d) quota → slot card
//   rel       — 'spouse' | 'child' (pure relationship; drives line + label)
//   pid       — who this record is attached to: the partner (spouse) or the
//               quota holder / tree parent (child). For via:'a4d' pid is
//               ALWAYS the quota holder — even a cross-family one.
//   fatherId / motherId — real blood parents. Used for the reference text
//               ("Son of PA-41") and for bioMode; never for quota placement.
//
// PLACEMENT MATRIX:
//   rel=spouse via=core → beside partner, full card, "Spouse" line
//   rel=spouse via=a4d  → slot under quota holder, "Spouse of {pid}"
//   rel=child  via=core → next generation, full card
//   rel=child  via=a4d  → slot under quota holder, "Son/Daughter of {father}"
// ─────────────────────────────────────────────────────────────────────────────

import { Graph, layout } from '@dagrejs/dagre';
import type { Node, Edge } from 'reactflow';
import type { Member } from '@/lib/types';

// ── Constants ─────────────────────────────────────────────────────────────────
export const CONN_COLOR = '#CBD5E1';

// dev/test: সব avatar-এ আপাতত public/demo.jpg দেখাবে। যার নিজের photoUrl
// আছে সে সেটাই পাবে (photoOf আগে photoUrl দেখে)। production-এ এটা '' করে
// দিলেই সব জায়গায় initials ফিরে আসবে — আর কিছু বদলাতে হবে না।
export const TEST_PHOTO_URL = '/demo.jpg';

// এক জায়গায় photo resolve: নিজের ছবি > demo fallback
export const photoOf = (m: Member): string | undefined =>
  m.photoUrl || TEST_PHOTO_URL || undefined;

// Two-tier sizing: one size for ALL member cards (incl. successors), one size
// for ALL slot cards (incl. nested). Same width keeps columns aligned.
export const CARD_W = 150;
export const CARD_H = 140;
export const SLOT_W = 150;
export const SLOT_H = 112;

export const BESIDE_GAP     = 90;  // anchor card ↔ beside card (spouse/successor)
export const GROUP_GAP      = 28;  // min gap kept between slot groups / obstacles
export const RANK_SEP       = 80;
export const NODE_SEP       = 16;

// ── Type derivation from ID prefix ────────────────────────────────────────────
// P…  → Permanent (regardless of how access was obtained — that's `via`'s job)
// AFD → A4D quota access, own A/C not yet opened
// D…  → Donor, L… → Life, C… → Corporate, H… → Honorary
export function getType(m: Member): string {
  if (m.type) return m.type; // explicit override wins
  const prefix = (m.id.split('-')[0] ?? '').trim().toUpperCase();
  if (prefix === 'AFD') return 'A4D';
  if (prefix === 'AS')  return 'Associate';
  switch (prefix.charAt(0)) {
    case 'P': return 'Permanent';
    case 'D': return 'Donor';
    case 'L': return 'Life';
    case 'C': return 'Corporate';
    case 'H': return 'Honorary';
    default:  return 'Permanent';
  }
}

// ── Small helpers ─────────────────────────────────────────────────────────────
export const isDead   = (m: Member) => m.name.trim().toLowerCase().startsWith('late ');
export const dispName = (m: Member) =>
  isDead(m) ? m.name.trim().replace(/^late\s+/i, '') : m.name.trim();

// slot badge derives from the access route
export const slotRole = (m: Member): 'A4D' | 'Assoc' =>
  m.via === 'a4d' ? 'A4D' : 'Assoc';

export function findRoot(startId: string, members: Member[]): string {
  let cur = startId;
  const seen = new Set<string>();
  while (!seen.has(cur)) {
    seen.add(cur);
    const m = members.find(x => x.id === cur);
    if (!m?.pid) break;
    cur = m.pid;
  }
  return cur;
}

// The ONE spouse allowed in the beside seat: via 'core' (own membership), or a
// via 'a4d' spouse who received the member's account (succession transfer).
// Every other spouse row — regardless of type — falls through to a quota slot.
export function isBesideSpouse(sp: Member, holder: Member): boolean {
  if (sp.via === 'core') return true;               // own membership → beside
  return holder.succession === sp.id;               // dependent, but received the A/C
}

export function getBioChildren(
  m: Member, spouse: Member | null, members: Member[], bioMode: boolean,
): Member[] {
  const ids = new Set([m.id, ...(spouse ? [spouse.id] : [])]);
  if (bioMode) {
    // blood tree: father/mother links win; quota (pid) is ignored
    return members.filter(x => {
      if (ids.has(x.id)) return false;
      return (
        (x.fatherId != null && ids.has(x.fatherId)) ||
        (x.motherId != null && ids.has(x.motherId)) ||
        (x.rel === 'child' && x.via === 'core' && ids.has(x.pid ?? ''))
      );
    });
  }
  // quota tree: only independently-held children hang as full cards
  return members.filter(x =>
    x.rel === 'child' && x.via === 'core' && (x.pid === m.id || (spouse != null && x.pid === spouse.id)),
  );
}

// Reference line on a slot card:
//   rel 'spouse' → "Spouse of {quota holder}"; নাহলে blood parents থেকে
//   "Son/Daughter of {parent}" — rel 'child' হোক বা 'other', লেখাটা
//   fatherId/motherId-ই ঠিক করে, তাই cross-family quota-তেও সঠিক থাকে
//   (চাচার slot-এ ঝুলেও লেখা আসে বাবার নামে)। parent info না থাকলে line নেই।
export function getRef(slot: Member, listing: Member): string | undefined {
  if (slot.rel === 'spouse') return `Spouse of ${listing.id}`;
  const fid = slot.fatherId ?? undefined;
  const mid = slot.motherId ?? undefined;
  if (!fid && !mid) return undefined;
  const parentId = fid === listing.id ? fid : mid === listing.id ? mid : fid ?? mid;
  const label = slot.gender === 'M' ? 'Son' : slot.gender === 'F' ? 'Daughter' : 'Child';
  return `${label} of ${parentId}`;
}

// dagre allocation sizes (slightly padded beyond render size for breathing room)
export function nodeW(kind: 'member' | 'slot'): number {
  return kind === 'slot' ? SLOT_W + 12 : CARD_W + 20;
}
export function nodeH(kind: 'member' | 'slot'): number {
  return kind === 'slot' ? SLOT_H + 8 : CARD_H + 10;
}

const kindOfNode = (n: Node | undefined): 'member' | 'slot' =>
  n?.type === 'slot' ? 'slot' : 'member';

type EdgeData = { kind?: 'spouse' | 'succession' | 'slot-top'; rootPair?: boolean };
const edgeKind = (e: Edge) => (e.data as EdgeData | undefined)?.kind;

// ── Graph builder ─────────────────────────────────────────────────────────────

export function buildGraph(
  rootMember: Member,
  members: Member[],
  onPick: (id: string) => void,
  bioMode: boolean,
) {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const seen = new Set<string>();
  const slotNodeId = (id: string) => `slot-${id}`;

  // All slots hanging off `owner`'s quota. placeAbove=true only for the root
  // couple (their slots stack upward). besideSpouseId = the one spouse already
  // seated beside — excluded here so she isn't rendered twice.
  function addSlots(owner: Member, bioChildIds: Set<string>, placeAbove: boolean, besideSpouseId?: string) {
    const slots = members.filter(x =>
      x.pid === owner.id &&
      x.via !== 'core' &&
      x.id !== besideSpouseId &&
      !bioChildIds.has(x.id) &&
      // in bioMode anyone with known blood parents renders inside the tree
      // as a full card instead — never double-render them as a slot too
      !(bioMode && (x.fatherId != null || x.motherId != null)) &&
      !seen.has(x.id) && !seen.has(slotNodeId(x.id))
    );

    const srcHandle = placeAbove ? 'top-out'   : 'bottom';
    const tgtHandle = placeAbove ? 'bottom-in' : 'top';
    const eKind     = placeAbove ? ('slot-top' as const) : undefined;

    slots.forEach(slot => {
      const sid = slotNodeId(slot.id);
      seen.add(sid);
      const role = slotRole(slot);

      nodes.push({
        id: sid, type: 'slot',
        data: { member: slot, role, reference: getRef(slot, owner), onPick },
        position: { x: 0, y: 0 },
      });
      edges.push({
        id: `e-${owner.id}-${sid}`,
        source: owner.id, target: sid,
        sourceHandle: srcHandle, targetHandle: tgtHandle,
        type: 'smoothstep',
        style: {
          stroke: role === 'A4D' ? '#9333ea55' : '#ea580c55',
          strokeWidth: 1.5, strokeDasharray: '5 3',
        },
        data: { kind: eKind },
      });

      // nested slots (a slot member granting further quota/associate access)
      members.filter(x => x.pid === slot.id && x.via !== 'core').forEach(sub => {
        const subId = slotNodeId(sub.id);
        if (seen.has(subId) || seen.has(sub.id)) return;
        seen.add(subId);
        const subRole = slotRole(sub);
        nodes.push({
          id: subId, type: 'slot',
          data: { member: sub, role: subRole, nested: true, reference: getRef(sub, slot), onPick },
          position: { x: 0, y: 0 },
        });
        edges.push({
          id: `e-${sid}-${subId}`,
          source: sid, target: subId,
          sourceHandle: srcHandle, targetHandle: tgtHandle,
          type: 'smoothstep',
          style: { stroke: '#CBD5E1', strokeWidth: 1, strokeDasharray: '4 2' },
          data: { kind: eKind },
        });
      });
    });
  }

  function traverse(m: Member, parentId?: string, isRoot = false) {
    if (seen.has(m.id)) return;
    seen.add(m.id);

    // pick the ONE beside spouse; all other spouse rows become slots
    const spouseRows = members.filter(x => x.pid === m.id && x.rel === 'spouse');
    const spouse = spouseRows.find(x => isBesideSpouse(x, m)) ?? null;
    if (spouse) seen.add(spouse.id);

    const succNote           = m.succession;
    const isTransferToSpouse = !!(succNote && spouse && succNote === spouse.id);
    const succession         = succNote && !isTransferToSpouse
      ? members.find(x => x.id === succNote) ?? null
      : null;

    const children = getBioChildren(m, spouse, members, bioMode).filter(c => !seen.has(c.id));
    const childIds = new Set(children.map(c => c.id));

    nodes.push({
      id: m.id, type: 'member',
      data: { member: m, onPick },
      position: { x: 0, y: 0 },
    });

    if (parentId) {
      edges.push({
        id: `e-child-${parentId}-${m.id}`,
        source: parentId, target: m.id,
        sourceHandle: 'bottom', targetHandle: 'top',
        type: 'smoothstep',
        style: { stroke: '#94A3B8', strokeWidth: 1.5 },
      });
    }

    // Spouse → RIGHT (full card; only via:'core' or account-transfer spouses).
    // A/C transfer to the spouse shows on the spousal LINE itself (amber
    // dashed label), not as a badge on the spouse card.
    if (spouse) {
      nodes.push({
        id: spouse.id, type: 'member',
        data: { member: spouse, onPick },
        position: { x: 0, y: 0 },
      });
      edges.push({
        id: `e-spouse-${m.id}-${spouse.id}`,
        source: m.id, target: spouse.id,
        type: 'straight',
        label: isTransferToSpouse ? 'Spouse · A/C transferred' : 'Spouse',
        style: isTransferToSpouse
          ? { stroke: '#F59E0B', strokeWidth: 1.5, strokeDasharray: '5 3' }
          : { stroke: '#9CA3AF', strokeWidth: 1.5 },
        labelStyle: isTransferToSpouse
          ? { fontSize: 8.5, fill: '#92400e', fontWeight: 600 }
          : { fontSize: 8.5, fill: '#9CA3AF', fontWeight: 500 },
        labelBgStyle: isTransferToSpouse
          ? { fill: '#fffbeb', fillOpacity: 0.95, borderRadius: 4 }
          : { fill: '#fff', fillOpacity: 0.92, borderRadius: 4 },
        data: { kind: 'spouse', rootPair: isRoot },
      });
    }

    // Succession → LEFT (account transferred to a non-spouse member)
    if (succession && !seen.has(succession.id)) {
      seen.add(succession.id);
      nodes.push({
        id: succession.id, type: 'member',
        data: { member: succession, isSuccessor: true, onPick },
        position: { x: 0, y: 0 },
      });
      edges.push({
        id: `e-succ-${m.id}-${succession.id}`,
        source: m.id, target: succession.id,
        type: 'straight',
        label: 'A/C transferred',
        style: { stroke: '#F59E0B', strokeWidth: 1.5, strokeDasharray: '5 3' },
        labelStyle: { fontSize: 8.5, fill: '#92400e', fontWeight: 600 },
        labelBgStyle: { fill: '#fffbeb', fillOpacity: 0.95, borderRadius: 4 },
        data: { kind: 'succession' },
      });
      addSlots(succession, new Set(), false);
    }

    addSlots(m, childIds, isRoot, spouse?.id);
    if (spouse) addSlots(spouse, childIds, isRoot);
    children.forEach(child => traverse(child, m.id));
  }

  traverse(rootMember, undefined, true);
  return { nodes, edges };
}

// ── Layout ────────────────────────────────────────────────────────────────────
//
// v2 strategy — ONE dagre pass owns all horizontal spacing:
//   • Only the beside CARDS (spouse / successor) are excluded from dagre.
//     Their slot subtrees stay IN the main graph, with the slot edges'
//     source remapped onto the anchor. So dagre knows the true width of
//     every slot under every couple and spaces sibling subtrees correctly —
//     no more independent mini-layouts drifting into each other.
//   • Anchors reserve width only for the beside card itself (+gap).
//   • After dagre: each owner's slot group is re-centered under its own card,
//     with the shift CLAMPED against every neighbouring box so re-centering
//     can never create an overlap. Big data stays collision-free by
//     construction instead of by patch-sweeps.

export function applyLayout(nodes: Node[], edges: Edge[]): { nodes: Node[]; edges: Edge[] } {
  const nodeById = new Map(nodes.map(n => [n.id, n]));

  // 1. beside cards (spouse right / successor left)
  const besideInfo = new Map<string, { anchorId: string; side: 'left' | 'right'; gap: number }>();
  edges.forEach(e => {
    const k = edgeKind(e);
    if (k === 'succession') besideInfo.set(e.target, { anchorId: e.source, side: 'left',  gap: BESIDE_GAP });
    else if (k === 'spouse') besideInfo.set(e.target, { anchorId: e.source, side: 'right', gap: BESIDE_GAP });
  });
  const besideIds = new Set(besideInfo.keys());
  const anchorOf  = (id: string) => besideInfo.get(id)?.anchorId ?? id;

  // slot adjacency from the ORIGINAL edges (owner may be a beside card)
  const slotKids = new Map<string, string[]>();
  edges.forEach(e => {
    if (nodeById.get(e.target)?.type !== 'slot') return;
    const arr = slotKids.get(e.source) ?? [];
    arr.push(e.target);
    slotKids.set(e.source, arr);
  });
  const slotSubtree = (ownerId: string): string[] => {
    const out: string[] = [];
    const q = [...(slotKids.get(ownerId) ?? [])];
    while (q.length) {
      const c = q.shift()!;
      out.push(c);
      q.push(...(slotKids.get(c) ?? []));
    }
    return out;
  };

  // 2. width reserved on anchors: just the beside card + gap
  const grpLeft  = new Map<string, number>();
  const grpRight = new Map<string, number>();
  besideInfo.forEach(({ anchorId, side, gap }) => {
    const w = nodeW('member') + gap;
    if (side === 'left') grpLeft.set(anchorId,  (grpLeft.get(anchorId)  ?? 0) + w);
    else                 grpRight.set(anchorId, (grpRight.get(anchorId) ?? 0) + w);
  });

  // 3. single main dagre pass
  const g = new Graph();
  g.setDefaultEdgeLabel(() => ({ minlen: 1, weight: 1 }));
  g.setGraph({ rankdir: 'TB', ranksep: RANK_SEP, nodesep: NODE_SEP, marginx: 56, marginy: 56 });

  const mainNodes = nodes.filter(n => !besideIds.has(n.id));
  const mainIds   = new Set(mainNodes.map(n => n.id));

  mainNodes.forEach(n => {
    const k = kindOfNode(n);
    g.setNode(n.id, {
      width:  (grpLeft.get(n.id) ?? 0) + nodeW(k) + (grpRight.get(n.id) ?? 0),
      height: nodeH(k),
    });
  });

  edges.forEach(e => {
    const k = edgeKind(e);
    if (k === 'spouse' || k === 'succession') return;
    const src = anchorOf(e.source); // beside card's slot edges hang from the anchor in dagre
    if (!mainIds.has(src) || !mainIds.has(e.target)) return;
    if (k === 'slot-top') g.setEdge(e.target, src, { minlen: 1, weight: 1 });
    else                  g.setEdge(src, e.target, { minlen: 1, weight: 1 });
  });

  layout(g);

  const posMap = new Map<string, { x: number; y: number }>();
  mainNodes.forEach(n => {
    const k   = kindOfNode(n);
    const pos = g.node(n.id);
    const lW  = grpLeft.get(n.id)  ?? 0;
    const rW  = grpRight.get(n.id) ?? 0;
    posMap.set(n.id, { x: pos.x - (lW + nodeW(k) + rW) / 2 + lW, y: pos.y - nodeH(k) / 2 });
  });

  // 4. seat the beside cards next to their anchors
  besideInfo.forEach(({ anchorId, side, gap }, bid) => {
    const aPos = posMap.get(anchorId);
    if (!aPos) return;
    const x = side === 'left'
      ? aPos.x - gap - nodeW('member')
      : aPos.x + nodeW('member') + gap;
    posMap.set(bid, { x, y: aPos.y });
  });

  // helpers over current positions
  const boxOf = (id: string) => {
    const p = posMap.get(id)!;
    const k = kindOfNode(nodeById.get(id));
    return { minX: p.x, maxX: p.x + nodeW(k), minY: p.y, maxY: p.y + nodeH(k) };
  };
  const shiftIds = (ids: string[], dx: number) =>
    ids.forEach(id => { const p = posMap.get(id); if (p) posMap.set(id, { x: p.x + dx, y: p.y }); });

  // 4.5 global slot-group ordering & packing — dagre received the beside
  // cards' slot edges remapped onto anchors, so it spaced the combined slot
  // set correctly but in an ARBITRARY order: it may interleave DIFFERENT
  // anchors' groups (e.g. a beside-spouse's slots drifting into a sibling's
  // column). Fix globally: (a) drop every owner's group at its ideal spot,
  // centered under its own card; (b) sweep left→right in that ideal order,
  // pushing each group right just enough (per shared row) to clear everything
  // placed before it, hopping over immovable member-card "walls" on the way.
  const groupBox = (ids: string[]) => {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    ids.forEach(id => {
      const b = boxOf(id);
      minX = Math.min(minX, b.minX); maxX = Math.max(maxX, b.maxX);
      minY = Math.min(minY, b.minY); maxY = Math.max(maxY, b.maxY);
    });
    return { minX, maxX, minY, maxY, w: maxX - minX };
  };
  {
    type Rect = { minX: number; maxX: number; minY: number; maxY: number };
    const yOverlap = (a: Rect, b: Rect) => a.minY < b.maxY - 0.5 && b.minY < a.maxY - 0.5;

    // one group per owner card that has slots
    const groups = nodes
      .filter(n => n.type === 'member' && posMap.has(n.id))
      .map(n => ({ ownerId: n.id, ids: slotSubtree(n.id).filter(id => posMap.has(id)) }))
      .filter(gr => gr.ids.length > 0);

    // (a) ideal: center each group under its owner (collisions resolved in b)
    groups.forEach(gr => {
      const b = groupBox(gr.ids);
      const oPos = posMap.get(gr.ownerId)!;
      const shift = oPos.x + nodeW('member') / 2 - (b.minX + b.maxX) / 2;
      if (Math.abs(shift) > 0.5) shiftIds(gr.ids, shift);
    });

    // walls: member cards that share rows with any slot (bioMode mixes them)
    const slotRows: Rect[] = nodes
      .filter(n => n.type === 'slot' && posMap.has(n.id))
      .map(n => boxOf(n.id));
    const walls: Rect[] = nodes
      .filter(n => n.type === 'member' && posMap.has(n.id))
      .map(n => boxOf(n.id))
      .filter(w => slotRows.some(srb => yOverlap(w, srb)));

    // (b) sweep in ideal left→right order
    const placed: Rect[] = [];
    [...groups]
      .sort((a, b) => groupBox(a.ids).minX - groupBox(b.ids).minX)
      .forEach(gr => {
        const memberBoxes = gr.ids.map(id => boxOf(id));
        // clear everything already placed (they belong to our left)
        let shift = 0;
        placed.forEach(r => memberBoxes.forEach(gb => {
          if (!yOverlap(r, gb)) return;
          shift = Math.max(shift, r.maxX + NODE_SEP - gb.minX);
        }));
        // hop over any wall the shifted group would land on
        for (let guard = 0; guard < 8; guard++) {
          let bumped = false;
          walls.forEach(w => memberBoxes.forEach(gb => {
            if (!yOverlap(w, gb)) return;
            const gMin = gb.minX + shift, gMax = gb.maxX + shift;
            if (gMin < w.maxX && gMax > w.minX) {
              shift = w.maxX + NODE_SEP - gb.minX;
              bumped = true;
            }
          }));
          if (!bumped) break;
        }
        if (shift > 0.5) shiftIds(gr.ids, shift);
        gr.ids.forEach(id => placed.push(boxOf(id)));
      });
  }

  // 5. re-center every owner's slot group under its own card — clamped so a
  // shift can never collide with anything else on the same rows. Two passes:
  // the first pass often frees room that lets the second get closer to center.
  const owners = nodes.filter(n => n.type === 'member' && (slotKids.get(n.id)?.length ?? 0) > 0);

  for (let pass = 0; pass < 2; pass++) {
    owners.forEach(owner => {
      const ids = slotSubtree(owner.id).filter(id => posMap.has(id));
      if (!ids.length) return;
      const oPos = posMap.get(owner.id);
      if (!oPos) return;

      const idSet = new Set(ids);
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      ids.forEach(id => {
        const b = boxOf(id);
        minX = Math.min(minX, b.minX); maxX = Math.max(maxX, b.maxX);
        minY = Math.min(minY, b.minY); maxY = Math.max(maxY, b.maxY);
      });

      const ownerCenter = oPos.x + nodeW('member') / 2;
      let desired = ownerCenter - (minX + maxX) / 2;
      if (Math.abs(desired) < 1) return;

      // clamp per group-member (not per group-bbox): an obstacle sitting
      // INSIDE the group's x-span at a deeper rank (e.g. someone else's
      // nested slot between two of ours) must also constrain the shift
      const memberBoxes = ids.map(id => boxOf(id));
      nodes.forEach(other => {
        if (idSet.has(other.id) || !posMap.has(other.id)) return;
        const b = boxOf(other.id);
        memberBoxes.forEach(gb => {
          if (b.maxY <= gb.minY || b.minY >= gb.maxY) return; // no row overlap
          if (desired > 0 && b.minX >= gb.maxX) {
            desired = Math.min(desired, Math.max(0, b.minX - GROUP_GAP - gb.maxX));
          } else if (desired < 0 && b.maxX <= gb.minX) {
            desired = Math.max(desired, Math.min(0, b.maxX + GROUP_GAP - gb.minX));
          }
        });
      });

      if (Math.abs(desired) >= 1) shiftIds(ids, desired);
    });
  }

  // 5.5 final safety sweep — after reflow + recentering, walk every slot row
  // left→right and nudge any residual same-row collision clear. With the
  // rank-aware steps above this rarely fires, but it guarantees the
  // zero-overlap invariant no matter what the data throws at us.
  {
    const rows = new Map<number, string[]>();
    nodes.forEach(n => {
      if (n.type !== 'slot' || !posMap.has(n.id)) return;
      const key = Math.round(posMap.get(n.id)!.y / 10) * 10;
      const arr = rows.get(key) ?? [];
      arr.push(n.id);
      rows.set(key, arr);
    });
    rows.forEach(ids => {
      const sorted = ids
        .map(id => ({ id, x: posMap.get(id)!.x }))
        .sort((a, b) => a.x - b.x);
      for (let i = 1; i < sorted.length; i++) {
        const prev = sorted[i - 1];
        const cur  = sorted[i];
        const minX = prev.x + nodeW('slot') + NODE_SEP;
        if (cur.x < minX) {
          cur.x = minX;
          posMap.set(cur.id, { x: cur.x, y: posMap.get(cur.id)!.y });
        }
      }
    });
  }

  // 6. root-couple children union point: branch shared children off the
  // midpoint of the spousal line instead of hanging them off one parent.
  const rootSpouseEdge = edges.find(e => {
    const d = e.data as EdgeData | undefined;
    return d?.kind === 'spouse' && d.rootPair === true;
  });
  let unionId = '';
  let unionPos: { x: number; y: number } | null = null;
  let unionLabelOffsetY = 40;
  const redirectToUnion = new Set<string>();
  // traverse pushes the root member first, so the first member node is the root
  const rootNode = nodes.find(n => n.type === 'member');
  if (rootNode) {
    const rootId  = rootNode.id;
    const rootPos = posMap.get(rootId);
    const rootChildEdges = edges.filter(e => e.id.startsWith(`e-child-${rootId}-`));
    if (rootPos && rootChildEdges.length) {
      const spousePos =
        rootSpouseEdge && rootSpouseEdge.source === rootId
          ? posMap.get(rootSpouseEdge.target)
          : undefined;
      if (spousePos) {
        // couple: branch off the midpoint of the spousal line
        const rootCenterX   = rootPos.x   + nodeW('member') / 2;
        const spouseCenterX = spousePos.x + nodeW('member') / 2;
        unionPos = { x: (rootCenterX + spouseCenterX) / 2, y: rootPos.y + nodeH('member') / 2 };
      } else {
        // single root parent: drop the same labeled stem straight from the
        // card's bottom handle, so the "Children" caption shows here too
        unionPos = { x: rootPos.x + nodeW('member') / 2, y: rootPos.y + nodeH('member') };
      }
      unionId = `union-${rootId}`;
      posMap.set(unionId, unionPos);
      const childY = posMap.get(rootChildEdges[0].target)?.y;
      if (childY !== undefined) unionLabelOffsetY = (childY - unionPos.y) * 0.4;
      rootChildEdges.forEach(e => redirectToUnion.add(e.id));
    }
  }

  // 7. assemble — no per-node style.width: the node container hugs the card,
  // so left/right handle dots sit ON the card border instead of floating.
  const finalNodes = nodes.map(n => ({ ...n, position: posMap.get(n.id) ?? { x: 0, y: 0 } }));
  if (unionPos) {
    finalNodes.push({
      id: unionId, type: 'union',
      data: { labelOffsetY: unionLabelOffsetY },
      position: unionPos,
      style: { width: 1, height: 1 },
    });
  }

  const resolvedEdges = edges.map(e => {
    if (redirectToUnion.has(e.id)) return { ...e, source: unionId, sourceHandle: 'bottom' };
    const k = edgeKind(e);
    if (k !== 'spouse' && k !== 'succession') return e;
    const sp = posMap.get(e.source);
    const tp = posMap.get(e.target);
    if (!sp || !tp) return e;
    const toRight = tp.x >= sp.x;
    return {
      ...e,
      sourceHandle: toRight ? 'right-out' : 'left-out',
      targetHandle: toRight ? 'left-in'  : 'right-in',
    };
  });

  return { nodes: finalNodes, edges: resolvedEdges };
}