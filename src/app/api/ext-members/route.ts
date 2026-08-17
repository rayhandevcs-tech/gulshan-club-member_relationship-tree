// src/app/api/ext-members/route.ts
//
// 'api' data-source mode (see src/lib/dataSource.ts) — the club's own
// system. The fetching and shape conversion live in ./cache.ts, which keeps
// the roster rebuilt on a loop; this handler only hands out whatever that
// last completed build produced.
//
// GET /api/ext-members            → the current roster, served straight from
//                                   memory (no request ever waits on the club
//                                   system once the first build is done)
// GET /api/ext-members?refresh=1  → rebuild from the club system first, then
//                                   answer — the manual "show me now" path
//
// Nothing here may be cached on the wire: the payload changes whenever the
// club system does, and browsers only re-download it when /version tells them
// the hash changed, so there is nothing to gain from a stale copy in between.

import { NextResponse } from 'next/server';
import { ensureMembersFresh, forceRefreshMembers, peekMembers, refreshMembers, startMembersAutoRefresh } from './cache';

export const dynamic = 'force-dynamic';

const serve = (snapshot: { json: string; hash: string; at: number }, state: 'live' | 'forced') =>
  new Response(snapshot.json, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      'X-Members-Hash': snapshot.hash,
      'X-Members-Built-At': new Date(snapshot.at).toISOString(),
      'X-Members-State': state,
    },
  });

const failed = () =>
  NextResponse.json({ error: 'Failed to fetch from external API' }, { status: 502, headers: { 'Cache-Control': 'no-store' } });

export async function GET(request: Request) {
  // Hosts that freeze idle instances lose the background loop; re-arming it
  // on a request is what keeps those deployments current too.
  startMembersAutoRefresh();

  if (new URL(request.url).searchParams.get('refresh') === '1') {
    try {
      return serve(await forceRefreshMembers(), 'forced');
    } catch (err) {
      console.error('[ext-members] forced refresh', err);
      return failed();
    }
  }

  const current = peekMembers();
  if (current) {
    ensureMembersFresh();       // never blocks — rebuilds behind this response
    return serve(current, 'live');
  }

  try {
    return serve(await refreshMembers(), 'live');
  } catch (err) {
    console.error('[ext-members]', err);
    return failed();
  }
}
