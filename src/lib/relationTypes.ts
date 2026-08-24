// A resolved relationship row: the target member's real record, plus the
// name/photo/relation text exactly as the source row that pointed at them
// spelled it (see displayMember in quotaTreeLayout for why those can differ).
//
// Lives in its own leaf module so both quotaTreeLayout and familyIndex can
// share the shape without importing each other.

import type { Member, NodeKind, RelationNode } from './types';

export interface ResolvedNode {
  member: Member;
  relation: string;
  name: string;
  // Which kind of row resolved to this member. The row is the authority on
  // what the relationship IS — a dependent who also holds a core account of
  // their own would otherwise be mislabelled from their own record.
  kind?: NodeKind;
  photoUrl?: string | null;
  // The row's own ChildNode list, when it had one: nodes belonging to THIS
  // member rather than to whoever's tree named them. Both diagrams render
  // them as attachments hanging off this card.
  inner?: RelationNode[];
}
