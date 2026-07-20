import { Member } from './types';
import { getType } from './quotaTreeLayout';

export const getInitials = (name: string) =>
  name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0] || '') 
    .join('')
    .toUpperCase();

export const getChildren = (members: Member[], id: string) =>
  members.filter(m => m.pid === id);

// Same-generation blood relatives: shares both bio parents, or (when bio

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

// bg/dark = light-mode card background + text-on-that-bg.
// bgNight/textNight = dark-mode equivalents (a deep tint of the same hue +
// a light, readable tint) — kept as separate fields (not computed from `bg`)
// so each type's dark look can be hand-tuned rather than mechanically derived.
// bgNightHover is a solid (not alpha-blended) hover shade for dark mode —
// alpha-blended hovers look fine over a white canvas but read as a
// muddy/darker flash over a black one, so dark mode needs its own solid value.
export const TYPE_CONFIG = {
  Donor: {
    color: '#3B8BD4',
    bg: '#E6F1FB',
    dark: '#0C447C',
    bgNight: '#12293D',
    bgNightHover: '#1A3A54',
    textNight: '#8FC6F2',
    short: 'D',
  },
  Life: {
    color: '#1D9E75',
    bg: '#E1F5EE',
    dark: '#085041',
    bgNight: '#0E2A22',
    bgNightHover: '#163D31',
    textNight: '#7FE0BE',
    short: 'L',
  },
  Permanent: {
    color: '#7F77DD',
    bg: '#EEEDFE',
    dark: '#3C3489',
    bgNight: '#231F42',
    bgNightHover: '#322B5C',
    textNight: '#C7C1F7',
    short: 'P',
  },
  Senior: {
    color: '#BA7517',
    bg: '#FAEEDA',
    dark: '#633806',
    bgNight: '#2D2210',
    bgNightHover: '#402F16',
    textNight: '#EFC177',
    short: 'S',
  },
  Associate: {
    color: '#888780',
    bg: '#F1EFE8',
    dark: '#444441',
    bgNight: '#242219',
    bgNightHover: '#322F28',
    textNight: '#D2D0C8',
    short: 'A',
  },
  A4D: {
    color: '#D85A30',
    bg: '#FAECE7',
    dark: '#712B13',
    bgNight: '#331A10',
    bgNightHover: '#45251A',
    textNight: '#F3A67E',
    short: '4',
  },
  Corporate: {
    color: '#D4537E',
    bg: '#FBEAF0',
    dark: '#72243E',
    bgNight: '#33182A',
    bgNightHover: '#45213A',
    textNight: '#F3A8C4',
    short: 'C',
  },
  Honorary: {
    color: '#639922',
    bg: '#EAF3DE',
    dark: '#27500A',
    bgNight: '#202D10',
    bgNightHover: '#2C3D16',
    textNight: '#BEE184',
    short: 'H',
  },
  Foreign: {
    color: '#185FA5',
    bg: '#E6F1FB',
    dark: '#042C53',
    bgNight: '#102238',
    bgNightHover: '#163150',
    textNight: '#85C0F0',
    short: 'F',
  },
} as const;

export type TypeConfigEntry = (typeof TYPE_CONFIG)[keyof typeof TYPE_CONFIG];

// Resolve a type's card background / text-on-background / hover-background
// for the given theme — the single place that decides light vs. dark tint.
export const typeBg = (cfg: TypeConfigEntry, theme: 'light' | 'dark') =>
  theme === 'dark' ? cfg.bgNight : cfg.bg;
export const typeText = (cfg: TypeConfigEntry, theme: 'light' | 'dark') =>
  theme === 'dark' ? cfg.textNight : cfg.dark;
export const typeBgHover = (cfg: TypeConfigEntry, theme: 'light' | 'dark') =>
  theme === 'dark' ? cfg.bgNightHover : `${cfg.color}29`;

// Every core member (Life/Permanent/Donor-level primary or someone who

export const DEFAULT_A4D_QUOTA = 2;

// Counts how many A4D slots a given member has actually allocated.

export const getA4DQuota = (members: Member[], sponsorId: string) => {
  const used = members.filter(m => m.pid === sponsorId && getType(m) === 'A4D').length;
  return { used, total: DEFAULT_A4D_QUOTA, remaining: Math.max(DEFAULT_A4D_QUOTA - used, 0) };
};

