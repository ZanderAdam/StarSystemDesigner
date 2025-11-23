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

export function PropertyPanel() {
  const system = useSystemStore((state) => state.system);
  const updateStar = useSystemStore((state) => state.updateStar);
  const updatePlanet = useSystemStore((state) => state.updatePlanet);
  const updateMoon = useSystemStore((state) => state.updateMoon);

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
  } | null = null;

  if (selection.type === 'star') {
    selectedObject = system.stars.find((s) => s.id === selection.id) || null;
  } else if (selection.type === 'planet') {
    selectedObject = system.planets.find((p) => p.id === selection.id) || null;
  } else if (selection.type === 'moon' && selection.parentId) {
    const planet = system.planets.find((p) => p.id === selection.parentId);
    selectedObject = planet?.moons.find((m) => m.id === selection.id) || null;
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
    }
  };

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
            maxLength={500}
            rows={3}
          />
        </div>

        {/* Sprite */}
        <div className="space-y-2">
          <Label htmlFor="sprite">Sprite</Label>
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
          <Input
            id="scale"
            type="number"
            step="0.1"
            min="0.1"
            value={selectedObject.scale}
            onChange={(e) => handleUpdate('scale', parseFloat(e.target.value) || 1)}
          />
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

        {/* Orbital properties for planets and moons */}
        {(selection.type === 'planet' || selection.type === 'moon') && (
          <>
            <div className="space-y-2">
              <Label htmlFor="orbitDistance">Orbit Distance</Label>
              <Input
                id="orbitDistance"
                type="number"
                min="0"
                value={selectedObject.orbitDistance ?? 0}
                onChange={(e) => handleUpdate('orbitDistance', parseFloat(e.target.value) || 0)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="orbitSpeed">Orbit Speed</Label>
              <Input
                id="orbitSpeed"
                type="number"
                step="0.1"
                value={selectedObject.orbitSpeed ?? 1}
                onChange={(e) => handleUpdate('orbitSpeed', parseFloat(e.target.value) || 0)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="orbitAngle">Orbit Angle (degrees)</Label>
              <Input
                id="orbitAngle"
                type="number"
                value={selectedObject.orbitAngle ?? 0}
                onChange={(e) => handleUpdate('orbitAngle', parseFloat(e.target.value) || 0)}
              />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
