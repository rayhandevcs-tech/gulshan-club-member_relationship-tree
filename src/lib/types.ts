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
  since: string;
  email?: string;
  phone?: string;
  pid: string | null;      // quota/structural parent — whose A4D slot this sits under in the tree
  rel: RelationType;       // relation to pid (spouse / a4d / associate / nominee)

  // True biological parentage — separate from pid, because the quota a
  // dependent is allocated under can differ from who actually had them
  // (e.g. a grandparent's quota covering a grandchild).
  fatherId?: string;       // if the father is also a Member in this system
  fatherName?: string;     // fallback free-text name if the father isn't a Member here
  motherId?: string;
  motherName?: string;

  // Legacy free-text fields (kept for older demo entries that haven't
  // been migrated to fatherId/fatherName yet).
  father?: string;
  mother?: string;

  quotaNote?: string;      // why this A4D slot came from a non-default source
  succession?: string;     // e.g. inherited a deceased spouse's core position, with article ref
  membershipRef?: string;  // historical id transfer/renumbering note, with article ref

  note?: string;
}