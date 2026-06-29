'use client';

import { useState } from 'react';
import type { Member } from '@/lib/types';
import { TYPE_CONFIG, getInitials } from '@/lib/memberUtils';
import styles from './DynamicTree.module.css';

type TreeMode = 'club' | 'bio';

export default function DynamicTree({
  members,
  selectedId,
  onSelect,
}: {
  members: Member[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const [mode, setMode] = useState<TreeMode>('club');

  const roots = members.filter(m => m.pid === null);

  return (
    <div className={styles.page}>
      <div className={styles.controls}>
        <div className={styles.tabs}>
          <button
            onClick={() => setMode('club')}
            className={`${styles.tab} ${mode === 'club' ? styles.tabActive : ''}`}
          >
            Club Tree
          </button>
          <button
            onClick={() => setMode('bio')}
            className={`${styles.tab} ${mode === 'bio' ? styles.tabActive : ''}`}
          >
            Bio Tree
          </button>
        </div>
        <span className={styles.modeHint}>
          {mode === 'club' ? 'Club structural hierarchy (pid/rel)' : 'Biological family links (father/mother)'}
        </span>
      </div>

      {members.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyEmoji}>🌱</div>
          <div className={styles.emptyText}>No members yet. Load a test case or add members.</div>
        </div>
      ) : mode === 'club' ? (
        <div className={styles.treeList}>
          {roots.map(root => (
            <ClubFamilyTree
              key={root.id}
              root={root}
              members={members}
              selectedId={selectedId}
              onSelect={onSelect}
            />
          ))}
        </div>
      ) : (
        <div className={styles.treeList}>
          {roots.map(root => (
            <BioFamilyTree
              key={root.id}
              root={root}
              members={members}
              selectedId={selectedId}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Club tree ─────────────────────────────────────────────────────────────────

function ClubFamilyTree({
  root, members, selectedId, onSelect,
}: {
  root: Member; members: Member[]; selectedId: string | null; onSelect: (id: string) => void;
}) {
  const spouse = members.find(m => m.pid === root.id && m.rel === 'spouse');
  const children = members.filter(m => m.pid === root.id && m.rel === 'child');
  const a4dDirect = members.filter(m => m.pid === root.id && m.rel === 'a4d');
  const assocDirect = members.filter(m => m.pid === root.id && m.rel === 'associate');
  const spouseA4d = spouse ? members.filter(m => m.pid === spouse.id && m.rel === 'a4d') : [];
  const spouseAssoc = spouse ? members.filter(m => m.pid === spouse.id && m.rel === 'associate') : [];

  return (
    <div className={styles.familyTree}>
      <div className={styles.primaryRow}>
        <MemberCard member={root} selected={selectedId === root.id} onClick={() => onSelect(root.id)} />
        {spouse && (
          <>
            <div className={styles.spouseLine} />
            <MemberCard member={spouse} selected={selectedId === spouse.id} onClick={() => onSelect(spouse.id)} />
          </>
        )}
      </div>

      {(a4dDirect.length > 0 || assocDirect.length > 0) && (
        <div className={styles.quotaBelow}>
          <div className={styles.vline} />
          <div className={styles.quotaRow}>
            {[...a4dDirect, ...assocDirect].map(dep => (
              <div key={dep.id} className={styles.quotaItem}>
                <div className={styles.vlineShort} />
                <MemberCard member={dep} selected={selectedId === dep.id} onClick={() => onSelect(dep.id)} mini />
              </div>
            ))}
          </div>
        </div>
      )}

      {(spouseA4d.length > 0 || spouseAssoc.length > 0) && (
        <div className={styles.spouseQuota}>
          <div className={styles.vline} />
          <div className={styles.quotaRow}>
            {[...spouseA4d, ...spouseAssoc].map(dep => (
              <div key={dep.id} className={styles.quotaItem}>
                <div className={styles.vlineShort} />
                <MemberCard member={dep} selected={selectedId === dep.id} onClick={() => onSelect(dep.id)} mini />
              </div>
            ))}
          </div>
        </div>
      )}

      {children.length > 0 && (
        <div className={styles.childrenSection}>
          <div className={styles.vlineMd} />
          <div className={styles.childrenRow}>
            {children.map(child => (
              <ClubFamilyTree
                key={child.id}
                root={child}
                members={members}
                selectedId={selectedId}
                onSelect={onSelect}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Bio tree ──────────────────────────────────────────────────────────────────

function BioFamilyTree({
  root, members, selectedId, onSelect,
}: {
  root: Member; members: Member[]; selectedId: string | null; onSelect: (id: string) => void;
}) {
  const bioChildren = members.filter(m => m.fatherId === root.id || m.motherId === root.id);
  const coParentIds = new Set(
    bioChildren.flatMap(c => [c.fatherId, c.motherId].filter(Boolean) as string[]).filter(id => id !== root.id)
  );
  const coParents = [...coParentIds].map(id => members.find(m => m.id === id)).filter(Boolean) as Member[];

  return (
    <div className={styles.familyTree}>
      <div className={styles.primaryRow}>
        <MemberCard member={root} selected={selectedId === root.id} onClick={() => onSelect(root.id)} />
        {coParents.map(cp => (
          <div key={cp.id} className={styles.primaryRow}>
            <div className={styles.spouseLine} />
            <MemberCard member={cp} selected={selectedId === cp.id} onClick={() => onSelect(cp.id)} />
          </div>
        ))}
      </div>

      {bioChildren.length > 0 && (
        <div className={styles.childrenSection}>
          <div className={styles.vlineMd} />
          <div className={styles.childrenRow}>
            {bioChildren.map(child => (
              <BioFamilyTree
                key={child.id}
                root={child}
                members={members}
                selectedId={selectedId}
                onSelect={onSelect}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Card component ────────────────────────────────────────────────────────────

function MemberCard({
  member, selected, onClick, mini = false,
}: {
  member: Member; selected: boolean; onClick: () => void; mini?: boolean;
}) {
  const cfg = TYPE_CONFIG[member.type] ?? TYPE_CONFIG.Permanent;

  if (mini) {
    return (
      <button
        onClick={onClick}
        className={`${styles.miniCard} ${selected ? styles.miniCardSelected : styles.miniCardDefault}`}
      >
        <div className={styles.miniAvatar} style={{ background: cfg.color }}>
          {getInitials(member.name)}
        </div>
        <div className={styles.miniName}>{member.name.split(' ').at(-1)}</div>
        <div className={styles.miniType} style={{ background: cfg.bg, color: cfg.dark }}>{member.type}</div>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className={`${styles.card} ${selected ? styles.cardSelected : styles.cardDefault}`}
    >
      <div className={styles.cardAvatar} style={{ background: cfg.color }}>
        {getInitials(member.name)}
      </div>
      <div className={styles.cardName}>{member.name}</div>
      <div className={styles.cardId}>{member.id}</div>
      <div className={styles.cardType} style={{ background: cfg.bg, color: cfg.dark }}>{member.type}</div>
    </button>
  );
}
