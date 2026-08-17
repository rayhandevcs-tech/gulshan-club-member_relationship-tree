// src/app/api/ext-members/route.ts
//
// 'api' data-source mode (see src/lib/dataSource.ts) — the club's own
// system. The fetching, caching and shape conversion all live in ./cache.ts
// (shared with the boot-time warmup in src/instrumentation.ts); this handler
// only decides what to answer with.

import { NextResponse } from 'next/server';
import { peekMembers, refreshMembers } from './cache';

const respond = (payload: unknown[], state: 'fresh' | 'stale') =>
  NextResponse.json(payload, {
    headers: {
      // Shared caches (a CDN in front of the deployment) can hold this too;
      // the browser revalidates, which is cheap once this route is warm.
      'Cache-Control': 'public, max-age=0, s-maxage=300, stale-while-revalidate=3600',
      'X-Members-Cache': state,
    },
  });

export async function GET() {
  const cached = peekMembers();

  if (cached?.state === 'fresh') return respond(cached.payload, 'fresh');

  // Stale copy in hand: serve it now, refresh behind the request. The
  // rejection is swallowed because nobody is waiting on it — a failed
  // refresh just means the next request retries.
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
