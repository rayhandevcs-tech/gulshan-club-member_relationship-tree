'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useMemberStore } from '@/store/memberStore';
import { getRootMember, getInitials, TYPE_CONFIG, typeBg, typeText } from '@/lib/memberUtils';
import { getType, photoOf, displayAcno, showsClosedAcno } from '@/lib/quotaTreeLayout';
import { Search } from 'lucide-react';
import type { CSSProperties } from 'react';
import styles from './styles/SearchBar.module.css';

export default function SearchBar() {
  const { members, searchQuery, setSearch, setActiveRoot, setFocusView, setHighlighted, selectedId, setSelected, theme } = useMemberStore();
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

  // Haystack built once per members array instead of re-lowercasing every
  // member's name/id/type on every keystroke — the full club roster is a few
  // thousand records, and this runs on each character typed.
  const searchIndex = useMemo(
    () => members.map(m => ({
      member: m,
      // getType(m) দিয়ে search-ও করা যাবে: "permanent" লিখলে P-রা আসবে
      haystack: `${m.name} ${displayAcno(m.id)} ${getType(m)}`.toLowerCase(),
    })),
    [members],
  );

  const suggestions = useMemo(
    () => (q ? searchIndex.filter(e => e.haystack.includes(q)).slice(0, 8).map(e => e.member) : []),
    [q, searchIndex],
  );

  const pick = (id: string) => {
    const m = members.find(x => x.id === id);
    if (!m) return;
    const root = getRootMember(members, id);
    setSearch(m.name);
    setActiveRoot(root ? root.id : id);
    // নতুন model: slot মানে via === 'a4d' (rel যাই হোক — spouse বা child)
    const isLeaf = m.via === 'a4d';
    setFocusView(isLeaf && m.pid ? m.pid : id);
    setHighlighted(id);
    // An open details panel is showing "the member being looked at", so a
    // search has to move it too — otherwise the tree switches to the
    // searched member while the panel beside it goes on describing whoever
    // was clicked before, which reads as the search doing nothing. A CLOSED
    // panel stays closed: searching is not a request to open it.
    if (selectedId) setSelected(id);
    setOpen(false);
  };

  return (
    <div ref={wrapRef} className={styles.wrapper}>
      <div className={styles.inputRow}>
        <Search size={16} className={styles.icon} />
        <input
          value={searchQuery}
          onChange={e => { setSearch(e.target.value); setOpen(true); }}
          onFocus={() => searchQuery.trim() && setOpen(true)}
          placeholder="Search by name or A/C number..."
          className={styles.input}
        />
      </div>

      {open && suggestions.length > 0 && (
        <div className={styles.dropdown}>
          {suggestions.map(m => {
            const type = getType(m);                              // ← derive
            const cfg  = TYPE_CONFIG[type as keyof typeof TYPE_CONFIG] ?? TYPE_CONFIG.Permanent; // ← safe fallback
            const photo = photoOf(m);                             // ← club photo, via same-origin proxy
            return (
              <div
                key={m.id}
                onClick={() => pick(m.id)}
                className={styles.dropdownItem}
              >
                <div
                  className={styles.avatar}
                  style={{
                    // backgroundColor, not the `background` shorthand: the
                    // shorthand would blank out the photo set below
                    backgroundColor: typeBg(cfg, theme),
                    color: typeText(cfg, theme),
                    borderColor: cfg.color,
                    // photo when the club system has one, initials otherwise
                    '--avatar-image': photo ? `url("${photo}")` : 'none',
                  } as CSSProperties}
                >
                  {!photo && getInitials(m.name)}
                </div>

                <div className={styles.memberInfo}>
                  <div className={styles.memberName}>{m.name}</div>
                  <div className={styles.memberMeta}>
                    {displayAcno(m.id)} · {type}
                    {m.via === 'a4d' && ' · 4(d)'}   {/* slot-দের ছোট hint */}
                    {showsClosedAcno(m) && ' · Inactive'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {open && q && suggestions.length === 0 && (
        <div className={styles.noResult}>
          No member found.
        </div>
      )}
    </div>
  );
}