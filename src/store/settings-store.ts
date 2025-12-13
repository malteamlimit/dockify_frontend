import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsStore {
  qedThreshold: number;
  enforceSubstructure: boolean;

  setQedThreshold: (value: number) => void;
  setEnforceSubstructure: (value: boolean) => void;
  resetSettings: () => void;
}

const defaultSettings = {
  qedThreshold: 0.3,
  enforceSubstructure: true,
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      ...defaultSettings,

      setQedThreshold: (value) => set({ qedThreshold: value }),
      setEnforceSubstructure: (value) => set({ enforceSubstructure: value }),
      resetSettings: () => set(defaultSettings),
    }),
    {
      name: 'dockify-local-settings',
    }
  )
);