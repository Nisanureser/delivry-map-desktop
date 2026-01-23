/**
 * Priority Constants
 * Öncelik ile ilgili tüm sabitler ve konfigürasyonlar
 */

import { AlertCircle, AlertTriangle, Info } from 'lucide-react';
import type { Priority } from '@/types/delivery.types';

// Öncelik sıralama değerleri (sıralama için kullanılır)
export const PRIORITY_ORDER: Record<Priority, number> = {
  high: 1,
  normal: 2,
  low: 3,
};

// Öncelik Türkçe etiketleri
export const PRIORITY_LABELS: Record<Priority, string> = {
  high: 'Yüksek',
  normal: 'Orta',
  low: 'Düşük',
};

// Öncelik renkleri (Tailwind CSS sınıfları - Card için)
export const PRIORITY_CARD_COLORS: Record<Priority, string> = {
  high: 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30',
  normal: 'bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-500/30',
  low: 'bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30',
};

// Öncelik badge renkleri (Numara badge için)
export const PRIORITY_BADGE_COLORS: Record<Priority, string> = {
  high: 'bg-red-500',
  normal: 'bg-orange-500',
  low: 'bg-green-500',
};

// Öncelik modal renkleri (Modal seçim butonları için)
export const PRIORITY_MODAL_COLORS: Record<Priority, string> = {
  high: 'bg-red-500/15 text-red-500 dark:text-red-400 border-red-500/40',
  normal: 'bg-orange-500/15 text-orange-500 dark:text-orange-400 border-orange-500/40',
  low: 'bg-green-500/15 text-green-500 dark:text-green-400 border-green-500/40',
};

// Öncelik marker renkleri (Harita marker'ları için - HEX)
export const PRIORITY_MARKER_COLORS: Record<Priority, string> = {
  high: '#ef4444', // red
  normal: '#f97316', // orange
  low: '#22c55e', // green
};

// Öncelik seçenekleri (Modal için)
export const PRIORITY_OPTIONS: Array<{
  value: Priority;
  label: string;
  icon: typeof AlertCircle;
  color: string;
}> = [
  {
    value: 'high',
    label: PRIORITY_LABELS.high,
    icon: AlertCircle,
    color: PRIORITY_MODAL_COLORS.high,
  },
  {
    value: 'normal',
    label: PRIORITY_LABELS.normal,
    icon: AlertTriangle,
    color: PRIORITY_MODAL_COLORS.normal,
  },
  {
    value: 'low',
    label: PRIORITY_LABELS.low,
    icon: Info,
    color: PRIORITY_MODAL_COLORS.low,
  },
];

// Öncelik sıralama fonksiyonu
export const getPriorityOrder = (priority: Priority): number => {
  return PRIORITY_ORDER[priority];
};
