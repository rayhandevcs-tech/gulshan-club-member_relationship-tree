'use client';

import { useMemo, useState } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  Background,
  Controls,
  Handle,
  Position,
  Node,
  Edge,
  NodeTypes,
  NodeMouseHandler,
} from 'reactflow';
import { Graph, layout } from '@dagrejs/dagre';
import { TYPE_CONFIG, getInitials } from '@/lib/memberUtils';
import type { Member } from '@/lib/types';

// ── Constants ──────────────────────────────────────────────────────────────────
const CONN_COLOR = '#CBD5E1';
const MEMBER_W   = 150;   // card render width
const MEMBER_H   = 140;   // extra room for a full (wrapped, up to 2-line) name
const SUCC_W     = 126;
const SUCC_H     = 120;
const SLOT_W     = 160;
const SLOT_H     = 108;
const SLOT_SM_W  = 124;
const SLOT_SM_H  = 92;
const BESIDE_GAP = 100;    // gap between beside node cards (spouse / succession)
const ROOT_BESIDE_GAP = 800; // gap between the root couple specifically — wider so their above-placed slot clusters clear each other
const TOP_SLOT_GAP = 64;  // min gap between the two root-couple's above-placed slot clusters

// ── Helpers ────────────────────────────────────────────────────────────────────
const isDead   = (m: Member) => m.name.toLowerCase().startsWith('late ');
const dispName = (m: Member) => isDead(m) ? m.name.replace(/^late\s+/i, '') : m.name;

function cardColors(m: Member) {
  if (isDead(m)) return { border: '#F59E0B', avatarBg: '#D97706', cardBg: '#FFFBEB' };
  const c = TYPE_CONFIG[m.type] ?? TYPE_CONFIG.Permanent;
  return { border: c.color, avatarBg: c.color, cardBg: '#FFFFFF' };
}

// A4D/Associate are the only types that represent a slot *derived from*
// someone else's quota. Anything else (Life, Donor, Permanent, Corporate,
// Honorary, Foreign...) is an independently-held membership, so that spouse
// renders beside their partner instead of as a dependent slot underneath.
const DEPENDENT_TYPES = new Set(['A4D', 'Associate']);

function isBesideSpouse(spouseId: string, memberId: string, members: Member[]): boolean {
  const sp = members.find(x => x.id === spouseId);
  if (!sp) return false;
  if (!DEPENDENT_TYPES.has(sp.type)) return true;
  return members.find(x => x.id === memberId)?.succession === spouseId;
}

function getBioChildren(m: Member, spouse: Member | null, members: Member[], bioMode: boolean): Member[] {
  const ids = new Set([m.id, ...(spouse ? [spouse.id] : [])]);
  if (bioMode) {
    return members.filter(x => {
      if (ids.has(x.id)) return false;
      return (
        (x.fatherId != null && ids.has(x.fatherId)) ||
        (x.motherId != null && ids.has(x.motherId)) ||
        (x.rel === 'child' && ids.has(x.pid ?? ''))
      );
    });
  }
  return members.filter(x => x.rel === 'child' && (x.pid === m.id || (spouse && x.pid === spouse.id)));
}

function findRoot(startId: string, members: Member[]): string {
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

function getRef(slot: Member, listingMember: Member): string | undefined {
  if (slot.rel === 'spouse') return `Spouse of ${listingMember.id}`;
  const fid = slot.fatherId;
  const mid = slot.motherId;
  if (!fid && !mid) return undefined;
  const parentId = fid === listingMember.id ? fid
                 : mid === listingMember.id ? mid
                 : fid ?? mid;
  const label = slot.gender === 'M' ? 'Son' : slot.gender === 'F' ? 'Daughter' : 'Child';
  return `${label} of ${parentId}`;
}

// dagre allocation widths (slightly wider than render width for spacing)
function nodeW(type: 'member' | 'slot', isSuccessor?: boolean, small?: boolean): number {
  if (type === 'slot') return (small ? SLOT_SM_W : SLOT_W) + 8;
  return (isSuccessor ? SUCC_W : MEMBER_W) + 20;
}
function nodeH(type: 'member' | 'slot', isSuccessor?: boolean, small?: boolean): number {
  if (type === 'slot') return small ? SLOT_SM_H + 8 : SLOT_H + 8;
  return (isSuccessor ? SUCC_H : MEMBER_H) + 10;
}

// ── Node components ────────────────────────────────────────────────────────────

interface MemberNodeData {
  member: Member;
  isSuccessor?: boolean;
  transferToSpouse?: boolean;
  onPick: (id: string) => void;
}

function MemberNodeComp({ data }: { data: MemberNodeData }) {
  const { member: m, isSuccessor, transferToSpouse, onPick } = data;
  const [hovered, setHovered] = useState(false);
  const { border, avatarBg, cardBg } = cardColors(m);
  const name     = dispName(m);
  const w        = isSuccessor ? SUCC_W : MEMBER_W;
  const avatarSz = isSuccessor ? 36 : 44;
  const fontSize = isSuccessor ? 9.5 : 11.5;
  const bg       = isSuccessor ? '#fffbeb' : cardBg;

  return (
    <div style={{ position: 'relative' }}>
      <Handle id="top"       type="target" position={Position.Top}    isConnectable={false} style={{ background: CONN_COLOR, width: 8, height: 8, border: 'none' }} />
      <Handle id="top-out"   type="source" position={Position.Top}    isConnectable={false} style={{ background: CONN_COLOR, width: 8, height: 8, border: 'none' }} />
      <Handle id="left-in"   type="target" position={Position.Left}   isConnectable={false} style={{ background: CONN_COLOR, width: 8, height: 8, border: 'none' }} />
      <Handle id="right-in"  type="target" position={Position.Right}  isConnectable={false} style={{ background: CONN_COLOR, width: 8, height: 8, border: 'none' }} />
      <Handle id="bottom"    type="source" position={Position.Bottom} isConnectable={false} style={{ background: CONN_COLOR, width: 8, height: 8, border: 'none' }} />
      <Handle id="left-out"  type="source" position={Position.Left}   isConnectable={false} style={{ background: CONN_COLOR, width: 8, height: 8, border: 'none' }} />
      <Handle id="right-out" type="source" position={Position.Right}  isConnectable={false} style={{ background: CONN_COLOR, width: 8, height: 8, border: 'none' }} />

      <button
        onClick={e => { e.stopPropagation(); onPick(m.id); }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          border: `2px solid ${border}`, borderRadius: 16, background: bg,
          padding: isSuccessor ? '10px 12px' : '13px 16px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
          cursor: 'pointer', width: w,
          boxShadow: hovered ? '0 6px 16px rgba(0,0,0,0.16)' : '0 2px 6px rgba(0,0,0,0.08)',
          transform: hovered ? 'translateY(-2px)' : 'none',
          transition: 'box-shadow 150ms ease, transform 150ms ease, border-color 150ms ease',
          opacity: isSuccessor ? 0.9 : 1,
        }}
      >
        <div style={{
          width: avatarSz, height: avatarSz, borderRadius: '50%', backgroundColor: avatarBg,
          backgroundImage: m.photoUrl ? `url(${m.photoUrl})` : undefined,
          backgroundSize: 'cover', backgroundPosition: 'center',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: isSuccessor ? 12 : 14, fontWeight: 700, color: '#fff', flexShrink: 0,
        }}>
          {!m.photoUrl && getInitials(name)}
        </div>
        <div style={{ fontSize, fontWeight: 600, color: '#111827', textAlign: 'center', lineHeight: 1.3, width: w - 28, overflowWrap: 'break-word' }}>
          {name}
        </div>
        <div style={{
          fontSize: isSuccessor ? 8 : 9.5, fontWeight: 700, fontFamily: 'monospace', letterSpacing: '0.02em',
          color: border, background: `${border}1a`, padding: '1px 7px', borderRadius: 999,
        }}>{m.id}</div>
        {isDead(m) && (
          <span style={{ fontSize: 7.5, fontWeight: 600, color: '#92400e', background: '#fef3c7', padding: '1px 7px', borderRadius: 999 }}>
            Deceased
          </span>
        )}
        {transferToSpouse && (
          <span style={{ fontSize: 7.5, fontWeight: 600, color: '#92400e', background: '#fffbeb', border: '1px solid #fde68a', padding: '2px 7px', borderRadius: 999, whiteSpace: 'nowrap' }}>
            A/C transferred →
          </span>
        )}
      </button>
    </div>
  );
}

interface SlotNodeData {
  member: Member;
  role: 'A4D' | 'Assoc';
  small?: boolean;
  reference?: string;
  onPick: (id: string) => void;
}

function SlotNodeComp({ data }: { data: SlotNodeData }) {
  const { member: m, role, small, reference, onPick } = data;
  const [hovered, setHovered] = useState(false);
  const { border, avatarBg, cardBg } = cardColors(m);
  const name      = dispName(m);
  const roleColor = role === 'A4D' ? '#7c3aed' : '#c2410c';
  const roleBg    = role === 'A4D' ? '#f3e8ff' : '#ffedd5';
  const w         = small ? SLOT_SM_W : SLOT_W;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '3px 0' }}>
      <Handle id="top"       type="target" position={Position.Top}    isConnectable={false} style={{ background: CONN_COLOR, width: 7, height: 7, border: 'none' }} />
      <Handle id="bottom"    type="source" position={Position.Bottom} isConnectable={false} style={{ background: CONN_COLOR, width: 7, height: 7, border: 'none' }} />
      <Handle id="top-out"   type="source" position={Position.Top}    isConnectable={false} style={{ background: CONN_COLOR, width: 7, height: 7, border: 'none' }} />
      <Handle id="bottom-in" type="target" position={Position.Bottom} isConnectable={false} style={{ background: CONN_COLOR, width: 7, height: 7, border: 'none' }} />

      <div style={{ fontSize: 7.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '2px 8px', borderRadius: 999, background: roleBg, color: roleColor }}>
        {role}
      </div>

      <button
        onClick={e => { e.stopPropagation(); onPick(m.id); }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          border: `2px solid ${border}`, borderRadius: 11, background: cardBg,
          padding: small ? '5px 7px' : '7px 10px',
          display: 'flex', flexDirection: 'column', gap: 4,
          cursor: 'pointer', width: w, textAlign: 'left',
          boxShadow: hovered ? '0 4px 10px rgba(0,0,0,0.14)' : '0 1px 3px rgba(0,0,0,0.06)',
          transform: hovered ? 'translateY(-1px)' : 'none',
          transition: 'box-shadow 150ms ease, transform 150ms ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <div style={{
            width: small ? 20 : 26, height: small ? 20 : 26, borderRadius: '50%', backgroundColor: avatarBg,
            backgroundImage: m.photoUrl ? `url(${m.photoUrl})` : undefined,
            backgroundSize: 'cover', backgroundPosition: 'center',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: small ? 7 : 8, fontWeight: 700, color: '#fff', flexShrink: 0,
          }}>
            {!m.photoUrl && getInitials(name)}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: small ? 7.5 : 9, fontWeight: 600, color: '#111827', lineHeight: 1.3, overflowWrap: 'break-word' }}>
              {name}
            </div>
            <div style={{
              display: 'inline-block', marginTop: 1, fontSize: small ? 6.5 : 7.5, fontWeight: 700, fontFamily: 'monospace',
              color: border, background: `${border}1a`, padding: '0 5px', borderRadius: 999,
            }}>{m.id}</div>
          </div>
        </div>
        {reference && (
          <div style={{ fontSize: 7.5, color: '#6B7280', fontStyle: 'italic', paddingLeft: small ? 27 : 33, lineHeight: 1.3 }}>
            {reference}
          </div>
        )}
      </button>
    </div>
  );
}

// Invisible anchor placed at the midpoint of the root couple's spousal line,
// so their shared children's connector can branch from "both of them"
// instead of visually hanging off just one parent.
function UnionNodeComp({ data }: { data: { labelOffsetY?: number } }) {
  return (
    <div style={{ width: 1, height: 1, position: 'relative' }}>
      <Handle id="bottom" type="source" position={Position.Bottom} isConnectable={false} style={{ width: 1, height: 1, opacity: 0 }} />
      <span style={{
        position: 'absolute', top: data.labelOffsetY ?? 40, left: 8, whiteSpace: 'nowrap',
        fontSize: 8.5, fontWeight: 500, color: '#9CA3AF',
        background: '#fff', padding: '1px 5px', borderRadius: 4,
      }}>
        Children
      </span>
    </div>
  );
}

const nodeTypes: NodeTypes = { member: MemberNodeComp, slot: SlotNodeComp, union: UnionNodeComp };

// ── Graph builder ──────────────────────────────────────────────────────────────

function buildGraph(
  rootMember: Member,
  members: Member[],
  onPick: (id: string) => void,
  bioMode: boolean,
) {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const seen = new Set<string>();

  // placeAbove: true only for the root couple (LM-40/LS-40-style top positions) —
  // their A4D/Associate slots render above the member instead of below, per request.
  // Every other member's slots keep the normal below-member placement.
  // besideSpouseId: the ONE spouse row (if any) already rendered beside this
  // member — every other spouse row falls through to a slot here regardless
  // of its own type, since only one partner fits in the beside seat.
  function addSlots(member: Member, bioChildIds: Set<string>, placeAbove: boolean, besideSpouseId?: string) {
    const a4d = members.filter(x =>
      x.pid === member.id &&
      (x.rel === 'a4d' || (x.rel === 'spouse' && x.id !== besideSpouseId)) &&
      !bioChildIds.has(x.id)
    );
    const assoc = members.filter(x =>
      x.pid === member.id &&
      (x.rel === 'associate' || x.rel === 'nominee') &&
      !bioChildIds.has(x.id)
    );

    const parentSourceHandle = placeAbove ? 'top-out'   : 'bottom';
    const parentTargetHandle = placeAbove ? 'bottom-in' : 'top';
    const childSourceHandle  = placeAbove ? 'top-out'   : 'bottom';
    const childTargetHandle  = placeAbove ? 'bottom-in' : 'top';
    const edgeKind           = placeAbove ? 'slot-top' : undefined;

    [...a4d.map(s => ({ s, role: 'A4D' as const })), ...assoc.map(s => ({ s, role: 'Assoc' as const }))].forEach(({ s: slot, role }) => {
      const sid = `slot-${slot.id}`;
      if (seen.has(sid)) return;
      seen.add(sid);

      nodes.push({
        id: sid, type: 'slot',
        data: { member: slot, role, reference: getRef(slot, member), onPick },
        position: { x: 0, y: 0 },
        style: { width: nodeW('slot') },
      });
      edges.push({
        id: `e-${member.id}-${sid}`,
        source: member.id, target: sid,
        sourceHandle: parentSourceHandle, targetHandle: parentTargetHandle,
        type: 'smoothstep',
        style: { stroke: role === 'A4D' ? '#9333ea55' : '#ea580c55', strokeWidth: 1.5, strokeDasharray: '5 3' },
        data: { kind: edgeKind },
      });

      members.filter(x =>
        x.pid === slot.id && (x.rel === 'a4d' || x.rel === 'associate' || x.rel === 'nominee')
      ).forEach(sub => {
        const subId = `slot-${sub.id}`;
        if (seen.has(subId)) return;
        seen.add(subId);
        const subRole: 'A4D' | 'Assoc' = sub.rel === 'a4d' ? 'A4D' : 'Assoc';
        nodes.push({
          id: subId, type: 'slot',
          data: { member: sub, role: subRole, small: true, reference: getRef(sub, slot), onPick },
          position: { x: 0, y: 0 },
          style: { width: nodeW('slot', false, true) },
        });
        edges.push({
          id: `e-${sid}-${subId}`,
          source: sid, target: subId,
          sourceHandle: childSourceHandle, targetHandle: childTargetHandle,
          type: 'smoothstep',
          style: { stroke: '#CBD5E1', strokeWidth: 1, strokeDasharray: '4 2' },
          data: { kind: edgeKind },
        });
      });
    });
  }

  function traverse(m: Member, parentId?: string, isRoot = false) {
    if (seen.has(m.id)) return;
    seen.add(m.id);

    // A member can have more than one spouse record (e.g. one independently-
    // membered, one holding an A4D slot off this member's quota). Prefer the
    // independent one for the beside-card slot — any others fall through to
    // addSlots' own '(rel === spouse && !isBesideSpouse)' filter and render
    // as dependent slots below instead of being silently dropped.
    const spouseRows = members.filter(x => x.pid === m.id && x.rel === 'spouse');
    const spouse = spouseRows.find(x => isBesideSpouse(x.id, m.id, members)) ?? null;
    if (spouse) seen.add(spouse.id);

    const succNote           = m.succession;
    const isTransferToSpouse = !!(succNote && spouse && succNote === spouse.id);
    const succession         = (succNote && !isTransferToSpouse) ? (members.find(x => x.id === succNote) ?? null) : null;

    const children = getBioChildren(m, spouse, members, bioMode).filter(c => !seen.has(c.id));
    const childIds = new Set(children.map(c => c.id));

    nodes.push({
      id: m.id, type: 'member',
      data: { member: m, onPick },
      position: { x: 0, y: 0 },
      style: { width: nodeW('member') },
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

    // Spouse → RIGHT
    if (spouse) {
      nodes.push({
        id: spouse.id, type: 'member',
        data: { member: spouse, transferToSpouse: isTransferToSpouse, onPick },
        position: { x: 0, y: 0 },
        style: { width: nodeW('member') },
      });
      edges.push({
        id: `e-spouse-${m.id}-${spouse.id}`,
        source: m.id, target: spouse.id,
        type: 'straight',
        label: 'Spouse',
        style: { stroke: '#9CA3AF', strokeWidth: 1.5 },
        labelStyle: { fontSize: 8.5, fill: '#9CA3AF', fontWeight: 500 },
        labelBgStyle: { fill: '#fff', fillOpacity: 0.92, borderRadius: 4 },
        data: { kind: 'spouse', rootPair: isRoot },
      });
    }

    // Succession → LEFT
    if (succession && !seen.has(succession.id)) {
      seen.add(succession.id);
      nodes.push({
        id: succession.id, type: 'member',
        data: { member: succession, isSuccessor: true, onPick },
        position: { x: 0, y: 0 },
        style: { width: nodeW('member', true) },
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

// ── Layout ─────────────────────────────────────────────────────────────────────
//
// Strategy: beside nodes (spouse / succession) and their ENTIRE slot subtrees
// are excluded from the main dagre pass. Each beside node gets its own
// mini-dagre so its slots never mix ranks with the main tree.
// Main dagre only sees anchor members + their direct slot/child descendants.
// Beside column widths are derived from the mini-dagre total width so the
// main dagre reserves the correct horizontal space.

function applyLayout(nodes: Node[], edges: Edge[]): { nodes: Node[]; edges: Edge[] } {

  // 1. Identify beside nodes and the full subtree rooted at each
  const besideInfo = new Map<string, { anchorId: string; side: 'left' | 'right'; gap: number }>();
  edges.forEach(e => {
    const kind = (e.data as { kind?: string; rootPair?: boolean } | undefined)?.kind;
    const rootPair = (e.data as { kind?: string; rootPair?: boolean } | undefined)?.rootPair;
    if (kind === 'succession') besideInfo.set(e.target, { anchorId: e.source, side: 'left', gap: BESIDE_GAP });
    else if (kind === 'spouse') besideInfo.set(e.target, { anchorId: e.source, side: 'right', gap: rootPair ? ROOT_BESIDE_GAP : BESIDE_GAP });
  });

  const childrenOf = new Map<string, string[]>();
  edges.forEach(e => {
    const arr = childrenOf.get(e.source) ?? [];
    arr.push(e.target);
    childrenOf.set(e.source, arr);
  });

  function subtreeIds(id: string, vis = new Set<string>()): string[] {
    if (vis.has(id)) return [];
    vis.add(id);
    return [id, ...(childrenOf.get(id) ?? []).flatMap(c => subtreeIds(c, vis))];
  }

  const besideSubtrees = new Map<string, string[]>();
  besideInfo.forEach((_, bid) => besideSubtrees.set(bid, subtreeIds(bid)));
  const allBesideIds = new Set<string>();
  besideSubtrees.forEach(st => st.forEach(id => allBesideIds.add(id)));

  // 2. Run a mini-dagre for each beside subtree BEFORE the main dagre.
  //    Positions are stored relative to the beside card's top-left = (0,0).
  type MiniResult = { relPos: Map<string, {x:number; y:number}>; totalW: number; bNW: number; bNH: number };

  function buildMini(bid: string): MiniResult {
    const bNode = nodes.find(n => n.id === bid);
    const bNW = bNode ? nodeW('member', bNode.data?.isSuccessor as boolean) : MEMBER_W;
    const bNH = bNode ? nodeH('member', bNode.data?.isSuccessor as boolean) : MEMBER_H;
    const slotIds = (besideSubtrees.get(bid) ?? []).filter(id => id !== bid);

    if (slotIds.length === 0) return { relPos: new Map(), totalW: bNW, bNW, bNH };

    const mini = new Graph();
    mini.setDefaultEdgeLabel(() => ({ minlen: 1, weight: 1 }));
    mini.setGraph({ rankdir: 'TB', ranksep: 80, nodesep: 14, marginx: 0, marginy: 0 });
    mini.setNode(bid, { width: bNW, height: bNH });
    slotIds.forEach(sid => {
      const sn = nodes.find(n => n.id === sid);
      if (!sn) return;
      const sm = sn.data?.small as boolean;
      mini.setNode(sid, { width: nodeW('slot', false, sm), height: nodeH('slot', false, sm) });
    });
    edges.forEach(e2 => {
      const inSub = (id: string) => id === bid || slotIds.includes(id);
      if (!inSub(e2.source) || !inSub(e2.target)) return;
      const kind = (e2.data as { kind?: string } | undefined)?.kind;
      if (kind === 'slot-top') mini.setEdge(e2.target, e2.source, { minlen: 1, weight: 1 });
      else mini.setEdge(e2.source, e2.target, { minlen: 1, weight: 1 });
    });
    layout(mini);

    const gi = mini.graph() as { width?: number };
    const totalW = Math.max(bNW, gi.width ?? bNW);

    // offset so beside card top-left maps to (0, 0)
    const rp = mini.node(bid);
    const offX = -(rp.x - bNW / 2);
    const offY = -(rp.y - bNH / 2);

    const relPos = new Map<string, {x:number; y:number}>();
    slotIds.forEach(sid => {
      const sn = nodes.find(n => n.id === sid);
      if (!sn) return;
      const sm = sn.data?.small as boolean;
      const sp = mini.node(sid);
      relPos.set(sid, {
        x: sp.x - nodeW('slot', false, sm) / 2 + offX,
        y: sp.y - nodeH('slot', false, sm) / 2 + offY,
      });
    });
    return { relPos, totalW, bNW, bNH };
  }

  const miniResults = new Map<string, MiniResult>();
  besideInfo.forEach((_, bid) => miniResults.set(bid, buildMini(bid)));

  // 3. Effective widths for anchor nodes use actual mini-dagre column widths
  const grpLeft  = new Map<string, number>();
  const grpRight = new Map<string, number>();
  besideInfo.forEach(({ anchorId, side, gap }, bid) => {
    const colW = miniResults.get(bid)?.totalW ?? MEMBER_W;
    if (side === 'left') grpLeft.set(anchorId,  (grpLeft.get(anchorId)  ?? 0) + colW + gap);
    else                 grpRight.set(anchorId, (grpRight.get(anchorId) ?? 0) + gap + colW);
  });

  // 4. Main dagre — only non-beside nodes
  const g = new Graph();
  g.setDefaultEdgeLabel(() => ({ minlen: 1, weight: 1 }));
  g.setGraph({ rankdir: 'TB', ranksep: 80, nodesep: 14, marginx: 56, marginy: 56 });

  const mainNodes = nodes.filter(n => !allBesideIds.has(n.id));
  const mainIds   = new Set(mainNodes.map(n => n.id));

  mainNodes.forEach(n => {
    const isSlot = n.type === 'slot';
    const small  = n.data?.small as boolean | undefined;
    const isSucc = n.data?.isSuccessor as boolean | undefined;
    const lW = grpLeft.get(n.id)  ?? 0;
    const rW = grpRight.get(n.id) ?? 0;
    g.setNode(n.id, {
      width:  lW + nodeW(isSlot ? 'slot' : 'member', isSucc, small) + rW,
      height: nodeH(isSlot ? 'slot' : 'member', isSucc, small),
    });
  });

  edges.forEach(e => {
    const kind = (e.data as { kind?: string } | undefined)?.kind;
    if (kind === 'spouse' || kind === 'succession') return;
    if (!mainIds.has(e.source) || !mainIds.has(e.target)) return;
    if (kind === 'slot-top') g.setEdge(e.target, e.source, { minlen: 1, weight: 1 });
    else g.setEdge(e.source, e.target, { minlen: 1, weight: 1 });
  });

  layout(g);

  const posMap = new Map<string, { x: number; y: number }>();
  mainNodes.forEach(n => {
    const pos    = g.node(n.id);
    const isSlot = n.type === 'slot';
    const small  = n.data?.small as boolean | undefined;
    const isSucc = n.data?.isSuccessor as boolean | undefined;
    const nW  = nodeW(isSlot ? 'slot' : 'member', isSucc, small);
    const nH  = nodeH(isSlot ? 'slot' : 'member', isSucc, small);
    const lW  = grpLeft.get(n.id)  ?? 0;
    const rW  = grpRight.get(n.id) ?? 0;
    posMap.set(n.id, { x: pos.x - (lW + nW + rW) / 2 + lW, y: pos.y - nH / 2 });
  });

  // 5. Place beside nodes + apply mini-dagre relative positions
  besideInfo.forEach(({ anchorId, side, gap }, bid) => {
    const aPos  = posMap.get(anchorId);
    const aNode = nodes.find(n => n.id === anchorId);
    const mr    = miniResults.get(bid);
    if (!aPos || !aNode || !mr) return;

    const aW = nodeW('member', aNode.data?.isSuccessor as boolean);
    const lW = grpLeft.get(anchorId) ?? 0;

    const bX = side === 'left' ? aPos.x - lW : aPos.x + aW + gap;
    const bY = aPos.y;
    posMap.set(bid, { x: bX, y: bY });

    mr.relPos.forEach((rel, sid) => posMap.set(sid, { x: bX + rel.x, y: bY + rel.y }));

    // Recenter the slot cluster under the beside card's own center — same as
    // how a regular main-dagre parent centers over its children — so the
    // connector fans out symmetrically instead of hanging off one edge.
    // (Any resulting collision with unrelated neighboring content is caught
    // by the general slot-rank overlap sweep further below.)
    const slotIds = [...mr.relPos.keys()];
    if (slotIds.length === 0) return;
    const widthOfSlot = (sid: string) => {
      const sn = nodes.find(n => n.id === sid);
      return nodeW('slot', false, sn?.data?.small as boolean);
    };
    const lefts  = slotIds.map(sid => posMap.get(sid)?.x ?? 0);
    const rights = slotIds.map(sid => (posMap.get(sid)?.x ?? 0) + widthOfSlot(sid));
    const clusterCenter = (Math.min(...lefts) + Math.max(...rights)) / 2;
    const anchorCenter  = bX + mr.bNW / 2;
    const recenterShift = anchorCenter - clusterCenter;
    slotIds.forEach(sid => { const p = posMap.get(sid); if (p) posMap.set(sid, { x: p.x + recenterShift, y: p.y }); });
  });

  // 6. Root-couple top-slot separation — LM's own above-placed slots and the
  // spouse's own above-placed slots are laid out through two independent dagre
  // passes (main dagre vs. mini-dagre), so neither knows about the other's
  // extent. Push the two clusters apart (LM-side left, spouse-side right)
  // until they clear a minimum gap.
  const topAnchorIds: string[] = [];
  edges.forEach(e => {
    const kind = (e.data as { kind?: string } | undefined)?.kind;
    if (kind !== 'slot-top') return;
    const srcNode = nodes.find(n => n.id === e.source);
    if (srcNode?.type === 'member' && !topAnchorIds.includes(e.source)) topAnchorIds.push(e.source);
  });

  if (topAnchorIds.length === 2) {
    const slotTopChildren = new Map<string, string[]>();
    edges.forEach(e => {
      const kind = (e.data as { kind?: string } | undefined)?.kind;
      if (kind !== 'slot-top') return;
      const arr = slotTopChildren.get(e.source) ?? [];
      arr.push(e.target);
      slotTopChildren.set(e.source, arr);
    });
    const slotTopSubtree = (anchorId: string): string[] => {
      const out: string[] = [];
      const queue = [anchorId];
      while (queue.length) {
        const cur = queue.shift()!;
        (slotTopChildren.get(cur) ?? []).forEach(id => { out.push(id); queue.push(id); });
      }
      return out;
    };

    // 6a. Re-center each anchor's own top-slot cluster directly above that
    // anchor. Dagre's median heuristic doesn't know about the large,
    // asymmetric width reserved on the anchor for the spouse gap, so without
    // this the cluster can drift off to one side instead of sitting over its
    // own member.
    topAnchorIds.forEach(anchorId => {
      const aPos  = posMap.get(anchorId);
      const aNode = nodes.find(n => n.id === anchorId);
      if (!aPos || !aNode) return;
      const slotIds = slotTopSubtree(anchorId);
      if (!slotIds.length) return;
      const lefts  = slotIds.map(id => posMap.get(id)?.x ?? 0);
      const rights = slotIds.map(id => {
        const n  = nodes.find(x => x.id === id);
        const sm = n?.data?.small as boolean | undefined;
        return (posMap.get(id)?.x ?? 0) + nodeW('slot', false, sm);
      });
      const clusterCenter = (Math.min(...lefts) + Math.max(...rights)) / 2;
      const anchorCenter  = aPos.x + nodeW('member', aNode.data?.isSuccessor as boolean) / 2;
      const shift = anchorCenter - clusterCenter;
      slotIds.forEach(id => { const p = posMap.get(id); if (p) posMap.set(id, { x: p.x + shift, y: p.y }); });
    });

    const [aId, bId] = topAnchorIds;
    const aPos = posMap.get(aId), bPos = posMap.get(bId);
    if (aPos && bPos) {
      const [leftId, rightId] = aPos.x <= bPos.x ? [aId, bId] : [bId, aId];
      const leftSlotIds  = slotTopSubtree(leftId);
      const rightSlotIds = slotTopSubtree(rightId);

      const rightEdgeOf = (id: string) => {
        const n = nodes.find(x => x.id === id);
        const sm = n?.data?.small as boolean | undefined;
        const p = posMap.get(id);
        return p ? p.x + nodeW('slot', false, sm) : -Infinity;
      };
      const leftEdgeOf = (id: string) => posMap.get(id)?.x ?? Infinity;

      if (leftSlotIds.length && rightSlotIds.length) {
        const leftMax  = Math.max(...leftSlotIds.map(rightEdgeOf));
        const rightMin = Math.min(...rightSlotIds.map(leftEdgeOf));
        const gap = rightMin - leftMax;
        if (gap < TOP_SLOT_GAP) {
          const shift = (TOP_SLOT_GAP - gap) / 2;
          leftSlotIds.forEach(id  => { const p = posMap.get(id); if (p) posMap.set(id, { x: p.x - shift, y: p.y }); });
          rightSlotIds.forEach(id => { const p = posMap.get(id); if (p) posMap.set(id, { x: p.x + shift, y: p.y }); });
        }
      }
    }
  }

  // 6c. Below-slot recentering for ANY reserved anchor — the same drift
  // problem 6a fixes for the root couple's above-placed slots also hits the
  // far more common case: an ordinary (non-root) member whose own A4D/
  // Associate slots sit BELOW them while a core-type spouse sits beside
  // them. Dagre centers those slot children under the widened main-dagre
  // column (anchor width + reserved spouse gap), not the anchor's actual
  // visual card center, so re-center every reserved anchor's own
  // below-placed slot subtree here too.
  {
    const belowSlotChildren = new Map<string, string[]>();
    edges.forEach(e => {
      const kind = (e.data as { kind?: string } | undefined)?.kind;
      if (kind) return; // only plain (below-placed) slot edges — skip spouse/succession/slot-top
      const tgtNode = nodes.find(n => n.id === e.target);
      if (tgtNode?.type !== 'slot') return;
      const arr = belowSlotChildren.get(e.source) ?? [];
      arr.push(e.target);
      belowSlotChildren.set(e.source, arr);
    });
    const belowSlotSubtree = (anchorId: string): string[] => {
      const out: string[] = [];
      const queue = [anchorId];
      while (queue.length) {
        const cur = queue.shift()!;
        (belowSlotChildren.get(cur) ?? []).forEach(id => { out.push(id); queue.push(id); });
      }
      return out;
    };

    const reservedAnchorIds = new Set<string>();
    besideInfo.forEach(({ anchorId }) => reservedAnchorIds.add(anchorId));
    reservedAnchorIds.forEach(anchorId => {
      const aPos  = posMap.get(anchorId);
      const aNode = nodes.find(n => n.id === anchorId);
      if (!aPos || !aNode) return;
      const slotIds = belowSlotSubtree(anchorId);
      if (!slotIds.length) return;
      const lefts  = slotIds.map(id => posMap.get(id)?.x ?? 0);
      const rights = slotIds.map(id => {
        const n  = nodes.find(x => x.id === id);
        const sm = n?.data?.small as boolean | undefined;
        return (posMap.get(id)?.x ?? 0) + nodeW('slot', false, sm);
      });
      const clusterCenter = (Math.min(...lefts) + Math.max(...rights)) / 2;
      const anchorCenter  = aPos.x + nodeW('member', aNode.data?.isSuccessor as boolean) / 2;
      const shift = anchorCenter - clusterCenter;
      slotIds.forEach(id => { const p = posMap.get(id); if (p) posMap.set(id, { x: p.x + shift, y: p.y }); });
    });
  }

  // 6b. General slot-rank overlap sweep — a beside subtree (e.g. a
  // succession/spouse transfer like PW-6 → PK-49) only reserves extra width
  // at its own anchor's rank. That reservation doesn't protect *deeper*
  // ranks, so an unrelated sibling's own slots (positioned by the main
  // dagre, unaware of the beside subtree's independent mini-dagre) can end
  // up drifting into the same space. Catch any leftover same-row collisions
  // between slot cards here and nudge the later one clear.
  {
    const RANK_GAP = 14;
    const slotWidthOf = (id: string) => {
      const n = nodes.find(x => x.id === id);
      return n ? nodeW('slot', false, n.data?.small as boolean) : 0;
    };
    const rows = new Map<number, string[]>();
    nodes.forEach(n => {
      if (n.type !== 'slot') return;
      const p = posMap.get(n.id);
      if (!p) return;
      const key = Math.round(p.y / 10) * 10;
      const arr = rows.get(key) ?? [];
      arr.push(n.id);
      rows.set(key, arr);
    });
    rows.forEach(ids => {
      const sorted = ids
        .map(id => ({ id, x: posMap.get(id)!.x, w: slotWidthOf(id) }))
        .sort((a, b) => a.x - b.x);
      for (let i = 1; i < sorted.length; i++) {
        const prev = sorted[i - 1];
        const cur  = sorted[i];
        const minX = prev.x + prev.w + RANK_GAP;
        if (cur.x < minX) {
          cur.x = minX;
          posMap.set(cur.id, { x: cur.x, y: posMap.get(cur.id)!.y });
        }
      }
    });
  }

  // 7. Root-couple children union point — the root's direct children belong
  // to both LM-40 and LS-40, so branch their connector from the midpoint of
  // the spousal line instead of hanging it off LM-40 alone.
  const rootSpouseEdge = edges.find(e => {
    const d = e.data as { kind?: string; rootPair?: boolean } | undefined;
    return d?.kind === 'spouse' && d?.rootPair === true;
  });
  let unionId = '';
  let unionPos: { x: number; y: number } | null = null;
  let unionLabelOffsetY = 40;
  const redirectToUnion = new Set<string>();
  if (rootSpouseEdge) {
    const rootId    = rootSpouseEdge.source;
    const spouseId  = rootSpouseEdge.target;
    const rootPos   = posMap.get(rootId);
    const spousePos = posMap.get(spouseId);
    const rootChildEdges = edges.filter(e => e.id.startsWith(`e-child-${rootId}-`));
    if (rootPos && spousePos && rootChildEdges.length) {
      const rootNode   = nodes.find(n => n.id === rootId);
      const spouseNode = nodes.find(n => n.id === spouseId);
      const rootIsSucc   = rootNode?.data?.isSuccessor as boolean | undefined;
      const spouseIsSucc = spouseNode?.data?.isSuccessor as boolean | undefined;
      const rootCenterX   = rootPos.x   + nodeW('member', rootIsSucc)   / 2;
      const spouseCenterX = spousePos.x + nodeW('member', spouseIsSucc) / 2;
      unionId = `union-${rootId}-${spouseId}`;
      // y matches the spousal line itself (card vertical center, where the
      // left-out/right-out handles sit) so the stem reads as branching
      // straight off that line instead of floating below it with a gap.
      unionPos = { x: (rootCenterX + spouseCenterX) / 2, y: rootPos.y + nodeH('member', rootIsSucc) / 2 };
      posMap.set(unionId, unionPos);
      // Sit the "Children" label on the vertical stem, just above where the
      // smoothstep bends into the horizontal bus (~midway to the children row).
      const childY = posMap.get(rootChildEdges[0].target)?.y;
      if (childY !== undefined) unionLabelOffsetY = (childY - unionPos.y) * 0.4;
      rootChildEdges.forEach(e => redirectToUnion.add(e.id));
    }
  }

  // 8. Assemble
  const finalNodes = nodes.map(n => ({ ...n, position: posMap.get(n.id) ?? { x: 0, y: 0 } }));
  if (unionPos) {
    finalNodes.push({ id: unionId, type: 'union', data: { labelOffsetY: unionLabelOffsetY }, position: unionPos, style: { width: 1, height: 1 } });
  }

  const resolvedEdges = edges.map(e => {
    if (redirectToUnion.has(e.id)) return { ...e, source: unionId, sourceHandle: 'bottom' };
    const kind = (e.data as { kind?: string } | undefined)?.kind;
    if (kind !== 'spouse' && kind !== 'succession') return e;
    const sp = posMap.get(e.source);
    const tp = posMap.get(e.target);
    if (!sp || !tp) return e;
    const toRight = tp.x >= sp.x;
    return { ...e, sourceHandle: toRight ? 'right-out' : 'left-out', targetHandle: toRight ? 'left-in' : 'right-in' };
  });

  return { nodes: finalNodes, edges: resolvedEdges };
}

// ── Main component ─────────────────────────────────────────────────────────────

interface Props {
  rootId:   string;
  members:  Member[];
  onPick:   (id: string) => void;
  bioMode?: boolean;
}

function FlowInner({ rootId, members, onPick, bioMode }: Props) {
  const rootMember = useMemo(
    () => members.find(m => m.id === findRoot(rootId, members)),
    [rootId, members],
  );

  const { nodes, edges } = useMemo(() => {
    if (!rootMember) return { nodes: [], edges: [] };
    const { nodes: raw, edges: rawEdges } = buildGraph(rootMember, members, onPick, bioMode ?? false);
    return applyLayout(raw, rawEdges);
  }, [rootMember, members, onPick, bioMode]);

  if (!rootMember) return null;

  // Primary click handler via React Flow's node event (most reliable)
  const handleNodeClick: NodeMouseHandler = (_evt, node) => {
    const d = node.data as { member?: Member };
    if (d?.member?.id) onPick(d.member.id);
  };

  return (
    <div style={{ width: '100%', height: 620 }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        onNodeClick={handleNodeClick}
        panOnScroll
        fitView
        fitViewOptions={{ padding: 0.18, minZoom: 0.12, maxZoom: 1.6 }}
        minZoom={0.1}
        maxZoom={2.5}
      >
        <Background color="#E2E8F0" gap={22} size={1} />
        <Controls
          showInteractive={false}
          style={{ bottom: 10, right: 10, left: 'auto', top: 'auto' }}
        />
      </ReactFlow>
    </div>
  );
}

export function QuotaFamilyDiagram(props: Props) {
  return (
    <ReactFlowProvider>
      <FlowInner {...props} />
    </ReactFlowProvider>
  );
}