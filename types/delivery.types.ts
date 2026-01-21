import type { Coordinates } from './geocoding.types';

export type Priority = 'high' | 'normal' | 'low';

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