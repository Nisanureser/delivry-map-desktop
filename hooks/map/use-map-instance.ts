/**
 * useMapInstance Hook
 * Leaflet harita instance'ını yönetir
 * SSR-safe: Sadece client-side'da çalışır
 * 
 * NOT: Mevcut çalışan kodun mantığı korunmuştur
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import type { LeafletMap } from '@/types/leaflet';

interface UseMapInstanceOptions {
  center?: [number, number];
  zoom?: number;
  scrollWheelZoom?: boolean;
  zoomControl?: boolean;
}

interface UseMapInstanceReturn {
  map: LeafletMap | null;
  mapRef: React.RefObject<HTMLDivElement | null>;
  error: string | null;
}

const DEFAULT_CENTER: [number, number] = [41.0082, 28.9784]; // İstanbul
const DEFAULT_ZOOM = 12;

export function useMapInstance(
  options: UseMapInstanceOptions = {}
): UseMapInstanceReturn {
  const {
    center = DEFAULT_CENTER,
    zoom = DEFAULT_ZOOM,
    scrollWheelZoom = true,
    zoomControl = false,
  } = options;

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<LeafletMap | null>(null);
  const [map, setMap] = useState<LeafletMap | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Client-side'da çalıştığından emin ol
    if (typeof window === 'undefined' || !mapRef.current) {
      return;
    }

    // Harita zaten oluşturulmuşsa tekrar oluşturma
    if (mapInstanceRef.current) {
      return;
    }

    let isMounted = true;

    // Leaflet'i dinamik olarak import et (sadece client-side'da)
    import('leaflet')
      .then((L) => {
        // Component unmount olmuşsa işlemi durdur
        if (!isMounted || !mapRef.current || mapInstanceRef.current) return;

        try {
          // Leaflet haritasını oluştur
          const mapInstance = L.default.map(mapRef.current, {
            center,
            zoom,
            scrollWheelZoom,
            zoomControl,
          });

          // OpenStreetMap tile layer ekle
          L.default
            .tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              attribution:
                '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
              maxZoom: 19,
              tileSize: 256,
              zoomOffset: 0,
            })
            .addTo(mapInstance);

          mapInstanceRef.current = mapInstance;
          setMap(mapInstance); // State'i güncelle (re-render için)
          setError(null);
        } catch (err) {
          console.error('Harita oluşturma hatası:', err);
          setError('Harita yüklenirken bir hata oluştu');
        }
      })
      .catch((err) => {
        console.error('Leaflet yükleme hatası:', err);
        setError('Harita kütüphanesi yüklenemedi');
      });

    // Cleanup
    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (err) {
          console.error('Harita temizleme hatası:', err);
        }
        mapInstanceRef.current = null;
      }
    };
  }, []); // Boş array - sadece mount'ta çalışsın (mevcut çalışan kod mantığı)

  return {
    map,
    mapRef,
    error,
  };
}
