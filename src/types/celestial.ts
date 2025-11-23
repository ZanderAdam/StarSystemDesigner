import { z } from 'zod';

// Vector2 schema for positions
export const Vector2Schema = z.object({
  x: z.number(),
  y: z.number(),
});

export type Vector2 = z.infer<typeof Vector2Schema>;

// Base celestial body schema
export const CelestialBodySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().max(500).default(''),
  type: z.enum(['star', 'planet', 'moon', 'asteroid', 'station']),
  sprite: z.string(),
  position: Vector2Schema.optional(),
  scale: z.number().positive().default(1),
  rotation: z.number().default(0),
  rotationSpeed: z.number().default(0),
});

export type CelestialBody = z.infer<typeof CelestialBodySchema>;

// Station types
export const StationTypeSchema = z.enum(['research', 'mining', 'military', 'trade', 'ring']);
export type StationType = z.infer<typeof StationTypeSchema>;

// Station schema
export const StationSchema = CelestialBodySchema.extend({
  type: z.literal('station'),
  stationType: StationTypeSchema,
  parentId: z.string(),
  orbitDistance: z.number().nonnegative().default(20),
  orbitSpeed: z.number().default(1),
  orbitAngle: z.number().default(0),
});

export type Station = z.infer<typeof StationSchema>;

// Moon schema
export const MoonSchema = CelestialBodySchema.extend({
  type: z.literal('moon'),
  parentPlanetId: z.string(),
  moonLetter: z.string().length(1),
  orbitDistance: z.number().nonnegative(),
  orbitSpeed: z.number().default(1),
  orbitAngle: z.number().default(0),
});

export type Moon = z.infer<typeof MoonSchema>;

// Planet schema
export const PlanetSchema = CelestialBodySchema.extend({
  type: z.literal('planet'),
  parentStarId: z.string(),
  planetNumber: z.number().int().positive(),
  orbitDistance: z.number().nonnegative(),
  orbitSpeed: z.number().default(1),
  orbitAngle: z.number().default(0),
  moons: z.array(MoonSchema).default([]),
  stations: z.array(StationSchema).default([]),
});

export type Planet = z.infer<typeof PlanetSchema>;

// Star schema
export const StarSchema = CelestialBodySchema.extend({
  type: z.literal('star'),
  starLetter: z.string().optional(),
  luminosity: z.number().positive().default(1),
});

export type Star = z.infer<typeof StarSchema>;

// Asteroid schema
export const AsteroidSchema = CelestialBodySchema.extend({
  type: z.literal('asteroid'),
  beltIndex: z.number().int().positive().optional(),
  orbitDistance: z.number().nonnegative().optional(),
});

export type Asteroid = z.infer<typeof AsteroidSchema>;
