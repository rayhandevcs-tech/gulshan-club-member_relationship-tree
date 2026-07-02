import { Member } from './types';

// ── Original demo data (Islam & Chowdhury families) ───────────────────────
// Structure per core member + spouse:
// Core member  → 2 A4D  + 2 Associate  (each A4D → 2 Associate)
// Their spouse → 2 A4D  + 2 Associate  (each A4D → 2 Associate)

// export const demoMembers: Member[] = [
//   {
//     id: 'LM-11', name: 'Md. Saiful Islam', type: 'Life', gender: 'M',
//     since: '28/10/1985',
//     phone: '+8801711538657',
//     email: 'islam1944bd@gmail.com',
//     pid: null, rel: null,
//     succession: 'LS-35',
//     membershipRef: 'Linked to LS-35',
//     fatherName: 'Ahafiqur Rahman',
//   },
//   {
//     id: 'LS-8', name: 'Sultana Shaheda Islam', type: 'Life', gender: 'F',
//     since: '28/10/1985',
//     phone: '+8801819213808',
//     email: 'ssbdl@agni.com',
//     pid: 'LM-11', rel: 'spouse',
//     fatherName: 'Md. Serajul Islam',
//   },
//   {
//     id: 'PT-7', name: 'Tahmina Rehman', type: 'Permanent', gender: 'F',
//     since: '12/12/1995',
//     phone: '+8801713012475',
//     email: 'tahminar67@gmail.com',
//     pid: 'LM-11', rel: 'child',
//     fatherId: 'LM-11', motherId: 'LS-8',
//   },
//   {
//     id: 'PW-6', name: 'Late Wasim Sajjad', type: 'Permanent', gender: 'M',
//     since: '15/10/2001',
//     phone: '+8801711595459',
//     email: 'wali@utahgroup.net',
//     pid: 'LM-11', rel: 'child',
//     fatherId: 'LM-11', motherId: 'LS-8',
//     succession: 'PK-49',
//   },
//   {
//     id: 'PO-10', name: 'Omar Hamid Chowdhury', type: 'Permanent', gender: 'M',
//     since: '04/03/2018',
//     phone: '+8801711593144',
//     email: 'omar.dhaka@gmail.com',
//     pid: 'PT-7', rel: 'spouse',
//     fatherName: 'Abdul Hamid Chowdhury',
//     motherName: 'Dureshar Ponok Chowdhury',
//   },
//   {
//     id: 'PS-329', name: 'Sanjana Chowdhury', type: 'Permanent', gender: 'F',
//     since: '17/09/2018',
//     email: 'transaction.gcl@gmail.com',
//     pid: 'PT-7', rel: 'a4d',
//     fatherId: 'PO-10', motherId: 'PT-7',
//   },
//   {
//     id: 'PS-338', name: 'Shareef Omar Hamid Chowdhury', type: 'Permanent', gender: 'M',
//     since: '17/09/2018',
//     phone: '+8801711593144',
//     email: 'shareef.arsenal95@gmail.com',
//     pid: 'LS-8', rel: 'a4d',
//     fatherId: 'PO-10', motherId: 'PT-7',
//   },
//   {
//     id: 'PK-49', name: 'Kaniz Fatema', type: 'Permanent', gender: 'F',
//     since: '28/09/2016',
//     phone: '+88029843422',
//     email: 'kanizfsajjad@gmail.com',
//     pid: 'PW-6', rel: 'spouse',
//     motherName: 'Arzina Khanam',
//   },
//   { id: 'AFD-0443', name: 'Areesh Sajjad',         type: 'A4D', gender: 'F', since: '01/05/2020', pid: 'LM-11', rel: 'a4d', fatherId: 'PW-6', motherId: 'PK-49' },
//   { id: 'AFD-0444', name: 'Ayyaz Sajjad',          type: 'A4D', gender: 'M', since: '01/05/2020', pid: 'LM-11', rel: 'a4d', fatherId: 'PW-6', motherId: 'PK-49' },
//   { id: 'AFD-0927', name: 'Daniyah Fatema Sajjad', type: 'A4D', gender: 'F', since: '01/05/2020', pid: 'PK-49', rel: 'a4d', fatherId: 'PW-6', motherId: 'PK-49' },
//   { id: 'AFD-0928', name: 'Dameer Sajjad',         type: 'A4D', gender: 'M', since: '01/05/2020', pid: 'PK-49', rel: 'a4d', fatherId: 'PW-6', motherId: 'PK-49' },
//   { id: 'AFD-0529', name: 'Daneen Arif',           type: 'A4D', gender: 'F', since: '15/09/2022', pid: 'LS-8',  rel: 'a4d' },
//   { id: 'AS-151',   name: 'Ahnaf Hamid Chowdhury', type: 'Associate', gender: 'M', since: '10/02/2023', pid: 'PO-10', rel: 'associate', fatherId: 'PO-10', motherId: 'PT-7' },
//   {
//     id: 'LS-35', name: 'Syed Abubakar Siddique', type: 'Life', gender: 'M',
//     since: '',
//     pid: null, rel: null,
//     fatherName: 'Alhaj S.A. Khaleque Ex M.P',
//     motherName: 'Nawshad Begum',
//   },
//   { id: 'AS-157', name: 'Syed Erfan Siddique', type: 'Associate', gender: 'M', since: '', pid: 'LS-35', rel: 'associate' },
// ];

export const caseC_KhanFamily: Member[] = [

// demo data

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
  
  { id: 'AFD-09', name: 'Daniyah Fatema Sajjad', type: 'Associate', gender: 'F', since: '01/05/2020', pid: 'PS-329', rel: 'associate', fatherId: 'PW-6', motherId: 'PK-49' },
  { id: 'AFD-093', name: 'Dameer Sajjad',         type: 'Associate', gender: 'M', since: '01/05/2020', pid: 'PS-329', rel: 'associate', fatherId: 'PW-6', motherId: 'PK-49' },


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

  { id: 'AFD-099', name: 'Daniyah Fatema Sajjad', type: 'Associate', gender: 'F', since: '01/05/2020', pid: 'AFD-0927', rel: 'associate', fatherId: 'PW-6', motherId: 'PK-49' },
  { id: 'AFD-0933', name: 'Dameer Sajjad',         type: 'Associate', gender: 'M', since: '01/05/2020', pid: 'AFD-0927', rel: 'associate', fatherId: 'PW-6', motherId: 'PK-49' },



  { id: 'AFD-079', name: 'Daniyah Fatema Sajjad', type: 'Associate', gender: 'F', since: '01/05/2020', pid: 'AFD-0928', rel: 'associate', fatherId: 'PW-6', motherId: 'PK-49' },
  { id: 'AFD-0937', name: 'Dameer Sajjad',         type: 'Associate', gender: 'M', since: '01/05/2020', pid: 'AFD-0928', rel: 'associate', fatherId: 'PW-6', motherId: 'PK-49' },




   { id: 'AFD-09', name: 'Daniyah Fatema Sajjad', type: 'Associate', gender: 'F', since: '01/05/2020', pid: 'PK-49', rel: 'associate', fatherId: 'PW-6', motherId: 'PK-49' },
   { id: 'AFD-093', name: 'Dameer Sajjad',         type: 'Associate', gender: 'M', since: '01/05/2020', pid: 'PK-49', rel: 'associate', fatherId: 'PW-6', motherId: 'PK-49' },

  

  { id: 'AFD-0529', name: 'Daneen Arif',           type: 'A4D', gender: 'F', since: '15/09/2022', pid: 'LS-8',  rel: 'a4d' },
  { id: 'AS-151',   name: 'Ahnaf Hamid Chowdhury', type: 'Associate', gender: 'M', since: '10/02/2023', pid: 'PO-10', rel: 'associate', fatherId: 'PO-10', motherId: 'PT-7' },
  { id: 'AS-152',   name: 'Ahnaf Hamid Chowdhury', type: 'Associate', gender: 'M', since: '10/02/2023', pid: 'PO-10', rel: 'associate', fatherId: 'PO-10', motherId: 'PT-7' },
  {
    id: 'LS-35', name: 'Syed Abubakar Siddique', type: 'Life', gender: 'M',
    since: '',
    pid: null, rel: null,
    fatherName: 'Alhaj S.A. Khaleque Ex M.P',
    motherName: 'Nawshad Begum',
  },

  {
    id: 'LS-36', name: 'Syed Abubakar Siddique', type: 'Life', gender: 'M',
    since: '',
    pid: null, rel: null,
    fatherName: 'Alhaj S.A. Khaleque Ex M.P',
    motherName: 'Nawshad Begum',
  },


  { id: 'AS-157', name: 'Syed Erfan Siddique', type: 'Associate', gender: 'M', since: '', pid: 'LS-35', rel: 'associate' },
  { id: 'AS-156', name: 'Syed Erfan Siddique', type: 'Associate', gender: 'M', since: '', pid: 'LS-35', rel: 'associate' },


 





























  // ═══════════════════════════════════════════════════════════════════════
  // ROOT COUPLE — Anwar Khan (LM-40) + Begum Anwar Khan (LS-40)
  // ═══════════════════════════════════════════════════════════════════════
  { id: 'LM-40', name: 'Anwar Khan',       type: 'Life', gender: 'M', since: '12/04/1990', phone: '+8801711000001', email: 'anwar.khan@gmail.com', pid: null,    rel: null,      fatherName: 'Abdul Hai Khan' },
  { id: 'LS-40', name: 'Begum Anwar Khan', type: 'Life', gender: 'F', since: '12/04/1990',                                                          pid: 'LM-40', rel: 'spouse',  fatherName: 'Md. Hafizur Rahman' },

  // LM-40 → A4D
  { id: 'A4D-101', name: 'Karim Khan',    type: 'A4D', gender: 'M', since: '01/03/2000', pid: 'LM-40', rel: 'a4d',       fatherId: 'LM-40', motherId: 'LS-40' },
  { id: 'A4D-102', name: 'Salma Khan',    type: 'A4D', gender: 'F', since: '01/03/2000', pid: 'LM-40', rel: 'a4d',       fatherId: 'LM-40', motherId: 'LS-40' },
  // LM-40 → Associate
  { id: 'AS-101',  name: 'Habib Mia',     type: 'Associate', gender: 'M', since: '05/06/2002', pid: 'LM-40', rel: 'associate' },
  { id: 'AS-102',  name: 'Farida Begum',  type: 'Associate', gender: 'F', since: '05/06/2002', pid: 'LM-40', rel: 'associate' },
  // A4D-101 → sub-Associates
  { id: 'AS-111',  name: 'Rahim Uddin',   type: 'Associate', gender: 'M', since: '10/01/2005', pid: 'A4D-101', rel: 'associate' },
  { id: 'AS-112',  name: 'Nasreen Akter', type: 'Associate', gender: 'F', since: '10/01/2005', pid: 'A4D-101', rel: 'associate' },
  // A4D-102 → sub-Associates
  { id: 'AS-121',  name: 'Jalal Ahmed',   type: 'Associate', gender: 'M', since: '10/01/2005', pid: 'A4D-102', rel: 'associate' },
  { id: 'AS-122',  name: 'Roksana Khanam',type: 'Associate', gender: 'F', since: '10/01/2005', pid: 'A4D-102', rel: 'associate' },

  // LS-40 (spouse) → A4D
  { id: 'A4D-151', name: 'Rubel Hossain', type: 'A4D', gender: 'M', since: '01/03/2000', pid: 'LS-40', rel: 'a4d',       fatherId: 'LM-40', motherId: 'LS-40' },
  { id: 'A4D-152', name: 'Mitu Akter',    type: 'A4D', gender: 'F', since: '01/03/2000', pid: 'LS-40', rel: 'a4d',       fatherId: 'LM-40', motherId: 'LS-40' },
  // LS-40 (spouse) → Associate
  { id: 'AS-151',  name: 'Salam Khan',    type: 'Associate', gender: 'M', since: '05/06/2002', pid: 'LS-40', rel: 'associate' },
  { id: 'AS-152',  name: 'Parul Begum',   type: 'Associate', gender: 'F', since: '05/06/2002', pid: 'LS-40', rel: 'associate' },
  // A4D-151 → sub-Associates
  { id: 'AS-161',  name: 'Shahidul Islam',  type: 'Associate', gender: 'M', since: '10/01/2005', pid: 'A4D-151', rel: 'associate' },
  { id: 'AS-162',  name: 'Momtaz Khanom',   type: 'Associate', gender: 'F', since: '10/01/2005', pid: 'A4D-151', rel: 'associate' },
  // A4D-152 → sub-Associates
  { id: 'AS-171',  name: 'Billal Hossain',  type: 'Associate', gender: 'M', since: '10/01/2005', pid: 'A4D-152', rel: 'associate' },
  { id: 'AS-172',  name: 'Kohinoor Begum',  type: 'Associate', gender: 'F', since: '10/01/2005', pid: 'A4D-152', rel: 'associate' },


  // ═══════════════════════════════════════════════════════════════════════
  // CHILDREN of LM-40 / LS-40
  // ═══════════════════════════════════════════════════════════════════════
  { id: 'PT-41', name: 'Sara Khan',      type: 'Permanent', gender: 'F', since: '20/06/2005', email: 'sara.khan@gmail.com',     pid: 'LM-40', rel: 'child', fatherId: 'LM-40', motherId: 'LS-40' },
  { id: 'PM-42', name: 'Tariq Khan',     type: 'Permanent', gender: 'M', since: '05/11/2008', email: 'tariq.khan@gmail.com',    pid: 'LM-40', rel: 'child', fatherId: 'LM-40', motherId: 'LS-40' },
  { id: 'PM-43', name: 'Tariq Hossain', type: 'Permanent', gender: 'M', since: '14/02/2009', email: 'tariq.hossain@gmail.com', pid: 'LM-40', rel: 'child', fatherId: 'LM-40', motherId: 'LS-40' },
  { id: 'PM-45', name: 'Ismail Khan',   type: 'Permanent', gender: 'M', since: '30/07/2011', email: 'ismail.khan@gmail.com',   pid: 'LM-40', rel: 'child', fatherId: 'LM-40', motherId: 'LS-40'},


  // ═══════════════════════════════════════════════════════════════════════
  // Sara Khan (PT-41) + Hamid Chowdhury (PH-41)
  // ═══════════════════════════════════════════════════════════════════════
  // { id: 'PH-41', name: 'Hamid Chowdhury', type: 'Permanent', gender: 'M', since: '15/02/2008', pid: 'PT-41', rel: 'spouse', fatherName: 'Habibur Chowdhury' },

  // PT-41 → A4D
  { id: 'A4D-201', name: 'Zara Chowdhury',  type: 'A4D', gender: 'F', since: '10/09/2012', pid: 'PT-41', rel: 'a4d', fatherId: 'PH-41', motherId: 'PT-41' },
  { id: 'A4D-202', name: 'Rayan Chowdhury', type: 'A4D', gender: 'M', since: '10/09/2012', pid: 'PT-41', rel: 'a4d', fatherId: 'PH-41', motherId: 'PT-41' },
  // PT-41 → Associate
  { id: 'AS-201',  name: 'Mina Akter',   type: 'Associate', gender: 'F', since: '01/04/2013', pid: 'PT-41', rel: 'associate' },
  { id: 'AS-202',  name: 'Nurul Amin',   type: 'Associate', gender: 'M', since: '01/04/2013', pid: 'PT-41', rel: 'associate' },
  // A4D-201 → sub-Associates
  { id: 'AS-211',  name: 'Laila Begum',  type: 'Associate', gender: 'F', since: '05/05/2016', pid: 'A4D-201', rel: 'associate' },
  { id: 'AS-212',  name: 'Saiful Islam', type: 'Associate', gender: 'M', since: '05/05/2016', pid: 'A4D-201', rel: 'associate' },
  // A4D-202 → sub-Associates
  { id: 'AS-221',  name: 'Khadija Khatun', type: 'Associate', gender: 'F', since: '05/05/2016', pid: 'A4D-202', rel: 'associate' },
  { id: 'AS-222',  name: 'Milon Hossain',  type: 'Associate', gender: 'M', since: '05/05/2016', pid: 'A4D-202', rel: 'associate' },

  // PH-41 (Sara's spouse) → A4D
  { id: 'A4D-251', name: 'Nadia Chowdhury',  type: 'A4D', gender: 'F', since: '10/09/2012', pid: 'PH-41', rel: 'a4d', fatherId: 'PH-41', motherId: 'PT-41' },
  { id: 'A4D-252', name: 'Farhan Chowdhury', type: 'A4D', gender: 'M', since: '10/09/2012', pid: 'PH-41', rel: 'a4d', fatherId: 'PH-41', motherId: 'PT-41' },
  // PH-41 → Associate
  { id: 'AS-251',  name: 'Rekha Begum',  type: 'Associate', gender: 'F', since: '01/04/2013', pid: 'PH-41', rel: 'associate' },
  { id: 'AS-252',  name: 'Jalal Uddin',  type: 'Associate', gender: 'M', since: '01/04/2013', pid: 'PH-41', rel: 'associate' },
  // A4D-251 → sub-Associates
  { id: 'AS-261',  name: 'Tania Sultana', type: 'Associate', gender: 'F', since: '05/05/2016', pid: 'A4D-251', rel: 'associate' },
  { id: 'AS-262',  name: 'Arif Hossain',  type: 'Associate', gender: 'M', since: '05/05/2016', pid: 'A4D-251', rel: 'associate' },
  // A4D-252 → sub-Associates
  { id: 'AS-271',  name: 'Sumaiya Akter', type: 'Associate', gender: 'F', since: '05/05/2016', pid: 'A4D-252', rel: 'associate' },
  { id: 'AS-272',  name: 'Rasel Mia',     type: 'Associate', gender: 'M', since: '05/05/2016', pid: 'A4D-252', rel: 'associate' },


  // ═══════════════════════════════════════════════════════════════════════
  // Tariq Khan (PM-42) + Nadia Tariq (PW-42)
  // ═══════════════════════════════════════════════════════════════════════
  // { id: 'PW-42', name: 'Nadia Tariq', type: 'Permanent', gender: 'F', since: '20/03/2012', pid: 'PM-42', rel: 'spouse', fatherName: 'Shafiqul Islam' },

  // PM-42 → A4D
  { id: 'A4D-301', name: 'Aisha Khan',  type: 'A4D', gender: 'F', since: '01/07/2015', pid: 'PM-42', rel: 'a4d', fatherId: 'PM-42', motherId: 'PW-42' },
  { id: 'A4D-302', name: 'Omar Faruk',  type: 'A4D', gender: 'M', since: '01/07/2015', pid: 'PM-42', rel: 'a4d', fatherId: 'PM-42', motherId: 'PW-42' },
  // PM-42 → Associate
  { id: 'AS-301',  name: 'Rafiq Mia',    type: 'Associate', gender: 'M', since: '10/01/2016', pid: 'PM-42', rel: 'associate' },
  { id: 'AS-302',  name: 'Shirin Akter', type: 'Associate', gender: 'F', since: '10/01/2016', pid: 'PM-42', rel: 'associate' },
  // A4D-301 → sub-Associates
  { id: 'AS-311',  name: 'Babar Ali',      type: 'Associate', gender: 'M', since: '03/03/2018', pid: 'A4D-301', rel: 'associate' },
  { id: 'AS-312',  name: 'Taslima Begum',  type: 'Associate', gender: 'F', since: '03/03/2018', pid: 'A4D-301', rel: 'associate' },
  // A4D-302 → sub-Associates
  { id: 'AS-321',  name: 'Kawsar Ahmed',   type: 'Associate', gender: 'M', since: '03/03/2018', pid: 'A4D-302', rel: 'associate' },
  { id: 'AS-322',  name: 'Rima Khatun',    type: 'Associate', gender: 'F', since: '03/03/2018', pid: 'A4D-302', rel: 'associate' },

  // PW-42 (Tariq's spouse) → A4D
  // { id: 'A4D-351', name: 'Nadia Anawar', type: 'A4D', gender: 'F', since: '01/07/2015', pid: 'PW-42', rel: 'a4d', fatherId: 'PM-42', motherId: 'PW-42' },
  // { id: 'A4D-352', name: 'Saad Islam',   type: 'A4D', gender: 'M', since: '01/07/2015', pid: 'PW-42', rel: 'a4d', fatherId: 'PM-42', motherId: 'PW-42' },
  // PW-42 → Associate
  { id: 'AS-351',  name: 'Monir Hossain', type: 'Associate', gender: 'M', since: '10/01/2016', pid: 'PW-42', rel: 'associate' },
  { id: 'AS-352',  name: 'Rahela Islam',  type: 'Associate', gender: 'F', since: '10/01/2016', pid: 'PW-42', rel: 'associate' },
  // A4D-351 → sub-Associates
  { id: 'AS-361',  name: 'Anwar Hossain', type: 'Associate', gender: 'M', since: '03/03/2018', pid: 'A4D-351', rel: 'associate' },
  { id: 'AS-362',  name: 'Farzana Begum', type: 'Associate', gender: 'F', since: '03/03/2018', pid: 'A4D-351', rel: 'associate' },
  // A4D-352 → sub-Associates
  { id: 'AS-371',  name: 'Delwar Mia',    type: 'Associate', gender: 'M', since: '03/03/2018', pid: 'A4D-352', rel: 'associate' },
  { id: 'AS-372',  name: 'Sumi Akter',    type: 'Associate', gender: 'F', since: '03/03/2018', pid: 'A4D-352', rel: 'associate' },


  // ═══════════════════════════════════════════════════════════════════════
  // Tariq Hossain (PM-43) + Rokeya Hossain (PW-43)
  // ═══════════════════════════════════════════════════════════════════════
  { id: 'PW-43', name: 'Rokeya Hossain', type: 'Permanent', gender: 'F', since: '14/08/2010', pid: 'PM-43', rel: 'spouse', fatherName: 'Abdul Mannan' },

  // PM-43 → A4D

  { id: 'A4D-402', name: 'Sadia Hossain',  type: 'A4D', gender: 'F', since: '05/11/2013', pid: 'PM-43', rel: 'a4d', fatherId: 'PM-43', motherId: 'PW-43' },
  // PM-43 → Associate
  { id: 'AS-401',  name: 'Alam Mia',     type: 'Associate', gender: 'M', since: '01/06/2014', pid: 'PM-43', rel: 'associate' },
  { id: 'AS-402',  name: 'Hasina Akter', type: 'Associate', gender: 'F', since: '01/06/2014', pid: 'PM-43', rel: 'associate' },
  // A4D-401 → sub-Associates
  { id: 'AS-411',  name: 'Shohag Islam',   type: 'Associate', gender: 'M', since: '07/08/2017', pid: 'A4D-401', rel: 'associate' },
  { id: 'AS-412',  name: 'Nasima Khatun',  type: 'Associate', gender: 'F', since: '07/08/2017', pid: 'A4D-401', rel: 'associate' },
  // A4D-402 → sub-Associates
  { id: 'AS-421',  name: 'Hafiz Uddin',    type: 'Associate', gender: 'M', since: '07/08/2017', pid: 'A4D-402', rel: 'associate' },
  { id: 'AS-422',  name: 'Reba Begum',     type: 'Associate', gender: 'F', since: '07/08/2017', pid: 'A4D-402', rel: 'associate' },

  // PW-43 (Tariq Hossain's spouse) → A4D
  // { id: 'A4D-451', name: 'Jibon Hossain', type: 'A4D', gender: 'M', since: '05/11/2013', pid: 'PW-43', rel: 'a4d', fatherId: 'PM-43', motherId: 'PW-43' },
  // { id: 'A4D-452', name: 'Mili Begum',    type: 'A4D', gender: 'F', since: '05/11/2013', pid: 'PW-43', rel: 'a4d', fatherId: 'PM-43', motherId: 'PW-43' },
  // PW-43 → Associate
  { id: 'AS-451',  name: 'Rezaul Karim',  type: 'Associate', gender: 'M', since: '01/06/2014', pid: 'PW-43', rel: 'associate' },
  { id: 'AS-452',  name: 'Kamrun Nahar',  type: 'Associate', gender: 'F', since: '01/06/2014', pid: 'PW-43', rel: 'associate' },
  // A4D-451 → sub-Associates
  { id: 'AS-461',  name: 'Siraj Mia',      type: 'Associate', gender: 'M', since: '07/08/2017', pid: 'A4D-451', rel: 'associate' },
  { id: 'AS-462',  name: 'Shamima Begum',  type: 'Associate', gender: 'F', since: '07/08/2017', pid: 'A4D-451', rel: 'associate' },
  // A4D-452 → sub-Associates
  { id: 'AS-471',  name: 'Tipu Sultan',    type: 'Associate', gender: 'M', since: '07/08/2017', pid: 'A4D-452', rel: 'associate' },
  { id: 'AS-472',  name: 'Dilara Akter',   type: 'Associate', gender: 'F', since: '07/08/2017', pid: 'A4D-452', rel: 'associate' },


  // ═══════════════════════════════════════════════════════════════════════
  // Ismail Khan (PM-45) + Sabina Islam (PW-45)
  // ═══════════════════════════════════════════════════════════════════════
  { id: 'PW-45', name: 'Sabina Islam', type: 'Permanent', gender: 'F', since: '22/11/2013', pid: 'PM-45', rel: 'spouse', fatherName: 'Kamaluddin Ahmed' },

  // PM-45 → A4D
  { id: 'A4D-501', name: 'Rakib Khan', type: 'A4D', gender: 'M', since: '01/04/2016', pid: 'PM-45', rel: 'a4d', fatherId: 'PM-45', motherId: 'PW-45' },
 
  // PM-45 → Associate
  { id: 'AS-501',  name: 'Zahir Uddin',    type: 'Associate', gender: 'M', since: '05/07/2017', pid: 'PM-45', rel: 'associate' },
  { id: 'AS-502',  name: 'Nurjahan Begum', type: 'Associate', gender: 'F', since: '05/07/2017', pid: 'PM-45', rel: 'associate' },
  // A4D-501 → sub-Associates
  { id: 'AS-511',  name: 'Forhad Hossain', type: 'Associate', gender: 'M', since: '11/11/2019', pid: 'A4D-501', rel: 'associate' },
  { id: 'AS-512',  name: 'Jharna Akter',   type: 'Associate', gender: 'F', since: '11/11/2019', pid: 'A4D-501', rel: 'associate' },
  // A4D-502 → sub-Associates
  { id: 'AS-521',  name: 'Nasir Hossain',  type: 'Associate', gender: 'M', since: '11/11/2019', pid: 'A4D-502', rel: 'associate' },
  { id: 'AS-522',  name: 'Sultana Begum',  type: 'Associate', gender: 'F', since: '11/11/2019', pid: 'A4D-502', rel: 'associate' },

  // PW-45 (Ismail's spouse) → A4D
  // { id: 'A4D-551', name: 'Sabbir Islam',  type: 'A4D', gender: 'M', since: '01/04/2016', pid: 'PW-45', rel: 'a4d', fatherId: 'PM-45', motherId: 'PW-45' },
  // { id: 'A4D-552', name: 'Sanjida Islam', type: 'A4D', gender: 'F', since: '01/04/2016', pid: 'PW-45', rel: 'a4d', fatherId: 'PM-45', motherId: 'PW-45' },
  // PW-45 → Associate
  { id: 'AS-551',  name: 'Alamgir Hossain', type: 'Associate', gender: 'M', since: '05/07/2017', pid: 'PW-45', rel: 'associate' },
  { id: 'AS-552',  name: 'Shefali Begum',   type: 'Associate', gender: 'F', since: '05/07/2017', pid: 'PW-45', rel: 'associate' },
  // A4D-551 → sub-Associates
  { id: 'AS-561',  name: 'Bahar Uddin',    type: 'Associate', gender: 'M', since: '11/11/2019', pid: 'A4D-551', rel: 'associate' },
  { id: 'AS-562',  name: 'Morzina Khatun', type: 'Associate', gender: 'F', since: '11/11/2019', pid: 'A4D-551', rel: 'associate' },
  // A4D-552 → sub-Associates
  { id: 'AS-571',  name: 'Enamul Haque',   type: 'Associate', gender: 'M', since: '11/11/2019', pid: 'A4D-552', rel: 'associate' },
  { id: 'AS-572',  name: 'Lipa Akter',     type: 'Associate', gender: 'F', since: '11/11/2019', pid: 'A4D-552', rel: 'associate' },


// ── Dataset 3: Hashem Family (Gulshan Club Members) ──────────────────────────
// Source: Family Members List of Mr. M. A. Hashem (DM-8)
// 19 members total — Root + Spouse, 5 Sons, 6 Sons' Spouses, 6 Grandchildren

 
  // ════════════════════════════════════════════════════════════════════════════
  // ROOT
  // ════════════════════════════════════════════════════════════════════════════
  {
    id: 'DM-8',
    name: 'Mr. M. A. Hashem',
    type: 'Donor',
    gender: 'M',
    since: '04/10/1989',
    pid: null, rel: null,
    note: 'Chairman & Managing Director, Partex Group of Industries, 74 Mohakhali C/A, Dhaka-1212',
  },
 
  // ════════════════════════════════════════════════════════════════════════════
  // ROOT SPOUSE  — Remarks: 4(d)-DM-8
  // ════════════════════════════════════════════════════════════════════════════
  {
    id: 'PS-295',
    name: 'Mrs. Sultana Hashem',
    type: 'Permanent',
    gender: 'F',
    since: '14/05/2018',
    pid: 'DM-8', rel: 'spouse',
    note: 'House # 9, Road # 55, Gulshan-2, Dhaka-1212',
  },
 
  // ════════════════════════════════════════════════════════════════════════════
  // SONS — all Core members, children of DM-8
  // ════════════════════════════════════════════════════════════════════════════
  {
    id: 'PA-41',
    name: 'Mr. Aziz Al-Kaiser',
    type: 'Permanent',
    gender: 'M',
    since: '21/11/1990',
    pid: 'DM-8', rel: 'child',
    fatherId: 'DM-8', motherId: 'PS-295',
    note: '(Level-13), SPL Western Tower, 186, Tejgaon, Dhaka-1208',
  },
  {
    id: 'PA-74',
    name: 'Mr. Aziz Al Mahmood',
    type: 'Permanent',
    gender: 'M',
    since: '20/11/1995',
    pid: 'DM-8', rel: 'child',
    fatherId: 'DM-8', motherId: 'PS-295',
    note: '(Level-13), SPL Western Tower, 186, Tejgaon, Dhaka-1208',
  },
  {
    id: 'PA-83',
    name: 'Mr. Aziz Al-Masud',
    type: 'Permanent',
    gender: 'M',
    since: '21/09/1999',
    pid: 'DM-8', rel: 'child',
    fatherId: 'DM-8', motherId: 'PS-295',
    note: 'Managing Director, Amber Pulp & Paper Mills Ltd., 74 Mohakhali C/A, Dhaka-1212',
  },
  {
    id: 'DR-7',
    name: 'Mr. Rubel Aziz',
    type: 'Donor',
    gender: 'M',
    since: '06/03/1998',
    pid: 'DM-8', rel: 'child',
    fatherId: 'DM-8', motherId: 'PS-295',
    note: 'Managing Director, Partex Beverage BD. Limited, 74 Mohakhali C/A, Dhaka-1212',
  },
  {
    id: 'DS-25',
    name: 'Mr. Showkat Aziz Russell',
    type: 'Donor',
    gender: 'M',
    since: '03/06/1998',
    pid: 'DM-8', rel: 'child',
    fatherId: 'DM-8', motherId: 'PS-295',
    note: 'Chairman, Amber Group, House # 2, Road # 62, Gulshan-2, Dhaka-1212',
  },
 
  // ════════════════════════════════════════════════════════════════════════════
  // SONS' SPOUSES
  // ════════════════════════════════════════════════════════════════════════════
  // Remarks 4(d)-PA-41 → spouse under PA-41's quota
  {
    id: 'PT-70',
    name: 'Mrs. Tabassum Kaiser',
    type: 'A4D', // took her membership as an A4D slot off PA-41's quota — renders below him, not beside
    gender: 'F',
    since: '14/05/2018',
    pid: 'PA-41', rel: 'spouse',
    note: '(Level-13), SPL Western Tower, 186, Tejgaon, Dhaka-1208',
  },
  // Remarks 4(d)-PA-74
  {
    id: 'PS-238',
    name: 'Mrs. Savera H. Mahmood',
    type: 'A4D', // took her membership as an A4D slot off PA-74's quota — renders below him, not beside
    gender: 'F',
    since: '04/03/2018',
    pid: 'PA-74', rel: 'spouse',
    note: '(Level-13), SPL Western Tower, 186, Tejgaon, Dhaka-1208',
  },
  // Remarks 4(d)-PA-83
  {
    id: 'PJ-16',
    name: 'Mrs. Ji Eun Lee',
    type: 'A4D', // took her membership as an A4D slot off PA-83's quota — renders below him, not beside
    gender: 'F',
    since: '14/05/2018',
    pid: 'PA-83', rel: 'spouse',
    note: 'Partex Group, 74 Mohakhali C/A, Dhaka-1212',
  },
  // Remarks: Core → DS-36 has own Core membership
  {
    id: 'DS-36',
    name: 'Mrs. Syeda Shaireen Aziz',
    type: 'Donor',
    gender: 'F',
    since: '02/04/2013',
    pid: 'DR-7', rel: 'spouse',
    note: 'House # NWD-8, Road # 62, Gulshan-2, Dhaka-1212',
  },
  // Remarks: Core → PF-25 has own Core membership (primary spouse of DS-25)
  {
    id: 'PF-25',
    name: 'Mrs. Farahnaz Chowdhury',
    type: 'Permanent',
    gender: 'F',
    since: '12/08/2012',
    pid: 'DS-25', rel: 'spouse',
    note: 'House # 2, Road # 62, Gulshan-2, Dhaka-1212',
  },
  // Remarks: 4(d)-DS-25 → second spouse of DS-25, under his A4D quota
  {
    id: 'PS-356',
    name: 'Barrister Sumaiya Binta Aziz',
    type: 'Permanent',
    gender: 'F',
    since: '21/11/2018',
    pid: 'DS-25', rel: 'spouse',
    note: 'House # 2, Road # 62, Gulshan-2, Dhaka-1212',
  },
 
  // ════════════════════════════════════════════════════════════════════════════
  // GRANDCHILDREN — Children of PA-41 (Aziz Al-Kaiser) + PT-70
  // ════════════════════════════════════════════════════════════════════════════
  // 4(d)-DM-8 → under DM-8's quota
  {
    id: 'PA-265',
    name: 'Mr. Amman Al Aziz',
    type: 'Permanent',
    gender: 'M',
    since: '28/12/2019',
    pid: 'DM-8', rel: 'a4d',
    fatherId: 'PA-41', motherId: 'PT-70',
    note: '(Level-13), SPL Western Tower, 186, Tejgaon, Dhaka-1208',
  },
  // 4(d)-PA-41 → under PA-41's quota
  {
    id: 'PA-288',
    name: 'Mr. Amid Al Aziz',
    type: 'Permanent',
    gender: 'M',
    since: '27/01/2021',
    pid: 'PA-41', rel: 'a4d',
    fatherId: 'PA-41', motherId: 'PT-70',
    note: '24, Dutabash Road, Baridhara, Dhaka-1212',
  },
  // 4(d)-PM-199 — no Club A/C yet (pending registration)
  // {
  //   id: 'PENDING-arsh-al-aziz',
  //   name: 'Mr. Arsh Al Aziz',
  //   type: 'A4D',
  //   gender: 'M',
  //   since: '',
  //   pid: 'PA-41', rel: 'a4d',
  //   fatherId: 'PA-41', motherId: 'PT-70',
  //   note: '24, Dutabash Road, Baridhara, Dhaka-1212 | Quota ref: PM-199 (pending A/C)',
  // },
 
  // ────────────────────────────────────────────────────────────────────────────
  // Children of PA-74 (Aziz Al Mahmood) + PS-238
  // ────────────────────────────────────────────────────────────────────────────
  // 4(d)-PA-74
  {
    id: 'PF-90',
    name: 'Ms. Fabiana Aziz',
    type: 'Permanent',
    gender: 'F',
    since: '30/09/2019',
    pid: 'PA-74', rel: 'a4d',
    fatherId: 'PA-74', motherId: 'PS-238',
    note: '(Level-13), SPL Western Tower, 186, Tejgaon, Dhaka-1208',
  },
  // 4(d)-DR-7 → under DR-7's quota
  {
    id: 'PS-469',
    name: 'Ms. Samaraa Sultana Aziz',
    type: 'Permanent',
    gender: 'F',
    since: '19/02/2022',
    pid: 'DR-7', rel: 'a4d',
    fatherId: 'PA-74', motherId: 'PS-238',
    note: '(Level-13), SPL Western Tower, 186, Tejgaon, Dhaka-1208',
  },
  // 4(d)-PH-23 — no Club A/C yet
  // {
  //   id: 'PENDING-nashrah-sultana-aziz',
  //   name: 'Ms. Nashrah Sultana Aziz',
  //   type: 'A4D',
  //   gender: 'F',
  //   since: '',
  //   pid: 'PA-74', rel: 'a4d',
  //   fatherId: 'PA-74', motherId: 'PS-238',
  //   note: '(Level-13), SPL Western Tower, 186, Tejgaon, Dhaka-1208 | Quota ref: PH-23 (pending A/C)',
  // },
  // 4(d)-LN-5 — no Club A/C yet
  // {
  //   id: 'PENDING-giovana-aziz',
  //   name: 'Ms. Giovana Aziz',
  //   type: 'A4D',
  //   gender: 'F',
  //   since: '',
  //   pid: 'PA-74', rel: 'a4d',
  //   fatherId: 'PA-74', motherId: 'PS-238',
  //   note: '(Level-13), SPL Western Tower, 186, Tejgaon, Dhaka-1208 | Quota ref: LN-5 (pending A/C)',
  // },
 
  // ────────────────────────────────────────────────────────────────────────────
  // Children of PA-83 (Aziz Al-Masud) + PJ-16 (Ji Eun Lee)
  // ────────────────────────────────────────────────────────────────────────────
  // 4(d)-PA-83
  {
    id: 'PA-306',
    name: 'Mr. Arman Aziz',
    type: 'Permanent',
    gender: 'M',
    since: '28/06/2021',
    pid: 'PA-83', rel: 'a4d',
    fatherId: 'PA-83', motherId: 'PJ-16',
    note: 'Partex Group, 74 Mohakhali C/A, Dhaka-1212',
  },
  // 4(d)-PM-122 — no Club A/C yet (Arshad Lee — note Korean surname from PJ-16)
  // {
  //   id: 'PA-307',
  //   name: 'Mr. Arshad Lee',
  //   type: 'Permanent',
  //   gender: 'M',
  //   since: '28/06/2021',
  //   pid: 'PA-83', rel: 'a4d',
  //   fatherId: 'PA-83', motherId: 'PJ-16',
  //   note: 'Partex Group, 74 Mohakhali C/A, Dhaka-1212',
  // },
 
  // ────────────────────────────────────────────────────────────────────────────
  // Children of DR-7 (Rubel Aziz) + DS-36 (Syeda Shaireen Aziz)
  // ────────────────────────────────────────────────────────────────────────────
  // 4(d)-DR-7
  {
    id: 'PA-272',
    name: 'Mr. Asef Aziz',
    type: 'Permanent',
    gender: 'M',
    since: '23/06/2020',
    pid: 'DR-7', rel: 'a4d',
    fatherId: 'DR-7', motherId: 'DS-36',
    note: 'House # 8, Road # 62, Gulshan-2, Dhaka-1212',
  },
  // 4(d)-DS-36
  {
    id: 'PA-354',
    name: 'Mr. Adil Aziz',
    type: 'Permanent',
    gender: 'M',
    since: '18/09/2023',
    pid: 'DS-36', rel: 'a4d',
    fatherId: 'DR-7', motherId: 'DS-36',
    note: 'House # 8, Road # 62, Gulshan-2, Dhaka-1212',
  },
  // 4(d)-DS-36 — no Club A/C yet
  {
    id: 'AFD-0350',
    name: 'Mr. Amer Aziz',
    type: 'A4D',
    gender: 'M',
    since: '',
    pid: 'DS-36', rel: 'a4d',
    fatherId: 'DR-7', motherId: 'DS-36',
    note: 'House # 8, Road # 62, Gulshan-2, Dhaka-1212 | Pending A/C',
  },
 
  // ────────────────────────────────────────────────────────────────────────────
  // Children of DS-25 (Showkat Aziz Russell) + PF-25 (Farahnaz Chowdhury)
  // ────────────────────────────────────────────────────────────────────────────
  // 4(d)-DS-25
  {
    id: 'PA-244',
    name: 'Mr. Anaf Aziz',
    type: 'Permanent',
    gender: 'M',
    since: '17/09/2018',
    pid: 'DS-25', rel: 'a4d',
    fatherId: 'DS-25', motherId: 'PF-25',
    note: 'House # 2, Road # 62, Gulshan-2, Dhaka-1212',
  },
  // 4(d)-PF-25
  {
    id: 'PS-412',
    name: 'Ms. Sinem Aziz',
    type: 'Permanent',
    gender: 'F',
    since: '08/11/2020',
    pid: 'PF-25', rel: 'a4d',
    fatherId: 'DS-25', motherId: 'PF-25',
    note: 'House # 2, Road # 62, Gulshan-2, Dhaka-1212',
  },
  // 4(d)-PF-25 — no Club A/C yet
  {
    id: 'AFD-0790',
    name: 'Ms. Sahar Aziz',
    type: 'A4D',
    gender: 'F',
    since: '',
    pid: 'PF-25', rel: 'a4d',
    fatherId: 'DS-25', motherId: 'PF-25',
    note: 'House # 2, Road # 62, Gulshan-2, Dhaka-1212 | Pending A/C',
  },
  // 4(d)-PS-25 (likely typo for DS-25 or PF-25) — no Club A/C yet
  // {
  //   id: 'PENDING-austin-russell',
  //   name: 'Mr. Austin Russell',
  //   type: 'A4D',
  //   gender: 'M',
  //   since: '',
  //   pid: 'DS-25', rel: 'a4d',
  //   fatherId: 'DS-25',
  //   note: 'House # 2, Road # 62, Gulshan-2, Dhaka-1212 | Pending A/C | Quota ref: PS-25 (possible typo)',
  // },

























];

// ── Case C: 3-generation family with cross-quota ──────────────────────────


// ── Active dataset — switch here to test different cases ──────────────────
export const allTestCases: Member[] = [
  
  ...caseC_KhanFamily,
];
