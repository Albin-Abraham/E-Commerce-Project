import { create } from "zustand";

interface SidebarState {
  isOpen: boolean;
  isMobile: boolean;
  expandedGroups: Record<string, boolean>;
  isLoading: boolean;
  globalRefreshVersion: number;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setMobile: (mobile: boolean) => void;
  toggleGroup: (id: string) => void;
  setGroupExpanded: (id: string, expanded: boolean) => void;
  setLoading: (loading: boolean) => void;
  collapseAll: () => void;
}

export const useSidebarStore = create<SidebarState>((set) => ({
  isOpen: true,
  isMobile: false,
  expandedGroups: {},
  isLoading: false,
  globalRefreshVersion: 0,
  toggleSidebar: () => set((state) => ({ isOpen: !state.isOpen })),
  setSidebarOpen: (open) => set({ isOpen: open }),
  setMobile: (mobile) =>
    set({
      isMobile: mobile,
      isOpen: !mobile,
    }),
  toggleGroup: (id) =>
    set((state) => ({
      expandedGroups: {
        ...state.expandedGroups,
        [id]: !state.expandedGroups[id],
      },
    })),
  setGroupExpanded: (id, expanded) =>
    set((state) => ({
      expandedGroups: {
        ...state.expandedGroups,
        [id]: expanded,
      },
    })),
  setLoading: (loading) => set({ isLoading: loading }),
  collapseAll: () => set({ expandedGroups: {} }),
}));
