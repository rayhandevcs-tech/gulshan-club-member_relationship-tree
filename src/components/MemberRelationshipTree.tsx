
import { useEffect, useMemo, useState } from 'react';
import type { ReactNode, CSSProperties } from 'react';
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
  getType, isDead, isInactive, dispName, photoOf, displayAcno,
  nodesOfKind, displayMember, getRefFromRelation, slotRole,
  CARD_W, CARD_H, SLOT_W, SLOT_H, BESIDE_GAP,
} from '@/lib/quotaTreeLayout';
import { getFamilyIndex, findMember } from '@/lib/familyIndex';
import type { RelationNode } from '@/lib/types';
import type { ResolvedNode } from '@/lib/relationTypes';
import { useMemberStore, type Theme } from '@/store/memberStore';
import styles from './styles/MemberRelationshipTree.module.css';


function cardColors(m: Member, theme: Theme) {
  // A closed account (API Status "N") is drained of colour whatever its
  // membership type — the type tint is about which quota an ACTIVE account
  // sits in, and repeating it here would say the wrong thing.
  if (isInactive(m)) {
    return theme === 'dark'
      ? { border: '#6E6553', avatarBg: '#4A4437', cardBg: '#1B1913', cardBgHover: '#26231A' }
      : { border: '#A79C84', avatarBg: '#8C826B', cardBg: '#F2EFE7', cardBgHover: '#E8E3D6' };
  }
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

// ── Member card ───────────────────────────────────────────────────────────────

interface MemberNodeData {
  member: Member;
  isSuccessor?: boolean;
  onPick: (id: string) => void;
  highlighted?: boolean;
  caption?: ReactNode;
}

function MemberNodeComp({ data }: { data: MemberNodeData }) {
  const { member: m, isSuccessor, onPick, highlighted, caption } = data;
  const [hovered, setHovered] = useState(false);
  const theme = useMemberStore(state => state.theme);
  const dark = theme === 'dark';
  const { border, avatarBg, cardBg, cardBgHover } = cardColors(m, theme);
  const name = dispName(m);
  const successorBg = theme === 'dark'
    ? (hovered ? '#332711' : '#241d0e')
    : (hovered ? '#fef3c7' : '#fffbeb');
  const bg = isSuccessor ? successorBg : (hovered ? cardBgHover : cardBg);

  return (
    // no fixed node width: the container hugs the card, so the left/right
    // handle dots sit ON the card border instead of floating in space
    <div className={styles.wrapper}>
      <Handle id="top"       type="target" position={Position.Top}    isConnectable={false} className={styles.handleDot} />
      <Handle id="top-out"   type="source" position={Position.Top}    isConnectable={false} className={styles.handleDot} />
      <Handle id="left-in"   type="target" position={Position.Left}   isConnectable={false} className={styles.handleDot} />
      <Handle id="right-in"  type="target" position={Position.Right}  isConnectable={false} className={styles.handleDot} />
      <Handle id="bottom"    type="source" position={Position.Bottom} isConnectable={false} className={styles.handleDot} />
      {/* offset from "bottom" so a root's own A4D/Associate line doesn't
          run down the exact same column as the "Children" stem below it */}
      <Handle id="bottom-slots" type="source" position={Position.Bottom} isConnectable={false} className={`${styles.handleDot} ${styles.handleDotOffset}`} />
      <Handle id="left-out"  type="source" position={Position.Left}   isConnectable={false} className={styles.handleDot} />
      <Handle id="right-out" type="source" position={Position.Right}  isConnectable={false} className={styles.handleDot} />

      <button
        onClick={e => { e.stopPropagation(); onPick(m.id); }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={`${styles.card}${highlighted ? ' search-highlight-card' : ''}`}
        style={{
          '--border': border,
          '--bg': bg,
          '--card-shadow': hovered ? `0 12px 26px -4px rgba(0,0,0,0.2), 0 0 0 3px ${border}2e` : '0 2px 6px rgba(0,0,0,0.08)',
          '--card-transform': hovered ? 'translateY(-3px) scale(1.015)' : 'none',
          '--card-opacity': isSuccessor ? 0.92 : 1,
        } as CSSProperties}
      >
        <div
          className={styles.avatar}
          style={{
            '--avatar-bg': avatarBg,
            '--avatar-image': photoOf(m) ? `url("${photoOf(m)}")` : 'none',
            '--avatar-border': border,
            '--avatar-shadow': hovered ? '0 3px 10px rgba(0,0,0,0.18)' : 'none',
          } as CSSProperties}
        >

          {!photoOf(m) && getInitials(name)}

        </div>

        <div className={styles.name}>
          {name}
        </div>

        <div
          className={styles.acno}
          style={{
            '--border': border,
            '--acno-bg': `${border}3d`,
            '--acno-shadow': `0 0 0 3px ${border}22`,
          } as CSSProperties}
        >{displayAcno(m.id)}</div>

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

        {m.since && (
          <div className={styles.joined}>
            Joined {m.since}
          </div>
        )}

      </button>

      {caption && (
        <div className={styles.captionWrap}>
          <span
            className={styles.captionPill}
            style={{
              '--caption-color': dark ? '#a9b6f5' : '#3730A3',
              '--caption-bg': dark ? '#232a4d' : '#E0E7FF',
            } as CSSProperties}
          >
            {caption}
          </span>
        </div>
      )}

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

  return (

    <div className={styles.slotWrapper} style={{ '--slot-opacity': nested ? 0.85 : 1 } as CSSProperties}>
      <Handle id="top"       type="target" position={Position.Top}    isConnectable={false} className={styles.slotHandleDot} />
      <Handle id="bottom"    type="source" position={Position.Bottom} isConnectable={false} className={styles.slotHandleDot} />
      <Handle id="top-out"   type="source" position={Position.Top}    isConnectable={false} className={styles.slotHandleDot} />
      <Handle id="bottom-in" type="target" position={Position.Bottom} isConnectable={false} className={styles.slotHandleDot} />

      {/* Split exactly at the card's horizontal center (where the top
          connector dot sits) so the two pills sit either side of it,
          leaving the connector point itself clear instead of covering it. */}
      <div className={styles.pillRow}>
        <div className={styles.pillLeft}>
          <div
            className={styles.rolePill}
            style={{ '--role-bg': roleBg, '--role-color': roleColor } as CSSProperties}
          >
            {role}
          </div>
        </div>

        <div className={styles.pillSpacer} />

        <div className={styles.pillRight}>
          {reference && (
            <div
              className={styles.refPill}
              style={{ '--ref-bg': refBg, '--ref-color': refColor } as CSSProperties}
            >
              {reference}
            </div>
          )}
        </div>
      </div>

      <button
        onClick={e => { e.stopPropagation(); onPick(m.id); }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={`${styles.slotCard}${highlighted ? ' search-highlight-card' : ''}`}
        style={{
          '--border': border,
          '--slot-border-w': nested ? '3px' : '3.5px',
          '--bg': hovered ? cardBgHover : cardBg,
          '--slot-shadow': hovered ? `0 8px 18px -3px rgba(0,0,0,0.18), 0 0 0 2px ${border}26` : '0 1px 3px rgba(0,0,0,0.06)',
          '--slot-transform': hovered ? 'translateY(-2px)' : 'none',
        } as CSSProperties}
      >
        <div className={styles.slotRow}>

          <div
            className={styles.slotAvatar}
            style={{
              '--avatar-bg': avatarBg,
              '--avatar-image': photoOf(m) ? `url("${photoOf(m)}")` : 'none',
              '--avatar-border': border,
            } as CSSProperties}
          >
            {!photoOf(m) && getInitials(name)}
          </div>

          <div className={styles.slotInfo}>

            <div className={styles.slotName}>
              {name}
            </div>

            <div className={styles.slotBadgeRow}>
              <span
                className={styles.slotAcno}
                style={{
                  '--border': border,
                  '--acno-bg': `${border}3d`,
                  '--acno-shadow': `0 0 0 2.5px ${border}22`,
                } as CSSProperties}
              >{displayAcno(m.id)}</span>
              {isDead(m) && (
                <span className={styles.slotDeceased}>
                  Deceased
                </span>
              )}
              {isInactive(m) && (
                <span className={styles.slotInactive}>
                  Inactive
                </span>
              )}
            </div>

            {m.since && (
              <div className={styles.slotJoined}>
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
  const neutralLabelBg = dark ? '#2A2418' : '#EFE7D5';
  const neutralLabelFg = dark ? '#EDE7D9' : '#3A3427';
  const amberLabelBg   = dark ? '#3a2e12' : '#fef3c7';
  const amberLabelFg   = dark ? '#f0c975' : '#92400e';

  const parents       = nodesOfKind(owner, members, ['Parent']);
  const spouseEntry   = nodesOfKind(owner, members, ['Spouse'])[0];
  const transferEntry = nodesOfKind(owner, members, ['Transfer'])[0];
  const childEntries  = nodesOfKind(owner, members, ['Children']);
  const slotEntries   = nodesOfKind(owner, members, ['A4D', 'Associate']);

  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // ── an A/C transfer belonging to a SECONDARY card ────────────────────────
  // A child, spouse or dependent can have transferred their own account to
  // someone else; the API states that inside that row's ChildNode. It is a
  // fact about that person's membership, so it belongs in this tab — seated
  // beside their card, exactly like the owner's own transfer is.
  const index = getFamilyIndex(members);
  const innerTransferOf = (entry?: ResolvedNode): RelationNode | undefined =>
    entry?.inner?.find(n => n.node === 'Transfer');

  const TRANSFER_GAP = 150;
  const transferExtra = (entry?: ResolvedNode) => (innerTransferOf(entry) ? CARD_W + TRANSFER_GAP : 0);

  // Places the transferee to the right of the card it belongs to, and points
  // an arrow at whoever RECEIVED the account.
  const addInnerTransfer = (host: ResolvedNode, hostId: string, hostX: number, hostW: number, y: number) => {
    const node = innerTransferOf(host);
    if (!node) return;
    const target = findMember(index, node.acno);
    if (!target) return;

    const nodeId = `xfer-${hostId}-${target.id}`;
    const isOutgoing = node.relation.toLowerCase().includes('to');
    nodes.push({
      id: nodeId, type: 'member',
      position: { x: hostX + hostW + TRANSFER_GAP, y },
      data: {
        member: { ...target, name: node.name || target.name, photoUrl: node.photoUrl ?? target.photoUrl },
        onPick,
      },
    });
    edges.push({
      id: `e-${nodeId}`,
      source: isOutgoing ? hostId : nodeId,
      sourceHandle: isOutgoing ? 'right-out' : 'left-out',
      target: isOutgoing ? nodeId : hostId,
      targetHandle: isOutgoing ? 'left-in' : 'right-in',
      type: 'straight', label: 'A/C Transfer',
      markerEnd: { type: MarkerType.ArrowClosed, color: '#F59E0B' },
      style: { stroke: '#F59E0B', strokeWidth: 3.5 },
      labelStyle: { fontSize: 16, fill: amberLabelFg, fontWeight: 800 },
      labelBgStyle: { fill: amberLabelBg, fillOpacity: 1, borderRadius: 7 },
      labelBgPadding: [10, 6],
    });
  };

  const H_GAP      = BESIDE_GAP;
  // just enough for the "Spouse" pill to sit clear of both cards — the line
  // used to run nearly a card-and-a-half wide
  const SPOUSE_GAP = 250;
  const PARENT_GAP = 320;
  const ROW_GAP    = 48;
  const PARENT_Y   = 0;
  const CORE_Y     = CARD_H + 200;
  const SLOT_Y     = CORE_Y + CARD_H + 260;

  // Children (own A/C) and A4D/Associate (owner's dependents) share one row
  // and fan out from the same point below the owner card — keeping them on
  // two separate rows made their fan-out lines cross each other on the way
  // down to their own row.
  const descendantWidths = [
    ...childEntries.map(e => CARD_W + transferExtra(e)),
    ...slotEntries.map(e => SLOT_W + transferExtra(e)),
  ];
  const descendantRowW = descendantWidths.length > 0
    ? descendantWidths.reduce((a, b) => a + b, 0) + (descendantWidths.length - 1) * ROW_GAP
    : 0;
  const coreRowW = CARD_W
    + (transferEntry ? CARD_W + H_GAP : 0)
    + (spouseEntry ? CARD_W + SPOUSE_GAP + transferExtra(spouseEntry) : 0);
  const totalWidth = Math.max(descendantRowW, coreRowW, CARD_W);

  const coreX     = (totalWidth - CARD_W) / 2;
  const spouseX   = coreX + CARD_W + SPOUSE_GAP;
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
    addInnerTransfer(spouseEntry, spouse.id, spouseX, CARD_W, CORE_Y);
    edges.push({
      id: `e-spouse-${owner.id}-${spouse.id}`,
      source: owner.id, sourceHandle: 'right-out',
      target: spouse.id, targetHandle: 'left-in',
      type: 'straight', label: 'Spouse',
      style: { stroke: '#A89C82', strokeWidth: 3.5 },
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
      source: isOutgoing ? transfer.id : owner.id,
      sourceHandle: isOutgoing ? 'right-out' : 'left-out',
      target: isOutgoing ? owner.id : transfer.id,
      targetHandle: isOutgoing ? 'left-in' : 'right-in',
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
      addInnerTransfer(entry, entry.member.id, px, CARD_W, PARENT_Y);
    });

    if (parents.length > 1) {
      edges.push({
        id: `e-parentpair-${owner.id}`,
        source: parents[0].member.id, sourceHandle: 'right-out',
        target: parents[1].member.id, targetHandle: 'left-in',
        type: 'straight', label: 'Spouse',
        style: { stroke: '#A89C82', strokeWidth: 3.5 },
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
      style: { stroke: '#A89C82', strokeWidth: 3.5 },
    });
  }

  if (descendantWidths.length > 0) {
    let cursorX = coreX + CARD_W / 2 - descendantRowW / 2;

    // A4D/Associate go first (nearer the owner's own center point, which is
    // where their line comes from), then Children (nearer the marriage-line
    // anchor to the right of owner) — keeps each group's fan-out lines from
    // crossing the other's on the way down to this shared row.
    slotEntries.forEach(entry => {
      const slot = displayMember(entry);
      // the row said A4D or Associate — that beats guessing from the member's
      // own record, which for someone holding a core account of their own
      // would say neither
      const role: 'A4D' | 'Assoc' = entry.kind === 'A4D' ? 'A4D'
        : entry.kind === 'Associate' ? 'Assoc'
        : slotRole(entry.member);
      const sid = `slot-${slot.id}`;
      nodes.push({
        id: sid, type: 'slot', position: { x: cursorX, y: SLOT_Y },
        data: { member: slot, role, reference: getRefFromRelation(entry.relation), onPick },
      });
      edges.push({
        id: `e-slot-${owner.id}-${sid}`,
        source: owner.id, target: sid,
        sourceHandle: 'bottom', targetHandle: 'top',
        type: 'smoothstep',
        style: { stroke: role === 'A4D' ? '#9333ea77' : '#ea580c77', strokeWidth: 3.5, strokeDasharray: '6 4' },
      });
      addInnerTransfer(entry, sid, cursorX, SLOT_W, SLOT_Y);
      cursorX += SLOT_W + transferExtra(entry) + ROW_GAP;
    });

    if (childEntries.length > 0) {
      // Union sits ON the owner<->spouse spousal line (or the owner's own
      // bottom edge, if there's no spouse) — children belong to the
      // marriage, not to the owner alone. Mirrors the parents->owner union.
      const unionId = `union-children-${owner.id}`;
      const unionX = spouseEntry ? coreX + CARD_W + SPOUSE_GAP / 2 : coreX + CARD_W / 2;
      const unionY = spouseEntry ? CORE_Y + CARD_H / 2 : CORE_Y + CARD_H;
      nodes.push({
        id: unionId, type: 'union',
        position: { x: unionX, y: unionY },
        data: { labelOffsetY: (SLOT_Y - unionY) * 0.4 },
        style: { width: 1, height: 1 },
      });

      childEntries.forEach(entry => {
        const child = displayMember(entry);
        nodes.push({
          id: child.id, type: 'member', position: { x: cursorX, y: SLOT_Y },
          data: { member: child, onPick, caption: entry.relation },
        });
        edges.push({
          id: `e-childfan-${owner.id}-${child.id}`,
          source: unionId, sourceHandle: 'bottom',
          target: child.id, targetHandle: 'top',
          type: 'smoothstep',
          style: { stroke: '#A89C82', strokeWidth: 3.5 },
        });
        addInnerTransfer(entry, child.id, cursorX, CARD_W, SLOT_Y);
        cursorX += CARD_W + transferExtra(entry) + ROW_GAP;
      });
    }
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
    <div className={styles.flowContainer}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        onNodeClick={handleNodeClick}
        /* skip DOM work for cards scrolled out of view — a wide family row
           with photos is otherwise mounted in full even when only two cards
           are on screen */
        onlyRenderVisibleElements
        panOnScroll
        minZoom={0.1}
        maxZoom={2.5}
      >
        <Background color={theme === 'dark' ? '#322C1E' : '#E3D9C2'} gap={22} size={1} />
        {/* top-right: within reach of the cursor while reading the tree,
            instead of buried at the bottom-left corner of a tall canvas */}
        <Controls
          showInteractive={false}
          position="top-right"
          className={styles.controls}
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
