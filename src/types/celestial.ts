import { z } from 'zod';

// Vector2 schema for positions
export const Vector2Schema = z.object({
  x: z.number(),
  y: z.number(),
});

export type Vector2 = z.infer<typeof Vector2Schema>;

// Base schema without children (for extending)
const BaseCelestialBodySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().max(500).default(''),
  type: z.enum(['star', 'planet', 'moon', 'asteroid', 'station']),
  sprite: z.string(),
  position: Vector2Schema.optional(),
  scale: z.number().positive().default(1),
  rotation: z.number().default(0),
  rotationSpeed: z.number().default(0),
  parentId: z.string().nullable().default(null),
  orbitDistance: z.number().nonnegative().default(0),
  orbitSpeed: z.number().default(0),
  orbitAngle: z.number().default(0),
  baseSize: z.number().optional(),
  fallbackColor: z.string().optional(),
  orbitRingColor: z.string().optional(),
  orbitRingWidth: z.number().optional(),
  isRingOnly: z.boolean().optional(),
  // Type-specific fields (optional on base)
  planetNumber: z.number().int().positive().optional(),
  moonLetter: z.string().length(1).optional(),
  starLetter: z.string().optional(),
  luminosity: z.number().positive().optional(),
  stationType: z.enum(['research', 'mining', 'military', 'trade', 'ring']).optional(),
  beltIndex: z.number().int().positive().optional(),
});

// Recursive schema for children
export const CelestialBodySchema: z.ZodType<CelestialBody> = z.lazy(() =>
  BaseCelestialBodySchema.extend({
    children: z.array(CelestialBodySchema).default([]),
  })
);

export interface CelestialBody {
  id: string;
  name: string;
  description: string;
  type: 'star' | 'planet' | 'moon' | 'asteroid' | 'station';
  sprite: string;
  position?: { x: number; y: number };
  scale: number;
  rotation: number;
  rotationSpeed: number;
  parentId: string | null;
  orbitDistance: number;
  orbitSpeed: number;
  orbitAngle: number;
  children: CelestialBody[];
  baseSize?: number;
  fallbackColor?: string;
  orbitRingColor?: string;
  orbitRingWidth?: number;
  isRingOnly?: boolean;
  // Type-specific fields
  planetNumber?: number;
  moonLetter?: string;
  starLetter?: string;
  luminosity?: number;
  stationType?: 'research' | 'mining' | 'military' | 'trade' | 'ring';
  beltIndex?: number;
}

// Station types
export const StationTypeSchema = z.enum(['research', 'mining', 'military', 'trade', 'ring']);
export type StationType = z.infer<typeof StationTypeSchema>;

// Type aliases for specific body types (all extend base interface)
export interface Station extends CelestialBody {
  type: 'station';
  stationType: 'research' | 'mining' | 'military' | 'trade' | 'ring';
}

export interface Moon extends CelestialBody {
  type: 'moon';
  moonLetter: string;
}

export interface Planet extends CelestialBody {
  type: 'planet';
  planetNumber: number;
}

export interface Star extends CelestialBody {
  type: 'star';
  luminosity: number;
  starLetter?: string;
}

export interface Asteroid extends CelestialBody {
  type: 'asteroid';
  beltIndex?: number;
}
