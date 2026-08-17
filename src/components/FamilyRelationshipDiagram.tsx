'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ReactNode, CSSProperties } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  Background,
  BaseEdge,
  Controls,
  Handle,
  Position,
  getSmoothStepPath,
  NodeTypes,
  EdgeTypes,
  NodeMouseHandler,
  type EdgeProps,
  useReactFlow,
  useNodesInitialized,
  type Node,
  type Edge,
} from 'reactflow';
import { getInitials } from '@/lib/memberUtils';
import { Member } from '@/lib/types';
import { photoOf, dispName, isDead, displayAcno, displayMember, isPendingAcno } from '@/lib/quotaTreeLayout';
import {
  getFamilyIndex, findMember, familyParents, familySpouses, familySiblings,
  familyChildren, childCaption, parentCaption, siblingCaption, sortParents,
  type ResolvedNode,
} from '@/lib/familyIndex';
import { useMemberStore } from '@/store/memberStore';
import styles from './styles/FamilyRelationshipDiagram.module.css';

interface Props {
  focusId: string;
  members: Member[];
  onPick: (id: string) => void;
  highlightedId?: string | null;
}

// ─── Family Relationship tab: owner + spouse + direct children (React Flow) ──

const FAM_CARD_W = 345;
// the card's REAL rendered height (.card in the stylesheet is fixed to this),
// so union points land exactly on a card edge or on the spousal line
const FAM_CARD_H = 320;
const FAM_HGAP   = 75;
const FAM_SGAP   = 150;
const FAM_VGAP   = 175;
// extra breathing room between Father/Mother, so the "SPOUSE" label on their
// connecting line has room to sit clear of both cards.
const FAM_PARENT_GAP = 230;

type FamRole = 'owner' | 'spouse' | 'child' | 'parent' | 'sibling' | 'dependent';

// Family roles read as one warm set alongside the club's gold-and-black
// chrome — the focused member carries the gold itself, everyone else takes a
// muted earth tone that still separates the roles at a glance.
const FAM_ROLE_STYLE: Record<FamRole, { border: string; bg: string; bgHover: string; bgNight: string; bgNightHover: string }> = {
  owner:     { border: '#B8912F', bg: '#FDF6E3', bgHover: '#F6E8C3', bgNight: '#251E0D', bgNightHover: '#352A12' },
  spouse:    { border: '#A4565F', bg: '#FCF1F1', bgHover: '#F7E1E2', bgNight: '#261617', bgNightHover: '#361F21' },
  child:     { border: '#6E7A3A', bg: '#F5F7E9', bgHover: '#E9EED3', bgNight: '#1B1E10', bgNightHover: '#282D17' },
  parent:    { border: '#5A5346', bg: '#F6F3EC', bgHover: '#EAE4D7', bgNight: '#1E1C17', bgNightHover: '#2B2820' },
  sibling:   { border: '#3F6B6B', bg: '#EEF6F6', bgHover: '#DCECEC', bgNight: '#12201F', bgNightHover: '#1B2E2D' },
  dependent: { border: '#B2662A', bg: '#FDF3E8', bgHover: '#F8E5CE', bgNight: '#271A0E', bgNightHover: '#372414' },
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
      {/* Connection points on all four edges, like the Member Relationship
          cards — every edge below names the exact handle it starts and ends
          on, so lines meet the card on a dot instead of near a corner. */}
      <Handle id="top"       type="target" position={Position.Top}    isConnectable={false} className={styles.handleDot} />
      <Handle id="bottom"    type="source" position={Position.Bottom} isConnectable={false} className={styles.handleDot} />
      <Handle id="left-in"   type="target" position={Position.Left}   isConnectable={false} className={styles.handleDot} />
      <Handle id="left-out"  type="source" position={Position.Left}   isConnectable={false} className={styles.handleDot} />
      <Handle id="right-in"  type="target" position={Position.Right}  isConnectable={false} className={styles.handleDot} />
      <Handle id="right-out" type="source" position={Position.Right}  isConnectable={false} className={styles.handleDot} />

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
            '--avatar-image': photo ? `url("${photo}")` : 'none',
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

      {(caption || quotaRef) && (
        <div className={styles.captionBlock}>
          {caption && (
            <div className={styles.caption} style={{ '--caption-color': border } as CSSProperties}>
              {caption}
            </div>
          )}
          {quotaRef && <div className={styles.quotaRef}>{quotaRef}</div>}
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

// How far above the row it feeds the horizontal "bus" of a fan-out sits.
const FAM_BUS_LIFT = 70;

/**
 * Fan-out connector (parents → children, couple → children).
 *
 * The stock smooth-step edge turns at the midpoint between its two ends, and
 * since a union point sits ON the spousal line — level with the middle of the
 * cards — that midpoint lands within a few pixels of the cards' bottom edge,
 * dragging the horizontal run right through the captions underneath them.
 * Placing the turn a fixed distance above the row it feeds keeps that run in
 * clear space, and keeps every fan-out in the diagram at the same height.
 */
function FamBusEdge({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition, style }: EdgeProps) {
  const [path] = getSmoothStepPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
    borderRadius: 14,
    centerY: targetY - FAM_BUS_LIFT,
  });
  return <BaseEdge path={path} style={style} />;
}

const famNodeTypes: NodeTypes = { card: FamCard, union: FamUnion };
const famEdgeTypes: EdgeTypes = { bus: FamBusEdge };

// ─── The family layout: parents → siblings + self + spouse(s) → children ─────
//
// Blood relationships only, for EVERY member (core or dependent), straight
// off the shared family index — see src/lib/familyIndex.ts for how a
// "Daughter of DH-3" row parked in DA-27's 4(d) quota ends up in DH-3's
// family here and not in DA-27's. The quota view (who sits on whose
// membership) is the Member Relationship tab's job, not this one's.
//
// The children row is the union of BOTH spouses' children, gathered from
// wherever in the data each child was mentioned — so searching either half
// of a couple shows the same, complete family.
function buildFamilyGraph(focusId: string, members: Member[], dark: boolean): { nodes: Node[]; edges: Edge[] } {
  const index = getFamilyIndex(members);
  const owner = findMember(index, focusId);
  if (!owner) return { nodes: [], edges: [] };

  const labelFg = dark ? '#EDE7D9' : '#3A3427';
  const labelBg = dark ? '#2A2418' : '#EFE7D5';

  // One card per person: whoever is claimed by two roles keeps the closest
  // one (self → spouse → parent → sibling → child), so React Flow never gets
  // a duplicate node id out of contradictory source rows.
  const used = new Set<string>([owner.id]);
  const take = (entries: ResolvedNode[]) => entries.filter(e => {
    if (used.has(e.member.id)) return false;
    used.add(e.member.id);
    return true;
  });

  const spouses     = take(familySpouses(index, owner.id));
  const parents     = sortParents(take(familyParents(index, owner.id)), owner);
  const siblingsAll = take(familySiblings(index, owner.id));
  const children    = take(familyChildren(index, owner.id));

  // this couple's own ids — a child sponsored from outside it gets a note
  const coupleIds = new Set([owner.id, ...spouses.map(sp => sp.member.id)]);

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
      data: { member: displayMember(entry), role: 'parent' as FamRole, caption: parentCaption(entry, owner), onPick: undefined },
    });
  });

  if (parents.length > 1) {
    edges.push({
      id: `e-parentpair-${owner.id}`,
      source: parents[0].member.id, sourceHandle: 'right-out',
      target: parents[1].member.id, targetHandle: 'left-in',
      type: 'straight', label: 'SPOUSE',
      style: { stroke: '#A89C82', strokeWidth: 3.5 },
      labelStyle: { fontSize: 16, fill: labelFg, fontWeight: 800, letterSpacing: 0.6 },
      labelBgStyle: { fill: labelBg, fillOpacity: 1 },
      labelBgPadding: [10, 6],
      labelBgBorderRadius: 7,
    });
  }

  // parents → union → (siblings + owner) fan-out. The spouse is not a blood
  // child of these parents, so they're excluded here — they get their own
  // straight "SPOUSE" line to the owner instead, below. The union sits AT the
  // parent-pair connecting line's own height (card vertical center) when there
  // are two parents — same trick the children union uses for the owner-spouse
  // line — so the downward fan-out visibly branches off that line instead of
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
    [...siblingsLeft.map(e => e.member.id), ...siblingsRight.map(e => e.member.id), owner.id].forEach(targetId => {
      edges.push({
        id: `e-parentfan-${owner.id}-${targetId}`,
        source: parentUnionId, sourceHandle: 'bottom',
        target: targetId, targetHandle: 'top',
        type: 'bus',
        style: { stroke: '#A89C82', strokeWidth: 3.5 },
      });
    });
  }

  siblingsLeft.forEach((entry, i) => {
    nodes.push({
      id: entry.member.id, type: 'card', position: { x: siblingLeftXs[i], y: row1Y },
      data: { member: displayMember(entry), role: 'sibling' as FamRole, caption: siblingCaption(entry), onPick: undefined },
    });
  });
  siblingsRight.forEach((entry, i) => {
    nodes.push({
      id: entry.member.id, type: 'card', position: { x: siblingRightXs[i], y: row1Y },
      data: { member: displayMember(entry), role: 'sibling' as FamRole, caption: siblingCaption(entry), onPick: undefined },
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
      style: { stroke: '#A89C82', strokeWidth: 3.5 },
      labelStyle: { fontSize: 16, fill: labelFg, fontWeight: 800, letterSpacing: 0.6 },
      labelBgStyle: { fill: labelBg, fillOpacity: 1 },
      labelBgPadding: [10, 6],
      labelBgBorderRadius: 7,
    });
  });

  // ── bottom row: this couple's children ──
  if (children.length > 0) {
    const unionId = `union-${owner.id}`;
    const unionX = spouses.length > 0 ? ownerBlockCenterX : ownerX + FAM_CARD_W / 2;
    const unionY = spouses.length > 0 ? row1Y + FAM_CARD_H / 2 : row1Y + FAM_CARD_H;
    nodes.push({
      id: unionId, type: 'union', position: { x: unionX, y: unionY },
      data: { labelOffsetY: (row2Y - unionY) * 0.4 }, style: { width: 1, height: 1 },
    });

    const botW = children.length * FAM_CARD_W + (children.length - 1) * FAM_HGAP;
    const childX0 = ownerBlockCenterX - botW / 2;

    children.forEach((entry, i) => {
      const c = entry.member;
      const cx = childX0 + i * (FAM_CARD_W + FAM_HGAP);
      // Blood child either way — but their membership can sit on someone
      // else's quota (a grandparent's, an uncle's). Say so, since the card's
      // A4D/Associate badge alone doesn't tell you whose quota it is.
      const sponsor = c.pid && !coupleIds.has(c.pid) ? findMember(index, c.pid) : undefined;
      nodes.push({
        id: c.id, type: 'card', position: { x: cx, y: row2Y },
        data: {
          member: displayMember(entry),
          role: 'child' as FamRole,
          badge: c.via === 'a4d' ? 'A4D' : c.via === 'associate' ? 'Associate' : undefined,
          caption: childCaption(entry),
          quotaRef: sponsor && !isPendingAcno(sponsor.id)
            ? `Membership via ${dispName(sponsor)} (${sponsor.id})`
            : undefined,
          onPick: undefined,
        },
      });
      edges.push({
        id: `e-child-${owner.id}-${c.id}`,
        source: unionId, sourceHandle: 'bottom',
        target: c.id, targetHandle: 'top',
        type: 'bus',
        style: { stroke: '#A89C82', strokeWidth: 3.5 },
      });
    });
  }

  return { nodes, edges };
}

function FocusedDiagramInner({ focusId, members, onPick, highlightedId }: Props) {
  const theme = useMemberStore(state => state.theme);

  // One layout for everyone — core members and dependents alike resolve
  // through the same family index, so clicking a child never switches to a
  // differently-shaped view of the same family.
  const { nodes: rawNodes, edges } = useMemo(
    () => buildFamilyGraph(focusId, members, theme === 'dark'),
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
    rf.fitView({ padding: 0.16, minZoom: 0.08, maxZoom: 1.4, duration: 300 });
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
        edgeTypes={famEdgeTypes}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        onNodeClick={handleNodeClick}
        /* skip DOM work for cards scrolled out of view — a wide family row
           with photos is otherwise mounted in full even when only two cards
           are on screen */
        onlyRenderVisibleElements
        panOnScroll
        minZoom={0.08}
        maxZoom={2}
      >
        <Background color={theme === 'dark' ? '#322C1E' : '#E3D9C2'} gap={22} size={1} />
        {/* top-right: within reach of the cursor while reading the tree,
            instead of buried at the bottom-left corner of a tall canvas */}
        <Controls showInteractive={false} position="top-right" className={styles.controls} />
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
