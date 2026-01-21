/**
 * Geocoding Type Definitions
 */

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface LocationInfo {
  posta_adresi: string;
  il: string;
  ilce: string;
  mah: string;
  sokak: string;
  pk: string;
  coordinates: Coordinates;
  skor?: string;
  bolge?: string;
}

export interface ReverseGeocodeResponse {
  result?: LocationInfo;
  error?: string;
}

export interface GeocodeSearchResponse {
  results?: LocationInfo[];
  error?: string;
}
