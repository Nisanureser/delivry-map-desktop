/**
 * Search Results Component
 * Arama sonuçlarını liste halinde gösterir
 */

'use client';

import { memo } from 'react';
import { MapPin, Clock, X } from 'lucide-react';
import type { LocationInfo } from '@/types/geocoding.types';
import type { SearchHistoryItem } from './search-history';

interface SearchResultsProps {
  results: LocationInfo[];
  historyItems?: SearchHistoryItem[];
  onSelect: (location: LocationInfo) => void;
  onRemoveItem?: (id: string) => void;
  onClearAll?: () => void;
  isLoading?: boolean;
  showHistory?: boolean;
}

export const SearchResults = memo(function SearchResults({
  results,
  historyItems = [],
  onSelect,
  onRemoveItem,
  onClearAll,
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
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
              <MapPin className="w-4 h-4 text-muted-foreground" />
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
    // Geçmiş boşsa sadece empty state göster (başlık yok)
    if (historyItems.length === 0) {
      return (
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
      );
    }

    // Geçmiş varsa başlık ve liste göster
    return (
      <div>
        {/* Son Aramalar Başlığı - Sadece geçmiş varsa göster */}
        <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
          <p className="text-xs font-semibold text-foreground flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Son aramalar
          </p>
          {onClearAll && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClearAll();
              }}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Tümünü temizle
            </button>
          )}
        </div>

        {/* Geçmiş Listesi */}
        <div className="max-h-[400px] overflow-y-auto">
          {historyItems.map((item) => (
            <div
              key={item.id}
              className="w-full flex items-start gap-3 p-3 hover:bg-white/10 dark:hover:bg-black/20 transition-colors border-b border-white/10 last:border-b-0 group"
            >
              {/* Sol tarafta tıklanabilir alan */}
              <button
                onClick={() => onSelect(item.location)}
                className="flex items-start gap-3 flex-1 min-w-0 text-left"
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

              {/* Silme İkonu */}
              {onRemoveItem && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveItem(item.id);
                  }}
                  className="shrink-0 p-1.5 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                  title="Sil"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
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
