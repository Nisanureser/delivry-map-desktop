/**
 * useDeliveryPointMarkers Hook
 * Teslimat noktaları marker'larını yönetir
 *
 * Profesyonel Yaklaşım:
 * - Marker oluşturma, silme mantığı burada
 * - Component'ten marker yönetimi soyutlanır
 * - Reusable ve test edilebilir
 */

"use client";

import React, { useEffect, useRef, useMemo } from "react";
import { createRoot, Root } from "react-dom/client";
import L from "leaflet";
import type { LeafletMap } from "@/types/leaflet";
import type { DeliveryPoint } from "@/types/delivery.types";
import { PRIORITY_MARKER_COLORS } from "@/constants/priorities";
import { DeliveryPointPopup } from "@/components/map/delivery-point-popup";
import { useDeliveryPoints } from "@/contexts/DeliveryPointsContext";

interface UseDeliveryPointMarkersOptions {
  map: LeafletMap | null;
  deliveryPoints: DeliveryPoint[];
}

export function useDeliveryPointMarkers({
  map,
}: UseDeliveryPointMarkersOptions) {
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const popupRootsRef = useRef<Map<string, Root>>(new Map());
  const { getSortedDeliveryPoints } = useDeliveryPoints();

  // Route type'a göre sıralanmış teslimat noktaları
  const sortedDeliveryPoints = useMemo(
    () => getSortedDeliveryPoints(),
    [getSortedDeliveryPoints],
  );

  useEffect(() => {
    if (!map) return;

    const markers = markersRef.current;
    const popupRoots = popupRootsRef.current;

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
    const rootsToUnmount = Array.from(popupRoots.values());
    popupRoots.clear();

    // Asenkron unmount - React render'ı tamamlandıktan sonra
    setTimeout(() => {
      rootsToUnmount.forEach((root) => {
        try {
          root.unmount();
        } catch {
          // Root zaten unmount edilmiş olabilir, hata yok say
        }
      });
    }, 0);

    // Her teslimat noktası için marker oluştur (sıralanmış sıraya göre)
    sortedDeliveryPoints.forEach((point, index) => {
      const { lat, lng } = point.coordinates;
      // Rotaya göre sıralanmış noktaların index'ini kullan (1'den başlayarak)
      const order = index + 1;

      // Önceliğe göre renk belirle
      const color =
        PRIORITY_MARKER_COLORS[point.priority] || PRIORITY_MARKER_COLORS.normal;

      // Numaralı marker oluştur
      const marker = L.marker([lat, lng], {
        icon: L.divIcon({
          className: "delivery-point-marker",
          html: `
            <div style="
              width: 18px;
              height: 18px;
              border-radius: 50%;
              background: ${color};
              border: 1px solid white;
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: bold;
              font-size: 12px;
              color: white;
            ">${order}</div>
          `,
          iconSize: [18, 18],
          iconAnchor: [9, 9],
        }),
        zIndexOffset: 1000 + order, // Öncelik sırasına göre z-index
      }).addTo(map);

      // Popup container oluştur
      const popupContainer = document.createElement("div");
      const popupRoot = createRoot(popupContainer);
      // Rotaya göre sıralanmış noktaların index'ini point'e ekle
      const pointWithRouteOrder = { ...point, order };
      popupRoot.render(
        React.createElement(DeliveryPointPopup, { point: pointWithRouteOrder }),
      );
      popupRoots.set(point.id, popupRoot);

      // Popup'ı marker'a bağla
      marker.bindPopup(popupContainer, {
        className: "delivery-point-popup",
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
      const rootsToUnmountCleanup = Array.from(popupRoots.values());
      popupRoots.clear();

      // Asenkron unmount - React render'ı tamamlandıktan sonra
      setTimeout(() => {
        rootsToUnmountCleanup.forEach((root) => {
          try {
            root.unmount();
          } catch {
            // Root zaten unmount edilmiş olabilir, hata yok say
          }
        });
      }, 0);
    };
  }, [map, sortedDeliveryPoints]);

  return {
    // markers: markersRef.current,
  };
}
