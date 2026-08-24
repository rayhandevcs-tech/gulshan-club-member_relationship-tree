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
import { photoOf, dispName, isDead, isInactive, displayAcno, displayMember, isPendingAcno } from '@/lib/quotaTreeLayout';
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
// spouse cards sit further apart than siblings do: the SPOUSE pill goes
// between them, and the couple's "Children" stem drops from the midpoint of
// that same line
const FAM_SGAP   = 235;
const FAM_VGAP   = 175;
// extra breathing room between Father/Mother, so the "SPOUSE" label on their
// connecting line has room to sit clear of both cards.
const FAM_PARENT_GAP = 230;

// ── attachment cards ────────────────────────────────────────────────────────
// A person on this diagram can carry nodes of their own (the API's ChildNode
// on the row that named them): a spouse, an account transfer, dependents.
// Those are drawn as compact cards hanging off the card they belong to —
// deliberately smaller than a full one, so a second level reads as detail
// about somebody in the family rather than as another member of it.
const ATT_W    = 260;
const ATT_H    = 118;
const ATT_GAP  = 34;    // between attachments sharing a row
const ATT_SIDE = 130;   // card → attachment beside it (the edge is labelled)
const ATT_DROP = 74;    // card's bottom edge → the attachments under it

type AttachKind = 'spouse' | 'transfer' | 'a4d' | 'assoc' | 'child';

interface Attachment {
  member: Member;
  label: string;
  kind: AttachKind;
}

type FamRole = 'owner' | 'spouse' | 'child' | 'parent' | 'sibling' | 'dependent';

interface Cluster {
  member: Member;
  role: FamRole;
  sides: Attachment[];    // spouse / transfer — beside the card
  below: Attachment[];    // dependents — under it
  width: number;          // the whole block, so neighbours can clear it
  cardOffset: number;     // where the card sits inside that block
  belowOffset: number;
  caption?: ReactNode;
  quotaRef?: ReactNode;
  badge?: string;
}

const ATTACH_COLOR: Record<AttachKind, string> = {
  spouse:   '#A4565F',
  transfer: '#C99A2E',
  a4d:      '#8A5CC2',
  assoc:    '#B2662A',
  child:    '#6E7A3A',
};

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

const FAM_INACTIVE_STYLE = {
  border: '#A79C84', bg: '#F2EFE7', bgHover: '#E8E3D6',
  bgNight: '#1B1913', bgNightHover: '#26231A',
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
  // A closed account (API Status "N") loses its role colour — the tint says
  // "this is your spouse / your child", and a closed account should read as
  // set aside rather than as a live part of the family.
  const roleStyle = isInactive(m) ? FAM_INACTIVE_STYLE : FAM_ROLE_STYLE[role];
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
        {isInactive(m) && (
          <span className={styles.inactiveTag}>
            Inactive A/C
          </span>
        )}
      </button>

      {(caption || quotaRef) && (
        <div className={styles.captionBlock}>
          {caption && (
            <div
              // A parent's caption is nudged off centre: the union stem for
              // the generation below starts at this card's bottom centre and
              // labels itself there, and the two were sitting on top of each
              // other.
              className={`${styles.caption}${role === 'parent' ? ` ${styles.captionOffCentre}` : ''}`}
              style={{ '--caption-color': border } as CSSProperties}
            >
              {caption}
            </div>
          )}
          {quotaRef && <div className={styles.quotaRef}>{quotaRef}</div>}
        </div>
      )}
    </div>
  );
}

interface FamAttachData {
  member: Member;
  label: string;
  kind: AttachKind;
  onPick: (id: string) => void;
  highlighted?: boolean;
}

function FamAttachCard({ data }: { data: FamAttachData }) {
  const { member: m, label, kind, onPick, highlighted } = data;
  const theme = useMemberStore(state => state.theme);
  const dark = theme === 'dark';
  const [hovered, setHovered] = useState(false);
  const inactive = isInactive(m);
  const border = inactive ? '#A79C84' : ATTACH_COLOR[kind];
  const name = dispName(m);
  const photo = photoOf(m);

  return (
    <div className={styles.attachWrapper}>
      <Handle id="top"      type="target" position={Position.Top}    isConnectable={false} className={styles.handleDot} />
      <Handle id="left-in"  type="target" position={Position.Left}   isConnectable={false} className={styles.handleDot} />
      <Handle id="right-in" type="target" position={Position.Right}  isConnectable={false} className={styles.handleDot} />
      <Handle id="bottom"   type="source" position={Position.Bottom} isConnectable={false} className={styles.handleDot} />

      <button
        onClick={e => { e.stopPropagation(); onPick(m.id); }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={`${styles.attachCard}${highlighted ? ' search-highlight-card' : ''}`}
        style={{
          '--border': border,
          '--bg': dark ? `${border}1f` : `${border}14`,
          '--attach-shadow': hovered ? `0 8px 18px -6px rgba(0,0,0,0.3), 0 0 0 2px ${border}33` : '0 1px 3px rgba(0,0,0,0.07)',
          '--attach-transform': hovered ? 'translateY(-2px)' : 'none',
          '--attach-opacity': inactive ? 0.85 : 1,
        } as CSSProperties}
      >
        <div
          className={styles.attachAvatar}
          style={{
            '--border': border,
            '--avatar-image': photo ? `url("${photo}")` : 'none',
          } as CSSProperties}
        >
          {!photo && getInitials(name)}
        </div>
        <div className={styles.attachInfo}>
          <div className={styles.attachName}>{name}</div>
          <div className={styles.attachMeta}>
            <span className={styles.attachAcno} style={{ '--border': border } as CSSProperties}>
              {displayAcno(m.id)}
            </span>
            <span className={styles.attachLabel} style={{ '--border': border } as CSSProperties}>
              {label}
            </span>
          </div>
          {inactive && <div className={styles.attachInactive}>Inactive A/C</div>}
        </div>
      </button>
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

const famNodeTypes: NodeTypes = { card: FamCard, attach: FamAttachCard, union: FamUnion };
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

  // ── attachments: the ChildNode list a row carried ───────────────────────
  // These belong to the person on THIS card, not to the focused member — so
  // they hang off their card instead of joining a row of their own: a spouse
  // or an account transfer beside them, dependents underneath.
  const attachmentsOf = (entry: ResolvedNode | null): { sides: Attachment[]; below: Attachment[] } => {
    const sides: Attachment[] = [];
    const below: Attachment[] = [];
    entry?.inner?.forEach(n => {
      const member = findMember(index, n.acno);
      // Already drawn as a card of its own — showing it twice would imply
      // two different people.
      if (!member || used.has(member.id)) return;

      const shown = { ...member, name: n.name || member.name, photoUrl: n.photoUrl ?? member.photoUrl };
      switch (n.node) {
        case 'Spouse':
          sides.push({ member: shown, label: 'Spouse', kind: 'spouse' });
          return;
        case 'Transfer':
          sides.push({ member: shown, label: 'A/C Transfer', kind: 'transfer' });
          return;
        case 'A4D':
          below.push({ member: shown, label: n.relation || 'A4D', kind: 'a4d' });
          return;
        case 'Associate':
          below.push({ member: shown, label: n.relation || 'Associate', kind: 'assoc' });
          return;
        case 'Children':
          below.push({ member: shown, label: n.relation || 'Child', kind: 'child' });
          return;
        default:
          // Parent/Siblings inside a row describe the focused member's own
          // generation, which this diagram already lays out properly.
          return;
      }
    });
    return { sides, below };
  };

  // A card plus whatever hangs off it, measured as one block so neighbours
  // can be spaced around the whole thing rather than around the card alone.
  const toCluster = (
    entry: ResolvedNode | null,
    member: Member,
    role: FamRole,
    extra: { caption?: ReactNode; quotaRef?: ReactNode; badge?: string } = {},
  ): Cluster => {
    const { sides, below } = attachmentsOf(entry);
    const sideExtra = sides.length ? ATT_SIDE + ATT_W : 0;
    const belowW = below.length ? below.length * ATT_W + (below.length - 1) * ATT_GAP : 0;
    const cardBlock = FAM_CARD_W + sideExtra;
    const width = Math.max(cardBlock, belowW);
    return {
      member, role, sides, below, width,
      caption: extra.caption, quotaRef: extra.quotaRef, badge: extra.badge,
      cardOffset: (width - cardBlock) / 2,
      belowOffset: (width - belowW) / 2,
    };
  };

  const nodes: Node[] = [];
  const edges: Edge[] = [];

  /** Draws a cluster with its card's left edge at `x`, top at `y`. */
  const placeCluster = (c: Cluster, x: number, y: number): number => {
    const cardX = x + c.cardOffset;
    nodes.push({
      id: c.member.id, type: 'card', position: { x: cardX, y },
      data: { member: c.member, role: c.role, caption: c.caption, quotaRef: c.quotaRef, badge: c.badge, onPick: undefined },
    });

    // beside: stacked and centred against the card's own height
    const sideBlockH = c.sides.length * ATT_H + Math.max(c.sides.length - 1, 0) * 12;
    c.sides.forEach((att, i) => {
      const id = `att-${c.member.id}-${att.member.id}`;
      nodes.push({
        id, type: 'attach',
        position: {
          x: cardX + FAM_CARD_W + ATT_SIDE,
          y: y + (FAM_CARD_H - sideBlockH) / 2 + i * (ATT_H + 12),
        },
        data: { member: att.member, label: att.label, kind: att.kind, onPick: undefined },
      });
      edges.push({
        id: `e-${id}`,
        source: c.member.id, sourceHandle: 'right-out',
        target: id, targetHandle: 'left-in',
        type: 'straight',
        label: att.label,
        style: { stroke: att.kind === 'transfer' ? '#C99A2E' : '#A89C82', strokeWidth: 3 },
        labelStyle: { fontSize: 15, fill: labelFg, fontWeight: 700 },
        labelBgStyle: { fill: labelBg, fillOpacity: 1 },
        labelBgPadding: [8, 5],
        labelBgBorderRadius: 6,
      });
    });

    // underneath: this person's own dependents
    c.below.forEach((att, i) => {
      const id = `att-${c.member.id}-${att.member.id}`;
      nodes.push({
        id, type: 'attach',
        position: { x: x + c.belowOffset + i * (ATT_W + ATT_GAP), y: y + FAM_CARD_H + ATT_DROP },
        data: { member: att.member, label: att.label, kind: att.kind, onPick: undefined },
      });
      edges.push({
        id: `e-${id}`,
        source: c.member.id, sourceHandle: 'bottom',
        target: id, targetHandle: 'top',
        type: 'smoothstep',
        style: {
          stroke: att.kind === 'assoc' ? '#B2662A99' : att.kind === 'child' ? '#6E7A3A99' : '#8A5CC299',
          strokeWidth: 3,
          strokeDasharray: '6 4',
        },
      });
    });

    return cardX;
  };

  // ── clusters ────────────────────────────────────────────────────────────
  const ownerCluster    = toCluster(null, owner, 'owner');
  const spouseClusters  = spouses.map(e => toCluster(e, displayMember(e), 'spouse'));
  const parentClusters  = parents.map(e => toCluster(e, displayMember(e), 'parent', { caption: parentCaption(e, owner) }));
  const siblingClusters = siblingsAll.map(e => toCluster(e, displayMember(e), 'sibling', { caption: siblingCaption(e) }));
  const childClusters   = children.map(e => {
    const c = e.member;
    // Blood child either way — but their membership can sit on someone
    // else's quota (a grandparent's, an uncle's). Say so, since the card's
    // A4D/Associate badge alone doesn't tell you whose quota it is.
    const sponsor = c.pid && !coupleIds.has(c.pid) ? findMember(index, c.pid) : undefined;
    return toCluster(e, displayMember(e), 'child', {
      caption: childCaption(e),
      badge: c.via === 'a4d' ? 'A4D' : c.via === 'associate' ? 'Associate' : undefined,
      quotaRef: sponsor && !isPendingAcno(sponsor.id)
        ? `Membership via ${dispName(sponsor)} (${sponsor.id})`
        : undefined,
    });
  });

  // sketch groups siblings 2-left/1-right for an odd count — larger half left
  const leftCount = Math.ceil(siblingClusters.length / 2);
  const siblingsLeft = siblingClusters.slice(0, leftCount);
  const siblingsRight = siblingClusters.slice(leftCount);

  // A row whose cards carry dependents underneath needs the extra height, or
  // the next row's fan-out would run straight through them.
  const belowBlock = (list: Cluster[]) => (list.some(c => c.below.length) ? ATT_DROP + ATT_H + 60 : 0);

  const row1Y      = 0;
  const parentRowY = row1Y - FAM_CARD_H - FAM_VGAP - belowBlock(parentClusters);
  const row2Y      = row1Y + FAM_CARD_H + FAM_VGAP
    + belowBlock([...siblingClusters, ...spouseClusters, ownerCluster]);

  // ── middle row: siblingsLeft | owner | spouse(s) | siblingsRight ────────
  const middle: { cluster: Cluster; gapBefore: number }[] = [
    ...siblingsLeft.map(c => ({ cluster: c, gapBefore: FAM_HGAP })),
    { cluster: ownerCluster, gapBefore: FAM_HGAP },
    ...spouseClusters.map((c, i) => ({ cluster: c, gapBefore: i === 0 ? FAM_SGAP : FAM_HGAP })),
    ...siblingsRight.map(c => ({ cluster: c, gapBefore: FAM_HGAP })),
  ];

  let cursor = 0;
  const cardXs = new Map<string, number>();
  middle.forEach((cell, i) => {
    if (i > 0) cursor += cell.gapBefore;
    cardXs.set(cell.cluster.member.id, placeCluster(cell.cluster, cursor, row1Y));
    cursor += cell.cluster.width;
  });

  const ownerX = cardXs.get(owner.id) ?? 0;
  const lastSpouse = spouseClusters[spouseClusters.length - 1];
  const ownerBlockMaxX = lastSpouse
    ? (cardXs.get(lastSpouse.member.id) ?? ownerX) + FAM_CARD_W
    : ownerX + FAM_CARD_W;
  const ownerBlockCenterX = (ownerX + ownerBlockMaxX) / 2;

  spouseClusters.forEach(sp => {
    edges.push({
      id: `e-spouse-${owner.id}-${sp.member.id}`,
      source: owner.id, sourceHandle: 'right-out',
      target: sp.member.id, targetHandle: 'left-in',
      type: 'straight', label: 'SPOUSE',
      style: { stroke: '#A89C82', strokeWidth: 3.5 },
      labelStyle: { fontSize: 16, fill: labelFg, fontWeight: 800, letterSpacing: 0.6 },
      labelBgStyle: { fill: labelBg, fillOpacity: 1 },
      labelBgPadding: [10, 6],
      labelBgBorderRadius: 7,
    });
  });

  // ── parents row — centred on the owner alone; siblings/spouse hang off
  // the fan-out/spouse-line below, not the parents' own alignment ──
  if (parentClusters.length > 0) {
    const parentsRowW = parentClusters.reduce((sum, c) => sum + c.width, 0)
      + Math.max(parentClusters.length - 1, 0) * FAM_PARENT_GAP;
    let px = ownerX + FAM_CARD_W / 2 - parentsRowW / 2;
    const parentCardXs: number[] = [];
    parentClusters.forEach((c, i) => {
      if (i > 0) px += FAM_PARENT_GAP;
      parentCardXs.push(placeCluster(c, px, parentRowY));
      px += c.width;
    });

    if (parentClusters.length > 1) {
      edges.push({
        id: `e-parentpair-${owner.id}`,
        source: parentClusters[0].member.id, sourceHandle: 'right-out',
        target: parentClusters[1].member.id, targetHandle: 'left-in',
        type: 'straight', label: 'SPOUSE',
        style: { stroke: '#A89C82', strokeWidth: 3.5 },
        labelStyle: { fontSize: 16, fill: labelFg, fontWeight: 800, letterSpacing: 0.6 },
        labelBgStyle: { fill: labelBg, fillOpacity: 1 },
        labelBgPadding: [10, 6],
        labelBgBorderRadius: 7,
      });
    }

    // The union sits ON the parent-pair connecting line (a couple) or on the
    // single parent's own bottom edge, so the downward fan-out visibly
    // branches off it instead of floating below the cards.
    const parentUnionId = `union-parents-${owner.id}`;
    const parentUnionX = parentClusters.length > 1
      ? (parentCardXs[0] + parentCardXs[1] + FAM_CARD_W) / 2
      : parentCardXs[0] + FAM_CARD_W / 2;
    const parentUnionY = parentClusters.length > 1
      ? parentRowY + FAM_CARD_H / 2
      : parentRowY + FAM_CARD_H;
    nodes.push({
      id: parentUnionId, type: 'union',
      position: { x: parentUnionX, y: parentUnionY },
      data: { labelOffsetY: (row1Y - parentUnionY) * 0.4 }, style: { width: 1, height: 1 },
    });
    [...siblingClusters.map(c => c.member.id), owner.id].forEach(targetId => {
      edges.push({
        id: `e-parentfan-${owner.id}-${targetId}`,
        source: parentUnionId, sourceHandle: 'bottom',
        target: targetId, targetHandle: 'top',
        type: 'bus',
        style: { stroke: '#A89C82', strokeWidth: 3.5 },
      });
    });
  }

  // ── bottom row: this couple's children ──────────────────────────────────
  if (childClusters.length > 0) {
    const unionId = `union-${owner.id}`;
    const unionX = spouseClusters.length > 0 ? ownerBlockCenterX : ownerX + FAM_CARD_W / 2;
    const unionY = spouseClusters.length > 0 ? row1Y + FAM_CARD_H / 2 : row1Y + FAM_CARD_H;
    nodes.push({
      id: unionId, type: 'union', position: { x: unionX, y: unionY },
      data: { labelOffsetY: (row2Y - unionY) * 0.4 }, style: { width: 1, height: 1 },
    });

    const botW = childClusters.reduce((sum, c) => sum + c.width, 0)
      + Math.max(childClusters.length - 1, 0) * FAM_HGAP;
    let cx = ownerBlockCenterX - botW / 2;
    childClusters.forEach((c, i) => {
      if (i > 0) cx += FAM_HGAP;
      placeCluster(c, cx, row2Y);
      cx += c.width;
      edges.push({
        id: `e-child-${owner.id}-${c.member.id}`,
        source: unionId, sourceHandle: 'bottom',
        target: c.member.id, targetHandle: 'top',
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
    () => rawNodes.map(n => (n.type === 'card' || n.type === 'attach')
      ? {
          ...n,
          data: {
            ...n.data,
            onPick,
            highlighted: !!highlightedId && (n.data as { member?: Member }).member?.id === highlightedId,
          },
        }
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
