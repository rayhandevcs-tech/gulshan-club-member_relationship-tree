import { prisma } from '@/lib/db/prisma';
import { dbToMembers } from '@/lib/db/convert';
import DynamicApp from '@/components/dynamic/DynamicApp';

export const dynamic = 'force-dynamic';

export default async function DynamicPage() {
  const [dbMembers, bioRels, grants, successions, nominees] = await Promise.all([
    prisma.member.findMany({ orderBy: { acNo: 'asc' } }),
    prisma.bioRelationship.findMany(),
    prisma.quotaGrant.findMany({ orderBy: { slotNo: 'asc' } }),
    prisma.successionEvent.findMany({ orderBy: { eventDate: 'asc' } }),
    prisma.nominee.findMany({ orderBy: { priority: 'asc' } }),
  ]);

  const members = dbToMembers(dbMembers, bioRels);

  return (
    <DynamicApp
      members={members}
      rawMembers={dbMembers}
      grants={grants}
      successions={successions}
      nominees={nominees}
    />
  );
}
