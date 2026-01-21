/**
 * Search Bar Component
 * Arama arayüzü, geçmiş yönetimi ve sonuçları bir arada tutar
 */

'use client';

import { Search, X, Loader2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import geocodingService from '@/services/geocoding-service';
import type { LocationInfo } from '@/types/geocoding.types';
import { SearchHistory } from './search-history';
import { SearchResults } from './search-results';

interface SearchBarProps {
  onLocationSelect: (location: LocationInfo) => void;
  className?: string;
}

export function SearchBar({ onLocationSelect, className = '' }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<LocationInfo[]>([]);
  const [historyItems, setHistoryItems] = useState(SearchHistory.getAll());
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Dışarı tıklandığında dropdown'u kapat
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Arama fonksiyonu
  const handleSearch = async (searchQuery: string) => {
    setQuery(searchQuery);
    
    if (searchQuery.trim().length < 3) {
      setResults([]);
      setIsOpen(true); // Geçmişi göster
      return;
    }

    setIsLoading(true);
    setIsOpen(true);

    try {
      const searchResults = await geocodingService.geocode(searchQuery);
      setResults(searchResults);
    } catch (error) {
      console.error('Arama hatası:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Sonuç seçildiğinde
  const handleSelectLocation = (location: LocationInfo) => {
    // Geçmişe ekle
    SearchHistory.add(location, query);
    setHistoryItems(SearchHistory.getAll());
    
    // Callback çağır
    onLocationSelect(location);
    
    // UI'ı güncelle
    setQuery(location.posta_adresi);
    setIsOpen(false);
  };

  // Arama kutusunu temizle
  const handleClear = () => {
    setQuery('');
    setResults([]);
    setHistoryItems(SearchHistory.getAll());
    setIsOpen(false);
  };

  // Input focus olduğunda
  const handleFocus = () => {
    setIsOpen(true);
    if (query.length < 3) {
      // Geçmişi yeniden yükle
      setHistoryItems(SearchHistory.getAll());
    }
  };

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      {/* Arama Kutusu */}
      <div className="glass-toolbar rounded-2xl shadow-xl border border-white/30 backdrop-blur-xl">
        <div className="flex items-center gap-3 p-3">
          {/* Arama İkonu */}
          <Search className="w-5 h-5 text-muted-foreground shrink-0" />

          {/* Input */}
          <input
            type="text"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={handleFocus}
            placeholder="Adres ara..."
            className="flex-1 bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground"
          />

          {/* Yükleniyor veya Temizle İkonu */}
          {isLoading ? (
            <Loader2 className="w-4 h-4 text-muted-foreground animate-spin shrink-0" />
          ) : query && (
            <button
              onClick={handleClear}
              className="rounded-full p-1 hover:bg-white/20 transition-colors shrink-0"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Sonuçlar / Geçmiş Dropdown */}
        {isOpen && (
          <div className="border-t border-white/20">
            <SearchResults
              results={results}
              historyItems={historyItems}
              onSelect={handleSelectLocation}
              isLoading={isLoading}
              showHistory={query.length < 3}
            />
          </div>
        )}
      </div>
    </div>
  );
}
