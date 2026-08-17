// src/instrumentation.ts
//
// Next runs register() once when the server starts. The membership roster
// takes one call per member to assemble from the club system (see
// src/app/api/ext-members/route.ts), so whoever loaded the page first used
// to sit through that whole walk. Warming the cache at boot means the first
// visitor usually gets a ready-made snapshot instead.
//
// Fire-and-forget on purpose: a failure here must never stop the server from
// coming up — the route falls back to fetching on demand exactly as before.

export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;

  const { DATA_SOURCE } = await import('@/lib/dataSource');
  if (DATA_SOURCE !== 'api') return;

  const { warmMembersCache } = await import('@/app/api/ext-members/cache');
  void warmMembersCache().catch(err => console.error('[warmup] members', err));
}
