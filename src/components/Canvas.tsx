'use client';

import { useEffect, useRef, useState } from 'react';
import { Stage, Layer, Circle, Ring, Image as KonvaImage, Group } from 'react-konva';
import { useSystemStore, useSpriteStore, useUIStore } from '@/stores';
import type { Planet, Moon, Station, Asteroid, Star } from '@/types';
import type Konva from 'konva';

interface LoadedImage {
  image: HTMLImageElement;
  loaded: boolean;
}

export function Canvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const lastTimeRef = useRef<number>(0);
  const anglesRef = useRef<Map<string, number>>(new Map());

  const [frame, setFrame] = useState(0);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [images, setImages] = useState<Map<string, LoadedImage>>(new Map());

  // Get actions without subscribing (called once on mount)
  const select = useUIStore.getState().select;
  const setCameraPosition = useUIStore.getState().setCameraPosition;
  const setCameraZoom = useUIStore.getState().setCameraZoom;
  const setComputedZoom = useUIStore.getState().setComputedZoom;
  const setFocusTarget = useUIStore.getState().setFocusTarget;

  // 30fps render loop
  useEffect(() => {
    let frameId: number;
    let lastFrame = 0;

    const tick = (time: number) => {
      if (time - lastFrame >= 33) {
        lastFrame = time;

        // Update animation angles
        const system = useSystemStore.getState().system;
        const isAnimating = useUIStore.getState().isAnimating;

        if (isAnimating && system) {
          const deltaTime = lastTimeRef.current ? (time - lastTimeRef.current) / 1000 : 0;
          lastTimeRef.current = time;

          for (const planet of system.planets) {
            const currentAngle = anglesRef.current.get(planet.id) ?? planet.orbitAngle;
            anglesRef.current.set(planet.id, (currentAngle + planet.orbitSpeed * deltaTime * 10) % 360);

            for (const moon of planet.moons) {
              const moonAngle = anglesRef.current.get(moon.id) ?? moon.orbitAngle;
              anglesRef.current.set(moon.id, (moonAngle + moon.orbitSpeed * deltaTime * 10) % 360);
            }

            for (const station of planet.stations) {
              const stationAngle = anglesRef.current.get(station.id) ?? station.orbitAngle;
              anglesRef.current.set(station.id, (stationAngle + station.orbitSpeed * deltaTime * 10) % 360);
            }
          }
        } else {
          lastTimeRef.current = time;
        }

        setFrame(f => f + 1);
      }
      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, []);

  // Resize handling
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Load sprite images
  useEffect(() => {
    const sprites = useSpriteStore.getState().sprites;
    const loadImages = async () => {
      const newImages = new Map<string, LoadedImage>();

      for (const [filename, url] of sprites.entries()) {
        const img = new window.Image();
        img.crossOrigin = 'anonymous';

        const loadedImage: LoadedImage = { image: img, loaded: false };
        newImages.set(filename, loadedImage);

        img.onload = () => {
          loadedImage.loaded = true;
          setImages(new Map(newImages));
        };

        img.src = url;
      }

      setImages(newImages);
    };

    loadImages();
  }, [useSpriteStore.getState().sprites.size]);

  // Read state directly each frame
  const system = useSystemStore.getState().system;
  const sprites = useSpriteStore.getState().sprites;
  const { selection, cameraPosition, cameraZoom: storeZoom, showOrbits, isAnimating, focusTarget } = useUIStore.getState();

  // Calculate auto-fit zoom
  let autoFitZoom = 1;
  if (system && dimensions.width > 0) {
    let maxDistance = 0;
    for (const planet of system.planets) {
      let planetMax = planet.orbitDistance;
      for (const moon of planet.moons) {
        planetMax = Math.max(planetMax, planet.orbitDistance + moon.orbitDistance);
      }
      maxDistance = Math.max(maxDistance, planetMax);
    }

    if (maxDistance > 0) {
      const padding = 50;
      const availableSize = Math.min(dimensions.width, dimensions.height) - padding * 2;
      const requiredSize = maxDistance * 2;
      autoFitZoom = Math.min(1, availableSize / requiredSize);
    }
  }

  const cameraZoom = autoFitZoom * storeZoom;

  // Sync computed zoom to store
  useEffect(() => {
    setComputedZoom(cameraZoom);
  }, [cameraZoom, setComputedZoom]);

  // Helper to get animated or base angle
  const getAngle = (id: string, baseAngle: number): number => {
    if (isAnimating) {
      return anglesRef.current.get(id) ?? baseAngle;
    }
    return baseAngle;
  };

  // Handle focus target following
  useEffect(() => {
    if (!focusTarget || !system) return;

    let targetX = 0;
    let targetY = 0;

    if (focusTarget.type === 'star') {
      targetX = 0;
      targetY = 0;
    } else if (focusTarget.type === 'planet') {
      const planet = system.planets.find(p => p.id === focusTarget.id);
      if (planet) {
        const angle = (getAngle(planet.id, planet.orbitAngle) * Math.PI) / 180;
        targetX = Math.cos(angle) * planet.orbitDistance;
        targetY = Math.sin(angle) * planet.orbitDistance;
      }
    } else if (focusTarget.type === 'moon' && focusTarget.parentId) {
      const planet = system.planets.find(p => p.id === focusTarget.parentId);
      if (planet) {
        const moon = planet.moons.find(m => m.id === focusTarget.id);
        if (moon) {
          const planetAngle = (getAngle(planet.id, planet.orbitAngle) * Math.PI) / 180;
          const planetX = Math.cos(planetAngle) * planet.orbitDistance;
          const planetY = Math.sin(planetAngle) * planet.orbitDistance;

          const moonAngle = (getAngle(moon.id, moon.orbitAngle) * Math.PI) / 180;
          targetX = planetX + Math.cos(moonAngle) * moon.orbitDistance;
          targetY = planetY + Math.sin(moonAngle) * moon.orbitDistance;
        }
      }
    } else if (focusTarget.type === 'station' && focusTarget.parentId) {
      const planet = system.planets.find(p => p.id === focusTarget.parentId);
      if (planet) {
        const station = planet.stations.find(s => s.id === focusTarget.id);
        if (station) {
          const planetAngle = (getAngle(planet.id, planet.orbitAngle) * Math.PI) / 180;
          const planetX = Math.cos(planetAngle) * planet.orbitDistance;
          const planetY = Math.sin(planetAngle) * planet.orbitDistance;

          const stationAngle = (getAngle(station.id, station.orbitAngle) * Math.PI) / 180;
          targetX = planetX + Math.cos(stationAngle) * station.orbitDistance;
          targetY = planetY + Math.sin(stationAngle) * station.orbitDistance;
        }
      }
    }

    setCameraPosition({
      x: -targetX * cameraZoom,
      y: -targetY * cameraZoom
    });
  }, [frame, focusTarget, system, cameraZoom, setCameraPosition]);

  if (!system) {
    return (
      <div
        ref={containerRef}
        className="flex h-full w-full items-center justify-center bg-slate-900 text-slate-400"
      >
        No system loaded. Create or load a system to begin.
      </div>
    );
  }

  const centerX = dimensions.width / 2;
  const centerY = dimensions.height / 2;

  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const stage = e.target.getStage();
    if (!stage) return;

    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const scaleBy = 1.02;
    const zoomFactor = e.evt.deltaY > 0 ? 1 / scaleBy : scaleBy;
    const newStoreZoom = storeZoom * zoomFactor;

    const oldActualZoom = autoFitZoom * storeZoom;
    const newActualZoom = autoFitZoom * newStoreZoom;

    const worldX = (pointer.x - cameraPosition.x - centerX) / oldActualZoom;
    const worldY = (pointer.y - cameraPosition.y - centerY) / oldActualZoom;

    setCameraZoom(newStoreZoom);
    setCameraPosition({
      x: pointer.x - centerX - worldX * newActualZoom,
      y: pointer.y - centerY - worldY * newActualZoom,
    });
  };

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    const stage = e.target.getStage();
    if (stage) {
      setCameraPosition({
        x: stage.x(),
        y: stage.y()
      });
      if (focusTarget) {
        setFocusTarget(null);
      }
    }
  };

  const handleSelect = (type: 'star' | 'planet' | 'moon' | 'station' | 'asteroid', id: string, parentId?: string) => {
    select({ type, id, parentId });
  };

  const handleFocus = (type: 'star' | 'planet' | 'moon' | 'station' | 'asteroid', id: string, parentId?: string) => {
    setFocusTarget({ type, id, parentId });
  };

  const renderStar = (star: Star) => {
    const loadedImage = images.get(star.sprite);
    const isSelected = selection?.type === 'star' && selection.id === star.id;

    return (
      <Group key={star.id} x={centerX} y={centerY}>
        {loadedImage?.loaded ? (
          <KonvaImage
            image={loadedImage.image}
            width={64 * star.scale * cameraZoom}
            height={64 * star.scale * cameraZoom}
            offsetX={32 * star.scale * cameraZoom}
            offsetY={32 * star.scale * cameraZoom}
            rotation={star.rotation}
            onClick={() => handleSelect('star', star.id)}
            onTap={() => handleSelect('star', star.id)}
            onDblClick={() => handleFocus('star', star.id)}
            onDblTap={() => handleFocus('star', star.id)}
          />
        ) : (
          <Circle
            radius={32 * star.scale * cameraZoom}
            fill="#FFD700"
            onClick={() => handleSelect('star', star.id)}
            onTap={() => handleSelect('star', star.id)}
            onDblClick={() => handleFocus('star', star.id)}
            onDblTap={() => handleFocus('star', star.id)}
          />
        )}
        {isSelected && (
          <Ring
            innerRadius={36 * star.scale * cameraZoom}
            outerRadius={40 * star.scale * cameraZoom}
            fill="#3B82F6"
          />
        )}
      </Group>
    );
  };

  const renderPlanet = (planet: Planet) => {
    const loadedImage = images.get(planet.sprite);
    const isSelected = selection?.type === 'planet' && selection.id === planet.id;

    const orbitAngle = getAngle(planet.id, planet.orbitAngle);
    const angle = (orbitAngle * Math.PI) / 180;
    const x = centerX + Math.cos(angle) * planet.orbitDistance * cameraZoom;
    const y = centerY + Math.sin(angle) * planet.orbitDistance * cameraZoom;

    return (
      <Group key={planet.id}>
        {showOrbits && (
          <Ring
            x={centerX}
            y={centerY}
            innerRadius={planet.orbitDistance * cameraZoom - 1}
            outerRadius={planet.orbitDistance * cameraZoom + 1}
            fill="rgba(100, 116, 139, 0.3)"
          />
        )}

        <Group x={x} y={y}>
          {loadedImage?.loaded ? (
            <KonvaImage
              image={loadedImage.image}
              width={48 * planet.scale * cameraZoom}
              height={48 * planet.scale * cameraZoom}
              offsetX={24 * planet.scale * cameraZoom}
              offsetY={24 * planet.scale * cameraZoom}
              rotation={planet.rotation}
              onClick={() => handleSelect('planet', planet.id)}
              onTap={() => handleSelect('planet', planet.id)}
              onDblClick={() => handleFocus('planet', planet.id)}
              onDblTap={() => handleFocus('planet', planet.id)}
            />
          ) : (
            <Circle
              radius={24 * planet.scale * cameraZoom}
              fill="#6366F1"
              onClick={() => handleSelect('planet', planet.id)}
              onTap={() => handleSelect('planet', planet.id)}
              onDblClick={() => handleFocus('planet', planet.id)}
              onDblTap={() => handleFocus('planet', planet.id)}
            />
          )}
          {isSelected && (
            <Ring
              innerRadius={28 * planet.scale * cameraZoom}
              outerRadius={32 * planet.scale * cameraZoom}
              fill="#3B82F6"
            />
          )}
        </Group>

        {planet.moons.map((moon) => renderMoon(moon, x, y))}
        {planet.stations.map((station) => renderStation(station, x, y))}
      </Group>
    );
  };

  const renderMoon = (moon: Moon, planetX: number, planetY: number) => {
    const loadedImage = images.get(moon.sprite);
    const isSelected = selection?.type === 'moon' && selection.id === moon.id;

    const orbitAngle = getAngle(moon.id, moon.orbitAngle);
    const angle = (orbitAngle * Math.PI) / 180;
    const x = planetX + Math.cos(angle) * moon.orbitDistance * cameraZoom;
    const y = planetY + Math.sin(angle) * moon.orbitDistance * cameraZoom;

    return (
      <Group key={moon.id}>
        {showOrbits && (
          <Ring
            x={planetX}
            y={planetY}
            innerRadius={moon.orbitDistance * cameraZoom - 0.5}
            outerRadius={moon.orbitDistance * cameraZoom + 0.5}
            fill="rgba(100, 116, 139, 0.2)"
          />
        )}

        <Group x={x} y={y}>
          {loadedImage?.loaded ? (
            <KonvaImage
              image={loadedImage.image}
              width={24 * moon.scale * cameraZoom}
              height={24 * moon.scale * cameraZoom}
              offsetX={12 * moon.scale * cameraZoom}
              offsetY={12 * moon.scale * cameraZoom}
              rotation={moon.rotation}
              onClick={() => handleSelect('moon', moon.id, moon.parentPlanetId)}
              onTap={() => handleSelect('moon', moon.id, moon.parentPlanetId)}
              onDblClick={() => handleFocus('moon', moon.id, moon.parentPlanetId)}
              onDblTap={() => handleFocus('moon', moon.id, moon.parentPlanetId)}
            />
          ) : (
            <Circle
              radius={12 * moon.scale * cameraZoom}
              fill="#94A3B8"
              onClick={() => handleSelect('moon', moon.id, moon.parentPlanetId)}
              onTap={() => handleSelect('moon', moon.id, moon.parentPlanetId)}
              onDblClick={() => handleFocus('moon', moon.id, moon.parentPlanetId)}
              onDblTap={() => handleFocus('moon', moon.id, moon.parentPlanetId)}
            />
          )}
          {isSelected && (
            <Ring
              innerRadius={14 * moon.scale * cameraZoom}
              outerRadius={16 * moon.scale * cameraZoom}
              fill="#3B82F6"
            />
          )}
        </Group>
      </Group>
    );
  };

  const renderStation = (station: Station, planetX: number, planetY: number) => {
    const loadedImage = images.get(station.sprite);
    const isSelected = selection?.type === 'station' && selection.id === station.id;

    const orbitAngle = getAngle(station.id, station.orbitAngle);
    const angle = (orbitAngle * Math.PI) / 180;
    const x = planetX + Math.cos(angle) * station.orbitDistance * cameraZoom;
    const y = planetY + Math.sin(angle) * station.orbitDistance * cameraZoom;

    return (
      <Group key={station.id}>
        {showOrbits && (
          <Ring
            x={planetX}
            y={planetY}
            innerRadius={station.orbitDistance * cameraZoom - 0.5}
            outerRadius={station.orbitDistance * cameraZoom + 0.5}
            fill="rgba(234, 179, 8, 0.2)"
          />
        )}
        <Group x={x} y={y}>
          {loadedImage?.loaded ? (
            <KonvaImage
              image={loadedImage.image}
              width={20 * station.scale * cameraZoom}
              height={20 * station.scale * cameraZoom}
              offsetX={10 * station.scale * cameraZoom}
              offsetY={10 * station.scale * cameraZoom}
              rotation={station.rotation}
              onClick={() => handleSelect('station', station.id, station.parentId)}
              onTap={() => handleSelect('station', station.id, station.parentId)}
              onDblClick={() => handleFocus('station', station.id, station.parentId)}
              onDblTap={() => handleFocus('station', station.id, station.parentId)}
            />
          ) : (
            <Circle
              radius={8 * station.scale * cameraZoom}
              fill="#EAB308"
              onClick={() => handleSelect('station', station.id, station.parentId)}
              onTap={() => handleSelect('station', station.id, station.parentId)}
              onDblClick={() => handleFocus('station', station.id, station.parentId)}
              onDblTap={() => handleFocus('station', station.id, station.parentId)}
            />
          )}
          {isSelected && (
            <Ring
              innerRadius={10 * station.scale * cameraZoom}
              outerRadius={12 * station.scale * cameraZoom}
              fill="#3B82F6"
            />
          )}
        </Group>
      </Group>
    );
  };

  const renderAsteroid = (asteroid: Asteroid) => {
    const isSelected = selection?.type === 'asteroid' && selection.id === asteroid.id;

    if (asteroid.orbitDistance) {
      return (
        <Group key={asteroid.id}>
          {showOrbits && (
            <Ring
              x={centerX}
              y={centerY}
              innerRadius={asteroid.orbitDistance * cameraZoom - 3}
              outerRadius={asteroid.orbitDistance * cameraZoom + 3}
              fill="rgba(156, 163, 175, 0.15)"
            />
          )}
          <Ring
            x={centerX}
            y={centerY}
            innerRadius={asteroid.orbitDistance * cameraZoom - 5}
            outerRadius={asteroid.orbitDistance * cameraZoom + 5}
            fill={isSelected ? "rgba(59, 130, 246, 0.3)" : "transparent"}
            onClick={() => handleSelect('asteroid', asteroid.id)}
            onTap={() => handleSelect('asteroid', asteroid.id)}
            onDblClick={() => handleFocus('asteroid', asteroid.id)}
            onDblTap={() => handleFocus('asteroid', asteroid.id)}
          />
        </Group>
      );
    }

    return null;
  };

  return (
    <div ref={containerRef} className="h-full w-full bg-slate-900">
      <Stage
        width={dimensions.width}
        height={dimensions.height}
        draggable
        x={cameraPosition.x}
        y={cameraPosition.y}
        onWheel={handleWheel}
        onDragEnd={handleDragEnd}
        onClick={(e) => {
          if (e.target === e.target.getStage()) {
            select(null);
            setFocusTarget(null);
          }
        }}
      >
        <Layer>
          {system.asteroids.map(renderAsteroid)}
          {system.stars.map(renderStar)}
          {system.planets.map((planet) => {
            const hasParentStar = system.stars.some((s) => s.id === planet.parentStarId);
            if (!hasParentStar) return null;
            return renderPlanet(planet);
          })}
        </Layer>
      </Stage>
    </div>
  );
}
