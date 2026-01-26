/**
 * Route Draw Button Component
 * Teslimat noktalarına göre rota çizen buton
 * Haritanın sağ alt köşesinde konumlandırılmış
 */

'use client';

import { Send, Loader2, Route } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouteDrawing } from '@/hooks/routing';
import { useDeliveryPoints } from '@/contexts/DeliveryPointsContext';
import type { LeafletMap } from '@/types/leaflet';

interface RouteDrawButtonProps {
  map: LeafletMap | null;
  onRouteInfoChange?: (routeInfo: {
    distance: string;
    duration: string;
    summary: string;
  } | null) => void;
}

export function RouteDrawButton({ map, onRouteInfoChange }: RouteDrawButtonProps) {
  const { deliveryPoints, routeType, setRouteType, applyOptimizedOrder, getSortedDeliveryPoints } = useDeliveryPoints();
  const { isDrawing, error, drawRoute, clearRoute, routeInfo } = useRouteDrawing({
    map,
    deliveryPoints,
    routeType,
    getSortedDeliveryPoints,
    onOptimizedOrder: (order) => {
      // Optimize edilmiş sırayı uygula
      applyOptimizedOrder(order);
    },
    onRouteCleared: () => {
      // Rota temizlendiğinde callback
    },
    enabled: true,
  });

  // RouteInfo değiştiğinde parent'a bildir
  useEffect(() => {
    if (onRouteInfoChange) {
      onRouteInfoChange(routeInfo);
    }
  }, [routeInfo, onRouteInfoChange]);

  const [showTooltip, setShowTooltip] = useState<string | null>(null);

  // En az 2 teslimat noktası varsa buton aktif (rota varsa da aktif - kapatmak için)
  const isDisabled = (deliveryPoints.length < 2 && !routeInfo) || isDrawing;

  // Öncelik sırasına göre rota çiz
  const handlePriorityRoute = async () => {
    if (routeType !== 'priority') {
      setRouteType('priority');
      clearRoute();
      // Yeni routeType ile direkt çiz (overrideRouteType parametresi ile)
      if (deliveryPoints.length >= 2) {
        await drawRoute('priority');
      }
    } else {
      // Aynı tip seçiliyse toggle et
      if (routeInfo) {
        clearRoute();
      } else {
        if (deliveryPoints.length >= 2 && !isDrawing) {
          await drawRoute();
        }
      }
    }
  };

  // En kısa rota çiz
  const handleShortestRoute = async () => {
    if (routeType !== 'shortest') {
      setRouteType('shortest');
      clearRoute();
      // Yeni routeType ile direkt çiz (overrideRouteType parametresi ile)
      if (deliveryPoints.length >= 2) {
        await drawRoute('shortest');
      }
    } else {
      // Aynı tip seçiliyse toggle et
      if (routeInfo) {
        clearRoute();
      } else {
        if (deliveryPoints.length >= 2 && !isDrawing) {
          await drawRoute();
        }
      }
    }
  };

  return (
    <>
      {/* Buton Container - Sağ alt köşe, sabit pozisyon (bilgi kutusu dışında) */}
      <div className="fixed bottom-[85px] right-6 z-1000 flex flex-col items-end gap-3">
        {/* Tooltip */}
        {showTooltip && !isDrawing && (
          <div className="bg-gray-900 dark:bg-gray-800 text-white text-xs px-3 py-2 rounded-lg shadow-lg whitespace-nowrap animate-fade-in">
            {showTooltip}
          </div>
        )}

        {/* En Kısa Rota Butonu */}
        <button
          onClick={handleShortestRoute}
          onMouseEnter={() => setShowTooltip('EN KISA ROTA')}
          onMouseLeave={() => setShowTooltip(null)}
          disabled={isDisabled}
          className={`
            w-14 h-14 rounded-full shadow-lg
            flex items-center justify-center
            transition-all duration-200
            relative
            ${
              isDisabled
                ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed'
                : routeType === 'shortest' && routeInfo
                ? 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 cursor-pointer hover:scale-105 active:scale-95'
                : 'bg-blue-500 hover:bg-blue-600 active:bg-blue-700 cursor-pointer hover:scale-105 active:scale-95'
            }
          `}
          title={
            deliveryPoints.length < 2 && !routeInfo
              ? 'En az 2 teslimat noktası gerekli'
              : routeType === 'shortest' && routeInfo
              ? 'Rotayı Kapat'
              : 'En Kısa Rota Çiz'
          }
        >
          {isDrawing && routeType === 'shortest' ? (
            <Loader2 className="w-6 h-6 text-white animate-spin" />
          ) : (
            <>
<Route className="w-5 h-5 text-white z-10 " />

<svg
  viewBox="0 0 100 100"
  className="absolute inset-0 w-full h-full animate-spin-slow pointer-events-none"
  style={{ animationDuration: '10s' }}
>
  <defs>
    <path
      id="circlePathInside"
      // d="M50,50 m-25,0 a25,25 0 1,1 50,0 a25,25 0 1,1 -50,0"
        d="M50,50 m-28,0 a28,28 0 1,1 56,0 a28,28 0 1,1 -56,0"
      fill="none"
    />
  </defs>

  <text
    fill="white"
    fontSize="12"
    fontWeight="700"
    letterSpacing="0.8"
    stroke="rgba(0,0,0,0.6)"
    strokeWidth="0.6"
    paintOrder="stroke fill"
  >
    <textPath
      href="#circlePathInside"
      startOffset="50%"
      textAnchor="middle"
    >
      ÖNERİLEN ROTA
    </textPath>
  </text>
</svg>

       
            </>
          )}
        </button>

        {/* Öncelik Sırasına Göre Rota Butonu */}
        <button
          onClick={handlePriorityRoute}
          onMouseEnter={() => setShowTooltip('ÖNCELİK SIRASINA GÖRE')}
          onMouseLeave={() => setShowTooltip(null)}
          disabled={isDisabled}
          className={`
            w-14 h-14 rounded-full shadow-lg
            flex items-center justify-center
            transition-all duration-200
            ${
              isDisabled
                ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed'
                : routeType === 'priority' && routeInfo
                ? 'bg-green-600 hover:bg-green-700 active:bg-green-800 cursor-pointer hover:scale-105 active:scale-95'
                : 'bg-green-500 hover:bg-green-600 active:bg-green-700 cursor-pointer hover:scale-105 active:scale-95'
            }
          `}
          title={
            deliveryPoints.length < 2 && !routeInfo
              ? 'En az 2 teslimat noktası gerekli'
              : routeType === 'priority' && routeInfo
              ? 'Rotayı Kapat'
              : 'Öncelik Sırasına Göre Rota Çiz'
          }
        >
          {isDrawing && routeType === 'priority' ? (
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
      </div>

      {/* Rota Bilgisi - Ayrı container, sabit pozisyon (butonların altında) */}
      {routeInfo && !error && (
        <div className="fixed bottom-6 right-6 z-1000 animate-fade-in">
          <div className="bg-blue-500 text-white text-xs px-3 py-2 rounded-lg shadow-lg">
            <div className="font-semibold">{routeInfo.summary}</div>
            <div className="text-blue-100">
              {routeInfo.distance} • {routeInfo.duration}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
