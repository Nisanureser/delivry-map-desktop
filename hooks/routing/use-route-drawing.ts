/**
 * useRouteDrawing Hook
 * Teslimat noktalarına göre rota çizme
 * 
 * Profesyonel Yaklaşım:
 * - Google Maps Directions API kullanır
 * - Leaflet polyline ile haritada çizer
 * - Route state management
 */

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import type { LeafletMap } from '@/types/leaflet';
import type { DeliveryPoint } from '@/types/delivery.types';
import routeService from '@/services/route-service';
import { decodePolyline } from '@/lib/polyline-utils';
import { useDebounce } from '@/hooks/shared/use-debounce';

interface UseRouteDrawingOptions {
  map: LeafletMap | null;
  deliveryPoints: DeliveryPoint[];
  enabled?: boolean;
}

interface UseRouteDrawingReturn {
  isDrawing: boolean;
  error: string | null;
  drawRoute: () => Promise<void>;
  clearRoute: () => void;
  routeInfo: {
    distance: string;
    duration: string;
    summary: string;
  } | null;
}

export function useRouteDrawing({
  map,
  deliveryPoints,
  enabled = true,
}: UseRouteDrawingOptions): UseRouteDrawingReturn {
  const [isDrawing, setIsDrawing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [routeInfo, setRouteInfo] = useState<UseRouteDrawingReturn['routeInfo']>(null);
  
  const polylineRef = useRef<L.Polyline | null>(null);
  const hasRouteDrawnRef = useRef<boolean>(false); // Rota çizilmiş mi takibi

  // Rota çiz
  const drawRoute = useCallback(async () => {
    if (!map || !enabled) return;
    
    if (deliveryPoints.length < 2) {
      setError('Rota çizmek için en az 2 teslimat noktası gerekli');
      return;
    }

    setIsDrawing(true);
    setError(null);

    try {
      // Teslimat noktalarını sıraya göre al (order'a göre sıralı)
      const sortedPoints = [...deliveryPoints].sort((a, b) => 
        (a.order || 0) - (b.order || 0)
      );

      // Waypoint'leri hazırla
      const waypoints = sortedPoints.map(point => point.coordinates);

      // Rota hesapla
      const routeData = await routeService.calculateRoute(waypoints);

      if (!routeData || !routeData.routes || routeData.routes.length === 0) {
        throw new Error('Rota hesaplanamadı');
      }

      // Önceki rotayı temizle
      if (polylineRef.current) {
        map.removeLayer(polylineRef.current);
        polylineRef.current = null;
      }

      // İlk route'u al
      const route = routeData.routes[0];

      // Yol hizasında detaylı geometri: her leg.steps[].polyline (overview sadeleştirilmiş, sapma yapar)
      const allPoints: [number, number][] = [];
      for (const leg of route.legs || []) {
        for (const step of leg.steps || []) {
          const enc = step.polyline?.points;
          if (!enc) continue;
          const decoded = decodePolyline(enc);
          // Adım/leg sınırındaki tekrarlı noktayı atla
          if (allPoints.length > 0 && decoded.length > 0) {
            const [la, ln] = allPoints[allPoints.length - 1];
            const [fa, fn] = decoded[0];
            if (la === fa && ln === fn) decoded.shift();
          }
          allPoints.push(...decoded);
        }
      }
      const decodedPoints =
        allPoints.length > 0 ? allPoints : decodePolyline(route.overview_polyline.points);

      // Leaflet polyline: smoothFactor 1 = nokta sadeleştirme yok, yol formu korunur
      const polyline = L.polyline(decodedPoints, {
        color: '#3b82f6',
        weight: 5,
        opacity: 0.8,
        smoothFactor: 1,
        lineCap: 'round',
        lineJoin: 'round',
      });

      // Haritaya ekle
      polyline.addTo(map);
      polylineRef.current = polyline;

      // Haritayı rotaya göre fit et
      map.fitBounds(polyline.getBounds(), {
        padding: [50, 50],
        maxZoom: 15,
      });

      // Rota bilgilerini kaydet
      const summary = routeService.formatRouteSummary(route);
      setRouteInfo(summary);
      hasRouteDrawnRef.current = true; // Rota başarıyla çizildi

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Rota çizilirken hata oluştu';
      setError(errorMessage);
      console.error('Route drawing error:', err);
      hasRouteDrawnRef.current = false; // Hata durumunda false
    } finally {
      setIsDrawing(false);
    }
  }, [map, deliveryPoints, enabled]);

  // Rota temizle
  const clearRoute = useCallback(() => {
    if (polylineRef.current && map) {
      map.removeLayer(polylineRef.current);
      polylineRef.current = null;
    }
    setRouteInfo(null);
    setError(null);
    hasRouteDrawnRef.current = false; // Rota temizlendi
  }, [map]);

  // Debounce: deliveryPoints değişikliklerini 500ms geciktir
  // (Kısa sürede birden fazla silme işlemi olursa tek bir API çağrısı yap)
  const debouncedDeliveryPoints = useDebounce(deliveryPoints, 500);
  
  // DeliveryPoints'in ID'lerini string olarak track et (değişiklikleri algılamak için)
  const deliveryPointsIds = debouncedDeliveryPoints.map(p => p.id).join(',');
  const prevDeliveryPointsIdsRef = useRef<string>('');
  const isInitialMountRef = useRef<boolean>(true);

  // Akıllı Otomatik Yeniden Hesaplama
  // Teslimat noktaları değiştiğinde otomatik kontrol yap
  useEffect(() => {
    // Hook disabled ise veya map yoksa çalışma
    if (!enabled || !map) return;

    // İlk mount'ta çalışma (sadece değişikliklerde çalış)
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      prevDeliveryPointsIdsRef.current = deliveryPointsIds;
      return;
    }

    // Değişiklik yoksa çalışma
    if (deliveryPointsIds === prevDeliveryPointsIdsRef.current) {
      return;
    }

    // Önceki ID'leri güncelle
    prevDeliveryPointsIdsRef.current = deliveryPointsIds;

    // Rota çizilmişse ve nokta sayısı >= 2 ise otomatik yeniden hesapla
    if (hasRouteDrawnRef.current && debouncedDeliveryPoints.length >= 2) {
      console.log('🔄 Otomatik rota yeniden hesaplanıyor...', {
        noktaSayisi: debouncedDeliveryPoints.length,
        noktalar: debouncedDeliveryPoints.map(p => p.order)
      });
      drawRoute();
    }
    // Rota çizilmişse ama nokta sayısı < 2 ise rotayı temizle (API çağrısı yok)
    else if (hasRouteDrawnRef.current && debouncedDeliveryPoints.length < 2) {
      console.log(' Rota temizleniyor (yeterli nokta yok)...');
      clearRoute();
    }
    // Rota çizilmemişse hiçbir şey yapma (kullanıcı manuel butona basacak)
  }, [deliveryPointsIds, debouncedDeliveryPoints, map, enabled, drawRoute, clearRoute]);

  // Cleanup: component unmount olduğunda rotayı temizle
  useEffect(() => {
    return () => {
      if (polylineRef.current && map) {
        map.removeLayer(polylineRef.current);
      }
    };
  }, [map]);

  return {
    isDrawing,
    error,
    drawRoute,
    clearRoute,
    routeInfo,
  };
}
