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
  // to "go look at them": always updates the sidebar, but only re-anchors
  // the relationship diagram for non-A4D members — an A4D slot is a
  // dead end (no connections of their own), so clicking one should just
  // show their details without losing the family context on screen.
  navigateTo: (id) => {
    const member = get().members.find(m => m.id === id);
    set(s => ({
      selectedId: id,
      focusViewId: member && member.type !== 'A4D' ? id : s.focusViewId,
    }));
  },
  // Browsing by category pill is a different mode from "view one family",
  // so switch cleanly instead of mixing both filters together.
  setFilterType: (t) => set({ filterType: t, searchQuery: '', activeRootId: null }),
  setView: (v) => set({ view: v }),
}));
