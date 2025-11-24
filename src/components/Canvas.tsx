'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Stage, Layer, Circle, Ring, Image as KonvaImage, Group } from 'react-konva';
import { useSystemStore, useSpriteStore, useUIStore } from '@/stores';
import type { CelestialBody } from '@/types';
import type Konva from 'konva';

const FRAME_INTERVAL_MS = 33;
const ORBIT_SPEED_MULTIPLIER = 10;
const ZOOM_SCALE_FACTOR = 1.02;
const MAX_AUTO_FIT_ZOOM = 1;
const CANVAS_PADDING = 50;

interface LoadedImage {
  image: HTMLImageElement;
  loaded: boolean;
}

const defaultVisuals = {
  star: { baseSize: 64, fallbackColor: '#FFD700', orbitRingColor: '', orbitRingWidth: 0, isRingOnly: false },
  planet: { baseSize: 48, fallbackColor: '#6366F1', orbitRingColor: 'rgba(100, 116, 139, 0.3)', orbitRingWidth: 1, isRingOnly: false },
  moon: { baseSize: 24, fallbackColor: '#94A3B8', orbitRingColor: 'rgba(100, 116, 139, 0.2)', orbitRingWidth: 0.5, isRingOnly: false },
  station: { baseSize: 20, fallbackColor: '#EAB308', orbitRingColor: 'rgba(234, 179, 8, 0.2)', orbitRingWidth: 0.5, isRingOnly: false },
  asteroid: { baseSize: 0, fallbackColor: 'rgba(156, 163, 175, 0.15)', orbitRingColor: 'rgba(156, 163, 175, 0.15)', orbitRingWidth: 3, isRingOnly: true },
};

function getVisual(body: CelestialBody, prop: keyof typeof defaultVisuals.star): number | string | boolean {
  const value = body[prop as keyof CelestialBody];
  if (value !== undefined) return value as number | string | boolean;
  return defaultVisuals[body.type as keyof typeof defaultVisuals]?.[prop] ?? defaultVisuals.planet[prop];
}

/**
 * Canvas component for rendering the solar system.
 *
 * Uses a fixed 30fps render loop via requestAnimationFrame instead of React's
 * reactive state updates. This approach:
 * - Provides smooth, consistent animation regardless of state update frequency
 * - Avoids excessive re-renders from high-frequency state changes (e.g., orbit angles)
 * - Reads current state via getState() on each frame rather than subscribing to changes
 * - Only triggers React re-render via setFrame() to paint the current state
 *
 * The Canvas is intentionally "type-agnostic" - it recursively renders all CelestialBody
 * objects using the same logic, with visual properties (size, color, orbit ring) determined
 * by the body's properties or type-based defaults.
 */
export function Canvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const lastTimeRef = useRef<number>(0);
  const anglesRef = useRef<Map<string, number>>(new Map());

  const [frame, setFrame] = useState(0);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [images, setImages] = useState<Map<string, LoadedImage>>(new Map());

  const select = useUIStore.getState().select;
  const setCameraPosition = useUIStore.getState().setCameraPosition;
  const setCameraZoom = useUIStore.getState().setCameraZoom;
  const setComputedZoom = useUIStore.getState().setComputedZoom;
  const setFocusTarget = useUIStore.getState().setFocusTarget;

  // Clear angles when system changes to prevent memory leak
  useEffect(() => {
    let prevSystemId = useSystemStore.getState().system?.id;
    const unsubscribe = useSystemStore.subscribe((state) => {
      const currentSystemId = state.system?.id;
      if (currentSystemId !== prevSystemId) {
        anglesRef.current.clear();
        prevSystemId = currentSystemId;
      }
    });
    return unsubscribe;
  }, []);

  // 30fps render loop
  useEffect(() => {
    let frameId: number;
    let lastFrame = 0;

    const updateAngles = (bodies: CelestialBody[], deltaTime: number) => {
      for (const body of bodies) {
        if (body.orbitDistance > 0) {
          const currentAngle = anglesRef.current.get(body.id) ?? body.orbitAngle;
          anglesRef.current.set(body.id, (currentAngle + body.orbitSpeed * deltaTime * ORBIT_SPEED_MULTIPLIER) % 360);
        }
        updateAngles(body.children, deltaTime);
      }
    };

    const tick = (time: number) => {
      if (time - lastFrame >= FRAME_INTERVAL_MS) {
        lastFrame = time;

        const isAnimating = useUIStore.getState().isAnimating;
        const rootBodies = useSystemStore.getState().rootBodies;

        if (isAnimating && rootBodies.length > 0) {
          const deltaTime = lastTimeRef.current ? (time - lastTimeRef.current) / 1000 : 0;
          lastTimeRef.current = time;
          updateAngles(rootBodies, deltaTime);
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

  // Load sprite images when sprites change
  useEffect(() => {
    const loadImages = () => {
      const sprites = useSpriteStore.getState().sprites;
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

    // Subscribe to sprite changes
    let prevSprites = useSpriteStore.getState().sprites;
    const unsubscribe = useSpriteStore.subscribe((state) => {
      if (state.sprites !== prevSprites) {
        prevSprites = state.sprites;
        loadImages();
      }
    });

    return unsubscribe;
  }, []);

  const rootBodies = useSystemStore.getState().rootBodies;
  const { selection, cameraPosition, cameraZoom: storeZoom, showOrbits, focusTarget } = useUIStore.getState();

  // Calculate max orbit distance for auto-fit
  const autoFitZoom = useMemo(() => {
    const getMaxOrbitDistance = (bodies: CelestialBody[]): number => {
      let max = 0;
      for (const body of bodies) {
        if (body.parentId === null) {
          max = Math.max(max, body.orbitDistance);
        }
        for (const child of body.children) {
          max = Math.max(max, child.orbitDistance);
        }
      }
      return max;
    };

    if (rootBodies.length > 0 && dimensions.width > 0) {
      const maxDistance = getMaxOrbitDistance(rootBodies);
      if (maxDistance > 0) {
        const availableSize = Math.min(dimensions.width, dimensions.height) - CANVAS_PADDING * 2;
        const requiredSize = maxDistance * 2;
        return Math.min(MAX_AUTO_FIT_ZOOM, availableSize / requiredSize);
      }
    }
    return 1;
  }, [rootBodies, dimensions.width, dimensions.height]);

  const cameraZoom = autoFitZoom * storeZoom;
  const centerX = dimensions.width / 2;
  const centerY = dimensions.height / 2;

  useEffect(() => {
    setComputedZoom(cameraZoom);
  }, [cameraZoom, setComputedZoom]);

  const getAngle = useCallback((id: string, baseAngle: number): number => {
    if (useUIStore.getState().isAnimating) {
      return anglesRef.current.get(id) ?? baseAngle;
    }
    return baseAngle;
  }, []);

  // Handle focus target
  useEffect(() => {
    if (!focusTarget) return;

    const bodies = useSystemStore.getState().rootBodies;
    if (bodies.length === 0) return;

    const findBody = useSystemStore.getState().findBody;
    const targetBody = findBody(focusTarget.id);
    if (!targetBody) return;

    const calcPos = (body: CelestialBody): { x: number; y: number } => {
      if (body.parentId === null) return { x: 0, y: 0 };

      const parent = findBody(body.parentId);
      if (!parent) return { x: 0, y: 0 };

      const parentPos = calcPos(parent);
      const angle = (getAngle(body.id, body.orbitAngle) * Math.PI) / 180;
      return {
        x: parentPos.x + Math.cos(angle) * body.orbitDistance,
        y: parentPos.y + Math.sin(angle) * body.orbitDistance
      };
    };

    const pos = calcPos(targetBody);
    setCameraPosition({
      x: -pos.x * cameraZoom,
      y: -pos.y * cameraZoom
    });
  }, [frame, focusTarget, cameraZoom, setCameraPosition, getAngle]);

  const handleWheel = useCallback((e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const stage = e.target.getStage();
    if (!stage) return;

    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const { cameraPosition, cameraZoom: currentStoreZoom } = useUIStore.getState();
    const zoomFactor = e.evt.deltaY > 0 ? 1 / ZOOM_SCALE_FACTOR : ZOOM_SCALE_FACTOR;
    const newStoreZoom = currentStoreZoom * zoomFactor;

    const oldActualZoom = autoFitZoom * currentStoreZoom;
    const newActualZoom = autoFitZoom * newStoreZoom;

    const worldX = (pointer.x - cameraPosition.x - centerX) / oldActualZoom;
    const worldY = (pointer.y - cameraPosition.y - centerY) / oldActualZoom;

    setCameraZoom(newStoreZoom);
    setCameraPosition({
      x: pointer.x - centerX - worldX * newActualZoom,
      y: pointer.y - centerY - worldY * newActualZoom,
    });
  }, [autoFitZoom, centerX, centerY, setCameraZoom, setCameraPosition]);

  const handleDragEnd = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    const stage = e.target.getStage();
    if (stage) {
      setCameraPosition({ x: stage.x(), y: stage.y() });
      if (useUIStore.getState().focusTarget) setFocusTarget(null);
    }
  }, [setCameraPosition, setFocusTarget]);

  const handleSelect = useCallback((body: CelestialBody) => {
    select({ type: body.type, id: body.id, parentId: body.parentId ?? undefined });
  }, [select]);

  const handleFocus = useCallback((body: CelestialBody) => {
    setFocusTarget({ type: body.type, id: body.id, parentId: body.parentId ?? undefined });
  }, [setFocusTarget]);

  if (rootBodies.length === 0) {
    return (
      <div
        ref={containerRef}
        className="flex h-full w-full items-center justify-center bg-slate-900 text-slate-400"
      >
        No system loaded. Create or load a system to begin.
      </div>
    );
  }

  // Recursive render function
  const renderBody = (body: CelestialBody, parentX: number, parentY: number): React.ReactNode => {
    const angle = (getAngle(body.id, body.orbitAngle) * Math.PI) / 180;
    const x = parentX + Math.cos(angle) * body.orbitDistance * cameraZoom;
    const y = parentY + Math.sin(angle) * body.orbitDistance * cameraZoom;

    const isSelected = selection?.type === body.type && selection.id === body.id;
    const loadedImage = images.get(body.sprite);

    const baseSize = getVisual(body, 'baseSize') as number;
    const fallbackColor = getVisual(body, 'fallbackColor') as string;
    const orbitRingColor = getVisual(body, 'orbitRingColor') as string;
    const orbitRingWidth = getVisual(body, 'orbitRingWidth') as number;
    const isRingOnly = getVisual(body, 'isRingOnly') as boolean;

    if (isRingOnly) {
      return (
        <Group key={body.id}>
          {showOrbits && (
            <Ring
              x={parentX}
              y={parentY}
              innerRadius={body.orbitDistance * cameraZoom - orbitRingWidth}
              outerRadius={body.orbitDistance * cameraZoom + orbitRingWidth}
              fill={orbitRingColor}
            />
          )}
          <Ring
            x={parentX}
            y={parentY}
            innerRadius={body.orbitDistance * cameraZoom - 5}
            outerRadius={body.orbitDistance * cameraZoom + 5}
            fill={isSelected ? "rgba(59, 130, 246, 0.3)" : "transparent"}
            onClick={() => handleSelect(body)}
            onTap={() => handleSelect(body)}
            onDblClick={() => handleFocus(body)}
            onDblTap={() => handleFocus(body)}
          />
          {body.children.map(child => renderBody(child, x, y))}
        </Group>
      );
    }

    const size = baseSize * body.scale * cameraZoom;
    const halfSize = size / 2;

    return (
      <Group key={body.id}>
        {showOrbits && body.orbitDistance > 0 && orbitRingColor && (
          <Ring
            x={parentX}
            y={parentY}
            innerRadius={body.orbitDistance * cameraZoom - orbitRingWidth}
            outerRadius={body.orbitDistance * cameraZoom + orbitRingWidth}
            fill={orbitRingColor}
          />
        )}

        <Group x={x} y={y}>
          {loadedImage?.loaded ? (
            <KonvaImage
              image={loadedImage.image}
              width={size}
              height={size}
              offsetX={halfSize}
              offsetY={halfSize}
              rotation={body.rotation}
              onClick={() => handleSelect(body)}
              onTap={() => handleSelect(body)}
              onDblClick={() => handleFocus(body)}
              onDblTap={() => handleFocus(body)}
            />
          ) : (
            <Circle
              radius={halfSize}
              fill={fallbackColor}
              onClick={() => handleSelect(body)}
              onTap={() => handleSelect(body)}
              onDblClick={() => handleFocus(body)}
              onDblTap={() => handleFocus(body)}
            />
          )}
          {isSelected && (
            <Ring
              innerRadius={halfSize + 4}
              outerRadius={halfSize + 8}
              fill="#3B82F6"
            />
          )}
        </Group>

        {body.children.map(child => renderBody(child, x, y))}
      </Group>
    );
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
          {rootBodies.map(body => renderBody(body, centerX, centerY))}
        </Layer>
      </Stage>
    </div>
  );
}
