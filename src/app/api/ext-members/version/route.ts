// src/app/api/ext-members/version/route.ts
//
// A few dozen bytes saying "this is the roster you'd get right now".
//
// The roster itself is megabytes, so re-downloading it every few seconds just
// to notice an edit would be absurd. Instead the browser polls this, and only
// pulls the full payload when `hash` differs from the one it already holds —
// which is how a member added or deleted in the club system appears on screen
// without anyone pressing anything.

import { NextResponse } from 'next/server';
import { ensureMembersFresh, peekMembers, refreshMembers, startMembersAutoRefresh } from '../cache';

export const dynamic = 'force-dynamic';

export async function GET() {
  startMembersAutoRefresh();

  let current = peekMembers();
  if (current) {
    ensureMembersFresh();
  } else {
    // Nothing built yet (cold instance): build it, so a poll can't sit in a
    // loop reporting "not ready".
    try {
      current = await refreshMembers();
    } catch (err) {
      console.error('[ext-members/version]', err);
      return NextResponse.json({ error: 'unavailable' }, { status: 502, headers: { 'Cache-Control': 'no-store' } });
    }
  }

  return NextResponse.json(
    { hash: current.hash, builtAt: new Date(current.at).toISOString(), count: current.count },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
