'use client';

import { useEffect, useRef, useState } from 'react';
import type { LeafletMap } from '@/types/leaflet';
import type { LocationInfo } from '@/types/geocoding.types';
import { LocationPopup } from './location-popup';
import { SearchBar } from '@/components/desktop/search/search-bar';
import { LocationInfoPanel } from '@/components/desktop/panels/location-info-panel';
import geocodingService from '@/services/geocoding-service';

const defaultCenter: [number, number] = [41.0082, 28.9784]; // İstanbul
const defaultZoom = 12;

function MapContainer() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<LeafletMap | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<LocationInfo | null>(null);
  const [showInfoPanel, setShowInfoPanel] = useState(false);

  // Arama sonucunda seçilen konuma git
  const handleLocationSelect = (location: LocationInfo) => {
    if (mapInstanceRef.current) {
      const { lat, lng } = location.coordinates;
      mapInstanceRef.current.setView([lat, lng], 16, {
        animate: true,
        duration: 0.5,
      });
      // Bilgi panelini göster
      setSelectedLocation(location);
      setShowInfoPanel(true);
    }
  };

  // Konum onaylandığında
  const handleConfirmLocation = (location: LocationInfo) => {
    console.log('Konum onaylandı:', location);
    // Burada teslimat noktası olarak kaydet
    setShowInfoPanel(false);
    // Popup'ı göster
    // İsterseniz başka bir işlem yapabilirsiniz
  };

  useEffect(() => {
    // Client-side'da çalıştığından emin ol
    if (typeof window === 'undefined' || !mapRef.current) return;

    // Harita zaten oluşturulmuşsa tekrar oluşturma
    if (mapInstanceRef.current) return;

    let isMounted = true;

    // Leaflet'i dinamik olarak import et (sadece client-side'da)
    import('leaflet')
      .then((L) => {
        // Component unmount olmuşsa işlemi durdur
        if (!isMounted || !mapRef.current || mapInstanceRef.current) return;

        try {
          // Leaflet haritasını oluştur
          const map = L.default.map(mapRef.current, {
            center: defaultCenter,
            zoom: defaultZoom,
            scrollWheelZoom: true,
            zoomControl: false, // +/- zoom kontrollerini kaldır
          });

          // OpenStreetMap tile layer ekle
          L.default.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution:
              '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19,
            tileSize: 256,
            zoomOffset: 0,
          }).addTo(map);

          // Harita tıklama eventi
          map.on('click', async (e) => {
            const { lat, lng } = e.latlng;
            
            // Loading cursor ekle
            if (mapRef.current) {
              mapRef.current.style.cursor = 'progress';
            }

            try {
              // Reverse geocoding yap
              const result = await geocodingService.reverseGeocode(lat, lng);

              if (result) {
                setSelectedLocation(result);
              }
            } catch (error) {
              console.error('Konum bilgisi alınamadı:', error);
            } finally {
              // Loading cursor kaldır
              if (mapRef.current) {
                mapRef.current.style.cursor = '';
              }
            }
          });

          mapInstanceRef.current = map;
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
  }, []);

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
      <div ref={mapRef} className="h-screen w-screen" />
      
      {/* Search Bar (Desktop) */}
      <div className="fixed top-4 left-4 z-[1000] w-96 max-w-[calc(100vw-2rem)]">
        <SearchBar onLocationSelect={handleLocationSelect} />
      </div>
      
      {/* Location Info Panel (Desktop) */}
      {showInfoPanel && selectedLocation && (
        <LocationInfoPanel
          location={selectedLocation}
          onClose={() => setShowInfoPanel(false)}
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
          onClose={() => setSelectedLocation(null)}
        />
      )}
    </>
  );
}

export default MapContainer;
