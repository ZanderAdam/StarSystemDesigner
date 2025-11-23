import { z } from 'zod';
import {
  StarSchema,
  PlanetSchema,
  AsteroidSchema,
  Vector2Schema,
} from './celestial';

// System bounds
export const BoundsSchema = z.object({
  width: z.number().positive(),
  height: z.number().positive(),
});

export type Bounds = z.infer<typeof BoundsSchema>;

// Solar system schema
export const SolarSystemSchema = z.object({
  id: z.string(),
  name: z.string(),
  stars: z.array(StarSchema).min(1),
  planets: z.array(PlanetSchema).default([]),
  asteroids: z.array(AsteroidSchema).default([]),
  bounds: BoundsSchema.default({ width: 2000, height: 2000 }),
});

export type SolarSystem = z.infer<typeof SolarSystemSchema>;

// Galaxy system entry (system placed in galaxy)
export const GalaxySystemEntrySchema = z.object({
  system: SolarSystemSchema,
  position: Vector2Schema,
});

export type GalaxySystemEntry = z.infer<typeof GalaxySystemEntrySchema>;

// Galaxy schema
export const GalaxySchema = z.object({
  name: z.string(),
  systems: z.array(GalaxySystemEntrySchema).default([]),
});

export type Galaxy = z.infer<typeof GalaxySchema>;

// Export format metadata
export const ExportMetadataSchema = z.object({
  formatVersion: z.string().default('1.0'),
  created: z.string().datetime(),
  modified: z.string().datetime(),
  author: z.string().default('Solar System Designer'),
});

export type ExportMetadata = z.infer<typeof ExportMetadataSchema>;

// Full export format
export const SystemExportSchema = z.object({
  formatVersion: z.string().default('1.0'),
  systemId: z.string(),
  systemName: z.string(),
  metadata: ExportMetadataSchema,
  stars: z.array(StarSchema),
  planets: z.array(PlanetSchema),
  asteroids: z.array(AsteroidSchema),
});

export type SystemExport = z.infer<typeof SystemExportSchema>;
