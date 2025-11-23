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
import type { Planet, Star as StarType } from '@/types';

export function HierarchyTree() {
  const system = useSystemStore((state) => state.system);
  const addPlanet = useSystemStore((state) => state.addPlanet);
  const addMoon = useSystemStore((state) => state.addMoon);
  const addStation = useSystemStore((state) => state.addStation);
  const addAsteroid = useSystemStore((state) => state.addAsteroid);
  const removeStar = useSystemStore((state) => state.removeStar);
  const removePlanet = useSystemStore((state) => state.removePlanet);
  const removeMoon = useSystemStore((state) => state.removeMoon);
  const removeStation = useSystemStore((state) => state.removeStation);
  const removeAsteroid = useSystemStore((state) => state.removeAsteroid);

  const selection = useUIStore((state) => state.selection);
  const select = useUIStore((state) => state.select);
  const setFocusTarget = useUIStore((state) => state.setFocusTarget);

  // Click tracking for double-click detection (must be before conditional returns)
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastClickRef = useRef<{ type: string; id: string; time: number } | null>(null);

  // Calculate all expandable node IDs for auto-expand
  const allNodeIds = useMemo(() => {
    if (!system) return new Set<string>();
    const ids = new Set<string>();
    system.stars.forEach(star => {
      ids.add(star.id);
      const starPlanets = system.planets.filter(p => p.parentStarId === star.id);
      starPlanets.forEach(planet => {
        if (planet.moons.length > 0 || planet.stations.length > 0) {
          ids.add(planet.id);
        }
      });
    });
    return ids;
  }, [system]);

  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // Auto-expand all nodes when system loads
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

  const isSelected = (type: string, id: string, parentId?: string) => {
    if (!selection) return false;
    return selection.type === type && selection.id === id && selection.parentId === parentId;
  };

  const handleItemClick = (
    type: 'star' | 'planet' | 'moon' | 'station' | 'asteroid',
    id: string,
    parentId?: string
  ) => {
    const now = Date.now();
    const lastClick = lastClickRef.current;

    // Check if this is a double-click (same item within 300ms)
    if (lastClick && lastClick.type === type && lastClick.id === id && now - lastClick.time < 300) {
      // Double-click detected
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
        clickTimeoutRef.current = null;
      }
      lastClickRef.current = null;
      // Tell Canvas to center on this object
      setFocusTarget({ type, id, parentId });
      return;
    }

    // Single click - delay selection to allow for double-click
    lastClickRef.current = { type, id, time: now };

    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
    }

    clickTimeoutRef.current = setTimeout(() => {
      select({ type, id, parentId });
      clickTimeoutRef.current = null;
    }, 200);
  };

  const handleAddPlanet = (starId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const planet = addPlanet(starId, {});
    select({ type: 'planet', id: planet.id });
    setExpandedNodes((prev) => new Set([...prev, starId]));
  };

  const handleAddMoon = (planetId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const moon = addMoon(planetId, {});
    select({ type: 'moon', id: moon.id, parentId: planetId });
    setExpandedNodes((prev) => new Set([...prev, planetId]));
  };

  const handleAddStation = (planetId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const station = addStation(planetId, {});
    select({ type: 'station', id: station.id, parentId: planetId });
    setExpandedNodes((prev) => new Set([...prev, planetId]));
  };

  const handleAddAsteroid = (e: React.MouseEvent) => {
    e.stopPropagation();
    const asteroid = addAsteroid({});
    select({ type: 'asteroid', id: asteroid.id });
  };

  const handleDelete = (
    type: 'star' | 'planet' | 'moon' | 'station' | 'asteroid',
    id: string,
    parentId?: string,
    e?: React.MouseEvent
  ) => {
    e?.stopPropagation();

    if (selection?.id === id) {
      select(null);
    }

    switch (type) {
      case 'star':
        removeStar(id);
        break;
      case 'planet':
        removePlanet(id);
        break;
      case 'moon':
        if (parentId) removeMoon(parentId, id);
        break;
      case 'station':
        if (parentId) removeStation(parentId, id);
        break;
      case 'asteroid':
        removeAsteroid(id);
        break;
    }
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
                {isExpanded ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
              </Button>
            </CollapsibleTrigger>
            <div
              className="flex flex-1 items-center gap-1"
              onClick={onClick}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="flex-1 truncate text-sm">{label}</span>
              {sublabel && (
                <span className="text-xs text-muted-foreground">{sublabel}</span>
              )}
            </div>
            <div className="hidden gap-0.5 group-hover:flex">
              {actions}
              {onDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 p-0 text-destructive hover:text-destructive"
                  onClick={onDelete}
                >
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
        className={`group flex items-center gap-1 rounded px-2 py-1 cursor-pointer hover:bg-accent ${
          isSelected ? 'bg-accent' : ''
        }`}
        onClick={onClick}
      >
        <div className="w-4" />
        <Icon className="h-4 w-4 shrink-0" />
        <span className="flex-1 truncate text-sm">{label}</span>
        {sublabel && (
          <span className="text-xs text-muted-foreground">{sublabel}</span>
        )}
        <div className="hidden gap-0.5 group-hover:flex">
          {actions}
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 p-0 text-destructive hover:text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
    );
  };

  const renderPlanet = (planet: Planet) => {
    const hasChildren = planet.moons.length > 0 || planet.stations.length > 0;

    return (
      <TreeItem
        key={planet.id}
        icon={Globe}
        label={planet.name}
        sublabel={planet.id}
        isSelected={isSelected('planet', planet.id)}
        onClick={() => handleItemClick('planet', planet.id)}
        onDelete={(e) => handleDelete('planet', planet.id, undefined, e)}
        nodeId={planet.id}
        hasChildren={hasChildren}
        actions={
          <>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 p-0"
              onClick={(e) => handleAddMoon(planet.id, e)}
              title="Add Moon"
            >
              <Plus className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 p-0"
              onClick={(e) => handleAddStation(planet.id, e)}
              title="Add Station"
            >
              <Building className="h-3 w-3" />
            </Button>
          </>
        }
      >
        {planet.moons.map((moon) => (
          <TreeItem
            key={moon.id}
            icon={Moon}
            label={moon.name}
            sublabel={moon.id}
            isSelected={isSelected('moon', moon.id, planet.id)}
            onClick={() => handleItemClick('moon', moon.id, planet.id)}
            onDelete={(e) => handleDelete('moon', moon.id, planet.id, e)}
            nodeId={moon.id}
            hasChildren={false}
          />
        ))}
        {planet.stations.map((station) => (
          <TreeItem
            key={station.id}
            icon={Building}
            label={station.name}
            sublabel={station.stationType}
            isSelected={isSelected('station', station.id, planet.id)}
            onClick={() => handleItemClick('station', station.id, planet.id)}
            onDelete={(e) => handleDelete('station', station.id, planet.id, e)}
            nodeId={station.id}
            hasChildren={false}
          />
        ))}
      </TreeItem>
    );
  };

  const renderStar = (star: StarType) => {
    const starPlanets = system.planets.filter((p) => p.parentStarId === star.id);
    const hasChildren = starPlanets.length > 0;

    return (
      <TreeItem
        key={star.id}
        icon={Star}
        label={star.name}
        sublabel={star.id}
        isSelected={isSelected('star', star.id)}
        onClick={() => handleItemClick('star', star.id)}
        onDelete={system.stars.length > 1 ? (e) => handleDelete('star', star.id, undefined, e) : undefined}
        nodeId={star.id}
        hasChildren={hasChildren}
        actions={
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 p-0"
            onClick={(e) => handleAddPlanet(star.id, e)}
            title="Add Planet"
          >
            <Plus className="h-3 w-3" />
          </Button>
        }
      >
        {starPlanets
          .sort((a, b) => a.planetNumber - b.planetNumber)
          .map(renderPlanet)}
      </TreeItem>
    );
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="border-b p-2">
        <h2 className="text-sm font-semibold">{system.name}</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        <div className="space-y-1">
          {system.stars.map(renderStar)}
        </div>

        {(system.asteroids.length > 0 || true) && (
          <div className="mt-4">
            <div className="flex items-center justify-between px-2 py-1">
              <span className="text-xs font-semibold text-muted-foreground">ASTEROID BELTS</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 p-0"
                onClick={handleAddAsteroid}
                title="Add Asteroid Belt"
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
            <div className="space-y-1">
              {system.asteroids.map((asteroid) => (
                <TreeItem
                  key={asteroid.id}
                  icon={Circle}
                  label={asteroid.name}
                  sublabel={asteroid.id}
                  isSelected={isSelected('asteroid', asteroid.id)}
                  onClick={() => handleItemClick('asteroid', asteroid.id)}
                  onDelete={(e) => handleDelete('asteroid', asteroid.id, undefined, e)}
                  nodeId={asteroid.id}
                  hasChildren={false}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
