/**
 * Delivery Points Context
 * Teslimat noktaları state management
 * 
 * Profesyonel Yaklaşım:
 * - Global state management (Context API)
 * - CRUD operations (Create, Read, Update, Delete)
 * - Priority-based grouping
 */

'use client';

import { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';
import type { DeliveryPoint, Priority } from '@/types/delivery.types';
import type { LocationInfo } from '@/types/geocoding.types';
import { getPriorityOrder } from '@/constants/priorities';

interface DeliveryPointsContextType {
  deliveryPoints: DeliveryPoint[];
  addDeliveryPoint: (location: LocationInfo, priority?: Priority) => void;
  removeDeliveryPoint: (id: string) => void;
  updateDeliveryPoint: (id: string, updates: Partial<DeliveryPoint>) => void;
  getDeliveryPointsByPriority: (priority: Priority) => DeliveryPoint[];
  clearAll: () => void;
}

const DeliveryPointsContext = createContext<DeliveryPointsContextType | null>(null);

export function DeliveryPointsProvider({ children }: { children: ReactNode }) {
  const [deliveryPoints, setDeliveryPoints] = useState<DeliveryPoint[]>([]);

  // Teslimat noktalarını önceliğe göre sırala ve order'ları güncelle
  const sortAndReorderPoints = useCallback((points: DeliveryPoint[]): DeliveryPoint[] => {
    // Önceliğe göre sırala (high -> normal -> low)
    // Aynı öncelik içinde mevcut order'a göre sırala
    const sorted = [...points].sort((a, b) => {
      const priorityDiff = getPriorityOrder(a.priority) - getPriorityOrder(b.priority);
      if (priorityDiff !== 0) {
        return priorityDiff;
      }
      // Aynı öncelikte, mevcut order'a göre sırala
      return (a.order || 0) - (b.order || 0);
    });

    // Order'ları yeniden düzenle (1'den başlayarak)
    return sorted.map((point, index) => ({
      ...point,
      order: index + 1,
    }));
  }, []);

  // Teslimat noktası ekle
  const addDeliveryPoint = useCallback((location: LocationInfo, priority: Priority = 'normal') => {
    const newPoint: DeliveryPoint = {
      id: `dp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: 'Teslimat Noktası',
      address: location.posta_adresi,
      coordinates: location.coordinates,
      priority,
      notes: location.mah && location.sokak 
        ? `${location.mah} ${location.sokak}` 
        : undefined,
      order: deliveryPoints.length + 1,
      placeId: location.skor, // Geçici olarak skor'u placeId olarak kullan
    };

    setDeliveryPoints((prev) => {
      const updated = [...prev, newPoint];
      return sortAndReorderPoints(updated);
    });
  }, [deliveryPoints.length, sortAndReorderPoints]);

  // Teslimat noktası sil
  const removeDeliveryPoint = useCallback((id: string) => {
    setDeliveryPoints((prev) => {
      const filtered = prev.filter((point) => point.id !== id);
      return sortAndReorderPoints(filtered);
    });
  }, [sortAndReorderPoints]);

  // Teslimat noktası güncelle
  const updateDeliveryPoint = useCallback((id: string, updates: Partial<DeliveryPoint>) => {
    setDeliveryPoints((prev) => {
      const updated = prev.map((point) =>
        point.id === id ? { ...point, ...updates } : point
      );
      // Öncelik değiştiyse veya her durumda sıralama yap
      return sortAndReorderPoints(updated);
    });
  }, [sortAndReorderPoints]);

  // Önceliğe göre filtrele
  const getDeliveryPointsByPriority = useCallback((priority: Priority) => {
    return deliveryPoints.filter((point) => point.priority === priority);
  }, [deliveryPoints]);

  // Tümünü temizle
  const clearAll = useCallback(() => {
    setDeliveryPoints([]);
  }, []);

  // Context value'yu memoize et (gereksiz re-render'ları önlemek için)
  const contextValue = useMemo(
    () => ({
      deliveryPoints,
      addDeliveryPoint,
      removeDeliveryPoint,
      updateDeliveryPoint,
      getDeliveryPointsByPriority,
      clearAll,
    }),
    [deliveryPoints, addDeliveryPoint, removeDeliveryPoint, updateDeliveryPoint, getDeliveryPointsByPriority, clearAll]
  );

  return (
    <DeliveryPointsContext.Provider value={contextValue}>
      {children}
    </DeliveryPointsContext.Provider>
  );
}

export function useDeliveryPoints() {
  const context = useContext(DeliveryPointsContext);
  if (!context) {
    throw new Error('useDeliveryPoints must be used within DeliveryPointsProvider');
  }
  return context;
}
