'use client';

import { useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSystemStore, useSpriteStore, useUIStore } from '@/stores';
import { Orbit, Play, Pause, ZoomIn, ZoomOut, RotateCcw, RefreshCw } from 'lucide-react';
import { isLocalMode } from '@/lib/config';
import { loadSystemFromZip } from '@/lib/zip-loader';
import { saveSystemToZip } from '@/lib/zip-saver';
import { solSystem, solBodies } from '@/data';
import { useState } from 'react';
import { SolarSystemSchema, CelestialBodySchema } from '@/types';
import { z } from 'zod';

const JsonFileSchema = z.object({
  system: SolarSystemSchema,
  rootBodies: z.array(CelestialBodySchema),
});

export function Header() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const spriteInputRef = useRef<HTMLInputElement>(null);
  const [newSystemName, setNewSystemName] = useState('');

  const system = useSystemStore((state) => state.system);
  const rootBodies = useSystemStore((state) => state.rootBodies);
  const isDirty = useSystemStore((state) => state.isDirty);
  const newSystem = useSystemStore((state) => state.newSystem);
  const loadSystem = useSystemStore((state) => state.loadSystem);
  const markClean = useSystemStore((state) => state.markClean);

  const sprites = useSpriteStore((state) => state.sprites);
  const loadSpritesFromApi = useSpriteStore((state) => state.loadSpritesFromApi);
  const loadSpritesFromZip = useSpriteStore((state) => state.loadSpritesFromZip);
  const addSprites = useSpriteStore((state) => state.addSprites);

  const {
    isNewSystemDialogOpen,
    openNewSystemDialog,
    closeNewSystemDialog,
    showOrbits,
    toggleOrbits,
    isAnimating,
    toggleAnimation,
    cameraZoom,
    setCameraZoom,
    resetCamera,
  } = useUIStore();

  useEffect(() => {
    if (isLocalMode()) {
      loadSpritesFromApi();
    }
  }, [loadSpritesFromApi]);

  const handleNew = () => {
    if (isDirty) {
      if (!confirm('You have unsaved changes. Create new system anyway?')) {
        return;
      }
    }
    setNewSystemName('');
    openNewSystemDialog();
  };

  const handleLoadSol = () => {
    if (isDirty) {
      if (!confirm('You have unsaved changes. Load Sol template anyway?')) {
        return;
      }
    }
    loadSystem(solSystem, solBodies);
    if (isLocalMode()) {
      loadSpritesFromApi();
    }
  };

  const handleCreateSystem = () => {
    if (!newSystemName.trim()) return;

    newSystem(newSystemName.trim());
    closeNewSystemDialog();

    // Load sprites in local mode
    if (isLocalMode()) {
      loadSpritesFromApi();
    }
  };

  const handleLoad = () => {
    if (isDirty) {
      if (!confirm('You have unsaved changes. Load anyway?')) {
        return;
      }
    }
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      if (file.name.endsWith('.zip')) {
        // Production mode - load from ZIP
        const { system: loadedSystem, rootBodies, sprites: loadedSprites } = await loadSystemFromZip(file);
        loadSystem(loadedSystem, rootBodies);
        loadSpritesFromZip(loadedSprites);
      } else if (file.name.endsWith('.json')) {
        // JSON file - load system with new format
        const text = await file.text();
        const fileData = JSON.parse(text);

        // Validate JSON data
        const parseResult = JsonFileSchema.safeParse(fileData);
        if (!parseResult.success) {
          throw new Error(`Invalid system data: ${parseResult.error.message}`);
        }

        loadSystem(parseResult.data.system, parseResult.data.rootBodies);

        // Load sprites in local mode
        if (isLocalMode()) {
          loadSpritesFromApi();
        }
      }
    } catch (error) {
      alert(`Failed to load file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Reset file input
    event.target.value = '';
  };

  const handleSave = async () => {
    if (!system) return;

    try {
      if (isLocalMode()) {
        // Local mode - save via API
        const response = await fetch('/api/systems', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ system, rootBodies }),
        });

        if (!response.ok) {
          throw new Error('Failed to save system');
        }

        markClean();
        alert('System saved successfully!');
      } else {
        // Production mode - save as ZIP
        await saveSystemToZip({
          system,
          rootBodies,
          sprites,
        });
        markClean();
      }
    } catch (error) {
      alert(`Failed to save: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleExportJson = () => {
    if (!system) return;

    const exportData = { system, rootBodies };
    const json = JSON.stringify(exportData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `${system.name.toLowerCase().replace(/\s+/g, '-')}.json`;
    a.click();

    URL.revokeObjectURL(url);
  };

  const handleImportSprites = () => {
    spriteInputRef.current?.click();
  };

  const handleSpriteFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const newSprites = new Map<string, string>();
    for (const file of files) {
      const url = URL.createObjectURL(file);
      newSprites.set(file.name, url);
    }
    addSprites(newSprites);

    event.target.value = '';
  };

  return (
    <>
      <header className="flex h-14 items-center justify-between border-b bg-background px-4">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold">
            <span className="hidden sm:inline">Solar System Designer</span>
            <span className="sm:hidden">SSD</span>
          </h1>
          {system && (
            <span className="text-sm text-muted-foreground">
              <span className="hidden sm:inline">- </span>{system.name}
              {isDirty && '*'}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 md:gap-2">
          {/* Essential buttons - always visible */}
          <Button variant="outline" size="sm" onClick={handleLoad}>
            Load
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSave}
            disabled={!system}
          >
            Save
          </Button>

          {/* Secondary buttons - hidden on mobile */}
          <Button variant="outline" size="sm" onClick={handleNew} className="hidden md:inline-flex">
            New
          </Button>
          <Button variant="outline" size="sm" onClick={handleLoadSol} className="hidden md:inline-flex">
            Load Sol
          </Button>
          {isLocalMode() ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportJson}
              disabled={!system}
              className="hidden md:inline-flex"
            >
              Export JSON
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={handleImportSprites}
              className="hidden md:inline-flex"
            >
              Import Sprites
            </Button>
          )}
          {isLocalMode() && (
            <Button
              variant="outline"
              size="sm"
              onClick={loadSpritesFromApi}
              title="Refresh Sprites"
              className="hidden md:inline-flex"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}

          <div className="mx-1 hidden h-6 w-px bg-border md:mx-2 md:block" />

          {/* View controls - hidden on mobile */}
          <Button
            variant={showOrbits ? 'default' : 'outline'}
            size="sm"
            onClick={toggleOrbits}
            title="Toggle Orbits"
            className="hidden md:inline-flex"
          >
            <Orbit className="h-4 w-4" />
          </Button>
          <Button
            variant={isAnimating ? 'default' : 'outline'}
            size="sm"
            onClick={toggleAnimation}
            title={isAnimating ? 'Pause Animation' : 'Play Animation'}
            className="hidden md:inline-flex"
          >
            {isAnimating ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>

          <div className="mx-2 hidden h-6 w-px bg-border md:block" />

          {/* Zoom controls - hidden on mobile */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCameraZoom(cameraZoom * 1.2)}
            title="Zoom In"
            className="hidden md:inline-flex"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCameraZoom(cameraZoom / 1.2)}
            title="Zoom Out"
            className="hidden md:inline-flex"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={resetCamera}
            title="Reset View"
            className="hidden md:inline-flex"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,.zip"
        onChange={handleFileSelect}
        className="hidden"
      />
      <input
        ref={spriteInputRef}
        type="file"
        accept=".png"
        multiple
        onChange={handleSpriteFileSelect}
        className="hidden"
      />

      {/* New System Dialog */}
      <Dialog open={isNewSystemDialogOpen} onOpenChange={(open) => !open && closeNewSystemDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New System</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="systemName">System Name</Label>
              <Input
                id="systemName"
                value={newSystemName}
                onChange={(e) => setNewSystemName(e.target.value)}
                placeholder="e.g., Sol, Alpha Centauri"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCreateSystem();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeNewSystemDialog}>
              Cancel
            </Button>
            <Button onClick={handleCreateSystem} disabled={!newSystemName.trim()}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
