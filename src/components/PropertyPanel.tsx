'use client';

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

// Property panel constants
const SCALE_MIN = 0.1;
const SCALE_MAX = 3;
const SCALE_STEP = 0.1;

const ORBIT_DISTANCE_MIN = 0;
const ORBIT_DISTANCE_MAX_PLANET = 500;
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
  const updateStar = useSystemStore((state) => state.updateStar);
  const updatePlanet = useSystemStore((state) => state.updatePlanet);
  const updateMoon = useSystemStore((state) => state.updateMoon);
  const updateStation = useSystemStore((state) => state.updateStation);
  const updateAsteroid = useSystemStore((state) => state.updateAsteroid);

  const sprites = useSpriteStore((state) => state.sprites);
  const selection = useUIStore((state) => state.selection);

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

  // Get selected object
  let selectedObject: {
    id: string;
    name: string;
    description: string;
    sprite: string;
    scale: number;
    rotation: number;
    rotationSpeed: number;
    orbitDistance?: number;
    orbitSpeed?: number;
    orbitAngle?: number;
    luminosity?: number;
    stationType?: string;
  } | null = null;

  if (selection.type === 'star') {
    selectedObject = system.stars.find((s) => s.id === selection.id) || null;
  } else if (selection.type === 'planet') {
    selectedObject = system.planets.find((p) => p.id === selection.id) || null;
  } else if (selection.type === 'moon' && selection.parentId) {
    const planet = system.planets.find((p) => p.id === selection.parentId);
    selectedObject = planet?.moons.find((m) => m.id === selection.id) || null;
  } else if (selection.type === 'station' && selection.parentId) {
    const planet = system.planets.find((p) => p.id === selection.parentId);
    selectedObject = planet?.stations.find((s) => s.id === selection.id) || null;
  } else if (selection.type === 'asteroid') {
    selectedObject = system.asteroids.find((a) => a.id === selection.id) || null;
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
    const updates = { [field]: value };

    if (selection.type === 'star') {
      updateStar(selection.id, updates);
    } else if (selection.type === 'planet') {
      updatePlanet(selection.id, updates);
    } else if (selection.type === 'moon' && selection.parentId) {
      updateMoon(selection.parentId, selection.id, updates);
    } else if (selection.type === 'station' && selection.parentId) {
      updateStation(selection.parentId, selection.id, updates);
    } else if (selection.type === 'asteroid') {
      updateAsteroid(selection.id, updates);
    }
  };

  const spriteUrl = selectedObject.sprite ? sprites.get(selectedObject.sprite) : null;

  const spriteOptions = Array.from(sprites.keys());

  return (
    <Card className="h-full overflow-auto">
      <CardHeader>
        <CardTitle>Properties - {selection.type}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* ID (read-only) */}
        <div className="space-y-2">
          <Label htmlFor="id">ID</Label>
          <Input id="id" value={selectedObject.id} disabled />
        </div>

        {/* Name */}
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={selectedObject.name}
            onChange={(e) => handleUpdate('name', e.target.value)}
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={selectedObject.description}
            onChange={(e) => handleUpdate('description', e.target.value)}
            maxLength={DESCRIPTION_MAX_LENGTH}
            rows={3}
          />
        </div>

        {/* Sprite */}
        <div className="space-y-2">
          <Label htmlFor="sprite">Sprite</Label>
          {spriteUrl && (
            <div className="flex justify-center rounded border bg-slate-900 p-2">
              <img
                src={spriteUrl}
                alt={selectedObject.sprite}
                className="h-16 w-16 object-contain"
              />
            </div>
          )}
          <Select
            value={selectedObject.sprite || ''}
            onValueChange={(value) => handleUpdate('sprite', value)}
          >
            <SelectTrigger>
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
        </div>

        {/* Scale */}
        <div className="space-y-2">
          <Label htmlFor="scale">Scale</Label>
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
              className="w-16"
            />
          </div>
        </div>

        {/* Rotation */}
        <div className="space-y-2">
          <Label htmlFor="rotation">Rotation (degrees)</Label>
          <Input
            id="rotation"
            type="number"
            value={selectedObject.rotation}
            onChange={(e) => handleUpdate('rotation', parseFloat(e.target.value) || 0)}
          />
        </div>

        {/* Rotation Speed */}
        <div className="space-y-2">
          <Label htmlFor="rotationSpeed">Rotation Speed</Label>
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
            <Label htmlFor="luminosity">Luminosity</Label>
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

        {/* Orbital properties for planets, moons, and stations */}
        {(selection.type === 'planet' || selection.type === 'moon' || selection.type === 'station') && (
          <>
            <div className="space-y-2">
              <Label htmlFor="orbitDistance">Orbit Distance</Label>
              <div className="flex items-center gap-2">
                <Slider
                  value={[selectedObject.orbitDistance ?? 0]}
                  onValueChange={([value]) => handleUpdate('orbitDistance', value)}
                  min={ORBIT_DISTANCE_MIN}
                  max={selection.type === 'planet' ? ORBIT_DISTANCE_MAX_PLANET : ORBIT_DISTANCE_MAX_CHILD}
                  step={ORBIT_DISTANCE_STEP}
                  className="flex-1"
                />
                <Input
                  id="orbitDistance"
                  type="number"
                  min={ORBIT_DISTANCE_MIN}
                  value={selectedObject.orbitDistance ?? 0}
                  onChange={(e) => handleUpdate('orbitDistance', parseFloat(e.target.value) || 0)}
                  className="w-16"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="orbitSpeed">Orbit Speed</Label>
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
                  className="w-16"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="orbitAngle">Orbit Angle (degrees)</Label>
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
                  className="w-16"
                />
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
