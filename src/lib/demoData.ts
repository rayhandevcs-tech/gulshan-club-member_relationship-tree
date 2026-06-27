import { Member } from './types';

export const demoMembers: Member[] = [
  {
    id: 'LM-11', name: 'Md. Saiful Islam', type: 'Life', gender: 'M',
    memberId: 'LM000066',
    since: '28/10/1985',
    phone: '+8801711538657',
    email: 'islam1944bd@gmail.com',
    birthDate: '20/06/1944',
    pid: null, rel: null,
    membershipRef: 'Linked to LS-35 (Article 6C & 10B)',
    fatherName: 'Ahafiqur Rahman',
  },

  {
    id: 'LS-8', name: 'Sultana Shaheda Islam', type: 'Life', gender: 'F',
    memberId: 'LM000079',
    since: '28/10/1985',
    phone: '+8801819213808',
    email: 'ssbdl@agni.com',
    birthDate: '21/02/1947',
    pid: 'LM-11', rel: 'spouse',
    fatherName: 'Md. Serajul Islam',
  },

  {
    id: 'PT-7', name: 'Tahmina Rehman', type: 'Permanent', gender: 'F',
    memberId: 'PM001564',
    since: '12/12/1995',
    phone: '+8801713012475',
    email: 'tahminar67@gmail.com',
    birthDate: '18/09/1967',
    pid: 'LM-11', rel: 'child',
    fatherId: 'LM-11', motherId: 'LS-8',
  },

  {
    id: 'PW-6', name: 'Late Wasim Sajjad', type: 'Permanent', gender: 'M',
    memberId: 'PM001507',
    since: '15/10/2001',
    phone: '+8801711595459',
    email: 'wali@utahgroup.net',
    birthDate: '28/02/1971',
    pid: 'LM-11', rel: 'child',
    fatherId: 'LM-11', motherId: 'LS-8',
  },

  {
    id: 'PO-10', name: 'Omar Hamid Chowdhury', type: 'Permanent', gender: 'M',
    memberId: 'PM000288',
    since: '04/03/2018',
    phone: '+8801711593144',
    email: 'omar.dhaka@gmail.com',
    birthDate: '10/10/1969',
    pid: 'PT-7', rel: 'spouse',
    fatherName: 'Abdul Hamid Chowdhury',
    motherName: 'Dureshar Ponok Chowdhury',
  },

  {
    id: 'PS-329', name: 'Sanjana Chowdhury', type: 'Permanent', gender: 'F',
    memberId: 'PM001571',
    since: '17/09/2018',
    email: 'transaction.gcl@gmail.com',
    birthDate: '11/03/1997',
    pid: 'PT-7', rel: 'a4d',
    fatherId: 'PO-10', motherId: 'PT-7',
  },

  {
    id: 'PS-338', name: 'Shareef Omar Hamid Chowdhury', type: 'Permanent', gender: 'M',
    memberId: 'PM001341',
    since: '17/09/2018',
    phone: '+8801711593144',
    email: 'shareef.arsenal95@gmail.com',
    birthDate: '25/08/1995',
    pid: 'LS-8', rel: 'a4d',
    fatherId: 'PO-10', motherId: 'PT-7',
  },

  {
    id: 'PK-49', name: 'Kaniz Fatema', type: 'Permanent', gender: 'F',
    memberId: 'PM000436',
    since: '28/09/2016',
    phone: '+88029843422',
    email: 'kanizfsajjad@gmail.com',
    birthDate: '13/11/1973',
    pid: 'PW-6', rel: 'spouse',
    motherName: 'Arzina Khanam',
  },

  { id: 'AFD-0443', name: 'Areesh Sajjad',         type: 'A4D', gender: 'F', since: '01/05/2020', pid: 'LM-11', rel: 'a4d', fatherId: 'PW-6', motherId: 'PK-49' },
  { id: 'AFD-0444', name: 'Ayyaz Sajjad',          type: 'A4D', gender: 'M', since: '01/05/2020', pid: 'LM-11', rel: 'a4d', fatherId: 'PW-6', motherId: 'PK-49' },
  { id: 'AFD-0927', name: 'Daniyah Fatema Sajjad', type: 'A4D', gender: 'F', since: '01/05/2020', pid: 'PK-49', rel: 'a4d', fatherId: 'PW-6', motherId: 'PK-49' },
  { id: 'AFD-0928', name: 'Dameer Sajjad',         type: 'A4D', gender: 'M', since: '01/05/2020', pid: 'PK-49', rel: 'a4d', fatherId: 'PW-6', motherId: 'PK-49' },
  { id: 'AFD-0529', name: 'Daneen Arif',           type: 'A4D', gender: 'F', since: '15/09/2022', pid: 'LS-8',  rel: 'a4d' },
];
