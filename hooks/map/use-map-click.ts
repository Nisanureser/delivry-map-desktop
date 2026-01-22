/**
 * useMapClick Hook
 * Harita tıklama eventlerini yönetir
 * Reverse geocoding ile adres bilgisi getirir
 * 
 * NOT: Mevcut çalışan kodun mantığı korunmuştur
 */

'use client';

import { useEffect, useRef } from 'react';
import type { LeafletMap } from '@/types/leaflet';
import type { LocationInfo } from '@/types/geocoding.types';
import geocodingService from '@/services/geocoding-service';

interface UseMapClickOptions {
  onLocationSelect?: (location: LocationInfo) => void;
  mapRef?: React.RefObject<HTMLDivElement | null>;
}

export function useMapClick(
  map: LeafletMap | null,
  options: UseMapClickOptions = {}
) {
  const { onLocationSelect, mapRef } = options;
  const callbackRef = useRef(onLocationSelect);

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
      if (mapRef?.current) {
        mapRef.current.style.cursor = '';
      }
    };
  }, [map, mapRef]); // onLocationSelect dependency'den çıkarıldı (ref kullanıyoruz)
}
