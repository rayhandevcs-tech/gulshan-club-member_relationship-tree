import type { CoreMemberDto, TreeItemDto } from './convertApiData';

export type { CoreMemberDto, TreeItemDto };

// blank Code for parents referenced only by name — no Club A/C
const NO_CODE = '        ';

export const demoCoreMembers: CoreMemberDto[] = [

  // ═══ Hashem family ═══
  { id: 'PM000001', acno: 'DM-8',   name: 'Late Mr. M. A. Hashem',        img: '' },
  { id: 'PM000002', acno: 'PA-41',  name: 'Mr. Aziz Al-Kaiser',           img: '' },
  { id: 'PM000003', acno: 'PA-74',  name: 'Mr. Aziz Al Mahmood',          img: '' },
  { id: 'PM000004', acno: 'PA-83',  name: 'Mr. Aziz Al-Masud',            img: '' },
  { id: 'PM000005', acno: 'DR-7',   name: 'Mr. Rubel Aziz',               img: '' },
  { id: 'PM000006', acno: 'DS-25',  name: 'Mr. Showkat Aziz Russell',     img: '' },
  { id: 'PM000007', acno: 'DS-36',  name: 'Mrs. Syeda Shaireen Aziz',     img: '' },
  { id: 'PM000008', acno: 'PF-25',  name: 'Mrs. Farahnaz Chowdhury',      img: '' },
  { id: 'PM000014', acno: 'DS-44',  name: 'Simran Rahman',                img: '' },

  // ═══ Islam family ═══
  { id: 'PM000009', acno: 'LM-11',  name: 'Md. Saiful Islam',             img: '' },
  { id: 'PM000010', acno: 'LS-8',   name: 'Sultana Shaheda Islam',        img: '' },
  { id: 'PM000011', acno: 'PT-7',   name: 'Tahmina Rehman',               img: '' },
  { id: 'PM000012', acno: 'PW-6',   name: 'Late Wasim Sajjad',            img: '' },
  { id: 'PM000013', acno: 'PK-49',  name: 'Kaniz Fatema',                 img: '' },
  { id: 'PM000015', acno: 'LS-35',  name: 'Syed Abubakar Siddique',       img: '' },

  // ═══ Test cases — every node scenario ═══
  // FIX 1: PM000070 → PA-79 (unchanged)
  { id: 'PM000070', acno: 'PA-79',  name: 'Abu M. Shahidul Alam (Majjad)',img: 'http://118.179.152.53/myWeb01/Images/068/Member/PA-79.JPG'  },
  // FIX 2: PM000001 → PM000080 (was duplicate with DM-8 above)
  { id: 'PM000080', acno: 'PG-3',   name: 'Gazi Golam Rabbani',           img: 'http://118.179.152.53/myWeb01/Images/068/Member/PG-3.JPG'   },
  // FIX 3: DM000005 kept (unique — no conflict)
  { id: 'DM000005', acno: 'DK-13',  name: 'Late Kausar Zaman Bappi',      img: 'http://118.179.152.53/myWeb01/Images/068/Member/DK-13.JPG'  },
  { id: 'PM000042', acno: 'PS-45',  name: 'Salman Fazlur Rahman',         img: 'http://118.179.152.53/myWeb01/Images/068/Member/PS-45.JPG'  },
  { id: 'PM000027', acno: 'PG-5',   name: 'Gazala Chowdhury',             img: 'http://118.179.152.53/myWeb01/Images/068/Member/PG-5.JPG'   },
];

export const demoTreeData: Record<string, TreeItemDto[]> = {

  // ── DM-8 (PM000001) ──────────────────────────────────────────────────────────
  PM000001: [
    { Node: 'Spouse',   Acno: 'PS-295', Name: 'Mrs. Sultana Hashem',          Relation: 'Wife',       Code: 'PM000016', img: '' },
    { Node: 'A4D',      Acno: 'PS-295', Name: 'Mrs. Sultana Hashem',          Relation: 'Wife',       Code: 'PM000016', img: '' },
    { Node: 'A4D',      Acno: 'PA-265', Name: 'Mr. Amman Al Aziz',            Relation: 'Son of PA-41',Code: 'PM000021',img: '' },
    { Node: 'Children', Acno: 'PA-41',  Name: 'Mr. Aziz Al-Kaiser',           Relation: 'Son',        Code: 'PM000002', img: '' },
    { Node: 'Children', Acno: 'PA-74',  Name: 'Mr. Aziz Al Mahmood',          Relation: 'Son',        Code: 'PM000003', img: '' },
    { Node: 'Children', Acno: 'PA-83',  Name: 'Mr. Aziz Al-Masud',            Relation: 'Son',        Code: 'PM000004', img: '' },
    { Node: 'Children', Acno: 'DR-7',   Name: 'Mr. Rubel Aziz',               Relation: 'Son',        Code: 'PM000005', img: '' },
    { Node: 'Children', Acno: 'DS-25',  Name: 'Mr. Showkat Aziz Russell',     Relation: 'Son',        Code: 'PM000006', img: '' },
    { Node: 'Transfer', Acno: 'DS-44',  Name: 'Simran Rahman',                Relation: 'Transfer to',Code: 'PM000014', img: '' },
  ],

  // ── PA-41 (PM000002) ─────────────────────────────────────────────────────────
  PM000002: [
    { Node: 'Parent',   Acno: 'DM-8',   Name: 'Late Mr. M. A. Hashem',        Relation: 'Father',     Code: 'PM000001', img: '' },
    { Node: 'Parent',   Acno: 'PS-295', Name: 'Mrs. Sultana Hashem',          Relation: 'Mother',     Code: 'PM000016', img: '' },
    { Node: 'Siblings', Acno: 'PA-74',  Name: 'Mr. Aziz Al Mahmood',          Relation: 'Brother',    Code: 'PM000003', img: '' },
    { Node: 'Siblings', Acno: 'PA-83',  Name: 'Mr. Aziz Al-Masud',            Relation: 'Brother',    Code: 'PM000004', img: '' },
    { Node: 'Siblings', Acno: 'DR-7',   Name: 'Mr. Rubel Aziz',               Relation: 'Brother',    Code: 'PM000005', img: '' },
    { Node: 'Siblings', Acno: 'DS-25',  Name: 'Mr. Showkat Aziz Russell',     Relation: 'Brother',    Code: 'PM000006', img: '' },
    { Node: 'Spouse',   Acno: 'PT-70',  Name: 'Mrs. Tabassum Kaiser',         Relation: 'Wife',       Code: 'PM000017', img: '' },
    { Node: 'A4D',      Acno: 'PT-70',  Name: 'Mrs. Tabassum Kaiser',         Relation: 'Wife',       Code: 'PM000017', img: '' },
    { Node: 'A4D',      Acno: 'PA-288', Name: 'Mr. Amid Al Aziz',             Relation: 'Son',        Code: 'PM000022', img: '' },
  ],

  // ── PA-74 (PM000003) ─────────────────────────────────────────────────────────
  PM000003: [
    { Node: 'Parent',   Acno: 'DM-8',   Name: 'Late Mr. M. A. Hashem',        Relation: 'Father',     Code: 'PM000001', img: '' },
    { Node: 'Parent',   Acno: 'PS-295', Name: 'Mrs. Sultana Hashem',          Relation: 'Mother',     Code: 'PM000016', img: '' },
    { Node: 'Siblings', Acno: 'PA-41',  Name: 'Mr. Aziz Al-Kaiser',           Relation: 'Brother',    Code: 'PM000002', img: '' },
    { Node: 'Siblings', Acno: 'PA-83',  Name: 'Mr. Aziz Al-Masud',            Relation: 'Brother',    Code: 'PM000004', img: '' },
    { Node: 'Siblings', Acno: 'DR-7',   Name: 'Mr. Rubel Aziz',               Relation: 'Brother',    Code: 'PM000005', img: '' },
    { Node: 'Siblings', Acno: 'DS-25',  Name: 'Mr. Showkat Aziz Russell',     Relation: 'Brother',    Code: 'PM000006', img: '' },
    { Node: 'Spouse',   Acno: 'PS-238', Name: 'Mrs. Savera H. Mahmood',       Relation: 'Wife',       Code: 'PM000018', img: '' },
    { Node: 'A4D',      Acno: 'PS-238', Name: 'Mrs. Savera H. Mahmood',       Relation: 'Wife',       Code: 'PM000018', img: '' },
    { Node: 'A4D',      Acno: 'PF-90',  Name: 'Ms. Fabiana Aziz',             Relation: 'Daughter',   Code: 'PM000023', img: '' },
  ],

  // ── PA-83 (PM000004) ─────────────────────────────────────────────────────────
  PM000004: [
    { Node: 'Parent',   Acno: 'DM-8',   Name: 'Late Mr. M. A. Hashem',        Relation: 'Father',     Code: 'PM000001', img: '' },
    { Node: 'Parent',   Acno: 'PS-295', Name: 'Mrs. Sultana Hashem',          Relation: 'Mother',     Code: 'PM000016', img: '' },
    { Node: 'Siblings', Acno: 'PA-41',  Name: 'Mr. Aziz Al-Kaiser',           Relation: 'Brother',    Code: 'PM000002', img: '' },
    { Node: 'Siblings', Acno: 'PA-74',  Name: 'Mr. Aziz Al Mahmood',          Relation: 'Brother',    Code: 'PM000003', img: '' },
    { Node: 'Siblings', Acno: 'DR-7',   Name: 'Mr. Rubel Aziz',               Relation: 'Brother',    Code: 'PM000005', img: '' },
    { Node: 'Siblings', Acno: 'DS-25',  Name: 'Mr. Showkat Aziz Russell',     Relation: 'Brother',    Code: 'PM000006', img: '' },
    { Node: 'Spouse',   Acno: 'PJ-16',  Name: 'Mrs. Ji Eun Lee',              Relation: 'Wife',       Code: 'PM000019', img: '' },
    { Node: 'A4D',      Acno: 'PJ-16',  Name: 'Mrs. Ji Eun Lee',              Relation: 'Wife',       Code: 'PM000019', img: '' },
    { Node: 'A4D',      Acno: 'PA-307', Name: 'Mr. Arshad Lee',               Relation: 'Son',        Code: 'PM000025', img: '' },
    { Node: 'A4D',      Acno: 'PA-306', Name: 'Mr. Arman Aziz',               Relation: 'Son',        Code: 'PM000024', img: '' },
  ],

  // ── DR-7 (PM000005) ──────────────────────────────────────────────────────────
  PM000005: [
    { Node: 'Parent',   Acno: 'DM-8',   Name: 'Late Mr. M. A. Hashem',        Relation: 'Father',     Code: 'PM000001', img: '' },
    { Node: 'Parent',   Acno: 'PS-295', Name: 'Mrs. Sultana Hashem',          Relation: 'Mother',     Code: 'PM000016', img: '' },
    { Node: 'Siblings', Acno: 'PA-41',  Name: 'Mr. Aziz Al-Kaiser',           Relation: 'Brother',    Code: 'PM000002', img: '' },
    { Node: 'Siblings', Acno: 'PA-74',  Name: 'Mr. Aziz Al Mahmood',          Relation: 'Brother',    Code: 'PM000003', img: '' },
    { Node: 'Siblings', Acno: 'PA-83',  Name: 'Mr. Aziz Al-Masud',            Relation: 'Brother',    Code: 'PM000004', img: '' },
    { Node: 'Siblings', Acno: 'DS-25',  Name: 'Mr. Showkat Aziz Russell',     Relation: 'Brother',    Code: 'PM000006', img: '' },
    { Node: 'Spouse',   Acno: 'DS-36',  Name: 'Mrs. Syeda Shaireen Aziz',     Relation: 'Wife',       Code: 'PM000007', img: '' },
    { Node: 'A4D',      Acno: 'PA-272', Name: 'Mr. Asef Aziz',                Relation: 'Son',        Code: 'PM000026', img: '' },
    { Node: 'A4D',      Acno: 'PA-354', Name: 'Mr. Adil Aziz',                Relation: 'Son',        Code: 'PM000027', img: '' },
  ],

  // ── DS-25 (PM000006) ─────────────────────────────────────────────────────────
  PM000006: [
    { Node: 'Parent',   Acno: 'DM-8',   Name: 'Late Mr. M. A. Hashem',        Relation: 'Father',     Code: 'PM000001', img: '' },
    { Node: 'Parent',   Acno: 'PS-295', Name: 'Mrs. Sultana Hashem',          Relation: 'Mother',     Code: 'PM000016', img: '' },
    { Node: 'Siblings', Acno: 'PA-41',  Name: 'Mr. Aziz Al-Kaiser',           Relation: 'Brother',    Code: 'PM000002', img: '' },
    { Node: 'Siblings', Acno: 'PA-74',  Name: 'Mr. Aziz Al Mahmood',          Relation: 'Brother',    Code: 'PM000003', img: '' },
    { Node: 'Siblings', Acno: 'PA-83',  Name: 'Mr. Aziz Al-Masud',            Relation: 'Brother',    Code: 'PM000004', img: '' },
    { Node: 'Siblings', Acno: 'DR-7',   Name: 'Mr. Rubel Aziz',               Relation: 'Brother',    Code: 'PM000005', img: '' },
    { Node: 'Spouse',   Acno: 'PF-25',  Name: 'Mrs. Farahnaz Chowdhury',      Relation: 'Wife',       Code: 'PM000008', img: '' },
    { Node: 'A4D',      Acno: 'PS-356', Name: 'Barrister Sumaiya Binta Aziz', Relation: 'Wife',       Code: 'PM000020', img: '' },
    { Node: 'A4D',      Acno: 'PA-244', Name: 'Mr. Anaf Aziz',                Relation: 'Son',        Code: 'PM000028', img: '' },
    { Node: 'A4D',      Acno: 'PS-412', Name: 'Ms. Sinem Aziz',               Relation: 'Daughter',   Code: 'PM000029', img: '' },
    { Node: 'Children', Acno: 'PA-244', Name: 'Mr. Anaf Aziz',                Relation: 'Son',        Code: 'PM000028', img: '' },
    { Node: 'Children', Acno: 'PS-412', Name: 'Ms. Sinem Aziz',               Relation: 'Daughter',   Code: 'PM000029', img: '' },
  ],

  // ── LM-11 (PM000009) ─────────────────────────────────────────────────────────
  PM000009: [
    { Node: 'Spouse',   Acno: 'LS-8',   Name: 'Sultana Shaheda Islam',        Relation: 'Wife',           Code: 'PM000010', img: '' },
    { Node: 'Children', Acno: 'PT-7',   Name: 'Tahmina Rehman',               Relation: 'Daughter',       Code: 'PM000011', img: '' },
    { Node: 'Children', Acno: 'PW-6',   Name: 'Late Wasim Sajjad',            Relation: 'Son',            Code: 'PM000012', img: '' },
    { Node: 'A4D',      Acno: 'AFD-0444',Name: 'Ayyaz Sajjad',               Relation: 'Son of PW-6',    Code: 'PM000035', img: '' },
    { Node: 'A4D',      Acno: 'AFD-0529',Name: 'Daneen Arif',                Relation: 'Daughter of PW-6',Code:'PM000039',img: '' },
    { Node: 'Transfer', Acno: 'LS-35',  Name: 'Syed Abubakar Siddique',      Relation: 'Transfer to',    Code: 'PM000015', img: '' },
  ],

  // ── LS-8 (PM000010) ──────────────────────────────────────────────────────────
  PM000010: [
    { Node: 'Spouse',   Acno: 'LM-11',  Name: 'Md. Saiful Islam',             Relation: 'Husband',        Code: 'PM000009', img: '' },
    { Node: 'Children', Acno: 'PT-7',   Name: 'Tahmina Rehman',               Relation: 'Daughter',       Code: 'PM000011', img: '' },
    { Node: 'Children', Acno: 'PW-6',   Name: 'Late Wasim Sajjad',            Relation: 'Son',            Code: 'PM000012', img: '' },
    { Node: 'A4D',      Acno: 'AFD-0443',Name: 'Areesh Sajjad',              Relation: 'Daughter of PW-6',Code:'PM000036',img: '' },
    { Node: 'A4D',      Acno: 'AFD-0529',Name: 'Daneen Arif',                Relation: 'Daughter',        Code: 'PM000039', img: '' },
    { Node: 'A4D',      Acno: 'PS-338', Name: 'Shareef Omar Hamid Chowdhury', Relation: 'Son of PO-10',   Code: 'PM000034', img: '' },
  ],

  // ── PT-7 (PM000011) ──────────────────────────────────────────────────────────
  PM000011: [
    { Node: 'Parent',   Acno: 'LM-11',  Name: 'Md. Saiful Islam',             Relation: 'Father',         Code: 'PM000009', img: '' },
    { Node: 'Parent',   Acno: 'LS-8',   Name: 'Sultana Shaheda Islam',        Relation: 'Mother',         Code: 'PM000010', img: '' },
    { Node: 'Siblings', Acno: 'PW-6',   Name: 'Late Wasim Sajjad',            Relation: 'Brother',        Code: 'PM000012', img: '' },
    { Node: 'Spouse',   Acno: 'PO-10',  Name: 'Omar Hamid Chowdhury',         Relation: 'Husband',        Code: 'PM000032', img: '' },
    { Node: 'A4D',      Acno: 'PO-10',  Name: 'Omar Hamid Chowdhury',         Relation: 'Husband',        Code: 'PM000032', img: '' },
    { Node: 'A4D',      Acno: 'PS-329', Name: 'Sanjana Chowdhury',            Relation: 'Daughter',       Code: 'PM000033', img: '' },
    { Node: 'Associate',Acno: 'AS-151', Name: 'Ahnaf Hamid Chowdhury',        Relation: 'Son of PO-10',   Code: 'PM000040', img: '' },
  ],

  // ── PW-6 (PM000012) ──────────────────────────────────────────────────────────
  PM000012: [
    { Node: 'Parent',   Acno: 'LM-11',  Name: 'Md. Saiful Islam',             Relation: 'Father',         Code: 'PM000009', img: '' },
    { Node: 'Parent',   Acno: 'LS-8',   Name: 'Sultana Shaheda Islam',        Relation: 'Mother',         Code: 'PM000010', img: '' },
    { Node: 'Siblings', Acno: 'PT-7',   Name: 'Tahmina Rehman',               Relation: 'Sister',         Code: 'PM000011', img: '' },
    { Node: 'Spouse',   Acno: 'PK-49',  Name: 'Kaniz Fatema',                 Relation: 'Wife',           Code: 'PM000013', img: '' },
    { Node: 'Children', Acno: 'AFD-0443',Name: 'Areesh Sajjad',              Relation: 'Daughter',        Code: 'PM000036', img: '' },
    { Node: 'Children', Acno: 'AFD-0444',Name: 'Ayyaz Sajjad',               Relation: 'Son',             Code: 'PM000035', img: '' },
  ],

  // ── PK-49 (PM000013) ─────────────────────────────────────────────────────────
  PM000013: [
    { Node: 'Parent',   Acno: '',        Name: 'Arzina Khanam',               Relation: 'Mother',         Code: NO_CODE,    img: '' },
    { Node: 'Spouse',   Acno: 'PW-6',   Name: 'Late Wasim Sajjad',            Relation: 'Husband',        Code: 'PM000012', img: '' },
    { Node: 'A4D',      Acno: 'AFD-0927',Name: 'Daniyah Fatema Sajjad',      Relation: 'Daughter',        Code: 'PM000037', img: '' },
    { Node: 'A4D',      Acno: 'AFD-0928',Name: 'Dameer Sajjad',              Relation: 'Son',             Code: 'PM000038', img: '' },
    { Node: 'Children', Acno: 'AFD-0927',Name: 'Daniyah Fatema Sajjad',      Relation: 'Daughter',        Code: 'PM000037', img: '' },
    { Node: 'Children', Acno: 'AFD-0928',Name: 'Dameer Sajjad',              Relation: 'Son',             Code: 'PM000038', img: '' },
  ],

  // ── LS-35 (PM000015) ─────────────────────────────────────────────────────────
  PM000015: [
    { Node: 'Parent',   Acno: '',        Name: 'Alhaj S.A. Khaleque Ex M.P', Relation: 'Father',          Code: NO_CODE,    img: '' },
    { Node: 'Parent',   Acno: '',        Name: 'Nawshad Begum',              Relation: 'Mother',           Code: NO_CODE,    img: '' },
    { Node: 'Associate',Acno: 'AS-157', Name: 'Syed Erfan Siddique',         Relation: 'Son',             Code: 'PM000041', img: '' },
  ],

  // ── PA-79 (PM000070) — full set, every node kind ─────────────────────────────
  PM000070: [
    { Node: 'Parent',   Acno: 'DK-13',  Name: 'Late Al-Haj M.A. Latif',      Relation: 'Father',          Code: 'DM000005', img: 'http://118.179.152.53/myWeb01/Images/068/Member/DK-13.JPG'  },
    { Node: 'Parent',   Acno: 'PZ-20',  Name: 'Anisa Dewan',                 Relation: 'Mother',          Code: 'PM000049', img: 'http://118.179.152.53/myWeb01/Images/068/Member/PZ-20.JPG'   },
    { Node: 'Spouse',   Acno: 'PS-548', Name: 'Sabina Alam',                 Relation: 'Spouse',          Code: 'PM002430', img: 'http://118.179.152.53/myWeb01/Images/068/Member/PS-548.JPG'  },
    { Node: 'Siblings', Acno: 'DK-14',  Name: 'Khurshida Ahmed',             Relation: 'Sister',          Code: 'DM000006', img: 'http://118.179.152.53/myWeb01/Images/068/Member/DK-14.JPG'  },
    { Node: 'Siblings', Acno: 'PA-77',  Name: 'Anowar Rashid',               Relation: 'Brother',         Code: 'PM000068', img: 'http://118.179.152.53/myWeb01/Images/068/Member/PA-77.JPG'   },
    { Node: 'Children', Acno: 'PE-5',   Name: 'Ehsan Khan',                  Relation: 'Son',             Code: 'PM000062', img: 'http://118.179.152.53/myWeb01/Images/068/Member/PE-5.JPG'    },
    { Node: 'Children', Acno: 'PS-125', Name: 'Sehelley Shafi',              Relation: 'Daughter',        Code: 'PM000057', img: 'http://118.179.152.53/myWeb01/Images/068/Member/PS-125.JPG'  },
    { Node: 'Children', Acno: 'PS-126', Name: 'Sehelley Shafi',              Relation: 'Daughter',        Code: 'PM000057', img: 'http://118.179.152.53/myWeb01/Images/068/Member/PS-125.JPG'  },
    { Node: 'Children', Acno: 'PS-127', Name: 'Sehelley Shafi',              Relation: 'Daughter',        Code: 'PM000057', img: 'http://118.179.152.53/myWeb01/Images/068/Member/PS-125.JPG'  },
    { Node: 'Children', Acno: 'PS-128', Name: 'Sehelley Shafi',              Relation: 'Daughter',        Code: 'PM000057', img: 'http://118.179.152.53/myWeb01/Images/068/Member/PS-125.JPG'  },
    { Node: 'A4D',      Acno: 'PS-193', Name: 'Sambrene Dia Alam',           Relation: 'Daughter',        Code: 'PM001488', img: 'http://118.179.152.53/myWeb01/Images/068/Member/PS-193.JPG'  },
    { Node: 'A4D',      Acno: 'PS-310', Name: 'Mrs. Sharlene Nisha Alam',    Relation: 'Daughter',        Code: 'PM000185', img: 'http://118.179.152.53/myWeb01/Images/068/Member/PS-310.JPG'  },
    { Node: 'Associate',Acno: 'PM-228', Name: 'Mohammad Shabab Zaman',       Relation: 'Associate-01',    Code: 'PM000051', img: 'http://118.179.152.53/myWeb01/Images/068/Member/PM-228.JPG'  },
    { Node: 'Associate',Acno: 'PM-229', Name: 'Mohammad Shabab Zaman',       Relation: 'Associate-01',    Code: 'PM000052', img: 'http://118.179.152.53/myWeb01/Images/068/Member/PM-228.JPG'  },
    { Node: 'Transfer', Acno: 'PS-91',  Name: 'Subir Kumar Dey',             Relation: 'Transfer from',   Code: 'PM000081', img: 'http://118.179.152.53/myWeb01/Images/068/Member/PS-91.JPG'   },
  ],


  // ── PG-3 (PM000080) — no Parents, no Transfer ────────────────────────────────
  // FIX 4: PG-3 এর tree data যোগ করা হয়েছে (আগে missing ছিল)
  PM000080: [
    
    { Node: 'Spouse',   Acno: 'PN-116', Name: 'Nilufar Rabbani',              Relation: 'Wife',           Code: 'PM001234', img: 'http://118.179.152.53/myWeb01/Images/068/Member/PN-116.JPG' },
    { Node: 'Children', Acno: 'PG-16',  Name: 'Gazi Razya Rabbani',           Relation: 'Son',            Code: 'PM001235', img: 'http://118.179.152.53/myWeb01/Images/068/Member/PG-16.JPG'  },
    { Node: 'Children', Acno: 'PG-15',  Name: 'Gazi Nashek Rabbani',          Relation: 'Son',            Code: 'PM001236', img: 'http://118.179.152.53/myWeb01/Images/068/Member/PG-15.JPG'  },
    // FIX 5: A4D আর Children আলাদা মানুষ
    { Node: 'A4D',      Acno: 'PN-116', Name: 'Nilufar Rabbani',              Relation: 'Wife',           Code: 'PM001234', img: 'http://118.179.152.53/myWeb01/Images/068/Member/PN-116.JPG' },
    { Node: 'A4D',      Acno: 'PG-20',  Name: 'Gazi Tanvir Rabbani',          Relation: 'Nephew',         Code: 'PM001237', img: 'http://118.179.152.53/myWeb01/Images/068/Member/PG-20.JPG'  },
    { Node: 'Associate',Acno: 'AN-55',  Name: 'Karim Uddin',                  Relation: 'Associate-01',   Code: 'AM000055', img: 'http://118.179.152.53/myWeb01/Images/068/Member/AN-55.JPG'  },
  ],

  // ── DK-13 (DM000005) — Deceased, Parent Acno empty, Transfer ─────────────────
  // FIX 6: PA-79 siblings থেকে সরানো হয়েছে (PA-79 is DK-13's child, not sibling)
  //        PA-79 কে Children এ যোগ করা হয়েছে
  DM000005: [
    { Node: 'Parent',   Acno: '',        Name: 'Al-Haj Abdul Latif',          Relation: 'Father',         Code: NO_CODE,    img: '' },
    { Node: 'Parent',   Acno: '',        Name: 'Amena Khatun',                Relation: 'Mother',         Code: NO_CODE,    img: '' },
    { Node: 'Spouse',   Acno: 'PS-222', Name: 'Fatema Zaman',                 Relation: 'Wife',           Code: 'PM001101', img: 'http://118.179.152.53/myWeb01/Images/068/Member/PS-222.JPG'  },
    { Node: 'Siblings', Acno: 'PZ-20',  Name: 'Anisa Dewan',                 Relation: 'Sister',         Code: 'PM000049', img: 'http://118.179.152.53/myWeb01/Images/068/Member/PZ-20.JPG'   },
    { Node: 'Siblings', Acno: 'DK-14',  Name: 'Khurshida Ahmed',             Relation: 'Sister',         Code: 'DM000006', img: 'http://118.179.152.53/myWeb01/Images/068/Member/DK-14.JPG'  },
    { Node: 'Children', Acno: 'PA-79',  Name: 'Abu M. Shahidul Alam (Majjad)',Relation: 'Son',           Code: 'PM000070', img: 'http://118.179.152.53/myWeb01/Images/068/Member/PA-79.JPG'   },
    { Node: 'Children', Acno: 'PA-305', Name: 'Anika Zaman Bushra',           Relation: 'Daughter',       Code: 'PM002201', img: 'http://118.179.152.53/myWeb01/Images/068/Member/PA-305.JPG' },
    { Node: 'Children', Acno: 'PS-488', Name: 'Shabab Md. Zaman',             Relation: 'Son',            Code: 'PM002202', img: 'http://118.179.152.53/myWeb01/Images/068/Member/PS-488.JPG' },
    { Node: 'A4D',      Acno: 'PA-306', Name: 'Arif Zaman',                   Relation: 'Son',            Code: 'PM002203', img: 'http://118.179.152.53/myWeb01/Images/068/Member/PA-306.JPG' },
    { Node: 'Transfer', Acno: 'DK-15',  Name: 'Kazi Showeb Rashid',           Relation: 'Transfer from',  Code: 'DM000007', img: 'http://118.179.152.53/myWeb01/Images/068/Member/DK-15.JPG'  },
  ],

  // ── PS-45 (PM000042) — Father only, multiple Associate ───────────────────────
  // FIX 7: A4D আর Children এখন আলাদা মানুষ
  PM000042: [
    { Node: 'Parent',   Acno: 'PM-300', Name: 'Fazlur Rahman Sr.',             Relation: 'Father',         Code: 'PM000300', img: 'http://118.179.152.53/myWeb01/Images/068/Member/PM-300.JPG'  },
    // { Node: 'Parent',   Acno: 'PM-301', Name: 'Fazlur Rahman Sr.',             Relation: 'Mother',         Code: 'PM000300', img: 'http://118.179.152.53/myWeb01/Images/068/Member/PM-300.JPG'  },
    { Node: 'Spouse',   Acno: 'UPMS-81',Name: 'Syeda Rubaba Rahman',           Relation: 'Wife',           Code: 'PM002431', img: 'http://118.179.152.53/myWeb01/Images/068/Member/UPMS-81.JPG' },
    { Node: 'Children', Acno: 'PS-215', Name: 'Shayan F Rahman',               Relation: 'Son',            Code: 'PM001501', img: 'http://118.179.152.53/myWeb01/Images/068/Member/PS-215.JPG'  },
    { Node: 'Children', Acno: 'PS-216', Name: 'Shazreh Rahman',                Relation: 'Daughter',       Code: 'PM001502', img: 'http://118.179.152.53/myWeb01/Images/068/Member/PS-216.JPG'  },
    // A4D = quota member (bio children নয়)
    { Node: 'A4D',      Acno: 'UPMS-81',Name: 'Syeda Rubaba Rahman',           Relation: 'Wife',           Code: 'PM002431', img: 'http://118.179.152.53/myWeb01/Images/068/Member/UPMS-81.JPG' },
    { Node: 'A4D',      Acno: 'PS-217', Name: 'Tashfin Rahman',                Relation: 'Nephew',         Code: 'PM001503', img: 'http://118.179.152.53/myWeb01/Images/068/Member/PS-217.JPG'  },
    { Node: 'Associate',Acno: 'AN-101', Name: 'Kamal Hossain',                 Relation: 'Associate-01',   Code: 'AM000101', img: 'http://118.179.152.53/myWeb01/Images/068/Member/AN-101.JPG'  },
    { Node: 'Associate',Acno: 'AN-102', Name: 'Rina Begum',                    Relation: 'Associate-02',   Code: 'AM000102', img: 'http://118.179.152.53/myWeb01/Images/068/Member/AN-102.JPG'  },
    
  ],

  // ── PG-5 (PM000027) — Female, no Spouse, no Transfer ────────────────────────
  // FIX 8: A4D আর Children আলাদা মানুষ
  PM000027: [
    { Node: 'Parent',   Acno: 'LC-10',  Name: 'Abdul Karim Chowdhury',         Relation: 'Father',         Code: 'LM000010', img: 'http://118.179.152.53/myWeb01/Images/068/Member/LC-10.JPG'  },
    { Node: 'Parent',   Acno: 'LF-10',  Name: 'Rahima Chowdhury',              Relation: 'Mother',         Code: 'LF000010', img: 'http://118.179.152.53/myWeb01/Images/068/Member/LF-10.JPG'  },
    { Node: 'Siblings', Acno: 'PG-6',   Name: 'Ghulam Mohammed Alomgir',       Relation: 'Brother',        Code: 'PM000028', img: 'http://118.179.152.53/myWeb01/Images/068/Member/PG-6.JPG'   },
    { Node: 'Children', Acno: 'PA-136', Name: 'Ashna Chowdhury',               Relation: 'Daughter',       Code: 'PM001301', img: 'http://118.179.152.53/myWeb01/Images/068/Member/PA-136.JPG' },
    { Node: 'Children', Acno: 'PM-268', Name: 'Mehran Hussain Chowdhury',      Relation: 'Son',            Code: 'PM001302', img: 'http://118.179.152.53/myWeb01/Images/068/Member/PM-268.JPG' },
    // A4D = quota member (sibling এর children — bio children নয়)
    { Node: 'A4D',      Acno: 'PA-165', Name: 'Azrin Alom',                    Relation: 'Niece of PG-6',  Code: 'PM001303', img: 'http://118.179.152.53/myWeb01/Images/068/Member/PA-165.JPG' },
    { Node: 'A4D',      Acno: 'PM-296', Name: 'Mohammed Zulkernine',           Relation: 'Nephew of PG-6', Code: 'PM001304', img: 'http://118.179.152.53/myWeb01/Images/068/Member/PM-296.JPG' },
  ],
};