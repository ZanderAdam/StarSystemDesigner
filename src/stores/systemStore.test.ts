import { describe, it, expect, beforeEach } from 'vitest';
import { useSystemStore } from '@/stores/systemStore';
import { createDefaultPlanet, createDefaultMoon } from '@/lib/defaults';

describe('systemStore', () => {
  beforeEach(() => {
    useSystemStore.setState({
      system: null,
      rootBodies: [],
      isDirty: false,
    });
  });

  describe('newSystem', () => {
    it('should create a new system with one star', () => {
      const { newSystem } = useSystemStore.getState();
      newSystem('Test System');

      const { system, rootBodies, isDirty } = useSystemStore.getState();
      expect(system).not.toBeNull();
      expect(system?.name).toBe('Test System');
      expect(rootBodies).toHaveLength(1);
      expect(rootBodies[0].id).toBe('Test System');
      expect(rootBodies[0].type).toBe('star');
      expect(isDirty).toBe(true);
    });
  });

  describe('addBody', () => {
    it('should add a planet to a star', () => {
      const { newSystem, addBody, rootBodies } = useSystemStore.getState();
      newSystem('Sol');

      const planet = createDefaultPlanet('Sol', 'Sol', 1);
      planet.name = 'Earth';
      planet.orbitDistance = 100;
      addBody(planet);

      const { rootBodies: updatedBodies } = useSystemStore.getState();
      const star = updatedBodies[0];
      expect(star.children).toHaveLength(1);
      expect(star.children[0].id).toBe('Sol 1');
      expect(star.children[0].name).toBe('Earth');
      expect(star.children[0].parentId).toBe('Sol');
    });

    it('should number planets sequentially', () => {
      const { newSystem, addBody } = useSystemStore.getState();
      newSystem('Sol');

      const planet1 = createDefaultPlanet('Sol', 'Sol', 1);
      planet1.name = 'Mercury';
      addBody(planet1);

      const planet2 = createDefaultPlanet('Sol', 'Sol', 2);
      planet2.name = 'Venus';
      addBody(planet2);

      const planet3 = createDefaultPlanet('Sol', 'Sol', 3);
      planet3.name = 'Earth';
      addBody(planet3);

      const { rootBodies } = useSystemStore.getState();
      const star = rootBodies[0];
      expect(star.children[0].planetNumber).toBe(1);
      expect(star.children[1].planetNumber).toBe(2);
      expect(star.children[2].planetNumber).toBe(3);
    });

    it('should add a moon to a planet', () => {
      const { newSystem, addBody } = useSystemStore.getState();
      newSystem('Sol');

      const planet = createDefaultPlanet('Sol', 'Sol', 1);
      planet.name = 'Earth';
      addBody(planet);

      const moon = createDefaultMoon('Sol 1', 0);
      moon.name = 'Luna';
      addBody(moon);

      const { rootBodies } = useSystemStore.getState();
      const star = rootBodies[0];
      const earthPlanet = star.children[0];
      expect(earthPlanet.children).toHaveLength(1);
      expect(earthPlanet.children[0].id).toBe('Sol 1 a');
      expect(earthPlanet.children[0].name).toBe('Luna');
      expect(earthPlanet.children[0].parentId).toBe('Sol 1');
      expect(earthPlanet.children[0].moonLetter).toBe('a');
    });

    it('should letter moons sequentially', () => {
      const { newSystem, addBody } = useSystemStore.getState();
      newSystem('Sol');

      const planet = createDefaultPlanet('Sol', 'Sol', 1);
      planet.name = 'Jupiter';
      addBody(planet);

      const moon1 = createDefaultMoon('Sol 1', 0);
      moon1.name = 'Io';
      addBody(moon1);

      const moon2 = createDefaultMoon('Sol 1', 1);
      moon2.name = 'Europa';
      addBody(moon2);

      const moon3 = createDefaultMoon('Sol 1', 2);
      moon3.name = 'Ganymede';
      addBody(moon3);

      const moon4 = createDefaultMoon('Sol 1', 3);
      moon4.name = 'Callisto';
      addBody(moon4);

      const { rootBodies } = useSystemStore.getState();
      const star = rootBodies[0];
      const jupiter = star.children[0];
      expect(jupiter.children[0].moonLetter).toBe('a');
      expect(jupiter.children[1].moonLetter).toBe('b');
      expect(jupiter.children[2].moonLetter).toBe('c');
      expect(jupiter.children[3].moonLetter).toBe('d');
    });
  });

  describe('updateBody', () => {
    it('should update body properties', () => {
      const { newSystem, findBody, updateBody } = useSystemStore.getState();
      newSystem('Sol');

      const star = useSystemStore.getState().findBody('Sol');
      expect(star).toBeDefined();

      const updated = { ...star!, name: 'The Sun', luminosity: 1.5 };
      updateBody(updated);

      const { rootBodies } = useSystemStore.getState();
      expect(rootBodies[0].name).toBe('The Sun');
      expect(rootBodies[0].luminosity).toBe(1.5);
    });
  });

  describe('removeBody', () => {
    it('should remove a planet', () => {
      const { newSystem, addBody, removeBody, findBody } = useSystemStore.getState();
      newSystem('Sol');

      const planet = createDefaultPlanet('Sol', 'Sol', 1);
      planet.name = 'Earth';
      addBody(planet);

      const { rootBodies: beforeBodies } = useSystemStore.getState();
      expect(beforeBodies[0].children).toHaveLength(1);

      const earthPlanet = useSystemStore.getState().findBody('Sol 1');
      expect(earthPlanet).toBeDefined();
      removeBody(earthPlanet!);

      const { rootBodies: afterBodies } = useSystemStore.getState();
      expect(afterBodies[0].children).toHaveLength(0);
    });
  });

  describe('markClean', () => {
    it('should mark the system as clean', () => {
      const { newSystem, markClean } = useSystemStore.getState();
      newSystem('Sol');

      expect(useSystemStore.getState().isDirty).toBe(true);

      markClean();

      expect(useSystemStore.getState().isDirty).toBe(false);
    });
  });

  describe('findBody', () => {
    it('should return undefined for non-existent body', () => {
      const { newSystem } = useSystemStore.getState();
      newSystem('Sol');

      const result = useSystemStore.getState().findBody('NonExistent');
      expect(result).toBeUndefined();
    });

    it('should find deeply nested body', () => {
      const { newSystem, addBody } = useSystemStore.getState();
      newSystem('Sol');

      const planet = createDefaultPlanet('Sol', 'Sol', 1);
      addBody(planet);

      const moon = createDefaultMoon('Sol 1', 0);
      addBody(moon);

      const result = useSystemStore.getState().findBody('Sol 1 a');
      expect(result).toBeDefined();
      expect(result?.name).toBe('Sol 1 a');
      expect(result?.type).toBe('moon');
    });
  });

  describe('removeBody', () => {
    it('should remove deeply nested moon', () => {
      const { newSystem, addBody, removeBody } = useSystemStore.getState();
      newSystem('Sol');

      const planet = createDefaultPlanet('Sol', 'Sol', 1);
      addBody(planet);

      const moon1 = createDefaultMoon('Sol 1', 0);
      addBody(moon1);

      const moon2 = createDefaultMoon('Sol 1', 1);
      addBody(moon2);

      // Verify moons exist
      const { rootBodies: before } = useSystemStore.getState();
      expect(before[0].children[0].children).toHaveLength(2);

      // Remove first moon
      const moonToRemove = useSystemStore.getState().findBody('Sol 1 a');
      removeBody(moonToRemove!);

      const { rootBodies: after } = useSystemStore.getState();
      expect(after[0].children[0].children).toHaveLength(1);
      expect(after[0].children[0].children[0].id).toBe('Sol 1 b');
    });

    it('should remove planet with children', () => {
      const { newSystem, addBody, removeBody } = useSystemStore.getState();
      newSystem('Sol');

      const planet = createDefaultPlanet('Sol', 'Sol', 1);
      addBody(planet);

      const moon = createDefaultMoon('Sol 1', 0);
      addBody(moon);

      // Remove planet (should also remove its children)
      const planetToRemove = useSystemStore.getState().findBody('Sol 1');
      removeBody(planetToRemove!);

      const { rootBodies } = useSystemStore.getState();
      expect(rootBodies[0].children).toHaveLength(0);

      // Moon should no longer be findable
      const orphanMoon = useSystemStore.getState().findBody('Sol 1 a');
      expect(orphanMoon).toBeUndefined();
    });
  });

  describe('loadSystem', () => {
    it('should load system with tree data', () => {
      const { loadSystem } = useSystemStore.getState();

      const system = {
        id: 'test',
        name: 'Test System',
        bounds: { width: 1000, height: 1000 },
      };

      const rootBodies = [
        {
          id: 'Test',
          name: 'Test Star',
          description: '',
          type: 'star' as const,
          sprite: '',
          parentId: null,
          orbitDistance: 0,
          orbitSpeed: 0,
          orbitAngle: 0,
          scale: 1,
          rotation: 0,
          rotationSpeed: 0,
          children: [
            {
              id: 'Test 1',
              name: 'Test Planet',
              description: '',
              type: 'planet' as const,
              sprite: '',
              parentId: 'Test',
              orbitDistance: 100,
              orbitSpeed: 1,
              orbitAngle: 0,
              scale: 1,
              rotation: 0,
              rotationSpeed: 0,
              planetNumber: 1,
              children: [],
            },
          ],
          luminosity: 1,
        },
      ];

      loadSystem(system, rootBodies);

      const state = useSystemStore.getState();
      expect(state.system?.name).toBe('Test System');
      expect(state.rootBodies).toHaveLength(1);
      expect(state.rootBodies[0].children).toHaveLength(1);
      expect(state.isDirty).toBe(false);
    });

    it('should clear previous system on load', () => {
      const { newSystem, addBody, loadSystem } = useSystemStore.getState();
      newSystem('Old System');

      const planet = createDefaultPlanet('Old System', 'Old System', 1);
      addBody(planet);

      // Load new system
      const system = {
        id: 'new',
        name: 'New System',
        bounds: { width: 500, height: 500 },
      };

      const rootBodies = [
        {
          id: 'New',
          name: 'New Star',
          description: '',
          type: 'star' as const,
          sprite: '',
          parentId: null,
          orbitDistance: 0,
          orbitSpeed: 0,
          orbitAngle: 0,
          scale: 1,
          rotation: 0,
          rotationSpeed: 0,
          children: [],
          luminosity: 1,
        },
      ];

      loadSystem(system, rootBodies);

      const state = useSystemStore.getState();
      expect(state.system?.name).toBe('New System');
      expect(state.rootBodies).toHaveLength(1);
      expect(state.rootBodies[0].id).toBe('New');
      expect(state.rootBodies[0].children).toHaveLength(0);
    });
  });
});
