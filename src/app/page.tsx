'use client';

import { useEffect } from 'react';
import { Header } from '@/components/Header';
import { Canvas } from '@/components/Canvas';
import { PropertyPanel } from '@/components/PropertyPanel';
import { HierarchyTree } from '@/components/HierarchyTree';
import { MobileTabBar } from '@/components/MobileTabBar';
import { useSystemStore, useUIStore } from '@/stores';
import { solSystemTemplate } from '@/data';
import { cn } from '@/lib/utils';

export default function Home() {
  const system = useSystemStore((state) => state.system);
  const loadSystem = useSystemStore((state) => state.loadSystem);
  const activeTab = useUIStore((state) => state.activeTab);

  useEffect(() => {
    if (!system) {
      loadSystem(solSystemTemplate);
    }
  }, [system, loadSystem]);

  return (
    <div className="flex h-screen flex-col bg-background">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        {/* Mobile: Editor view (portrait: vertical split, landscape: horizontal split) */}
        <div
          className={cn(
            'flex flex-1 flex-col landscape:flex-row md:hidden',
            activeTab !== 'editor' && 'hidden'
          )}
        >
          <div className="flex-[6]">
            <Canvas />
          </div>
          <div className="flex-[4] border-t landscape:border-t-0 landscape:border-l overflow-y-auto">
            <PropertyPanel />
          </div>
        </div>

        {/* Mobile: Hierarchy view */}
        <div
          className={cn(
            'flex-1 md:hidden',
            activeTab !== 'hierarchy' && 'hidden'
          )}
        >
          <HierarchyTree />
        </div>

        {/* Desktop: 3-column layout */}
        <div className="hidden flex-1 md:block">
          <Canvas />
        </div>
        <div className="hidden border-l md:block md:w-64">
          <HierarchyTree />
        </div>
        <div className="hidden border-l md:block md:w-80">
          <PropertyPanel />
        </div>
      </div>
      <MobileTabBar />
    </div>
  );
}
