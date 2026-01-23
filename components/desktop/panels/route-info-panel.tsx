/**
 * Route Info Panel Component
 * Rota bilgilerini gösteren panel - Diğer panel tasarımlarına uygun
 */

'use client';

import { X, Route, Clock, MapPin, Navigation, Package } from 'lucide-react';
import { useDeliveryPoints } from '@/contexts/DeliveryPointsContext';
import { PRIORITY_LABELS } from '@/constants/priorities';
import type { LeafletMap } from '@/types/leaflet';

interface RouteInfoPanelProps {
  isOpen: boolean;
  onClose: () => void;
  map: LeafletMap | null;
  routeInfo?: {
    distance: string;
    duration: string;
    summary: string;
  } | null;
  title?: string;
}

export function RouteInfoPanel({
  isOpen,
  onClose,
  map,
  routeInfo: propRouteInfo,
  title = 'Rota Bilgileri',
}: RouteInfoPanelProps) {
  const { deliveryPoints } = useDeliveryPoints();
  
  // Prop'tan gelen routeInfo'yu kullan
  const routeInfo = propRouteInfo;

  if (!isOpen) return null;

  // Öncelik dağılımını hesapla
  const priorityCounts = deliveryPoints.reduce(
    (acc, point) => {
      acc[point.priority] = (acc[point.priority] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  // Bilgi kartı component'i
  const InfoCard = ({
    icon: Icon,
    label,
    value,
    subtitle,
    color = 'text-blue-500',
  }: {
    icon: any;
    label: string;
    value: string;
    subtitle?: string;
    color?: string;
  }) => (
    <div className="group p-4 rounded-xl bg-white/5 dark:bg-white/5 border border-white/10 hover:bg-white/10 dark:hover:bg-white/10 transition-colors">
      <div className="flex items-start gap-3">
        <div className={`shrink-0 w-10 h-10 rounded-lg bg-white/10 dark:bg-white/5 flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-muted-foreground mb-1">{label}</p>
          <p className="text-lg font-semibold text-foreground">{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );

  // Öncelik badge component'i
  const PriorityBadge = ({ priority, count }: { priority: string; count: number }) => {
    const colors: Record<string, string> = {
      high: 'bg-red-500/20 text-red-500 dark:text-red-400 border-red-500/30',
      normal: 'bg-orange-500/20 text-orange-500 dark:text-orange-400 border-orange-500/30',
      low: 'bg-green-500/20 text-green-500 dark:text-green-400 border-green-500/30',
    };

    return (
      <div className={`px-3 py-1.5 rounded-lg border text-xs font-medium ${colors[priority] || colors.normal}`}>
        {PRIORITY_LABELS[priority as keyof typeof PRIORITY_LABELS]} ({count})
      </div>
    );
  };

  return (
    <div className="fixed left-20 top-24 z-40 w-96 max-h-[calc(100vh-8rem)] animate-slide-up">
      <div className="glass-modal rounded-2xl shadow-2xl border border-white/30 backdrop-blur-xl overflow-hidden flex flex-col h-[calc(100vh-8rem)]">
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/10 dark:bg-black/10">
          <div className="flex items-center gap-2">
            <Route className="w-5 h-5 text-purple-500" />
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
          <div className="space-y-4">
            {/* Rota Bilgileri - Sadece rota çizildiyse göster */}
            {routeInfo && (
              <>
                <div className="space-y-3">
                  {/* Mesafe */}
                  <InfoCard
                    icon={Navigation}
                    label="Toplam Mesafe"
                    value={routeInfo.distance}
                    subtitle="Rota uzunluğu"
                    color="text-blue-500"
                  />

                  {/* Süre */}
                  <InfoCard
                    icon={Clock}
                    label="Tahmini Süre"
                    value={routeInfo.duration}
                    subtitle="Yaklaşık varış süresi"
                    color="text-purple-500"
                  />

                  {/* Rota Özeti */}
                  <InfoCard
                    icon={Route}
                    label="Rota Özeti"
                    value={routeInfo.summary}
                    subtitle="Ana güzergah"
                    color="text-green-500"
                  />
                </div>
              </>
            )}

            {/* Teslimat Noktaları İstatistikleri */}
            <div className="pt-4 border-t border-white/10">
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <Package className="w-4 h-4 text-muted-foreground" />
                Teslimat Noktaları
              </h3>

              <div className="space-y-3">
                {/* Toplam Nokta Sayısı */}
                <InfoCard
                  icon={MapPin}
                  label="Toplam Nokta"
                  value={deliveryPoints.length.toString()}
                  subtitle={`${deliveryPoints.length} teslimat noktası`}
                  color="text-orange-500"
                />

                {/* Öncelik Dağılımı */}
                {Object.keys(priorityCounts).length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">
                      Öncelik Dağılımı
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(priorityCounts).map(([priority, count]) => (
                        <PriorityBadge key={priority} priority={priority} count={count} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Rota Çizilmemişse Bilgi */}
            {!routeInfo && deliveryPoints.length >= 2 && (
              <div className="p-4 rounded-xl bg-gray-500/10 border border-gray-500/20">
                <p className="text-sm text-muted-foreground text-center">
                  Rota çizmek için sağ alt köşedeki butona tıklayın
                </p>
              </div>
            )}

            {/* Yeterli Nokta Yoksa */}
            {deliveryPoints.length < 2 && (
              <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                <p className="text-sm text-yellow-500 dark:text-yellow-400 text-center">
                  Rota çizmek için en az 2 teslimat noktası gerekli
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
