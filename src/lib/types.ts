
export type Via = 'core' | 'a4d' | 'associate' | 'succession';

export type Rel = 'spouse' | 'child' | 'grandchild' | 'sibling' | 'other';

// The raw "other nodes" shape the club's external API returns per core
// member (see src/lib/convertApiData.ts) — kept alongside the flattened
// pid/rel/fatherId/etc. fields below so the relationship diagrams can
// render directly off what the API actually said, instead of re-deriving
// it by scanning the whole flat Member[] array. 'Transfer' resolves to
// Member.succession (see convertApiData.ts) rather than its own field here.
export type NodeKind = 'Parent' | 'Spouse' | 'Siblings' | 'Children' | 'A4D' | 'Associate' | 'Transfer';

export interface RelationNode {
  node: NodeKind;
  acno: string;      // target member's id (Member.id)
  name: string;
  relation: string;  // raw relation text, e.g. "Father", "Wife", "Daughter of PA-74"
  photoUrl?: string | null;
}

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
  nodes?: RelationNode[];     // raw API "other nodes" for THIS member — only ever set on core members
  photoUrl?: string | null;
  note?: string | null;
  // ── optional profile fields used by panels/search ──
  phone?: string | null;
  email?: string | null;
  membershipRef?: string | null;
  quotaNote?: string | null;
  fatherName?: string | null; // display-only names when the parent
  motherName?: string | null; // has no record in the dataset
}