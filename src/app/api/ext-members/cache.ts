// src/app/api/ext-members/cache.ts
//
// Keeps an up-to-date copy of the club roster in memory, so the app can be
// both fast AND current — the two things that pull against each other here.
//
// WHY A COPY AT ALL
// -----------------
// The club system has no bulk endpoint: the member list comes from
// /coremember (one request), but each member's relationships need their own
// /mtreedata?id=<internal id> call. A page load that assembled this from
// scratch would make 1 + N upstream requests and take as long as the club
// server needs to answer all of them. So it is assembled here, once, and
// every request is answered from the result.
//
// KEEPING IT CURRENT WITHOUT HAMMERING UPSTREAM
// ---------------------------------------------
// A stale copy is the whole problem this file has to avoid: a member deleted
// in the club system must not keep showing up here. But rebuilding
// constantly would mean walking the club server end to end, forever.
//
// So revalidation is tiered — cheap check often, expensive walk rarely:
//
//   every POLL_MS       fetch /coremember alone (ONE request) and compare it
//                       with the last one. Any member added, removed or
//                       renamed shows up there, and any difference triggers
//                       a full rebuild immediately.
//   every FULL_SWEEP_MS rebuild regardless, which is what catches edits
//                       /coremember can't show — a child or 4(d) row added
//                       to or removed from someone's tree while both
//                       accounts already existed. The gap between sweeps is
//                       also never allowed below three times how long the
//                       last walk actually took, so a club server that
//                       answers slowly automatically gets left alone more,
//                       rather than being walked back-to-back.
//
// Nothing ever waits on either of those: they run in the background, and
// requests are served from the last completed build. Anyone who needs a
// change reflected THIS SECOND has the ?refresh=1 path on the route (the
// header's refresh button), which rebuilds and then answers.
//
// Both intervals are environment variables, so they can be tuned per
// deployment without a code change:
//
//   MEMBERS_POLL_SECONDS        default 15  cheap check
//   MEMBERS_FULL_SWEEP_SECONDS  default 45  unconditional full rebuild

import { createHash } from 'node:crypto';
import { convertApiMembers, type CoreMemberDto, type TreeItemDto } from '@/lib/convertApiData';
import type { Member } from '@/lib/types';

// The club's own system. Overridable (MEMBERS_API_BASE) so a deployment can
// be pointed at a staging copy — or a local stand-in while testing that an
// upstream edit really does reach the screen on its own.
const BASE = process.env.MEMBERS_API_BASE ?? 'http://118.179.152.53/myweb01/api';

const CORE_TIMEOUT_MS = 20_000;
const TREE_TIMEOUT_MS = 12_000;
const CONCURRENCY     = 16;

const seconds = (value: string | undefined, fallback: number, floor: number) =>
  Math.max(floor, Number(value ?? fallback) || fallback) * 1000;

const POLL_MS       = seconds(process.env.MEMBERS_POLL_SECONDS, 15, 5);
const FULL_SWEEP_MS = seconds(process.env.MEMBERS_FULL_SWEEP_SECONDS, 45, 15);

// A full walk must never occupy more than about a third of the time between
// walks — see the header note on FULL_SWEEP_MS.
const WALK_DUTY_FACTOR = 3;

// The payload is serialised ONCE per build and handed out as-is: it is a few
// megabytes, and re-serialising it per request was pure waste. `hash`
// identifies this exact roster — see the /version route, which is how
// browsers notice a change without re-downloading anything.
export type Snapshot = { at: number; json: string; hash: string; count: number };

// Module scope survives between requests in the same server process (and per
// instance on serverless), which is exactly the lifetime we want.
let snapshot: Snapshot | null = null;
let inflight: Promise<Snapshot> | null = null;
let loopTimer: ReturnType<typeof setTimeout> | null = null;
let lastCoreKey: string | null = null;
let lastWalkMs = 0;

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

async function fetchCoreList(): Promise<CoreMemberDto[]> {
  const res = await fetch(`${BASE}/coremember`, {
    cache: 'no-store',
    signal: AbortSignal.timeout(CORE_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`coremember ${res.status}`);
  const list = await res.json();
  if (!Array.isArray(list)) throw new Error('coremember did not return an array');
  return list as CoreMemberDto[];
}

async function loadFromUpstream(coreList?: CoreMemberDto[]): Promise<Snapshot> {
  const startedAt = Date.now();
  const core = coreList ?? await fetchCoreList();
  lastCoreKey = JSON.stringify(core);

  const treeByInternalId: Record<string, TreeItemDto[]> = {};
  const ids = [...new Set(core.map(c => (c.id ?? '').trim()).filter(Boolean))];

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

  const members = compactMembers(convertApiMembers(core, treeByInternalId));
  const json = JSON.stringify(members);
  lastWalkMs = Date.now() - startedAt;
  return {
    at: Date.now(),
    json,
    hash: createHash('sha1').update(json).digest('hex').slice(0, 16),
    count: members.length,
  };
}

/** One rebuild at a time, however many callers ask while it runs. */
export function refreshMembers(coreList?: CoreMemberDto[]): Promise<Snapshot> {
  if (!inflight) {
    inflight = loadFromUpstream(coreList)
      .then(next => { snapshot = next; return next; })
      .finally(() => { inflight = null; });
  }
  return inflight;
}

/** The roster as it stands, without going upstream. */
export const peekMembers = (): Snapshot | null => snapshot;

/**
 * One revalidation pass: the cheap check, escalating to a full rebuild when
 * the member list moved or the last full rebuild has aged out.
 */
async function revalidate(): Promise<void> {
  if (!snapshot) { await refreshMembers(); return; }

  const core = await fetchCoreList();
  const coreKey = JSON.stringify(core);
  const listChanged = coreKey !== lastCoreKey;
  const sweepAfter = Math.max(FULL_SWEEP_MS, lastWalkMs * WALK_DUTY_FACTOR);
  const sweepDue = Date.now() - snapshot.at >= sweepAfter;

  if (listChanged || sweepDue) {
    // hand over the list we just fetched — no reason to ask for it twice
    await refreshMembers(core);
    return;
  }
  lastCoreKey = coreKey;
}

/**
 * Revalidates on a loop, forever. Each pass is scheduled only after the
 * previous one FINISHES, so a slow walk can never stack up overlapping calls
 * on the club server.
 *
 * Long-running servers keep this ticking. On serverless, where an idle
 * instance is frozen and timers stop, the routes call ensureMembersFresh()
 * per request — so both hosting models stay current.
 */
export function startMembersAutoRefresh(): void {
  if (loopTimer) return;

  const schedule = () => {
    if (loopTimer) return;
    loopTimer = setTimeout(() => void tick(), POLL_MS);
    loopTimer.unref?.();   // don't hold the process open just for this
  };

  const tick = async () => {
    loopTimer = null;
    try {
      await revalidate();
    } catch (err) {
      console.error('[ext-members] scheduled revalidation', err);
    }
    schedule();
  };

  void tick();
}

/**
 * Kicks a revalidation if the roster has aged past the poll interval — the
 * safety net for hosts that freeze background timers between requests. Never
 * blocks the caller.
 */
export function ensureMembersFresh(): void {
  if (!snapshot || inflight) return;
  if (Date.now() - snapshot.at < POLL_MS) return;
  void revalidate().catch(err => console.error('[ext-members] on-request revalidation', err));
}

/**
 * Rebuilds now and waits for it — the explicit "refresh" action. Deliberately
 * NOT joining a rebuild already in flight: that one may have read upstream
 * before the change the caller is trying to see.
 */
export async function forceRefreshMembers(): Promise<Snapshot> {
  const next = await loadFromUpstream();
  snapshot = next;
  return next;
}
