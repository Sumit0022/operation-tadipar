import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { customStorage } from './index';

interface SettingsState {
  theme: 'light' | 'dark' | 'system';
  weekStartsOn: 0 | 1; // 0 for Sunday, 1 for Monday
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setWeekStartsOn: (day: 0 | 1) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'system',
      weekStartsOn: 1, // Default Monday
      setTheme: (theme) => set({ theme }),
      setWeekStartsOn: (weekStartsOn) => set({ weekStartsOn }),
    }),
    {
      name: 'planner-settings-storage',
      storage: customStorage,
    }
  )
);
