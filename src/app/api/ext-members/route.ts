// src/app/api/ext-members/route.ts
//
// 'api' data-source mode (see src/lib/dataSource.ts) — the club's own
// system. Fetches the two raw endpoints and hands them to
// convertApiMembers() (src/lib/convertApiData.ts), which does the actual
// shape conversion — shared with the offline 'static' data source
// (src/lib/demoData.ts), so both paths run identical conversion logic.
//
// COST OF ONE COLD LOAD
// ---------------------
// The club system has no bulk endpoint: the member list comes from
// /coremember, and each member's relationships need their own
// /mtreedata?id=<internal id> call. That's 1 + N upstream requests for a
// single page load, so this route does three things to keep the wait sane:
//
//   1. Caches the converted result in memory and serves it for TTL_MS,
//      then keeps serving the stale copy while a refresh runs in the
//      background — only a genuinely cold process ever waits for upstream.
//   2. Fetches the N trees through a bounded worker pool instead of firing
//      all of them at once, which the club server handles far better.
//   3. Puts a timeout on every upstream call, so one hung request can't
//      hold the whole response (previously the slowest call set the page's
//      load time, with no ceiling at all).

import { NextResponse } from 'next/server';
import { convertApiMembers, type CoreMemberDto, type TreeItemDto } from '@/lib/convertApiData';
import type { Member } from '@/lib/types';

const BASE = 'http://118.179.152.53/myweb01/api';

const CORE_TIMEOUT_MS = 20_000;
const TREE_TIMEOUT_MS = 12_000;
const CONCURRENCY     = 12;

// Membership data changes rarely; a few minutes of staleness is invisible to
// a member browsing the tree, and it turns nearly every load into a hit.
const TTL_MS = 5 * 60_000;

type Snapshot = { at: number; members: Member[] };

// Module scope survives between requests in the same server process (and
// per instance on serverless), which is exactly the lifetime we want.
let snapshot: Snapshot | null = null;
let inflight: Promise<Member[]> | null = null;

/** Runs `task` over `items`, at most `limit` at a time. */
async function mapLimit<T>(items: T[], limit: number, task: (item: T) => Promise<void>): Promise<void> {
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    for (;;) {
      const i = cursor++;
      if (i >= items.length) return;
      await task(items[i]);
    }
  });
  await Promise.all(workers);
}

async function loadFromUpstream(): Promise<Member[]> {
  const coreRes = await fetch(`${BASE}/coremember`, {
    cache: 'no-store',
    signal: AbortSignal.timeout(CORE_TIMEOUT_MS),
  });
  if (!coreRes.ok) throw new Error(`coremember ${coreRes.status}`);
  const coreList: CoreMemberDto[] = await coreRes.json();
  if (!Array.isArray(coreList)) throw new Error('coremember did not return an array');

  const treeByInternalId: Record<string, TreeItemDto[]> = {};

  const ids = coreList
    .map(core => (core.id ?? '').trim())
    .filter((id, i, all) => id && all.indexOf(id) === i);

  await mapLimit(ids, CONCURRENCY, async internalId => {
    try {
      const treeRes = await fetch(`${BASE}/mtreedata?id=${internalId}`, {
        cache: 'no-store',
        signal: AbortSignal.timeout(TREE_TIMEOUT_MS),
      });
      if (!treeRes.ok) throw new Error(`mtreedata ${treeRes.status}`);
      const json = await treeRes.json();
      // A member whose tree call failed still appears in the list — they
      // just render without their relationship nodes, which beats failing
      // the whole page over one bad record.
      if (Array.isArray(json)) treeByInternalId[internalId] = json;
    } catch (err) {
      console.error(`[ext-members] mtreedata failed for ${internalId}`, err);
    }
  });

  return convertApiMembers(coreList, treeByInternalId);
}

/** One refresh at a time, however many requests arrive while it runs. */
function refresh(): Promise<Member[]> {
  if (!inflight) {
    inflight = loadFromUpstream()
      .then(members => {
        snapshot = { at: Date.now(), members };
        return members;
      })
      .finally(() => { inflight = null; });
  }
  return inflight;
}

const respond = (members: Member[], state: 'fresh' | 'stale') =>
  NextResponse.json(members, {
    headers: {
      // Shared caches (a CDN in front of the deployment) can hold this too;
      // the browser revalidates, which is cheap once this route is warm.
      'Cache-Control': 'public, max-age=0, s-maxage=300, stale-while-revalidate=3600',
      'X-Members-Cache': state,
    },
  });

export async function GET() {
  if (snapshot && Date.now() - snapshot.at < TTL_MS) {
    return respond(snapshot.members, 'fresh');
  }

  // Stale copy in hand: serve it now, refresh behind the request. The
  // rejection is swallowed here because nobody is waiting on it — a failed
  // refresh just means the next request retries.
  if (snapshot) {
    void refresh().catch(err => console.error('[ext-members] background refresh', err));
    return respond(snapshot.members, 'stale');
  }

  try {
    return respond(await refresh(), 'fresh');
  } catch (err) {
    console.error('[ext-members]', err);
    return NextResponse.json({ error: 'Failed to fetch from external API' }, { status: 502 });
  }
}
