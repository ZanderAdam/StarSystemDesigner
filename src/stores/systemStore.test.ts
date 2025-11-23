import { describe, it, expect, beforeEach } from 'vitest';
import { useSystemStore } from '@/stores/systemStore';

describe('systemStore', () => {
  beforeEach(() => {
    useSystemStore.setState({
      system: null,
      isDirty: false,
    });
  });

  describe('newSystem', () => {
    it('should create a new system with one star', () => {
      const { newSystem } = useSystemStore.getState();
      newSystem('Test System');

      const { system, isDirty } = useSystemStore.getState();
      expect(system).not.toBeNull();
      expect(system?.name).toBe('Test System');
      expect(system?.stars).toHaveLength(1);
      expect(system?.stars[0].id).toBe('Test System');
      expect(isDirty).toBe(true);
    });
  });

  describe('addPlanet', () => {
    it('should add a planet to a star', () => {
      const { newSystem, addPlanet } = useSystemStore.getState();
      newSystem('Sol');

      const planet = addPlanet('Sol', {
        name: 'Earth',
        orbitDistance: 100,
      });

      expect(planet.id).toBe('Sol 1');
      expect(planet.name).toBe('Earth');
      expect(planet.parentStarId).toBe('Sol');
      expect(planet.planetNumber).toBe(1);

      const { system } = useSystemStore.getState();
      expect(system?.planets).toHaveLength(1);
    });

    it('should number planets sequentially', () => {
      const { newSystem, addPlanet } = useSystemStore.getState();
      newSystem('Sol');

      const planet1 = addPlanet('Sol', { name: 'Mercury' });
      const planet2 = addPlanet('Sol', { name: 'Venus' });
      const planet3 = addPlanet('Sol', { name: 'Earth' });

      expect(planet1.planetNumber).toBe(1);
      expect(planet2.planetNumber).toBe(2);
      expect(planet3.planetNumber).toBe(3);
    });
  });

  describe('addMoon', () => {
    it('should add a moon to a planet', () => {
      const { newSystem, addPlanet, addMoon } = useSystemStore.getState();
      newSystem('Sol');
      addPlanet('Sol', { name: 'Earth' });

      const moon = addMoon('Sol 1', { name: 'Luna' });

      expect(moon.id).toBe('Sol 1 a');
      expect(moon.name).toBe('Luna');
      expect(moon.parentPlanetId).toBe('Sol 1');
      expect(moon.moonLetter).toBe('a');
    });

    it('should letter moons sequentially', () => {
      const { newSystem, addPlanet, addMoon } = useSystemStore.getState();
      newSystem('Sol');
      addPlanet('Sol', { name: 'Jupiter' });

      const moon1 = addMoon('Sol 1', { name: 'Io' });
      const moon2 = addMoon('Sol 1', { name: 'Europa' });
      const moon3 = addMoon('Sol 1', { name: 'Ganymede' });
      const moon4 = addMoon('Sol 1', { name: 'Callisto' });

      expect(moon1.moonLetter).toBe('a');
      expect(moon2.moonLetter).toBe('b');
      expect(moon3.moonLetter).toBe('c');
      expect(moon4.moonLetter).toBe('d');
    });
  });

  describe('updateStar', () => {
    it('should update star properties', () => {
      const { newSystem, updateStar } = useSystemStore.getState();
      newSystem('Sol');

      updateStar('Sol', { name: 'The Sun', luminosity: 1.5 });

      const { system } = useSystemStore.getState();
      expect(system?.stars[0].name).toBe('The Sun');
      expect(system?.stars[0].luminosity).toBe(1.5);
    });
  });

  describe('removePlanet', () => {
    it('should remove a planet', () => {
      const { newSystem, addPlanet, removePlanet } = useSystemStore.getState();
      newSystem('Sol');
      addPlanet('Sol', { name: 'Earth' });

      const { system: beforeSystem } = useSystemStore.getState();
      expect(beforeSystem?.planets).toHaveLength(1);

      removePlanet('Sol 1');

      const { system: afterSystem } = useSystemStore.getState();
      expect(afterSystem?.planets).toHaveLength(0);
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
});
