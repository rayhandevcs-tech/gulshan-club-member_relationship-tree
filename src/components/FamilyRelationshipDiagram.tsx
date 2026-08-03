'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ReactNode, CSSProperties } from 'react';
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
import { photoOf, dispName, isDead, displayAcno, nodesOfKind, getRefFromRelation, displayMember } from '@/lib/quotaTreeLayout';
import { useMemberStore } from '@/store/memberStore';
import styles from './FamilyRelationshipDiagram.module.css';

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
// core-focused layout only (buildCoreFamilyGraph): extra breathing room
// between Father/Mother, so the "SPOUSE" label on their connecting line
// has room to sit clear of both cards.
const FAM_PARENT_GAP = 230;

type FamRole = 'owner' | 'spouse' | 'child' | 'parent' | 'sibling' | 'dependent';

const FAM_ROLE_STYLE: Record<FamRole, { border: string; bg: string; bgHover: string; bgNight: string; bgNightHover: string }> = {
  owner:     { border: '#0F766E', bg: '#F0FDFA', bgHover: '#CCFBF1', bgNight: '#0D211E', bgNightHover: '#123830' },
  spouse:    { border: '#BE185D', bg: '#FDF2F8', bgHover: '#FCE7F3', bgNight: '#2B131F', bgNightHover: '#3A1A2A' },
  child:     { border: '#6D28D9', bg: '#F5F3FF', bgHover: '#EDE9FE', bgNight: '#211A3D', bgNightHover: '#2D2454' },
  parent:    { border: '#1D4ED8', bg: '#EFF6FF', bgHover: '#DBEAFE', bgNight: '#111E3D', bgNightHover: '#17294F' },
  // core-focused layout only (buildCoreFamilyGraph): siblings row + the
  // combined Children/A4D/Associate row's dependent (A4D/Associate) cards.
  sibling:   { border: '#0891B2', bg: '#ECFEFF', bgHover: '#CFFAFE', bgNight: '#083344', bgNightHover: '#0E4A5C' },
  dependent: { border: '#C2410C', bg: '#FFF7ED', bgHover: '#FFEDD5', bgNight: '#2B1607', bgNightHover: '#3D200B' },
};

interface FamCardData {
  member: Member;
  role: FamRole;
  badge?: string;       // small kind pill (e.g. "A4D", "Associate") — dependent role only
  caption?: ReactNode;
  quotaRef?: ReactNode;
  onPick: (id: string) => void;
  highlighted?: boolean;
}

function FamCard({ data }: { data: FamCardData }) {
  const { member: m, role, badge, caption, quotaRef, onPick, highlighted } = data;
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
    <div className={styles.wrapper}>
      <Handle type="target" position={Position.Top} isConnectable={false} className={styles.handleDot} />
      <Handle id="right-out" type="source" position={Position.Right} isConnectable={false} className={styles.handleDot} />
      <Handle id="left-in" type="target" position={Position.Left} isConnectable={false} className={styles.handleDot} />

      <button
        onClick={e => { e.stopPropagation(); onPick(m.id); }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={`${styles.card}${highlighted ? ' search-highlight-card' : ''}`}
        style={{
          '--border': border,
          '--bg': hovered ? bgHover : bg,
          '--card-shadow': hovered ? `0 14px 28px -4px rgba(0,0,0,0.2), 0 0 0 3px ${border}2e` : '0 1px 4px rgba(0,0,0,0.06)',
          '--card-transform': hovered ? 'translateY(-4px) scale(1.015)' : 'none',
        } as CSSProperties}
      >
        {badge && (
          <div
            className={styles.badge}
            style={{ '--border': border, '--badge-bg': `${border}22` } as CSSProperties}
          >
            {badge}
          </div>
        )}
        <div
          className={styles.avatar}
          style={{
            '--border': border,
            '--avatar-image': photo ? `url(${photo})` : 'none',
            '--avatar-shadow': hovered ? '0 3px 10px rgba(0,0,0,0.18)' : 'none',
          } as CSSProperties}
        >
          {!photo && getInitials(name)}
        </div>
        <div className={styles.name}>
          {name}
        </div>
        <div
          className={styles.acno}
          style={{ '--acno-bg': `${border}2e`, '--acno-border': `${border}55` } as CSSProperties}
        >
          {displayAcno(m.id)}
        </div>
        {m.since && (
          <div className={styles.joined}>
            Joined {m.since}
          </div>
        )}
        {isDead(m) && (
          <span className={styles.deceased}>
            Deceased
          </span>
        )}
      </button>

      {caption && (
        <div className={styles.caption} style={{ '--caption-color': border } as CSSProperties}>
          {caption}
        </div>
      )}
      {quotaRef && (
        <div className={styles.quotaRef}>
          {quotaRef}
        </div>
      )}
    </div>
  );
}

function FamUnion({ data }: { data: { labelOffsetY?: number } }) {
  return (
    <div className={styles.unionWrapper}>
      <Handle id="bottom" type="source" position={Position.Bottom} isConnectable={false} className={styles.unionHandle} />
      <span
        className={styles.unionLabel}
        style={{ '--union-label-top': `${data.labelOffsetY ?? 40}px` } as CSSProperties}
      >
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

// ─── Core-member layout: parents → siblings+self+spouse(s) → children/A4D/
// Associate — built straight off the focused member's own raw `nodes` list
// (see src/lib/types.ts) instead of scanning the flat array. Non-core focus
// members have no `.nodes` and keep using buildFocusedGraph above,
// unchanged.
function buildCoreFamilyGraph(focusId: string, members: Member[], dark: boolean): { nodes: Node[]; edges: Edge[] } {
  const owner = members.find(m => m.id === focusId);
  if (!owner) return { nodes: [], edges: [] };

  const labelFg = dark ? '#e5e7eb' : '#374151';
  const labelBg = dark ? '#2a2e39' : '#E5E7EB';

  const parents = nodesOfKind(owner, members, ['Parent']);
  const siblingsAll = nodesOfKind(owner, members, ['Siblings']);
  const spouses = nodesOfKind(owner, members, ['Spouse']);
  const spouseIds = new Set(spouses.map(s => s.member.id));
  // A spouse who also carries her own A4D node (the PS-295-style overlap)
  // must not double-render in the bottom row too.
  const bottomEntries = nodesOfKind(owner, members, ['Children', 'A4D', 'Associate'])
    .filter(({ member }) => !spouseIds.has(member.id));

  // sketch groups siblings 2-left/1-right for an odd count — larger half left
  const leftCount = Math.ceil(siblingsAll.length / 2);
  const siblingsLeft = siblingsAll.slice(0, leftCount);
  const siblingsRight = siblingsAll.slice(leftCount);

  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // ── middle row: siblingsLeft | owner | spouse(s) | siblingsRight ──
  let cursor = 0;
  const place = () => { const x = cursor; cursor += FAM_CARD_W; return x; };
  const gap = (g: number) => { if (cursor > 0) cursor += g; };

  const siblingLeftXs = siblingsLeft.map(() => { gap(FAM_HGAP); return place(); });
  gap(FAM_HGAP);
  const ownerX = place();
  const spouseXs = spouses.map((_, i) => { gap(i === 0 ? FAM_SGAP : FAM_HGAP); return place(); });
  const siblingRightXs = siblingsRight.map(() => { gap(FAM_HGAP); return place(); });

  const row1Y = 0;
  const row2Y = row1Y + FAM_CARD_H + FAM_VGAP;
  const parentRowY = row1Y - FAM_CARD_H - FAM_VGAP;

  const ownerBlockMaxX = (spouseXs[spouseXs.length - 1] ?? ownerX) + FAM_CARD_W;
  const ownerBlockCenterX = (ownerX + ownerBlockMaxX) / 2;

  // ── parents row — centered on the owner alone; siblings/spouse hang off
  // the fan-out/spouse-line below, not the parents' own alignment ──
  const parentsRowW = parents.length * FAM_CARD_W + Math.max(parents.length - 1, 0) * FAM_PARENT_GAP;
  const parentsStartX = ownerX + FAM_CARD_W / 2 - parentsRowW / 2;

  parents.forEach((entry, i) => {
    const px = parentsStartX + i * (FAM_CARD_W + FAM_PARENT_GAP);
    nodes.push({
      id: entry.member.id, type: 'card', position: { x: px, y: parentRowY },
      data: { member: displayMember(entry), role: 'parent' as FamRole, caption: entry.relation, onPick: undefined },
    });
  });

  if (parents.length > 1) {
    edges.push({
      id: `e-parentpair-${owner.id}`,
      source: parents[0].member.id, sourceHandle: 'right-out',
      target: parents[1].member.id, targetHandle: 'left-in',
      type: 'straight', label: 'SPOUSE',
      style: { stroke: '#9CA3AF', strokeWidth: 3.5 },
      labelStyle: { fontSize: 16, fill: labelFg, fontWeight: 800, letterSpacing: 0.6 },
      labelBgStyle: { fill: labelBg, fillOpacity: 1 },
      labelBgPadding: [10, 6],
      labelBgBorderRadius: 7,
    });
  }

  // parents → union → (siblings + owner) fan-out. Spouse is not a blood
  // child of these parents, so it's excluded here — it gets its own
  // straight "SPOUSE" line to the owner instead, below. The union sits
  // AT the parent-pair connecting line's own height (card vertical
  // center) when there are two parents — same trick the bottom
  // children/A4D/Associate union already uses for the owner-spouse line —
  // so the downward fan-out visibly branches off that line instead of
  // floating disconnected below the cards.
  if (parents.length > 0) {
    const parentUnionId = `union-parents-${owner.id}`;
    const parentUnionX = parents.length > 1 ? parentsStartX + parentsRowW / 2 : parentsStartX + FAM_CARD_W / 2;
    const parentUnionY = parents.length > 1 ? parentRowY + FAM_CARD_H / 2 : parentRowY + FAM_CARD_H;
    nodes.push({
      id: parentUnionId, type: 'union',
      position: { x: parentUnionX, y: parentUnionY },
      data: { labelOffsetY: (row1Y - parentUnionY) * 0.4 }, style: { width: 1, height: 1 },
    });
    [...siblingsLeft, ...siblingsRight, { member: owner }].forEach(({ member: target }) => {
      edges.push({
        id: `e-parentfan-${owner.id}-${target.id}`,
        source: parentUnionId, sourceHandle: 'bottom', target: target.id,
        type: 'smoothstep',
        style: { stroke: '#9CA3AF', strokeWidth: 3.5 },
      });
    });
  }

  siblingsLeft.forEach((entry, i) => {
    nodes.push({
      id: entry.member.id, type: 'card', position: { x: siblingLeftXs[i], y: row1Y },
      data: { member: displayMember(entry), role: 'sibling' as FamRole, caption: entry.relation, onPick: undefined },
    });
  });
  siblingsRight.forEach((entry, i) => {
    nodes.push({
      id: entry.member.id, type: 'card', position: { x: siblingRightXs[i], y: row1Y },
      data: { member: displayMember(entry), role: 'sibling' as FamRole, caption: entry.relation, onPick: undefined },
    });
  });

  nodes.push({
    id: owner.id, type: 'card', position: { x: ownerX, y: row1Y },
    data: { member: owner, role: 'owner' as FamRole, onPick: undefined },
  });

  spouses.forEach((entry, i) => {
    nodes.push({
      id: entry.member.id, type: 'card', position: { x: spouseXs[i], y: row1Y },
      data: { member: displayMember(entry), role: 'spouse' as FamRole, onPick: undefined },
    });
    edges.push({
      id: `e-spouse-${owner.id}-${entry.member.id}`,
      source: owner.id, sourceHandle: 'right-out',
      target: entry.member.id, targetHandle: 'left-in',
      type: 'straight', label: 'SPOUSE',
      style: { stroke: '#9CA3AF', strokeWidth: 3.5 },
      labelStyle: { fontSize: 16, fill: labelFg, fontWeight: 800, letterSpacing: 0.6 },
      labelBgStyle: { fill: labelBg, fillOpacity: 1 },
      labelBgPadding: [10, 6],
      labelBgBorderRadius: 7,
    });
  });

  // ── bottom row: Children + A4D + Associate, combined ──
  if (bottomEntries.length > 0) {
    const unionId = `union-${owner.id}`;
    const unionX = spouses.length > 0 ? ownerBlockCenterX : ownerX + FAM_CARD_W / 2;
    const unionY = spouses.length > 0 ? row1Y + FAM_CARD_H / 2 : row1Y + FAM_CARD_H;
    const labelOffsetY = (row2Y - unionY) * 0.4;
    nodes.push({
      id: unionId, type: 'union', position: { x: unionX, y: unionY },
      data: { labelOffsetY }, style: { width: 1, height: 1 },
    });

    const botW = bottomEntries.length * FAM_CARD_W + (bottomEntries.length - 1) * FAM_HGAP;
    const childX0 = ownerBlockCenterX - botW / 2;

    bottomEntries.forEach((entry, i) => {
      const c = entry.member;
      const cx = childX0 + i * (FAM_CARD_W + FAM_HGAP);
      const isDependent = c.via === 'a4d' || c.via === 'associate';
      nodes.push({
        id: c.id, type: 'card', position: { x: cx, y: row2Y },
        data: {
          member: displayMember(entry),
          role: (isDependent ? 'dependent' : 'child') as FamRole,
          badge: c.via === 'a4d' ? 'A4D' : c.via === 'associate' ? 'Associate' : undefined,
          caption: getRefFromRelation(entry.relation),
          onPick: undefined,
        },
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

  const { nodes: rawNodes, edges } = useMemo(() => {
    const owner = members.find(m => m.id === focusId);
    // Core members (their own `.nodes` present) get the new parents/
    // siblings+spouse/children+A4D+Associate layout, sourced straight from
    // their raw node list. Non-core members keep today's layout, unchanged.
    return owner?.nodes
      ? buildCoreFamilyGraph(focusId, members, theme === 'dark')
      : buildFocusedGraph(focusId, members, theme === 'dark');
  }, [focusId, members, theme]);

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
    <div className={styles.flowContainer}>
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
        <Controls showInteractive={false} className={styles.controls} />
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
