// src/instrumentation.ts
//
// Next runs register() once when the server starts. The membership roster
// takes one call per member to assemble from the club system (see
// src/app/api/ext-members/cache.ts), so whoever loaded the page first used to
// sit through that whole walk. Building it at boot — and then rebuilding it
// on a loop — means no visitor ever waits for the club system, and an edit
// made there shows up on its own within one interval.
//
// Fire-and-forget on purpose: a failure here must never stop the server from
// coming up — the route falls back to fetching on demand exactly as before.

export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;

  const { DATA_SOURCE } = await import('@/lib/dataSource');
  if (DATA_SOURCE !== 'api') return;

  const { startMembersAutoRefresh } = await import('@/app/api/ext-members/cache');
  startMembersAutoRefresh();
}
