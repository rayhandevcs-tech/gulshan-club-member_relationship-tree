// Single switch for where the member tree's data comes from.
//
// 'static'   — src/lib/demoData.ts, a hardcoded Member[] array. No network,
//              no database. Good for offline demos / UI-only walkthroughs.
// 'database' — this app's own Postgres (via Prisma), through /api/members.
//              Fully read/write: Add/Edit/Delete in MemberForm persist here.
// 'api'      — the club's external membership system, through
//              /api/ext-members (see that route for the shape conversion).
//              Read-only — this is what the club asked us to switch to.
//
// Add/Edit/Delete (MemberForm -> memberStore) always write to the local
// Database regardless of this setting, since that's the only mode with a
// write endpoint. In 'static' and 'api' mode, treat the tree as read-only.
export type DataSourceMode = 'static' | 'database' | 'api';

export const DATA_SOURCE: DataSourceMode = 'api';
