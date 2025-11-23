'use client';

import { useEffect } from 'react';
import { Header } from '@/components/Header';
import { Canvas } from '@/components/Canvas';
import { PropertyPanel } from '@/components/PropertyPanel';
import { HierarchyTree } from '@/components/HierarchyTree';
import { useSystemStore } from '@/stores';
import { solSystemTemplate } from '@/data';

export default function Home() {
  const system = useSystemStore((state) => state.system);
  const loadSystem = useSystemStore((state) => state.loadSystem);

  // Load Sol template on first mount
  useEffect(() => {
    if (!system) {
      loadSystem(solSystemTemplate);
    }
  }, [system, loadSystem]);

  return (
    <div className="flex h-screen flex-col bg-background">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        {/* Canvas area */}
        <div className="flex-1">
          <Canvas />
        </div>

        {/* Hierarchy tree */}
        <div className="w-64 border-l">
          <HierarchyTree />
        </div>

        {/* Property panel sidebar */}
        <div className="w-80 border-l">
          <PropertyPanel />
        </div>
      </div>
    </div>
  );
}
