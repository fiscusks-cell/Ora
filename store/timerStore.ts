'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface TimerState {
  entryId: string | null;
  projectId: string | null;
  description: string;
  startedAt: Date | null;
  isRunning: boolean;
  isPaused: boolean;
  pausedAt: Date | null;
  startTimer: (entryId: string, projectId: string | null, description: string) => void;
  stopTimer: () => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  setDescription: (desc: string) => void;
  setProjectId: (id: string | null) => void;
}

export const useTimerStore = create<TimerState>()(
  persist(
    (set, get) => ({
      entryId: null,
      projectId: null,
      description: '',
      startedAt: null,
      isRunning: false,
      isPaused: false,
      pausedAt: null,
      startTimer: (entryId, projectId, description) =>
        set({ entryId, projectId, description, startedAt: new Date(), isRunning: true, isPaused: false, pausedAt: null }),
      stopTimer: () =>
        set({ entryId: null, projectId: null, description: '', startedAt: null, isRunning: false, isPaused: false, pausedAt: null }),
      pauseTimer: () =>
        set({ isRunning: false, isPaused: true, pausedAt: new Date() }),
      resumeTimer: () => {
        const { startedAt, pausedAt } = get();
        if (!startedAt || !pausedAt) return;
        // Shift startedAt forward by the time spent paused so elapsed is preserved
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
