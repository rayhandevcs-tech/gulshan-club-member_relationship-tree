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
import { getInitials } from '@/lib/memberUtils';
import { Member } from '@/lib/types';
import { photoOf, dispName, isDead, displayAcno } from '@/lib/quotaTreeLayout';
import { useMemberStore } from '@/store/memberStore';

interface Props {
  focusId: string;
  members: Member[];
  onPick: (id: string) => void;
  highlightedId?: string | null;
}

// ─── Family Relationship tab: owner + spouse + direct children (React Flow) ──

const FAM_CARD_W = 345;
const FAM_CARD_H = 365;
const FAM_HGAP   = 75;
const FAM_SGAP   = 155;
const FAM_VGAP   = 220;

type FamRole = 'owner' | 'spouse' | 'child' | 'parent';

const FAM_ROLE_STYLE: Record<FamRole, { border: string; bg: string; bgHover: string; bgNight: string; bgNightHover: string }> = {
  owner:  { border: '#0F766E', bg: '#F0FDFA', bgHover: '#CCFBF1', bgNight: '#0D211E', bgNightHover: '#123830' },
  spouse: { border: '#BE185D', bg: '#FDF2F8', bgHover: '#FCE7F3', bgNight: '#2B131F', bgNightHover: '#3A1A2A' },
  child:  { border: '#6D28D9', bg: '#F5F3FF', bgHover: '#EDE9FE', bgNight: '#211A3D', bgNightHover: '#2D2454' },
  parent: { border: '#1D4ED8', bg: '#EFF6FF', bgHover: '#DBEAFE', bgNight: '#111E3D', bgNightHover: '#17294F' },
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
  const theme = useMemberStore(state => state.theme);
  const dark = theme === 'dark';
  const roleStyle = FAM_ROLE_STYLE[role];
  const border  = roleStyle.border;
  const bg      = dark ? roleStyle.bgNight : roleStyle.bg;
  const bgHover = dark ? roleStyle.bgNightHover : roleStyle.bgHover;
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
          width: 138, height: 138, borderRadius: '50%', backgroundColor: border,
          backgroundImage: photo ? `url(${photo})` : undefined,
          backgroundSize: 'cover', backgroundPosition: 'center 22%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 27, fontWeight: 700, color: '#fff', flexShrink: 0,
          border: `3.5px solid ${border}`,
          boxSizing: 'border-box',
          boxShadow: hovered ? '0 3px 10px rgba(0,0,0,0.18)' : 'none',
          transition: 'box-shadow 180ms ease',
        }}>
          {!photo && getInitials(name)}
        </div>
        <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-strong)', textAlign: 'center', lineHeight: 1.3 }}>
          {name}
        </div>
        <div style={{
          fontSize: 21, fontWeight: 800, fontFamily: 'monospace', letterSpacing: '0.03em',
          color: 'var(--text-strong)', background: `${border}2e`, border: `1.5px solid ${border}55`,
          padding: '4px 14px', borderRadius: 999,
        }}>
          {displayAcno(m.id)}
        </div>
        {m.since && (
          <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-muted)', marginTop: 1 }}>
            Joined {m.since}
          </div>
        )}
        {isDead(m) && (
          <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-faint)', background: 'var(--border-subtle)', padding: '2px 10px', borderRadius: 999 }}>
            Deceased
          </span>
        )}
      </button>

      {caption && (
        <div style={{ textAlign: 'center', marginTop: 7, fontSize: 18, fontWeight: 600, color: border }}>
          {caption}
        </div>
      )}
      {quotaRef && (
        <div style={{ textAlign: 'center', marginTop: 2, fontSize: 15, fontStyle: 'italic', color: 'var(--text-muted)' }}>
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
        fontSize: 16, fontWeight: 800, color: 'var(--text)',
        background: 'var(--border-subtle)', padding: '4px 11px', borderRadius: 7,
      }}>
        Children
      </span>
    </div>
  );
}

const famNodeTypes: NodeTypes = { card: FamCard, union: FamUnion };

const famChildLabel = (m: Member) =>
  m.gender === 'M' ? 'Son' : m.gender === 'F' ? 'Daughter' : 'Child';

function buildFocusedGraph(focusId: string, members: Member[], dark: boolean): { nodes: Node[]; edges: Edge[] } {
  const owner = members.find(m => m.id === focusId);
  if (!owner) return { nodes: [], edges: [] };

  const labelFg = dark ? '#e5e7eb' : '#374151';
  const labelBg = dark ? '#2a2e39' : '#E5E7EB';

  // Spouse(s): if owner is registered as a spouse, they have exactly one
  // partner (their own pid); otherwise collect EVERY member registered as a
  // spouse under owner — a member can have more than one.
  const spouses = owner.rel === 'spouse' && owner.pid
    ? [members.find(m => m.id === owner.pid)].filter((x): x is Member => !!x)
    : members.filter(m => m.pid === focusId && m.rel === 'spouse');

  // Owner's own parents (not the spouse's) sit in a row above - only shown
  // when they resolved to an actual member record (a name-only fatherName/
  // motherName fallback with no real A/C has nothing to render as a card).
  const seenParentIds = new Set<string>();
  const parents = [
    owner.fatherId ? members.find(m => m.id === owner.fatherId) : null,
    owner.motherId ? members.find(m => m.id === owner.motherId) : null,
  ].filter((x): x is Member => {
    if (!x || seenParentIds.has(x.id)) return false;
    seenParentIds.add(x.id);
    return true;
  });

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

  // Parents row sits above the owner (mirrors the children row below) -
  // centered on the owner's own card, not the whole owner+spouse+children
  // span, since these are specifically the owner's parents.
  const parentsRowW = parents.length * FAM_CARD_W + Math.max(parents.length - 1, 0) * FAM_HGAP;
  const parentsStartX = ownerX + FAM_CARD_W / 2 - parentsRowW / 2;
  const parentRowY = row1Y - FAM_CARD_H - FAM_VGAP;

  const nodes: Node[] = [];
  const edges: Edge[] = [];

  parents.forEach((parent, i) => {
    const px = parentsStartX + i * (FAM_CARD_W + FAM_HGAP);
    nodes.push({
      id: parent.id, type: 'card', position: { x: px, y: parentRowY },
      data: {
        member: parent, role: 'parent' as FamRole,
        caption: parent.id === owner.fatherId ? 'Father' : 'Mother',
        onPick: undefined,
      },
    });
    edges.push({
      id: `e-parent-${parent.id}-${owner.id}`,
      source: parent.id, target: owner.id,
      type: 'smoothstep',
      style: { stroke: '#9CA3AF', strokeWidth: 3.5 },
    });
  });

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
      style: { stroke: '#9CA3AF', strokeWidth: 3.5 },
      labelStyle: { fontSize: 16, fill: labelFg, fontWeight: 800, letterSpacing: 0.6 },
      labelBgStyle: { fill: labelBg, fillOpacity: 1 },
      labelBgPadding: [10, 6],
      labelBgBorderRadius: 7,
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
        style: { stroke: '#9CA3AF', strokeWidth: 3.5 },
      });
    });
  }

  return { nodes, edges };
}

function FocusedDiagramInner({ focusId, members, onPick, highlightedId }: Props) {
  const theme = useMemberStore(state => state.theme);

  const { nodes: rawNodes, edges } = useMemo(
    () => buildFocusedGraph(focusId, members, theme === 'dark'),
    [focusId, members, theme],
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
        <Background color={theme === 'dark' ? '#2a2e39' : '#E2E8F0'} gap={22} size={1} />
        <Controls showInteractive={false} style={{ bottom: 10, right: 10, left: 'auto', top: 'auto' }} />
      </ReactFlow>
    </div>
  );
}

export function FamilyRelationshipDiagram(props: Props) {
  return (
    <ReactFlowProvider>
      <FocusedDiagramInner {...props} />
    </ReactFlowProvider>
  );
}
