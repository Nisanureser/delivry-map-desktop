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
  onMarkerAdd?: (lat: number, lng: number) => void;
}

export function useMapClick(
  map: LeafletMap | null,
  options: UseMapClickOptions = {}
) {
  const { onLocationSelect, mapRef, onMarkerAdd } = options;
  const callbackRef = useRef(onLocationSelect);
  const markerCallbackRef = useRef(onMarkerAdd);

  // Callback'leri ref'te sakla (dependency sorununu önlemek için)
  useEffect(() => {
    callbackRef.current = onLocationSelect;
    markerCallbackRef.current = onMarkerAdd;
  }, [onLocationSelect, onMarkerAdd]);

  useEffect(() => {
    if (!map) return;

    // Harita tıklama eventi (mevcut mantık aynen korunmuştur)
    const handleMapClick = async (e: any) => {
      const { lat, lng } = e.latlng;

      // Loading cursor ekle
      if (mapRef?.current) {
        mapRef.current.style.cursor = 'progress';
      }

      // Marker ekleme callback'ini çağır (marker yönetimi hook'ta yapılacak)
      if (markerCallbackRef.current) {
        markerCallbackRef.current(lat, lng);
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
