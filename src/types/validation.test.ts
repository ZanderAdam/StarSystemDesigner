import { describe, it, expect } from 'vitest';
import { CelestialBodySchema, SolarSystemSchema } from '@/types';

describe('Type Validation', () => {
  describe('CelestialBodySchema', () => {
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
        parentId: null,
        orbitDistance: 0,
        orbitSpeed: 0,
        orbitAngle: 0,
        children: [],
        luminosity: 1,
      };

      const result = CelestialBodySchema.safeParse(star);
      expect(result.success).toBe(true);
    });

    it('should reject invalid body type', () => {
      const body = {
        id: 'Sol',
        name: 'Sol',
        description: 'The Sun',
        type: 'invalid', // wrong type
        sprite: 'sun.png',
        scale: 1,
        rotation: 0,
        rotationSpeed: 0.1,
        parentId: null,
        orbitDistance: 0,
        orbitSpeed: 0,
        orbitAngle: 0,
        children: [],
      };

      const result = CelestialBodySchema.safeParse(body);
      expect(result.success).toBe(false);
    });

    it('should use defaults for optional fields', () => {
      const star = {
        id: 'Sol',
        name: 'Sol',
        type: 'star' as const,
        sprite: 'sun.png',
        parentId: null,
        orbitDistance: 0,
        orbitSpeed: 0,
        orbitAngle: 0,
        children: [],
      };

      const result = CelestialBodySchema.safeParse(star);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.scale).toBe(1);
        expect(result.data.rotation).toBe(0);
        expect(result.data.rotationSpeed).toBe(0);
      }
    });

    it('should validate a planet with children', () => {
      const planet = {
        id: 'Sol 3',
        name: 'Earth',
        description: 'Blue planet',
        type: 'planet' as const,
        sprite: 'earth.png',
        parentId: 'Sol',
        planetNumber: 3,
        orbitDistance: 100,
        orbitSpeed: 1,
        orbitAngle: 0,
        scale: 1,
        rotation: 0,
        rotationSpeed: 0.25,
        children: [
          {
            id: 'Sol 3 a',
            name: 'Luna',
            description: 'The Moon',
            type: 'moon' as const,
            sprite: 'moon.png',
            parentId: 'Sol 3',
            moonLetter: 'a',
            orbitDistance: 25,
            orbitSpeed: 2,
            orbitAngle: 0,
            scale: 0.3,
            rotation: 0,
            rotationSpeed: 0,
            children: [],
          },
        ],
      };

      const result = CelestialBodySchema.safeParse(planet);
      expect(result.success).toBe(true);
    });

    it('should reject negative orbit distance', () => {
      const planet = {
        id: 'Sol 3',
        name: 'Earth',
        type: 'planet' as const,
        sprite: 'earth.png',
        parentId: 'Sol',
        planetNumber: 3,
        orbitDistance: -100, // invalid
        orbitSpeed: 1,
        orbitAngle: 0,
        children: [],
      };

      const result = CelestialBodySchema.safeParse(planet);
      expect(result.success).toBe(false);
    });

    it('should validate a valid moon', () => {
      const moon = {
        id: 'Sol 3 a',
        name: 'Luna',
        description: "Earth's moon",
        type: 'moon' as const,
        sprite: 'moon.png',
        parentId: 'Sol 3',
        moonLetter: 'a',
        orbitDistance: 25,
        orbitSpeed: 2,
        orbitAngle: 0,
        scale: 0.3,
        rotation: 0,
        rotationSpeed: 0,
        children: [],
      };

      const result = CelestialBodySchema.safeParse(moon);
      expect(result.success).toBe(true);
    });

    it('should reject moon letter with multiple characters', () => {
      const moon = {
        id: 'Sol 3 a',
        name: 'Luna',
        type: 'moon' as const,
        sprite: 'moon.png',
        parentId: 'Sol 3',
        moonLetter: 'ab', // too long
        orbitDistance: 25,
        orbitSpeed: 2,
        orbitAngle: 0,
        children: [],
      };

      const result = CelestialBodySchema.safeParse(moon);
      expect(result.success).toBe(false);
    });
  });

  describe('SolarSystemSchema', () => {
    it('should validate a complete solar system', () => {
      const system = {
        id: 'sol',
        name: 'Sol',
        bounds: { width: 1000, height: 1000 },
      };

      const result = SolarSystemSchema.safeParse(system);
      expect(result.success).toBe(true);
    });

    it('should use default bounds', () => {
      const system = {
        id: 'sol',
        name: 'Sol',
      };

      const result = SolarSystemSchema.safeParse(system);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.bounds).toEqual({ width: 2000, height: 2000 });
      }
    });
  });
});
