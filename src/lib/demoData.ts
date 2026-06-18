import { Member } from './types';

export const demoMembers: Member[] = [
  // Donor পরিবার
  { id:'DA-1',      name:'Alhaj Karim Uddin',     type:'Donor',     since:'12/03/1998', email:'karim@example.com',  phone:'01711000001', pid:null,    rel:null,        father:'Late Abdul Karim', mother:'Late Fatema Begum', note:'Founder Member' },
  { id:'DA-1-SP',   name:'Hasina Karim',           type:'Permanent', since:'01/01/2000', email:'hasina@example.com', phone:'01711000002', pid:'DA-1',  rel:'spouse', father:'Late Abdur Rahman', mother:'Begum Sufia Rahman' },
  { id:'DA-1-S1',   name:'Rashed Karim',           type:'A4D',       since:'15/06/2010', email:'rashed@example.com', phone:'01711000003', pid:'DA-1',  rel:'a4d',       father:'Alhaj Karim Uddin', mother:'Hasina Karim', note:'A4D · Son' },
  { id:'DA-1-S2',   name:'Nadia Karim',            type:'A4D',       since:'15/06/2010', email:'nadia@example.com',  phone:'01711000004', pid:'DA-1',  rel:'a4d',       father:'Alhaj Karim Uddin', mother:'Hasina Karim', note:'A4D · Daughter' },
  { id:'DA-1-S1A1', name:'Arif Rashed',            type:'Associate', since:'10/01/2022', pid:'DA-1-S1', rel:'associate' },
  { id:'DA-1-S1A2', name:'Mim Rashed',             type:'Associate', since:'10/01/2022', pid:'DA-1-S1', rel:'associate' },
  { id:'DA-1-S2A1', name:'Sara Nadia',             type:'Associate', since:'20/03/2023', pid:'DA-1-S2', rel:'associate' },
  { id:'DA-1-S2A2', name:'Zara Nadia',             type:'Associate', since:'20/03/2023', pid:'DA-1-S2', rel:'associate' },

  // Life পরিবার
  { id:'LM-5',      name:'Prof. Aminul Islam',     type:'Life',      since:'22/06/2005', email:'aminul@example.com', phone:'01811000005', pid:null,    rel:null,        father:'Late Islam Saheb', mother:'Rahela Begum' },
  { id:'LM-5-SP',   name:'Dr. Rehana Islam',       type:'Life',      since:'01/07/2006', email:'rehana@example.com', phone:'01811000006', pid:'LM-5',  rel:'spouse', father:'Late Mokbul Hossain', mother:'Sufia Hossain' },
  { id:'LM-5-C1',   name:'Farhan Islam',           type:'A4D',       since:'10/10/2018', email:'farhan@example.com', pid:'LM-5',  rel:'a4d', father:'Prof. Aminul Islam', mother:'Dr. Rehana Islam' },
  { id:'LM-5-C2',   name:'Fariha Islam',           type:'A4D',       since:'10/10/2018', email:'fariha@example.com', pid:'LM-5',  rel:'a4d', father:'Prof. Aminul Islam', mother:'Dr. Rehana Islam' },
  { id:'LM-5-C1A1', name:'Rafi Farhan',            type:'Associate', since:'01/06/2023', pid:'LM-5-C1', rel:'associate' },
  { id:'LM-5-C2A1', name:'Rima Fariha',            type:'Associate', since:'01/06/2023', pid:'LM-5-C2', rel:'associate' },

  // Permanent — Abid Khan (ছবির PA-1)
  { id:'PA-1',      name:'Abid Mohammad Khan',     type:'Permanent', since:'01/01/2008', email:'abid@example.com',   phone:'01911000010', pid:null,    rel:null,        father:'Late Zafar Khan',  mother:'Late Qamar Khan' },
  { id:'PA-1-SP',   name:'Huma Khan',              type:'Permanent', since:'15/02/2009', email:'huma@example.com',   phone:'01911000011', pid:'PA-1',  rel:'spouse', father:'Late Aktar Hamid', mother:'Roksana Hamid' },
  { id:'PI-52',     name:'Iman Khan',              type:'A4D',       since:'20/05/2015', email:'iman@example.com',   pid:'PA-1',  rel:'a4d',       father:'Abid Mohammad Khan', mother:'Huma Khan', note:'A4D · Daughter' },
  { id:'PM-489',    name:'Md. Musa Khan',          type:'A4D',       since:'20/05/2015', email:'musa@example.com',   pid:'PA-1',  rel:'a4d',       father:'Abid Mohammad Khan', mother:'Huma Khan', note:'A4D · Son' },
  { id:'PI-52-A1',  name:'Aisha Iman',             type:'Associate', since:'11/11/2022', pid:'PI-52',    rel:'associate' },
  { id:'PI-52-A2',  name:'Bisma Iman',             type:'Associate', since:'11/11/2022', pid:'PI-52',    rel:'associate' },
  { id:'PM-489-A1', name:'Omar Musa',              type:'Associate', since:'05/03/2023', pid:'PM-489',   rel:'associate' },
  { id:'PM-489-A2', name:'Yusuf Musa',             type:'Associate', since:'05/03/2023', pid:'PM-489',   rel:'associate' },

  // Permanent — Hanif Shoeb
  { id:'PC-5',      name:'C.M. Hanif Shoeb',       type:'Permanent', since:'19/07/2016', email:'bsbspintex@salmagroup.com.bd', phone:'01711533211', pid:null, rel:null, father:'Late C.M. Abdul Shoeb', mother:'Begum Rahima Shoeb' },
  { id:'PC-5-SP',   name:'Rita Chowdhury',         type:'Permanent', since:'03/04/2018', pid:'PC-5',  rel:'spouse', father:'Late Suresh Chowdhury', mother:'Lata Chowdhury' },
  { id:'PH-52',     name:'Humaira Chowdhury',      type:'A4D',       since:'07/03/2022', pid:'PC-5',  rel:'a4d', father:'C.M. Hanif Shoeb', mother:'Rita Chowdhury' },
  { id:'PH-52-A1',  name:'Zara Humaira',           type:'Associate', since:'01/01/2024', pid:'PH-52', rel:'associate' },

  // Permanent — Amal Podder
  { id:'PA-133',    name:'Amal Podder',            type:'Permanent', since:'25/02/2016', email:'amal.podder@metrokd.com', phone:'01711533742', pid:null, rel:null, father:'Late Ashutosh Podder', mother:'Renu Podder' },
  { id:'PA-133-SP', name:'Mrs. Podder',            type:'Permanent', since:'25/02/2016', pid:'PA-133', rel:'spouse', father:'Late Binoy Sen', mother:'Anjali Sen' },
  { id:'PA-238',    name:'Abir Podder',            type:'A4D',       since:'17/09/2018', pid:'PA-133', rel:'a4d', father:'Amal Podder', mother:'Mrs. Podder' },
  { id:'PA-245',    name:'Anik Podder',            type:'A4D',       since:'17/09/2018', pid:'PA-133', rel:'a4d', father:'Amal Podder', mother:'Mrs. Podder' },
  { id:'PA-238-A1', name:'Ritu Abir',              type:'Associate', since:'10/05/2023', pid:'PA-238', rel:'associate' },
  { id:'PA-245-A1', name:'Titu Anik',              type:'Associate', since:'10/05/2023', pid:'PA-245', rel:'associate' },

  // Monirul Hoque
  { id:'PA-132',    name:'AKM Monirul Hoque',      type:'Permanent', since:'01/01/2015', email:'monirul@example.com', phone:'01712345678', pid:null, rel:null, father:'Late AKM Aminul Hoque', mother:'Late Rabeya Hoque' },
  { id:'PA-132-SP', name:'Naeema Hoque',           type:'Permanent', since:'01/01/2015', pid:'PA-132', rel:'spouse', father:'Late Abdul Mannan', mother:'Hosne Ara Begum' },
  { id:'PS-149',    name:'Salwa Tabassum Hoque',   type:'A4D',       since:'01/01/2019', pid:'PA-132', rel:'a4d', father:'AKM Monirul Hoque', mother:'Naeema Hoque' },
  { id:'PW-18',     name:'Wasfia Tabassum Hoque',  type:'A4D',       since:'01/01/2019', pid:'PA-132', rel:'a4d', father:'AKM Monirul Hoque', mother:'Naeema Hoque' },
  { id:'PS-149-A1', name:'Assoc. Salwa-1',         type:'Associate', since:'01/06/2023', pid:'PS-149', rel:'associate' },
  { id:'PS-149-A2', name:'Assoc. Salwa-2',         type:'Associate', since:'01/06/2023', pid:'PS-149', rel:'associate' },
  { id:'PW-18-A1',  name:'Assoc. Wasfia-1',        type:'Associate', since:'01/06/2023', pid:'PW-18',  rel:'associate' },
  { id:'PW-18-A2',  name:'Assoc. Wasfia-2',        type:'Associate', since:'01/06/2023', pid:'PW-18',  rel:'associate' },

  // Senior
  { id:'PS-10',     name:'Akhter Hossain',         type:'Senior',    since:'05/05/2003', email:'akhter@example.com', phone:'01611000020', pid:null, rel:null, father:'Late Mojibor Hossain', mother:'Amena Hossain', note:'Permanent to Senior (2018)' },

  // Corporate
  { id:'CC-1',      name:'Salma Group Ltd.',        type:'Corporate', since:'01/01/2015', email:'info@salmagroup.com.bd', phone:'028800001', pid:null, rel:null, note:'Paid-up capital: 10 Crore+' },
  { id:'CC-1-N1',   name:'Mr. Salim (CEO)',         type:'Associate', since:'01/01/2015', email:'salim@salma.com', pid:'CC-1', rel:'nominee' },
  { id:'CC-1-N2',   name:'Mr. Kamal (MD)',          type:'Associate', since:'01/01/2015', email:'kamal@salma.com', pid:'CC-1', rel:'nominee' },
  { id:'CC-1-N3',   name:'Ms. Rima (Dir.)',         type:'Associate', since:'01/01/2015', email:'rima@salma.com',  pid:'CC-1', rel:'nominee' },

  // Saiful Islam family — multi-generation A4D quota sourcing example.
  // LM-11 & LS-8 are both core members in their own right (2 A4D slots
  // each). Their children PT-7 & PW-6 are themselves core members with
  // their own quota, not A4D dependents — so a4d-quota-sourcing can skip
  // a generation when a member's own slots run out or are voided by death.
  { id:'LM-11',     name:'Md. Saiful Islam',        type:'Life', gender:'M', since:'10/03/1995', email:'saiful@example.com', phone:'01711100011', pid:null, rel:null, membershipRef:'Linked to LS-35 (Article 6C & 10B)' },
  { id:'LS-8',      name:'Sultana Shaheda Islam',   type:'Life', gender:'F', since:'10/03/1995', email:'shaheda@example.com', pid:'LM-11', rel:'spouse' },

  { id:'PT-7',      name:'Tahmina Rehman',          type:'Permanent', gender:'F', since:'05/06/2015', pid:'LM-11', rel:'child', fatherId:'LM-11', motherId:'LS-8' },
  { id:'PW-6',      name:'Late Wasim Sajjad',       type:'Permanent', gender:'M', since:'05/06/2015', pid:'LM-11', rel:'child', fatherId:'LM-11', motherId:'LS-8', note:'A4D quota voided on death — children\'s slots sourced from grandfather LM-11 instead' },

  { id:'PO-10',     name:'Omar Hamid Chowdhury',    type:'A4D', gender:'M', since:'20/01/2017', pid:'PT-7', rel:'spouse', quotaNote:'Admitted as A4D via spouse Tahmina\'s (PT-7) own quota — 1 of 2 slots' },
  { id:'PS-329',    name:'Sanjana Chowdhury',       type:'A4D', gender:'F', since:'14/02/2019', pid:'PT-7', rel:'a4d', fatherId:'PO-10', motherId:'PT-7', quotaNote:'2 of 2 slots from Tahmina\'s (PT-7) own quota' },
  { id:'PS-338',    name:'Shareef Omar Hamid Chowdhury', type:'A4D', gender:'M', since:'03/11/2021', pid:'LS-8', rel:'a4d', fatherId:'PO-10', motherId:'PT-7', quotaNote:'Mother\'s (PT-7) own quota already used by spouse + daughter — this slot sourced from grandmother LS-8\'s quota instead' },

  { id:'PK-49',     name:'Kaniz Fatema',            type:'Permanent', gender:'F', since:'12/08/2016', pid:'PW-6', rel:'spouse', succession:'Assumed core membership position from late spouse PW-6, per Article 6(c)' },
  { id:'AFD-0927',  name:'Daniyah Fatema Sajjad',   type:'A4D', gender:'F', since:'01/05/2020', pid:'LM-11', rel:'a4d', fatherId:'PW-6', motherId:'PK-49', quotaNote:'Father (Late PW-6) deceased — own A4D quota voided; this slot sourced from grandfather LM-11\'s quota' },
  { id:'AFD-0928',  name:'Dameer Sajjad',           type:'A4D', gender:'M', since:'01/05/2020', pid:'LM-11', rel:'a4d', fatherId:'PW-6', motherId:'PK-49', quotaNote:'Father (Late PW-6) deceased — own A4D quota voided; this slot sourced from grandfather LM-11\'s quota' },

  { id:'AFD-0529',  name:'Daneen Arif',             type:'A4D', gender:'F', since:'15/09/2022', pid:'LS-8', rel:'a4d', fatherName:'LM-50', quotaNote:'2 of 2 slots from grandmother LS-8\'s quota — sponsoring an unrelated member\'s (LM-50) daughter, who is not otherwise detailed in this branch' },
];