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

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `API Error: ${response.status}`);
      }

      const data: RouteResponse = await response.json();

      if (data.status !== 'OK') {
        throw new Error(`Directions API hatası: ${data.status}`);
      }

      return data;
    } catch (error) {
      console.error('Route calculation hatası:', error);
      return null;
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
