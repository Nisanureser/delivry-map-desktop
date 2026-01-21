/**
 * Search Results Component
 * Arama sonuçlarını liste halinde gösterir
 */

'use client';

import { memo } from 'react';
import { MapPin, Clock } from 'lucide-react';
import type { LocationInfo } from '@/types/geocoding.types';
import type { SearchHistoryItem } from './search-history';

interface SearchResultsProps {
  results: LocationInfo[];
  historyItems?: SearchHistoryItem[];
  onSelect: (location: LocationInfo) => void;
  isLoading?: boolean;
  showHistory?: boolean;
}

export const SearchResults = memo(function SearchResults({
  results,
  historyItems = [],
  onSelect,
  isLoading = false,
  showHistory = false,
}: SearchResultsProps) {
  if (isLoading) {
    return (
      <div className="p-4 text-center">
        <p className="text-sm text-muted-foreground">Aranıyor...</p>
      </div>
    );
  }

  // Arama sonuçları varsa onları göster
  if (results.length > 0) {
    return (
      <div className="max-h-[400px] overflow-y-auto">
        {results.map((location, index) => (
          <button
            key={index}
            onClick={() => onSelect(location)}
            className="w-full flex items-start gap-3 p-3 hover:bg-white/10 dark:hover:bg-black/20 transition-colors border-b border-white/10 last:border-b-0 text-left"
          >
            {/* Konum İkonu */}
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-md shrink-0 mt-0.5">
              <MapPin className="w-4 h-4 text-white" />
            </div>

            {/* Adres Bilgisi */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground line-clamp-2">
                {location.posta_adresi}
              </p>
              {(location.il || location.ilce) && (
                <p className="text-xs text-muted-foreground mt-1">
                  {[location.ilce, location.il].filter(Boolean).join(', ')}
                </p>
              )}
            </div>
          </button>
        ))}
      </div>
    );
  }

  // Geçmiş gösterilecek
  if (showHistory) {
    return (
      <div>
        {/* Son Aramalar Başlığı */}
        <div className="px-4 py-3 border-b border-white/10">
          <p className="text-xs font-semibold text-foreground flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Son aramalar
          </p>
        </div>

        {/* Geçmiş Varsa Listele */}
        {historyItems.length > 0 ? (
          <div className="max-h-[400px] overflow-y-auto">
            {historyItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onSelect(item.location)}
                className="w-full flex items-start gap-3 p-3 hover:bg-white/10 dark:hover:bg-black/20 transition-colors border-b border-white/10 last:border-b-0 text-left"
              >
                {/* Geçmiş İkonu */}
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                </div>

                {/* Adres Bilgisi */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground line-clamp-2">
                    {item.location.posta_adresi}
                  </p>
                  {(item.location.il || item.location.ilce) && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {[item.location.ilce, item.location.il].filter(Boolean).join(', ')}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        ) : (
          /* Geçmiş Boş - Empty State */
          <div className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
              <Clock className="w-8 h-8 text-muted-foreground/50" />
            </div>
            <p className="text-sm font-medium text-foreground mb-1">
              Henüz arama geçmişi yok
            </p>
            <p className="text-xs text-muted-foreground">
              İlk teslimat adresinizi arayın
            </p>
          </div>
        )}
      </div>
    );
  }

  // Sonuç bulunamadı
  return (
    <div className="p-8 text-center">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
        <MapPin className="w-8 h-8 text-muted-foreground/50" />
      </div>
      <p className="text-sm font-medium text-foreground mb-1">
        Sonuç bulunamadı
      </p>
      <p className="text-xs text-muted-foreground">
        Farklı bir anahtar kelime deneyin
      </p>
    </div>
  );
});
