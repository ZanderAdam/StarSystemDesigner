import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import type { SolarSystem, CelestialBody } from '@/types';

export interface SaveOptions {
  system: SolarSystem;
  rootBodies: CelestialBody[];
  sprites: Map<string, Blob | string>; // filename -> blob or URL
  filename?: string;
}

/**
 * Get all unique sprite filenames used in a tree of bodies
 */
export function getUsedSprites(rootBodies: CelestialBody[]): Set<string> {
  const sprites = new Set<string>();

  const collectSprites = (bodies: CelestialBody[]) => {
    for (const body of bodies) {
      if (body.sprite) sprites.add(body.sprite);
      collectSprites(body.children);
    }
  };

  collectSprites(rootBodies);
  return sprites;
}

/**
 * Save a system to a ZIP file (production mode)
 */
export async function saveSystemToZip(options: SaveOptions): Promise<void> {
  const { system, rootBodies, sprites, filename = `${system.name.toLowerCase().replace(/\s+/g, '-')}.zip` } = options;

  const zip = new JSZip();

  // Add system.json with new format
  const systemData = { system, rootBodies };
  const systemJson = JSON.stringify(systemData, null, 2);
  zip.file('system.json', systemJson);

  // Add sprites folder with used sprites
  const usedSprites = getUsedSprites(rootBodies);
  const spritesFolder = zip.folder('sprites');

  if (spritesFolder) {
    for (const spriteName of usedSprites) {
      const spriteData = sprites.get(spriteName);

      if (spriteData) {
        if (typeof spriteData === 'string') {
          // It's a URL, fetch it
          const response = await fetch(spriteData);
          const blob = await response.blob();
          spritesFolder.file(spriteName, blob);
        } else {
          // It's already a blob
          spritesFolder.file(spriteName, spriteData);
        }
      }
    }
  }

  // Generate and download
  const blob = await zip.generateAsync({ type: 'blob' });
  saveAs(blob, filename);
}

/**
 * Export system as JSON only (for local mode or raw export)
 */
export function exportSystemAsJson(system: SolarSystem): string {
  return JSON.stringify(system, null, 2);
}
