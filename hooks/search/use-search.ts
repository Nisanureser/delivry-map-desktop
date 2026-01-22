/**
 * useSearch Hook
 * Arama işlemlerini yönetir (query, results, API calls)
 * 
 * Mantık:
 * - State management (query, results, isLoading)
 * - Debounce ile API çağrılarını optimize eder
 * - Geocoding service'i kullanır
 */

'use client';

import { useState, useEffect } from 'react';
import geocodingService from '@/services/geocoding-service';
import type { LocationInfo } from '@/types/geocoding.types';
import { useDebounce } from '@/hooks/shared/use-debounce';

interface UseSearchReturn {
  query: string;
  setQuery: (query: string) => void;
  results: LocationInfo[];
  isLoading: boolean;
  performSearch: (searchQuery: string) => Promise<void>;
}

export function useSearch(): UseSearchReturn {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<LocationInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Debounced query (400ms bekle) - API çağrılarını optimize eder
  const debouncedQuery = useDebounce(query, 400);

  // Debounced query değiştiğinde arama yap
  useEffect(() => {
    const performSearch = async () => {
      // 3 karakterden azsa arama yapma
      if (debouncedQuery.trim().length < 3) {
        setResults([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        const searchResults = await geocodingService.geocode(debouncedQuery);
        setResults(searchResults);
      } catch (error) {
        console.error('Arama hatası:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    performSearch();
  }, [debouncedQuery]);

  // Query değiştiğinde loading state'i güncelle (3 karakter kontrolü)
  useEffect(() => {
    if (query.trim().length < 3) {
      setIsLoading(false);
    } else if (query.trim().length >= 3 && query !== debouncedQuery) {
      // Debounce bitene kadar loading göster
      setIsLoading(true);
    }
  }, [query, debouncedQuery]);

  // Manuel arama fonksiyonu (isteğe bağlı)
  const performSearch = async (searchQuery: string) => {
    setIsLoading(true);
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

  return {
    query,
    setQuery,
    results,
    isLoading,
    performSearch,
  };
}
