/* UI Version: 12:30 Baseline */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface TimerState {
  isRunning: boolean;
  elapsedSeconds: number;
  startTime: number | null;
  startTimer: () => void;
  pauseTimer: () => void;
  stopTimer: () => void;
  resetTimer: () => void;
  syncTick: () => void; // Called periodically to sync the time when the user returns
}

export const useTimerStore = create<TimerState>()(
  persist(
    (set, get) => ({
      isRunning: false,
      elapsedSeconds: 0,
      startTime: null,
      
      startTimer: () => {
        const { isRunning } = get();
        if (isRunning) return;
        set({ isRunning: true, startTime: Date.now() });
      },
      
      pauseTimer: () => {
          const { isRunning, syncTick } = get();
          if (!isRunning) return;
          syncTick();
          set({ isRunning: false, startTime: null });
      },

      stopTimer: () => {
        const { isRunning, syncTick } = get();
        if (isRunning) syncTick();
        set({ isRunning: false, startTime: null });
      },
      
      resetTimer: () => {
        set({ isRunning: false, elapsedSeconds: 0, startTime: null });
      },

      syncTick: () => {
        const { isRunning, startTime, elapsedSeconds } = get();
        if (isRunning && startTime) {
            const now = Date.now();
            const delta = Math.floor((now - startTime) / 1000);
            if (delta > 0) {
                set({ elapsedSeconds: elapsedSeconds + delta, startTime: now });
            }
        }
      }
    }),
    {
      name: 'magic-timer-storage',
    }
  )
);
