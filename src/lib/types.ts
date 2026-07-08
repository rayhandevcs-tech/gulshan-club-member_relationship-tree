
export type Via = 'core' | 'a4d' | 'associate' | 'succession';

export type Rel = 'spouse' | 'child' | 'grandchild' | 'other';

export interface Member {
  id: string;                 // A/C no — prefix drives type: P→Permanent, AFD→A4D, D→Donor, L→Life
  name: string;
  type?: string | null;       // optional explicit override; normally derived from id prefix
  via: Via;                   // core = own membership | a4d / associate = via someone's quota | succession = inherited an existing A/C via transfer
  gender?: 'M' | 'F' | null;
  since?: string | null;
  pid: string | null;         // partner (spouse) or quota holder / tree parent
  rel: Rel | null;            // pure relationship — never encodes dependency (via does that)
  fatherId?: string | null;   // blood parents — reference text + bioMode only
  motherId?: string | null;
  succession?: string | null; // account transferred to this member id
  photoUrl?: string | null;
  note?: string | null;
  // ── optional profile fields used by panels/search ──
  phone?: string | null;
  phoneRes?: string | null;
  phoneOff?: string | null;
  email?: string | null;
  birthDate?: string | null;
  memberId?: string | null;
  membershipRef?: string | null;
  quotaNote?: string | null;
  fatherName?: string | null; // display-only names when the parent
  motherName?: string | null; // has no record in the dataset
  father?: string | null;
  mother?: string | null;
}