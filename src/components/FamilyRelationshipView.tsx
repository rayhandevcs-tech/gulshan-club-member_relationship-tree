'use client';

import { getMember, getInitials, TYPE_CONFIG, REL_LABELS } from '@/lib/memberUtils';
import { getType } from '@/components/Quotatreelayout';
import { useMemberStore } from '@/store/memberStore';
import styles from './FamilyRelationshipView.module.css';

interface Props {
  memberId: string;
}

export default function FamilyRelationshipView({ memberId }: Props) {
  const { members, setSelected } = useMemberStore();

  const member = getMember(members, memberId);
  if (!member) return null;

  const type = getType(member);
  const cfg = TYPE_CONFIG[type as keyof typeof TYPE_CONFIG] ?? TYPE_CONFIG.Permanent;

  const father = member.father;
  const mother = member.mother;

  const spouse = members.find(m => m.pid === member.id && m.rel === 'spouse');
  const children = members.filter(m =>
    m.pid === member.id && m.via === 'a4d' && m.rel !== 'associate' && m.rel !== 'nominee',
  );
  const associates = members.filter(m => m.pid === member.id && m.rel === 'associate');
  const nominees = members.filter(m => m.pid === member.id && m.rel === 'nominee');

  const Box = ({
    title,
    name,
    id,
    color = '#3B82F6',
    bg = '#EFF6FF',
    onClick,
  }: {
    title: string;
    name: string;
    id?: string;
    color?: string;
    bg?: string;
    onClick?: () => void;
  }) => (
    <div
      onClick={onClick}
      className={`${styles.box} ${onClick ? styles.boxClickable : ''}`}
      style={{ borderColor: color, background: bg }}
    >
      <div className={styles.boxTitle} style={{ color }}>{title}</div>
      <div className={styles.boxAvatar} style={{ color }}>
        {getInitials(name)}
      </div>
      <div className={styles.boxName}>{name}</div>
      {id && <div className={styles.boxId}>{id}</div>}
    </div>
  );

  return (
    <div className={styles.page}>
      <div className={styles.content}>

        {(father || mother) && (
          <div className={styles.row}>
            {father && (
              <Box title="Father" name={father} color="#84CC16" bg="#F7FEE7" />
            )}
            {mother && (
              <Box title="Mother" name={mother} color="#84CC16" bg="#F7FEE7" />
            )}
          </div>
        )}

        <div className={styles.rowCenter}>
          <Box
            title={`Member · ${type}`}
            name={member.name}
            id={member.id}
            color={cfg.color}
            bg={cfg.bg}
            onClick={() => setSelected(member.id)}
          />
          {spouse && (
            <Box
              title="Spouse"
              name={spouse.name}
              id={spouse.id}
              color="#EAB308"
              bg="#FEFCE8"
              onClick={() => setSelected(spouse.id)}
            />
          )}
        </div>

        {children.length > 0 && (
          <div className={styles.section}>
            <div className={styles.sectionLabel}>A4D / Children</div>
            <div className={styles.row}>
              {children.map(child => {
                const cc = TYPE_CONFIG[getType(child) as keyof typeof TYPE_CONFIG] ?? TYPE_CONFIG.Permanent;
                return (
                  <Box
                    key={child.id}
                    title={REL_LABELS[child.rel ?? ''] ?? 'Child'}
                    name={child.name}
                    id={child.id}
                    color={cc.color}
                    bg={cc.bg}
                    onClick={() => setSelected(child.id)}
                  />
                );
              })}
            </div>
          </div>
        )}

        {associates.length > 0 && (
          <div className={styles.section}>
            <div className={styles.sectionLabel}>Associates</div>
            <div className={styles.row}>
              {associates.map(a => {
                const ac = TYPE_CONFIG[getType(a) as keyof typeof TYPE_CONFIG] ?? TYPE_CONFIG.Permanent;
                return (
                  <Box
                    key={a.id}
                    title="Associate"
                    name={a.name}
                    id={a.id}
                    color={ac.color}
                    bg={ac.bg}
                    onClick={() => setSelected(a.id)}
                  />
                );
              })}
            </div>
          </div>
        )}

        {nominees.length > 0 && (
          <div className={styles.section}>
            <div className={styles.sectionLabel}>Nominees</div>
            <div className={styles.row}>
              {nominees.map(n => {
                const nc = TYPE_CONFIG[getType(n) as keyof typeof TYPE_CONFIG] ?? TYPE_CONFIG.Permanent;
                return (
                  <Box
                    key={n.id}
                    title="Nominee"
                    name={n.name}
                    id={n.id}
                    color={nc.color}
                    bg={nc.bg}
                    onClick={() => setSelected(n.id)}
                  />
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
