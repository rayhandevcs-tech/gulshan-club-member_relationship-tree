import { create } from 'zustand';
import { Member } from '@/lib/types';
//import { demoMembers } from '@/lib/demoData';
import { familyMembers } from '@/lib/demoData';  

interface MemberStore {
  members: Member[];
  selectedId: string | null;
  filterType: string | null;
  searchQuery: string;
  activeRootId: string | null;
  focusViewId: string | null;
  view: 'tree' | 'grid';
  addMember: (m: Member) => void;
  updateMember: (id: string, data: Partial<Member>) => void;
  deleteMember: (id: string) => void;
  setSelected: (id: string | null) => void;
  setFilterType: (t: string | null) => void;
  setSearch: (q: string) => void;
  setActiveRoot: (id: string | null) => void;
  setFocusView: (id: string | null) => void;
  navigateTo: (id: string) => void;
  setView: (v: 'tree' | 'grid') => void;
}

export const useMemberStore = create<MemberStore>((set, get) => ({
 //members: demoMembers,
  members: familyMembers,  
  selectedId: null,
  filterType: null,
  searchQuery: '',
  activeRootId: null,
  focusViewId: null,
  view: 'tree',

  addMember: (m) => set(s => ({ members: [...s.members, m] })),

  updateMember: (id, data) =>
    set(s => ({ members: s.members.map(m => m.id === id ? { ...m, ...data } : m) })),

  deleteMember: (id) => {
    const { members } = get();
    const toDelete = new Set<string>();
    const collect = (pid: string) => {
      toDelete.add(pid);
      members.filter(m => m.pid === pid).forEach(c => collect(c.id));
    };
    collect(id);
    set(s => ({ members: s.members.filter(m => !toDelete.has(m.id)), selectedId: null }));
  },

  setSelected: (id) => set({ selectedId: id }),
  setSearch: (q) => set({ searchQuery: q, activeRootId: null }),
  setActiveRoot: (id) => set({ activeRootId: id }),
  setFocusView: (id) => set({ focusViewId: id }),
  navigateTo: (id) => {
    const member = get().members.find(m => m.id === id);
    const isAnchor = member && (member.rel === null || member.rel === 'child' || member.rel === 'spouse');
    set(s => ({
      selectedId: id,
      focusViewId: isAnchor ? id : s.focusViewId,
    }));
  },
  setFilterType: (t) => set({ filterType: t, searchQuery: '', activeRootId: null }),
  setView: (v) => set({ view: v }),
}));
