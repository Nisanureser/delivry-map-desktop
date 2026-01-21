'use client';

import dynamic from 'next/dynamic';
import { MapLoading } from '@/components/map/map-loading';

// MapContainer'ı dinamik olarak yükle, SSR'ı devre dışı bırak
const MapContainer = dynamic(
  () => import('@/components/map/map-container'),
  {
    ssr: false,
    loading: () => <MapLoading />,
  }
);

export default function Home() {
  return <MapContainer />;
}
