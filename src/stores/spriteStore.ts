import { create } from 'zustand';

interface SpriteState {
  sprites: Map<string, string>; // filename -> URL (local path or blob URL)
  isLoading: boolean;
  error: string | null;
}

interface SpriteActions {
  loadSpritesFromApi: () => Promise<void>;
  loadSpritesFromZip: (sprites: Map<string, string>) => void;
  addSprites: (newSprites: Map<string, string>) => void;
  clearSprites: () => void;
  getSpriteUrl: (filename: string) => string | undefined;
}

export const useSpriteStore = create<SpriteState & SpriteActions>()((set, get) => ({
  sprites: new Map(),
  isLoading: false,
  error: null,

  loadSpritesFromApi: async () => {
    set({ isLoading: true, error: null });

    try {
      const response = await fetch('/api/sprites');

      if (!response.ok) {
        throw new Error('Failed to fetch sprites');
      }

      const data = await response.json();
      const sprites = new Map<string, string>();

      for (const sprite of data.sprites) {
        // In local mode, sprites are served from the API
        sprites.set(sprite.filename, `/api/sprites/${sprite.filename}`);
      }

      set({ sprites, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load sprites',
        isLoading: false,
      });
    }
  },

  loadSpritesFromZip: (sprites: Map<string, string>) => {
    // Release old blob URLs
    const oldSprites = get().sprites;
    for (const url of oldSprites.values()) {
      if (url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    }

    set({ sprites, isLoading: false, error: null });
  },

  addSprites: (newSprites: Map<string, string>) => {
    const currentSprites = get().sprites;
    const merged = new Map(currentSprites);
    for (const [key, value] of newSprites) {
      merged.set(key, value);
    }
    set({ sprites: merged, error: null });
  },

  clearSprites: () => {
    const oldSprites = get().sprites;
    for (const url of oldSprites.values()) {
      if (url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    }

    set({ sprites: new Map(), error: null });
  },

  getSpriteUrl: (filename: string) => {
    return get().sprites.get(filename);
  },
}));
