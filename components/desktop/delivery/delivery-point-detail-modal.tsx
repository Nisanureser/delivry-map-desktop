/**
 * Delivery Point Detail Modal
 * Teslimat noktası detay düzenleme modal'ı
 * Öncelik ve not düzenleme
 */

'use client';

import { X, Check, MapPin, AlertCircle, AlertTriangle, Info, FileText } from 'lucide-react';
import { useState, useEffect } from 'react';
import type { DeliveryPoint, Priority } from '@/types/delivery.types';

interface DeliveryPointDetailModalProps {
  point: DeliveryPoint | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, updates: { priority: Priority; notes?: string }) => void;
}

const priorityOptions: { value: Priority; label: string; icon: typeof AlertCircle; color: string }[] = [
  {
    value: 'high',
    label: 'Yüksek',
    icon: AlertCircle,
    color: 'bg-red-500/15 text-red-500 dark:text-red-400 border-red-500/40',
  },
  {
    value: 'normal',
    label: 'Orta',
    icon: AlertTriangle,
    color: 'bg-orange-500/15 text-orange-500 dark:text-orange-400 border-orange-500/40',
  },
  {
    value: 'low',
    label: 'Düşük',
    icon: Info,
    color: 'bg-blue-500/15 text-blue-500 dark:text-blue-400 border-blue-500/40',
  },
];

export function DeliveryPointDetailModal({
  point,
  isOpen,
  onClose,
  onSave,
}: DeliveryPointDetailModalProps) {
  const [priority, setPriority] = useState<Priority>('normal');
  const [notes, setNotes] = useState('');

  // Point değiştiğinde form'u güncelle
  useEffect(() => {
    if (point) {
      setPriority(point.priority);
      setNotes(point.notes || '');
    }
  }, [point]);

  if (!isOpen || !point) return null;

  const handleSave = () => {
    onSave(point.id, {
      priority,
      notes: notes.trim() || undefined,
    });
    onClose();
  };

  const selectedPriorityOption = priorityOptions.find((opt) => opt.value === priority);

  return (
    <>
      {/* Overlay - Hafif karartı */}
      <div
        className="fixed inset-0 bg-black/15 z-50 animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 backdrop-blur-xl overflow-hidden flex flex-col w-full max-w-md max-h-[90vh] pointer-events-auto animate-slide-up bg-white dark:bg-gray-900"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-5 border-b border-white/10 flex items-center justify-between bg-white/10 dark:bg-black/10">
            <h2 className="text-lg font-semibold text-foreground">Teslimat Noktası Detayı</h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* Adres Bilgisi (Read-only) */}
            <div className="group p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
                <p className="text-xs font-medium text-muted-foreground">Adres</p>
              </div>
              <p className="text-sm text-foreground leading-relaxed">{point.address}</p>
            </div>

            {/* Öncelik Seçimi */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-3">
                Öncelik
              </label>
              <div className="flex gap-2">
                {priorityOptions.map((option) => {
                  const Icon = option.icon;
                  const isSelected = priority === option.value;
                  return (
                    <button
                      key={option.value}
                      onClick={() => setPriority(option.value)}
                      className={`flex-1 px-4 py-2.5 rounded-lg border transition-all duration-200 flex items-center justify-center gap-2 ${
                        isSelected
                          ? `${option.color} border-current shadow-sm scale-[1.02]`
                          : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 ${
                          isSelected
                            ? 'text-current'
                            : 'text-muted-foreground'
                        }`}
                      />
                      <span
                        className={`text-xs font-medium ${
                          isSelected
                            ? 'text-current'
                            : 'text-muted-foreground'
                        }`}
                      >
                        {option.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Not/Açıklama */}
            <div>
              <label
                htmlFor="notes"
                className="block text-xs font-medium text-muted-foreground mb-2"
              >
                Not / Açıklama
              </label>
              <div className="relative">
                <div className="absolute left-3 top-3 pointer-events-none">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                </div>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => {
                    if (e.target.value.length <= 500) {
                      setNotes(e.target.value);
                    }
                  }}
                  placeholder="Teslimat noktası hakkında notlar ekleyin..."
                  rows={4}
                  maxLength={500}
                  className="w-full pl-10 pr-3 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none text-sm text-foreground placeholder:text-muted-foreground/60 resize-none transition-all"
                />
              </div>
              <div className="flex items-center justify-between mt-1.5">
                <p className="text-xs text-muted-foreground">
                  {notes.length}/500 karakter
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-5 border-t border-gray-200 dark:border-gray-700 bg-transparent flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg border border-white/20 hover:bg-white/10 dark:hover:bg-white/5 transition-colors text-sm font-medium text-foreground"
            >
              İptal
            </button>
            <button
              onClick={handleSave}
              className="flex-1 px-4 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              Kaydet
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
