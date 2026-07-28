
import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  Background,
  Controls,
  Handle,
  Position,
  MarkerType,
  NodeTypes,
  NodeMouseHandler,
  useReactFlow,
  useNodesInitialized,
  type Node,
  type Edge,
} from 'reactflow';
import { TYPE_CONFIG, getInitials, typeBg, typeBgHover } from '@/lib/memberUtils';
import type { Member } from '@/lib/types';
import {
  buildGraph, applyLayout, findRoot,
  getType, isDead, dispName, photoOf, displayAcno,
  nodesOfKind, displayMember, getRefFromRelation, slotRole,
  CARD_W, CARD_H, SLOT_W, SLOT_H, CONN_COLOR, BESIDE_GAP,
} from '@/lib/quotaTreeLayout';
import { useMemberStore, type Theme } from '@/store/memberStore';


function cardColors(m: Member, theme: Theme) {
  if (isDead(m)) {
    return theme === 'dark'
      ? { border: '#9CA3AF', avatarBg: '#6B7280', cardBg: '#23262b', cardBgHover: '#2b2f36' }
      : { border: '#9CA3AF', avatarBg: '#6B7280', cardBg: '#F3F4F6', cardBgHover: '#E5E7EB' };
  }
  if (m.succession) {
    return theme === 'dark'
      ? { border: '#EAB308', avatarBg: '#CA8A04', cardBg: '#2b2410', cardBgHover: '#382e15' }
      : { border: '#EAB308', avatarBg: '#CA8A04', cardBg: '#FEFCE8', cardBgHover: '#FDF3C7' };
  }
  const c = TYPE_CONFIG[getType(m) as keyof typeof TYPE_CONFIG] ?? TYPE_CONFIG.Permanent;
  // A tint of the member's type color instead of flat white/black — keeps
  // cards from blending into the page background in either theme — with a
  // deeper tint of the same hue on hover instead of just a shadow/lift.
  return { border: c.color, avatarBg: c.color, cardBg: typeBg(c, theme), cardBgHover: typeBgHover(c, theme) };
}

const handleStyle = { background: CONN_COLOR, width: 8, height: 8, border: 'none' } as const;

// ── Member card ───────────────────────────────────────────────────────────────

interface MemberNodeData {
  member: Member;
  isSuccessor?: boolean;
  onPick: (id: string) => void;
  highlighted?: boolean;
}

function MemberNodeComp({ data }: { data: MemberNodeData }) {
  const { member: m, isSuccessor, onPick, highlighted } = data;
  const [hovered, setHovered] = useState(false);
  const theme = useMemberStore(state => state.theme);
  const { border, avatarBg, cardBg, cardBgHover } = cardColors(m, theme);
  const name = dispName(m);
  const successorBg = theme === 'dark'
    ? (hovered ? '#332711' : '#241d0e')
    : (hovered ? '#fef3c7' : '#fffbeb');
  const bg = isSuccessor ? successorBg : (hovered ? cardBgHover : cardBg);

  return (
    // no fixed node width: the container hugs the card, so the left/right
    // handle dots sit ON the card border instead of floating in space
    <div style={{ position: 'relative' }}>
      <Handle id="top"       type="target" position={Position.Top}    isConnectable={false} style={handleStyle} />
      <Handle id="top-out"   type="source" position={Position.Top}    isConnectable={false} style={handleStyle} />
      <Handle id="left-in"   type="target" position={Position.Left}   isConnectable={false} style={handleStyle} />
      <Handle id="right-in"  type="target" position={Position.Right}  isConnectable={false} style={handleStyle} />
      <Handle id="bottom"    type="source" position={Position.Bottom} isConnectable={false} style={handleStyle} />
      {/* offset from "bottom" so a root's own A4D/Associate line doesn't
          run down the exact same column as the "Children" stem below it */}
      <Handle id="bottom-slots" type="source" position={Position.Bottom} isConnectable={false} style={{ ...handleStyle, left: '78%' }} />
      <Handle id="left-out"  type="source" position={Position.Left}   isConnectable={false} style={handleStyle} />
      <Handle id="right-out" type="source" position={Position.Right}  isConnectable={false} style={handleStyle} />

      <button
        onClick={e => { e.stopPropagation(); onPick(m.id); }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={highlighted ? 'search-highlight-card' : undefined}
        style={{
          border: `2.5px solid ${border}`, borderRadius: 20, background: bg,
          padding: '32px 28px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
          cursor: 'pointer', width: CARD_W,
          boxShadow: hovered ? `0 12px 26px -4px rgba(0,0,0,0.2), 0 0 0 3px ${border}2e` : '0 2px 6px rgba(0,0,0,0.08)',
          transform: hovered ? 'translateY(-3px) scale(1.015)' : 'none',
          transition: 'box-shadow 180ms ease, transform 180ms ease, border-color 180ms ease, background 180ms ease',
          opacity: isSuccessor ? 0.92 : 1,
        }}
      >
        <div style={{
          width: 200, height: 200, borderRadius: '50%', backgroundColor: avatarBg,
          backgroundImage: photoOf(m) ? `url(${photoOf(m)})` : undefined,
          backgroundSize: 'cover', backgroundPosition: 'center 22%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 34, fontWeight: 700, color: '#fff', flexShrink: 0,
          border: `5px solid ${border}`,
          boxSizing: 'border-box',
          boxShadow: hovered ? '0 3px 10px rgba(0,0,0,0.18)' : 'none',
          transition: 'box-shadow 180ms ease',

        }}>

          {!photoOf(m) && getInitials(name)}

        </div>

        <div style={{
          fontSize: 30, fontWeight: 700, color: 'var(--text-strong)', textAlign: 'center',
          lineHeight: 1.28, width: CARD_W - 44, overflowWrap: 'break-word',
          minHeight: 30 * 1.28 * 2,
        }}>
          {name}
        </div>

        <div style={{
          fontSize: 25, fontWeight: 800, fontFamily: 'monospace', letterSpacing: '0.03em',
          color: 'var(--text-strong)', background: `${border}3d`, border: `2.5px solid ${border}`,
          padding: '8px 22px', borderRadius: 999,
          boxShadow: `0 0 0 3px ${border}22`,
        }}>{displayAcno(m.id)}</div>

        {isDead(m) && (
          <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-faint)', background: 'var(--border-subtle)', padding: '4px 13px', borderRadius: 999 }}>
            Deceased
          </span>
        )}

        {m.since && (
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-muted)', marginTop: 2 }}>
            Joined {m.since}
          </div>
        )}

      </button>

    </div>

  );
}

// ── Slot card (single size; nested = visually muted, not resized) ─────────────

interface SlotNodeData {
  member: Member;
  role: 'A4D' | 'Assoc';
  nested?: boolean;
  reference?: ReactNode;
  onPick: (id: string) => void;
  highlighted?: boolean;
}

function SlotNodeComp({ data }: { data: SlotNodeData }) {
  const { member: m, role, nested, reference, onPick, highlighted } = data;
  const [hovered, setHovered] = useState(false);
  const theme = useMemberStore(state => state.theme);
  const { border, avatarBg, cardBg, cardBgHover } = cardColors(m, theme);
  const name      = dispName(m);
  const dark      = theme === 'dark';
  const roleColor = dark ? (role === 'A4D' ? '#c4a4f7' : '#f0a878') : (role === 'A4D' ? '#7c3aed' : '#c2410c');
  const roleBg    = dark ? (role === 'A4D' ? '#2b2143' : '#3a2413') : (role === 'A4D' ? '#f3e8ff' : '#ffedd5');
  const refBg     = dark ? '#232a4d' : '#E0E7FF';
  const refColor  = dark ? '#a9b6f5' : '#3730A3';
  const slotHandleStyle = { background: CONN_COLOR, width: 7, height: 7, border: 'none' } as const;

  return (

    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '3px 0', opacity: nested ? 0.85 : 1 }}>
      <Handle id="top"       type="target" position={Position.Top}    isConnectable={false} style={slotHandleStyle} />
      <Handle id="bottom"    type="source" position={Position.Bottom} isConnectable={false} style={slotHandleStyle} />
      <Handle id="top-out"   type="source" position={Position.Top}    isConnectable={false} style={slotHandleStyle} />
      <Handle id="bottom-in" type="target" position={Position.Bottom} isConnectable={false} style={slotHandleStyle} />

      {/* Split exactly at the card's horizontal center (where the top
          connector dot sits) so the two pills sit either side of it,
          leaving the connector point itself clear instead of covering it. */}
      <div style={{ display: 'flex', alignItems: 'center', width: SLOT_W }}>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{
            fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
            padding: '6px 16px', borderRadius: 999, background: roleBg, color: roleColor,
          }}>
            {role}
          </div>
        </div>

        <div style={{ width: 20, flexShrink: 0 }} />

        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-start' }}>
          {reference && (
            <div style={{
              fontSize: 14, fontWeight: 700,
              padding: '6px 16px', borderRadius: 999,
              background: refBg, color: refColor,
            }}>
              {reference}
            </div>
          )}
        </div>
      </div>

      <button
        onClick={e => { e.stopPropagation(); onPick(m.id); }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={highlighted ? 'search-highlight-card' : undefined}
        style={{
          border: `${nested ? 3 : 3.5}px solid ${border}`, borderRadius: 15, background: hovered ? cardBgHover : cardBg,
          padding: '26px 26px',
          display: 'flex', flexDirection: 'column', gap: 12,
          cursor: 'pointer', width: SLOT_W, textAlign: 'left',
          boxShadow: hovered ? `0 8px 18px -3px rgba(0,0,0,0.18), 0 0 0 2px ${border}26` : '0 1px 3px rgba(0,0,0,0.06)',
          transform: hovered ? 'translateY(-2px)' : 'none',
          transition: 'box-shadow 180ms ease, transform 180ms ease, background 180ms ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>

          <div style={{
            width: 122, height: 122, borderRadius: '50%', backgroundColor: avatarBg,
            backgroundImage: photoOf(m) ? `url(${photoOf(m)})` : undefined,
            backgroundSize: 'cover', backgroundPosition: 'center 22%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, fontWeight: 700, color: '#fff', flexShrink: 0,
            border: `4px solid ${border}`,
            boxSizing: 'border-box',

          }}>
            {!photoOf(m) && getInitials(name)}
          </div>

          <div style={{ minWidth: 0, flex: 1 }}>

            <div style={{
              fontSize: 24, fontWeight: 600, color: 'var(--text-strong)', lineHeight: 1.28, overflowWrap: 'break-word',
              minHeight: 24 * 1.28 * 2,
            }}>
              {name}
            </div>

            <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 7, flexWrap: 'wrap' }}>
              <span style={{
                fontSize: 19, fontWeight: 800, fontFamily: 'monospace',
                color: 'var(--text-strong)', background: `${border}3d`, border: `2px solid ${border}`,
                padding: '4px 13px', borderRadius: 999,
                boxShadow: `0 0 0 2.5px ${border}22`,
              }}>{displayAcno(m.id)}</span>
              {isDead(m) && (
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-faint)', background: 'var(--border-subtle)', padding: '2px 9px', borderRadius: 999 }}>
                  Deceased
                </span>
              )}
            </div>

            {m.since && (
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-muted)', marginTop: 6 }}>
                Joined {m.since}
              </div>
            )}

          </div>
        </div>
      </button>
    </div>
  );
}

// ── Union anchor (invisible midpoint of the root spousal line) ────────────────

function UnionNodeComp({ data }: { data: { labelOffsetY?: number } }) {
  return (
    <div style={{ width: 1, height: 1, position: 'relative' }}>
      <Handle id="bottom" type="source" position={Position.Bottom} isConnectable={false} style={{ width: 1, height: 1, opacity: 0 }} />
      <span style={{
        position: 'absolute', top: data.labelOffsetY ?? 40, left: -10, whiteSpace: 'nowrap',
        transform: 'translateX(-100%)',
        fontSize: 16, fontWeight: 800, color: 'var(--text)',
        background: 'var(--border-subtle)', padding: '4px 11px', borderRadius: 7,
      }}>
        Children
      </span>
    </div>
  );
}

const nodeTypes: NodeTypes = { member: MemberNodeComp, slot: SlotNodeComp, union: UnionNodeComp };

// ── Flat single-layer layout for a core member's own nodes[] ──────────────────
// Parents on top, Transfer/Core/Spouse in the middle row, A4D+Associate below.
// No recursion into further generations — that's the whole point: a quota
// holder one level up can have their own unrelated second family, and
// walking the old dagre tree down through it produced a confusing mashup.
// Manual positions (no dagre) — this is always exactly one shape.
function buildMemberRelGraph(
  owner: Member,
  members: Member[],
  onPick: (id: string) => void,
  dark: boolean,
): { nodes: Node[]; edges: Edge[] } {
  const neutralLabelBg = dark ? '#2a2e39' : '#E5E7EB';
  const neutralLabelFg = dark ? '#e5e7eb' : '#374151';
  const amberLabelBg   = dark ? '#3a2e12' : '#fef3c7';
  const amberLabelFg   = dark ? '#f0c975' : '#92400e';

  const parents       = nodesOfKind(owner, members, ['Parent']);
  const spouseEntry   = nodesOfKind(owner, members, ['Spouse'])[0];
  const transferEntry = nodesOfKind(owner, members, ['Transfer'])[0];
  const slotEntries   = nodesOfKind(owner, members, ['A4D', 'Associate']);

  const nodes: Node[] = [];
  const edges: Edge[] = [];

  const H_GAP      = BESIDE_GAP;
  const PARENT_GAP = 160;
  const SLOT_GAP   = 48;
  const PARENT_Y   = 0;
  const CORE_Y     = CARD_H + 240;
  const SLOT_Y     = CORE_Y + CARD_H + 180;

  const slotRowW = slotEntries.length > 0
    ? slotEntries.length * SLOT_W + (slotEntries.length - 1) * SLOT_GAP
    : 0;
  const coreRowW = CARD_W
    + (transferEntry ? CARD_W + H_GAP : 0)
    + (spouseEntry ? CARD_W + H_GAP : 0);
  const totalWidth = Math.max(slotRowW, coreRowW, CARD_W);

  const coreX     = (totalWidth - CARD_W) / 2;
  const spouseX   = coreX + CARD_W + H_GAP;
  const transferX = coreX - CARD_W - H_GAP;

  nodes.push({
    id: owner.id, type: 'member', position: { x: coreX, y: CORE_Y },
    data: { member: owner, onPick },
  });

  if (spouseEntry) {
    const spouse = displayMember(spouseEntry);
    nodes.push({
      id: spouse.id, type: 'member', position: { x: spouseX, y: CORE_Y },
      data: { member: spouse, onPick },
    });
    edges.push({
      id: `e-spouse-${owner.id}-${spouse.id}`,
      source: owner.id, sourceHandle: 'right-out',
      target: spouse.id, targetHandle: 'left-in',
      type: 'straight', label: 'Spouse',
      style: { stroke: '#9CA3AF', strokeWidth: 3.5 },
      labelStyle: { fontSize: 16, fill: neutralLabelFg, fontWeight: 800 },
      labelBgStyle: { fill: neutralLabelBg, fillOpacity: 1, borderRadius: 7 },
      labelBgPadding: [10, 6],
    });
  }

  if (transferEntry) {
    const transfer = displayMember(transferEntry);
    // "Transfer from" (the common case — this member received the A/C) vs
    // "Transfer to" (this member gave it away): the arrow always points at
    // whoever RECEIVED the account, regardless of which side of the card
    // the other party happens to sit on visually.
    const isOutgoing = transferEntry.relation.toLowerCase().includes('to');
    nodes.push({
      id: transfer.id, type: 'member', position: { x: transferX, y: CORE_Y },
      data: { member: transfer, onPick },
    });
    edges.push({
      id: `e-transfer-${owner.id}-${transfer.id}`,
      source: isOutgoing ? owner.id : transfer.id,
      sourceHandle: isOutgoing ? 'left-out' : 'right-out',
      target: isOutgoing ? transfer.id : owner.id,
      targetHandle: isOutgoing ? 'right-in' : 'left-in',
      type: 'straight', label: 'A/C Transfer',
      markerEnd: { type: MarkerType.ArrowClosed, color: '#F59E0B' },
      style: { stroke: '#F59E0B', strokeWidth: 3.5 },
      labelStyle: { fontSize: 16, fill: amberLabelFg, fontWeight: 800 },
      labelBgStyle: { fill: amberLabelBg, fillOpacity: 1, borderRadius: 7 },
      labelBgPadding: [10, 6],
    });
  }

  if (parents.length > 0) {
    const parentsRowW = parents.length * CARD_W + Math.max(parents.length - 1, 0) * PARENT_GAP;
    const parentsStartX = coreX + CARD_W / 2 - parentsRowW / 2;

    parents.forEach((entry, i) => {
      const px = parentsStartX + i * (CARD_W + PARENT_GAP);
      nodes.push({
        id: entry.member.id, type: 'member', position: { x: px, y: PARENT_Y },
        data: { member: displayMember(entry), onPick },
      });
    });

    if (parents.length > 1) {
      edges.push({
        id: `e-parentpair-${owner.id}`,
        source: parents[0].member.id, sourceHandle: 'right-out',
        target: parents[1].member.id, targetHandle: 'left-in',
        type: 'straight', label: 'Spouse',
        style: { stroke: '#9CA3AF', strokeWidth: 3.5 },
        labelStyle: { fontSize: 16, fill: neutralLabelFg, fontWeight: 800 },
        labelBgStyle: { fill: neutralLabelBg, fillOpacity: 1, borderRadius: 7 },
        labelBgPadding: [10, 6],
      });
    }

    // Union sits ON the parent-pair spousal line (or the single parent's own
    // bottom edge) and drops the "Children" stem straight to core — same
    // trick applyLayout() uses for the root couple's children line.
    const unionId = `union-parents-${owner.id}`;
    const unionX = parents.length > 1
      ? parentsStartX + parentsRowW / 2
      : parentsStartX + CARD_W / 2;
    const unionY = parents.length > 1
      ? PARENT_Y + CARD_H / 2
      : PARENT_Y + CARD_H;
    nodes.push({
      id: unionId, type: 'union',
      position: { x: unionX, y: unionY },
      data: { labelOffsetY: (CORE_Y - unionY) * 0.4 },
      style: { width: 1, height: 1 },
    });
    edges.push({
      id: `e-parentfan-${owner.id}`,
      source: unionId, sourceHandle: 'bottom',
      target: owner.id, targetHandle: 'top',
      type: 'smoothstep',
      style: { stroke: '#94A3B8', strokeWidth: 3.5 },
    });
  }

  if (slotEntries.length > 0) {
    const slotStartX = coreX + CARD_W / 2 - slotRowW / 2;
    slotEntries.forEach((entry, i) => {
      const slot = displayMember(entry);
      const role = slotRole(entry.member);
      const sx = slotStartX + i * (SLOT_W + SLOT_GAP);
      const sid = `slot-${slot.id}`;
      nodes.push({
        id: sid, type: 'slot', position: { x: sx, y: SLOT_Y },
        data: { member: slot, role, reference: getRefFromRelation(entry.relation), onPick },
      });
      edges.push({
        id: `e-slot-${owner.id}-${sid}`,
        source: owner.id, target: sid,
        sourceHandle: 'bottom', targetHandle: 'top',
        type: 'smoothstep',
        style: { stroke: role === 'A4D' ? '#9333ea77' : '#ea580c77', strokeWidth: 3.5, strokeDasharray: '6 4' },
      });
    });
  }

  return { nodes, edges };
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  rootId:   string;
  members:  Member[];
  onPick:   (id: string) => void;
  bioMode?: boolean;
  highlightedId?: string | null;
}

function FlowInner({ rootId, members, onPick, bioMode, highlightedId }: Props) {
  const theme = useMemberStore(state => state.theme);

  // Core member (has its own raw `.nodes`): render exactly who was
  // searched/clicked, no walk-up — a core member's OWN quota holder can have
  // an unrelated second family of their own, so climbing all the way to the
  // ultimate ancestor used to land on the wrong person entirely. Non-core
  // (an a4d/associate dependent): walk up just far enough to reach their
  // nearest core sponsor — NOT the full pid chain, which would also walk
  // past that sponsor into whoever sponsors them. Only if no core ancestor
  // exists anywhere in the chain (shouldn't happen for real API data) does
  // this fall back to the old "walk to the ultimate ancestor" behavior, for
  // the legacy recursive quota-tree view.
  const rootMember = useMemo(() => {
    let cur = members.find(m => m.id === rootId);
    const seen = new Set<string>();
    while (cur && !cur.nodes && !seen.has(cur.id)) {
      seen.add(cur.id);
      cur = cur.pid ? members.find(m => m.id === cur!.pid) : undefined;
    }
    if (cur) return cur;
    return members.find(m => m.id === findRoot(rootId, members));
  }, [rootId, members]);

  const { nodes: rawNodes, edges } = useMemo(() => {
    if (!rootMember) return { nodes: [], edges: [] };
    if (rootMember.nodes) {
      return buildMemberRelGraph(rootMember, members, onPick, theme === 'dark');
    }
    const raw = buildGraph(rootMember, members, onPick, bioMode ?? false, theme === 'dark');
    return applyLayout(raw.nodes, raw.edges);
  }, [rootMember, members, onPick, bioMode, theme]);

  const nodes = useMemo(
    () => rawNodes.map(n => (n.type === 'member' || n.type === 'slot')
      ? { ...n, data: { ...n.data, highlighted: !!highlightedId && (n.data as { member?: Member }).member?.id === highlightedId } }
      : n),
    [rawNodes, highlightedId],
  );

  const rf = useReactFlow();
  const nodesInitialized = useNodesInitialized();
  useEffect(() => {
    if (!nodesInitialized) return;
    if (highlightedId) {
      const target = nodes.find(n => (n.data as { member?: Member })?.member?.id === highlightedId);
      if (target) {
        const w = target.type === 'slot' ? SLOT_W : CARD_W;
        const h = target.type === 'slot' ? SLOT_H : CARD_H;
        rf.setCenter(target.position.x + w / 2, target.position.y + h / 2, { zoom: 1, duration: 600 });
        return;
      }
    }
    rf.fitView({ padding: 0.18, minZoom: 0.12, maxZoom: 1.6, duration: 300 });
  }, [nodesInitialized, highlightedId, nodes, rf]);

  if (!rootMember) return null;

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
        minZoom={0.1}
        maxZoom={2.5}
      >
        <Background color={theme === 'dark' ? '#2a2e39' : '#E2E8F0'} gap={22} size={1} />
        <Controls
          showInteractive={false}
          style={{ bottom: 10, right: 10, left: 'auto', top: 'auto' }}
        />
      </ReactFlow>
    </div>
  );
}

export function MemberRelationshipTree(props: Props) {
  return (
    <ReactFlowProvider>
      <FlowInner {...props} />
    </ReactFlowProvider>
  );
}