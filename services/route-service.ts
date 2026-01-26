/**
 * Route Service
 * Google Maps Directions API çağrıları
 */

import type { Coordinates } from '@/types/geocoding.types';

export interface RouteResponse {
  routes: Array<{
    overview_polyline: {
      points: string; // Encoded polyline string
    };
    legs: Array<{
      distance: { text: string; value: number };
      duration: { text: string; value: number };
      start_address: string;
      end_address: string;
      steps?: Array<{ polyline?: { points: string } }>;
    }>;
    summary: string;
  }>;
  status: string;
}

export interface RouteRequest {
  waypoints: Coordinates[];
}

class RouteService {
  /**
   * Teslimat noktalarına göre rota hesapla
   */
  async calculateRoute(waypoints: Coordinates[]): Promise<RouteResponse | null> {
    try {
      if (waypoints.length < 2) {
        throw new Error('En az 2 waypoint gerekli');
      }

      const response = await fetch('/api/route/directions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ waypoints }),
      });

      // Response'u güvenli şekilde parse et
      let data: any;
      try {
        data = await response.json();
      } catch (parseError) {
        throw new Error(`API response parse hatası: ${response.status} ${response.statusText}`);
      }

      // HTTP error durumu
      if (!response.ok) {
        const errorMessage = data?.error || data?.message || `API Error: ${response.status}`;
        throw new Error(errorMessage);
      }

      // Google Maps API error durumu (status !== 'OK')
      if (data.status && data.status !== 'OK') {
        const errorMessage = data.error_message || data.error || `Directions API hatası: ${data.status}`;
        throw new Error(errorMessage);
      }

      // Routes kontrolü
      if (!data.routes || !Array.isArray(data.routes) || data.routes.length === 0) {
        throw new Error('Rota bulunamadı - Google Maps API boş sonuç döndü');
      }

      return data as RouteResponse;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
      console.error('Route calculation hatası:', errorMessage, error);
      throw error; // null döndürmek yerine error fırlat (hook'ta handle edilecek)
    }
  }


  /**
   * Rota özet bilgilerini formatla
   */
  formatRouteSummary(route: RouteResponse['routes'][0]): {
    distance: string;
    duration: string;
    summary: string;
  } {
    const totalDistance = route.legs.reduce((sum, leg) => sum + leg.distance.value, 0);
    const totalDuration = route.legs.reduce((sum, leg) => sum + leg.duration.value, 0);

    // Mesafeyi km'ye çevir
    const distanceKm = (totalDistance / 1000).toFixed(1);
    
    // Süreyi dakikaya çevir
    const durationMin = Math.round(totalDuration / 60);

    return {
      distance: `${distanceKm} km`,
      duration: `${durationMin} dakika`,
      summary: route.summary || 'Rota',
    };
  }
}

// Singleton instance
const routeService = new RouteService();

export default routeService;
