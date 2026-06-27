import type { Member as DBMember, BioRelationship } from '@prisma/client';
import type { Member, MemberType, RelationType } from '@/lib/types';

export function dbToMembers(
  dbMembers: DBMember[],
  bioRels: BioRelationship[],
): Member[] {
  return dbMembers.map(m => {
    const fatherRow = bioRels.find(r => r.subjectAc === m.acNo && r.relType === 'father');
    const motherRow = bioRels.find(r => r.subjectAc === m.acNo && r.relType === 'mother');

    return {
      id: m.acNo,
      name: m.name,
      type: m.memberType as MemberType,
      gender: (m.gender as 'M' | 'F') ?? undefined,
      since: m.joinedDate ?? '',
      email: m.email ?? undefined,
      phone: m.phone ?? undefined,
      memberId: m.memberId ?? undefined,
      birthDate: m.birthDate ?? undefined,
      pid: m.pidAc ?? null,
      rel: (m.relType as RelationType) ?? null,
      fatherId: fatherRow?.relativeAc ?? undefined,
      motherId: motherRow?.relativeAc ?? undefined,
      fatherName: fatherRow?.relativeName ?? undefined,
      motherName: motherRow?.relativeName ?? undefined,
      note: m.notes ?? undefined,
    };
  });
}
