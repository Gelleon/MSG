import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppearanceState {
  customColorIndex: number | null;
  setCustomColorIndex: (index: number | null) => void;
}

export const useAppearanceStore = create<AppearanceState>()(
  persist(
    (set) => ({
      customColorIndex: null,
      setCustomColorIndex: (index) => set({ customColorIndex: index }),
    }),
    {
      name: 'appearance-settings',
    }
  )
);
