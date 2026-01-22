/**
 * Map Container Component
 * Harita görüntüleme - Refactor edilmiş versiyon
 * 
 * Refactor Mantığı:
 * - Leaflet initialization → useMapInstance hook
 * - Map click handling → useMapClick hook
 * - Component sadece UI logic ve state management
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import L from 'leaflet';
import type { LocationInfo } from '@/types/geocoding.types';
import { LocationPopup } from './location-popup';
import { SearchBar } from '@/components/desktop/search';
import { LoginPopup } from '@/components/auth/login-popup';
import { UserButton } from '@/components/auth/user-button';
import { useMapInstance, useMapClick } from '@/hooks/map';
import { useAuth } from '@/contexts/AuthContext';

// Lazy load LocationInfoPanel (sadece gerektiğinde yükle)
const LocationInfoPanel = dynamic(
  () => import('@/components/desktop/panels').then(mod => ({ default: mod.LocationInfoPanel })),
  { ssr: false }
);

function MapContainer() {
  // UI State (component'te kalıyor - UI logic)
  const [selectedLocation, setSelectedLocation] = useState<LocationInfo | null>(null);
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  
  // Tek bir marker ref'i - hem arama hem harita tıklama için
  const markerRef = useRef<L.Marker | null>(null);

  // Auth Hook
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  // Business Logic Hook'ları
  const { map, mapRef, error } = useMapInstance({
    center: [41.0082, 28.9784], // İstanbul
    zoom: 12,
    scrollWheelZoom: true,
    zoomControl: false,
  });

  // Harita tıklama eventini dinle (auth kontrolü ile)
  useMapClick(map, {
    onLocationSelect: (location) => {
      // Auth kontrolü
      if (!isAuthenticated && !authLoading) {
        setShowLoginModal(true);
        return;
      }
      setSelectedLocation(location);
    },
    mapRef,
    markerRef: markerRef, // Aynı marker ref'ini kullan
  });

  // Arama sonucunda seçilen konuma git (auth kontrolü ile)
  const handleLocationSelect = (location: LocationInfo) => {
    // Auth kontrolü
    if (!isAuthenticated && !authLoading) {
      setShowLoginModal(true);
      return;
    }

    if (map) {
      const { lat, lng } = location.coordinates;
      
      // Haritayı seçilen konuma kaydır
      map.setView([lat, lng], 16, {
        animate: true,
        duration: 0.5,
      });

      // Önceki marker'ı kaldır (hem arama hem harita tıklama marker'ı için aynı ref)
      if (markerRef.current) {
        map.removeLayer(markerRef.current);
        markerRef.current = null;
      }

      // Yeni marker ekle (arama sonucu için - aynı ref kullanılıyor)
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

      // Bilgi panelini göster
      setSelectedLocation(location);
      setShowInfoPanel(true);
    }
  };

  // Konum onaylandığında (mevcut mantık korunmuştur)
  const handleConfirmLocation = (location: LocationInfo) => {
    console.log('Konum onaylandı:', location);
    // Burada teslimat noktası olarak kaydet
    setShowInfoPanel(false);
    // Marker'ı kaldır (tek marker ref'i kullanılıyor)
    if (markerRef.current && map) {
      map.removeLayer(markerRef.current);
      markerRef.current = null;
    }
    setSelectedLocation(null);
    // Popup'ı göster
    // İsterseniz başka bir işlem yapabilirsiniz
  };

  // Popup/Panel kapatıldığında marker'ı kaldır
  const handleCloseLocation = () => {
    setSelectedLocation(null);
    setShowInfoPanel(false);
    
    // Marker'ı kaldır (tek marker ref'i - hem arama hem harita tıklama için)
    if (markerRef.current && map) {
      map.removeLayer(markerRef.current);
      markerRef.current = null;
    }
  };

  if (error) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-muted">
        <div className="text-center">
          <p className="text-lg font-semibold text-destructive">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
          >
            Sayfayı Yenile
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div ref={mapRef} className="h-screen w-screen relative z-0" />
      
      {/* User Button (Top Right) */}
      <UserButton />
      
      {/* Search Bar (Desktop) */}
      <div className="fixed top-4 left-4 z-1000 w-96 max-w-[calc(100vw-2rem)]">
        <SearchBar onLocationSelect={handleLocationSelect} />
      </div>
      
      {/* Location Info Panel (Desktop) */}
      {showInfoPanel && selectedLocation && (
        <LocationInfoPanel
          location={selectedLocation}
          onClose={handleCloseLocation}
          onConfirm={handleConfirmLocation}
          title="Teslimat Noktası"
        />
      )}
      
      {/* Location Popup (Mobile/Quick View) */}
      {!showInfoPanel && selectedLocation && (
        <LocationPopup
          location={selectedLocation}
          onAdd={(location) => {
            setShowInfoPanel(true);
          }}
          onClose={handleCloseLocation}
        />
      )}

      {/* Login Modal */}
      <LoginPopup
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
    </>
  );
}

export default MapContainer;
