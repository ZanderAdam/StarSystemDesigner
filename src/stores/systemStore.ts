import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { SolarSystem, CelestialBody } from '@/types';
import { createDefaultStar } from '@/lib/defaults';

interface SystemState {
  system: SolarSystem | null;
  rootBodies: CelestialBody[];
  isDirty: boolean;
}

interface SystemActions {
  newSystem: (name: string) => void;
  loadSystem: (system: SolarSystem, rootBodies: CelestialBody[]) => void;
  clearSystem: () => void;
  setSystemName: (name: string) => void;

  addBody: (body: CelestialBody) => void;
  removeBody: (body: CelestialBody) => void;
  updateBody: (body: CelestialBody) => void;
  findBody: (id: string) => CelestialBody | undefined;

  markClean: () => void;
}

// Helper to find body in tree
function findInTree(bodies: CelestialBody[], id: string): CelestialBody | undefined {
  for (const body of bodies) {
    if (body.id === id) return body;
    const found = findInTree(body.children, id);
    if (found) return found;
  }
  return undefined;
}

// Helper to clone tree with modification
function updateInTree(
  bodies: CelestialBody[],
  id: string,
  updater: (body: CelestialBody) => CelestialBody
): CelestialBody[] {
  return bodies.map(body => {
    if (body.id === id) {
      return updater(body);
    }
    return {
      ...body,
      children: updateInTree(body.children, id, updater)
    };
  });
}

// Helper to remove from tree
function removeFromTree(bodies: CelestialBody[], id: string): CelestialBody[] {
  return bodies
    .filter(body => body.id !== id)
    .map(body => ({
      ...body,
      children: removeFromTree(body.children, id)
    }));
}

export const useSystemStore = create<SystemState & SystemActions>()((set, get) => ({
  system: null,
  rootBodies: [],
  isDirty: false,

  newSystem: (name: string) => {
    const star = createDefaultStar(name, 0);
    set({
      system: {
        id: uuidv4(),
        name,
        bounds: { width: 2000, height: 2000 },
      },
      rootBodies: [star],
      isDirty: true,
    });
  },

  loadSystem: (system: SolarSystem, rootBodies: CelestialBody[]) => {
    set({
      system,
      rootBodies,
      isDirty: false,
    });
  },

  clearSystem: () => {
    set({
      system: null,
      rootBodies: [],
      isDirty: false,
    });
  },

  setSystemName: (name: string) => {
    const { system } = get();
    if (system) {
      set({
        system: { ...system, name },
        isDirty: true,
      });
    }
  },

  addBody: (body: CelestialBody) => {
    const { rootBodies } = get();

    if (body.parentId === null) {
      // Add to root
      set({
        rootBodies: [...rootBodies, body],
        isDirty: true,
      });
    } else {
      // Add to parent's children
      const newRootBodies = updateInTree(rootBodies, body.parentId, parent => ({
        ...parent,
        children: [...parent.children, body]
      }));
      set({
        rootBodies: newRootBodies,
        isDirty: true,
      });
    }
  },

  removeBody: (body: CelestialBody) => {
    const { rootBodies } = get();
    const newRootBodies = removeFromTree(rootBodies, body.id);
    set({
      rootBodies: newRootBodies,
      isDirty: true,
    });
  },

  updateBody: (body: CelestialBody) => {
    const { rootBodies } = get();
    const newRootBodies = updateInTree(rootBodies, body.id, () => body);
    set({
      rootBodies: newRootBodies,
      isDirty: true,
    });
  },

  findBody: (id: string) => {
    return findInTree(get().rootBodies, id);
  },

  markClean: () => {
    set({ isDirty: false });
  },
}));
