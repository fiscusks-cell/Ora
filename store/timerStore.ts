'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface TimerState {
  userId: string | null;
  entryId: string | null;
  projectId: string | null;
  description: string;
  startedAt: Date | null;
  isRunning: boolean;
  isPaused: boolean;
  pausedAt: Date | null;
  initForUser: (userId: string) => void;
  startTimer: (entryId: string, projectId: string | null, description: string, startedAt?: Date) => void;
  stopTimer: () => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  setDescription: (desc: string) => void;
  setProjectId: (id: string | null) => void;
}

const RESET: Omit<TimerState, 'userId' | 'initForUser' | 'startTimer' | 'stopTimer' | 'pauseTimer' | 'resumeTimer' | 'setDescription' | 'setProjectId'> = {
  entryId: null,
  projectId: null,
  description: '',
  startedAt: null,
  isRunning: false,
  isPaused: false,
  pausedAt: null,
};

export const useTimerStore = create<TimerState>()(
  persist(
    (set, get) => ({
      userId: null,
      ...RESET,
      initForUser: (userId) => {
        const current = get();
        if (current.userId !== null && current.userId !== userId) {
          // Different user logged in on this device — wipe all timer state.
          set({ userId, ...RESET });
        } else {
          set({ userId });
        }
      },
      startTimer: (entryId, projectId, description, startedAt) =>
        set({ entryId, projectId, description, startedAt: startedAt ?? new Date(), isRunning: true, isPaused: false, pausedAt: null }),
      stopTimer: () =>
        set({ ...RESET }),
      pauseTimer: () =>
        set({ isRunning: false, isPaused: true, pausedAt: new Date() }),
      resumeTimer: () => {
        const { startedAt, pausedAt } = get();
        if (!startedAt || !pausedAt) return;
        const pausedMs = Date.now() - new Date(pausedAt).getTime();
        const adjustedStart = new Date(new Date(startedAt).getTime() + pausedMs);
        set({ isRunning: true, isPaused: false, pausedAt: null, startedAt: adjustedStart });
      },
      setDescription: (description) => set({ description }),
      setProjectId: (projectId) => set({ projectId }),
    }),
    {
      name: 'ora-timer',
      partialize: (state) => ({
        userId: state.userId,
        entryId: state.entryId,
        projectId: state.projectId,
        description: state.description,
        startedAt: state.startedAt,
        isRunning: state.isRunning,
        isPaused: state.isPaused,
        pausedAt: state.pausedAt,
      }),
    }
  )
);
