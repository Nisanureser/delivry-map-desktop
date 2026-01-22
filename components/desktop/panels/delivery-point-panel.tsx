/**
 * Delivery Point Panel Component
 * Teslimat noktaları listesi paneli - Search bar'ın altında açılır
 */

'use client';

import { X, ArrowUpDown } from 'lucide-react';
import { DeliveryPointList } from '../delivery/delivery-point-list';

interface DeliveryPointPanelProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

export function DeliveryPointPanel({ 
  isOpen, 
  onClose, 
  title = 'Teslimat Noktaları' 
}: DeliveryPointPanelProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed left-20 top-24 z-40 w-96 max-h-[calc(100vh-8rem)] animate-slide-up">
      <div className="glass-modal rounded-2xl shadow-2xl border border-white/30 backdrop-blur-xl overflow-hidden flex flex-col h-[calc(100vh-8rem)]">
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/10 dark:bg-black/10">
          <div className="flex items-center gap-2">
            {/* <ArrowUpDown className="w-4 h-4 text-muted-foreground" /> */}
            <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 dark:hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          <DeliveryPointList />
        </div>
      </div>
    </div>
  );
}
