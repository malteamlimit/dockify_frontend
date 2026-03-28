import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Settings Store Interface
 *
 * Manages application-wide settings that persist in local storage.
 * These settings control filtering and validation thresholds for docking jobs.
 */
interface SettingsStore {
  qedThreshold: number;
  enforceSubstructure: boolean;
  deltaGThreshold: number;
  atomPairCstThreshold: number;

  // ============ Setters ============
  setQedThreshold: (value: number) => void;
  setEnforceSubstructure: (value: boolean) => void;
  setDeltaGThreshold: (value: number) => void;
  setAtomPairCstThreshold: (value: number) => void;

  // ============ Utilities ============
  resetSettings: () => void;
}

/**
 * Default settings values
 * These are used when the store is initialized and when resetSettings() is called
 */
const defaultSettings = {
  qedThreshold: 0.3,
  enforceSubstructure: true,
  deltaGThreshold: 0,
  atomPairCstThreshold: 15,
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      // ============ Initial State ============
      ...defaultSettings,

      // ============ Molecular Property Threshold Setters ============
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