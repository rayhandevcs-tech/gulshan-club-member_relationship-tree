'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db/prisma';

// ── Member CRUD ───────────────────────────────────────────────────────────

export async function addMember(data: {
  acNo: string;
  name: string;
  gender?: string;
  birthDate?: string;
  memberType: string;
  joinedDate?: string;
  email?: string;
  phone?: string;
  memberId?: string;
  notes?: string;
  pidAc?: string;
  relType?: string;
  // Bio parents
  fatherAc?: string;
  fatherName?: string;
  motherAc?: string;
  motherName?: string;
  spouseAc?: string;
  // Quota grant
  grantorAc?: string;
  grantType?: string;
  slotNo?: number;
  articleRef?: string;
}) {
  const { fatherAc, fatherName, motherAc, motherName, spouseAc,
    grantorAc, grantType, slotNo, articleRef, ...memberData } = data;

  await prisma.$transaction(async tx => {
    await tx.member.create({ data: memberData });

    const bioRows = [];
    if (fatherAc || fatherName) bioRows.push({ subjectAc: data.acNo, relativeAc: fatherAc ?? null, relativeName: fatherName ?? null, relType: 'father' });
    if (motherAc || motherName) bioRows.push({ subjectAc: data.acNo, relativeAc: motherAc ?? null, relativeName: motherName ?? null, relType: 'mother' });
    if (spouseAc) {
      bioRows.push({ subjectAc: data.acNo, relativeAc: spouseAc, relativeName: null, relType: 'spouse' });
      await tx.bioRelationship.upsert({
        where: { subjectAc_relType_relativeAc: { subjectAc: spouseAc, relType: 'spouse', relativeAc: data.acNo } },
        create: { subjectAc: spouseAc, relativeAc: data.acNo, relativeName: null, relType: 'spouse' },
        update: {},
      });
    }
    for (const row of bioRows) {
      await tx.bioRelationship.upsert({
        where: { subjectAc_relType_relativeAc: { subjectAc: row.subjectAc, relType: row.relType, relativeAc: row.relativeAc ?? '' } },
        create: row,
        update: {},
      });
    }

    if (grantorAc && grantType && slotNo) {
      await tx.quotaGrant.create({
        data: { grantorAc, granteeAc: data.acNo, grantType, slotNo, articleRef: articleRef ?? null, grantedDate: data.joinedDate ?? null },
      });
    }
  });

  revalidatePath('/dynamic');
}

export async function updateMemberStatus(acNo: string, status: string) {
  await prisma.member.update({ where: { acNo }, data: { status } });
  revalidatePath('/dynamic');
}

export async function deleteMember(acNo: string) {
  await prisma.$transaction(async tx => {
    await tx.bioRelationship.deleteMany({ where: { OR: [{ subjectAc: acNo }, { relativeAc: acNo }] } });
    await tx.quotaGrant.deleteMany({ where: { OR: [{ grantorAc: acNo }, { granteeAc: acNo }] } });
    await tx.nominee.deleteMany({ where: { memberAc: acNo } });
    await tx.successionEvent.deleteMany({ where: { OR: [{ fromAc: acNo }, { toAc: acNo }] } });
    await tx.member.delete({ where: { acNo } });
  });
  revalidatePath('/dynamic');
}

// ── Quota / Succession / Nominee ──────────────────────────────────────────

export async function cancelQuota(granteeAc: string, reason: string) {
  const today = new Date().toISOString().slice(0, 10);
  await prisma.quotaGrant.update({
    where: { granteeAc },
    data: { status: 'Cancelled', cancelReason: reason, cancelDate: today },
  });
  revalidatePath('/dynamic');
}

export async function addSuccession(data: {
  fromAc: string; toAc: string; eventType: string;
  eventDate?: string; articleRef?: string; successorRel?: string; remarks?: string;
}) {
  await prisma.successionEvent.create({ data });
  await prisma.member.update({ where: { acNo: data.fromAc }, data: { status: 'Transferred' } });
  revalidatePath('/dynamic');
}

export async function addNominee(data: {
  memberAc: string; nomineeName: string; relToMember?: string;
  priority: number; nominatedDate?: string;
}) {
  await prisma.nominee.create({ data });
  revalidatePath('/dynamic');
}

// ── Seed test cases ───────────────────────────────────────────────────────

export async function clearAll() {
  await prisma.$transaction([
    prisma.bioRelationship.deleteMany(),
    prisma.quotaGrant.deleteMany(),
    prisma.nominee.deleteMany(),
    prisma.successionEvent.deleteMany(),
    prisma.member.deleteMany(),
  ]);
  revalidatePath('/dynamic');
}

export async function seedCase(caseId: string) {
  await clearAll();

  if (caseId === 'case1') await seedCase1();
  if (caseId === 'case2') await seedCase2();
  if (caseId === 'case3') await seedCase3();
  if (caseId === 'case4') await seedCase4();
  if (caseId === 'case5') await seedCase5();

  revalidatePath('/dynamic');
}

// Case 1 — Standard A4D: Life member → children become Permanent
async function seedCase1() {
  await prisma.member.createMany({ data: [
    { acNo: 'LM-11', name: 'Md. Saiful Islam',    gender: 'M', memberType: 'Life',      joinedDate: '28/10/1985', birthDate: '20/06/1944', email: 'islam1944bd@gmail.com', phone: '+8801711538657', memberId: 'LM000066', pidAc: null,    relType: null     },
    { acNo: 'LS-8',  name: 'Sultana Shaheda Islam',gender: 'F', memberType: 'Life',      joinedDate: '28/10/1985', birthDate: '21/02/1947', email: 'ssbdl@agni.com',        phone: '+8801819213808', memberId: 'LM000079', pidAc: 'LM-11', relType: 'spouse'  },
    { acNo: 'PT-7',  name: 'Tahmina Rehman',       gender: 'F', memberType: 'Permanent', joinedDate: '12/12/1995', birthDate: '18/09/1967', email: 'tahminar67@gmail.com',   phone: '+8801713012475', memberId: 'PM001564', pidAc: 'LM-11', relType: 'child'   },
    { acNo: 'PW-6',  name: 'Late Wasim Sajjad',    gender: 'M', memberType: 'Permanent', joinedDate: '15/10/2001', birthDate: '28/02/1971', email: 'wali@utahgroup.net',     phone: '+8801711595459', memberId: 'PM001507', pidAc: 'LM-11', relType: 'child',  status: 'Deceased' },
  ]});
  await prisma.bioRelationship.createMany({ data: [
    { subjectAc: 'LS-8', relativeAc: 'LM-11', relType: 'spouse' },
    { subjectAc: 'LM-11',relativeAc: 'LS-8',  relType: 'spouse' },
    { subjectAc: 'PT-7', relativeAc: 'LM-11', relType: 'father' },
    { subjectAc: 'PT-7', relativeAc: 'LS-8',  relType: 'mother' },
    { subjectAc: 'PW-6', relativeAc: 'LM-11', relType: 'father' },
    { subjectAc: 'PW-6', relativeAc: 'LS-8',  relType: 'mother' },
  ]});
  await prisma.quotaGrant.createMany({ data: [
    { grantorAc: 'LM-11', granteeAc: 'PT-7', grantType: 'A4D', slotNo: 1, articleRef: 'Article 4', grantedDate: '12/12/1995' },
    { grantorAc: 'LM-11', granteeAc: 'PW-6', grantType: 'A4D', slotNo: 2, articleRef: 'Article 4', grantedDate: '15/10/2001' },
  ]});
}

// Case 2 — Spouse gets A4D slot + child gets A4D slot
async function seedCase2() {
  await seedCase1();
  await prisma.member.createMany({ data: [
    { acNo: 'PO-10',  name: 'Omar Hamid Chowdhury', gender: 'M', memberType: 'Permanent', joinedDate: '04/03/2018', birthDate: '10/10/1969', email: 'omar.dhaka@gmail.com', phone: '+8801711593144', memberId: 'PM000288', pidAc: 'PT-7', relType: 'spouse' },
    { acNo: 'PS-329', name: 'Sanjana Chowdhury',    gender: 'F', memberType: 'Permanent', joinedDate: '17/09/2018', birthDate: '11/03/1997', email: 'transaction.gcl@gmail.com', memberId: 'PM001571', pidAc: 'PT-7', relType: 'a4d' },
  ]});
  await prisma.bioRelationship.createMany({ data: [
    { subjectAc: 'PT-7',   relativeAc: 'PO-10', relType: 'spouse' },
    { subjectAc: 'PO-10',  relativeAc: 'PT-7',  relType: 'spouse' },
    { subjectAc: 'PS-329', relativeAc: 'PO-10', relType: 'father' },
    { subjectAc: 'PS-329', relativeAc: 'PT-7',  relType: 'mother' },
  ]});
  await prisma.quotaGrant.createMany({ data: [
    { grantorAc: 'PT-7', granteeAc: 'PO-10',  grantType: 'A4D', slotNo: 1, articleRef: 'Article 4', grantedDate: '04/03/2018' },
    { grantorAc: 'PT-7', granteeAc: 'PS-329', grantType: 'A4D', slotNo: 2, articleRef: 'Article 4', grantedDate: '17/09/2018' },
  ]});
}

// Case 3 — Cross-family A4D: grandparent gives quota to grandchild
async function seedCase3() {
  await seedCase2();
  await prisma.member.createMany({ data: [
    { acNo: 'PK-49',    name: 'Kaniz Fatema',          gender: 'F', memberType: 'Permanent', joinedDate: '28/09/2016', birthDate: '13/11/1973', email: 'kanizfsajjad@gmail.com', phone: '+88029843422', memberId: 'PM000436', pidAc: 'PW-6', relType: 'spouse' },
    { acNo: 'PS-338',   name: 'Shareef Omar Chowdhury', gender: 'M', memberType: 'Permanent', joinedDate: '17/09/2018', birthDate: '25/08/1995', email: 'shareef.arsenal95@gmail.com', memberId: 'PM001341', pidAc: 'LS-8',  relType: 'a4d' },
    { acNo: 'AFD-0443', name: 'Areesh Sajjad',          gender: 'F', memberType: 'A4D',       joinedDate: '01/05/2020', pidAc: 'LM-11', relType: 'a4d' },
    { acNo: 'AFD-0444', name: 'Ayyaz Sajjad',           gender: 'M', memberType: 'A4D',       joinedDate: '01/05/2020', pidAc: 'LM-11', relType: 'a4d' },
    { acNo: 'AFD-0529', name: 'Daneen Arif',            gender: 'F', memberType: 'A4D',       joinedDate: '15/09/2022', pidAc: 'LS-8',  relType: 'a4d' },
  ]});
  await prisma.bioRelationship.createMany({ data: [
    { subjectAc: 'PW-6',    relativeAc: 'PK-49',   relType: 'spouse' },
    { subjectAc: 'PK-49',   relativeAc: 'PW-6',    relType: 'spouse' },
    { subjectAc: 'AFD-0443',relativeAc: 'PW-6',    relType: 'father' },
    { subjectAc: 'AFD-0443',relativeAc: 'PK-49',   relType: 'mother' },
    { subjectAc: 'AFD-0444',relativeAc: 'PW-6',    relType: 'father' },
    { subjectAc: 'AFD-0444',relativeAc: 'PK-49',   relType: 'mother' },
    { subjectAc: 'PS-338',  relativeAc: 'PO-10',   relType: 'father' },
    { subjectAc: 'PS-338',  relativeAc: 'PT-7',    relType: 'mother' },
  ]});
  await prisma.quotaGrant.createMany({ data: [
    { grantorAc: 'LS-8',  granteeAc: 'PS-338',   grantType: 'A4D', slotNo: 1, articleRef: 'Article 4', grantedDate: '17/09/2018' },
    { grantorAc: 'LS-8',  granteeAc: 'AFD-0529', grantType: 'A4D', slotNo: 2, articleRef: 'Article 4', grantedDate: '15/09/2022' },
    { grantorAc: 'LM-11', granteeAc: 'AFD-0443', grantType: 'A4D', slotNo: 3, articleRef: 'Article 4', grantedDate: '01/05/2020' },
    { grantorAc: 'LM-11', granteeAc: 'AFD-0444', grantType: 'A4D', slotNo: 4, articleRef: 'Article 4', grantedDate: '01/05/2020' },
  ]});
  await prisma.nominee.createMany({ data: [
    { memberAc: 'LM-11', nomineeName: 'Tahmina Rehman', relToMember: 'Daughter', priority: 1 },
    { memberAc: 'LM-11', nomineeName: 'Wasim Sajjad',   relToMember: 'Son',      priority: 2 },
  ]});
}

// Case 4 — Associate membership + cancellation on death
async function seedCase4() {
  await prisma.member.createMany({ data: [
    { acNo: 'DR-20', name: 'Rashed Hassan',  gender: 'M', memberType: 'Donor', joinedDate: '01/06/1995', status: 'Deceased' },
    { acNo: 'DS-21', name: 'Salma Hassan',   gender: 'F', memberType: 'Donor', joinedDate: '01/06/1995', pidAc: 'DR-20', relType: 'spouse' },
    { acNo: 'DA-22', name: 'Ahmed Hassan',   gender: 'M', memberType: 'A4D',   joinedDate: '10/03/2020', pidAc: 'DR-20', relType: 'a4d'    },
    // Associates under DR-20 — should cancel when DR-20 dies
    { acNo: 'AR-23', name: 'Karim Secretary', gender: 'M', memberType: 'Associate', joinedDate: '15/05/2018', pidAc: 'DR-20', relType: 'associate', status: 'Cancelled' },
    { acNo: 'AR-24', name: 'Nusrat Friend',   gender: 'F', memberType: 'Associate', joinedDate: '20/09/2019', pidAc: 'DR-20', relType: 'associate', status: 'Cancelled' },
    // Associate under DA-22 (A4D) — also cancel
    { acNo: 'AR-25', name: 'Farhan Colleague',gender: 'M', memberType: 'Associate', joinedDate: '05/01/2022', pidAc: 'DA-22', relType: 'associate', status: 'Cancelled' },
    // New Donor for DR-20's succession
    { acNo: 'DH-26', name: 'Ahmed Hassan',   gender: 'M', memberType: 'Donor', joinedDate: '20/11/2023', memberId: 'DH000001' },
  ]});
  await prisma.bioRelationship.createMany({ data: [
    { subjectAc: 'DR-20', relativeAc: 'DS-21', relType: 'spouse' },
    { subjectAc: 'DS-21', relativeAc: 'DR-20', relType: 'spouse' },
    { subjectAc: 'DA-22', relativeAc: 'DR-20', relType: 'father' },
    { subjectAc: 'DA-22', relativeAc: 'DS-21', relType: 'mother' },
    { subjectAc: 'DH-26', relativeAc: 'DR-20', relType: 'father' },
    { subjectAc: 'DH-26', relativeAc: 'DS-21', relType: 'mother' },
  ]});
  await prisma.quotaGrant.createMany({ data: [
    { grantorAc: 'DR-20', granteeAc: 'DA-22', grantType: 'A4D',       slotNo: 1, articleRef: 'Article 4',  grantedDate: '10/03/2020' },
    { grantorAc: 'DR-20', granteeAc: 'AR-23', grantType: 'Associate', slotNo: 1, articleRef: 'DLP',        grantedDate: '15/05/2018', status: 'Cancelled', cancelReason: 'Core member deceased', cancelDate: '20/11/2023' },
    { grantorAc: 'DR-20', granteeAc: 'AR-24', grantType: 'Associate', slotNo: 2, articleRef: 'DLP',        grantedDate: '20/09/2019', status: 'Cancelled', cancelReason: 'Core member deceased', cancelDate: '20/11/2023' },
    { grantorAc: 'DA-22', granteeAc: 'AR-25', grantType: 'Associate', slotNo: 1, articleRef: 'DLP',        grantedDate: '05/01/2022', status: 'Cancelled', cancelReason: 'Core member deceased', cancelDate: '20/11/2023' },
  ]});
  await prisma.nominee.createMany({ data: [
    { memberAc: 'DR-20', nomineeName: 'Ahmed Hassan', relToMember: 'Son',   priority: 1, status: 'Used' },
    { memberAc: 'DR-20', nomineeName: 'Salma Hassan', relToMember: 'Spouse', priority: 2, status: 'Active' },
  ]});
  await prisma.successionEvent.create({ data: {
    fromAc: 'DR-20', toAc: 'DH-26', eventType: 'Death', eventDate: '20/11/2023',
    articleRef: 'Article 6C', successorRel: 'Son', remarks: 'Nominee priority-1 Ahmed Hassan took over',
  }});
}

// Case 5 — Senior upgrade after 15+ years
async function seedCase5() {
  await prisma.member.createMany({ data: [
    { acNo: 'LN-30', name: 'Dr. Nazrul Islam', gender: 'M', memberType: 'Life',      joinedDate: '15/01/1985', birthDate: '11/12/1955', memberId: 'LN000030', pidAc: null, relType: null, status: 'Transferred', notes: 'Upgraded to Senior after 20 years' },
    { acNo: 'SN-30', name: 'Dr. Nazrul Islam', gender: 'M', memberType: 'Senior',    joinedDate: '15/01/1985', birthDate: '11/12/1955', memberId: 'SN000030', pidAc: null, relType: null },
    { acNo: 'PN-31', name: 'Rahman Islam',      gender: 'M', memberType: 'Permanent', joinedDate: '15/01/2005', birthDate: '14/07/1985', pidAc: 'SN-30', relType: 'child', notes: 'Took over LN-30 Life slot on Senior upgrade' },
    { acNo: 'LR-32', name: 'Rokeya Islam',      gender: 'F', memberType: 'Life',      joinedDate: '01/03/1988', pidAc: 'LN-30', relType: 'spouse' },
  ]});
  await prisma.bioRelationship.createMany({ data: [
    { subjectAc: 'LN-30', relativeAc: 'LR-32', relType: 'spouse' },
    { subjectAc: 'LR-32', relativeAc: 'LN-30', relType: 'spouse' },
    { subjectAc: 'PN-31', relativeAc: 'SN-30', relType: 'father' },
    { subjectAc: 'PN-31', relativeAc: 'LR-32', relType: 'mother' },
  ]});
  await prisma.successionEvent.createMany({ data: [
    { fromAc: 'LN-30', toAc: 'SN-30', eventType: 'SeniorUpgrade',  eventDate: '15/01/2005', articleRef: 'DLP (15yr+)',  successorRel: 'Self',  remarks: 'Life → Senior upgrade after 20 years' },
    { fromAc: 'LN-30', toAc: 'PN-31', eventType: 'FamilyTransfer', eventDate: '15/01/2005', articleRef: 'Article 4',   successorRel: 'Son',   remarks: 'Freed Life slot taken by son Rahman' },
  ]});
}
