'use client';

import { useEffect, useRef, useState } from 'react';
import type { LeafletMap } from '@/types/leaflet';

const defaultCenter: [number, number] = [41.0082, 28.9784]; // İstanbul
const defaultZoom = 12;

function MapContainer() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<LeafletMap | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  return <div ref={mapRef} className="h-screen w-screen" />;
}

export default MapContainer;
