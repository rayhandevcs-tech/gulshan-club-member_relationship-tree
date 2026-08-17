// src/app/api/ext-members/route.ts
//
// 'api' data-source mode (see src/lib/dataSource.ts) — the club's own
// system. The fetching, caching and shape conversion all live in ./cache.ts
// (shared with the boot-time warmup in src/instrumentation.ts); this handler
// only decides what to answer with.
//
// GET /api/ext-members            → cached copy when it's current, otherwise
//                                   the previous one while a refresh runs
// GET /api/ext-members?refresh=1  → skip every cache and rebuild from the
//                                   club system, for "I just changed
//                                   something and want to see it"

import { NextResponse } from 'next/server';
import { forceRefreshMembers, peekMembers, refreshMembers } from './cache';

type CacheState = 'fresh' | 'stale' | 'forced';

const respond = (payload: unknown[], state: CacheState) =>
  NextResponse.json(payload, {
    headers: {
      // A forced refresh must not be answerable from any cache in between —
      // that's the whole point of asking for it.
      'Cache-Control': state === 'forced'
        ? 'no-store'
        : 'public, max-age=0, s-maxage=60, stale-while-revalidate=120',
      'X-Members-Cache': state,
    },
  });

export async function GET(request: Request) {
  const forced = new URL(request.url).searchParams.get('refresh') === '1';

  if (forced) {
    try {
      return respond(await forceRefreshMembers(), 'forced');
    } catch (err) {
      console.error('[ext-members] forced refresh', err);
      return NextResponse.json({ error: 'Failed to fetch from external API' }, { status: 502 });
    }
  }

  const cached = peekMembers();

  if (cached?.state === 'fresh') return respond(cached.payload, 'fresh');

  // Stale copy in hand: serve it now, refresh behind the request, so the next
  // load is current. The rejection is swallowed because nobody is waiting on
  // it — a failed refresh just means the next request retries.
  if (cached) {
    void refreshMembers().catch(err => console.error('[ext-members] background refresh', err));
    return respond(cached.payload, 'stale');
  }

  try {
    return respond(await refreshMembers(), 'fresh');
  } catch (err) {
    console.error('[ext-members]', err);
    return NextResponse.json({ error: 'Failed to fetch from external API' }, { status: 502 });
  }
}
