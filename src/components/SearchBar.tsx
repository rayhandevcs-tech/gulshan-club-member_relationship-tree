'use client';

import { useEffect, useRef, useState } from 'react';
import { useMemberStore } from '@/store/memberStore';
import { getRootMember, getInitials, TYPE_CONFIG } from '@/lib/memberUtils';
import { getType } from '@/components/Quotatreelayout'; // ← path তোমার structure অনুযায়ী
import { Search } from 'lucide-react';
import styles from './SearchBar.module.css';

export default function SearchBar() {
  const { members, searchQuery, setSearch, setActiveRoot, setFocusView, setHighlighted } = useMemberStore();
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
    ? members.filter(m =>
        // getType(m) দিয়ে search-ও করা যাবে: "permanent" লিখলে P-রা আসবে
        (m.name + ' ' + m.id + ' ' + getType(m)).toLowerCase().includes(q)
      ).slice(0, 8)
    : [];

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
                  <div className={styles.memberMeta}>
                    {m.id} · {type}
                    {m.via === 'a4d' && ' · 4(d)'}   {/* slot-দের ছোট hint */}
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