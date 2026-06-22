import { Member } from './types';

export const demoMembers: Member[] = [
  { id:'LM-11',    name:'Md. Saiful Islam',             type:'Life',      gender:'M', since:'10/03/1995', email:'saiful@example.com',   phone:'01711100011', pid:null,     rel:null,      membershipRef:'Linked to LS-35 (Article 6C & 10B)' },
  { id:'LS-8',     name:'Sultana Shaheda Islam',        type:'Life',      gender:'F', since:'10/03/1995', email:'shaheda@example.com',  pid:'LM-11', rel:'spouse' },

  { id:'PT-7',     name:'Tahmina Rehman',               type:'Permanent', gender:'F', since:'05/06/2015', pid:'LM-11', rel:'child',  fatherId:'LM-11', motherId:'LS-8' },
  { id:'PW-6',     name:'Late Wasim Sajjad',            type:'Permanent', gender:'M', since:'05/06/2015', pid:'LM-11', rel:'child',  fatherId:'LM-11', motherId:'LS-8' },

  { id:'PO-10',    name:'Omar Hamid Chowdhury',         type:'A4D',       gender:'M', since:'20/01/2017', pid:'PT-7',  rel:'spouse' },
  { id:'PS-329',   name:'Sanjana Chowdhury',            type:'A4D',       gender:'F', since:'14/02/2019', pid:'PT-7',  rel:'a4d',   fatherId:'PO-10', motherId:'PT-7' },
  { id:'PS-338',   name:'Shareef Omar Hamid Chowdhury', type:'A4D',       gender:'M', since:'03/11/2021', pid:'LS-8',  rel:'a4d',   fatherId:'PO-10', motherId:'PT-7' },

  { id:'PK-49',    name:'Kaniz Fatema',                 type:'Permanent', gender:'F', since:'12/08/2016', pid:'PW-6',  rel:'spouse' },
  { id:'AFD-0927', name:'Daniyah Fatema Sajjad',        type:'A4D',       gender:'F', since:'01/05/2020', pid:'LM-11', rel:'a4d',   fatherId:'PW-6', motherId:'PK-49' },
  { id:'AFD-0928', name:'Dameer Sajjad',                type:'A4D',       gender:'M', since:'01/05/2020', pid:'LM-11', rel:'a4d',   fatherId:'PW-6', motherId:'PK-49' },

  { id:'AFD-0529', name:'Daneen Arif',                  type:'A4D',       gender:'F', since:'15/09/2022', pid:'LS-8',  rel:'a4d',   fatherName:'LM-50' },
];
