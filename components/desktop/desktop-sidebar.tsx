/**
 * Desktop Sidebar Component
 * Sol sidebar - Navigation rail (ikonlar)
 * Genel desktop navigation sidebar'ı
 */

'use client';

import { Menu, BarChart3 } from 'lucide-react';

interface DesktopSidebarProps {
  activeTab: 'routes' | 'data' | null;
  onTabChange: (tab: 'routes' | 'data') => void;
}

export function DesktopSidebar({ activeTab, onTabChange }: DesktopSidebarProps) {
  return (
    <div className="fixed left-0 top-0 h-screen z-50">
      {/* Navigation Rail (Sol kenar - Sadece ikonlar) - Tam yükseklik */}
      <div className="w-16 h-screen bg-white/10 dark:bg-black/20 backdrop-blur-md border-r border-white/20 flex flex-col items-center justify-start pt-4 gap-4">
        <button
          onClick={() => onTabChange('routes')}
          className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
            activeTab === 'routes'
              ? 'bg-purple-500/20 text-purple-500 dark:text-purple-400'
              : 'text-muted-foreground hover:bg-white/10 dark:hover:bg-white/5'
          }`}
          title="Rotalar"
        >
          <Menu className="w-5 h-5" />
        </button>
        <button
          onClick={() => onTabChange('data')}
          className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
            activeTab === 'data'
              ? 'bg-purple-500/20 text-purple-500 dark:text-purple-400'
              : 'text-muted-foreground hover:bg-white/10 dark:hover:bg-white/5'
          }`}
          title="Rota Verileri"
        >
          <BarChart3 className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
