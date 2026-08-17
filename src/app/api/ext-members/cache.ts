// src/app/api/ext-members/cache.ts
//
// Fetching + caching for the club roster, kept out of route.ts so the server
// can also warm this at boot (see src/instrumentation.ts) without pulling in
// a route handler.
//
// COST OF ONE COLD LOAD
// ---------------------
// The club system has no bulk endpoint: the member list comes from
// /coremember, and each member's relationships need their own
// /mtreedata?id=<internal id> call. That's 1 + N upstream requests, so this
// module:
//
//   1. Caches the converted result and keeps serving it while a refresh runs
//      in the background — only a genuinely cold process waits for upstream.
//   2. Fetches the N trees through a bounded worker pool instead of firing
//      all of them at once, which the club server handles far better.
//   3. Puts a timeout on every upstream call, so one hung request can't hold
//      the whole response.
//   4. Strips empty fields before the payload is serialised — most members
//      carry mostly nulls, and those bytes are pure transfer + parse cost in
//      the browser.

import { convertApiMembers, type CoreMemberDto, type TreeItemDto } from '@/lib/convertApiData';
import type { Member } from '@/lib/types';

const BASE = 'http://118.179.152.53/myweb01/api';

const CORE_TIMEOUT_MS = 20_000;
const TREE_TIMEOUT_MS = 12_000;
const CONCURRENCY     = 16;

// How long a snapshot counts as current. Short on purpose: the club system
// is edited live, and a DELETED member that lingers on screen is far more
// confusing than a slightly slower load. Past the TTL the cached copy is
// still served once (so nobody waits on the upstream walk) while a refresh
// runs behind that request — the very next load is up to date. Editors who
// can't wait even that long have the ?refresh=1 bypass on the route.
const TTL_MS = 60_000;

type Snapshot = { at: number; payload: unknown[] };

// Module scope survives between requests in the same server process (and per
// instance on serverless), which is exactly the lifetime we want.
let snapshot: Snapshot | null = null;
let inflight: Promise<unknown[]> | null = null;

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

/** Drops null/undefined/'' fields — they carry no meaning to any consumer. */
function compact<T extends object>(obj: T): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === null || v === undefined || v === '') continue;
    out[k] = v;
  }
  return out;
}

function compactMembers(members: Member[]): unknown[] {
  return members.map(m => {
    const out = compact(m);
    if (m.nodes?.length) out.nodes = m.nodes.map(compact);
    else delete out.nodes;
    return out;
  });
}

async function loadFromUpstream(): Promise<unknown[]> {
  const coreRes = await fetch(`${BASE}/coremember`, {
    cache: 'no-store',
    signal: AbortSignal.timeout(CORE_TIMEOUT_MS),
  });
  if (!coreRes.ok) throw new Error(`coremember ${coreRes.status}`);
  const coreList: CoreMemberDto[] = await coreRes.json();
  if (!Array.isArray(coreList)) throw new Error('coremember did not return an array');

  const treeByInternalId: Record<string, TreeItemDto[]> = {};

  const ids = [...new Set(coreList.map(core => (core.id ?? '').trim()).filter(Boolean))];

  await mapLimit(ids, CONCURRENCY, async internalId => {
    try {
      const treeRes = await fetch(`${BASE}/mtreedata?id=${internalId}`, {
        cache: 'no-store',
        signal: AbortSignal.timeout(TREE_TIMEOUT_MS),
      });
      if (!treeRes.ok) throw new Error(`mtreedata ${treeRes.status}`);
      const json = await treeRes.json();
      // A member whose tree call failed still appears in the list — they just
      // render without their relationship nodes, which beats failing the
      // whole page over one bad record.
      if (Array.isArray(json)) treeByInternalId[internalId] = json;
    } catch (err) {
      console.error(`[ext-members] mtreedata failed for ${internalId}`, err);
    }
  });

  return compactMembers(convertApiMembers(coreList, treeByInternalId));
}

/** One refresh at a time, however many requests arrive while it runs. */
export function refreshMembers(): Promise<unknown[]> {
  if (!inflight) {
    inflight = loadFromUpstream()
      .then(payload => {
        snapshot = { at: Date.now(), payload };
        return payload;
      })
      .finally(() => { inflight = null; });
  }
  return inflight;
}

export type MembersState = 'fresh' | 'stale' | 'cold';

/** What's in the cache right now, without going upstream. */
export function peekMembers(): { payload: unknown[]; state: Exclude<MembersState, 'cold'> } | null {
  if (!snapshot) return null;
  return {
    payload: snapshot.payload,
    state: Date.now() - snapshot.at < TTL_MS ? 'fresh' : 'stale',
  };
}

/** Called once at server start — see src/instrumentation.ts. */
export async function warmMembersCache(): Promise<void> {
  if (snapshot) return;
  await refreshMembers();
}

/**
 * Throws the snapshot away and rebuilds it from upstream, for the explicit
 * "refresh" action — a cached copy must never be able to outlive a deletion
 * that someone is standing there waiting to see.
 */
export async function forceRefreshMembers(): Promise<unknown[]> {
  // Deliberately NOT joining any refresh already in flight: that one may have
  // read upstream before the change this caller is trying to see. A manual
  // refresh is rare enough that an extra walk costs nothing.
  snapshot = null;
  const payload = await loadFromUpstream();
  snapshot = { at: Date.now(), payload };
  return payload;
}
