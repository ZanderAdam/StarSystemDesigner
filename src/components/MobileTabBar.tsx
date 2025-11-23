'use client';

import { Pencil, TreePine } from 'lucide-react';
import { useUIStore } from '@/stores';
import { cn } from '@/lib/utils';

type Tab = 'editor' | 'hierarchy';

const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'editor', label: 'Editor', icon: <Pencil className="h-5 w-5" /> },
  { id: 'hierarchy', label: 'Tree', icon: <TreePine className="h-5 w-5" /> },
];

export function MobileTabBar() {
  const activeTab = useUIStore((state) => state.activeTab);
  const setActiveTab = useUIStore((state) => state.setActiveTab);

  return (
    <div className="flex h-14 border-t bg-background md:hidden">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={cn(
            'flex flex-1 flex-col items-center justify-center gap-1 text-xs transition-colors',
            activeTab === tab.id
              ? 'text-primary'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {tab.icon}
          <span>{tab.label}</span>
        </button>
      ))}
    </div>
  );
}
