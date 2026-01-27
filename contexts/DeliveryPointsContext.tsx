/**
 * Delivery Points Context
 * Teslimat noktaları state management
 *
 * Profesyonel Yaklaşım:
 * - Global state management (Context API)
 * - CRUD operations (Create, Read, Update, Delete)
 * - Priority-based grouping
 */

"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
import type { DeliveryPoint, Priority } from "@/types/delivery.types";
import type { LocationInfo } from "@/types/geocoding.types";
import { getPriorityOrder } from "@/constants/priorities";

export type RouteType = "priority" | "shortest";

interface DeliveryPointsContextType {
  deliveryPoints: DeliveryPoint[];
  routeType: RouteType;
  setRouteType: (type: RouteType) => void;
  addDeliveryPoint: (location: LocationInfo, priority?: Priority) => void;
  removeDeliveryPoint: (id: string) => void;
  updateDeliveryPoint: (id: string, updates: Partial<DeliveryPoint>) => void;
  reorderWithinPriority: (activeId: string, overId: string) => void;
  getDeliveryPointsByPriority: (priority: Priority) => DeliveryPoint[];
  clearAll: () => void;
  getSortedDeliveryPoints: (overrideRouteType?: RouteType) => DeliveryPoint[];
  applyOptimizedOrder: (
    optimizedWaypointOrder: number[],
    sourceRouteType: RouteType,
  ) => void;
}

const DeliveryPointsContext = createContext<DeliveryPointsContextType | null>(
  null,
);

export function DeliveryPointsProvider({ children }: { children: ReactNode }) {
  const [deliveryPoints, setDeliveryPoints] = useState<DeliveryPoint[]>([]);
  const [routeType, setRouteType] = useState<RouteType>("priority");

  const getPriorityStableOrder = useCallback((point: DeliveryPoint) => {
    return point.prioritySortOrder ?? point.createdOrder ?? point.order ?? 0;
  }, []);

  const sortForPriorityRoute = useCallback(
    (points: DeliveryPoint[]): DeliveryPoint[] => {
      return [...points].sort((a, b) => {
        const priorityDiff =
          getPriorityOrder(a.priority) - getPriorityOrder(b.priority);
        if (priorityDiff !== 0) return priorityDiff;

        return getPriorityStableOrder(a) - getPriorityStableOrder(b);
      });
    },
    [getPriorityStableOrder],
  );

  const sortForShortestRoute = useCallback((points: DeliveryPoint[]) => {
    return [...points].sort((a, b) => (a.order || 0) - (b.order || 0));
  }, []);

  const arrayMove = useCallback(<T,>(items: T[], from: number, to: number) => {
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    return next;
  }, []);

  // Optimize edilmiş sırayı delivery point'lere uygula
  // optimizedWaypointOrder: [0, 2, 1, 3] gibi - tüm noktaların optimize edilmiş sırası
  // sourceRouteType parametresi, setRouteType async olduğu için şart (aksi halde yanlış liste baz alınabilir)
  const applyOptimizedOrder = useCallback(
    (optimizedWaypointOrder: number[], sourceRouteType: RouteType) => {
      setDeliveryPoints((prev) => {
        // Önce routeType'a göre sıralı bir kopya oluştur
        let currentSorted: DeliveryPoint[];

        if (sourceRouteType === "priority") {
          // Güvenlik: optimize sadece "shortest" için kullanılıyor.
          // Yanlışlıkla çağrılırsa mevcut sırayı bozma.
          currentSorted = sortForPriorityRoute(prev);
        } else {
          // En kısa rota için: stable eklenme sırasına göre baz al (hook'taki waypoint dizilimi ile aynı)
          currentSorted = [...prev].sort((a, b) => {
            const aStable = a.createdOrder ?? a.order ?? 0;
            const bStable = b.createdOrder ?? b.order ?? 0;
            return aStable - bStable;
          });
        }

        // Optimize edilmiş sıraya göre yeniden düzenle
        const reordered = optimizedWaypointOrder
          .map((newIndex) => currentSorted[newIndex])
          .filter(Boolean);

        // Order'ları yeniden düzenle (1'den başlayarak) - rotaya göre numaralandır
        return reordered.map((point, index) => ({
          ...point,
          order: index + 1,
        }));
      });
    },
    [sortForPriorityRoute],
  );

  // Route type'a göre sıralanmış teslimat noktalarını döndür
  const getSortedDeliveryPoints = useCallback(
    (overrideRouteType?: RouteType): DeliveryPoint[] => {
      // Override routeType varsa onu kullan, yoksa context'teki routeType'ı kullan
      const currentRouteType = overrideRouteType ?? routeType;

      // Yeni rota tipi seçildiyse (overrideRouteType verildiyse), direkt o routeType'a göre sırala
      // Bu sayede önceki rotanın bilgileri kullanılmaz
      if (currentRouteType === "priority") {
        // Önceliğe göre sıralı (mevcut mantık)
        return sortForPriorityRoute(deliveryPoints);
      } else {
        // En kısa rota için - order'a göre sırala
        return sortForShortestRoute(deliveryPoints);
      }
    },
    [deliveryPoints, routeType, sortForPriorityRoute, sortForShortestRoute],
  );

  // Teslimat noktası ekle
  const addDeliveryPoint = useCallback(
    (location: LocationInfo, priority: Priority = "normal") => {
      const newPointBase: Omit<DeliveryPoint, "createdOrder"> & {
        createdOrder?: number;
      } = {
        id: `dp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: "Teslimat Noktası",
        address: location.posta_adresi,
        coordinates: location.coordinates,
        priority,
        notes:
          location.mah && location.sokak
            ? `${location.mah} ${location.sokak}`
            : undefined,
        // createdOrder/order değerleri setState içinde, prev'e göre hesaplanacak
        placeId: location.skor, // Geçici olarak skor'u placeId olarak kullan
      };

      setDeliveryPoints((prev) => {
        const nextCreatedOrder =
          prev.reduce((max, p) => Math.max(max, p.createdOrder ?? 0), 0) + 1;

        const nextPrioritySortOrder =
          prev
            .filter((p) => p.priority === priority)
            .reduce((max, p) => Math.max(max, p.prioritySortOrder ?? 0), 0) + 1;

        const nextOrder =
          prev.reduce(
            (max, p) => Math.max(max, p.order ?? p.createdOrder ?? 0),
            0,
          ) + 1;

        const newPoint: DeliveryPoint = {
          ...newPointBase,
          createdOrder: nextCreatedOrder,
          prioritySortOrder: nextPrioritySortOrder,
          order: nextOrder,
        };

        return [...prev, newPoint];
      });
    },
    [],
  );

  // Teslimat noktası sil
  const removeDeliveryPoint = useCallback((id: string) => {
    setDeliveryPoints((prev) => {
      return prev.filter((point) => point.id !== id);
    });
  }, []);

  // Teslimat noktası güncelle
  const updateDeliveryPoint = useCallback(
    (id: string, updates: Partial<DeliveryPoint>) => {
      setDeliveryPoints((prev) => {
        const current = prev.find((p) => p.id === id);
        if (!current) return prev;

        const nextPriority = (updates.priority ?? current.priority) as Priority;
        const priorityChanged = nextPriority !== current.priority;

        const nextPrioritySortOrder = priorityChanged
          ? prev
              .filter((p) => p.priority === nextPriority)
              .reduce((max, p) => Math.max(max, p.prioritySortOrder ?? 0), 0) +
            1
          : current.prioritySortOrder;

        return prev.map((point) =>
          point.id === id
            ? {
                ...point,
                ...updates,
                priority: nextPriority,
                prioritySortOrder: nextPrioritySortOrder,
              }
            : point,
        );
      });
    },
    [],
  );

  const reorderWithinPriority = useCallback(
    (activeId: string, overId: string) => {
      if (activeId === overId) return;

      setDeliveryPoints((prev) => {
        const active = prev.find((p) => p.id === activeId);
        const over = prev.find((p) => p.id === overId);
        if (!active || !over) return prev;
        if (active.priority !== over.priority) return prev;

        const priority = active.priority;
        const groupSorted = prev
          .filter((p) => p.priority === priority)
          .sort(
            (a, b) => getPriorityStableOrder(a) - getPriorityStableOrder(b),
          );

        const fromIndex = groupSorted.findIndex((p) => p.id === activeId);
        const toIndex = groupSorted.findIndex((p) => p.id === overId);
        if (fromIndex === -1 || toIndex === -1) return prev;

        const moved = arrayMove(groupSorted, fromIndex, toIndex);
        const nextOrderById = new Map(
          moved.map((p, index) => [p.id, index + 1] as const),
        );

        return prev.map((p) =>
          p.priority === priority
            ? { ...p, prioritySortOrder: nextOrderById.get(p.id) }
            : p,
        );
      });
    },
    [arrayMove, getPriorityStableOrder],
  );

  // Önceliğe göre filtrele
  const getDeliveryPointsByPriority = useCallback(
    (priority: Priority) => {
      return deliveryPoints.filter((point) => point.priority === priority);
    },
    [deliveryPoints],
  );

  // Tümünü temizle
  const clearAll = useCallback(() => {
    setDeliveryPoints([]);
  }, []);

  // Context value'yu memoize et (gereksiz re-render'ları önlemek için)
  const contextValue = useMemo(
    () => ({
      deliveryPoints,
      routeType,
      setRouteType,
      addDeliveryPoint,
      removeDeliveryPoint,
      updateDeliveryPoint,
      reorderWithinPriority,
      getDeliveryPointsByPriority,
      clearAll,
      getSortedDeliveryPoints,
      applyOptimizedOrder,
    }),
    [
      deliveryPoints,
      routeType,
      addDeliveryPoint,
      removeDeliveryPoint,
      updateDeliveryPoint,
      reorderWithinPriority,
      getDeliveryPointsByPriority,
      clearAll,
      getSortedDeliveryPoints,
      applyOptimizedOrder,
    ],
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
    throw new Error(
      "useDeliveryPoints must be used within DeliveryPointsProvider",
    );
  }
  return context;
}
