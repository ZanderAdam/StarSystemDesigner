import { describe, it, expect } from 'vitest';
import {
  StarSchema,
  PlanetSchema,
  MoonSchema,
  SolarSystemSchema,
} from '@/types';

describe('Type Validation', () => {
  describe('StarSchema', () => {
    it('should validate a valid star', () => {
      const star = {
        id: 'Sol',
        name: 'Sol',
        description: 'The Sun',
        type: 'star' as const,
        sprite: 'sun.png',
        scale: 1,
        rotation: 0,
        rotationSpeed: 0.1,
        luminosity: 1,
      };

      const result = StarSchema.safeParse(star);
      expect(result.success).toBe(true);
    });

    it('should reject invalid star type', () => {
      const star = {
        id: 'Sol',
        name: 'Sol',
        description: 'The Sun',
        type: 'planet', // wrong type
        sprite: 'sun.png',
        scale: 1,
        rotation: 0,
        rotationSpeed: 0.1,
        luminosity: 1,
      };

      const result = StarSchema.safeParse(star);
      expect(result.success).toBe(false);
    });

    it('should use defaults for optional fields', () => {
      const star = {
        id: 'Sol',
        name: 'Sol',
        type: 'star' as const,
        sprite: 'sun.png',
        luminosity: 1,
      };

      const result = StarSchema.safeParse(star);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.scale).toBe(1);
        expect(result.data.rotation).toBe(0);
        expect(result.data.rotationSpeed).toBe(0);
      }
    });
  });

  describe('PlanetSchema', () => {
    it('should validate a planet with moons', () => {
      const planet = {
        id: 'Sol 3',
        name: 'Earth',
        description: 'Blue planet',
        type: 'planet' as const,
        sprite: 'earth.png',
        parentStarId: 'Sol',
        planetNumber: 3,
        orbitDistance: 100,
        orbitSpeed: 1,
        orbitAngle: 0,
        scale: 1,
        rotation: 0,
        rotationSpeed: 0.25,
        moons: [
          {
            id: 'Sol 3 a',
            name: 'Luna',
            description: 'The Moon',
            type: 'moon' as const,
            sprite: 'moon.png',
            parentPlanetId: 'Sol 3',
            moonLetter: 'a',
            orbitDistance: 25,
            orbitSpeed: 2,
            orbitAngle: 0,
            scale: 0.3,
            rotation: 0,
            rotationSpeed: 0,
          },
        ],
        stations: [],
      };

      const result = PlanetSchema.safeParse(planet);
      expect(result.success).toBe(true);
    });

    it('should reject negative orbit distance', () => {
      const planet = {
        id: 'Sol 3',
        name: 'Earth',
        type: 'planet' as const,
        sprite: 'earth.png',
        parentStarId: 'Sol',
        planetNumber: 3,
        orbitDistance: -100, // invalid
        orbitSpeed: 1,
        orbitAngle: 0,
        moons: [],
        stations: [],
      };

      const result = PlanetSchema.safeParse(planet);
      expect(result.success).toBe(false);
    });
  });

  describe('MoonSchema', () => {
    it('should validate a valid moon', () => {
      const moon = {
        id: 'Sol 3 a',
        name: 'Luna',
        description: 'Earth\'s moon',
        type: 'moon' as const,
        sprite: 'moon.png',
        parentPlanetId: 'Sol 3',
        moonLetter: 'a',
        orbitDistance: 25,
        orbitSpeed: 2,
        orbitAngle: 0,
        scale: 0.3,
        rotation: 0,
        rotationSpeed: 0,
      };

      const result = MoonSchema.safeParse(moon);
      expect(result.success).toBe(true);
    });

    it('should reject moon letter with multiple characters', () => {
      const moon = {
        id: 'Sol 3 a',
        name: 'Luna',
        type: 'moon' as const,
        sprite: 'moon.png',
        parentPlanetId: 'Sol 3',
        moonLetter: 'ab', // too long
        orbitDistance: 25,
        orbitSpeed: 2,
        orbitAngle: 0,
      };

      const result = MoonSchema.safeParse(moon);
      expect(result.success).toBe(false);
    });
  });

  describe('SolarSystemSchema', () => {
    it('should validate a complete solar system', () => {
      const system = {
        id: 'sol',
        name: 'Sol',
        stars: [
          {
            id: 'Sol',
            name: 'Sol',
            description: '',
            type: 'star' as const,
            sprite: '',
            scale: 1,
            rotation: 0,
            rotationSpeed: 0,
            luminosity: 1,
          },
        ],
        planets: [],
        asteroids: [],
        bounds: { width: 1000, height: 1000 },
      };

      const result = SolarSystemSchema.safeParse(system);
      expect(result.success).toBe(true);
    });

    it('should require at least one star', () => {
      const system = {
        id: 'sol',
        name: 'Sol',
        stars: [], // empty - invalid
        planets: [],
        asteroids: [],
      };

      const result = SolarSystemSchema.safeParse(system);
      expect(result.success).toBe(false);
    });
  });
});
