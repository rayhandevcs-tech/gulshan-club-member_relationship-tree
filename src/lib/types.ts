// types.ts — merge this Member interface into your existing @/lib/types

// access route — HOW the person holds club access. This is the placement
// switch: 'core' → full card in the tree; anything else → slot card.
export type Via = 'core' | 'a4d' | 'associate' | 'nominee';
// pid-এর সাথে সম্পর্ক: pid-এর নিজের spouse/child হলে সেটা; নাহলে 'other'
// (নাতি-নাতনি, ভাতিজা-ভাগ্নি, অন্য member-এর children...)। Reference লেখা
// আসে fatherId/motherId থেকে, তাই 'other' হলেও "Son of X" ঠিকই দেখায়।
export type Rel = 'spouse' | 'child' | 'other';

export interface Member {
  id: string;                 // A/C no — prefix drives type: P→Permanent, AFD→A4D, D→Donor, L→Life
  name: string;
  type?: string;              // optional explicit override; normally derived from id prefix
  via: Via;                   // core = own membership | a4d / associate / nominee = via someone's quota
  gender?: 'M' | 'F';
  since?: string;
  pid: string | null;         // partner (spouse) or quota holder / tree parent
  rel: Rel | null;            // pure relationship — never encodes dependency (via does that)
  fatherId?: string | null;   // blood parents — reference text + bioMode only
  motherId?: string | null;
  succession?: string;        // account transferred to this member id
  photoUrl?: string;
  note?: string;
  // ── optional profile fields used by panels/search ──
  phone?: string;
  phoneRes?: string;
  phoneOff?: string;
  email?: string;
  birthDate?: string;
  memberId?: string;
  membershipRef?: string;
  quotaNote?: string;
  fatherName?: string;        // display-only names when the parent
  motherName?: string;        // has no record in the dataset
  father?: string;
  mother?: string;
}