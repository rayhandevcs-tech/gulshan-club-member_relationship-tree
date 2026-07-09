'use client';

import { useEffect, useMemo, useState } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  Background,
  Controls,
  Handle,
  Position,
  NodeTypes,
  NodeMouseHandler,
  useReactFlow,
  useNodesInitialized,
  type Node,
  type Edge,
} from 'reactflow';
import {
  buildRelationshipDiagram,
  DIAGRAM_BOX_W,
  DIAGRAM_BOX_H,
  TYPE_CONFIG,
  getInitials,
} from '@/lib/memberUtils';
import { Member } from '@/lib/types';
import { getType, photoOf, dispName, isDead } from '@/components/Quotatreelayout';
import { QuotaFamilyDiagram } from './QuotaFamilyDiagram';

interface Props {
  focusId: string;
  members: Member[];
  onPick: (id: string) => void;
  highlightedId?: string | null;
}

// ─── Family Relationship tab: owner + spouse + direct children (React Flow) ──

const FAM_CARD_W = 290;
const FAM_CARD_H = 275;
const FAM_HGAP   = 55;
const FAM_SGAP   = 120;
const FAM_VGAP   = 160;

type FamRole = 'owner' | 'spouse' | 'child';

const FAM_ROLE_STYLE: Record<FamRole, { border: string; bg: string; bgHover: string }> = {
  owner:  { border: '#0F766E', bg: '#F0FDFA', bgHover: '#CCFBF1' },
  spouse: { border: '#BE185D', bg: '#FDF2F8', bgHover: '#FCE7F3' },
  child:  { border: '#6D28D9', bg: '#F5F3FF', bgHover: '#EDE9FE' },
};

interface FamCardData {
  member: Member;
  role: FamRole;
  caption?: string;
  quotaRef?: string;
  onPick: (id: string) => void;
  highlighted?: boolean;
}

function FamCard({ data }: { data: FamCardData }) {
  const { member: m, role, caption, quotaRef, onPick, highlighted } = data;
  const { border, bg, bgHover } = FAM_ROLE_STYLE[role];
  const name = dispName(m);
  const photo = photoOf(m);
  const [hovered, setHovered] = useState(false);

  return (
    <div style={{ position: 'relative', width: FAM_CARD_W }}>
      <Handle type="target" position={Position.Top} isConnectable={false} style={{ opacity: 0 }} />
      <Handle id="right-out" type="source" position={Position.Right} isConnectable={false} style={{ opacity: 0 }} />
      <Handle id="left-in" type="target" position={Position.Left} isConnectable={false} style={{ opacity: 0 }} />

      <button
        onClick={e => { e.stopPropagation(); onPick(m.id); }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={highlighted ? 'search-highlight-card' : undefined}
        style={{
          border: `2px solid ${border}`, borderRadius: 16, background: hovered ? bgHover : bg,
          padding: '22px 18px', width: '100%',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 9,
          cursor: 'pointer',
          boxShadow: hovered ? `0 14px 28px -4px rgba(0,0,0,0.2), 0 0 0 3px ${border}2e` : '0 1px 4px rgba(0,0,0,0.06)',
          transform: hovered ? 'translateY(-4px) scale(1.015)' : 'none',
          transition: 'box-shadow 180ms ease, transform 180ms ease, border-color 180ms ease, background 180ms ease',
        }}
      >
        <div style={{
          width: 118, height: 118, borderRadius: '50%', backgroundColor: border,
          backgroundImage: photo ? `url(${photo})` : undefined,
          backgroundSize: 'cover', backgroundPosition: 'center 22%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 24, fontWeight: 700, color: '#fff', flexShrink: 0,
          border: `3px solid ${border}`,
          boxSizing: 'border-box',
          boxShadow: hovered ? '0 3px 10px rgba(0,0,0,0.18)' : 'none',
          transition: 'box-shadow 180ms ease',
        }}>
          {!photo && getInitials(name)}
        </div>
        <div style={{ fontSize: 23, fontWeight: 700, color: '#111827', textAlign: 'center', lineHeight: 1.3 }}>
          {name}
        </div>
        <div style={{
          fontSize: 17, fontWeight: 700, fontFamily: 'monospace', letterSpacing: '0.02em',
          color: border, background: `${border}1a`, padding: '3px 12px', borderRadius: 999,
        }}>
          {m.id}
        </div>
        {m.since && (
          <div style={{ fontSize: 16, fontWeight: 600, color: '#6B7280', marginTop: 1 }}>
            Joined {m.since}
          </div>
        )}
        {isDead(m) && (
          <span style={{ fontSize: 12, fontWeight: 600, color: '#4B5563', background: '#E5E7EB', padding: '2px 9px', borderRadius: 999 }}>
            Deceased
          </span>
        )}
      </button>

      {caption && (
        <div style={{ textAlign: 'center', marginTop: 7, fontSize: 16, fontWeight: 600, color: border }}>
          {caption}
        </div>
      )}
      {quotaRef && (
        <div style={{ textAlign: 'center', marginTop: 2, fontSize: 13.5, fontStyle: 'italic', color: '#9CA3AF' }}>
          {quotaRef}
        </div>
      )}
    </div>
  );
}

function FamUnion({ data }: { data: { labelOffsetY?: number } }) {
  return (
    <div style={{ width: 1, height: 1, position: 'relative' }}>
      <Handle id="bottom" type="source" position={Position.Bottom} isConnectable={false} style={{ width: 1, height: 1, opacity: 0 }} />
      <span style={{
        position: 'absolute', top: data.labelOffsetY ?? 40, left: 8, whiteSpace: 'nowrap',
        fontSize: 11.5, fontWeight: 600, color: '#94A3B8',
        background: '#fff', padding: '1px 6px', borderRadius: 4,
      }}>
        Children
      </span>
    </div>
  );
}

const famNodeTypes: NodeTypes = { card: FamCard, union: FamUnion };

const famChildLabel = (m: Member) =>
  m.gender === 'M' ? 'Son' : m.gender === 'F' ? 'Daughter' : 'Child';

function buildFocusedGraph(focusId: string, members: Member[]): { nodes: Node[]; edges: Edge[] } {
  const owner = members.find(m => m.id === focusId);
  if (!owner) return { nodes: [], edges: [] };

  // Spouse(s): if owner is registered as a spouse, they have exactly one
  // partner (their own pid); otherwise collect EVERY member registered as a
  // spouse under owner — a member can have more than one.
  const spouses = owner.rel === 'spouse' && owner.pid
    ? [members.find(m => m.id === owner.pid)].filter((x): x is Member => !!x)
    : members.filter(m => m.pid === focusId && m.rel === 'spouse');

  // Bio children via fatherId/motherId; structural rel=child as fallback
  const parentIds = new Set([owner.id, ...spouses.map(s => s.id)]);
  const seenIds = new Set<string>([owner.id, ...spouses.map(s => s.id)]);
  const bioChildren = members.filter(m => {
    if (seenIds.has(m.id)) return false;
    const linked = (m.fatherId && parentIds.has(m.fatherId)) ||
                   (m.motherId && parentIds.has(m.motherId));
    const structural = m.rel === 'child' && parentIds.has(m.pid ?? '') &&
                       !m.fatherId && !m.motherId;
    if (linked || structural) { seenIds.add(m.id); return true; }
    return false;
  });

  const topRowW = FAM_CARD_W + spouses.length * (FAM_CARD_W + FAM_SGAP);
  const botW = bioChildren.length > 0
    ? bioChildren.length * FAM_CARD_W + (bioChildren.length - 1) * FAM_HGAP : 0;
  const totalW = Math.max(topRowW, botW);
  const mid = totalW / 2;

  const topStartX = mid - topRowW / 2;
  const ownerX  = topStartX;
  const spouseXs = spouses.map((_, i) => topStartX + (i + 1) * (FAM_CARD_W + FAM_SGAP));
  const row1Y   = 0;
  const row2Y   = row1Y + FAM_CARD_H + FAM_VGAP;
  const childX0 = mid - botW / 2;

  const nodes: Node[] = [];
  const edges: Edge[] = [];

  nodes.push({
    id: owner.id, type: 'card', position: { x: ownerX, y: row1Y },
    data: { member: owner, role: 'owner' as FamRole, onPick: undefined },
  });

  spouses.forEach((spouse, i) => {
    nodes.push({
      id: spouse.id, type: 'card', position: { x: spouseXs[i], y: row1Y },
      data: { member: spouse, role: 'spouse' as FamRole, onPick: undefined },
    });
    edges.push({
      id: `e-spouse-${owner.id}-${spouse.id}`,
      source: owner.id, sourceHandle: 'right-out',
      target: spouse.id, targetHandle: 'left-in',
      type: 'straight', label: 'SPOUSE',
      style: { stroke: '#CBD5E1', strokeWidth: 2.5 },
      labelStyle: { fontSize: 10, fill: '#94A3B8', fontWeight: 600, letterSpacing: 0.6 },
      labelBgStyle: { fill: '#F9FAFB', fillOpacity: 1 },
      labelBgPadding: [6, 3],
      labelBgBorderRadius: 5,
    });
  });

  if (bioChildren.length > 0) {
    const unionId = `union-${owner.id}`;
    const unionX = spouses.length > 0 ? mid : ownerX + FAM_CARD_W / 2;
    const unionY = spouses.length > 0 ? row1Y + FAM_CARD_H / 2 : row1Y + FAM_CARD_H;
    const labelOffsetY = (row2Y - unionY) * 0.4;
    nodes.push({
      id: unionId, type: 'union', position: { x: unionX, y: unionY },
      data: { labelOffsetY }, style: { width: 1, height: 1 },
    });

    bioChildren.forEach((c, i) => {
      const cx = childX0 + i * (FAM_CARD_W + FAM_HGAP);
      // Bio child, but membership can hang off someone else's quota (e.g. a
      // grandparent's) instead of the parent(s) shown here — flag that.
      const sponsor = c.pid && !parentIds.has(c.pid) ? members.find(m => m.id === c.pid) : null;
      const quotaRef = sponsor ? `Membership via ${sponsor.name} (${sponsor.id})` : undefined;
      nodes.push({
        id: c.id, type: 'card', position: { x: cx, y: row2Y },
        data: { member: c, role: 'child' as FamRole, caption: famChildLabel(c), quotaRef, onPick: undefined },
      });
      edges.push({
        id: `e-child-${owner.id}-${c.id}`,
        source: unionId, sourceHandle: 'bottom', target: c.id,
        type: 'smoothstep',
        style: { stroke: '#CBD5E1', strokeWidth: 2.5 },
      });
    });
  }

  return { nodes, edges };
}

function FocusedDiagramInner({ focusId, members, onPick, highlightedId }: Props) {
  const { nodes: rawNodes, edges } = useMemo(
    () => buildFocusedGraph(focusId, members),
    [focusId, members],
  );

  const nodes = useMemo(
    () => rawNodes.map(n => n.type === 'card'
      ? { ...n, data: { ...n.data, onPick, highlighted: !!highlightedId && n.id === highlightedId } }
      : n),
    [rawNodes, onPick, highlightedId],
  );

  const rf = useReactFlow();
  const nodesInitialized = useNodesInitialized();
  useEffect(() => {
    if (!nodesInitialized) return;
    if (highlightedId) {
      const target = nodes.find(n => n.id === highlightedId);
      if (target) {
        rf.setCenter(target.position.x + FAM_CARD_W / 2, target.position.y + FAM_CARD_H / 2, { zoom: 1, duration: 600 });
        return;
      }
    }
    rf.fitView({ padding: 0.2, minZoom: 0.2, maxZoom: 1.5, duration: 300 });
  }, [nodesInitialized, highlightedId, nodes, rf]);

  if (!nodes.length) return null;

  const handleNodeClick: NodeMouseHandler = (_evt, node) => {
    const d = node.data as { member?: Member };
    if (d?.member?.id) onPick(d.member.id);
  };

  return (
    <div style={{ width: '100%', height: 560 }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={famNodeTypes}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        onNodeClick={handleNodeClick}
        panOnScroll
        minZoom={0.2}
        maxZoom={2}
      >
        <Background color="#E2E8F0" gap={22} size={1} />
        <Controls showInteractive={false} style={{ bottom: 10, right: 10, left: 'auto', top: 'auto' }} />
      </ReactFlow>
    </div>
  );
}

export function FocusedDiagram(props: Props) {
  return (
    <ReactFlowProvider>
      <FocusedDiagramInner {...props} />
    </ReactFlowProvider>
  );
}

interface WholeProps {
  rootId: string;
  members: import('@/lib/types').Member[];
  onPick: (id: string) => void;
}

export function WholeMapDiagram({ rootId, members, onPick }: WholeProps) {
  const layout = buildRelationshipDiagram(members, rootId);
  if (!layout) return null;

  const { nodes, edges, refs, width, height } = layout;
  const byId = new Map(nodes.map(n => [n.member.id, n]));
  const minX = Math.min(...nodes.map(n => n.x)) - 80;
  const padTop = refs.length ? 70 : 20;

  const centerX = (id: string) => (byId.get(id)?.x ?? 0) + DIAGRAM_BOX_W / 2 - minX;
  const topY = (id: string) => (byId.get(id)?.y ?? 0) + padTop;
  const bottomY = (id: string) => topY(id) + DIAGRAM_BOX_H;

  return (
    <svg width={width} height={height + padTop} viewBox={`0 0 ${width} ${height + padTop}`} style={{ minWidth: width }}>
      <defs>
        <marker id="wm-arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 Z" fill="#374151" />
        </marker>
      </defs>

      {refs.map((ref, i) => {
        const tx = centerX(ref.targetId);
        const ty = topY(ref.targetId);
        const bx = tx - 220;
        const by = ty - 10;
        return (
          <g key={`ref-${i}`}>
            <rect x={bx} y={by - 36} width={140} height={44} rx={12} fill="#fff" stroke="#9CA3AF" strokeWidth={1.5} />
            <text x={bx + 70} y={by - 10} textAnchor="middle" fontSize="13" fontWeight={600} fill="#374151">{ref.label}</text>
            <path d={`M ${bx + 140} ${by - 14} C ${bx + 180} ${by - 14}, ${tx - 30} ${ty - 14}, ${tx} ${ty}`} fill="none" stroke="#9CA3AF" strokeWidth={1.5} markerEnd="url(#wm-arrow)" />
            {ref.detail && <text x={(bx + 140 + tx) / 2} y={by - 22} textAnchor="middle" fontSize="10" fill="#6B7280">[{ref.detail}]</text>}
          </g>
        );
      })}

      {edges.map((e, i) => {
        const from = byId.get(e.fromId);
        const to = byId.get(e.toId);
        if (!from || !to) return null;

        if (e.kind === 'spouse' || e.kind === 'sibling') {
          const y = topY(e.fromId) + DIAGRAM_BOX_H / 2;
          const x1 = from.x + DIAGRAM_BOX_W - minX;
          const x2 = to.x - minX;
          const stroke = e.kind === 'spouse' ? '#374151' : '#9CA3AF';
          return (
            <g key={i}>
              <line x1={x1} y1={y} x2={x2} y2={y} stroke={stroke} strokeWidth={1.5} />
              <text x={(x1 + x2) / 2} y={y - 8} textAnchor="middle" fontSize="10" fill={stroke}>[{e.label}]</text>
            </g>
          );
        }

        const x1 = centerX(e.fromId);
        const y1 = bottomY(e.fromId);
        const x2 = centerX(e.toId);
        const y2 = topY(e.toId);
        const midY = y1 + (y2 - y1) / 2;
        const path = `M ${x1} ${y1} L ${x1} ${midY} L ${x2} ${midY} L ${x2} ${y2 - 6}`;
        return (
          <g key={i}>
            <path d={path} fill="none" stroke="#374151" strokeWidth={1.5} markerEnd="url(#wm-arrow)" />
            {e.label && <text x={(x1 + x2) / 2} y={midY - 6} textAnchor="middle" fontSize="10" fill="#6B7280">[{e.label}]</text>}
          </g>
        );
      })}

      {nodes.map(n => {
        const type = getType(n.member);
        const cfg = TYPE_CONFIG[type as keyof typeof TYPE_CONFIG] ?? TYPE_CONFIG.Permanent;
        const x = n.x - minX;
        const y = n.y + padTop;
        return (
          <g key={n.member.id} style={{ cursor: 'pointer' }} onClick={() => onPick(n.member.id)}>
            <rect x={x} y={y} width={DIAGRAM_BOX_W} height={DIAGRAM_BOX_H} rx={12} fill="#fff" stroke={cfg.color} strokeWidth={1.5} />
            <text x={x + 12} y={y + 22} fontSize="13" fontWeight={600} fill="#1F2937">
              {n.member.name.length > 22 ? n.member.name.slice(0, 21) + '…' : n.member.name}
            </text>
            <text x={x + 12} y={y + 40} fontSize="11" fill="#9CA3AF">{n.member.id}</text>
            {n.caption && <text x={x + 12} y={y + 56} fontSize="10" fontStyle="italic" fill="#9CA3AF">{n.caption}</text>}
          </g>
        );
      })}
    </svg>
  );
}

// ─── Bio Family Tree (delegates to QuotaFamilyDiagram) ───────────────────────

interface BioProps {
  rootId: string;
  members: Member[];
  onPick: (id: string) => void;
  highlightedId?: string | null;
}

// Member Relationship tab: quota/sponsorship tree only — no bio children
export function BioFamilyDiagram({ rootId, members, onPick, highlightedId }: BioProps) {
  return <QuotaFamilyDiagram rootId={rootId} members={members} onPick={onPick} highlightedId={highlightedId} />;
}

// Family Relationship tab: biological family tree with recursive children
export function FamilyTreeDiagram({ rootId, members, onPick, highlightedId }: BioProps) {
  return <QuotaFamilyDiagram rootId={rootId} members={members} onPick={onPick} highlightedId={highlightedId} bioMode />;
}
