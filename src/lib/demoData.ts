import { Member } from './types';

export const demoMembers: Member[] = [
  {
    id: 'LM-11', name: 'Md. Saiful Islam', type: 'Life', gender: 'M',
    since: '28/10/1985',
    phone: '+8801711538657',
    email: 'islam1944bd@gmail.com',
    pid: null, rel: null,
    succession: 'LS-35',
    membershipRef: 'Linked to LS-35 (Article 6C & 10B)',
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

];
