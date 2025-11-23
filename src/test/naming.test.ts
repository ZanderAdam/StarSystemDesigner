import { describe, it, expect } from 'vitest';
import { SystemNaming } from '@/lib/naming';

describe('SystemNaming', () => {
  describe('generateStarId', () => {
    it('should return system name for primary star', () => {
      expect(SystemNaming.generateStarId('Sol', 0)).toBe('Sol');
    });

    it('should add letter suffix for companion stars', () => {
      expect(SystemNaming.generateStarId('Sol', 1)).toBe('Sol A');
      expect(SystemNaming.generateStarId('Sol', 2)).toBe('Sol B');
      expect(SystemNaming.generateStarId('Sol', 3)).toBe('Sol C');
    });

    it('should work with multi-word system names', () => {
      expect(SystemNaming.generateStarId('Alpha Centauri', 0)).toBe('Alpha Centauri');
      expect(SystemNaming.generateStarId('Alpha Centauri', 1)).toBe('Alpha Centauri A');
    });
  });

  describe('generatePlanetId', () => {
    it('should generate planet ID for primary star', () => {
      expect(SystemNaming.generatePlanetId('Sol', 'Sol', 1)).toBe('Sol 1');
      expect(SystemNaming.generatePlanetId('Sol', 'Sol', 3)).toBe('Sol 3');
    });

    it('should include star letter for companion stars', () => {
      expect(SystemNaming.generatePlanetId('Sol', 'Sol A', 1)).toBe('Sol A 1');
      expect(SystemNaming.generatePlanetId('Sol', 'Sol B', 2)).toBe('Sol B 2');
    });
  });

  describe('generateMoonId', () => {
    it('should add lowercase letter for moons', () => {
      expect(SystemNaming.generateMoonId('Sol 3', 0)).toBe('Sol 3 a');
      expect(SystemNaming.generateMoonId('Sol 3', 1)).toBe('Sol 3 b');
      expect(SystemNaming.generateMoonId('Sol 5', 3)).toBe('Sol 5 d');
    });
  });

  describe('generateAsteroidId', () => {
    it('should generate belt IDs', () => {
      expect(SystemNaming.generateAsteroidId('Sol', 1)).toBe('Sol Belt 1');
      expect(SystemNaming.generateAsteroidId('Sol', 2)).toBe('Sol Belt 2');
    });
  });

  describe('generateStationId', () => {
    it('should generate station IDs with capitalized type', () => {
      expect(SystemNaming.generateStationId('Sol 3', 'research', 1)).toBe('Sol 3 Research 1');
      expect(SystemNaming.generateStationId('Sol 3 a', 'mining', 2)).toBe('Sol 3 a Mining 2');
    });
  });

  describe('parseId', () => {
    it('should parse simple system name', () => {
      const result = SystemNaming.parseId('Sol');
      expect(result.systemName).toBe('Sol');
      expect(result.starLetter).toBeUndefined();
      expect(result.planetNumber).toBeUndefined();
    });

    it('should parse planet ID', () => {
      const result = SystemNaming.parseId('Sol 3');
      expect(result.systemName).toBe('Sol');
      expect(result.planetNumber).toBe(3);
    });

    it('should parse moon ID', () => {
      const result = SystemNaming.parseId('Sol 3 a');
      expect(result.systemName).toBe('Sol');
      expect(result.planetNumber).toBe(3);
      expect(result.moonLetter).toBe('a');
    });
  });
});
