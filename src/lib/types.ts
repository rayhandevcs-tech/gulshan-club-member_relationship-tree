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
  | null;

export interface Member {
  id: string;
  name: string;
  type: MemberType;
  since: string;
  email?: string;
  phone?: string;
  pid: string | null;      // parent member id
  rel: RelationType;       // relation to parent
  father?: string;
  mother?: string;
  note?: string;
}