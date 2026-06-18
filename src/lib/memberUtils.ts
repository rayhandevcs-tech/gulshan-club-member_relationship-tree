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