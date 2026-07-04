'use client';

import {
  buildRelationshipDiagram,
  DIAGRAM_BOX_W,
  DIAGRAM_BOX_H,
  TYPE_CONFIG,
  getInitials,
} from '@/lib/memberUtils';
import { Member } from '@/lib/types';
import { getType } from '@/components/Quotatreelayout';
import { QuotaFamilyDiagram } from './QuotaFamilyDiagram';

interface Props {
  focusId: string;
  members: Member[];
  onPick: (id: string) => void;
}

export function FocusedDiagram({ focusId, members, onPick }: Props) {
  const owner = members.find(m => m.id === focusId);
  if (!owner) return null;

  // Spouse: if owner is registered as a spouse, find their partner;
  // otherwise find who registered as spouse under owner
  const spouse = owner.rel === 'spouse' && owner.pid
    ? (members.find(m => m.id === owner.pid) ?? null)
    : (members.find(m => m.pid === focusId && m.rel === 'spouse') ?? null);

  // Bio children via fatherId/motherId; structural rel=child as fallback
  const parentIds = new Set([owner.id, ...(spouse ? [spouse.id] : [])]);
  const seenIds = new Set<string>([owner.id, ...(spouse ? [spouse.id] : [])]);
  const bioChildren = members.filter(m => {
    if (seenIds.has(m.id)) return false;
    const linked = (m.fatherId && parentIds.has(m.fatherId)) ||
                   (m.motherId && parentIds.has(m.motherId));
    const structural = m.rel === 'child' && parentIds.has(m.pid ?? '') &&
                       !m.fatherId && !m.motherId;
    if (linked || structural) { seenIds.add(m.id); return true; }
    return false;
  });

  // Dimensions (larger cards)
  const CW = 148; const CH = 100;
  const AV_R = 22; const AV_CY = 34;
  const HG = 20; const VG = 76; const SG = 56;
  const PX = 32; const PY = 28; const LH = 22;

  // Role colours
  const OWNER_C  = '#0F766E'; const OWNER_BG  = '#F0FDFA';
  const SPOUSE_C = '#BE185D'; const SPOUSE_BG = '#FDF2F8';
  const CHILD_C  = '#6D28D9'; const CHILD_BG  = '#F5F3FF';
  const LINE = '#CBD5E1';

  const childLabel = (m: Member) =>
    m.gender === 'M' ? 'Son' : m.gender === 'F' ? 'Daughter' : 'Child';

  const drawCard = (m: Member, x: number, y: number, color: string, bg: string, caption?: string) => (
    <g key={m.id} style={{ cursor: 'pointer' }} onClick={() => onPick(m.id)}>
      <rect x={x} y={y} width={CW} height={CH} rx={12}
        fill={bg} stroke={color} strokeWidth={1.5} />
      <circle cx={x + CW / 2} cy={y + AV_CY} r={AV_R} fill={color} />
      <text x={x + CW / 2} y={y + AV_CY + 7} textAnchor="middle"
        fontSize="13" fontWeight="700" fill="#fff">
        {getInitials(m.name)}
      </text>
      <text x={x + CW / 2} y={y + AV_CY + AV_R + 18} textAnchor="middle"
        fontSize="12" fontWeight="600" fill="#111827">
        {m.name.length > 18 ? m.name.slice(0, 17) + '…' : m.name}
      </text>
      <text x={x + CW / 2} y={y + AV_CY + AV_R + 32} textAnchor="middle"
        fontSize="10" fill="#9CA3AF">
        {m.id}
      </text>
      {caption && (
        <text x={x + CW / 2} y={y + CH + 16} textAnchor="middle"
          fontSize="9" fontWeight="500" fill={color}>
          {caption}
        </text>
      )}
    </g>
  );

  // Layout
  const topW   = spouse ? 2 * CW + SG : CW;
  const botW   = bioChildren.length > 0
    ? bioChildren.length * CW + (bioChildren.length - 1) * HG : 0;
  const svgW   = Math.max(topW, botW) + 2 * PX;
  const mid    = svgW / 2;

  const ownerX       = spouse ? mid - CW - SG / 2 : mid - CW / 2;
  const spouseX      = mid + SG / 2;
  const mainCX       = spouse ? mid : ownerX + CW / 2;
  const childX0      = (svgW - botW) / 2;
  const row1Y        = PY;
  const row2Y        = row1Y + CH + VG;
  const spouseLineY  = row1Y + CH / 2;
  const spouseLabelX = ownerX + CW + SG / 2;
  const svgH = bioChildren.length > 0
    ? row2Y + CH + 24 + PY
    : row1Y + CH + PY;

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <svg width={svgW} height={svgH}
        style={{ display: 'block', margin: '0 auto', minWidth: svgW }}>

        {/* Spouse connector */}
        {spouse && (
          <g>
            <line x1={ownerX + CW} y1={spouseLineY} x2={spouseX} y2={spouseLineY}
              stroke={LINE} strokeWidth={1.5} />
            <rect x={spouseLabelX - 24} y={spouseLineY - 9} width={48} height={17} rx={5}
              fill="#F9FAFB" stroke={LINE} strokeWidth={1} />
            <text x={spouseLabelX} y={spouseLineY + 5} textAnchor="middle"
              fontSize="8" fill="#94A3B8" letterSpacing="0.6">
              SPOUSE
            </text>
          </g>
        )}

        {/* Lines to children */}
        {bioChildren.length > 0 && (
          <g>
            <line x1={mainCX} y1={row1Y + CH} x2={mainCX} y2={row2Y - LH}
              stroke={LINE} strokeWidth={1.5} />
            {bioChildren.length > 1 && (
              <line
                x1={childX0 + CW / 2} y1={row2Y - LH}
                x2={childX0 + botW - CW / 2} y2={row2Y - LH}
                stroke={LINE} strokeWidth={1.5}
              />
            )}
            {bioChildren.map((c, i) => {
              const cx = childX0 + i * (CW + HG) + CW / 2;
              return (
                <line key={`stem-${c.id}`}
                  x1={cx} y1={row2Y - LH} x2={cx} y2={row2Y}
                  stroke={LINE} strokeWidth={1.5}
                />
              );
            })}
          </g>
        )}

        {drawCard(owner, ownerX, row1Y, OWNER_C, OWNER_BG)}
        {spouse && drawCard(spouse, spouseX, row1Y, SPOUSE_C, SPOUSE_BG)}
        {bioChildren.map((c, i) =>
          drawCard(c, childX0 + i * (CW + HG), row2Y, CHILD_C, CHILD_BG, childLabel(c))
        )}

      </svg>
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
            <text x={x + 12} y={y + 40} fontSize="11" fill="#9CA3AF">{n.member.id} · {type}</text>
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

// Member Relationship tab: quota/sponsorship tree only — no bio children
export function BioFamilyDiagram({ rootId, members, onPick }: BioProps) {
  return <QuotaFamilyDiagram rootId={rootId} members={members} onPick={onPick} />;
}

// Family Relationship tab: biological family tree with recursive children
export function FamilyTreeDiagram({ rootId, members, onPick }: BioProps) {
  return <QuotaFamilyDiagram rootId={rootId} members={members} onPick={onPick} bioMode />;
}
