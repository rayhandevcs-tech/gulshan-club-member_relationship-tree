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

export default function MemberNode({ member, showRel, small, dashed }: Props) {
  const { selectedId } = useMemberStore();
  const cfg = TYPE_CONFIG[member.type] ?? TYPE_CONFIG.Permanent;
  const isSelected = selectedId === member.id;
  const relLabel = getRelLabel(member);

  const size = small ? 'w-12 h-12 text-[13px]' : 'w-[68px] h-[68px] text-[16px]';
  const pipSize = small ? 'w-[18px] h-[18px] text-[8px]' : 'w-[22px] h-[22px] text-[9px]';

  return (
    <div
      className={clsx(
        'flex flex-col items-center cursor-pointer px-2.5 py-2 rounded-xl transition-all',
        'hover:bg-gray-100',
        isSelected ? 'bg-gray-50 shadow-sm' : '',
        dashed && 'border border-dashed border-gray-300'
      )}
      style={isSelected ? { boxShadow: `0 0 0 2.5px ${cfg.color}` } : undefined}
    >
      {showRel && relLabel && (
        <span className="text-[9px] font-medium text-gray-500 bg-gray-100 rounded-full px-2 py-0.5 mb-1">
          {relLabel}
        </span>
      )}
      <div
        className={clsx('rounded-full flex items-center justify-center font-semibold relative shadow-sm', size)}
        style={{ background: cfg.bg, color: cfg.dark }}
      >
        {getInitials(member.name)}
        <div
          className={clsx('absolute -bottom-1 -right-1 rounded-full flex items-center justify-center font-bold text-white border-2 border-white', pipSize)}
          style={{ background: cfg.color, borderColor: '#fff' }}
        >
          {cfg.short}
        </div>
      </div>
      <div className={clsx('font-medium text-gray-800 text-center mt-1.5 leading-tight', small ? 'text-[11px] max-w-[72px]' : 'text-[13px] max-w-[96px]')}>
        {member.name.split(' ').slice(0, 2).join(' ')}
      </div>
      <div className={clsx('text-gray-400 text-center', small ? 'text-[10px]' : 'text-[11px]')}>
        {member.id}
      </div>
    </div>
  );
}
