import { MapPin } from 'lucide-react';

export function MapLoading() {
  return (
    <div className="w-full h-screen bg-linear-to-br from-slate-200 via-slate-300 to-slate-400 relative flex items-center justify-center">
      <div className="text-center">
        <MapPin className="w-16 h-16 text-slate-600 mx-auto mb-4 animate-pulse" />
        <p className="text-slate-700 text-lg font-medium">
          Harita Yükleniyor...
        </p>
        <p className="text-slate-600 mt-2">OpenStreetMap Leaflet</p>
      </div>
    </div>
  );
}
