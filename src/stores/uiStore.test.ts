import { describe, it, expect, beforeEach } from 'vitest';
import { useUIStore } from '@/stores/uiStore';

describe('uiStore', () => {
  beforeEach(() => {
    useUIStore.setState({
      selection: null,
      cameraPosition: { x: 0, y: 0 },
      cameraZoom: 1,
      computedZoom: 1,
      focusTarget: null,
      showOrbits: true,
      isAnimating: true,
      isNewSystemDialogOpen: false,
      isSaveDialogOpen: false,
      isLoadDialogOpen: false,
    });
  });

  describe('selection', () => {
    it('should select an object', () => {
      const { select } = useUIStore.getState();

      select({ type: 'planet', id: 'Sol 3' });

      const { selection } = useUIStore.getState();
      expect(selection?.type).toBe('planet');
      expect(selection?.id).toBe('Sol 3');
    });

    it('should clear selection', () => {
      const { select, clearSelection } = useUIStore.getState();

      select({ type: 'star', id: 'Sol' });
      clearSelection();

      const { selection } = useUIStore.getState();
      expect(selection).toBeNull();
    });
  });

  describe('camera', () => {
    it('should update camera zoom within bounds', () => {
      const { setCameraZoom } = useUIStore.getState();

      setCameraZoom(2);
      expect(useUIStore.getState().cameraZoom).toBe(2);

      setCameraZoom(0.05); // below minimum
      expect(useUIStore.getState().cameraZoom).toBe(0.1);

      setCameraZoom(10); // above maximum
      expect(useUIStore.getState().cameraZoom).toBe(5);
    });

    it('should reset camera', () => {
      const { setCameraPosition, setCameraZoom, resetCamera } = useUIStore.getState();

      setCameraPosition({ x: 100, y: 200 });
      setCameraZoom(3);

      resetCamera();

      const state = useUIStore.getState();
      expect(state.cameraPosition).toEqual({ x: 0, y: 0 });
      expect(state.cameraZoom).toBe(1);
    });
  });

  describe('toggles', () => {
    it('should toggle orbits', () => {
      const { toggleOrbits } = useUIStore.getState();

      expect(useUIStore.getState().showOrbits).toBe(true);
      toggleOrbits();
      expect(useUIStore.getState().showOrbits).toBe(false);
      toggleOrbits();
      expect(useUIStore.getState().showOrbits).toBe(true);
    });

    it('should toggle animation', () => {
      const { toggleAnimation } = useUIStore.getState();

      expect(useUIStore.getState().isAnimating).toBe(true);
      toggleAnimation();
      expect(useUIStore.getState().isAnimating).toBe(false);
      toggleAnimation();
      expect(useUIStore.getState().isAnimating).toBe(true);
    });
  });
});
