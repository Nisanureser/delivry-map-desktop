/**
 * Location Popup Component
 */

import { MapPin, Plus, X } from 'lucide-react';
import type { LocationInfo } from '@/types/geocoding.types';

interface LocationPopupProps {
  location: LocationInfo;
  onAdd?: (location: LocationInfo) => void;
  onClose?: () => void;
}

export function LocationPopup({ location, onAdd, onClose }: LocationPopupProps) {
  return (
    <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-99999 animate-slide-up">
      <div className="glass-toolbar rounded-2xl p-4 shadow-xl border border-white/30 max-w-xs backdrop-blur-xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-xl bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-md shrink-0">
            <MapPin className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 max-w-xs">
            <h3 className="font-medium text-foreground text-sm  ">
              {location.posta_adresi}
            </h3>
            {(location.il || location.ilce) && (
              <p className="text-xs text-muted-foreground truncate">
                {location.il && location.ilce ? `${location.ilce}, ${location.il}` : location.il || location.ilce}
              </p>
            )}
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="rounded-full w-6 h-6 p-0 flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Action Button */}
        {onAdd && (
          <button
            onClick={() => onAdd(location)}
            className="w-full bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl px-4 py-2 text-sm font-medium shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
          >
            <Plus className="w-3 h-3" />
            Ekle
          </button>
        )}
      </div>
    </div>
  );
}
