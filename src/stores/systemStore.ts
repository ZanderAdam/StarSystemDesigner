import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { v4 as uuidv4 } from 'uuid';
import type {
  SolarSystem,
  Star,
  Planet,
  Moon,
  Station,
  Asteroid,
} from '@/types';
import { SystemNaming } from '@/lib/naming';

interface SystemState {
  system: SolarSystem | null;
  isDirty: boolean;
}

interface SystemActions {
  // System operations
  newSystem: (name: string) => void;
  loadSystem: (system: SolarSystem) => void;
  clearSystem: () => void;
  setSystemName: (name: string) => void;

  // Star operations
  addStar: (star: Partial<Star>) => Star;
  updateStar: (id: string, updates: Partial<Star>) => void;
  removeStar: (id: string) => void;

  // Planet operations
  addPlanet: (starId: string, planet: Partial<Planet>) => Planet;
  updatePlanet: (id: string, updates: Partial<Planet>) => void;
  removePlanet: (id: string) => void;

  // Moon operations
  addMoon: (planetId: string, moon: Partial<Moon>) => Moon;
  updateMoon: (planetId: string, moonId: string, updates: Partial<Moon>) => void;
  removeMoon: (planetId: string, moonId: string) => void;

  // Station operations
  addStation: (planetId: string, station: Partial<Station>) => Station;
  updateStation: (planetId: string, stationId: string, updates: Partial<Station>) => void;
  removeStation: (planetId: string, stationId: string) => void;

  // Asteroid operations
  addAsteroid: (asteroid: Partial<Asteroid>) => Asteroid;
  updateAsteroid: (id: string, updates: Partial<Asteroid>) => void;
  removeAsteroid: (id: string) => void;

  // State management
  markClean: () => void;
}

export const useSystemStore = create<SystemState & SystemActions>()(
  immer((set, get) => ({
    system: null,
    isDirty: false,

    newSystem: (name: string) => {
      const starId = SystemNaming.generateStarId(name);
      set((state) => {
        state.system = {
          id: uuidv4(),
          name,
          stars: [
            {
              id: starId,
              name,
              description: '',
              type: 'star',
              sprite: '',
              scale: 1,
              rotation: 0,
              rotationSpeed: 0,
              luminosity: 1,
            },
          ],
          planets: [],
          asteroids: [],
          bounds: { width: 2000, height: 2000 },
        };
        state.isDirty = true;
      });
    },

    loadSystem: (system: SolarSystem) => {
      set((state) => {
        state.system = system;
        state.isDirty = false;
      });
    },

    clearSystem: () => {
      set((state) => {
        state.system = null;
        state.isDirty = false;
      });
    },

    setSystemName: (name: string) => {
      set((state) => {
        if (state.system) {
          state.system.name = name;
          state.isDirty = true;
        }
      });
    },

    addStar: (starData: Partial<Star>) => {
      const { system } = get();
      if (!system) throw new Error('No system loaded');

      const starIndex = system.stars.length;
      const id = SystemNaming.generateStarId(system.name, starIndex);

      const star: Star = {
        id,
        name: starData.name || id,
        description: starData.description || '',
        type: 'star',
        sprite: starData.sprite || '',
        scale: starData.scale ?? 1,
        rotation: starData.rotation ?? 0,
        rotationSpeed: starData.rotationSpeed ?? 0,
        luminosity: starData.luminosity ?? 1,
        starLetter: starIndex > 0 ? String.fromCharCode(65 + starIndex - 1) : undefined,
      };

      set((state) => {
        state.system!.stars.push(star);
        state.isDirty = true;
      });

      return star;
    },

    updateStar: (id: string, updates: Partial<Star>) => {
      set((state) => {
        const star = state.system?.stars.find((s) => s.id === id);
        if (star) {
          Object.assign(star, updates);
          state.isDirty = true;
        }
      });
    },

    removeStar: (id: string) => {
      set((state) => {
        if (state.system) {
          state.system.stars = state.system.stars.filter((s) => s.id !== id);
          state.isDirty = true;
        }
      });
    },

    addPlanet: (starId: string, planetData: Partial<Planet>) => {
      const { system } = get();
      if (!system) throw new Error('No system loaded');

      const star = system.stars.find((s) => s.id === starId);
      if (!star) throw new Error(`Star ${starId} not found`);

      const starPlanets = system.planets.filter((p) => p.parentStarId === starId);
      const planetNumber = starPlanets.length + 1;
      const id = SystemNaming.generatePlanetId(system.name, starId, planetNumber);

      const planet: Planet = {
        id,
        name: planetData.name || id,
        description: planetData.description || '',
        type: 'planet',
        sprite: planetData.sprite || '',
        parentStarId: starId,
        planetNumber,
        orbitDistance: planetData.orbitDistance ?? 100,
        orbitSpeed: planetData.orbitSpeed ?? 1,
        orbitAngle: planetData.orbitAngle ?? 0,
        scale: planetData.scale ?? 1,
        rotation: planetData.rotation ?? 0,
        rotationSpeed: planetData.rotationSpeed ?? 0,
        moons: [],
        stations: [],
      };

      set((state) => {
        state.system!.planets.push(planet);
        state.isDirty = true;
      });

      return planet;
    },

    updatePlanet: (id: string, updates: Partial<Planet>) => {
      set((state) => {
        const planet = state.system?.planets.find((p) => p.id === id);
        if (planet) {
          Object.assign(planet, updates);
          state.isDirty = true;
        }
      });
    },

    removePlanet: (id: string) => {
      set((state) => {
        if (state.system) {
          state.system.planets = state.system.planets.filter((p) => p.id !== id);
          state.isDirty = true;
        }
      });
    },

    addMoon: (planetId: string, moonData: Partial<Moon>) => {
      const { system } = get();
      if (!system) throw new Error('No system loaded');

      const planet = system.planets.find((p) => p.id === planetId);
      if (!planet) throw new Error(`Planet ${planetId} not found`);

      const moonIndex = planet.moons.length;
      const moonLetter = String.fromCharCode(97 + moonIndex);
      const id = SystemNaming.generateMoonId(planetId, moonIndex);

      const moon: Moon = {
        id,
        name: moonData.name || id,
        description: moonData.description || '',
        type: 'moon',
        sprite: moonData.sprite || '',
        parentPlanetId: planetId,
        moonLetter,
        orbitDistance: moonData.orbitDistance ?? 30,
        orbitSpeed: moonData.orbitSpeed ?? 2,
        orbitAngle: moonData.orbitAngle ?? 0,
        scale: moonData.scale ?? 0.5,
        rotation: moonData.rotation ?? 0,
        rotationSpeed: moonData.rotationSpeed ?? 0,
      };

      set((state) => {
        const p = state.system!.planets.find((p) => p.id === planetId);
        p!.moons.push(moon);
        state.isDirty = true;
      });

      return moon;
    },

    updateMoon: (planetId: string, moonId: string, updates: Partial<Moon>) => {
      set((state) => {
        const planet = state.system?.planets.find((p) => p.id === planetId);
        const moon = planet?.moons.find((m) => m.id === moonId);
        if (moon) {
          Object.assign(moon, updates);
          state.isDirty = true;
        }
      });
    },

    removeMoon: (planetId: string, moonId: string) => {
      set((state) => {
        const planet = state.system?.planets.find((p) => p.id === planetId);
        if (planet) {
          planet.moons = planet.moons.filter((m) => m.id !== moonId);
          state.isDirty = true;
        }
      });
    },

    addStation: (planetId: string, stationData: Partial<Station>) => {
      const { system } = get();
      if (!system) throw new Error('No system loaded');

      const planet = system.planets.find((p) => p.id === planetId);
      if (!planet) throw new Error(`Planet ${planetId} not found`);

      const stationType = stationData.stationType || 'research';
      const stationIndex = planet.stations.filter((s) => s.stationType === stationType).length + 1;
      const id = SystemNaming.generateStationId(planetId, stationType, stationIndex);

      const station: Station = {
        id,
        name: stationData.name || id,
        description: stationData.description || '',
        type: 'station',
        sprite: stationData.sprite || '',
        stationType,
        parentId: planetId,
        orbitDistance: stationData.orbitDistance ?? 20,
        orbitSpeed: stationData.orbitSpeed ?? 3,
        orbitAngle: stationData.orbitAngle ?? 0,
        scale: stationData.scale ?? 0.3,
        rotation: stationData.rotation ?? 0,
        rotationSpeed: stationData.rotationSpeed ?? 0,
      };

      set((state) => {
        const p = state.system!.planets.find((p) => p.id === planetId);
        p!.stations.push(station);
        state.isDirty = true;
      });

      return station;
    },

    updateStation: (planetId: string, stationId: string, updates: Partial<Station>) => {
      set((state) => {
        const planet = state.system?.planets.find((p) => p.id === planetId);
        const station = planet?.stations.find((s) => s.id === stationId);
        if (station) {
          Object.assign(station, updates);
          state.isDirty = true;
        }
      });
    },

    removeStation: (planetId: string, stationId: string) => {
      set((state) => {
        const planet = state.system?.planets.find((p) => p.id === planetId);
        if (planet) {
          planet.stations = planet.stations.filter((s) => s.id !== stationId);
          state.isDirty = true;
        }
      });
    },

    addAsteroid: (asteroidData: Partial<Asteroid>) => {
      const { system } = get();
      if (!system) throw new Error('No system loaded');

      const beltIndex = system.asteroids.length + 1;
      const id = SystemNaming.generateAsteroidId(system.name, beltIndex);

      const asteroid: Asteroid = {
        id,
        name: asteroidData.name || id,
        description: asteroidData.description || '',
        type: 'asteroid',
        sprite: asteroidData.sprite || '',
        beltIndex,
        orbitDistance: asteroidData.orbitDistance,
        scale: asteroidData.scale ?? 1,
        rotation: asteroidData.rotation ?? 0,
        rotationSpeed: asteroidData.rotationSpeed ?? 0,
      };

      set((state) => {
        state.system!.asteroids.push(asteroid);
        state.isDirty = true;
      });

      return asteroid;
    },

    updateAsteroid: (id: string, updates: Partial<Asteroid>) => {
      set((state) => {
        const asteroid = state.system?.asteroids.find((a) => a.id === id);
        if (asteroid) {
          Object.assign(asteroid, updates);
          state.isDirty = true;
        }
      });
    },

    removeAsteroid: (id: string) => {
      set((state) => {
        if (state.system) {
          state.system.asteroids = state.system.asteroids.filter((a) => a.id !== id);
          state.isDirty = true;
        }
      });
    },

    markClean: () => {
      set((state) => {
        state.isDirty = false;
      });
    },
  }))
);
