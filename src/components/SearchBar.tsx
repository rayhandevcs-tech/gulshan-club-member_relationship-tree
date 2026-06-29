'use client';

import { useEffect, useRef, useState } from 'react';
import { useMemberStore } from '@/store/memberStore';
import { getRootMember, getInitials, TYPE_CONFIG } from '@/lib/memberUtils';
import { Search } from 'lucide-react';
import styles from './SearchBar.module.css';

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
    const isLeaf = m.rel === 'a4d' || m.rel === 'associate' || m.rel === 'nominee';
    setFocusView(isLeaf && m.pid ? m.pid : id);
    setOpen(false);
  };

  return (
    <div ref={wrapRef} className={styles.wrapper}>
      <div className={styles.inputRow}>
        <Search size={14} className={styles.icon} />
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
            const cfg = TYPE_CONFIG[m.type];
            return (
              <div
                key={m.id}
                onClick={() => pick(m.id)}
                className={styles.dropdownItem}
              >
                <div
                  className={styles.avatar}
                  style={{ background: cfg.bg, color: cfg.dark }}
                >
                  {getInitials(m.name)}
                </div>

                <div className={styles.memberInfo}>
                  <div className={styles.memberName}>{m.name}</div>
                  <div className={styles.memberMeta}>{m.id} · {m.type}</div>
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
