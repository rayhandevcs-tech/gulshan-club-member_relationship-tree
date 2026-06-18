import { Member } from './types';

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
  members.filter(m => m.pid === id && m.rel === 'associate');

export const getNominees = (members: Member[], id: string) =>
  members.filter(m => m.pid === id && m.rel === 'nominee');

export const getRoots = (members: Member[]) =>
  members.filter(m => !m.pid);

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
  const used = members.filter(m => m.pid === sponsorId && m.type === 'A4D').length;
  return { used, total: DEFAULT_A4D_QUOTA, remaining: Math.max(DEFAULT_A4D_QUOTA - used, 0) };
};

// A more specific, gender-aware label for tree pills and the "Family
// Members" list — falls back to the generic REL_LABELS entry when
// gender isn't known. 'child' relations (a descendant who is themselves
// a core member) get no pill at all, since they render as their own
// nested family card instead of a dependent leaf.
export const getRelLabel = (member: Member): string => {
  if (!member.rel) return '';
  if (member.rel === 'child') return '';
  if (member.rel === 'a4d' && member.gender) {
    return member.gender === 'M' ? 'Son (A4D)' : 'Daughter (A4D)';
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
  // A small extra box for things like "membership transferred to LS-35"
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
  switch (m.rel) {
    case 'a4d': return 'A4D';
    case 'child': return 'Children';
    case 'associate': return 'Associate';
    case 'nominee': return 'Nominee';
    default: return '';
  }
};

export const buildRelationshipDiagram = (members: Member[], rootId: string): DiagramLayout | null => {
  const root = getMember(members, rootId);
  if (!root) return null;

  const familyIds = [root.id, ...getAllDescendants(members, root.id)];
  const family = familyIds.map(id => getMember(members, id)).filter((m): m is Member => !!m);
  const byId = new Map(family.map(m => [m.id, m]));

  // Biological generation depth (for vertical row placement).
  const bioRow = new Map<string, number>();
  const resolving = new Set<string>();

  const computeRow = (m: Member): number => {
    if (bioRow.has(m.id)) return bioRow.get(m.id)!;
    if (m.id === root.id) {
      bioRow.set(m.id, 0);
      return 0;
    }
    if (resolving.has(m.id)) return 0; // guard against bad data cycles
    resolving.add(m.id);

    let row: number;
    if (m.rel === 'spouse' && m.pid && byId.has(m.pid)) {
      // A spouse shares their partner's row — they're a couple, not a
      // generation apart.
      row = computeRow(byId.get(m.pid)!);
    } else {
      const father = m.fatherId ? byId.get(m.fatherId) : undefined;
      const mother = m.motherId ? byId.get(m.motherId) : undefined;
      if (father || mother) {
        const fr = father ? computeRow(father) : -1;
        const mr = mother ? computeRow(mother) : -1;
        row = Math.max(fr, mr) + 1;
      } else {
        const pidRow = m.pid && byId.has(m.pid) ? computeRow(byId.get(m.pid)!) : 0;
        // An A4D slot with a named-but-unresolved external parent (e.g.
        // "father is LM-50, not in this family") is conventionally one
        // generation further down than its sponsor, same as every other
        // A4D dependent — without this, it would visually sit a row too
        // high compared to its A4D peers.
        const looksLikeExternalSkip = m.type === 'A4D' && (m.fatherName || m.motherName);
        row = pidRow + (looksLikeExternalSkip ? 2 : 1);
      }
    }

    resolving.delete(m.id);
    bioRow.set(m.id, row);
    return row;
  };

  family.forEach(computeRow);

  const maxRow = Math.max(...family.map(m => bioRow.get(m.id) ?? 0));
  const rows: Member[][] = Array.from({ length: maxRow + 1 }, () => []);
  family.forEach(m => rows[bioRow.get(m.id) ?? 0].push(m));

  // Assign x per row — sort by the structural parent's x (once known)
  // so visually-related clusters stay together and lines cross less.
  const xOf = new Map<string, number>();
  const nodes: DiagramNode[] = [];

  rows.forEach((row, rowIdx) => {
    // Spouses must sit immediately next to their partner, not get sorted
    // independently — otherwise a spouse's sort key (their partner's x)
    // isn't assigned yet (same row, not yet positioned) and they drift
    // away from the couple they belong to.
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
        caption: m.type === 'A4D' ? getQuotaSourceCaption(m, sponsorIds, family) : null,
      });
      x += DIAGRAM_BOX_W + DIAGRAM_COL_GAP;
    });
  });

  // Edges: spouse links (horizontal) and everything else (vertical,
  // following the structural pid — this is what lets an arrow skip a
  // generation for a grandparent-sourced A4D slot).
  const edges: DiagramEdge[] = [];
  family.forEach(m => {
    if (!m.pid || !byId.has(m.pid)) return;
    if (m.rel === 'spouse') {
      edges.push({ fromId: m.pid, toId: m.id, label: 'Spouse', kind: 'spouse' });
    } else if (m.rel !== 'associate' && m.rel !== 'nominee') {
      edges.push({ fromId: m.pid, toId: m.id, label: relEdgeLabel(m), kind: 'vertical' });
    } else {
      edges.push({ fromId: m.pid, toId: m.id, label: relEdgeLabel(m), kind: 'vertical' });
    }
  });

  // Sibling connectors — only between full siblings who ended up
  // immediately adjacent in the same row, so the line stays short and
  // doesn't cross unrelated boxes.
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

  // Membership transfer/renumbering references, e.g. "Linked to LS-35
  // (Article 6C & 10B)" — drawn as a small extra box off to the side.
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
  const width = maxX - minX + 160; // padding + room for ref boxes
  const height = (maxRow + 1) * DIAGRAM_ROW_GAP + DIAGRAM_BOX_H + 60;

  return { nodes, edges, refs, width, height };
};