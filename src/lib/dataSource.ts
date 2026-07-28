// Single switch for where the member tree's data comes from. Read-only in
// both modes — there's no write endpoint anymore, everything comes from the
// club's own system.
//
// 'static' — src/lib/demoData.ts, a hardcoded Member[] array built from the
//            same src/lib/demoApiData.ts fixtures the 'api' mode's raw
//            shapes use (via convertApiData.ts) — so 'static' exercises the
//            same conversion code path offline. No network calls.
// 'api'    — the club's external membership system, through
//            /api/ext-members (see that route for the shape conversion).
export type DataSourceMode = 'static' | 'api';

export const DATA_SOURCE: DataSourceMode = 'api';
