import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { supabaseAdmin, PHOTOS_BUCKET, photoKeyFromUrl } from '@/lib/supabaseAdmin';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json();
  const updated = await prisma.member.update({ where: { id }, data: body });
  return NextResponse.json(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  // cascade: same recursive pid-walk the store used to do client-side
  const all = await prisma.member.findMany({ select: { id: true, pid: true, photoUrl: true } });
  const byId = new Map(all.map(m => [m.id, m]));
  const toDelete = new Set<string>();
  const collect = (pid: string) => {
    toDelete.add(pid);
    all.filter(m => m.pid === pid).forEach(c => collect(c.id));
  };
  collect(id);
  const deletedIds = [...toDelete];

  // Anyone outside the cascade who still references a deleted member (as a
  // succession target, blood parent, or quota holder) would otherwise keep a
  // dangling id — e.g. a "transferred to" card stays gold forever pointing at
  // a member that no longer exists. Null those references out first.
  await Promise.all([
    prisma.member.updateMany({ where: { succession: { in: deletedIds } }, data: { succession: null } }),
    prisma.member.updateMany({ where: { fatherId: { in: deletedIds } }, data: { fatherId: null } }),
    prisma.member.updateMany({ where: { motherId: { in: deletedIds } }, data: { motherId: null } }),
    prisma.member.updateMany({ where: { pid: { in: deletedIds } }, data: { pid: null } }),
  ]);

  await prisma.member.deleteMany({ where: { id: { in: deletedIds } } });

  // Clean up their uploaded photos too, so Storage doesn't accumulate
  // orphaned files as members get deleted over time.
  const photoKeys = deletedIds
    .map(did => photoKeyFromUrl(byId.get(did)?.photoUrl))
    .filter((k): k is string => !!k);
  if (photoKeys.length) {
    await supabaseAdmin.storage.from(PHOTOS_BUCKET).remove(photoKeys);
  }

  return NextResponse.json({ deletedIds });
}
