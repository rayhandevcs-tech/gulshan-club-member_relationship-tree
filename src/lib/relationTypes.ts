// A resolved relationship row: the target member's real record, plus the
// name/photo/relation text exactly as the source row that pointed at them
// spelled it (see displayMember in quotaTreeLayout for why those can differ).
//
// Lives in its own leaf module so both quotaTreeLayout and familyIndex can
// share the shape without importing each other.

import type { Member } from './types';

export interface ResolvedNode {
  member: Member;
  relation: string;
  name: string;
  photoUrl?: string | null;
}
