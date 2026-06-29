'use client';
import { Member } from '@/lib/types';
import { getInitials, TYPE_CONFIG, getRelLabel } from '@/lib/memberUtils';
import { useMemberStore } from '@/store/memberStore';
import styles from './MemberNode.module.css';

interface Props {
  member: Member;
  showRel?: boolean;
  small?: boolean;
  dashed?: boolean;
  fixed?: boolean;
}

export default function MemberNode({ member, showRel, small, dashed, fixed }: Props) {
  const { selectedId } = useMemberStore();
  const cfg = TYPE_CONFIG[member.type] ?? TYPE_CONFIG.Permanent;
  const isSelected = selectedId === member.id;
  const relLabel = getRelLabel(member);

  const containerClass = [
    styles.container,
    fixed ? styles.fixed : '',
    isSelected ? styles.selected : '',
    dashed ? styles.dashed : '',
  ].filter(Boolean).join(' ');

  const avatarClass = [
    styles.avatar,
    fixed ? styles.avatarFixed : small ? styles.avatarSm : styles.avatarLg,
  ].join(' ');

  const nameClass = [
    styles.name,
    fixed ? styles.nameFixed : small ? styles.nameSm : styles.nameLg,
  ].join(' ');

  const idClass = [
    styles.memberId,
    small ? styles.memberIdSm : styles.memberIdLg,
  ].join(' ');

  return (
    <div
      className={containerClass}
      style={isSelected ? { boxShadow: `0 0 0 2.5px ${cfg.color}` } : undefined}
    >
      {showRel && relLabel && (
        <span className={styles.relLabel}>{relLabel}</span>
      )}
      <div
        className={avatarClass}
        style={{ background: cfg.bg, color: cfg.dark }}
      >
        {getInitials(member.name)}
      </div>
      <div className={nameClass}>
        {member.name}
      </div>
      <div className={idClass}>
        {member.id}
      </div>
    </div>
  );
}
