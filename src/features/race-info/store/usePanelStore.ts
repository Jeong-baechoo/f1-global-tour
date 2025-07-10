import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { PanelState, PanelModule, PanelData } from '../types';

interface PanelActions {
  openPanel: (module: PanelModule, data: PanelData) => void;
  closePanel: () => void;
  toggleMinimize: () => void;
  setPanelData: (data: PanelData | null) => void;
  setPanelModule: (module: PanelModule | null) => void;
}

type PanelStore = PanelState & PanelActions;

export const usePanelStore = create<PanelStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      isOpen: false,
      isMinimized: false,
      module: null,
      data: null,

      // Actions
      openPanel: (module, data) => {
        set({
          isOpen: true,
          isMinimized: false,
          module,
          data
        });
      },

      closePanel: () => {
        set({
          isOpen: false,
          isMinimized: false
        });
      },

      toggleMinimize: () => {
        const { isMinimized } = get();
        set({ isMinimized: !isMinimized });
      },

      setPanelData: (data) => {
        set({ data });
      },

      setPanelModule: (module) => {
        set({ module });
      }
    }),
    {
      name: 'panel-store',
    }
  )
);