/**
 * Delivery Point List Component
 * Teslimat noktaları listesi 
 */

'use client';

import { useDeliveryPoints } from '@/contexts/DeliveryPointsContext';
import { DeliveryPointCard } from './delivery-point-card';

export function DeliveryPointList() {
  const { deliveryPoints, removeDeliveryPoint, updateDeliveryPoint } = useDeliveryPoints();

  // Düzenleme handler'ı (şimdilik sadece console.log)
  const handleEdit = (point: any) => {
    console.log('Edit point:', point);
    // TODO: Edit modal açılacak
  };

  return (
    <div className="flex flex-col h-full">
      {/* Liste İçeriği */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {deliveryPoints.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            {/* Empty State Icon */}
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-purple-500 dark:text-purple-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Henüz rota yok
            </h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              Teslimat noktalarınızı ekleyerek rota planlamaya başlayın
            </p>
          </div>
        ) : (
          deliveryPoints.map((point) => (
            <DeliveryPointCard
              key={point.id}
              point={point}
              onEdit={handleEdit}
              onDelete={removeDeliveryPoint}
            />
          ))
        )}
      </div>
    </div>
  );
}
