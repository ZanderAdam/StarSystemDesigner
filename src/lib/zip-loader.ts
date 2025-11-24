import JSZip from 'jszip';
import { SolarSystemSchema, CelestialBodySchema, type SolarSystem, type CelestialBody } from '@/types';
import { z } from 'zod';

export interface LoadedSystem {
  system: SolarSystem;
  rootBodies: CelestialBody[];
  sprites: Map<string, string>; // filename -> blob URL
}

// Schema for the ZIP file format
const ZipFileSchema = z.object({
  system: SolarSystemSchema,
  rootBodies: z.array(CelestialBodySchema),
});

/**
 * Load a system from a ZIP file (production mode)
 */
export async function loadSystemFromZip(file: File): Promise<LoadedSystem> {
  const zip = await JSZip.loadAsync(file);

  // Load system.json
  const systemFile = zip.file('system.json');
  if (!systemFile) {
    throw new Error('ZIP file does not contain system.json');
  }

  const systemJson = await systemFile.async('string');
  const systemData = JSON.parse(systemJson);

  // Validate system data
  const parseResult = ZipFileSchema.safeParse(systemData);
  if (!parseResult.success) {
    throw new Error(`Invalid system data: ${parseResult.error.message}`);
  }

  const { system, rootBodies } = parseResult.data;

  // Load sprites
  const sprites = new Map<string, string>();
  const spriteFolder = zip.folder('sprites');

  if (spriteFolder) {
    const spriteFiles = spriteFolder.filter((_, file) => !file.dir);

    for (const spriteFile of spriteFiles) {
      const filename = spriteFile.name.replace('sprites/', '');
      const blob = await spriteFile.async('blob');
      const blobUrl = URL.createObjectURL(blob);
      sprites.set(filename, blobUrl);
    }
  }

  return { system, rootBodies, sprites };
}

/**
 * Clean up blob URLs when done with loaded sprites
 */
export function releaseLoadedSprites(sprites: Map<string, string>): void {
  for (const blobUrl of sprites.values()) {
    URL.revokeObjectURL(blobUrl);
  }
  sprites.clear();
}
