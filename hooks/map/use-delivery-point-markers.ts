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

import React, { useEffect, useRef } from 'react';
import { createRoot, Root } from 'react-dom/client';
import L from 'leaflet';
import type { LeafletMap } from '@/types/leaflet';
import type { DeliveryPoint } from '@/types/delivery.types';
import { PRIORITY_MARKER_COLORS } from '@/constants/priorities';
import { DeliveryPointPopup } from '@/components/map/delivery-point-popup';

interface UseDeliveryPointMarkersOptions {
  map: LeafletMap | null;
  deliveryPoints: DeliveryPoint[];
}

export function useDeliveryPointMarkers({
  map,
  deliveryPoints,
}: UseDeliveryPointMarkersOptions) {
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const popupRootsRef = useRef<Map<string, Root>>(new Map());

  useEffect(() => {
    if (!map) return;

    const markers = markersRef.current;

    // Mevcut marker'ları ve popup'ları temizle
    markers.forEach((marker) => {
      // Popup'ı kapat
      if (marker.isPopupOpen()) {
        marker.closePopup();
      }
      map.removeLayer(marker);
    });
    markers.clear();
    
    // Popup root'larını asenkron olarak temizle (React render'ı tamamlanana kadar bekle)
    const rootsToUnmount = Array.from(popupRootsRef.current.values());
    popupRootsRef.current.clear();
    
    // Asenkron unmount - React render'ı tamamlandıktan sonra
    setTimeout(() => {
      rootsToUnmount.forEach((root) => {
        try {
          root.unmount();
        } catch (error) {
          // Root zaten unmount edilmiş olabilir, hata yok say
        }
      });
    }, 0);

    // Her teslimat noktası için marker oluştur
    deliveryPoints.forEach((point) => {
      const { lat, lng } = point.coordinates;
      const order = point.order || 1;

      // Önceliğe göre renk belirle
      const color = PRIORITY_MARKER_COLORS[point.priority] || PRIORITY_MARKER_COLORS.normal;

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

      // Popup container oluştur
      const popupContainer = document.createElement('div');
      const popupRoot = createRoot(popupContainer);
      popupRoot.render(React.createElement(DeliveryPointPopup, { point }));
      popupRootsRef.current.set(point.id, popupRoot);

      // Popup'ı marker'a bağla
      marker.bindPopup(popupContainer, {
        className: 'delivery-point-popup',
        closeButton: true,
        offset: [0, -10],
        maxWidth: 240,
      });

      markers.set(point.id, marker);
    });

    // Cleanup
    return () => {
      markers.forEach((marker) => {
        // Popup'ı kapat
        if (marker.isPopupOpen()) {
          marker.closePopup();
        }
        map.removeLayer(marker);
      });
      markers.clear();
      
      // Popup root'larını asenkron olarak temizle (React render'ı tamamlanana kadar bekle)
      const rootsToUnmount = Array.from(popupRootsRef.current.values());
      popupRootsRef.current.clear();
      
      // Asenkron unmount - React render'ı tamamlandıktan sonra
      setTimeout(() => {
        rootsToUnmount.forEach((root) => {
          try {
            root.unmount();
          } catch (error) {
            // Root zaten unmount edilmiş olabilir, hata yok say
          }
        });
      }, 0);
    };
  }, [map, deliveryPoints]);

  return {
    markers: markersRef.current,
  };
}
