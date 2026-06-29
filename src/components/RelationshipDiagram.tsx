'use client';

import {
  buildFocusedRelationship,
  buildRelationshipDiagram,
  DIAGRAM_BOX_W,
  DIAGRAM_BOX_H,
  TYPE_CONFIG,
} from '@/lib/memberUtils';
import { Member } from '@/lib/types';
import MemberNode from './MemberNode';
import { QuotaFamilyDiagram } from './QuotaFamilyDiagram';
import styles from './RelationshipDiagram.module.css';

interface Props {
  focusId: string;
  members: Member[];
  onPick: (id: string) => void;
}

export function FocusedDiagram({ focusId, members, onPick }: Props) {
  const view = buildFocusedRelationship(members, focusId);
  if (!view) return null;

  const { owner, ownerCaption, connections, associateCount, nomineeCount } = view;
  const lateralSpouse = connections.find(c => c.isSpouse && c.member.type !== 'A4D');
  const lowerConns = connections.filter(c => c !== lateralSpouse);

  return (
    <div className={styles.focusedWrap}>

      <div className={styles.topRow}>
        {lateralSpouse && (
          <div className={styles.invisible}>
            <div className={styles.spouseConnectorMirror}>
              <div style={{ fontSize: 8, whiteSpace: 'nowrap', marginBottom: 2 }}>x</div>
              <div style={{ width: 32, height: 1.5 }} />
            </div>
            <div style={{ border: '1px solid transparent', borderRadius: '1rem' }}>
              <MemberNode member={lateralSpouse.member} />
            </div>
          </div>
        )}

        <div className={styles.ownerCard} onClick={() => onPick(owner.id)}>
          <MemberNode member={owner} />
        </div>

        {lateralSpouse && (
          <div className={styles.spouseConnector}>
            <div className={styles.spouseConnectorInner}>
              <div className={styles.spouseLabel}>[Spouse]</div>
              <div className={styles.spouseLine} />
            </div>
            <div className={styles.ownerCard} onClick={() => onPick(lateralSpouse.member.id)}>
              <MemberNode member={lateralSpouse.member} />
              {lateralSpouse.refNote && (
                <div style={{ fontSize: 9, color: '#9ca3af', padding: '0 0.75rem 0.5rem' }}>
                  ({lateralSpouse.refNote})
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {ownerCaption && (
        <div className={styles.ownerCaption}>{ownerCaption}</div>
      )}

      {(associateCount > 0 || nomineeCount > 0) && (
        <div className={styles.assocCount}>
          {associateCount > 0 ? `${associateCount} Associate(s)` : ''}
          {associateCount > 0 && nomineeCount > 0 ? ' · ' : ''}
          {nomineeCount > 0 ? `${nomineeCount} Nominee(s)` : ''}
        </div>
      )}

      {lowerConns.length > 0 && (
        <>
          <div className={styles.vline} style={{ width: 1.5, height: 40 }} />
          {lowerConns.length > 1 && (
            <div className={styles.hline} style={{ height: 1.5, width: Math.min(lowerConns.length * 170, 600) }} />
          )}
          <div className={styles.childrenRow}>
            {lowerConns.map(c => (
              <div key={c.member.id} className={styles.childCol} onClick={() => onPick(c.member.id)}>
                <div className={styles.vline} style={{ width: 1.5, height: 28 }} />
                <div className={styles.childCard}>
                  <MemberNode member={c.member} />
                </div>
                {c.refNote && <div className={styles.refNote}>({c.refNote})</div>}
                {c.caption && <div className={styles.caption}>{c.caption}</div>}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
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
        const cfg = TYPE_CONFIG[n.member.type];
        const x = n.x - minX;
        const y = n.y + padTop;
        return (
          <g key={n.member.id} style={{ cursor: 'pointer' }} onClick={() => onPick(n.member.id)}>
            <rect x={x} y={y} width={DIAGRAM_BOX_W} height={DIAGRAM_BOX_H} rx={12} fill="#fff" stroke={cfg.color} strokeWidth={1.5} />
            <text x={x + 12} y={y + 22} fontSize="13" fontWeight={600} fill="#1F2937">
              {n.member.name.length > 22 ? n.member.name.slice(0, 21) + '…' : n.member.name}
            </text>
            <text x={x + 12} y={y + 40} fontSize="11" fill="#9CA3AF">{n.member.id} · {n.member.type}</text>
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
}

export function BioFamilyDiagram({ rootId, members, onPick }: BioProps) {
  return <QuotaFamilyDiagram rootId={rootId} members={members} onPick={onPick} />;
}
