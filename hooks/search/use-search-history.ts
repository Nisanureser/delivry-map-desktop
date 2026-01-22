/**
 * useSearchHistory Hook
 * Arama geçmişini yönetir (localStorage ile)
 * 
 * Mantık:
 * - History state management
 * - LocalStorage operations (add, remove, clear, getAll)
 * - History items'ı component'lere sağlar
 */

'use client';

import { useState, useEffect } from 'react';
import { SearchHistory } from '@/components/desktop/search/search-history';
import type { LocationInfo } from '@/types/geocoding.types';
import type { SearchHistoryItem } from '@/components/desktop/search/search-history';

interface UseSearchHistoryReturn {
  historyItems: SearchHistoryItem[];
  addToHistory: (location: LocationInfo, query?: string) => void;
  removeItem: (id: string) => void;
  clearAll: () => void;
  refreshHistory: () => void;
}

export function useSearchHistory(): UseSearchHistoryReturn {
  const [historyItems, setHistoryItems] = useState<SearchHistoryItem[]>([]);

  // Component mount olduğunda geçmişi yükle
  useEffect(() => {
    setHistoryItems(SearchHistory.getAll());
  }, []);

  // Geçmişe öğe ekle
  const addToHistory = (location: LocationInfo, query?: string) => {
    SearchHistory.add(location, query);
    setHistoryItems(SearchHistory.getAll());
  };

  // Geçmişten öğe sil
  const removeItem = (id: string) => {
    SearchHistory.remove(id);
    setHistoryItems(SearchHistory.getAll());
  };

  // Tüm geçmişi temizle
  const clearAll = () => {
    SearchHistory.clear();
    setHistoryItems([]);
  };

  // Geçmişi yeniden yükle (manuel refresh)
  const refreshHistory = () => {
    setHistoryItems(SearchHistory.getAll());
  };

  return {
    historyItems,
    addToHistory,
    removeItem,
    clearAll,
    refreshHistory,
  };
}
