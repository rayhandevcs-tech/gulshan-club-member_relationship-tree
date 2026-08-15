'use client';

import { useEffect } from 'react';
import Image from 'next/image';
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
  const { data, isLoading, isError, refetch } = useQuery({
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

  // A cold load has to walk the club system member by member (see
  // /api/ext-members), so this screen can be up for a few seconds — give it
  // the club's own mark and a progress shimmer rather than bare grey text.
  if (isLoading || isError) {
    return (
      <div className={s.splash}>
        <Image src="/GC_LOGO.png" alt="Gulshan Club Limited" width={72} height={72} priority className={s.splashLogo} />
        <div className={s.splashTitle}>Gulshan Club Limited</div>
        {isError ? (
          <>
            <div className={s.splashError}>Could not reach the membership system.</div>
            <button onClick={() => refetch()} className={s.splashRetry}>Try again</button>
          </>
        ) : (
          <>
            <div className={s.splashHint}>Loading membership records…</div>
            <div className={s.splashBar}><span /></div>
          </>
        )}
      </div>
    );
  }

  return (

    <div className={s.root}>

      {/* Header */}
      <div className={s.header}>

        {/* Row 1: Title + mobile action buttons */}
        <div className={s.titleRow}>

          <div className={s.brand}>
            {/* the club's own mark (public/GC_LOGO.png); priority because it
                sits in the header and is part of the first paint */}
            <Image
              src="/GC_LOGO.png"
              alt="Gulshan Club Limited"
              width={44}
              height={44}
              priority
              className={s.logo}
            />
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
