import { create } from 'zustand';
import type { TargetInfo } from '@/lib/api';

interface TargetState {
  activeTarget: TargetInfo | null;
  needsTargetSelection: boolean;
  setActiveTarget: (target: TargetInfo) => void;
  clearActiveTarget: () => void;
}

export const useTargetStore = create<TargetState>((set) => ({
  activeTarget: null,
  needsTargetSelection: false,
  setActiveTarget: (target) => set({ activeTarget: target, needsTargetSelection: false }),
  clearActiveTarget: () => set({ activeTarget: null, needsTargetSelection: true }),
}));