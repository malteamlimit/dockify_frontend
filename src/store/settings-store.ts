import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsStore {
  qedThreshold: number;
  enforceSubstructure: boolean;
  deltaGThreshold: number;
  atomPairCstThreshold: number;

  setQedThreshold: (value: number) => void;
  setEnforceSubstructure: (value: boolean) => void;
  setDeltaGThreshold: (value: number) => void;
  setAtomPairCstThreshold: (value: number) => void;
  resetSettings: () => void;
}

const defaultSettings = {
  qedThreshold: 0.3,
  enforceSubstructure: true,
  deltaGThreshold: 0,
  atomPairCstThreshold: 15,
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      ...defaultSettings,

      setQedThreshold: (value) => set({ qedThreshold: value }),
      setEnforceSubstructure: (value) => set({ enforceSubstructure: value }),

      // ============ Docking Score Threshold Setters ============
      setDeltaGThreshold: (value) => set({ deltaGThreshold: value }),
      setAtomPairCstThreshold: (value) => set({ atomPairCstThreshold: value }),

      // ============ Utilities ============
      resetSettings: () => set(defaultSettings),
    }),
    {
      name: 'dockify-local-settings',
    }
  )
);