import { create } from 'zustand';
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware';
import localforage from 'localforage';
import type { Subject, Schedule, Holiday, Topic } from '../types';

// Configure localforage
localforage.config({
  name: 'PlannerApp',
  storeName: 'planner_data',
});

const storage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    const value = await localforage.getItem<string>(name);
    return value || null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await localforage.setItem(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await localforage.removeItem(name);
  },
};

export const customStorage = createJSONStorage(() => storage);

interface AppState {
  subjects: Subject[];
  topics: Topic[];
  schedules: Schedule[];
  holidays: Holiday[];
  
  // Actions
  addSubject: (subject: Omit<Subject, 'createdAt' | 'updatedAt'>) => void;
  updateSubject: (id: string, subject: Partial<Subject>) => void;
  deleteSubject: (id: string) => void;
  
  addTopic: (topic: Omit<Topic, 'createdAt' | 'updatedAt'>) => void;
  updateTopic: (id: string, topic: Partial<Topic>) => void;
  deleteTopic: (id: string) => void;
  
  addSchedule: (schedule: Omit<Schedule, 'createdAt' | 'updatedAt'>) => void;
  updateSchedule: (id: string, schedule: Partial<Schedule>) => void;
  deleteSchedule: (id: string) => void;
  
  addHoliday: (holiday: Omit<Holiday, 'createdAt' | 'updatedAt'>) => void;
  updateHoliday: (id: string, holiday: Partial<Holiday>) => void;
  deleteHoliday: (id: string) => void;
  
  // Data Management
  importData: (data: { subjects: Subject[], topics?: Topic[], schedules: Schedule[], holidays: Holiday[] }) => void;
  resetData: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      subjects: [],
      topics: [],
      schedules: [],
      holidays: [],
      
      addSubject: (subject) => set((state) => ({
        subjects: [...state.subjects, { ...subject, createdAt: Date.now(), updatedAt: Date.now() }]
      })),
      updateSubject: (id, subject) => set((state) => ({
        subjects: state.subjects.map(s => s.id === id ? { ...s, ...subject, updatedAt: Date.now() } : s)
      })),
      deleteSubject: (id) => set((state) => ({
        subjects: state.subjects.filter(s => s.id !== id),
        topics: state.topics.filter(t => t.subjectId !== id)
      })),
      
      addTopic: (topic) => set((state) => ({
        topics: [...state.topics, { ...topic, createdAt: Date.now(), updatedAt: Date.now() }]
      })),
      updateTopic: (id, topic) => set((state) => ({
        topics: state.topics.map(t => t.id === id ? { ...t, ...topic, updatedAt: Date.now() } : t)
      })),
      deleteTopic: (id) => set((state) => ({
        topics: state.topics.filter(t => t.id !== id)
      })),
      
      addSchedule: (schedule) => set((state) => ({
        schedules: [...state.schedules, { ...schedule, createdAt: Date.now(), updatedAt: Date.now() }]
      })),
      updateSchedule: (id, schedule) => set((state) => ({
        schedules: state.schedules.map(s => s.id === id ? { ...s, ...schedule, updatedAt: Date.now() } : s)
      })),
      deleteSchedule: (id) => set((state) => ({
        schedules: state.schedules.filter(s => s.id !== id)
      })),
      
      addHoliday: (holiday) => set((state) => ({
        holidays: [...state.holidays, { ...holiday, createdAt: Date.now(), updatedAt: Date.now() }]
      })),
      updateHoliday: (id, holiday) => set((state) => ({
        holidays: state.holidays.map(h => h.id === id ? { ...h, ...holiday, updatedAt: Date.now() } : h)
      })),
      deleteHoliday: (id) => set((state) => ({
        holidays: state.holidays.filter(h => h.id !== id)
      })),
      
      importData: (data) => set(() => ({
        subjects: data.subjects || [],
        topics: data.topics || [],
        schedules: data.schedules || [],
        holidays: data.holidays || [],
      })),
      resetData: () => set(() => ({
        subjects: [],
        topics: [],
        schedules: [],
        holidays: [],
      }))
    }),
    {
      name: 'planner-app-storage',
      storage: customStorage,
    }
  )
);
