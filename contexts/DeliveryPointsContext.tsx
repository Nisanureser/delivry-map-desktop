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

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { DeliveryPoint, Priority } from '@/types/delivery.types';
import type { LocationInfo } from '@/types/geocoding.types';

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

    setDeliveryPoints((prev) => [...prev, newPoint]);
  }, [deliveryPoints.length]);

  // Teslimat noktası sil
  const removeDeliveryPoint = useCallback((id: string) => {
    setDeliveryPoints((prev) => {
      const filtered = prev.filter((point) => point.id !== id);
      // Order'ları yeniden düzenle
      return filtered.map((point, index) => ({
        ...point,
        order: index + 1,
      }));
    });
  }, []);

  // Teslimat noktası güncelle
  const updateDeliveryPoint = useCallback((id: string, updates: Partial<DeliveryPoint>) => {
    setDeliveryPoints((prev) =>
      prev.map((point) =>
        point.id === id ? { ...point, ...updates } : point
      )
    );
  }, []);

  // Önceliğe göre filtrele
  const getDeliveryPointsByPriority = useCallback((priority: Priority) => {
    return deliveryPoints.filter((point) => point.priority === priority);
  }, [deliveryPoints]);

  // Tümünü temizle
  const clearAll = useCallback(() => {
    setDeliveryPoints([]);
  }, []);

  return (
    <DeliveryPointsContext.Provider
      value={{
        deliveryPoints,
        addDeliveryPoint,
        removeDeliveryPoint,
        updateDeliveryPoint,
        getDeliveryPointsByPriority,
        clearAll,
      }}
    >
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
