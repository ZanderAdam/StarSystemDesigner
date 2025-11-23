/**
 * Application configuration and mode detection
 */

export const isLocalMode = (): boolean => {
  return process.env.NEXT_PUBLIC_LOCAL_MODE === 'true';
};

export const getSpriteDirPath = (): string | null => {
  console.log('SPRITE_DIR:', process.env.SPRITE_DIR);
  return process.env.SPRITE_DIR || null;
};

export const getSystemsDirPath = (): string | null => {
  console.log('SYSTEMS_DIR:', process.env.SYSTEMS_DIR);
  return process.env.SYSTEMS_DIR || null;
};

export const config = {
  isLocalMode,
  spriteDirPath: getSpriteDirPath,
  systemsDirPath: getSystemsDirPath,
} as const;
