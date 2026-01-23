/**
 * Route Draw Button Component
 * Teslimat noktalarına göre rota çizen buton
 * Haritanın sağ alt köşesinde konumlandırılmış
 */

'use client';

import { Send, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useRouteDrawing } from '@/hooks/routing';
import { useDeliveryPoints } from '@/contexts/DeliveryPointsContext';
import type { LeafletMap } from '@/types/leaflet';

interface RouteDrawButtonProps {
  map: LeafletMap | null;
}

export function RouteDrawButton({ map }: RouteDrawButtonProps) {
  const { deliveryPoints } = useDeliveryPoints();
  const { isDrawing, error, drawRoute, routeInfo } = useRouteDrawing({
    map,
    deliveryPoints,
    enabled: true,
  });

  const [showTooltip, setShowTooltip] = useState(false);

  // En az 2 teslimat noktası varsa buton aktif
  const isDisabled = deliveryPoints.length < 2 || isDrawing;

  const handleClick = async () => {
    if (isDisabled) return;
    await drawRoute();
  };

  return (
    <>
      {/* Buton Container - Sağ alt köşe */}
      <div className="fixed bottom-6 right-6 z-[1000] flex flex-col items-end gap-3">
        {/* Tooltip */}
        {showTooltip && !isDrawing && (
          <div className="bg-gray-900 dark:bg-gray-800 text-white text-xs px-3 py-2 rounded-lg shadow-lg whitespace-nowrap animate-fade-in">
            ÖNERİLEN ROTA
          </div>
        )}

        {/* Rota Çiz Butonu */}
        <button
          onClick={handleClick}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          disabled={isDisabled}
          className={`
            w-14 h-14 rounded-full shadow-lg
            flex items-center justify-center
            transition-all duration-200
            ${
              isDisabled
                ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed'
                : 'bg-green-500 hover:bg-green-600 active:bg-green-700 cursor-pointer hover:scale-105 active:scale-95'
            }
          `}
          title={deliveryPoints.length < 2 ? 'En az 2 teslimat noktası gerekli' : 'Önerilen Rota Çiz'}
        >
          {isDrawing ? (
            <Loader2 className="w-6 h-6 text-white animate-spin" />
          ) : (
            <Send className="w-6 h-6 text-white" />
          )}
        </button>

        {/* Hata Mesajı */}
        {error && (
          <div className="bg-red-500 text-white text-xs px-3 py-2 rounded-lg shadow-lg max-w-xs animate-fade-in">
            {error}
          </div>
        )}

        {/* Rota Bilgisi */}
        {routeInfo && !error && (
          <div className="bg-blue-500 text-white text-xs px-3 py-2 rounded-lg shadow-lg animate-fade-in">
            <div className="font-semibold">{routeInfo.summary}</div>
            <div className="text-blue-100">
              {routeInfo.distance} • {routeInfo.duration}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
