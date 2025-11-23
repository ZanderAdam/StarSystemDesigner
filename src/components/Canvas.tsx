'use client';

import { useEffect, useRef, useState } from 'react';
import { Stage, Layer, Circle, Ring, Image as KonvaImage, Group } from 'react-konva';
import { useSystemStore, useSpriteStore, useUIStore } from '@/stores';
import type { Star, Planet, Moon } from '@/types';

interface LoadedImage {
  image: HTMLImageElement;
  loaded: boolean;
}

export function Canvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [images, setImages] = useState<Map<string, LoadedImage>>(new Map());
  const [animatedAngles, setAnimatedAngles] = useState<Map<string, number>>(new Map());

  const system = useSystemStore((state) => state.system);
  const sprites = useSpriteStore((state) => state.sprites);
  const { selection, select, cameraPosition, showOrbits, isAnimating, setCameraZoom } = useUIStore();

  // Calculate auto-fit zoom based on system size
  const autoFitZoom = (() => {
    if (!system || dimensions.width === 0) return 1;

    // Find max orbit distance (including moons)
    let maxDistance = 0;
    for (const planet of system.planets) {
      let planetMax = planet.orbitDistance;
      for (const moon of planet.moons) {
        planetMax = Math.max(planetMax, planet.orbitDistance + moon.orbitDistance);
      }
      maxDistance = Math.max(maxDistance, planetMax);
    }

    if (maxDistance === 0) return 1;

    // Add padding and calculate zoom to fit
    const padding = 50;
    const availableSize = Math.min(dimensions.width, dimensions.height) - padding * 2;
    const requiredSize = maxDistance * 2; // diameter

    return Math.min(1, availableSize / requiredSize);
  })();

  const cameraZoom = autoFitZoom;

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
  }, [sprites]);

  // Animation loop
  useEffect(() => {
    if (!isAnimating || !system) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      return;
    }

    const animate = (time: number) => {
      if (!lastTimeRef.current) {
        lastTimeRef.current = time;
      }

      const deltaTime = (time - lastTimeRef.current) / 1000; // seconds
      lastTimeRef.current = time;

      setAnimatedAngles((prev) => {
        const next = new Map(prev);

        // Update planet angles
        for (const planet of system.planets) {
          const currentAngle = next.get(planet.id) ?? planet.orbitAngle;
          next.set(planet.id, (currentAngle + planet.orbitSpeed * deltaTime * 10) % 360);

          // Update moon angles
          for (const moon of planet.moons) {
            const moonAngle = next.get(moon.id) ?? moon.orbitAngle;
            next.set(moon.id, (moonAngle + moon.orbitSpeed * deltaTime * 10) % 360);
          }
        }

        return next;
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      lastTimeRef.current = 0;
    };
  }, [isAnimating, system]);

  // Helper to get animated or base angle
  const getAngle = (id: string, baseAngle: number): number => {
    if (isAnimating) {
      return animatedAngles.get(id) ?? baseAngle;
    }
    return baseAngle;
  };

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

  const centerX = dimensions.width / 2 + cameraPosition.x;
  const centerY = dimensions.height / 2 + cameraPosition.y;

  const handleSelect = (type: 'star' | 'planet' | 'moon', id: string, parentId?: string) => {
    select({ type, id, parentId });
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
          />
        ) : (
          <Circle
            radius={32 * star.scale * cameraZoom}
            fill="#FFD700"
            onClick={() => handleSelect('star', star.id)}
            onTap={() => handleSelect('star', star.id)}
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

  const renderPlanet = (planet: Planet, star: Star) => {
    const loadedImage = images.get(planet.sprite);
    const isSelected = selection?.type === 'planet' && selection.id === planet.id;

    // Calculate orbital position
    const orbitAngle = getAngle(planet.id, planet.orbitAngle);
    const angle = (orbitAngle * Math.PI) / 180;
    const x = centerX + Math.cos(angle) * planet.orbitDistance * cameraZoom;
    const y = centerY + Math.sin(angle) * planet.orbitDistance * cameraZoom;

    return (
      <Group key={planet.id}>
        {/* Orbit path */}
        {showOrbits && (
          <Ring
            x={centerX}
            y={centerY}
            innerRadius={planet.orbitDistance * cameraZoom - 1}
            outerRadius={planet.orbitDistance * cameraZoom + 1}
            fill="rgba(100, 116, 139, 0.3)"
          />
        )}

        {/* Planet */}
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
            />
          ) : (
            <Circle
              radius={24 * planet.scale * cameraZoom}
              fill="#6366F1"
              onClick={() => handleSelect('planet', planet.id)}
              onTap={() => handleSelect('planet', planet.id)}
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

        {/* Moons */}
        {planet.moons.map((moon) => renderMoon(moon, x, y))}
      </Group>
    );
  };

  const renderMoon = (moon: Moon, planetX: number, planetY: number) => {
    const loadedImage = images.get(moon.sprite);
    const isSelected = selection?.type === 'moon' && selection.id === moon.id;

    // Calculate orbital position around planet
    const orbitAngle = getAngle(moon.id, moon.orbitAngle);
    const angle = (orbitAngle * Math.PI) / 180;
    const x = planetX + Math.cos(angle) * moon.orbitDistance * cameraZoom;
    const y = planetY + Math.sin(angle) * moon.orbitDistance * cameraZoom;

    return (
      <Group key={moon.id}>
        {/* Orbit path */}
        {showOrbits && (
          <Ring
            x={planetX}
            y={planetY}
            innerRadius={moon.orbitDistance * cameraZoom - 0.5}
            outerRadius={moon.orbitDistance * cameraZoom + 0.5}
            fill="rgba(100, 116, 139, 0.2)"
          />
        )}

        {/* Moon */}
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
            />
          ) : (
            <Circle
              radius={12 * moon.scale * cameraZoom}
              fill="#94A3B8"
              onClick={() => handleSelect('moon', moon.id, moon.parentPlanetId)}
              onTap={() => handleSelect('moon', moon.id, moon.parentPlanetId)}
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

  return (
    <div ref={containerRef} className="h-full w-full bg-slate-900">
      <Stage
        width={dimensions.width}
        height={dimensions.height}
        onClick={(e) => {
          if (e.target === e.target.getStage()) {
            select(null);
          }
        }}
      >
        <Layer>
          {/* Render stars */}
          {system.stars.map(renderStar)}

          {/* Render planets with their moons */}
          {system.planets.map((planet) => {
            const star = system.stars.find((s) => s.id === planet.parentStarId);
            if (!star) return null;
            return renderPlanet(planet, star);
          })}
        </Layer>
      </Stage>
    </div>
  );
}
