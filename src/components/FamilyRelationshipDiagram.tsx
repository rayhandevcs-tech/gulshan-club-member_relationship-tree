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
// The focused couple is set apart from the siblings either side of them.
// Siblings now bring their own spouses along, and without this the person
// next to the focused member could be somebody else's wife standing closer
// to them than their own.
const FAM_BRANCH_GAP = 190;

// ── inner nodes ─────────────────────────────────────────────────────────────
// A person on this diagram can carry nodes of their own (the API's ChildNode
// on the row that named them): a spouse, an account transfer, dependents.
// They are drawn as FULL cards, the same size as everyone else's — every
// person in this family is a person, and shrinking some of them made the
// diagram read as a hierarchy of importance it does not mean. Their POSITION
// carries the relationship instead, exactly as it does for the focused
// member: a spouse (or an account transfer) sits BESIDE them, and their
// children and dependents sit BELOW them.
const INNER_SIDE = 215;   // card → the card beside it (that line is labelled)
const INNER_DROP = 185;   // card's bottom edge → the cards under it
// Two people can flank a card — one right, one left. A third would have to
// reach past one of them, so anyone beyond the pair joins the row below,
// where there is room for any number.
const INNER_SIDE_LIMIT = 2;

type AttachKind = 'spouse' | 'transfer' | 'a4d' | 'assoc' | 'child';

interface Attachment {
  member: Member;
  label: string;
  kind: AttachKind;
  badge?: string;
}

// A spouse is a spouse wherever the API happens to state them. Most are
// stated as a Spouse row, but plenty arrive inside an A4D or Associate row
// — the club's quota paperwork, not a different relationship — and those
// were being seated below the person as though they were a dependent.
const SPOUSE_RELATION = /^(wife|husband|spouse)$/i;

type FamRole = 'owner' | 'spouse' | 'child' | 'parent' | 'sibling' | 'dependent' | 'transfer';

const INNER_ROLE: Record<AttachKind, FamRole> = {
  spouse:   'spouse',
  transfer: 'transfer',
  a4d:      'dependent',
  assoc:    'dependent',
  child:    'child',
};

interface Cluster {
  member: Member;
  role: FamRole;
  sides: Attachment[];    // spouse / transfer — beside the card (right, then left)
  below: Attachment[];    // children / dependents — under it
  width: number;          // the whole block, so neighbours can clear it
  cardOffset: number;     // the card's left edge inside that block
  caption?: ReactNode;
  quotaRef?: ReactNode;
  badge?: string;
}

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
  transfer:  { border: '#C99A2E', bg: '#FDF8E9', bgHover: '#F7EDCC', bgNight: '#241C09', bgNightHover: '#342810' },
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

  // ── inner nodes: the ChildNode list a row carried ───────────────────────
  // These belong to the person on THIS card, not to the focused member, so
  // they are placed around their card the same way the focused member's own
  // family is placed around theirs: spouse (and account transfer) beside,
  // children and dependents below.
  const attachmentsOf = (entry: ResolvedNode | null): { sides: Attachment[]; below: Attachment[] } => {
    const sides: Attachment[] = [];
    const below: Attachment[] = [];
    entry?.inner?.forEach(n => {
      const member = findMember(index, n.acno);
      // Already drawn elsewhere on this diagram — showing them twice would
      // imply two different people.
      if (!member || used.has(member.id)) return;

      const shown = { ...member, name: n.name || member.name, photoUrl: n.photoUrl ?? member.photoUrl };
      const relation = (n.relation ?? '').trim();

      // Which quota the account sits on is still worth saying, so a spouse
      // lifted out of an A4D row keeps that row's badge.
      const claim = (kind: AttachKind, label: string, badge?: string) => {
        used.add(member.id);
        const spouse = SPOUSE_RELATION.test(relation);
        (spouse || kind === 'spouse' || kind === 'transfer' ? sides : below)
          .push({ member: shown, label: spouse ? relation : label, kind: spouse ? 'spouse' : kind, badge });
      };

      switch (n.node) {
        case 'Spouse':    return claim('spouse',   relation || 'Spouse');
        case 'Transfer':  return claim('transfer', 'A/C Transfer');
        case 'A4D':       return claim('a4d',      relation || 'A4D',       'A4D');
        case 'Associate': return claim('assoc',    relation || 'Associate', 'Associate');
        case 'Children':  return claim('child',    relation || 'Child');
        default:
          // Parent/Siblings inside a row describe the focused member's own
          // generation, which this diagram already lays out properly.
          return;
      }
    });
    // A spouse takes the first seat — the one on the reading side, next to
    // the person — ahead of an account transfer.
    sides.sort((a, b) => Number(b.kind === 'spouse') - Number(a.kind === 'spouse'));
    // Only two can flank a card; the rest go below, where the row grows.
    return { sides: sides.slice(0, INNER_SIDE_LIMIT), below: [...below, ...sides.slice(INNER_SIDE_LIMIT)] };
  };

  // A card plus whatever hangs off it, measured as one block so neighbours
  // can be spaced around the whole thing rather than around the card alone.
  // Everything is measured out from the CARD'S CENTRE, because that is what
  // the rows above and below align to: the cards beside it reach out to one
  // side, the row under it spreads evenly to both.
  const toCluster = (
    entry: ResolvedNode | null,
    member: Member,
    role: FamRole,
    extra: { caption?: ReactNode; quotaRef?: ReactNode; badge?: string } = {},
  ): Cluster => {
    const { sides, below } = attachmentsOf(entry);
    const half      = FAM_CARD_W / 2;
    const rightArm  = sides.length > 0 ? INNER_SIDE + FAM_CARD_W : 0;
    const leftArm   = sides.length > 1 ? INNER_SIDE + FAM_CARD_W : 0;
    const belowW    = below.length ? below.length * FAM_CARD_W + (below.length - 1) * FAM_HGAP : 0;
    const reachLeft  = Math.max(half + leftArm, belowW / 2);
    const reachRight = Math.max(half + rightArm, belowW / 2);
    return {
      member, role, sides, below,
      width: reachLeft + reachRight,
      cardOffset: reachLeft - half,
      caption: extra.caption, quotaRef: extra.quotaRef, badge: extra.badge,
    };
  };

  const nodes: Node[] = [];
  const edges: Edge[] = [];

  /** Draws a cluster: its block starts at `x`, every card's top at `y`. */
  const placeCluster = (c: Cluster, x: number, y: number): number => {
    const cardX = x + c.cardOffset;
    nodes.push({
      id: c.member.id, type: 'card', position: { x: cardX, y },
      data: { member: c.member, role: c.role, caption: c.caption, quotaRef: c.quotaRef, badge: c.badge, onPick: undefined },
    });

    // beside: level with the card, so the line between them is horizontal and
    // leaves each card on its own side dot
    c.sides.forEach((att, i) => {
      const right = i === 0;
      const role = INNER_ROLE[att.kind];
      nodes.push({
        id: att.member.id, type: 'card',
        position: {
          x: right ? cardX + FAM_CARD_W + INNER_SIDE : cardX - INNER_SIDE - FAM_CARD_W,
          y,
        },
        // no caption: the line between the two cards is labelled, and saying
        // "Spouse" twice within 200px reads as two different claims
        data: { member: att.member, role, badge: att.badge, onPick: undefined },
      });
      edges.push({
        id: `e-inner-${c.member.id}-${att.member.id}`,
        source: c.member.id, sourceHandle: right ? 'right-out' : 'left-out',
        target: att.member.id, targetHandle: right ? 'left-in' : 'right-in',
        type: 'straight',
        label: att.label,
        style: { stroke: att.kind === 'transfer' ? '#C99A2E' : '#A89C82', strokeWidth: 3.5 },
        labelStyle: { fontSize: 15, fill: labelFg, fontWeight: 700 },
        labelBgStyle: { fill: labelBg, fillOpacity: 1 },
        labelBgPadding: [8, 5],
        labelBgBorderRadius: 6,
      });
    });

    // underneath: this person's own children and dependents, centred on the
    // card they belong to
    const belowW = c.below.length ? c.below.length * FAM_CARD_W + (c.below.length - 1) * FAM_HGAP : 0;
    let bx = cardX + FAM_CARD_W / 2 - belowW / 2;
    c.below.forEach(att => {
      const role = INNER_ROLE[att.kind];
      nodes.push({
        id: att.member.id, type: 'card',
        position: { x: bx, y: y + FAM_CARD_H + INNER_DROP },
        data: {
          member: att.member, role,
          caption: att.label, badge: att.badge,
          onPick: undefined,
        },
      });
      bx += FAM_CARD_W + FAM_HGAP;
      edges.push({
        id: `e-inner-${c.member.id}-${att.member.id}`,
        source: c.member.id, sourceHandle: 'bottom',
        target: att.member.id, targetHandle: 'top',
        type: 'bus',
        style: { stroke: FAM_ROLE_STYLE[role].border, strokeWidth: 3 },
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
  const belowBlock = (list: Cluster[]) => (list.some(c => c.below.length) ? INNER_DROP + FAM_CARD_H + 80 : 0);

  const row1Y      = 0;
  const parentRowY = row1Y - FAM_CARD_H - FAM_VGAP - belowBlock(parentClusters);
  const row2Y      = row1Y + FAM_CARD_H + FAM_VGAP
    + belowBlock([...siblingClusters, ...spouseClusters, ownerCluster]);

  // ── middle row: siblingsLeft | owner | spouse(s) | siblingsRight ────────
  const middle: { cluster: Cluster; gapBefore: number }[] = [
    ...siblingsLeft.map(c => ({ cluster: c, gapBefore: FAM_HGAP })),
    { cluster: ownerCluster, gapBefore: FAM_BRANCH_GAP },
    ...spouseClusters.map((c, i) => ({ cluster: c, gapBefore: i === 0 ? FAM_SGAP : FAM_HGAP })),
    ...siblingsRight.map((c, i) => ({ cluster: c, gapBefore: i === 0 ? FAM_BRANCH_GAP : FAM_HGAP })),
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
    () => rawNodes.map(n => n.type === 'card'
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
