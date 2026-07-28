// src/app/api/ext-members/route.ts
//
// 'api' data-source mode (see src/lib/dataSource.ts) — the club's own
// system. Fetches the two raw endpoints and hands them to
// convertApiMembers() (src/lib/convertApiData.ts), which does the actual
// shape conversion — shared with the offline 'static' data source
// (src/lib/demoData.ts), so both paths run identical conversion logic.

import { NextResponse } from 'next/server';
import { convertApiMembers, type CoreMemberDto, type TreeItemDto } from '@/lib/convertApiData';

const BASE = 'http://118.179.152.53/myweb01/api';

export async function GET() {
  try {
    const coreRes = await fetch(`${BASE}/coremember`, { cache: 'no-store' });
    if (!coreRes.ok) throw new Error(`coremember ${coreRes.status}`);
    const coreList: CoreMemberDto[] = await coreRes.json();
    if (!Array.isArray(coreList)) throw new Error('coremember did not return an array');

    const treeByInternalId: Record<string, TreeItemDto[]> = {};

    await Promise.all(
      coreList.map(async core => {
        const internalId = (core.id ?? '').trim();
        if (!internalId) return;
        try {
          const treeRes = await fetch(`${BASE}/mtreedata?id=${internalId}`, { cache: 'no-store' });
          if (!treeRes.ok) throw new Error(`mtreedata ${treeRes.status}`);
          const json = await treeRes.json();
          if (Array.isArray(json)) treeByInternalId[internalId] = json;
        } catch (err) {
          console.error(`[ext-members] mtreedata failed for ${internalId}`, err);
        }
      }),
    );

    return NextResponse.json(convertApiMembers(coreList, treeByInternalId));
  } catch (err) {
    console.error('[ext-members]', err);
    return NextResponse.json({ error: 'Failed to fetch from external API' }, { status: 502 });
  }
}
