import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Member } from '@/lib/types';

export type Theme = 'light' | 'dark';

interface MemberStore {

  members: Member[];
  selectedId: string | null;
  searchQuery: string;
  activeRootId: string | null;
  focusViewId: string | null;
  focusHistory: string[];
  highlightedId: string | null;
  view: 'tree' | 'grid';
  theme: Theme;
  setMembers: (members: Member[]) => void;
  setSelected: (id: string | null) => void;
  setSearch: (q: string) => void;
  setActiveRoot: (id: string | null) => void;
  setFocusView: (id: string | null) => void;
  setHighlighted: (id: string | null) => void;
  navigateTo: (id: string) => void;
  goBack: () => void;
  setView: (v: 'tree' | 'grid') => void;
  toggleTheme: () => void;

}

export const useMemberStore = create<MemberStore>()(
  persist(
    (set, get) => ({
      members: [],
      selectedId: null,
      searchQuery: '',
      activeRootId: null,
      focusViewId: null,
      focusHistory: [],
      highlightedId: null,
      view: 'tree',
      theme: 'light',

      setMembers: (members) => set({ members }),

      setSelected: (id) => set({ selectedId: id }),
      setSearch: (q) => set({ searchQuery: q, activeRootId: null }),
      setActiveRoot: (id) => set({ activeRootId: id, focusHistory: [] }),
      setFocusView: (id) => set({ focusViewId: id }),
      setHighlighted: (id) => set({ highlightedId: id }),

      navigateTo: (id) => {

        const member = get().members.find(m => m.id === id);
        const isAnchor = member && (member.rel === null || member.rel === 'child' || member.rel === 'spouse' || member.rel === 'sibling');
        set(s => {
          if (isAnchor && s.focusViewId && s.focusViewId !== id) {
            return {
              selectedId: id,
              focusViewId: id,
              focusHistory: [...s.focusHistory, s.focusViewId],
            };
          }
          return {
            selectedId: id,
            focusViewId: isAnchor ? id : s.focusViewId,
          };
        });
      },

      goBack: () => set(s => {
        if (!s.focusHistory.length) return {};
        const prev = s.focusHistory[s.focusHistory.length - 1];
        return {
          focusViewId: prev,
          focusHistory: s.focusHistory.slice(0, -1),
        };
      }),
      setView: (v) => set({ view: v }),
      toggleTheme: () => set(s => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),

    }),
    {
      // Only the "last viewed tree" and theme preference survive a reload —
      // members always come fresh from the active data source (see
      // src/lib/dataSource.ts), never from this cache.
      name: 'gulshan-club-tree',
      partialize: (state) => ({
        activeRootId: state.activeRootId,
        searchQuery: state.searchQuery,
        theme: state.theme,
      }),
    },
  ),
);
