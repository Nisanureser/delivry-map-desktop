/**
 * Geocoding Service
 * Next.js API Route'ları üzerinden geocoding işlemleri yapar
 */

import type { LocationInfo, ReverseGeocodeResponse, GeocodeSearchResponse } from '@/types/geocoding.types';

class GeocodingService {
  /**
   * Koordinatları adrese çevirir (Reverse Geocoding)
   */
  async reverseGeocode(lat: number, lng: number): Promise<LocationInfo | null> {
    try {
      const response = await fetch(
        `/api/geocode/reverse?lat=${lat}&lng=${lng}`
      );

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data: ReverseGeocodeResponse = await response.json();

      if (data.error || !data.result) {
        console.error('Reverse geocoding hatası:', data.error);
        return null;
      }

      return data.result;
    } catch (error) {
      console.error('Reverse geocoding hatası:', error);
      return null;
    }
  }

  /**
   * Adres metnini koordinata çevirir (Forward Geocoding)
   */
  async geocode(address: string): Promise<LocationInfo[]> {
    try {
      const response = await fetch(
        `/api/geocode/search?address=${encodeURIComponent(address)}`
      );

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data: GeocodeSearchResponse = await response.json();

      if (data.error || !data.results) {
        console.error('Geocoding hatası:', data.error);
        return [];
      }

      return data.results;
    } catch (error) {
      console.error('Geocoding hatası:', error);
      return [];
    }
  }

  /**
   * Adres bilgisini formatlar
   */
  formatAddress(location: LocationInfo): string {
    const parts = [
      location.sokak,
      location.mah,
      location.ilce,
      location.il,
    ].filter(Boolean);

    return parts.join(', ') || location.posta_adresi;
  }
}

// Singleton instance
const geocodingService = new GeocodingService();

export default geocodingService;
