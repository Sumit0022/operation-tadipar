import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { customStorage, useAppStore } from './index';
import { useAuthStore } from './auth';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Schedule, ActiveSession } from '../types';
import toast from 'react-hot-toast';

interface TimerState {
  activeSession: ActiveSession | null;
  startTimer: (schedule: Schedule) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  stopTimer: (schedule: Schedule, forceComplete?: boolean) => void;
  syncWithCloud: () => Promise<void>;
}

export const useTimerStore = create<TimerState>()(
  persist(
    (set, get) => ({
      activeSession: null,

      startTimer: (schedule) => {
        const session: ActiveSession = {
          scheduleId: schedule.id,
          subjectId: schedule.subjectId,
          taskTitle: schedule.taskTitle,
          startTime: Date.now(),
          accumulatedSeconds: schedule.actualDurationSeconds || 0,
          status: 'running'
        };
        set({ activeSession: session });
        get().syncWithCloud();
        toast.success(`Started studying: ${schedule.taskTitle}`);
      },

      pauseTimer: () => {
        const { activeSession } = get();
        if (!activeSession || activeSession.status === 'paused') return;

        const now = Date.now();
        const elapsedSinceStart = Math.floor((now - activeSession.startTime) / 1000);
        
        const updatedSession = {
          ...activeSession,
          accumulatedSeconds: activeSession.accumulatedSeconds + elapsedSinceStart,
          status: 'paused' as const
        };
        
        set({ activeSession: updatedSession });
        get().syncWithCloud();
      },

      resumeTimer: () => {
        const { activeSession } = get();
        if (!activeSession || activeSession.status === 'running') return;

        const updatedSession = {
          ...activeSession,
          startTime: Date.now(),
          status: 'running' as const
        };
        
        set({ activeSession: updatedSession });
        get().syncWithCloud();
      },

      stopTimer: (schedule, forceComplete = false) => {
        const { activeSession } = get();
        if (!activeSession) return;

        let finalSeconds = activeSession.accumulatedSeconds;
        if (activeSession.status === 'running') {
          const elapsed = Math.floor((Date.now() - activeSession.startTime) / 1000);
          finalSeconds += elapsed;
        }

        // Update the schedule in the main store
        const updates: Partial<Schedule> = {
          actualDurationSeconds: finalSeconds,
        };
        
        if (forceComplete) {
          updates.status = 'Completed';
          toast.success(`Task Completed: ${schedule.taskTitle}`);
        } else {
          toast.success(`Session saved. Studied for ${Math.floor(finalSeconds / 60)} minutes.`);
        }

        useAppStore.getState().updateSchedule(schedule.id, updates);
        
        set({ activeSession: null });
        get().syncWithCloud();
      },

      syncWithCloud: async () => {
        const { user } = useAuthStore.getState();
        const { activeSession } = get();
        if (!user) return;

        try {
          await updateDoc(doc(db, 'users', user.uid), {
            activeSession: activeSession || null
          });
        } catch (error) {
          console.error("Failed to sync timer state to cloud", error);
        }
      }
    }),
    {
      name: 'planner-timer-storage',
      storage: customStorage,
    }
  )
);
