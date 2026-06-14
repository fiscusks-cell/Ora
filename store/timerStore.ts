'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface TimerState {
  entryId: string | null;
  projectId: string | null;
  description: string;
  startedAt: Date | null;
  isRunning: boolean;
  startTimer: (entryId: string, projectId: string | null, description: string) => void;
  stopTimer: () => void;
  setDescription: (desc: string) => void;
  setProjectId: (id: string | null) => void;
}

export const useTimerStore = create<TimerState>()(
  persist(
    (set) => ({
      entryId: null,
      projectId: null,
      description: '',
      startedAt: null,
      isRunning: false,
      startTimer: (entryId, projectId, description) =>
        set({ entryId, projectId, description, startedAt: new Date(), isRunning: true }),
      stopTimer: () =>
        set({ entryId: null, projectId: null, description: '', startedAt: null, isRunning: false }),
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
      }),
    }
  )
);
