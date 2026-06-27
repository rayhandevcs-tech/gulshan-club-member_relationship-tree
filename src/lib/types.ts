export type MemberType =
  | 'Donor'
  | 'Life'
  | 'Permanent'
  | 'Senior'
  | 'Associate'
  | 'A4D'
  | 'Corporate'
  | 'Honorary'
  | 'Foreign';

export type RelationType =
  | 'spouse'
  | 'a4d'
  | 'associate'
  | 'nominee'
  | 'child'    // a descendant who is themselves a core member (their own A4D quota), not a dependent of the parent's quota
  | null;

export interface Member {
  id: string;
  name: string;
  type: MemberType;
  gender?: 'M' | 'F';
  since: string;            // membership date
  email?: string;
  phone?: string;           // mobile
  phoneRes?: string;        // residential phone
  phoneOff?: string;        // office phone
  pid: string | null;       // quota/structural parent — whose A4D slot this sits under in the tree
  rel: RelationType;        // relation to pid (spouse / a4d / associate / nominee)

  // True biological parentage — separate from pid
  fatherId?: string;
  fatherName?: string;
  motherId?: string;
  motherName?: string;

  // Legacy free-text fields
  father?: string;
  mother?: string;

  // Extended member profile fields
  memberId?: string;        // internal system ID (e.g. LM000066)
  slNo?: number;
  bloodGroup?: string;
  birthDate?: string;
  maritalStatus?: string;
  marriageDate?: string;
  religion?: string;
  nationality?: string;
  nationalId?: string;
  passport?: string;
  rfCard?: string;
  address?: string;
  creditLimit?: number;
  subscriptionFee?: number;
  voterStatus?: string;

  quotaNote?: string;
  succession?: string;
  membershipRef?: string;
  note?: string;
}