/**
 * useMapClick Hook
 * Harita tıklama eventlerini yönetir
 * Reverse geocoding ile adres bilgisi getirir
 * 
 * NOT: Mevcut çalışan kodun mantığı korunmuştur
 */

'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import type { LeafletMap } from '@/types/leaflet';
import type { LocationInfo } from '@/types/geocoding.types';
import geocodingService from '@/services/geocoding-service';

interface UseMapClickOptions {
  onLocationSelect?: (location: LocationInfo) => void;
  mapRef?: React.RefObject<HTMLDivElement | null>;
  markerRef?: React.MutableRefObject<L.Marker | null>;
}

export function useMapClick(
  map: LeafletMap | null,
  options: UseMapClickOptions = {}
) {
  const { onLocationSelect, mapRef, markerRef: externalMarkerRef } = options;
  const callbackRef = useRef(onLocationSelect);
  const internalMarkerRef = useRef<L.Marker | null>(null);
  const markerRef = externalMarkerRef || internalMarkerRef;

  // Callback'i ref'te sakla (dependency sorununu önlemek için)
  useEffect(() => {
    callbackRef.current = onLocationSelect;
  }, [onLocationSelect]);

  useEffect(() => {
    if (!map) return;

    // Harita tıklama eventi (mevcut mantık aynen korunmuştur)
    const handleMapClick = async (e: any) => {
      const { lat, lng } = e.latlng;

      // Loading cursor ekle
      if (mapRef?.current) {
        mapRef.current.style.cursor = 'progress';
      }

      // Önceki marker'ı kaldır
      if (markerRef.current) {
        map.removeLayer(markerRef.current);
        markerRef.current = null;
      }

      // Yeni marker ekle (tıklanan yere) - Google Maps tarzı kırmızı marker
      const newMarker = L.marker([lat, lng], {
        icon: L.icon({
          iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
          iconSize: [20, 30],
          iconAnchor: [10, 30],
          popupAnchor: [1, -34],
          tooltipAnchor: [0, -41],
          shadowSize: [41, 41]
        }),
        draggable: false
      }).addTo(map);

      markerRef.current = newMarker;

      try {
        // Reverse geocoding yap
        const result = await geocodingService.reverseGeocode(lat, lng);

        if (result && callbackRef.current) {
          callbackRef.current(result);
        }
      } catch (error) {
        console.error('Konum bilgisi alınamadı:', error);
      } finally {
        // Loading cursor kaldır
        if (mapRef?.current) {
          mapRef.current.style.cursor = '';
        }
      }
    };

    // Event listener ekle
    map.on('click', handleMapClick);

    // Cleanup
    return () => {
      map.off('click', handleMapClick);
      // Marker'ı temizle
      if (markerRef.current) {
        map.removeLayer(markerRef.current);
        markerRef.current = null;
      }
      if (mapRef?.current) {
        mapRef.current.style.cursor = '';
      }
    };
  }, [map, mapRef]); // onLocationSelect dependency'den çıkarıldı (ref kullanıyoruz)
}
