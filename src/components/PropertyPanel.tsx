'use client';

import { useState, useEffect } from 'react';
import { useSystemStore, useSpriteStore, useUIStore } from '@/stores';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { isLocalMode } from '@/lib/config';
import Image from 'next/image';

// Property panel constants
const SCALE_MIN = 0.1;
const SCALE_MAX = 3;
const SCALE_STEP = 0.1;

const ORBIT_DISTANCE_MIN = 10;
const ORBIT_DISTANCE_MAX_PLANET = 10000;
const ORBIT_DISTANCE_MAX_CHILD = 100;
const ORBIT_DISTANCE_STEP = 1;

const ORBIT_SPEED_MIN = 0;
const ORBIT_SPEED_MAX = 10;
const ORBIT_SPEED_STEP = 0.1;

const ORBIT_ANGLE_MIN = 0;
const ORBIT_ANGLE_MAX = 360;
const ORBIT_ANGLE_STEP = 1;

const DESCRIPTION_MAX_LENGTH = 500;

export function PropertyPanel() {
  const system = useSystemStore((state) => state.system);
  // Subscribe to rootBodies to trigger re-renders when tree updates
  const rootBodies = useSystemStore((state) => state.rootBodies);
  const findBody = useSystemStore((state) => state.findBody);
  const updateBody = useSystemStore((state) => state.updateBody);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  void rootBodies; // Used only to trigger re-renders

  const sprites = useSpriteStore((state) => state.sprites);
  const loadSpritesFromApi = useSpriteStore((state) => state.loadSpritesFromApi);
  const selection = useUIStore((state) => state.selection);

  // Local state for text fields to avoid store updates on every keystroke
  const [localName, setLocalName] = useState('');
  const [localDescription, setLocalDescription] = useState('');

  // Get selected object from tree
  const selectedObject = selection ? findBody(selection.id) : null;

  // Sync local state when selection changes
  useEffect(() => {
    setLocalName(selectedObject?.name ?? '');
    setLocalDescription(selectedObject?.description ?? '');
  }, [selectedObject?.id, selectedObject?.name, selectedObject?.description]);

  if (!selection || !system) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Properties</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Select an object to edit its properties
        </CardContent>
      </Card>
    );
  }

  if (!selectedObject) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Properties</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Selected object not found
        </CardContent>
      </Card>
    );
  }

  const handleUpdate = (field: string, value: string | number) => {
    if (!selectedObject) return;

    const updatedBody = { ...selectedObject, [field]: value };
    updateBody(updatedBody);
  };

  const spriteUrl = selectedObject.sprite ? sprites.get(selectedObject.sprite) : null;

  const spriteOptions = Array.from(sprites.keys());

  return (
    <Card className="h-full overflow-auto select-none">
      <CardHeader>
        <CardTitle>Properties - {selection.type}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* ID (read-only) */}
        <div className="space-y-2">
          <Label htmlFor="id" className="select-none">ID</Label>
          <Input id="id" value={selectedObject.id} disabled />
        </div>

        {/* Name */}
        <div className="space-y-2">
          <Label htmlFor="name" className="select-none">Name</Label>
          <Input
            id="name"
            value={localName}
            onChange={(e) => setLocalName(e.target.value)}
            onBlur={() => handleUpdate('name', localName)}
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description" className="select-none">Description</Label>
          <Textarea
            id="description"
            value={localDescription}
            onChange={(e) => setLocalDescription(e.target.value)}
            onBlur={() => handleUpdate('description', localDescription)}
            maxLength={DESCRIPTION_MAX_LENGTH}
            rows={3}
          />
        </div>

        {/* Sprite */}
        <div className="space-y-2">
          {spriteUrl && (
            <div className="flex justify-center rounded border bg-slate-900 p-2">
              <Image
                src={spriteUrl}
                alt={selectedObject.sprite}
                width={64}
                height={64}
                className="h-16 w-16 object-contain"
              />
            </div>
          )}
          <div className="flex gap-2">
            <Select
              value={selectedObject.sprite || ''}
              onValueChange={(value) => handleUpdate('sprite', value)}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select sprite" />
              </SelectTrigger>
              <SelectContent>
                {spriteOptions.map((sprite) => (
                  <SelectItem key={sprite} value={sprite}>
                    {sprite}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isLocalMode() && (
              <Button
                variant="outline"
                size="icon"
                onClick={loadSpritesFromApi}
                title="Refresh Sprites"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Scale */}
        <div className="space-y-2">
          <Label htmlFor="scale" className="select-none">Scale</Label>
          <div className="flex items-center gap-2">
            <Slider
              value={[selectedObject.scale]}
              onValueChange={([value]) => handleUpdate('scale', value)}
              min={SCALE_MIN}
              max={SCALE_MAX}
              step={SCALE_STEP}
              className="flex-1"
            />
            <Input
              id="scale"
              type="number"
              step={SCALE_STEP}
              min={SCALE_MIN}
              value={selectedObject.scale}
              onChange={(e) => handleUpdate('scale', parseFloat(e.target.value) || 1)}
              className="w-24"
            />
          </div>
        </div>

        {/* Rotation */}
        <div className="space-y-2">
          <Label htmlFor="rotation" className="select-none">Rotation (degrees)</Label>
          <Input
            id="rotation"
            type="number"
            value={selectedObject.rotation}
            onChange={(e) => handleUpdate('rotation', parseFloat(e.target.value) || 0)}
          />
        </div>

        {/* Rotation Speed */}
        <div className="space-y-2">
          <Label htmlFor="rotationSpeed" className="select-none">Rotation Speed</Label>
          <Input
            id="rotationSpeed"
            type="number"
            step="0.1"
            value={selectedObject.rotationSpeed}
            onChange={(e) => handleUpdate('rotationSpeed', parseFloat(e.target.value) || 0)}
          />
        </div>

        {/* Star-specific: Luminosity */}
        {selection.type === 'star' && selectedObject.luminosity !== undefined && (
          <div className="space-y-2">
            <Label htmlFor="luminosity" className="select-none">Luminosity</Label>
            <Input
              id="luminosity"
              type="number"
              step="0.1"
              min="0.1"
              value={selectedObject.luminosity}
              onChange={(e) => handleUpdate('luminosity', parseFloat(e.target.value) || 1)}
            />
          </div>
        )}

        {/* Orbital properties for planets, moons, stations, and asteroids */}
        {(selection.type === 'planet' || selection.type === 'moon' || selection.type === 'station' || selection.type === 'asteroid') && (
          <>
            <div className="space-y-2">
              <Label htmlFor="orbitDistance" className="select-none">Orbit Distance</Label>
              <div className="flex items-center gap-2">
                <Slider
                  value={[selectedObject.orbitDistance ?? 0]}
                  onValueChange={([value]) => handleUpdate('orbitDistance', value)}
                  min={ORBIT_DISTANCE_MIN}
                  max={selection.type === 'planet' || selection.type === 'asteroid' ? ORBIT_DISTANCE_MAX_PLANET : ORBIT_DISTANCE_MAX_CHILD}
                  step={ORBIT_DISTANCE_STEP}
                  className="flex-1"
                />
                <Input
                  id="orbitDistance"
                  type="number"
                  min={ORBIT_DISTANCE_MIN}
                  value={selectedObject.orbitDistance ?? 0}
                  onChange={(e) => handleUpdate('orbitDistance', parseFloat(e.target.value) || 0)}
                  className="w-24"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="orbitSpeed" className="select-none">Orbit Speed</Label>
              <div className="flex items-center gap-2">
                <Slider
                  value={[selectedObject.orbitSpeed ?? 1]}
                  onValueChange={([value]) => handleUpdate('orbitSpeed', value)}
                  min={ORBIT_SPEED_MIN}
                  max={ORBIT_SPEED_MAX}
                  step={ORBIT_SPEED_STEP}
                  className="flex-1"
                />
                <Input
                  id="orbitSpeed"
                  type="number"
                  step={ORBIT_SPEED_STEP}
                  value={selectedObject.orbitSpeed ?? 1}
                  onChange={(e) => handleUpdate('orbitSpeed', parseFloat(e.target.value) || 0)}
                  className="w-24"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="orbitAngle" className="select-none">Orbit Angle (degrees)</Label>
              <div className="flex items-center gap-2">
                <Slider
                  value={[selectedObject.orbitAngle ?? 0]}
                  onValueChange={([value]) => handleUpdate('orbitAngle', value)}
                  min={ORBIT_ANGLE_MIN}
                  max={ORBIT_ANGLE_MAX}
                  step={ORBIT_ANGLE_STEP}
                  className="flex-1"
                />
                <Input
                  id="orbitAngle"
                  type="number"
                  value={selectedObject.orbitAngle ?? 0}
                  onChange={(e) => handleUpdate('orbitAngle', parseFloat(e.target.value) || 0)}
                  className="w-24"
                />
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
