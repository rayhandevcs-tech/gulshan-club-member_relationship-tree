import { create } from 'zustand';
import { Member } from '@/lib/types';
import { demoMembers } from '@/lib/demoData';

interface MemberStore {
  members: Member[];
  selectedId: string | null;
  filterType: string | null;
  searchQuery: string;
  activeRootId: string | null;
  // Which person the relationship diagram is currently centered on.
  // Deliberately separate from selectedId: clicking an A4D leaf should
  // update the sidebar without yanking the diagram away to their
  // (usually empty) view.
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
  members: demoMembers,
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
  // Typing a fresh query should clear whatever single family was being
  // shown, until the person picks a specific result from the dropdown.
  setSearch: (q) => set({ searchQuery: q, activeRootId: null }),
  setActiveRoot: (id) => set({ activeRootId: id }),
  setFocusView: (id) => set({ focusViewId: id }),
  // The one navigation entry point used everywhere a person is clicked
  // to "go look at them": always updates the sidebar, and re-anchors the
  // relationship diagram for root members, 'child' members, and spouses.
  // Spouses each own their own A4D quota so they get their own focused
  // view when clicked. A4D, associate, and nominee members are leaf
  // dependents — clicking them just opens their sidebar.
  navigateTo: (id) => {
    const member = get().members.find(m => m.id === id);
    const isAnchor = member && (member.rel === null || member.rel === 'child' || member.rel === 'spouse');
    set(s => ({
      selectedId: id,
      focusViewId: isAnchor ? id : s.focusViewId,
    }));
  },
  // Browsing by category pill is a different mode from "view one family",
  // so switch cleanly instead of mixing both filters together.
  setFilterType: (t) => set({ filterType: t, searchQuery: '', activeRootId: null }),
  setView: (v) => set({ view: v }),
}));
