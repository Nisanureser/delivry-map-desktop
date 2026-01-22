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
  low: 'bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30',
};

const priorityBadgeColors: Record<Priority, string> = {
  high: 'bg-red-500',
  normal: 'bg-orange-500',
  low: 'bg-green-500',
};

export function DeliveryPointCard({ point, onEdit, onDelete }: DeliveryPointCardProps) {
  return (
    <div className="group relative bg-white/10 dark:bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/15 dark:hover:bg-white/10 transition-all duration-200">
      <div className="flex items-start gap-3">
        {/* Sol: Numara Badge - Öncelik rengine göre */}
        <div className={`w-6 h-6 rounded-full ${priorityBadgeColors[point.priority]} flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-md border-2 border-white`}>
          {point.order || 1}
        </div>

        {/* Orta: Başlık ve Adres */}
        <div className="flex-1 min-w-0">
          {/* Başlık - İkon ve Adres Başlığı */}
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <h4 className="text-sm font-medium text-foreground truncate">
              {point.name || 'Adres Başlığı'}
            </h4>
          </div>
          {/* Adres İçeriği */}
          <p className="text-xs text-muted-foreground leading-relaxed">
            {point.address}
          </p>
        </div>

        {/* Sağ: Öncelik ve Action Buttons */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          {/* Öncelik Etiketi */}
          <span className={`px-2 py-0.5 rounded-md text-xs font-medium border ${priorityColors[point.priority]}`}>
            {priorityLabels[point.priority]}
          </span>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-1">
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
      </div>
    </div>
  );
}
