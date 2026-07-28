// demoApiData.ts — a Hashem-family + Islam-family fixture, in the SAME raw
// node format the club's real external API returns:
//
//   GET /coremember        → CoreMemberDto[]              (demoCoreMembers)
//   GET /mtreedata?id=<id> → TreeItemDto[] per core member (demoTreeData[id])
//
// src/lib/demoData.ts runs this through the same convertApiMembers()
// (src/lib/convertApiData.ts) that src/app/api/ext-members/route.ts uses
// for the live system, so the 'static' data source exercises the exact
// same conversion path as 'api' mode — this is the only place the demo
// dataset is hand-authored.
//
// `id` is the club's internal record id (opaque, "PM000001" style). `acno`
// is the public A/C number used everywhere else in this app as Member.id.
// Every core member (anyone with their own real A/C) gets a coremember row
// AND a tree keyed by their internal id; a4d/associate dependents only ever
// show up as rows inside someone else's tree, never as their own
// coremember entry — same as the real system.
//
// Two things this dataset needs that these two endpoints alone can't
// express:
//  - `succession` (an A/C transferred from one member to another) isn't
//    part of either endpoint's shape — the real API has no notion of it.
//    DS-44 and LS-35 (the succession targets) still appear below as
//    ordinary coremember rows, since they do hold real A/Cs, just with no
//    link back to the account they inherited. (convertApiMembers doesn't
//    set `succession` either — see src/lib/demoData.ts for how it's
//    layered on afterward.)
//  - Five a4d dependents (AFD-1155, AFD-0835, AFD-0503, PA-306, AFD-1397)
//    list a quota-holder `pid` (PM-199, PH-23, LN-5, PM-122, PS-25) that
//    isn't itself one of this dataset's core members. In the real system
//    those grandchildren would surface in THAT quota holder's own
//    mtreedata — which this trimmed demo family doesn't include — so they
//    have no tree to attach to here and are left out.

import type { CoreMemberDto, TreeItemDto } from './convertApiData';

export type { CoreMemberDto, TreeItemDto };

// blank Code for dependents who never got a member row in demoData.ts
// (parents referenced only by name, no A/C) — mirrors the padded blank
// string the real API sends for the same case.
const NO_CODE = '        ';

export const demoCoreMembers: CoreMemberDto[] = [
  // ═══ Hashem family ═══
  { id: 'PM000001', acno: 'DM-8', name: 'Late Mr. M. A. Hashem', img: '' },
  { id: 'PM000002', acno: 'PA-41', name: 'Mr. Aziz Al-Kaiser', img: '' },
  { id: 'PM000003', acno: 'PA-74', name: 'Mr. Aziz Al Mahmood', img: '' },
  { id: 'PM000004', acno: 'PA-83', name: 'Mr. Aziz Al-Masud', img: '' },
  { id: 'PM000005', acno: 'DR-7', name: 'Mr. Rubel Aziz', img: '' },
  { id: 'PM000006', acno: 'DS-25', name: 'Mr. Showkat Aziz Russell', img: '' },
  { id: 'PM000007', acno: 'DS-36', name: 'Mrs. Syeda Shaireen Aziz', img: '' },
  { id: 'PM000008', acno: 'PF-25', name: 'Mrs. Farahnaz Chowdhury', img: '' },
  // succession target — inherited DM-8's A/C; see file header
  { id: 'PM000014', acno: 'DS-44', name: 'Simran Rahman', img: '' },

  // ═══ Islam family ═══
  { id: 'PM000009', acno: 'LM-11', name: 'Md. Saiful Islam', img: '' },
  { id: 'PM000010', acno: 'LS-8', name: 'Sultana Shaheda Islam', img: '' },
  { id: 'PM000011', acno: 'PT-7', name: 'Tahmina Rehman', img: '' },
  { id: 'PM000012', acno: 'PW-6', name: 'Late Wasim Sajjad', img: '' },
  { id: 'PM000013', acno: 'PK-49', name: 'Kaniz Fatema', img: '' },
  // succession target — inherited PW-6's A/C; see file header
  { id: 'PM000015', acno: 'LS-35', name: 'Syed Abubakar Siddique', img: '' },

  // ═══ PA-79 — standalone, verbatim real-API sample (not related to the
  // two families above) — the only fixture exercising every node kind at
  // once, including Transfer ══════════════════════════════════════════
  { id: 'PM000070', acno: 'PA-79', name: 'Abu M. Shahidul Alam (Majjad)', img: 'http://118.179.152.53/myWeb01/Images/068/Member/PA-79.JPG' },
];

export const demoTreeData: Record<string, TreeItemDto[]> = {
  // ── DM-8 ──
  PM000001: [
    { Node: 'Spouse', Acno: 'PS-295', Name: 'Mrs. Sultana Hashem', Relation: 'Wife', Code: 'PM000016', img: '' },
    // same Acno as the Spouse row above — she holds her own 4(d) A/C too
    { Node: 'A4D', Acno: 'PS-295', Name: 'Mrs. Sultana Hashem', Relation: 'Wife', Code: 'PM000016', img: '' },
    { Node: 'A4D', Acno: 'PA-265', Name: 'Mr. Amman Al Aziz', Relation: 'Son of PA-41', Code: 'PM000021', img: '' },
    // forward Children rows — mirror the reverse Parent rows on each son's own tree below
    { Node: 'Children', Acno: 'PA-41', Name: 'Mr. Aziz Al-Kaiser', Relation: 'Son', Code: 'PM000002', img: '' },
    { Node: 'Children', Acno: 'PA-74', Name: 'Mr. Aziz Al Mahmood', Relation: 'Son', Code: 'PM000003', img: '' },
    { Node: 'Children', Acno: 'PA-83', Name: 'Mr. Aziz Al-Masud', Relation: 'Son', Code: 'PM000004', img: '' },
    { Node: 'Children', Acno: 'DR-7', Name: 'Mr. Rubel Aziz', Relation: 'Son', Code: 'PM000005', img: '' },
    { Node: 'Children', Acno: 'DS-25', Name: 'Mr. Showkat Aziz Russell', Relation: 'Son', Code: 'PM000006', img: '' },
  ],

  // ── PA-41 ──
  PM000002: [
    { Node: 'Parent', Acno: 'DM-8', Name: 'Late Mr. M. A. Hashem', Relation: 'Father', Code: 'PM000001', img: '' },
    { Node: 'Parent', Acno: 'PS-295', Name: 'Mrs. Sultana Hashem', Relation: 'Mother', Code: 'PM000016', img: '' },
    { Node: 'Siblings', Acno: 'PA-74', Name: 'Mr. Aziz Al Mahmood', Relation: 'Brother', Code: 'PM000003', img: '' },
    { Node: 'Siblings', Acno: 'PA-83', Name: 'Mr. Aziz Al-Masud', Relation: 'Brother', Code: 'PM000004', img: '' },
    { Node: 'Siblings', Acno: 'DR-7', Name: 'Mr. Rubel Aziz', Relation: 'Brother', Code: 'PM000005', img: '' },
    { Node: 'Siblings', Acno: 'DS-25', Name: 'Mr. Showkat Aziz Russell', Relation: 'Brother', Code: 'PM000006', img: '' },
    { Node: 'Spouse', Acno: 'PT-70', Name: 'Mrs. Tabassum Kaiser', Relation: 'Wife', Code: 'PM000017', img: '' },
    { Node: 'A4D', Acno: 'PT-70', Name: 'Mrs. Tabassum Kaiser', Relation: 'Wife', Code: 'PM000017', img: '' },
    { Node: 'A4D', Acno: 'PA-288', Name: 'Mr. Amid Al Aziz', Relation: 'Son', Code: 'PM000022', img: '' },
  ],

  // ── PA-74 ──
  PM000003: [
    { Node: 'Parent', Acno: 'DM-8', Name: 'Late Mr. M. A. Hashem', Relation: 'Father', Code: 'PM000001', img: '' },
    { Node: 'Parent', Acno: 'PS-295', Name: 'Mrs. Sultana Hashem', Relation: 'Mother', Code: 'PM000016', img: '' },
    { Node: 'Siblings', Acno: 'PA-41', Name: 'Mr. Aziz Al-Kaiser', Relation: 'Brother', Code: 'PM000002', img: '' },
    { Node: 'Siblings', Acno: 'PA-83', Name: 'Mr. Aziz Al-Masud', Relation: 'Brother', Code: 'PM000004', img: '' },
    { Node: 'Siblings', Acno: 'DR-7', Name: 'Mr. Rubel Aziz', Relation: 'Brother', Code: 'PM000005', img: '' },
    { Node: 'Siblings', Acno: 'DS-25', Name: 'Mr. Showkat Aziz Russell', Relation: 'Brother', Code: 'PM000006', img: '' },
    { Node: 'Spouse', Acno: 'PS-238', Name: 'Mrs. Savera H. Mahmood', Relation: 'Wife', Code: 'PM000018', img: '' },
    { Node: 'A4D', Acno: 'PS-238', Name: 'Mrs. Savera H. Mahmood', Relation: 'Wife', Code: 'PM000018', img: '' },
    { Node: 'A4D', Acno: 'PF-90', Name: 'Ms. Fabiana Aziz', Relation: 'Daughter', Code: 'PM000023', img: '' },
  ],

  // ── PA-83 ──
  PM000004: [
    { Node: 'Parent', Acno: 'DM-8', Name: 'Late Mr. M. A. Hashem', Relation: 'Father', Code: 'PM000001', img: '' },
    { Node: 'Parent', Acno: 'PS-295', Name: 'Mrs. Sultana Hashem', Relation: 'Mother', Code: 'PM000016', img: '' },
    { Node: 'Siblings', Acno: 'PA-41', Name: 'Mr. Aziz Al-Kaiser', Relation: 'Brother', Code: 'PM000002', img: '' },
    { Node: 'Siblings', Acno: 'PA-74', Name: 'Mr. Aziz Al Mahmood', Relation: 'Brother', Code: 'PM000003', img: '' },
    { Node: 'Siblings', Acno: 'DR-7', Name: 'Mr. Rubel Aziz', Relation: 'Brother', Code: 'PM000005', img: '' },
    { Node: 'Siblings', Acno: 'DS-25', Name: 'Mr. Showkat Aziz Russell', Relation: 'Brother', Code: 'PM000006', img: '' },
    { Node: 'Spouse', Acno: 'PJ-16', Name: 'Mrs. Ji Eun Lee', Relation: 'Wife', Code: 'PM000019', img: '' },
    { Node: 'A4D', Acno: 'PJ-16', Name: 'Mrs. Ji Eun Lee', Relation: 'Wife', Code: 'PM000019', img: '' },
    { Node: 'A4D', Acno: 'PA-307', Name: 'Mr. Arshad Lee', Relation: 'Son', Code: 'PM000025', img: '' },
  ],

  // ── DR-7 ──
  PM000005: [
    { Node: 'Parent', Acno: 'DM-8', Name: 'Late Mr. M. A. Hashem', Relation: 'Father', Code: 'PM000001', img: '' },
    { Node: 'Parent', Acno: 'PS-295', Name: 'Mrs. Sultana Hashem', Relation: 'Mother', Code: 'PM000016', img: '' },
    { Node: 'Siblings', Acno: 'PA-41', Name: 'Mr. Aziz Al-Kaiser', Relation: 'Brother', Code: 'PM000002', img: '' },
    { Node: 'Siblings', Acno: 'PA-74', Name: 'Mr. Aziz Al Mahmood', Relation: 'Brother', Code: 'PM000003', img: '' },
    { Node: 'Siblings', Acno: 'PA-83', Name: 'Mr. Aziz Al-Masud', Relation: 'Brother', Code: 'PM000004', img: '' },
    { Node: 'Siblings', Acno: 'DS-25', Name: 'Mr. Showkat Aziz Russell', Relation: 'Brother', Code: 'PM000006', img: '' },
    { Node: 'Spouse', Acno: 'DS-36', Name: 'Mrs. Syeda Shaireen Aziz', Relation: 'Wife', Code: 'PM000007', img: '' },
    { Node: 'A4D', Acno: 'PA-272', Name: 'Mr. Asef Aziz', Relation: 'Son', Code: 'PM000026', img: '' },
    // real father is PA-74 — DR-7 is her uncle, whose quota she rides on
    { Node: 'A4D', Acno: 'PS-469', Name: 'Ms. Samaraa Sultana Aziz', Relation: 'Daughter of PA-74', Code: 'PM000024', img: '' },
  ],

  // ── DS-25 ──
  PM000006: [
    { Node: 'Parent', Acno: 'DM-8', Name: 'Late Mr. M. A. Hashem', Relation: 'Father', Code: 'PM000001', img: '' },
    { Node: 'Parent', Acno: 'PS-295', Name: 'Mrs. Sultana Hashem', Relation: 'Mother', Code: 'PM000016', img: '' },
    { Node: 'Siblings', Acno: 'PA-41', Name: 'Mr. Aziz Al-Kaiser', Relation: 'Brother', Code: 'PM000002', img: '' },
    { Node: 'Siblings', Acno: 'PA-74', Name: 'Mr. Aziz Al Mahmood', Relation: 'Brother', Code: 'PM000003', img: '' },
    { Node: 'Siblings', Acno: 'PA-83', Name: 'Mr. Aziz Al-Masud', Relation: 'Brother', Code: 'PM000004', img: '' },
    { Node: 'Siblings', Acno: 'DR-7', Name: 'Mr. Rubel Aziz', Relation: 'Brother', Code: 'PM000005', img: '' },
    { Node: 'Spouse', Acno: 'PF-25', Name: 'Mrs. Farahnaz Chowdhury', Relation: 'Wife', Code: 'PM000008', img: '' },
    // second wife, also holds her own 4(d) A/C via DS-25
    { Node: 'Spouse', Acno: 'PS-356', Name: 'Barrister Sumaiya Binta Aziz', Relation: 'Wife', Code: 'PM000020', img: '' },
    { Node: 'A4D', Acno: 'PS-356', Name: 'Barrister Sumaiya Binta Aziz', Relation: 'Wife', Code: 'PM000020', img: '' },
    { Node: 'A4D', Acno: 'PA-244', Name: 'Mr. Anaf Aziz', Relation: 'Son', Code: 'PM000029', img: '' },
  ],

  // ── DS-36 (DR-7's wife, own A/C) ──
  PM000007: [
    { Node: 'Spouse', Acno: 'DR-7', Name: 'Mr. Rubel Aziz', Relation: 'Husband', Code: 'PM000005', img: '' },
    { Node: 'A4D', Acno: 'PA-354', Name: 'Mr. Adil Aziz', Relation: 'Son', Code: 'PM000027', img: '' },
    { Node: 'A4D', Acno: 'AFD-0350', Name: 'Mr. Amer Aziz', Relation: 'Son', Code: 'PM000028', img: '' },
  ],

  // ── PF-25 (DS-25's wife, own A/C) ──
  PM000008: [
    { Node: 'Spouse', Acno: 'DS-25', Name: 'Mr. Showkat Aziz Russell', Relation: 'Husband', Code: 'PM000006', img: '' },
    { Node: 'A4D', Acno: 'PS-412', Name: 'Ms. Sinem Aziz', Relation: 'Daughter', Code: 'PM000030', img: '' },
    { Node: 'A4D', Acno: 'AFD-0790', Name: 'Ms. Sahar Aziz', Relation: 'Daughter', Code: 'PM000031', img: '' },
  ],

  // ── DS-44 (succession target, inherited DM-8's A/C — no dependents recorded) ──
  PM000014: [
    { Node: 'Parent', Acno: '', Name: 'X', Relation: 'Father', Code: NO_CODE, img: '' },
    { Node: 'Parent', Acno: '', Name: 'Y', Relation: 'Mother', Code: NO_CODE, img: '' },
  ],

  // ── LM-11 ──
  PM000009: [
    { Node: 'Parent', Acno: '', Name: 'Ahafiqur Rahman', Relation: 'Father', Code: NO_CODE, img: '' },
    { Node: 'Spouse', Acno: 'LS-8', Name: 'Sultana Shaheda Islam', Relation: 'Wife', Code: 'PM000010', img: '' },
    // forward Children rows — mirror the reverse Parent rows on PT-7/PW-6's own trees below
    { Node: 'Children', Acno: 'PT-7', Name: 'Tahmina Rehman', Relation: 'Daughter', Code: 'PM000011', img: '' },
    { Node: 'Children', Acno: 'PW-6', Name: 'Late Wasim Sajjad', Relation: 'Son', Code: 'PM000012', img: '' },
    { Node: 'A4D', Acno: 'AFD-0443', Name: 'Areesh Sajjad', Relation: 'Daughter of PW-6', Code: 'PM000035', img: '' },
    { Node: 'A4D', Acno: 'AFD-0444', Name: 'Ayyaz Sajjad', Relation: 'Son of PW-6', Code: 'PM000036', img: '' },
  ],

  // ── LS-8 ──
  PM000010: [
    { Node: 'Parent', Acno: '', Name: 'Md. Serajul Islam', Relation: 'Father', Code: NO_CODE, img: '' },
    { Node: 'Spouse', Acno: 'LM-11', Name: 'Md. Saiful Islam', Relation: 'Husband', Code: 'PM000009', img: '' },
    { Node: 'Children', Acno: 'PT-7', Name: 'Tahmina Rehman', Relation: 'Daughter', Code: 'PM000011', img: '' },
    { Node: 'Children', Acno: 'PW-6', Name: 'Late Wasim Sajjad', Relation: 'Son', Code: 'PM000012', img: '' },
    { Node: 'A4D', Acno: 'PS-338', Name: 'Shareef Omar Hamid Chowdhury', Relation: 'Son of PO-10', Code: 'PM000034', img: '' },
    { Node: 'A4D', Acno: 'AFD-0529', Name: 'Daneen Arif', Relation: 'Daughter of PW-6', Code: 'PM000039', img: '' },
  ],

  // ── PT-7 ──
  PM000011: [
    { Node: 'Parent', Acno: 'LM-11', Name: 'Md. Saiful Islam', Relation: 'Father', Code: 'PM000009', img: '' },
    { Node: 'Parent', Acno: 'LS-8', Name: 'Sultana Shaheda Islam', Relation: 'Mother', Code: 'PM000010', img: '' },
    { Node: 'Siblings', Acno: 'PW-6', Name: 'Late Wasim Sajjad', Relation: 'Brother', Code: 'PM000012', img: '' },
    { Node: 'Spouse', Acno: 'PO-10', Name: 'Omar Hamid Chowdhury', Relation: 'Husband', Code: 'PM000032', img: '' },
    { Node: 'A4D', Acno: 'PO-10', Name: 'Omar Hamid Chowdhury', Relation: 'Husband', Code: 'PM000032', img: '' },
    { Node: 'A4D', Acno: 'PS-329', Name: 'Sanjana Chowdhury', Relation: 'Daughter', Code: 'PM000033', img: '' },
    // PO-10 isn't a core member, so his own dependent surfaces here too
    { Node: 'Associate', Acno: 'AS-151', Name: 'Ahnaf Hamid Chowdhury', Relation: 'Son of PO-10', Code: 'PM000040', img: '' },
  ],

  // ── PW-6 ──
  PM000012: [
    { Node: 'Parent', Acno: 'LM-11', Name: 'Md. Saiful Islam', Relation: 'Father', Code: 'PM000009', img: '' },
    { Node: 'Parent', Acno: 'LS-8', Name: 'Sultana Shaheda Islam', Relation: 'Mother', Code: 'PM000010', img: '' },
    { Node: 'Siblings', Acno: 'PT-7', Name: 'Tahmina Rehman', Relation: 'Sister', Code: 'PM000011', img: '' },
    { Node: 'Spouse', Acno: 'PK-49', Name: 'Kaniz Fatema', Relation: 'Wife', Code: 'PM000013', img: '' },
  ],

  // ── PK-49 (PW-6's wife, own A/C) ──
  PM000013: [
    { Node: 'Parent', Acno: '', Name: 'Arzina Khanam', Relation: 'Mother', Code: NO_CODE, img: '' },
    { Node: 'Spouse', Acno: 'PW-6', Name: 'Late Wasim Sajjad', Relation: 'Husband', Code: 'PM000012', img: '' },
    { Node: 'A4D', Acno: 'AFD-0927', Name: 'Daniyah Fatema Sajjad', Relation: 'Daughter', Code: 'PM000037', img: '' },
    { Node: 'A4D', Acno: 'AFD-0928', Name: 'Dameer Sajjad', Relation: 'Son', Code: 'PM000038', img: '' },
  ],

  // ── LS-35 (succession target, inherited PW-6's A/C) ──
  PM000015: [
    { Node: 'Parent', Acno: '', Name: 'Alhaj S.A. Khaleque Ex M.P', Relation: 'Father', Code: NO_CODE, img: '' },
    { Node: 'Parent', Acno: '', Name: 'Nawshad Begum', Relation: 'Mother', Code: NO_CODE, img: '' },
    { Node: 'Associate', Acno: 'AS-157', Name: 'Syed Erfan Siddique', Relation: 'Son', Code: 'PM000041', img: '' },
  ],

  // ── PA-79 — verbatim real-API sample; see demoCoreMembers ──
  PM000070: [
    { Node: 'A4D', Acno: 'PS-193', Name: 'Sambrene Dia Alam', Relation: 'Daughter', Code: 'PM001488', img: 'http://118.179.152.53/myWeb01/Images/068/Member/PS-193.JPG' },
    { Node: 'A4D', Acno: 'PS-310', Name: 'Mrs. Sharlene Nisha Alam', Relation: 'Daughter', Code: 'PM000185', img: 'http://118.179.152.53/myWeb01/Images/068/Member/PS-310.JPG' },
    { Node: 'Associate', Acno: 'PM-228', Name: 'Mohammad Shabab Zaman', Relation: 'Associate-01', Code: 'PM000051', img: 'http://118.179.152.53/myWeb01/Images/068/Member/PM-228.JPG' },
    { Node: 'Children', Acno: 'PE-5', Name: 'Ehsan Khan', Relation: 'Son', Code: 'PM000062', img: 'http://118.179.152.53/myWeb01/Images/068/Member/PE-5.JPG' },
    { Node: 'Children', Acno: 'PS-125', Name: 'Sehelley Shafi', Relation: 'Daughter', Code: 'PM000057', img: 'http://118.179.152.53/myWeb01/Images/068/Member/PS-125.JPG' },
    { Node: 'Parent', Acno: 'DK-13', Name: 'Late Al-Haj M.A. Latif', Relation: 'Father', Code: 'DM000005', img: 'http://118.179.152.53/myWeb01/Images/068/Member/DK-13.JPG' },
    { Node: 'Parent', Acno: 'PZ-20', Name: 'Anisa Dewan', Relation: 'Mother', Code: 'PM000049', img: 'http://118.179.152.53/myWeb01/Images/068/Member/PZ-20.JPG' },
    { Node: 'Siblings', Acno: 'DK-14', Name: 'Khurshida Ahmed', Relation: 'Sister', Code: 'DM000006', img: 'http://118.179.152.53/myWeb01/Images/068/Member/DK-14.JPG' },
    { Node: 'Siblings', Acno: 'PA-77', Name: 'Anowar Rashid', Relation: 'Brother', Code: 'PM000068', img: 'http://118.179.152.53/myWeb01/Images/068/Member/PA-77.JPG' },
    { Node: 'Spouse', Acno: 'PS-548', Name: 'Sabina Alam', Relation: 'Spouse', Code: 'PM002430', img: 'http://118.179.152.53/myWeb01/Images/068/Member/PS-548.JPG' },
    { Node: 'Transfer', Acno: 'PS-91', Name: 'Subir Kumar Dey', Relation: 'Transfer from', Code: 'PM000081', img: 'http://118.179.152.53/myWeb01/Images/068/Member/PS-91.JPG' },
  ],
};
