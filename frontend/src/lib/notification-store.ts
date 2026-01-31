import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface NotificationState {
  soundEnabled: boolean;
  visualEnabled: boolean;
  toggleSound: () => void;
  toggleVisual: () => void;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set) => ({
      soundEnabled: true,
      visualEnabled: true,
      toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),
      toggleVisual: () => set((state) => ({ visualEnabled: !state.visualEnabled })),
    }),
    {
      name: 'notification-settings',
    }
  )
);
