export type Priority = 'high' | 'normal' | 'low';
export interface Coordinates {
    lat: number;
    lng: number;
  }
  export interface DeliveryPoint {
    id: string;
    name: string;
    address: string;
    coordinates: Coordinates;
    priority: Priority;
    notes?: string;
    order?: number;
    placeId?: string;
  }