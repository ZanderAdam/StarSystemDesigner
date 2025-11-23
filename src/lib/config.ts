/**
 * Application configuration and mode detection
 */

export const isLocalMode = (): boolean => {
  return process.env.NEXT_PUBLIC_LOCAL_MODE === 'true';
};

export const getSpriteDirPath = (): string | null => {
  return process.env.SPRITE_DIR || null;
};

export const getSystemsDirPath = (): string | null => {
  return process.env.SYSTEMS_DIR || null;
};

export const config = {
  isLocalMode,
  spriteDirPath: getSpriteDirPath,
  systemsDirPath: getSystemsDirPath,
} as const;
