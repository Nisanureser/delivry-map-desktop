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

import { useState } from 'react';
import dynamic from 'next/dynamic';
import type { LocationInfo } from '@/types/geocoding.types';
import { LocationPopup } from './location-popup';
import { SearchBar } from '@/components/desktop/search';
import { LoginPopup } from '@/components/auth/login-popup';
import { UserButton } from '@/components/auth/user-button';
import { DesktopSidebar } from '@/components/desktop/desktop-sidebar';
import { DeliveryPointPanel } from '@/components/desktop/panels/delivery-point-panel';
import { RouteInfoPanel } from '@/components/desktop/panels/route-info-panel';
import { useMapInstance, useMapClick, useMapMarker, useDeliveryPointMarkers } from '@/hooks/map';
import { useAuth } from '@/contexts/AuthContext';
import { useDeliveryPoints } from '@/contexts/DeliveryPointsContext';
import { requireAuth } from '@/lib/auth-utils';
import { RouteDrawButton } from './route-draw-button';

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
  const [activeSidebarTab, setActiveSidebarTab] = useState<'routes' | 'data' | null>(null);
  const [isDeliveryPanelOpen, setIsDeliveryPanelOpen] = useState(false);
  const [isRouteInfoPanelOpen, setIsRouteInfoPanelOpen] = useState(false);
  const [routeInfo, setRouteInfo] = useState<{
    distance: string;
    duration: string;
    summary: string;
  } | null>(null);

  // Auth Hook
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  
  // Business Logic Hook'ları
  const { map, mapRef, error } = useMapInstance({
    center: [41.0082, 28.9784], // İstanbul
    zoom: 12,
    scrollWheelZoom: true,
    zoomControl: false,
  });

  // Delivery Points Hook
  const { deliveryPoints, addDeliveryPoint } = useDeliveryPoints();

  // Delivery Point Markers Hook ( marker yönetimi hook'ta)
  useDeliveryPointMarkers({ map, deliveryPoints });

  // Marker yönetimi hook'u  geçici marker için)
  const { addMarker, addMarkerAtCoordinates, removeMarker } = useMapMarker({ map });

  // Sidebar tab değiştiğinde panel'i toggle et
  const handleSidebarTabChange = (tab: 'routes' | 'data') => {
    if (tab === 'routes') {
      // Toggle logic: Eğer zaten routes'taysa toggle, değilse aç
      if (activeSidebarTab === 'routes') {
        setIsDeliveryPanelOpen((prev) => !prev);
      } else {
        setActiveSidebarTab('routes');
        setIsDeliveryPanelOpen(true);
        setIsRouteInfoPanelOpen(false);
      }
    } else {
      // Rota Verileri seçildiğinde RouteInfoPanel'i aç/kapat
      if (activeSidebarTab === 'data') {
        setIsRouteInfoPanelOpen((prev) => !prev);
      } else {
        setActiveSidebarTab('data');
        setIsRouteInfoPanelOpen(true);
        setIsDeliveryPanelOpen(false);
      }
    }
  };


  // Harita tıklama eventini dinle (auth kontrolü ile)
  useMapClick(map, {
    onLocationSelect: (location) => {
      // Auth kontrolü (utility function ile)
      if (!requireAuth(isAuthenticated, authLoading, () => setShowLoginModal(true))) {
        return;
      }
      setSelectedLocation(location);
    },
    mapRef,
    onMarkerAdd: (lat, lng) => {
      // Marker ekle (hook üzerinden)
      addMarkerAtCoordinates(lat, lng);
    },
  });

  // Arama sonucunda seçilen konuma git (auth kontrolü ile)
  const handleLocationSelect = (location: LocationInfo) => {
    // Auth kontrolü (utility function ile)
    if (!requireAuth(isAuthenticated, authLoading, () => setShowLoginModal(true))) {
      return;
    }

    if (map) {
      const { lat, lng } = location.coordinates;
      
      // Haritayı seçilen konuma kaydır
      map.setView([lat, lng], 16, {
        animate: true,
        duration: 0.5,
      });

      // Marker ekle (hook üzerinden - otomatik olarak önceki marker kaldırılır)
      addMarker(location);

      // Bilgi panelini göster
      setSelectedLocation(location);
      setShowInfoPanel(true);
    }
  };

  // Konum onaylandığında - Teslimat noktasına ekle
  const handleConfirmLocation = (location: LocationInfo) => {
    // Teslimat noktasına ekle (varsayılan öncelik: normal)
    addDeliveryPoint(location, 'normal');
    
    setShowInfoPanel(false);
    // Geçici marker'ı kaldır (teslimat noktası marker'ı zaten eklendi)
    removeMarker();
    setSelectedLocation(null);
  };

  // Popup/Panel kapatıldığında marker'ı kaldır
  const handleCloseLocation = () => {
    setSelectedLocation(null);
    setShowInfoPanel(false);
    // Marker'ı kaldır (hook üzerinden)
    removeMarker();
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
      
      {/* Desktop Sidebar (Sol taraf - Navigation rail) */}
      <DesktopSidebar 
        activeTab={activeSidebarTab} 
        onTabChange={handleSidebarTabChange} 
      />
      
      {/* User Button (Top Right) */}
      <UserButton />
      
      {/* Search Bar (Desktop) - Sabit, sidebar'ın yanında */}
      <div className="fixed left-20 top-4 z-1000 w-96 max-w-[calc(100vw-2rem)]">
        <SearchBar onLocationSelect={handleLocationSelect} />
      </div>

      {/* Delivery Point Panel - Search bar'ın altında açılır */}
      <DeliveryPointPanel
        isOpen={isDeliveryPanelOpen}
        onClose={() => setIsDeliveryPanelOpen(false)}
      />

      {/* Route Info Panel - Rota Verileri tab'ında açılır */}
      <RouteInfoPanel
        isOpen={isRouteInfoPanelOpen}
        onClose={() => setIsRouteInfoPanelOpen(false)}
        map={map}
        routeInfo={routeInfo}
      />
      
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
            // Teslimat noktasına ekle (varsayılan öncelik: normal)
            addDeliveryPoint(location, 'normal');
            // Geçici marker'ı kaldır
            removeMarker();
            setSelectedLocation(null);
          }}
          onClose={handleCloseLocation}
        />
      )}

      {/* Login Modal */}
      <LoginPopup
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />

      {/* Route Draw Button - Sağ alt köşe */}
      <RouteDrawButton 
        map={map} 
        onRouteInfoChange={setRouteInfo}
      />
    </>
  );
}

export default MapContainer;
