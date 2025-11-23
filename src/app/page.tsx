'use client';

import { useEffect } from 'react';
import { Header } from '@/components/Header';
import { Canvas } from '@/components/Canvas';
import { PropertyPanel } from '@/components/PropertyPanel';
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

        {/* Property panel sidebar */}
        <div className="w-80 border-l">
          <PropertyPanel />
        </div>
      </div>
    </div>
  );
}
