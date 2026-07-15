
// ─────────────────────────────────────────────────────────────────────────────

import { Graph, layout } from '@dagrejs/dagre';
import type { Node, Edge } from 'reactflow';
import type { Member } from '@/lib/types';

// ── Constants ─────────────────────────────────────────────────────────────────
export const CONN_COLOR = '#CBD5E1';


export const photoOf = (m: Member): string | undefined =>
  m.photoUrl || undefined;

// A synthetic id (e.g. "PENDING-PS-90-spouse") for someone with no real club
// A/C yet.
export const isPendingAcno = (id: string): boolean => id.startsWith('PENDING-');

// Shown in the id badge instead of the raw internal placeholder string.
export const displayAcno = (id: string): string =>
  isPendingAcno(id) ? 'No A/C' : id;

// Two-tier sizing: one size for ALL member cards (incl. successors), one size
// for ALL slot cards (incl. nested). Same width keeps columns aligned.
export const CARD_W = 325;
export const CARD_H = 400;
export const SLOT_W = 310;
export const SLOT_H = 290;

// CARD_H above is deliberately padded well past the common-case rendered
// card height, so dagre never lets a rank overlap a tall (2-line name +
// Deceased tag) card. That padding is wrong to reuse for a *visual* anchor
// though — e.g. the single-parent "Children" stem used to drop the full
// CARD_H below the card top, landing ~70px past where the card actually
// ends. This tracks the common-case rendered height instead.
export const CARD_VISUAL_H = 345;

// Wide enough to fit the longest connector label ("Spouse · A/C
// transferred", ~25 chars at 16px/800 weight) without spilling into
// either neighboring card.
export const BESIDE_GAP = 260;
export const GROUP_GAP  = 60;
export const RANK_SEP   = 220;
export const NODE_SEP   = 42;


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


export function isBesideSpouse(sp: Member, holder: Member): boolean {
  if (sp.via === 'core' || sp.via === 'succession') return true; // own membership → beside
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

type EdgeData = { kind?: 'spouse' | 'succession'; rootPair?: boolean };
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

  // All slots hanging off `owner`'s quota, always seated below the owner —
  // besideSpouseId = the one spouse already seated beside — excluded here
  // so she isn't rendered twice. rootLevel picks a distinct connector color
  // for the tree's main member (and their beside spouse) only, so their
  // direct A4D/Associate dependents read differently from every deeper
  // (second-layer-and-below) owner's dependents, which keep the usual
  // role-colored (purple/orange) lines.
  function addSlots(owner: Member, bioChildIds: Set<string>, besideSpouseId?: string, rootLevel = false) {
    const slots = members.filter(x =>
      x.pid === owner.id &&
      x.via !== 'core' && x.via !== 'succession' &&
      x.id !== besideSpouseId &&
      !bioChildIds.has(x.id) &&
      // in bioMode anyone with known blood parents renders inside the tree
      // as a full card instead — never double-render them as a slot too
      !(bioMode && (x.fatherId != null || x.motherId != null)) &&
      !seen.has(x.id) && !seen.has(slotNodeId(x.id))
    );

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
        // rootLevel dependents branch off an offset handle instead of dead
        // center, so their line doesn't run down the same column as the
        // "Children" stem (also centered) before the two diverge.
        sourceHandle: rootLevel ? 'bottom-slots' : 'bottom', targetHandle: 'top',
        type: 'smoothstep',
        style: rootLevel
          ? { stroke: '#2563EB99', strokeWidth: 3.5, strokeDasharray: '6 3' }
          : { stroke: role === 'A4D' ? '#9333ea77' : '#ea580c77', strokeWidth: 3.5, strokeDasharray: '6 3' },
      });

      // nested slots (a slot member granting further quota/associate access)
      members.filter(x => x.pid === slot.id && x.via !== 'core' && x.via !== 'succession').forEach(sub => {
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
          sourceHandle: 'bottom', targetHandle: 'top',
          type: 'smoothstep',
          style: { stroke: '#94A3B8', strokeWidth: 2.5, strokeDasharray: '5 3' },
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
        style: { stroke: '#94A3B8', strokeWidth: 3.5 },
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
          ? { stroke: '#F59E0B', strokeWidth: 3.5, strokeDasharray: '6 3' }
          : { stroke: '#9CA3AF', strokeWidth: 3.5 },
        labelStyle: isTransferToSpouse
          ? { fontSize: 16, fill: '#92400e', fontWeight: 800 }
          : { fontSize: 16, fill: '#374151', fontWeight: 800 },
        labelBgStyle: isTransferToSpouse
          ? { fill: '#fef3c7', fillOpacity: 1, borderRadius: 7 }
          : { fill: '#E5E7EB', fillOpacity: 1, borderRadius: 7 },
        labelBgPadding: [10, 6],
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
        style: { stroke: '#F59E0B', strokeWidth: 3.5, strokeDasharray: '6 3' },
        labelStyle: { fontSize: 16, fill: '#92400e', fontWeight: 800 },
        labelBgStyle: { fill: '#fef3c7', fillOpacity: 1, borderRadius: 7 },
        labelBgPadding: [10, 6],
        data: { kind: 'succession' },
      });
      addSlots(succession, new Set());
    }

    addSlots(m, childIds, spouse?.id, isRoot);
    if (spouse) addSlots(spouse, childIds, undefined, isRoot);
    children.forEach(child => traverse(child, m.id));
  }

  traverse(rootMember, undefined, true);
  return { nodes, edges };
}

// ── Layout ────────────────────────────────────────────────────────────────────


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
    g.setEdge(src, e.target, { minlen: 1, weight: 1 });
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
      const shift = oPos.x + CARD_W / 2 - (b.minX + b.maxX) / 2;
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

      const ownerCenter = oPos.x + CARD_W / 2;
      let desired = ownerCenter - (minX + maxX) / 2;
      if (Math.abs(desired) < 1) return;

  
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
        const rootCenterX   = rootPos.x   + CARD_W / 2;
        const spouseCenterX = spousePos.x + CARD_W / 2;
        unionPos = { x: (rootCenterX + spouseCenterX) / 2, y: rootPos.y + CARD_VISUAL_H / 2 };
      } else {
        // single root parent: drop the same labeled stem straight from the
        // card's bottom handle, so the "Children" caption shows here too.
        // CARD_W/CARD_VISUAL_H (not nodeW/CARD_H, which are padded for
        // dagre's collision math) so this actually lines up with the card's
        // real rendered center and bottom edge instead of drifting ~10px
        // right and ~70px past it.
        unionPos = { x: rootPos.x + CARD_W / 2, y: rootPos.y + CARD_VISUAL_H };
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