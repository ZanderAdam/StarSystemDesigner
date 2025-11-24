import type { Star, Planet, Moon, Station, Asteroid, StationType } from '@/types';
import { SystemNaming } from './naming';

export function createDefaultStar(systemName: string, starIndex: number = 0): Star {
  const id = SystemNaming.generateStarId(systemName, starIndex);
  return {
    id,
    name: id,
    description: '',
    type: 'star',
    sprite: '',
    scale: 1,
    rotation: 0,
    rotationSpeed: 0,
    parentId: null,
    orbitDistance: 0,
    orbitSpeed: 0,
    orbitAngle: 0,
    children: [],
    luminosity: 1,
    starLetter: starIndex > 0 ? String.fromCharCode(65 + starIndex - 1) : undefined,
    baseSize: 64,
    fallbackColor: '#FFD700',
    orbitRingColor: '',
    orbitRingWidth: 0,
    isRingOnly: false,
  };
}

export function createDefaultPlanet(
  systemName: string,
  starId: string,
  planetNumber: number
): Planet {
  const id = SystemNaming.generatePlanetId(systemName, starId, planetNumber);
  return {
    id,
    name: id,
    description: '',
    type: 'planet',
    sprite: '',
    parentId: starId,
    orbitDistance: 100 + (planetNumber - 1) * 80,
    orbitSpeed: 1,
    orbitAngle: Math.random() * 360,
    scale: 1,
    rotation: 0,
    rotationSpeed: 0,
    children: [],
    planetNumber,
    baseSize: 48,
    fallbackColor: '#6366F1',
    orbitRingColor: 'rgba(100, 116, 139, 0.3)',
    orbitRingWidth: 1,
    isRingOnly: false,
  };
}

export function createDefaultMoon(
  planetId: string,
  moonIndex: number
): Moon {
  const id = SystemNaming.generateMoonId(planetId, moonIndex);
  const moonLetter = String.fromCharCode(97 + moonIndex);
  return {
    id,
    name: id,
    description: '',
    type: 'moon',
    sprite: '',
    parentId: planetId,
    orbitDistance: 30 + moonIndex * 10,
    orbitSpeed: 2,
    orbitAngle: Math.random() * 360,
    scale: 0.5,
    rotation: 0,
    rotationSpeed: 0,
    children: [],
    moonLetter,
    baseSize: 24,
    fallbackColor: '#94A3B8',
    orbitRingColor: 'rgba(100, 116, 139, 0.2)',
    orbitRingWidth: 0.5,
    isRingOnly: false,
  };
}

export function createDefaultStation(
  parentId: string,
  stationType: StationType,
  stationIndex: number
): Station {
  const id = SystemNaming.generateStationId(parentId, stationType, stationIndex);
  return {
    id,
    name: id,
    description: '',
    type: 'station',
    sprite: '',
    parentId,
    orbitDistance: 40 + stationIndex * 5,
    orbitSpeed: 3,
    orbitAngle: Math.random() * 360,
    scale: 0.5,
    rotation: 0,
    rotationSpeed: 0,
    children: [],
    stationType,
    baseSize: 20,
    fallbackColor: '#EAB308',
    orbitRingColor: 'rgba(234, 179, 8, 0.2)',
    orbitRingWidth: 0.5,
    isRingOnly: false,
  };
}

export function createDefaultAsteroid(
  systemName: string,
  beltIndex: number
): Asteroid {
  const id = SystemNaming.generateAsteroidId(systemName, beltIndex);
  return {
    id,
    name: id,
    description: '',
    type: 'asteroid',
    sprite: '',
    parentId: null,
    orbitDistance: 200,
    orbitSpeed: 0,
    orbitAngle: 0,
    scale: 1,
    rotation: 0,
    rotationSpeed: 0,
    children: [],
    beltIndex,
    baseSize: 0,
    fallbackColor: 'rgba(156, 163, 175, 0.15)',
    orbitRingColor: 'rgba(156, 163, 175, 0.15)',
    orbitRingWidth: 3,
    isRingOnly: true,
  };
}
