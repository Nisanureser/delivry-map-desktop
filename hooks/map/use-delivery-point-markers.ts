/**
 * useDeliveryPointMarkers Hook
 * Teslimat noktaları marker'larını yönetir
 * 
 * Profesyonel Yaklaşım:
 * - Marker oluşturma, silme mantığı burada
 * - Component'ten marker yönetimi soyutlanır
 * - Reusable ve test edilebilir
 */

'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import type { LeafletMap } from '@/types/leaflet';
import type { DeliveryPoint } from '@/types/delivery.types';

interface UseDeliveryPointMarkersOptions {
  map: LeafletMap | null;
  deliveryPoints: DeliveryPoint[];
}

export function useDeliveryPointMarkers({
  map,
  deliveryPoints,
}: UseDeliveryPointMarkersOptions) {
  const markersRef = useRef<Map<string, L.Marker>>(new Map());

  useEffect(() => {
    if (!map) return;

    const markers = markersRef.current;

    // Mevcut marker'ları temizle
    markers.forEach((marker) => {
      map.removeLayer(marker);
    });
    markers.clear();

    // Her teslimat noktası için marker oluştur
    deliveryPoints.forEach((point) => {
      const { lat, lng } = point.coordinates;
      const order = point.order || 1;

      // Önceliğe göre renk belirle
      const priorityColors: Record<string, string> = {
        high: '#ef4444', // red
        normal: '#f97316', // orange
        low: '#22c55e', // green
      };
      const color = priorityColors[point.priority] || priorityColors.normal;

      // Numaralı marker oluştur
      const marker = L.marker([lat, lng], {
        icon: L.divIcon({
          className: 'delivery-point-marker',
          html: `
            <div style="
              width: 24px;
              height: 24px;
              border-radius: 50%;
              background: ${color};
              border: 1px solid white;
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: bold;
              font-size: 14px;
              color: white;
            ">${order}</div>
          `,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        }),
        zIndexOffset: 1000 + order, // Öncelik sırasına göre z-index
      }).addTo(map);

      markers.set(point.id, marker);
    });

    // Cleanup
    return () => {
      markers.forEach((marker) => {
        map.removeLayer(marker);
      });
      markers.clear();
    };
  }, [map, deliveryPoints]);

  return {
    markers: markersRef.current,
  };
}
