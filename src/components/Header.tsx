'use client';

import { useRef } from 'react';
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
import { isLocalMode } from '@/lib/config';
import { loadSystemFromZip } from '@/lib/zip-loader';
import { saveSystemToZip, exportSystemAsJson } from '@/lib/zip-saver';
import { solSystemTemplate } from '@/data';
import { useState } from 'react';

export function Header() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newSystemName, setNewSystemName] = useState('');

  const system = useSystemStore((state) => state.system);
  const isDirty = useSystemStore((state) => state.isDirty);
  const newSystem = useSystemStore((state) => state.newSystem);
  const loadSystem = useSystemStore((state) => state.loadSystem);
  const markClean = useSystemStore((state) => state.markClean);

  const sprites = useSpriteStore((state) => state.sprites);
  const loadSpritesFromApi = useSpriteStore((state) => state.loadSpritesFromApi);
  const loadSpritesFromZip = useSpriteStore((state) => state.loadSpritesFromZip);

  const {
    isNewSystemDialogOpen,
    openNewSystemDialog,
    closeNewSystemDialog,
  } = useUIStore();

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
    loadSystem(solSystemTemplate);
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
        const { system: loadedSystem, sprites: loadedSprites } = await loadSystemFromZip(file);
        loadSystem(loadedSystem);
        loadSpritesFromZip(loadedSprites);
      } else if (file.name.endsWith('.json')) {
        // JSON file - just load system
        const text = await file.text();
        const systemData = JSON.parse(text);
        loadSystem(systemData);

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
          body: JSON.stringify(system),
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

    const json = exportSystemAsJson(system);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `${system.name.toLowerCase().replace(/\s+/g, '-')}.json`;
    a.click();

    URL.revokeObjectURL(url);
  };

  return (
    <>
      <header className="flex h-14 items-center justify-between border-b bg-background px-4">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold">Solar System Designer</h1>
          {system && (
            <span className="text-sm text-muted-foreground">
              - {system.name}
              {isDirty && '*'}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleNew}>
            New
          </Button>
          <Button variant="outline" size="sm" onClick={handleLoadSol}>
            Load Sol
          </Button>
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
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportJson}
            disabled={!system}
          >
            Export JSON
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
