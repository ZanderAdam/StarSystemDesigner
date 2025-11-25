'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useSystemStore, useUIStore } from '@/stores';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  ChevronRight,
  ChevronDown,
  Plus,
  Trash2,
  Star,
  Globe,
  Moon,
  Building,
  Circle,
} from 'lucide-react';
import type { CelestialBody, Planet, Star as StarType } from '@/types';
import { createDefaultPlanet, createDefaultMoon, createDefaultStation, createDefaultAsteroid } from '@/lib/defaults';

export function HierarchyTree() {
  const system = useSystemStore((state) => state.system);
  const rootBodies = useSystemStore((state) => state.rootBodies);
  const addBody = useSystemStore((state) => state.addBody);
  const removeBody = useSystemStore((state) => state.removeBody);

  const selection = useUIStore((state) => state.selection);
  const select = useUIStore((state) => state.select);
  const setFocusTarget = useUIStore((state) => state.setFocusTarget);

  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastClickRef = useRef<{ type: string; id: string; time: number } | null>(null);

  useEffect(() => {
    return () => {
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
        clickTimeoutRef.current = null;
      }
    };
  }, []);

  // Get stars and asteroids from root
  const stars = useMemo(() =>
    rootBodies.filter(b => b.type === 'star') as StarType[],
    [rootBodies]
  );
  const asteroids = useMemo(() =>
    rootBodies.filter(b => b.type === 'asteroid'),
    [rootBodies]
  );

  // Calculate expandable nodes
  const allNodeIds = useMemo(() => {
    const ids = new Set<string>();
    const addIds = (bodies: CelestialBody[]) => {
      for (const body of bodies) {
        if (body.children.length > 0) {
          ids.add(body.id);
          addIds(body.children);
        }
      }
    };
    addIds(rootBodies);
    return ids;
  }, [rootBodies]);

  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (allNodeIds.size > 0) {
      setExpandedNodes(allNodeIds);
    }
  }, [allNodeIds]);

  if (!system) {
    return (
      <div className="flex h-full items-center justify-center p-4 text-muted-foreground">
        No system loaded
      </div>
    );
  }

  const toggleExpanded = (nodeId: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const isSelected = (type: string, id: string) => {
    if (!selection) return false;
    return selection.type === type && selection.id === id;
  };

  const handleItemClick = (
    type: CelestialBody['type'],
    id: string,
    parentId?: string
  ) => {
    const now = Date.now();
    const lastClick = lastClickRef.current;

    if (lastClick && lastClick.type === type && lastClick.id === id && now - lastClick.time < 300) {
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
        clickTimeoutRef.current = null;
      }
      lastClickRef.current = null;
      setFocusTarget({ type, id, parentId });
      return;
    }

    lastClickRef.current = { type, id, time: now };

    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
    }

    clickTimeoutRef.current = setTimeout(() => {
      select({ type, id, parentId });
      clickTimeoutRef.current = null;
    }, 200);
  };

  const handleAddPlanet = (starId: string, star: CelestialBody, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!system) return;
    const planetNumber = star.children.filter(c => c.type === 'planet').length + 1;
    const planet = createDefaultPlanet(system.name, starId, planetNumber);
    addBody(planet);
    select({ type: 'planet', id: planet.id });
    setExpandedNodes((prev) => new Set([...prev, starId]));
  };

  const handleAddMoon = (planetId: string, planet: CelestialBody, e: React.MouseEvent) => {
    e.stopPropagation();
    const moonIndex = planet.children.filter(c => c.type === 'moon').length;
    const moon = createDefaultMoon(planetId, moonIndex);
    addBody(moon);
    select({ type: 'moon', id: moon.id, parentId: planetId });
    setExpandedNodes((prev) => new Set([...prev, planetId]));
  };

  const handleAddStation = (planetId: string, planet: CelestialBody, e: React.MouseEvent) => {
    e.stopPropagation();
    const stationIndex = planet.children.filter(c => c.type === 'station').length + 1;
    const station = createDefaultStation(planetId, 'research', stationIndex);
    addBody(station);
    select({ type: 'station', id: station.id, parentId: planetId });
    setExpandedNodes((prev) => new Set([...prev, planetId]));
  };

  const handleAddAsteroid = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!system) return;
    const beltIndex = asteroids.length + 1;
    const asteroid = createDefaultAsteroid(system.name, beltIndex);
    addBody(asteroid);
    select({ type: 'asteroid', id: asteroid.id });
  };

  const handleDelete = (body: CelestialBody, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (selection?.id === body.id) {
      select(null);
    }
    removeBody(body);
  };

  const TreeItem = ({
    icon: Icon,
    label,
    sublabel,
    isSelected,
    onClick,
    onDelete,
    actions,
    children,
    nodeId,
    hasChildren,
  }: {
    icon: React.ElementType;
    label: string;
    sublabel?: string;
    isSelected: boolean;
    onClick: () => void;
    onDelete?: (e: React.MouseEvent) => void;
    actions?: React.ReactNode;
    children?: React.ReactNode;
    nodeId: string;
    hasChildren?: boolean;
  }) => {
    const isExpanded = expandedNodes.has(nodeId);

    if (hasChildren) {
      return (
        <Collapsible open={isExpanded} onOpenChange={() => toggleExpanded(nodeId)}>
          <div
            className={`group flex items-center gap-1 rounded px-2 py-1 cursor-pointer hover:bg-accent ${
              isSelected ? 'bg-accent' : ''
            }`}
          >
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="icon" className="h-4 w-4 p-0">
                {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              </Button>
            </CollapsibleTrigger>
            <div className="flex flex-1 items-center gap-1" onClick={onClick}>
              <Icon className="h-4 w-4 shrink-0" />
              <span className="flex-1 truncate text-sm">{label}</span>
              {sublabel && <span className="text-xs text-muted-foreground">{sublabel}</span>}
            </div>
            <div className="flex gap-0.5">
              {actions}
              {onDelete && (
                <Button variant="ghost" size="icon" className="h-5 w-5 p-0 text-destructive hover:text-destructive" onClick={onDelete}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
          <CollapsibleContent className="pl-4">{children}</CollapsibleContent>
        </Collapsible>
      );
    }

    return (
      <div
        className={`group flex items-center gap-1 rounded px-2 py-1 cursor-pointer hover:bg-accent ${isSelected ? 'bg-accent' : ''}`}
        onClick={onClick}
      >
        <div className="w-4" />
        <Icon className="h-4 w-4 shrink-0" />
        <span className="flex-1 truncate text-sm">{label}</span>
        {sublabel && <span className="text-xs text-muted-foreground">{sublabel}</span>}
        <div className="flex gap-0.5">
          {actions}
          {onDelete && (
            <Button variant="ghost" size="icon" className="h-5 w-5 p-0 text-destructive hover:text-destructive" onClick={onDelete}>
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
    );
  };

  const renderBody = (body: CelestialBody): React.ReactNode => {
    const iconMap = {
      star: Star,
      planet: Globe,
      moon: Moon,
      station: Building,
      asteroid: Circle,
    };
    const Icon = iconMap[body.type];
    const hasChildren = body.children.length > 0;

    let actions: React.ReactNode = null;
    if (body.type === 'star') {
      actions = (
        <Button variant="ghost" size="icon" className="h-5 w-5 p-0" onClick={(e) => handleAddPlanet(body.id, body, e)} title="Add Planet">
          <Plus className="h-3 w-3" />
        </Button>
      );
    } else if (body.type === 'planet') {
      actions = (
        <>
          <Button variant="ghost" size="icon" className="h-5 w-5 p-0" onClick={(e) => handleAddMoon(body.id, body, e)} title="Add Moon">
            <Plus className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-5 w-5 p-0" onClick={(e) => handleAddStation(body.id, body, e)} title="Add Station">
            <Building className="h-3 w-3" />
          </Button>
        </>
      );
    }

    const canDelete = body.type !== 'star' || stars.length > 1;

    return (
      <TreeItem
        key={body.id}
        icon={Icon}
        label={body.name}
        sublabel={body.type === 'station' ? body.stationType : body.id}
        isSelected={isSelected(body.type, body.id)}
        onClick={() => handleItemClick(body.type, body.id, body.parentId ?? undefined)}
        onDelete={canDelete ? (e) => handleDelete(body, e) : undefined}
        nodeId={body.id}
        hasChildren={hasChildren}
        actions={actions}
      >
        {body.children
          .sort((a, b) => {
            if (a.type === 'planet' && b.type === 'planet') {
              return (a.planetNumber || 0) - (b.planetNumber || 0);
            }
            return 0;
          })
          .map(renderBody)}
      </TreeItem>
    );
  };

  return (
    <div className="flex h-full flex-col overflow-hidden select-none">
      <div className="border-b p-2">
        <h2 className="text-sm font-semibold">{system.name}</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        <div className="space-y-1">
          {stars.map(renderBody)}
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between px-2 py-1">
            <span className="text-xs font-semibold text-muted-foreground">ASTEROID BELTS</span>
            <Button variant="ghost" size="icon" className="h-5 w-5 p-0" onClick={handleAddAsteroid} title="Add Asteroid Belt">
              <Plus className="h-3 w-3" />
            </Button>
          </div>
          <div className="space-y-1">
            {asteroids.map(renderBody)}
          </div>
        </div>
      </div>
    </div>
  );
}
