import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import type { SolarSystem } from '@/types';

export interface SaveOptions {
  system: SolarSystem;
  sprites: Map<string, Blob | string>; // filename -> blob or URL
  filename?: string;
}

/**
 * Get all unique sprite filenames used in a system
 */
export function getUsedSprites(system: SolarSystem): Set<string> {
  const sprites = new Set<string>();

  for (const star of system.stars) {
    if (star.sprite) sprites.add(star.sprite);
  }

  for (const planet of system.planets) {
    if (planet.sprite) sprites.add(planet.sprite);

    for (const moon of planet.moons) {
      if (moon.sprite) sprites.add(moon.sprite);
    }

    for (const station of planet.stations) {
      if (station.sprite) sprites.add(station.sprite);
    }
  }

  for (const asteroid of system.asteroids) {
    if (asteroid.sprite) sprites.add(asteroid.sprite);
  }

  return sprites;
}

/**
 * Save a system to a ZIP file (production mode)
 */
export async function saveSystemToZip(options: SaveOptions): Promise<void> {
  const { system, sprites, filename = `${system.name.toLowerCase().replace(/\s+/g, '-')}.zip` } = options;

  const zip = new JSZip();

  // Add system.json
  const systemJson = JSON.stringify(system, null, 2);
  zip.file('system.json', systemJson);

  // Add sprites folder with used sprites
  const usedSprites = getUsedSprites(system);
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
