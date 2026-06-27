'use client';

import { useState } from 'react';
import type { Member } from '@/lib/types';
import { TYPE_CONFIG, getInitials } from '@/lib/memberUtils';

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
    <div className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="flex items-center gap-0.5 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          <button
            onClick={() => setMode('club')}
            className={`px-3 py-1 rounded-md text-[11px] transition-colors ${
              mode === 'club' ? 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 shadow-sm font-medium' : 'text-gray-400 dark:text-gray-500'
            }`}
          >
            Club Tree
          </button>
          <button
            onClick={() => setMode('bio')}
            className={`px-3 py-1 rounded-md text-[11px] transition-colors ${
              mode === 'bio' ? 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 shadow-sm font-medium' : 'text-gray-400 dark:text-gray-500'
            }`}
          >
            Bio Tree
          </button>
        </div>
        <span className="text-[10px] text-gray-400 dark:text-gray-500">
          {mode === 'club' ? 'Club structural hierarchy (pid/rel)' : 'Biological family links (father/mother)'}
        </span>
      </div>

      {members.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-300 dark:text-gray-700">
          <div className="text-4xl mb-3">🌱</div>
          <div className="text-[13px] text-gray-400 dark:text-gray-500">No members yet. Load a test case or add members.</div>
        </div>
      ) : mode === 'club' ? (
        <div className="space-y-6">
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
        <div className="space-y-6">
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

// ── Club tree (structural pid/rel hierarchy) ──────────────────────────────────

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
    <div className="inline-flex flex-col items-center">
      {/* Primary + spouse row */}
      <div className="flex items-center gap-2">
        <MemberCard member={root} selected={selectedId === root.id} onClick={() => onSelect(root.id)} />
        {spouse && (
          <>
            <div className="w-6 h-px bg-pink-200 dark:bg-pink-800" />
            <MemberCard member={spouse} selected={selectedId === spouse.id} onClick={() => onSelect(spouse.id)} />
          </>
        )}
      </div>

      {/* Quota slots under primary */}
      {(a4dDirect.length > 0 || assocDirect.length > 0) && (
        <div className="mt-3 flex flex-col items-center">
          <div className="w-px h-4 bg-gray-200 dark:bg-gray-700" />
          <div className="flex gap-2 flex-wrap justify-center">
            {[...a4dDirect, ...assocDirect].map(dep => (
              <div key={dep.id} className="flex flex-col items-center">
                <div className="w-px h-3 bg-gray-200 dark:bg-gray-700" />
                <MemberCard member={dep} selected={selectedId === dep.id} onClick={() => onSelect(dep.id)} mini />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quota slots under spouse */}
      {(spouseA4d.length > 0 || spouseAssoc.length > 0) && (
        <div className="mt-2 ml-24 flex flex-col items-center">
          <div className="w-px h-4 bg-gray-200 dark:bg-gray-700" />
          <div className="flex gap-2 flex-wrap justify-center">
            {[...spouseA4d, ...spouseAssoc].map(dep => (
              <div key={dep.id} className="flex flex-col items-center">
                <div className="w-px h-3 bg-gray-200 dark:bg-gray-700" />
                <MemberCard member={dep} selected={selectedId === dep.id} onClick={() => onSelect(dep.id)} mini />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Children (recursive) */}
      {children.length > 0 && (
        <div className="mt-4 flex flex-col items-center">
          <div className="w-px h-4 bg-gray-300 dark:bg-gray-600" />
          <div className="flex gap-6 items-start">
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

// ── Bio tree (father/mother links) ────────────────────────────────────────────

function BioFamilyTree({
  root, members, selectedId, onSelect,
}: {
  root: Member; members: Member[]; selectedId: string | null; onSelect: (id: string) => void;
}) {
  const bioSpouse = members.find(m =>
    (m.fatherId === root.id || m.motherId === root.id) && false // just use bio children
  );
  const bioChildren = members.filter(m => m.fatherId === root.id || m.motherId === root.id);

  // Spouses linked via bioRelationship (stored as fatherId/motherId cross-references)
  // For display: find members who share children with root
  const coParentIds = new Set(
    bioChildren.flatMap(c => [c.fatherId, c.motherId].filter(Boolean) as string[]).filter(id => id !== root.id)
  );
  const coParents = [...coParentIds].map(id => members.find(m => m.id === id)).filter(Boolean) as Member[];

  return (
    <div className="inline-flex flex-col items-center">
      <div className="flex items-center gap-2">
        <MemberCard member={root} selected={selectedId === root.id} onClick={() => onSelect(root.id)} />
        {coParents.map(cp => (
          <div key={cp.id} className="flex items-center gap-2">
            <div className="w-6 h-px bg-pink-200 dark:bg-pink-800" />
            <MemberCard member={cp} selected={selectedId === cp.id} onClick={() => onSelect(cp.id)} />
          </div>
        ))}
      </div>

      {bioChildren.length > 0 && (
        <div className="mt-4 flex flex-col items-center">
          <div className="w-px h-4 bg-gray-300 dark:bg-gray-600" />
          <div className="flex gap-6 items-start">
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
        className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg border transition-all ${
          selected
            ? 'border-blue-300 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/30 shadow-sm'
            : 'border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-gray-200 dark:hover:border-gray-600'
        }`}
      >
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-bold text-white shrink-0"
          style={{ background: cfg.color }}
        >
          {getInitials(member.name)}
        </div>
        <div className="text-[9px] text-gray-500 dark:text-gray-400 max-w-16 truncate text-center">{member.name.split(' ').at(-1)}</div>
        <div className="text-[8px] font-medium px-1 py-px rounded-full" style={{ background: cfg.bg, color: cfg.dark }}>{member.type}</div>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1 px-3 py-2.5 rounded-xl border transition-all min-w-28 ${
        selected
          ? 'border-blue-300 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/30 shadow-sm'
          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm'
      }`}
    >
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0"
        style={{ background: cfg.color }}
      >
        {getInitials(member.name)}
      </div>
      <div className="text-[11px] font-medium text-gray-800 dark:text-gray-100 text-center leading-tight max-w-24 truncate">{member.name}</div>
      <div className="text-[9px] font-mono text-gray-400 dark:text-gray-500">{member.id}</div>
      <div className="text-[9px] font-medium px-1.5 py-px rounded-full" style={{ background: cfg.bg, color: cfg.dark }}>{member.type}</div>
    </button>
  );
}
