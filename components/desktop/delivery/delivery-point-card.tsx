/**
 * Delivery Point Card Component
 * Teslimat noktası kartı - Resimdeki tasarıma uygun
 */

'use client';

import { MapPin, Edit, Trash2 } from 'lucide-react';
import type { DeliveryPoint, Priority } from '@/types/delivery.types';

interface DeliveryPointCardProps {
  point: DeliveryPoint;
  onEdit?: (point: DeliveryPoint) => void;
  onDelete?: (id: string) => void;
}

const priorityLabels: Record<Priority, string> = {
  high: 'Yüksek',
  normal: 'Orta',
  low: 'Düşük',
};

const priorityColors: Record<Priority, string> = {
  high: 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30',
  normal: 'bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-500/30',
  low: 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30',
};

export function DeliveryPointCard({ point, onEdit, onDelete }: DeliveryPointCardProps) {
  return (
    <div className="group relative bg-white/10 dark:bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/15 dark:hover:bg-white/10 transition-all duration-200">
      {/* Numara Badge ve Başlık */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Numara Badge */}
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-md">
            {point.order || 1}
          </div>
          
          {/* Başlık ve Öncelik */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <MapPin className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400 shrink-0" />
              <h4 className="text-sm font-medium text-foreground truncate">
                Teslimat Noktası
              </h4>
              {/* Öncelik Etiketi */}
              <span className={`px-2 py-0.5 rounded-md text-xs font-medium border ${priorityColors[point.priority]}`}>
                {priorityLabels[point.priority]}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1 shrink-0">
          {onEdit && (
            <button
              onClick={() => onEdit(point)}
              className="p-1.5 rounded-lg hover:bg-white/20 dark:hover:bg-white/10 transition-colors"
              title="Düzenle"
            >
              <Edit className="w-4 h-4 text-muted-foreground hover:text-foreground" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(point.id)}
              className="p-1.5 rounded-lg hover:bg-red-500/20 hover:text-red-500 transition-colors"
              title="Sil"
            >
              <Trash2 className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      {/* Adres Bilgisi */}
      <div className="ml-11 space-y-1">
        <p className="text-sm text-foreground leading-relaxed">
          {point.address}
        </p>
        {point.notes && (
          <p className="text-xs text-muted-foreground">
            {point.notes}
          </p>
        )}
      </div>
    </div>
  );
}
