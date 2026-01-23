/**
 * Delivery Point Popup Component
 * Marker'a tıklandığında gösterilen minimal popup
 */

'use client';

import { memo, useMemo } from 'react';
import type { DeliveryPoint } from '@/types/delivery.types';
import { PRIORITY_LABELS, PRIORITY_BADGE_COLORS } from '@/constants/priorities';

interface DeliveryPointPopupProps {
  point: DeliveryPoint;
}

export const DeliveryPointPopup = memo(function DeliveryPointPopup({ point }: DeliveryPointPopupProps) {
  const order = useMemo(() => point.order || 1, [point.order]);
  const priorityLabel = useMemo(() => PRIORITY_LABELS[point.priority], [point.priority]);

  return (
    <div className="min-w-[160px] max-w-[220px]">
      <div className="flex items-start gap-1.5">
        {/* Numara Badge */}
        <div className={`w-5 h-5 rounded-full ${PRIORITY_BADGE_COLORS[point.priority]} flex items-center justify-center text-white font-bold text-[10px] shrink-0 shadow-sm`}>
          {order}
        </div>

        {/* İçerik */}
        <div className="flex-1 min-w-0">
          {/* Başlık */}
          <div className="flex items-center gap-1 mb-2">
            {/* <MapPin className="w-3 h-3 text-muted-foreground shrink-0" /> */}
            <h4 className="text-xs font-semibold text-foreground truncate leading-tight">
              {point.name || `${order}. Teslimat Noktası`}
            </h4>
          </div>

          {/* Adres */}
          <p className="text-[10px] text-muted-foreground leading-snug mb-1">
            {point.address}
          </p>

          {/* Öncelik */}
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-muted-foreground">Öncelik:</span>
            <span className="text-[10px] font-medium text-foreground">{priorityLabel}</span>
          </div>
        </div>
      </div>
    </div>
  );
});
