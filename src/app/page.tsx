'use client';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useMemberStore } from '@/store/memberStore';
import { familyMembers } from '@/lib/demoData';
import { DATA_SOURCE } from '@/lib/dataSource';
import MemberTree from '@/components/MemberTree';
import DetailPanel from '@/components/DetailPanel';
import SearchBar from '@/components/SearchBar';
import { LayoutGrid, Network, Sun, Moon } from 'lucide-react';
import s from './page.module.css';

export default function Home() {
  const { view, setView, selectedId, setMembers, theme, toggleTheme } = useMemberStore();

  // Data source is a single switch — see src/lib/dataSource.ts.
  const { data, isLoading, isError } = useQuery({
    queryKey: ['members', DATA_SOURCE],
    queryFn: () => {
      if (DATA_SOURCE === 'static') return Promise.resolve(familyMembers);
      return fetch('/api/ext-members').then(r => r.json());
    },
  });

  useEffect(() => {
    if (data) setMembers(data);
  }, [data, setMembers]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  if (isLoading) {
    return <div className={s.root} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#9ca3af' }}>Loading members…</div>;
  }

  if (isError) {
    return <div className={s.root} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#dc2626' }}>Failed to load members. Please refresh.</div>;
  }

  return (

    <div className={s.root}>

      {/* Header */}
      <div className={s.header}>

        {/* Row 1: Title + mobile action buttons */}
        <div className={s.titleRow}>

          <div className={s.brand}>
            <div className={s.logo}>GC</div>
            <div>
              <div className={s.title}>Gulshan Club Limited</div>
              <div className={s.subtitle}>Membership Relationship Tree</div>
            </div>
          </div>

          {/* Mobile-only: view toggle + new member */}

          <div className={s.mobileActions}>

            <div className={s.tabGroup}>

              <button
                onClick={() => setView('tree')}
                className={`${s.tabBtnSm} ${view === 'tree' ? s.tabBtnSmActive : ''}`}
              >
                <Network size={12} />
              </button>

              <button
                onClick={() => setView('grid')}
                className={`${s.tabBtnSm} ${view === 'grid' ? s.tabBtnSmActive : ''}`}
              >
                <LayoutGrid size={12} />
              </button>

            </div>

            <button onClick={toggleTheme} className={s.themeBtn} title="Toggle dark mode">
              {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
            </button>
          </div>

        </div>

        {/* Row 2: SearchBar */}
        <SearchBar />

        {/* Desktop-only: view toggle + new member */}
        <div className={s.desktopActions}>

          <div className={s.tabGroup}>

            <button
              onClick={() => setView('tree')}
              className={`${s.tabBtnLg} ${view === 'tree' ? s.tabBtnLgActive : ''}`}
            >
              <Network size={13} /> Tree
            </button>

            <button
              onClick={() => setView('grid')}
              className={`${s.tabBtnLg} ${view === 'grid' ? s.tabBtnLgActive : ''}`}
            >
              <LayoutGrid size={13} /> Grid
            </button>

          </div>

          <button onClick={toggleTheme} className={s.themeBtn} title="Toggle dark mode">
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>

        </div>

      </div>

      {/* Main Content */}

      <div className={s.main}>

        <div className={s.treeArea}>
          <MemberTree />
        </div>

        {selectedId && <DetailPanel />}

      </div>

    </div>

  );

}
