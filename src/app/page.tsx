'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemberStore } from '@/store/memberStore';
import { familyMembers } from '@/lib/demoData';
import { DATA_SOURCE } from '@/lib/dataSource';
import { useCachedMembers, writeCachedMembers, clearCachedMembers } from '@/lib/membersCache';
import type { Member } from '@/lib/types';
import MemberTree from '@/components/MemberTree';
import DetailPanel from '@/components/DetailPanel';
import SearchBar from '@/components/SearchBar';
import { LayoutGrid, Network, Sun, Moon, RefreshCw } from 'lucide-react';
import s from './page.module.css';

// Hash of the roster this browser currently holds. The version poll below
// compares against it, so the multi-megabyte payload is re-downloaded only
// when the club system's data has actually changed.
let heldHash: string | null = null;

// `force` makes the server rebuild from the club system before answering —
// see the ?refresh=1 branch in src/app/api/ext-members/route.ts.
async function fetchMembers(force = false): Promise<Member[]> {
  if (DATA_SOURCE === 'static') return familyMembers;

  const res = await fetch(force ? '/api/ext-members?refresh=1' : '/api/ext-members', {
    cache: 'no-store',
  });
  // A failure answers with {error}, not a roster. Handing that straight to
  // the store used to blow up the whole page on the first .map(); throwing
  // puts the query into its error state instead, which the splash below
  // already knows how to show (with a retry).
  if (!res.ok) throw new Error(`members request failed: ${res.status}`);
  const json = await res.json();
  if (!Array.isArray(json)) throw new Error('members request returned an unexpected shape');

  heldHash = res.headers.get('x-members-hash');
  return json as Member[];
}

/** A few dozen bytes identifying the roster the server would serve now. */
async function fetchMembersVersion(): Promise<string | null> {
  if (DATA_SOURCE === 'static') return 'static';

  const res = await fetch('/api/ext-members/version', { cache: 'no-store' });
  if (!res.ok) throw new Error(`version request failed: ${res.status}`);
  const json = await res.json();
  return typeof json?.hash === 'string' ? json.hash : null;
}

// How often to ask whether anything changed upstream. Cheap enough to do
// often; the roster itself only moves when the answer differs.
const VERSION_POLL_MS = 10_000;

export default function Home() {
  const { view, setView, selectedId, setMembers, theme, toggleTheme } = useMemberStore();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  // Last roster this device loaded, if any (undefined during the server
  // render and the hydration pass — see useCachedMembers).
  const cached = useCachedMembers();

  // Data source is a single switch — see src/lib/dataSource.ts.
  const { data, isLoading, isError, isPlaceholderData, refetch } = useQuery<Member[]>({
    queryKey: ['members', DATA_SOURCE],
    queryFn: () => fetchMembers(),
    // Draw the previous visit's roster straight away and swap it for the
    // fresh one when it arrives, instead of holding the whole app on a
    // loading screen. Placeholder data never enters the query cache, so the
    // real fetch still runs exactly as before.
    placeholderData: cached,
  });

  useEffect(() => {
    if (data) setMembers(data);
  }, [data, setMembers]);

  useEffect(() => {
    if (data && !isPlaceholderData) writeCachedMembers(data);
  }, [data, isPlaceholderData]);

  // Watch for changes made in the club system — an added, edited or deleted
  // member — and pull the new roster as soon as one shows up. Polling the
  // hash rather than the roster keeps this to a few dozen bytes a tick.
  const { data: liveHash } = useQuery({
    queryKey: ['members-version', DATA_SOURCE],
    queryFn: fetchMembersVersion,
    refetchInterval: VERSION_POLL_MS,
    refetchIntervalInBackground: false,   // a hidden tab polls nothing
    staleTime: 0,
    gcTime: 60_000,
    retry: 1,
  });

  useEffect(() => {
    if (!liveHash || !heldHash || liveHash === heldHash) return;
    void refetch();
  }, [liveHash, refetch]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  // "I just changed something in the club system and want to see it now":
  // drops this device's saved copy AND makes the server rebuild its own from
  // upstream, so an edit — a deletion especially — can't be masked by a cache
  // anywhere along the way.
  const hardRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    clearCachedMembers();
    try {
      const fresh = await fetchMembers(true);
      queryClient.setQueryData(['members', DATA_SOURCE], fresh);
      // Written here rather than left to the effect below: when the refreshed
      // roster is identical, React Query hands back the same reference and
      // that effect never runs — which would leave this device with no saved
      // copy at all until something actually changed.
      writeCachedMembers(fresh);
    } catch (err) {
      console.error('[members] refresh failed', err);
      await refetch();
    } finally {
      setRefreshing(false);
    }
  };

  // A cold load has to walk the club system member by member (see
  // /api/ext-members), so this screen can be up for a few seconds — give it
  // the club's own mark and a progress shimmer rather than bare grey text.
  if (isLoading || isError) {
    return (
      <div className={s.splash}>
        <span className={s.splashLogoWrap}>
          <Image src="/new_logo.png" alt="Gulshan Club Limited" width={289} height={253} priority className={s.splashLogo} />
        </span>
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
            {/* The club mark (public/new_logo.png). The artwork carries a
                small white wordmark under the monogram; the crop in
                .logoWrap hides it, since the club name is set beside it in
                the club's gold instead. priority: it's part of first paint. */}
            <span className={s.logoWrap}>
              <Image
                src="/new_logo.png"
                alt="Gulshan Club Limited"
                width={289}
                height={253}
                priority
                className={s.logo}
              />
            </span>
            <div className={s.brandText}>
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

            <button
              onClick={hardRefresh}
              className={`${s.themeBtn} ${refreshing ? s.refreshing : ''}`}
              title="Reload members from the club system"
            >
              <RefreshCw size={13} />
            </button>

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

          <button
            onClick={hardRefresh}
            className={`${s.themeBtn} ${refreshing ? s.refreshing : ''}`}
            title="Reload members from the club system"
          >
            <RefreshCw size={14} />
          </button>

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
