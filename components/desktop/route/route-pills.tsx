/**
 * Route Pills Component
 * Teslimat noktalarını pill formatında gösterir
 * Görünmez scroll ve sağa sola kaydırma özelliği
 */

'use client';

import { useRef, useState, useEffect, useCallback, useMemo, memo } from 'react';
import { ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import { useDeliveryPoints } from '@/contexts/DeliveryPointsContext';
import { PRIORITY_BADGE_COLORS } from '@/constants/priorities';
import type { DeliveryPoint } from '@/types/delivery.types';

export function RoutePills() {
  const { deliveryPoints } = useDeliveryPoints();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Scroll durumunu kontrol et
  const checkScrollButtons = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) {
      setCanScrollLeft(false);
      setCanScrollRight(false);
      return;
    }

    const hasScroll = container.scrollWidth > container.clientWidth;
    setCanScrollLeft(container.scrollLeft > 5); // 5px threshold for better UX
    setCanScrollRight(
      hasScroll && container.scrollLeft < container.scrollWidth - container.clientWidth - 5
    );
  }, []);

  // Sıralı teslimat noktaları - useMemo ile optimize et
  const sortedPoints = useMemo(
    () => [...deliveryPoints].sort((a, b) => (a.order || 0) - (b.order || 0)),
    [deliveryPoints]
  );

  // Scroll fonksiyonları - useCallback ile optimize et
  const scrollLeft = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    container.scrollBy({ left: -300, behavior: 'smooth' });
  }, []);

  const scrollRight = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    container.scrollBy({ left: 300, behavior: 'smooth' });
  }, []);

  // Scroll event listener
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    checkScrollButtons();
    container.addEventListener('scroll', checkScrollButtons);
    window.addEventListener('resize', checkScrollButtons);

    return () => {
      container.removeEventListener('scroll', checkScrollButtons);
      window.removeEventListener('resize', checkScrollButtons);
    };
  }, [checkScrollButtons, sortedPoints.length]);

  // Eğer teslimat noktası yoksa, component'i gösterme
  if (sortedPoints.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 left-[calc(5rem+24rem+3rem)] right-58 z-1000 flex items-center gap-2">
      {/* Sol ok butonu */}
      {canScrollLeft && (
        <button
          onClick={scrollLeft}
          className="shrink-0 w-8 h-8 rounded-full bg-white/80 dark:bg-black/80 backdrop-blur-sm border border-white/30 flex items-center justify-center hover:bg-white/90 dark:hover:bg-black/90 transition-colors shadow-sm"
          aria-label="Sola kaydır"
        >
          <ChevronLeft className="w-4 h-4 text-foreground" />
        </button>
      )}

      {/* Scrollable pills container */}
      <div
        ref={scrollContainerRef}
        className="flex-1 flex items-center gap-2 overflow-x-auto scrollbar-hide min-w-0"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {sortedPoints.map((point) => (
          <RoutePill key={point.id} point={point} />
        ))}
      </div>

      {/* Sağ ok butonu */}
      {canScrollRight && (
        <button
          onClick={scrollRight}
          className="shrink-0 w-8 h-8 rounded-full bg-white/80 dark:bg-black/80 backdrop-blur-sm border border-white/30 flex items-center justify-center hover:bg-white/90 dark:hover:bg-black/90 transition-colors shadow-sm"
          aria-label="Sağa kaydır"
        >
          <ChevronRight className="w-4 h-4 text-foreground" />
        </button>
      )}
    </div>
  );
}

interface RoutePillProps {
  point: DeliveryPoint;
}

const RoutePill = memo(function RoutePill({ point }: RoutePillProps) {
  const order = point.order || 1;

  return (
    <div className="shrink-0 flex items-center gap-2 px-3 py-2 rounded-full bg-white/80 dark:bg-black/80 backdrop-blur-sm border border-white/30 shadow-sm hover:bg-white/90 dark:hover:bg-black/90 transition-colors max-w-[280px]">
      {/* Numara badge */}
      <div
        className={`w-5 h-5 rounded-full ${PRIORITY_BADGE_COLORS[point.priority]} flex items-center justify-center text-white font-bold text-xs shrink-0`}
      >
        {order}
      </div>

      {/* Adres */}
      <div className="flex items-center gap-1.5 min-w-0 flex-1">
        <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        <span className="text-xs font-medium text-foreground truncate">
          {point.address}
        </span>
      </div>
    </div>
  );
});
