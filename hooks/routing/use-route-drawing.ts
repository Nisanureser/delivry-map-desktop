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
      const encodedPolyline = route.overview_polyline.points;

      // Polyline'ı decode et
      const decodedPoints = decodePolyline(encodedPolyline);

      // Leaflet polyline oluştur
      const polyline = L.polyline(decodedPoints, {
        color: '#3b82f6', // Mavi renk
        weight: 5,
        opacity: 0.8,
        smoothFactor: 1,
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

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Rota çizilirken hata oluştu';
      setError(errorMessage);
      console.error('Route drawing error:', err);
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
  }, [map]);

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
