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
import type { RouteType } from '@/contexts/DeliveryPointsContext';
import routeService from '@/services/route-service';
import { decodePolyline } from '@/lib/polyline-utils';
import { useDebounce } from '@/hooks/shared/use-debounce';
import { ROUTE_TYPE_COLORS } from '@/constants/priorities';

interface UseRouteDrawingOptions {
  map: LeafletMap | null;
  deliveryPoints: DeliveryPoint[];
  routeType: RouteType;
  getSortedDeliveryPoints: (overrideRouteType?: RouteType) => DeliveryPoint[]; // Öncelik sırasına göre sıralanmış noktalar
  onOptimizedOrder?: (order: number[]) => void; // Optimize edilmiş sırayı parent'a bildir
  onRouteCleared?: () => void; // Rota temizlendiğinde çağrılır
  enabled?: boolean;
}

interface UseRouteDrawingReturn {
  isDrawing: boolean;
  error: string | null;
  drawRoute: (overrideRouteType?: RouteType) => Promise<void>;
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
  routeType,
  getSortedDeliveryPoints,
  onOptimizedOrder,
  onRouteCleared,
  enabled = true,
}: UseRouteDrawingOptions): UseRouteDrawingReturn {
  const [isDrawing, setIsDrawing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [routeInfo, setRouteInfo] = useState<UseRouteDrawingReturn['routeInfo']>(null);
  
  const polylineRef = useRef<L.Polyline | null>(null);
  const hasRouteDrawnRef = useRef<boolean>(false); // Rota çizilmiş mi takibi

  // Rota çiz
  const drawRoute = useCallback(async (overrideRouteType?: RouteType) => {
    if (!map || !enabled) return;
    
    if (deliveryPoints.length < 2) {
      setError('Rota çizmek için en az 2 teslimat noktası gerekli');
      return;
    }

    setIsDrawing(true);
    setError(null);

    try {
      let waypoints: Array<{ lat: number; lng: number }>;
      let sortedPoints: DeliveryPoint[];
      // Override routeType varsa onu kullan, yoksa prop'tan al
      const currentRouteType = overrideRouteType ?? routeType;
      const optimize = currentRouteType === 'shortest';

      if (optimize) {
        // En kısa rota için: Origin = ilk nokta (order=1 veya ilk eklenen), diğerleri optimize edilir
        // İlk noktayı bul (order=1 veya en küçük order değerine sahip)
        sortedPoints = [...deliveryPoints].sort((a, b) => 
          (a.order || 0) - (b.order || 0)
        );
        
        // Origin: İlk nokta (order=1)
        // Waypoints: Diğer tüm noktalar (optimize edilecek)
        // Google Maps API optimize:true kullanıldığında origin ve destination sabit kalır,
        // sadece ara waypoint'ler optimize edilir. Bu yüzden:
        // - Origin: İlk nokta
        // - Waypoints: Diğer tüm noktalar (optimize edilecek)
        // - Destination: Son nokta (ama optimize edilmiş sıraya göre değişebilir)
        // Ancak Google Maps API'de destination da optimize edilmez, sadece ara waypoint'ler optimize edilir.
        // Bu yüzden tüm noktaları gönderip, origin'i ilk nokta olarak belirleyeceğiz.
        waypoints = sortedPoints.map(point => point.coordinates);
      } else {
        // Öncelik sırasına göre: getSortedDeliveryPoints() kullan
        sortedPoints = getSortedDeliveryPoints(currentRouteType);
        waypoints = sortedPoints.map(point => point.coordinates);
      }

      // Waypoint validation: Geçersiz koordinatları filtrele ve tekrarlayanları temizle
      const validWaypoints = waypoints.filter((wp, index, self) => {
        // Geçerli koordinat kontrolü
        if (!wp || typeof wp.lat !== 'number' || typeof wp.lng !== 'number') {
          console.warn('Geçersiz waypoint filtrelendi:', wp);
          return false;
        }
        if (isNaN(wp.lat) || isNaN(wp.lng)) {
          console.warn('NaN koordinat filtrelendi:', wp);
          return false;
        }
        if (wp.lat < -90 || wp.lat > 90 || wp.lng < -180 || wp.lng > 180) {
          console.warn('Geçersiz koordinat aralığı filtrelendi:', wp);
          return false;
        }
        // Aynı koordinatların tekrar etmemesini sağla (ilk oluşumunu tut)
        const isFirstOccurrence = self.findIndex(
          (w) => Math.abs(w.lat - wp.lat) < 0.0001 && Math.abs(w.lng - wp.lng) < 0.0001
        ) === index;
        if (!isFirstOccurrence) {
          console.warn('Tekrarlayan koordinat filtrelendi:', wp);
        }
        return isFirstOccurrence;
      });

      // En az 2 geçerli waypoint olmalı
      if (validWaypoints.length < 2) {
        throw new Error('Rota hesaplamak için en az 2 geçerli teslimat noktası gerekli');
      }

      // Rota hesapla
      // calculateRoute artık error fırlatıyor, null döndürmüyor
      const routeData = await routeService.calculateRoute(validWaypoints, optimize);

      // Double-check (calculateRoute zaten kontrol ediyor ama ekstra güvenlik için)
      if (!routeData || !routeData.routes || !Array.isArray(routeData.routes) || routeData.routes.length === 0) {
        throw new Error('Rota hesaplanamadı - API boş sonuç döndü');
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

      // Rota türüne göre renk seç (currentRouteType zaten yukarıda tanımlı)
      const routeColor = ROUTE_TYPE_COLORS[currentRouteType];

      // Leaflet polyline: smoothFactor 1 = nokta sadeleştirme yok, yol formu korunur
      const polyline = L.polyline(decodedPoints, {
        color: routeColor,
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

      // Çizilen rotaya göre sıralamayı kaydet (hem priority hem shortest için)
      if (onOptimizedOrder) {
        if (optimize && routeData.waypoint_order) {
          // En kısa rota: optimize edilmiş sırayı kullan
          // waypoint_order: [2, 0, 1] gibi - tüm waypoint'lerin (origin hariç) optimize edilmiş sırası
          // Örnek: 4 waypoint varsa (origin=0, wp1=1, wp2=2, wp3=3)
          // waypoint_order [2, 0, 1] ise: wp3 önce, wp1 sonra, wp2 en son
          // Full order: [0, 3, 1, 2] olmalı
          
          // Origin her zaman 0 (ilk nokta - sabit)
          const fullOrder: number[] = [0];
          
          // Tüm waypoint'lerin orijinal index'leri (1'den waypoints.length-1'e kadar)
          // Artık tüm noktalar (origin hariç) waypoint olarak optimize ediliyor
          const waypointIndices = Array.from({ length: waypoints.length - 1 }, (_, i) => i + 1);
          
          // waypoint_order'daki değerler, waypointIndices'in optimize edilmiş sırasını gösterir
          routeData.waypoint_order.forEach((orderIndex) => {
            const originalIndex = waypointIndices[orderIndex];
            fullOrder.push(originalIndex);
          });
          
          // sortedPoints array'indeki index'leri kullanarak sıralamayı uygula
          onOptimizedOrder(fullOrder);
        } else {
          // Öncelik sırasına göre: Mevcut sırayı kullan (sortedPoints zaten önceliğe göre sıralı)
          // sortedPoints array'indeki index'leri kullan (0'dan başlayarak)
          const currentOrder = sortedPoints.map((_, index) => index);
          onOptimizedOrder(currentOrder);
        }
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Rota çizilirken hata oluştu';
      setError(errorMessage);
      console.error('Route drawing error:', err);
      hasRouteDrawnRef.current = false; // Hata durumunda false
    } finally {
      setIsDrawing(false);
    }
  }, [map, deliveryPoints, routeType, getSortedDeliveryPoints, onOptimizedOrder, enabled]);

  // Rota temizle
  const clearRoute = useCallback(() => {
    if (polylineRef.current && map) {
      map.removeLayer(polylineRef.current);
      polylineRef.current = null;
    }
    setRouteInfo(null);
    setError(null);
    hasRouteDrawnRef.current = false; // Rota temizlendi
    if (onRouteCleared) {
      onRouteCleared(); // routeOrder'ı temizle
    }
  }, [map, onRouteCleared]);

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
