'use client';

import { useEffect, useRef, useState } from 'react';
import { useMemberStore } from '@/store/memberStore';
import { getRootMember, getInitials, TYPE_CONFIG } from '@/lib/memberUtils';
import { Search } from 'lucide-react';

export default function SearchBar() {
  const { members, searchQuery, setSearch, setActiveRoot, setSelected, setFocusView } = useMemberStore();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const q = searchQuery.trim().toLowerCase();

  // Plain substring match on name+id, same as before, but this list is
  // only ever a *suggestion* list now — picking one item is what decides
  // which single family gets rendered, so overlapping ids (PA-1 vs
  // PA-132) just become two separate rows instead of two merged trees.
  const suggestions = q
    ? members.filter(m => (m.name + ' ' + m.id).toLowerCase().includes(q)).slice(0, 8)
    : [];

  const pick = (id: string) => {
    const m = members.find(x => x.id === id);
    if (!m) return;
    const root = getRootMember(members, id);
    setSearch(m.name);
    setActiveRoot(root ? root.id : id);
    setSelected(id);
    // A4D/associate/nominee leaves have no independent subtree — focus
    // their structural parent so the tree shows context (searching PS-329
    // shows PT-7's full family). Spouses get their own focusView because
    // each spouse owns a separate A4D quota.
    const isLeaf = m.rel === 'a4d' || m.rel === 'associate' || m.rel === 'nominee';
    setFocusView(isLeaf && m.pid ? m.pid : id);
    setOpen(false);
  };

  return (
    <div ref={wrapRef} className="relative w-full md:flex-1 md:max-w-sm">
      <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2">
        <Search size={14} className="text-gray-400 dark:text-gray-500" />
        <input
          value={searchQuery}
          onChange={e => { setSearch(e.target.value); setOpen(true); }}
          onFocus={() => searchQuery.trim() && setOpen(true)}
          placeholder="Search by name or A/C number..."
          className="flex-1 bg-transparent text-[13px] text-gray-700 dark:text-gray-200 outline-none placeholder:text-gray-400 dark:placeholder:text-gray-600"
        />
      </div>

      {open && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-50 max-h-72 overflow-y-auto">
          {suggestions.map(m => {
            const cfg = TYPE_CONFIG[m.type];
            return (
              <div
                key={m.id}
                onClick={() => pick(m.id)}
                className="flex items-center gap-2.5 px-3.5 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-medium shrink-0"
                  style={{ background: cfg.bg, color: cfg.dark }}
                >
                  {getInitials(m.name)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-medium text-gray-800 dark:text-gray-200 truncate">{m.name}</div>
                  <div className="text-[10px] text-gray-400 dark:text-gray-500">{m.id} · {m.type}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {open && q && suggestions.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-50 px-3.5 py-2.5 text-[12px] text-gray-400 dark:text-gray-500">
          No member found.
        </div>
      )}
    </div>
  );
}
