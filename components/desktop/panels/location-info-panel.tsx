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

  // Minimal bilgi satırı component'i
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
    <div className="group flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
      {Icon && (
        <div className="shrink-0 w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center">
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
          className="shrink-0 p-1.5 rounded-lg hover:bg-muted transition-colors"
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
    <div className="fixed left-4 top-20 z-999 w-[400px] max-w-[calc(100vw-2rem)] animate-slide-up">
      <div className="glass-modal rounded-2xl shadow-2xl border border-white/30 backdrop-blur-xl overflow-hidden">
        {/* Header - Minimal */}
        <div className="flex items-center justify-between p-4 border-b border-border/50 bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{title}</h3>
              <p className="text-xs text-muted-foreground">Teslimat Noktası</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Content - Tek sayfa, scroll yok */}
        <div className="p-4">
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

        {/* Footer - Minimal butonlar */}
        <div className="p-4 border-t border-border/50 bg-muted/20 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-border hover:bg-muted transition-colors text-sm font-medium"
          >
            İptal
          </button>
          {onConfirm && (
            <button
              onClick={() => onConfirm(location)}
              className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
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
