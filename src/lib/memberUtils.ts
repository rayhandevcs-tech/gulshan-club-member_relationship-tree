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

export const UPGRADE_PATHS: Partial<Record<string, string[]>> = {
  Permanent: ['Life (7.5 Lac)', 'Donor (10 Lac)', 'Senior (25 Thousand)'],
  Life: ['Donor (2.5 Lac)', 'Senior (25 Thousand)'],
  Donor: ['Senior (25 Thousand)'],
};