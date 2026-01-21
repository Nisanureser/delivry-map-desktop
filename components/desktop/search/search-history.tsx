/**
 * Search History Manager
 * LocalStorage ile arama geçmişini yönetir
 */

import type { LocationInfo } from '@/types/geocoding.types';

const STORAGE_KEY = 'deliver_map_search_history';
const MAX_HISTORY_ITEMS = 10;

export interface SearchHistoryItem {
  id: string;
  location: LocationInfo;
  searchedAt: number;
  query?: string;
}

export class SearchHistory {
  /**
   * Arama geçmişine yeni öğe ekle
   */
  static add(location: LocationInfo, query?: string): void {
    const history = this.getAll();
    
    // Aynı konum zaten varsa kaldır (en üste eklemek için)
    const filtered = history.filter(
      (item) => item.location.posta_adresi !== location.posta_adresi
    );

    // Yeni öğe ekle
    const newItem: SearchHistoryItem = {
      id: Date.now().toString(),
      location,
      searchedAt: Date.now(),
      query,
    };

    filtered.unshift(newItem);

    // Maksimum öğe sayısını aşma
    const trimmed = filtered.slice(0, MAX_HISTORY_ITEMS);

    this.save(trimmed);
  }

  /**
   * Tüm geçmişi getir
   */
  static getAll(): SearchHistoryItem[] {
    if (typeof window === 'undefined') return [];

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Arama geçmişi okunamadı:', error);
      return [];
    }
  }

  /**
   * Belirli bir öğeyi sil
   */
  static remove(id: string): void {
    const history = this.getAll();
    const filtered = history.filter((item) => item.id !== id);
    this.save(filtered);
  }

  /**
   * Tüm geçmişi temizle
   */
  static clear(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY);
  }

  /**
   * Geçmişi kaydet
   */
  private static save(history: SearchHistoryItem[]): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch (error) {
      console.error('Arama geçmişi kaydedilemedi:', error);
    }
  }
}
