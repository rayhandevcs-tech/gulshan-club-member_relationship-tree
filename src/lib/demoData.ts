import { Member } from './types';

// ── Original demo data (Islam & Chowdhury families) ───────────────────────
export const demoMembers: Member[] = [
  {
    id: 'LM-11', name: 'Md. Saiful Islam', type: 'Life', gender: 'M',
    since: '28/10/1985',
    phone: '+8801711538657',
    email: 'islam1944bd@gmail.com',
    pid: null, rel: null,
    succession: 'LS-35',
    membershipRef: 'Linked to LS-35',
    fatherName: 'Ahafiqur Rahman',
  },
  {
    id: 'LS-8', name: 'Sultana Shaheda Islam', type: 'Life', gender: 'F',
    since: '28/10/1985',
    phone: '+8801819213808',
    email: 'ssbdl@agni.com',
    pid: 'LM-11', rel: 'spouse',
    fatherName: 'Md. Serajul Islam',
  },
  {
    id: 'PT-7', name: 'Tahmina Rehman', type: 'Permanent', gender: 'F',
    since: '12/12/1995',
    phone: '+8801713012475',
    email: 'tahminar67@gmail.com',
    pid: 'LM-11', rel: 'child',
    fatherId: 'LM-11', motherId: 'LS-8',
  },
  {
    id: 'PW-6', name: 'Late Wasim Sajjad', type: 'Permanent', gender: 'M',
    since: '15/10/2001',
    phone: '+8801711595459',
    email: 'wali@utahgroup.net',
    pid: 'LM-11', rel: 'child',
    fatherId: 'LM-11', motherId: 'LS-8',
    succession: 'PK-49',
  },
  {
    id: 'PO-10', name: 'Omar Hamid Chowdhury', type: 'Permanent', gender: 'M',
    since: '04/03/2018',
    phone: '+8801711593144',
    email: 'omar.dhaka@gmail.com',
    pid: 'PT-7', rel: 'spouse',
    fatherName: 'Abdul Hamid Chowdhury',
    motherName: 'Dureshar Ponok Chowdhury',
  },
  {
    id: 'PS-329', name: 'Sanjana Chowdhury', type: 'Permanent', gender: 'F',
    since: '17/09/2018',
    email: 'transaction.gcl@gmail.com',
    pid: 'PT-7', rel: 'a4d',
    fatherId: 'PO-10', motherId: 'PT-7',
  },
  {
    id: 'PS-338', name: 'Shareef Omar Hamid Chowdhury', type: 'Permanent', gender: 'M',
    since: '17/09/2018',
    phone: '+8801711593144',
    email: 'shareef.arsenal95@gmail.com',
    pid: 'LS-8', rel: 'a4d',
    fatherId: 'PO-10', motherId: 'PT-7',
  },
  {
    id: 'PK-49', name: 'Kaniz Fatema', type: 'Permanent', gender: 'F',
    since: '28/09/2016',
    phone: '+88029843422',
    email: 'kanizfsajjad@gmail.com',
    pid: 'PW-6', rel: 'spouse',
    motherName: 'Arzina Khanam',
  },
  { id: 'AFD-0443', name: 'Areesh Sajjad',         type: 'A4D', gender: 'F', since: '01/05/2020', pid: 'LM-11', rel: 'a4d', fatherId: 'PW-6', motherId: 'PK-49' },
  { id: 'AFD-0444', name: 'Ayyaz Sajjad',          type: 'A4D', gender: 'M', since: '01/05/2020', pid: 'LM-11', rel: 'a4d', fatherId: 'PW-6', motherId: 'PK-49' },
  { id: 'AFD-0927', name: 'Daniyah Fatema Sajjad', type: 'A4D', gender: 'F', since: '01/05/2020', pid: 'PK-49', rel: 'a4d', fatherId: 'PW-6', motherId: 'PK-49' },
  { id: 'AFD-0928', name: 'Dameer Sajjad',         type: 'A4D', gender: 'M', since: '01/05/2020', pid: 'PK-49', rel: 'a4d', fatherId: 'PW-6', motherId: 'PK-49' },
  { id: 'AFD-0529', name: 'Daneen Arif',           type: 'A4D', gender: 'F', since: '15/09/2022', pid: 'LS-8',  rel: 'a4d' },
  { id: 'AS-151',   name: 'Ahnaf Hamid Chowdhury', type: 'Associate', gender: 'M', since: '10/02/2023', pid: 'PO-10', rel: 'associate', fatherId: 'PO-10', motherId: 'PT-7' },
  {
    id: 'LS-35', name: 'Syed Abubakar Siddique', type: 'Life', gender: 'M',
    since: '',
    pid: null, rel: null,
    fatherName: 'Alhaj S.A. Khaleque Ex M.P',
    motherName: 'Nawshad Begum',
  },
  { id: 'AS-157', name: 'Syed Erfan Siddique', type: 'Associate', gender: 'M', since: '', pid: 'LS-35', rel: 'associate' },
];

// ── Case A: Donor death + succession + associate cancellation ─────────────
export const caseC_KhanFamily: Member[] = [
  {
    id: 'LM-40', name: 'Anwar Khan', type: 'Life', gender: 'M',
    since: '12/04/1990',
    phone: '+8801711000001',
    email: 'anwar.khan@gmail.com',
    pid: null, rel: null,
    fatherName: 'Abdul Hai Khan',
  },
  {
    id: 'LS-40', name: 'Begum Anwar Khan', type: 'Life', gender: 'F',
    since: '12/04/1990',
    pid: 'LM-40', rel: 'spouse',
    fatherName: 'Md. Hafizur Rahman',
  },
 
  // ── Children of LM-40 / LS-40 ──────────────────────────────────────────
  {
    id: 'PT-41', name: 'Sara Khan', type: 'Permanent', gender: 'F',
    since: '20/06/2005',
    email: 'sara.khan@gmail.com',
    pid: 'LM-40', rel: 'child',
    fatherId: 'LM-40', motherId: 'LS-40',
  },
  {
    id: 'PM-42', name: 'Tariq Khan', type: 'Permanent', gender: 'M',
    since: '05/11/2008',
    // ⚠ ISSUE: email identical to PM-43 and PM-45 (tariq.k@gmail.com) —
    // three different siblings sharing one email looks like copy-paste.
    email: 'tariq.k@gmail.com',
    pid: 'LM-40', rel: 'child',
    fatherId: 'LM-40', motherId: 'LS-40',
  },
  {
    id: 'PM-43', name: 'Tariq Hossain', type: 'Permanent', gender: 'M',
    since: '05/11/2008',
    // ⚠ ISSUE: same email as PM-42 / PM-45
    email: 'tariq.k@gmail.com',
    pid: 'LM-40', rel: 'child',
    fatherId: 'LM-40', motherId: 'LS-40',
  },
  {
    id: 'PM-45', name: 'Ismail Khan', type: 'Permanent', gender: 'M',
    since: '05/11/2008',
    // ⚠ ISSUE: same email as PM-42 / PM-43
    email: 'tariq.k@gmail.com',
    pid: 'LM-40', rel: 'child',
    fatherId: 'LM-40', motherId: 'LS-40',
  },
 
  // ── Sara Khan's (PT-41) family ──────────────────────────────────────────
  {
    id: 'PH-41', name: 'Hamid Chowdhury', type: 'Permanent', gender: 'M',
    since: '15/02/2008',
    phone: '+8801722000002',
    pid: 'PT-41', rel: 'spouse',
    fatherName: 'Habibur Chowdhury',
    motherName: 'Rahela Chowdhury',
  },
  {
    id: 'PS-410', name: 'Zara Chowdhury', type: 'Permanent', gender: 'F',
    since: '10/09/2018',
    pid: 'PT-41', rel: 'a4d',
    fatherId: 'PH-41', motherId: 'PT-41',
  },
  {
    id: 'PS-411', name: 'Rayan Chowdhury', type: 'Permanent', gender: 'M',
    since: '10/09/2018',
 
    pid: 'LM-40', rel: 'a4d',
    fatherId: 'PH-41', motherId: 'PT-41',
  },
 
  
  // {
  //   id: 'PS-412', name: 'Raihan Hossain', type: 'Permanent', gender: 'M',
  //   since: '10/09/2018',
  //   pid: 'LM-40', rel: 'a4d',
  //   fatherId: 'PH-41', motherId: 'PT-41',
  // },
  
 
  // ── Tariq Khan's (PM-42) family ─────────────────────────────────────────
  {
    id: 'PW-42', name: 'Nadia Tariq', type: 'Permanent', gender: 'F',
    since: '20/03/2012',
    pid: 'PM-42', rel: 'spouse',
    fatherName: 'Shafiqul Islam',
  },
  {
    id: 'PX-42', name: 'Nadia Anawar', type: 'Permanent', gender: 'F',
    since: '20/03/2012',
   
    pid: 'PW-42', rel: 'a4d',
    fatherName: 'Shafiqul Islam',
  },
  {
    id: 'AFD-200', name: 'Aisha Khan', type: 'A4D', gender: 'F',
    since: '01/07/2021',
    pid: 'PM-42', rel: 'a4d',
    fatherId: 'PM-42', motherId: 'PW-42',
  },
 
  
  {
    id: 'AFD-201', name: 'Rayhan Khan', type: 'A4D', gender: 'M',
    since: '01/07/2021',
    // ⚠ pid likely should be 'PM-42' to match sibling Aisha Khan
    pid: 'LS-40', rel: 'a4d',
    fatherId: 'PM-42', motherId: 'PW-42',
  },
 
  {
    id: 'AS-300', name: 'Rafiq', type: 'Associate', gender: 'M',
    since: '10/01/2020',
    pid: 'PM-42', rel: 'associate',
  },
 
  // ── Tariq Hossain's (PM-43) family ──────────────────────────────────────
  {
    id: 'LS-4', name: 'Begum Anwar Khan', type: 'Life', gender: 'F',
    since: '12/04/1990',

    pid: 'PM-43', rel: 'spouse',
    fatherName: 'Md. Hafizur Rahman',
  },
  {
    id: 'PM-40', name: 'Ismail khan', type: 'Permanent', gender: 'M',
    since: '05/11/2008',
    // ⚠ ISSUE: same email as PM-42/PM-43/PM-45 above
    email: 'tariq.k@gmail.com',
    pid: 'PM-43', rel: 'a4d',
    fatherId: 'PM-43', motherId: 'LS-4',
  },
];

// ── Case C: 3-generation family with cross-quota ──────────────────────────


// ── Active dataset — switch here to test different cases ──────────────────
export const allTestCases: Member[] = [
  
  ...caseC_KhanFamily,
];
