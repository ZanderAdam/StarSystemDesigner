import { z } from 'zod';
import { Vector2Schema } from './celestial';

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
