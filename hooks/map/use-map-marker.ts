/**
 * useMapMarker Hook
 * Harita üzerinde tek bir marker yönetimi
 * 
 * Profesyonel Yaklaşım:
 * - Marker oluşturma, silme, güncelleme mantığı burada
 * - Component'ten marker yönetimi soyutlanır
 * - Reusable ve test edilebilir
 */

'use client';

import { useRef, useCallback } from 'react';
import L from 'leaflet';
import type { LeafletMap } from '@/types/leaflet';
import type { LocationInfo } from '@/types/geocoding.types';

interface UseMapMarkerOptions {
  map: LeafletMap | null;
  iconConfig?: {
    iconUrl?: string;
    shadowUrl?: string;
    iconSize?: [number, number];
    iconAnchor?: [number, number];
  };
}

interface UseMapMarkerReturn {
  addMarker: (location: LocationInfo) => void;
  addMarkerAtCoordinates: (lat: number, lng: number) => void;
  removeMarker: () => void;
  hasMarker: () => boolean;
}

const DEFAULT_ICON_CONFIG = {
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [20, 30] as [number, number],
  iconAnchor: [10, 30] as [number, number],
  popupAnchor: [1, -34] as [number, number],
  tooltipAnchor: [0, -41] as [number, number],
  shadowSize: [41, 41] as [number, number],
};

export function useMapMarker(options: UseMapMarkerOptions): UseMapMarkerReturn {
  const { map, iconConfig = {} } = options;
  const markerRef = useRef<L.Marker | null>(null);

  // Marker oluştur (icon config ile)
  const createMarker = useCallback((lat: number, lng: number): L.Marker => {
    const config = { ...DEFAULT_ICON_CONFIG, ...iconConfig };
    
    return L.marker([lat, lng], {
      icon: L.icon({
        iconUrl: config.iconUrl!,
        shadowUrl: config.shadowUrl!,
        iconSize: config.iconSize!,
        iconAnchor: config.iconAnchor!,
        popupAnchor: config.popupAnchor!,
        tooltipAnchor: config.tooltipAnchor!,
        shadowSize: config.shadowSize!,
      }),
      draggable: false,
    });
  }, [iconConfig]);

  // Marker ekle (LocationInfo ile)
  const addMarker = useCallback((location: LocationInfo) => {
    if (!map) return;
    
    const { lat, lng } = location.coordinates;
    addMarkerAtCoordinates(lat, lng);
  }, [map]);

  // Marker ekle (koordinatlar ile)
  const addMarkerAtCoordinates = useCallback((lat: number, lng: number) => {
    if (!map) return;

    // Önceki marker'ı kaldır
    if (markerRef.current) {
      map.removeLayer(markerRef.current);
      markerRef.current = null;
    }

    // Yeni marker oluştur ve ekle
    const newMarker = createMarker(lat, lng);
    newMarker.addTo(map);
    markerRef.current = newMarker;
  }, [map, createMarker]);

  // Marker kaldır
  const removeMarker = useCallback(() => {
    if (!map || !markerRef.current) return;

    map.removeLayer(markerRef.current);
    markerRef.current = null;
  }, [map]);

  // Marker var mı kontrol et
  const hasMarker = useCallback(() => {
    return markerRef.current !== null;
  }, []);

  return {
    addMarker,
    addMarkerAtCoordinates,
    removeMarker,
    hasMarker,
  };
}
