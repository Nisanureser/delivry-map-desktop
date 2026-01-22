/**
 * Location Info Panel
 * Seçilen konumun detaylı bilgilerini gösterir
 * Modern, profesyonel tasarım
 */

'use client';

import { X, MapPin, Check, Copy, Map, Navigation, Building2, Home, Mail } from 'lucide-react';
import { useState } from 'react';
import type { LocationInfo } from '@/types/geocoding.types';

interface LocationInfoPanelProps {
  location: LocationInfo | null;
  onClose: () => void;
  onConfirm?: (location: LocationInfo) => void;
  title?: string;
}

export function LocationInfoPanel({
  location,
  onClose,
  onConfirm,
  title = 'Konum Bilgileri',
}: LocationInfoPanelProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!location) return null;

  // Kopyalama fonksiyonu
  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Bilgi satırı component'i
  const InfoRow = ({
    icon: Icon,
    label,
    value,
    copyable = false,
  }: {
    icon?: any;
    label: string;
    value: string;
    copyable?: boolean;
  }) => (
    <div className="group flex items-start gap-3 p-3 rounded-lg hover:bg-white/10 dark:hover:bg-white/5 transition-colors">
      {Icon && (
        <div className="shrink-0 w-8 h-8 rounded-lg bg-white/10 dark:bg-white/5 flex items-center justify-center">
          <Icon className="w-4 h-4 text-muted-foreground" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-muted-foreground mb-0.5">{label}</p>
        <p className="text-sm text-foreground wrap-break-words">{value || '-'}</p>
      </div>
      {copyable && value && (
        <button
          onClick={() => handleCopy(value, label)}
          className="shrink-0 p-1.5 rounded-lg hover:bg-white/10 dark:hover:bg-white/5 transition-colors"
          title="Kopyala"
        >
          {copiedField === label ? (
            <Check className="w-4 h-4 text-green-500" />
          ) : (
            <Copy className="w-4 h-4 text-muted-foreground" />
          )}
        </button>
      )}
    </div>
  );

  return (
    <div className="fixed left-20 top-24 z-40 w-96 max-h-[calc(100vh-8rem)] animate-slide-up">
      <div className="glass-modal rounded-2xl shadow-2xl border border-white/30 backdrop-blur-xl overflow-hidden flex flex-col h-[calc(100vh-8rem)]">
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/10 dark:bg-black/10">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 dark:hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-1">
            {/* Tam Adres */}
            <InfoRow
              icon={Home}
              label="Tam Adres"
              value={location.posta_adresi}
              copyable
            />

            {/* Koordinatlar */}
            <InfoRow
              icon={Navigation}
              label="Koordinatlar"
              value={`${location.coordinates.lat.toFixed(6)}, ${location.coordinates.lng.toFixed(6)}`}
              copyable
            />

            {/* İl */}
            {location.il && (
              <InfoRow icon={Map} label="İl" value={location.il} />
            )}

            {/* İlçe */}
            {location.ilce && (
              <InfoRow icon={Building2} label="İlçe" value={location.ilce} />
            )}

            {/* Mahalle */}
            {location.mah && (
              <InfoRow icon={Home} label="Mahalle" value={location.mah} />
            )}

            {/* Sokak */}
            {location.sokak && (
              <InfoRow icon={MapPin} label="Sokak" value={location.sokak} />
            )}

            {/* Posta Kodu */}
            {location.pk && (
              <InfoRow icon={Mail} label="Posta Kodu" value={location.pk} />
            )}
          </div>
        </div>

        {/* Footer - Butonlar */}
        <div className="p-4 border-t border-white/10 bg-white/10 dark:bg-black/10 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-white/20 hover:bg-white/10 dark:hover:bg-white/5 transition-colors text-sm font-medium text-foreground"
          >
            İptal
          </button>
          {onConfirm && (
            <button
              onClick={() => onConfirm(location)}
              className="flex-1 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              Onayla
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
