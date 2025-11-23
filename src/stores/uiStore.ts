import { create } from 'zustand';
import type { Vector2 } from '@/types';

type SelectionType = 'star' | 'planet' | 'moon' | 'station' | 'asteroid';

interface Selection {
  type: SelectionType;
  id: string;
  parentId?: string; // For moons/stations, the planet ID
}

interface UIState {
  // Selection
  selection: Selection | null;

  // Camera
  cameraPosition: Vector2;
  cameraZoom: number;

  // UI panels
  showOrbits: boolean;
  isAnimating: boolean;

  // Dialogs
  isNewSystemDialogOpen: boolean;
  isSaveDialogOpen: boolean;
  isLoadDialogOpen: boolean;
}

interface UIActions {
  // Selection
  select: (selection: Selection | null) => void;
  clearSelection: () => void;

  // Camera
  setCameraPosition: (position: Vector2) => void;
  setCameraZoom: (zoom: number) => void;
  resetCamera: () => void;

  // UI toggles
  toggleOrbits: () => void;
  toggleAnimation: () => void;

  // Dialogs
  openNewSystemDialog: () => void;
  closeNewSystemDialog: () => void;
  openSaveDialog: () => void;
  closeSaveDialog: () => void;
  openLoadDialog: () => void;
  closeLoadDialog: () => void;
}

const DEFAULT_CAMERA_POSITION: Vector2 = { x: 0, y: 0 };
const DEFAULT_CAMERA_ZOOM = 1;

export const useUIStore = create<UIState & UIActions>()((set) => ({
  // Initial state
  selection: null,
  cameraPosition: DEFAULT_CAMERA_POSITION,
  cameraZoom: DEFAULT_CAMERA_ZOOM,
  showOrbits: true,
  isAnimating: true,
  isNewSystemDialogOpen: false,
  isSaveDialogOpen: false,
  isLoadDialogOpen: false,

  // Selection actions
  select: (selection) => set({ selection }),
  clearSelection: () => set({ selection: null }),

  // Camera actions
  setCameraPosition: (position) => set({ cameraPosition: position }),
  setCameraZoom: (zoom) => set({ cameraZoom: Math.max(0.1, Math.min(5, zoom)) }),
  resetCamera: () =>
    set({
      cameraPosition: DEFAULT_CAMERA_POSITION,
      cameraZoom: DEFAULT_CAMERA_ZOOM,
    }),

  // UI toggle actions
  toggleOrbits: () => set((state) => ({ showOrbits: !state.showOrbits })),
  toggleAnimation: () => set((state) => ({ isAnimating: !state.isAnimating })),

  // Dialog actions
  openNewSystemDialog: () => set({ isNewSystemDialogOpen: true }),
  closeNewSystemDialog: () => set({ isNewSystemDialogOpen: false }),
  openSaveDialog: () => set({ isSaveDialogOpen: true }),
  closeSaveDialog: () => set({ isSaveDialogOpen: false }),
  openLoadDialog: () => set({ isLoadDialogOpen: true }),
  closeLoadDialog: () => set({ isLoadDialogOpen: false }),
}));
