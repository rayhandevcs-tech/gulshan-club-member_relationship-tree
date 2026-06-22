'use client';
import { Member } from '@/lib/types';
import { getInitials, TYPE_CONFIG, getRelLabel } from '@/lib/memberUtils';
import { useMemberStore } from '@/store/memberStore';
import { clsx } from 'clsx';

interface Props {
  member: Member;
  showRel?: boolean;
  small?: boolean;
  dashed?: boolean;
}

// Purely presentational — no click handling of its own. Whoever renders
// a MemberNode wraps it with their own onClick (usually calling
// navigateTo), since different contexts need different click behavior
// (e.g. the relationship diagram shouldn't re-anchor itself just
// because an A4D leaf got clicked).
export default function MemberNode({ member, showRel, small, dashed }: Props) {
  const { selectedId } = useMemberStore();
  const cfg = TYPE_CONFIG[member.type] ?? TYPE_CONFIG.Permanent;
  const isSelected = selectedId === member.id;
  const relLabel = getRelLabel(member);

  const size = small ? 'w-14 h-14 text-[14px]' : 'w-[88px] h-[88px] text-[20px]';

  return (
    <div
      className={clsx(
        'flex flex-col items-center cursor-pointer px-4 py-3.5 rounded-2xl transition-all',
        'hover:bg-gray-100',
        isSelected ? 'bg-gray-50 shadow-sm' : '',
        dashed && 'border border-dashed border-gray-300'
      )}
      style={isSelected ? { boxShadow: `0 0 0 2.5px ${cfg.color}` } : undefined}
    >
      {showRel && relLabel && (
        <span className="text-[9px] font-medium text-gray-500 bg-gray-100 rounded-full px-2 py-0.5 mb-1.5">
          {relLabel}
        </span>
      )}
      <div
        className={clsx('rounded-full flex items-center justify-center font-semibold shadow-sm', size)}
        style={{ background: cfg.bg, color: cfg.dark }}
      >
        {getInitials(member.name)}
      </div>
      <div className={clsx('font-medium text-gray-800 text-center mt-2 leading-tight', small ? 'text-[12px] max-w-[96px]' : 'text-[14px] max-w-[140px]')}>
        {member.name}
      </div>
      <div className={clsx('text-gray-400 text-center mt-0.5', small ? 'text-[11px]' : 'text-[12px]')}>
        {member.id}
      </div>
    </div>
  );
}
