import { Member } from './types';
import { getType } from '@/components/Quotatreelayout';

export const getInitials = (name: string) =>
  name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0] || '')
    .join('')
    .toUpperCase();

export const getChildren = (members: Member[], id: string) =>
  members.filter(m => m.pid === id);

export const getSpouse = (members: Member[], id: string) =>
  members.find(m => m.pid === id && m.rel === 'spouse');

export const getNonSpouseChildren = (members: Member[], id: string) =>
  members.filter(m => m.pid === id && m.rel !== 'spouse');

export const getAssociates = (members: Member[], id: string) =>
  members.filter(m => m.pid === id && m.via === 'associate');

export const getNominees = (members: Member[], id: string) =>
  members.filter(m => m.pid === id && m.via === 'nominee');

export const getRoots = (members: Member[]) =>
  members.filter(m => !m.pid);

// Same-generation blood relatives: shares both bio parents, or (when bio
// parentage isn't recorded) is another 'child'-rel member off the same
// structural parent — mirrors the sibling-edge rule already used by
// buildRelationshipDiagram/buildBioFamilyTree.
export const getSiblings = (members: Member[], m: Member) =>
  members.filter(x => {
    if (x.id === m.id) return false;
    const sameBioParents = !!(m.fatherId && m.motherId && x.fatherId === m.fatherId && x.motherId === m.motherId);
    const sameCoreParent = m.rel === 'child' && x.rel === 'child' && !!m.pid && x.pid === m.pid;
    return sameBioParents || sameCoreParent;
  });

export const getMember = (members: Member[], id: string) =>
  members.find(m => m.id === id);

// Walks up the pid chain (child -> parent, associate -> A4D member,
// spouse -> primary, nominee -> corporate) until it reaches the
// top-level member with no pid. Used so that searching for ANY member
// (even an associate three levels deep) shows that one specific family,
// instead of every family that happens to share a substring in its id.
export const getRootMember = (members: Member[], id: string): Member | undefined => {
  let current = getMember(members, id);
  const seen = new Set<string>();
  while (current?.pid && !seen.has(current.id)) {
    seen.add(current.id);
    const parent = getMember(members, current.pid);
    if (!parent) break;
    current = parent;
  }
  return current;
};

export const getAllDescendants = (members: Member[], id: string): string[] => {
  const result: string[] = [];

  const collect = (pid: string) => {
    const children = getChildren(members, pid);

    children.forEach(c => {
      result.push(c.id);
      collect(c.id);
    });
  };

  collect(id);

  return result;
};

export const TYPE_CONFIG = {
  Donor: {
    color: '#3B8BD4',
    bg: '#E6F1FB',
    dark: '#0C447C',
    short: 'D',
  },
  Life: {
    color: '#1D9E75',
    bg: '#E1F5EE',
    dark: '#085041',
    short: 'L',
  },
  Permanent: {
    color: '#7F77DD',
    bg: '#EEEDFE',
    dark: '#3C3489',
    short: 'P',
  },
  Senior: {
    color: '#BA7517',
    bg: '#FAEEDA',
    dark: '#633806',
    short: 'S',
  },
  Associate: {
    color: '#888780',
    bg: '#F1EFE8',
    dark: '#444441',
    short: 'A',
  },
  A4D: {
    color: '#D85A30',
    bg: '#FAECE7',
    dark: '#712B13',
    short: '4',
  },
  Corporate: {
    color: '#D4537E',
    bg: '#FBEAF0',
    dark: '#72243E',
    short: 'C',
  },
  Honorary: {
    color: '#639922',
    bg: '#EAF3DE',
    dark: '#27500A',
    short: 'H',
  },
  Foreign: {
    color: '#185FA5',
    bg: '#E6F1FB',
    dark: '#042C53',
    short: 'F',
  },
} as const;

export const REL_LABELS: Record<string, string> = {
  spouse: 'Spouse',
  a4d: 'A4D',
  associate: 'Associate',
  nominee: 'Nominee',
};

// Every core member (Life/Permanent/Donor-level primary or someone who
// has succeeded into that position) gets a fixed number of A4D slots
// they can allocate. Default is 2 unless overridden per type later.
export const DEFAULT_A4D_QUOTA = 2;

// Counts how many A4D slots a given member has actually allocated.
// Keyed off type === 'A4D' rather than rel === 'a4d', because a quota
// slot can be given to someone who is functionally a spouse in the tree
// (rel: 'spouse', positioned next to the sponsor) while still being the
// thing that actually consumes one of the sponsor's 2 A4D slots — type
// is the real "this consumes a quota slot" signal, rel is just how it
// renders in the tree.
export const getA4DQuota = (members: Member[], sponsorId: string) => {
  const used = members.filter(m => m.pid === sponsorId && getType(m) === 'A4D').length;
  return { used, total: DEFAULT_A4D_QUOTA, remaining: Math.max(DEFAULT_A4D_QUOTA - used, 0) };
};

// A more specific, gender-aware label for tree pills and the "Family
// Members" list — falls back to the generic REL_LABELS entry when
// gender isn't known. 'child' relations (a descendant who is themselves
// a core member) get no pill at all, since they render as their own
// nested family card instead of a dependent leaf.
export const getRelLabel = (member: Member): string => {
  if (member.via === 'associate') return 'Associate';
  if (member.via === 'nominee') return 'Nominee';
  if (!member.rel) return '';
  if (member.rel === 'child') {
    if (member.via === 'a4d' && member.gender) {
      return member.gender === 'M' ? 'Son (A4D)' : 'Daughter (A4D)';
    }
    return '';
  }
  if (member.rel === 'spouse' && member.gender) {
    return member.gender === 'M' ? 'Husband' : 'Wife';
  }
  return REL_LABELS[member.rel] ?? member.rel;
};

// For an A4D-type kid being rendered under a sponsor that ISN'T their
// true biological parent (a borrowed/grandparent quota slot), returns
// a short tree caption like "Son of PW-6 & PK-49" or "Daughter of LM-50"
// — the same kind of annotation used in the original paper diagram.
// Returns null when the sponsor shown IS the real parent (no caption
// needed, the tree position already tells the whole story).
export const getQuotaSourceCaption = (
  kid: Member,
  sponsorIds: string[],
  members: Member[]
): string | null => {
  const father = kid.fatherId ? members.find(m => m.id === kid.fatherId) : null;
  const mother = kid.motherId ? members.find(m => m.id === kid.motherId) : null;

  if ((father && sponsorIds.includes(father.id)) || (mother && sponsorIds.includes(mother.id))) {
    return null;
  }

  const refs = [father?.id, mother?.id].filter((x): x is string => !!x);
  if (!refs.length && (kid.fatherName || kid.motherName)) {
    refs.push((kid.fatherName ?? kid.motherName) as string);
  }
  if (!refs.length) return null;

  const noun = kid.gender === 'M' ? 'Son' : kid.gender === 'F' ? 'Daughter' : 'Child';
  return `${noun} of ${refs.join(' & ')}`;
};

// Bare relational role (Son/Daughter/Husband/Wife/Sibling) with no type
// suffix — used for diagram edge labels, where the membership type
// (A4D etc.) is shown separately as the box's own subtitle instead of
// being folded into the relationship label.
export const getRelRoleLabel = (member: Member): string => {
  if (member.via === 'associate') return 'Associate';
  if (member.via === 'nominee') return 'Nominee';
  if (!member.rel) return '';
  if (member.rel === 'spouse' && member.gender) {
    return member.gender === 'M' ? 'Husband' : 'Wife';
  }
  if (member.rel === 'child' && member.gender) {
    return member.gender === 'M' ? 'Son' : 'Daughter';
  }
  return REL_LABELS[member.rel] ?? member.rel;
};

// ---- Focused (single-person) relationship view ----------------------
// Click on anyone, and this shows ONLY what's directly connected to
// THAT exact person — their own sponsored spouse (if any) and their own
// sponsored children/A4D — not their partner's. A spouse who succeeded
// into a deceased predecessor's position is the one exception: the most
// relevant "direct connection" for them IS that succession link, shown
// as a reversed arrow, since they may not have sponsored anyone yet
// themselves.

export interface FocusedConnection {
  member: Member;
  edgeLabel: string;
  reversed: boolean;     // true for a succession arrow (spouse -> deceased predecessor)
  isSpouse: boolean;     // renders beside the owner, not in the lower A4D row
  refNote?: string;      // e.g. "Article 6(c)" extracted from a succession note
  caption: string | null; // true biological parent, when it differs from who's sponsoring them
}

export interface FocusedView {
  owner: Member;
  ownerCaption: string | null;
  connections: FocusedConnection[];
  associateCount: number;
  nomineeCount: number;
  membershipRef: { label: string; detail: string } | null;
}

const parseMembershipRef = (text?: string) => {
  if (!text) return null;
  const match = text.match(/([A-Z]{1,3}-\d+)\s*(?:\(([^)]+)\))?/);
  return match ? { label: match[1], detail: match[2] ?? '' } : null;
};

const extractArticleRef = (text?: string) => {
  const m = text?.match(/Article\s+[\d()a-zA-Z]+/);
  return m ? m[0] : undefined;
};

export const buildFocusedRelationship = (members: Member[], focusId: string): FocusedView | null => {
  const focus = getMember(members, focusId);
  if (!focus) return null;

  const connections: FocusedConnection[] = [];

  if (focus.rel === 'spouse' && focus.pid) {
    const partner = getMember(members, focus.pid);
    if (partner) {
      connections.push({
        member: partner,
        edgeLabel: getRelRoleLabel(focus) || 'Spouse',
        reversed: true,
        isSpouse: true,
        refNote: extractArticleRef(focus.note),
        caption: null,
      });
    }
  }

  const spouse = getSpouse(members, focus.id);
  if (spouse) {
    connections.push({
      member: spouse,
      edgeLabel: getRelRoleLabel(spouse) || 'Spouse',
      reversed: false,
      isSpouse: true,
      refNote: extractArticleRef(spouse.note),
      caption: null,
    });
  }

  getNonSpouseChildren(members, focus.id)
    .filter(k => k.via === 'a4d')
    .forEach(k => {
      connections.push({
        member: k,
        edgeLabel: getRelRoleLabel(k) || 'Child',
        reversed: false,
        isSpouse: false,
        caption: getType(k) === 'A4D' ? getQuotaSourceCaption(k, [focus.id], members) : null,
      });
    });

  const associateCount = getAssociates(members, focus.id).length;
  const nomineeCount = getNominees(members, focus.id).length;

  return {
    owner: focus,
    ownerCaption: getType(focus) === 'A4D' ? getQuotaSourceCaption(focus, focus.pid ? [focus.pid] : [], members) : null,
    connections,
    associateCount,
    nomineeCount,
    membershipRef: parseMembershipRef(focus.membershipRef),
  };
};

export const UPGRADE_PATHS: Partial<Record<string, string[]>> = {
  Permanent: ['Life (7.5 Lac)', 'Donor (10 Lac)', 'Senior (25 Thousand)'],
  Life: ['Donor (2.5 Lac)', 'Senior (25 Thousand)'],
  Donor: ['Senior (25 Thousand)'],
};

// ---- Relationship diagram layout -----------------------------------
// Builds the boxes-and-arrows model for the flowchart-style relationship
// diagram (the "show me exactly who's related to whom" view). Rows are
// positioned by BIOLOGICAL generation (via fatherId/motherId when known,
// falling back to the structural pid chain), while the actual arrows
// drawn follow the STRUCTURAL pid link — which is exactly what lets an
// arrow legitimately skip a generation when a quota slot is sourced
// from a grandparent instead of a parent.

export const DIAGRAM_BOX_W = 190;
export const DIAGRAM_BOX_H = 64;
export const DIAGRAM_ROW_GAP = 130;
export const DIAGRAM_COL_GAP = 50;

export interface DiagramNode {
  member: Member;
  x: number;
  y: number;
  row: number;
  caption: string | null;
}

export interface DiagramEdge {
  fromId: string;
  toId: string;
  label: string;
  kind: 'vertical' | 'spouse' | 'sibling';
}

export interface DiagramRef {
  label: string;
  detail: string;
  targetId: string;
}

export interface DiagramLayout {
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  refs: DiagramRef[];
  width: number;
  height: number;
}

const relEdgeLabel = (m: Member): string => {
  if (m.rel === 'spouse') return 'Spouse';
  if (m.via === 'a4d') return 'A4D';
  if (m.via === 'associate') return 'Associate';
  if (m.via === 'nominee') return 'Nominee';
  switch (m.rel) {
    case 'child': return 'Children';
    default: return '';
  }
};

export const buildRelationshipDiagram = (members: Member[], rootId: string): DiagramLayout | null => {
  const root = getMember(members, rootId);
  if (!root) return null;

  const familyIds = [root.id, ...getAllDescendants(members, root.id)];
  const family = familyIds.map(id => getMember(members, id)).filter((m): m is Member => !!m);
  const byId = new Map(family.map(m => [m.id, m]));

  const bioRow = new Map<string, number>();
  const resolving = new Set<string>();

  const computeRow = (m: Member): number => {
    if (bioRow.has(m.id)) return bioRow.get(m.id)!;
    if (m.id === root.id) {
      bioRow.set(m.id, 0);
      return 0;
    }
    if (resolving.has(m.id)) return 0;
    resolving.add(m.id);

    const pidMember = m.pid ? byId.get(m.pid) : undefined;
    const pidRow = pidMember ? computeRow(pidMember) : 0;
    // Only the root's direct spouse stays at the same row (rendered side-by-side).
    // Every other member — including non-root spouses — goes one row below their sponsor.
    const row = (m.rel === 'spouse' && m.pid === root.id) ? pidRow : pidRow + 1;

    resolving.delete(m.id);
    bioRow.set(m.id, row);
    return row;
  };

  family.forEach(computeRow);

  const maxRow = Math.max(...family.map(m => bioRow.get(m.id) ?? 0));
  const rows: Member[][] = Array.from({ length: maxRow + 1 }, () => []);
  family.forEach(m => rows[bioRow.get(m.id) ?? 0].push(m));

  const xOf = new Map<string, number>();
  const nodes: DiagramNode[] = [];

  rows.forEach((row, rowIdx) => {
    const spouseOf = new Map<string, Member>();
    const anchors: Member[] = [];
    const inRow = new Set(row.map(m => m.id));
    row.forEach(m => {
      if (m.rel === 'spouse' && m.pid && inRow.has(m.pid)) {
        spouseOf.set(m.pid, m);
      } else {
        anchors.push(m);
      }
    });

    const sortedAnchors = [...anchors].sort((a, b) => {
      const pa = a.pid && xOf.has(a.pid) ? xOf.get(a.pid)! : 0;
      const pb = b.pid && xOf.has(b.pid) ? xOf.get(b.pid)! : 0;
      if (pa !== pb) return pa - pb;
      return family.indexOf(a) - family.indexOf(b);
    });

    const ordered: Member[] = [];
    sortedAnchors.forEach(a => {
      ordered.push(a);
      const sp = spouseOf.get(a.id);
      if (sp) ordered.push(sp);
    });

    const totalWidth = ordered.length * (DIAGRAM_BOX_W + DIAGRAM_COL_GAP) - DIAGRAM_COL_GAP;
    let x = -totalWidth / 2;

    ordered.forEach(m => {
      xOf.set(m.id, x);
      const sponsorIds = m.pid ? [m.pid] : [];
      nodes.push({
        member: m,
        x,
        y: rowIdx * DIAGRAM_ROW_GAP,
        row: rowIdx,
        caption: getType(m) === 'A4D' ? getQuotaSourceCaption(m, sponsorIds, family) : null,
      });
      x += DIAGRAM_BOX_W + DIAGRAM_COL_GAP;
    });
  });

  const edges: DiagramEdge[] = [];
  family.forEach(m => {
    if (!m.pid || !byId.has(m.pid)) return;
    if (m.rel === 'spouse' && m.pid === root.id) {
      edges.push({ fromId: m.pid, toId: m.id, label: 'Spouse', kind: 'spouse' });
    } else {
      edges.push({ fromId: m.pid, toId: m.id, label: relEdgeLabel(m), kind: 'vertical' });
    }
  });

  rows.forEach(row => {
    const sorted = [...row].sort((a, b) => xOf.get(a.id)! - xOf.get(b.id)!);
    for (let i = 0; i < sorted.length - 1; i++) {
      const a = sorted[i];
      const b = sorted[i + 1];
      const sameParents =
        a.fatherId && a.motherId && a.fatherId === b.fatherId && a.motherId === b.motherId;
      const sameCoreParent =
        a.rel === 'child' && b.rel === 'child' && a.pid === b.pid;
      if (sameParents || sameCoreParent) {
        edges.push({ fromId: a.id, toId: b.id, label: 'Sibling', kind: 'sibling' });
      }
    }
  });

  const refs: DiagramRef[] = [];
  family.forEach(m => {
    if (!m.membershipRef) return;
    const match = m.membershipRef.match(/([A-Z]{1,3}-\d+)\s*(?:\(([^)]+)\))?/);
    if (match) {
      refs.push({ label: match[1], detail: match[2] ?? '', targetId: m.id });
    }
  });

  const minX = Math.min(...nodes.map(n => n.x));
  const maxX = Math.max(...nodes.map(n => n.x + DIAGRAM_BOX_W));
  const width = maxX - minX + 160;
  const height = (maxRow + 1) * DIAGRAM_ROW_GAP + DIAGRAM_BOX_H + 60;

  return { nodes, edges, refs, width, height };
};

// ---- Biological family tree layout ---------------------------------
// Builds a pure biological genealogy tree: rows by fatherId/motherId
// generation, structural spouses placed beside their partner, children
// connected vertically to their biological father (or mother if no father).
// Unlike buildRelationshipDiagram this ignores quota/pid structure and
// only follows blood-line and marriage links.

export const buildBioFamilyTree = (members: Member[], rootId: string): DiagramLayout | null => {
  const root = getMember(members, rootId);
  if (!root) return null;

  // Collect all members reachable via biological or marriage links
  const bioSet = new Set<string>([root.id]);

  const addSpouse = (id: string) => {
    const sp = members.find(m => m.pid === id && m.rel === 'spouse');
    if (sp && !bioSet.has(sp.id)) bioSet.add(sp.id);
  };

  addSpouse(root.id);

  let frontier = [...bioSet];
  while (frontier.length) {
    const next: string[] = [];
    for (const pid of frontier) {
      members
        .filter(m => m.fatherId === pid || m.motherId === pid)
        .forEach(kid => {
          if (!bioSet.has(kid.id)) {
            bioSet.add(kid.id);
            addSpouse(kid.id);
            next.push(kid.id);
          }
        });
    }
    frontier = next;
  }

  const family = [...bioSet].map(id => getMember(members, id)).filter((m): m is Member => !!m);
  const byId = new Map(family.map(m => [m.id, m]));

  // Row = biological generation; structural spouses share their partner's row
  const rowMap = new Map<string, number>();
  const resolving = new Set<string>();

  const computeRow = (m: Member): number => {
    if (rowMap.has(m.id)) return rowMap.get(m.id)!;
    if (m.id === root.id) { rowMap.set(m.id, 0); return 0; }
    if (resolving.has(m.id)) return 0;
    resolving.add(m.id);

    let row: number;
    if (m.rel === 'spouse' && m.pid && byId.has(m.pid)) {
      row = computeRow(byId.get(m.pid)!);
    } else {
      const father = m.fatherId ? byId.get(m.fatherId) : undefined;
      const mother = m.motherId ? byId.get(m.motherId) : undefined;
      if (father || mother) {
        const fr = father ? computeRow(father) : -1;
        const mr = mother ? computeRow(mother) : -1;
        row = Math.max(fr, mr) + 1;
      } else {
        row = m.pid && byId.has(m.pid) ? computeRow(byId.get(m.pid)!) + 1 : 1;
      }
    }

    resolving.delete(m.id);
    rowMap.set(m.id, row);
    return row;
  };

  family.forEach(computeRow);

  const maxRow = Math.max(...family.map(m => rowMap.get(m.id) ?? 0));
  const rows: Member[][] = Array.from({ length: maxRow + 1 }, () => []);
  family.forEach(m => rows[rowMap.get(m.id) ?? 0].push(m));

  const xOf = new Map<string, number>();
  const nodes: DiagramNode[] = [];

  rows.forEach((row, rowIdx) => {
    const spouseOf = new Map<string, Member>();
    const anchors: Member[] = [];
    const inRow = new Set(row.map(m => m.id));

    row.forEach(m => {
      if (m.rel === 'spouse' && m.pid && inRow.has(m.pid)) {
        spouseOf.set(m.pid, m);
      } else {
        anchors.push(m);
      }
    });

    const sortedAnchors = [...anchors].sort((a, b) => {
      const px = (m: Member) => {
        const fid = m.fatherId && xOf.has(m.fatherId) ? xOf.get(m.fatherId)! : null;
        const mid = m.motherId && xOf.has(m.motherId) ? xOf.get(m.motherId)! : null;
        const pid = m.pid && xOf.has(m.pid) ? xOf.get(m.pid)! : null;
        return fid ?? mid ?? pid ?? 0;
      };
      return px(a) - px(b) || family.indexOf(a) - family.indexOf(b);
    });

    const ordered: Member[] = [];
    sortedAnchors.forEach(a => {
      ordered.push(a);
      const sp = spouseOf.get(a.id);
      if (sp) ordered.push(sp);
    });

    const totalWidth = ordered.length * (DIAGRAM_BOX_W + DIAGRAM_COL_GAP) - DIAGRAM_COL_GAP;
    let x = -totalWidth / 2;
    ordered.forEach(m => {
      xOf.set(m.id, x);
      nodes.push({ member: m, x, y: rowIdx * DIAGRAM_ROW_GAP, row: rowIdx, caption: null });
      x += DIAGRAM_BOX_W + DIAGRAM_COL_GAP;
    });
  });

  const edges: DiagramEdge[] = [];

  // Couple (horizontal) edges
  family.forEach(m => {
    if (m.rel === 'spouse' && m.pid && byId.has(m.pid)) {
      if ((rowMap.get(m.id) ?? 0) === (rowMap.get(m.pid) ?? -1)) {
        edges.push({ fromId: m.pid, toId: m.id, label: 'Spouse', kind: 'spouse' });
      }
    }
  });

  // Parent→child (vertical) edges — from biological father (or mother)
  family.forEach(m => {
    const father = m.fatherId ? byId.get(m.fatherId) : undefined;
    const mother = m.motherId ? byId.get(m.motherId) : undefined;
    const fromParent = father ?? mother;
    if (fromParent) {
      edges.push({ fromId: fromParent.id, toId: m.id, label: '', kind: 'vertical' });
    }
  });

  // Sibling edges between same-parent adjacent members
  rows.forEach(row => {
    const sorted = [...row].sort((a, b) => (xOf.get(a.id) ?? 0) - (xOf.get(b.id) ?? 0));
    for (let i = 0; i < sorted.length - 1; i++) {
      const a = sorted[i], b = sorted[i + 1];
      if (a.fatherId && a.fatherId === b.fatherId && a.motherId && a.motherId === b.motherId) {
        edges.push({ fromId: a.id, toId: b.id, label: '', kind: 'sibling' });
      }
    }
  });

  const minX = Math.min(...nodes.map(n => n.x));
  const maxX = Math.max(...nodes.map(n => n.x + DIAGRAM_BOX_W));
  const width = maxX - minX + 200;
  const height = (maxRow + 1) * DIAGRAM_ROW_GAP + DIAGRAM_BOX_H + 80;

  return { nodes, edges, refs: [], width, height };
};