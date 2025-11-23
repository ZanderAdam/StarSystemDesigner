import { create } from 'zustand';
import type { Vector2 } from '@/types';

type SelectionType = 'star' | 'planet' | 'moon' | 'station' | 'asteroid';
type MobileTab = 'editor' | 'hierarchy';

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
  computedZoom: number; // Actual zoom used for rendering (autoFit * manual)
  focusTarget: Selection | null; // Object to center view on

  // UI panels
  showOrbits: boolean;
  isAnimating: boolean;

  // Dialogs
  isNewSystemDialogOpen: boolean;
  isSaveDialogOpen: boolean;
  isLoadDialogOpen: boolean;

  // Mobile
  activeTab: MobileTab;
}

interface UIActions {
  // Selection
  select: (selection: Selection | null) => void;
  clearSelection: () => void;

  // Camera
  setCameraPosition: (position: Vector2) => void;
  setCameraZoom: (zoom: number) => void;
  setComputedZoom: (zoom: number) => void;
  setFocusTarget: (target: Selection | null) => void;
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

  // Mobile
  setActiveTab: (tab: MobileTab) => void;
}

const DEFAULT_CAMERA_POSITION: Vector2 = { x: 0, y: 0 };
const DEFAULT_CAMERA_ZOOM = 1;

export const useUIStore = create<UIState & UIActions>()((set) => ({
  // Initial state
  selection: null,
  cameraPosition: DEFAULT_CAMERA_POSITION,
  cameraZoom: DEFAULT_CAMERA_ZOOM,
  computedZoom: DEFAULT_CAMERA_ZOOM,
  focusTarget: null,
  showOrbits: true,
  isAnimating: true,
  isNewSystemDialogOpen: false,
  isSaveDialogOpen: false,
  isLoadDialogOpen: false,
  activeTab: 'editor',

  // Selection actions
  select: (selection) => set({ selection }),
  clearSelection: () => set({ selection: null }),

  // Camera actions
  setCameraPosition: (position) => set({ cameraPosition: position }),
  setCameraZoom: (zoom) => set({ cameraZoom: Math.max(0.1, Math.min(5, zoom)) }),
  setComputedZoom: (zoom) => set({ computedZoom: zoom }),
  setFocusTarget: (target) => set({ focusTarget: target }),
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

  // Mobile actions
  setActiveTab: (tab) => set({ activeTab: tab }),
}));
