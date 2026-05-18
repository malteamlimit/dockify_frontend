import { create } from 'zustand';

interface UIState {
  pendingSidebarTab: string | null;
  requestSidebarTab: (tab: string) => void;
  clearPendingSidebarTab: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  pendingSidebarTab: null,
  requestSidebarTab: (tab) => set({ pendingSidebarTab: tab }),
  clearPendingSidebarTab: () => set({ pendingSidebarTab: null }),
}));