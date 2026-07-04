


// familyData.ts — Hashem family converted to the new model.
// `type` is DERIVED from the id prefix (P/D/L/AFD), so it's omitted here.
// `via` decides placement, `rel` decides relationship, `pid` = quota holder /
// tree parent, fatherId/motherId = blood links (reference text + bioMode).

import type { Member } from './types';

export const familyMembers: Member[] = [
  // ═══ ROOT ═══════════════════════════════════════════════════════════════
  {
    id: 'DM-8',
    name: 'Mr. M. A. Hashem',
    via: 'core',
    gender: 'M',
    since: '04/10/1989',
    pid: null, rel: null,
    note: 'Chairman & Managing Director, Partex Group of Industries, 74 Mohakhali C/A, Dhaka-1212',
  },

  // ═══ ROOT SPOUSE — Remarks: 4(d)-DM-8 → she came in via his quota, so she
  //     is a slot under DM-8 even though her A/C is Permanent (PS-…) now.
  {
    id: 'PS-295',
    name: 'Mrs. Sultana Hashem',
    via: 'a4d',
    gender: 'F',
    since: '14/05/2018',
    pid: 'DM-8', rel: 'spouse',
    note: 'House # 9, Road # 55, Gulshan-2, Dhaka-1212',
  },

  // ═══ SONS — all core members, children of DM-8 ═════════════════════════
  {
    id: 'PA-41',
    name: 'Mr. Aziz Al-Kaiser',
    via: 'core',
    gender: 'M',
    since: '21/11/1990',
    pid: 'DM-8', rel: 'child',
    fatherId: 'DM-8', motherId: 'PS-295',
    note: '(Level-13), SPL Western Tower, 186, Tejgaon, Dhaka-1208',
  },
  {
    id: 'PA-74',
    name: 'Mr. Aziz Al Mahmood',
    via: 'core',
    gender: 'M',
    since: '20/11/1995',
    pid: 'DM-8', rel: 'child',
    fatherId: 'DM-8', motherId: 'PS-295',
    note: '(Level-13), SPL Western Tower, 186, Tejgaon, Dhaka-1208',
  },
  {
    id: 'PA-83',
    name: 'Mr. Aziz Al-Masud',
    via: 'core',
    gender: 'M',
    since: '21/09/1999',
    pid: 'DM-8', rel: 'child',
    fatherId: 'DM-8', motherId: 'PS-295',
    note: 'Managing Director, Amber Pulp & Paper Mills Ltd., 74 Mohakhali C/A, Dhaka-1212',
  },
  {
    id: 'DR-7',
    name: 'Mr. Rubel Aziz',
    via: 'core',
    gender: 'M',
    since: '06/03/1998',
    pid: 'DM-8', rel: 'child',
    fatherId: 'DM-8', motherId: 'PS-295',
    note: 'Managing Director, Partex Beverage BD. Limited, 74 Mohakhali C/A, Dhaka-1212',
  },
  {
    id: 'DS-25',
    name: 'Mr. Showkat Aziz Russell',
    via: 'core',
    gender: 'M',
    since: '03/06/1998',
    pid: 'DM-8', rel: 'child',
    //succession: 'PS-356',
    //succession: 'PT-7',
    fatherId: 'DM-8', motherId: 'PS-295',
    note: 'Chairman, Amber Group, House # 2, Road # 62, Gulshan-2, Dhaka-1212',
  },

  // ═══ SONS' SPOUSES ═════════════════════════════════════════════════════
  // 4(d)-PA-41 → via a4d → slot under PA-41 (her own A/C being P-type doesn't matter)
  {
    id: 'PT-70',
    name: 'Mrs. Tabassum Kaiser',
    via: 'a4d',
    gender: 'F',
    since: '14/05/2018',
    pid: 'PA-41', rel: 'spouse',
    note: '(Level-13), SPL Western Tower, 186, Tejgaon, Dhaka-1208',
  },
  // 4(d)-PA-74
  {
    id: 'PS-238',
    name: 'Mrs. Savera H. Mahmood',
    via: 'a4d',
    gender: 'F',
    since: '04/03/2018',
    pid: 'PA-74', rel: 'spouse',
    note: '(Level-13), SPL Western Tower, 186, Tejgaon, Dhaka-1208',
  },
  // 4(d)-PA-83
  {
    id: 'PJ-16',
    name: 'Mrs. Ji Eun Lee',
    via: 'a4d',
    gender: 'F',
    since: '14/05/2018',
    pid: 'PA-83', rel: 'spouse',
    note: 'Partex Group, 74 Mohakhali C/A, Dhaka-1212',
  },
  // own core membership → beside DR-7
  {
    id: 'DS-36',
    name: 'Mrs. Syeda Shaireen Aziz',
    via: 'core',
    gender: 'F',
    since: '02/04/2013',
    pid: 'DR-7', rel: 'spouse',
    note: 'House # NWD-8, Road # 62, Gulshan-2, Dhaka-1212',
  },
  // own core membership → beside DS-25
  {
    id: 'PF-25',
    name: 'Mrs. Farahnaz Chowdhury',
    via: 'core',
    gender: 'F',
    since: '12/08/2012',
    pid: 'DS-25', rel: 'spouse',
    note: 'House # 2, Road # 62, Gulshan-2, Dhaka-1212',
  },
  // second spouse of DS-25, came via HIS 4(d) quota → slot under DS-25.
  // Her A/C is PS-… (Permanent) — with `via` explicit, placement no longer
  // depends on array order or on her type.
  {
    id: 'PS-356',
    name: 'Barrister Sumaiya Binta Aziz',
    via: 'a4d',
    gender: 'F',
    since: '21/11/2018',
    pid: 'DS-25', rel: 'spouse',
    note: 'House # 2, Road # 62, Gulshan-2, Dhaka-1212',
  },

  // ═══ GRANDCHILDREN ═════════════════════════════════════════════════════
  // — Children of PA-41 + PT-70 —
  // 4(d)-DM-8 → grandfather's quota → slot above the root
  {
    id: 'PA-265',
    name: 'Mr. Amman Al Aziz',
    via: 'a4d',
    gender: 'M',
    since: '28/12/2019',
    pid: 'DM-8', rel: 'child',
    fatherId: 'PA-41', motherId: 'PT-70',
    note: '(Level-13), SPL Western Tower, 186, Tejgaon, Dhaka-1208',
  },
  // 4(d)-PA-41
  {
    id: 'PA-288',
    name: 'Mr. Amid Al Aziz',
    via: 'a4d',
    gender: 'M',
    since: '27/01/2021',
    pid: 'PA-41', rel: 'child',
    fatherId: 'PA-41', motherId: 'PT-70',
    note: '24, Dutabash Road, Baridhara, Dhaka-1212',
  },

  // — Children of PA-74 + PS-238 —
  // 4(d)-PA-74
  {
    id: 'PF-90',
    name: 'Ms. Fabiana Aziz',
    via: 'a4d',
    gender: 'F',
    since: '30/09/2019',
    pid: 'PA-74', rel: 'child',
    fatherId: 'PA-74', motherId: 'PS-238',
    note: '(Level-13), SPL Western Tower, 186, Tejgaon, Dhaka-1208',
  },
  // 4(d)-DR-7 → cross-family quota: uncle's slot, ref still "Daughter of PA-74"
  {
    id: 'PS-469',
    name: 'Ms. Samaraa Sultana Aziz',
    via: 'a4d',
    gender: 'F',
    since: '19/02/2022',
    pid: 'DR-7', rel: 'child',
    fatherId: 'PA-74', motherId: 'PS-238',
    note: '(Level-13), SPL Western Tower, 186, Tejgaon, Dhaka-1208',
  },

  // — Children of PA-83 + PJ-16 —
  // 4(d)-PA-83
  {
    id: 'PA-306',
    name: 'Mr. Arman Aziz',
    via: 'a4d',
    gender: 'M',
    since: '28/06/2021',
    pid: 'PA-83', rel: 'child',
    fatherId: 'PA-83', motherId: 'PJ-16',
    note: 'Partex Group, 74 Mohakhali C/A, Dhaka-1212',
  },

  // — Children of DR-7 + DS-36 —
  // 4(d)-DR-7
  {
    id: 'PA-272',
    name: 'Mr. Asef Aziz',
    via: 'a4d',
    gender: 'M',
    since: '23/06/2020',
    pid: 'DR-7', rel: 'child',
    fatherId: 'DR-7', motherId: 'DS-36',
    note: 'House # 8, Road # 62, Gulshan-2, Dhaka-1212',
  },
  // 4(d)-DS-36 → mother's own quota (she's a beside spouse) → slot under HER
  {
    id: 'PA-354',
    name: 'Mr. Adil Aziz',
    via: 'a4d',
    gender: 'M',
    since: '18/09/2023',
    pid: 'DS-36', rel: 'child',
    fatherId: 'DR-7', motherId: 'DS-36',
    note: 'House # 8, Road # 62, Gulshan-2, Dhaka-1212',
  },
  // 4(d)-DS-36 — AFD prefix ⇒ derived type A4D (quota access, no own A/C yet)
  {
    id: 'AFD-0350',
    name: 'Mr. Amer Aziz',
    via: 'a4d',
    gender: 'M',
    since: '',
    pid: 'DS-36', rel: 'child',
    fatherId: 'DR-7', motherId: 'DS-36',
    note: 'House # 8, Road # 62, Gulshan-2, Dhaka-1212 | Pending A/C',
  },

  // — Children of DS-25 + PF-25 —
  // 4(d)-DS-25
  {
    id: 'PA-244',
    name: 'Mr. Anaf Aziz',
    via: 'a4d',
    gender: 'M',
    since: '17/09/2018',
    pid: 'DS-25', rel: 'child',
    fatherId: 'DS-25', motherId: 'PF-25',
    note: 'House # 2, Road # 62, Gulshan-2, Dhaka-1212',
  },
  // 4(d)-PF-25 → mother's own quota → slot under HER
  {
    id: 'PS-412',
    name: 'Ms. Sinem Aziz',
    via: 'a4d',
    gender: 'F',
    since: '08/11/2020',
    pid: 'PF-25', rel: 'child',
    fatherId: 'DS-25', motherId: 'PF-25',
    note: 'House # 2, Road # 62, Gulshan-2, Dhaka-1212',
  },
  // 4(d)-PF-25 — AFD ⇒ A4D, pending A/C
  {
    id: 'AFD-0790',
    name: 'Ms. Sahar Aziz',
    via: 'a4d',
    gender: 'F',
    since: '',
    pid: 'PF-25', rel: 'child',
    fatherId: 'DS-25', motherId: 'PF-25',
    note: 'House # 2, Road # 62, Gulshan-2, Dhaka-1212 | Pending A/C',
  },


// // LM-11 and LS-8 Family members

// {
//   id: 'LM-11',
//   name: 'Md. Saiful Islam',
//   via: 'core',
//   gender: 'M',
//   since: '28/10/1985',
//   phone: '+8801711538657',
//   email: 'islam1944bd@gmail.com',
//   pid: null,
//   rel: null,
//   succession: 'LS-35',
//   membershipRef: 'Linked to LS-35',
//   fatherName: 'Ahafiqur Rahman',
// },

// {
//   id: 'LS-8',
//   name: 'Sultana Shaheda Islam',
//   via: 'core',
//   gender: 'F',
//   since: '28/10/1985',
//   phone: '+8801819213808',
//   email: 'ssbdl@agni.com',
//   pid: 'LM-11',
//   rel: 'spouse',
//   fatherName: 'Md. Serajul Islam',
// },

{
  id: 'PT-7',
  name: 'Tahmina Rehman',
  via: 'core',
  gender: 'F',
  since: '12/12/1995',
  phone: '+8801713012475',
  email: 'tahminar67@gmail.com',
  pid: 'LM-11',
  rel: 'child',
  fatherId: 'LM-11',
  motherId: 'LS-8',
},

// {
//   id: 'PW-6',
//   name: 'Late Wasim Sajjad',
//   via: 'core',
//   gender: 'M',
//   since: '15/10/2001',
//   phone: '+8801711595459',
//   email: 'wali@utahgroup.net',
//   pid: 'LM-11',
//   rel: 'child',
//   fatherId: 'LM-11',
//   motherId: 'LS-8',
//   succession: 'PK-49',
// },

// {
//   id: 'PO-10',
//   name: 'Omar Hamid Chowdhury',
//   via: 'core',
//   gender: 'M',
//   since: '04/03/2018',
//   phone: '+8801711593144',
//   email: 'omar.dhaka@gmail.com',
//   pid: 'PT-7',
//   rel: 'spouse',
//   fatherName: 'Abdul Hamid Chowdhury',
//   motherName: 'Dureshar Ponok Chowdhury',
// },

// {
//   id: 'PS-329',
//   name: 'Sanjana Chowdhury',
//   via: 'core',
//   gender: 'F',
//   since: '17/09/2018',
//   email: 'transaction.gcl@gmail.com',
//   pid: 'PT-7',
//   rel: 'a4d',
//   fatherId: 'PO-10',
//   motherId: 'PT-7',
// },

// {
//   id: 'AFD-09',
//   name: 'Daniyah Fatema Sajjad',
//   via: 'a4d',
//   gender: 'F',
//   since: '01/05/2020',
//   pid: 'PS-329',
//   rel: 'associate',
//   fatherId: 'PW-6',
//   motherId: 'PK-49',
// },
 
















];