import type { Coordinates } from "./geocoding.types";

export type Priority = "high" | "normal" | "low";

export interface DeliveryPoint {
  id: string;
  name: string;
  address: string;
  coordinates: Coordinates;
  priority: Priority;
  notes?: string;
  /**
   * Stable insertion order for priority sorting.
   * Must never be overwritten by optimized-route numbering.
   */
  createdOrder?: number;
  order?: number;
  placeId?: string;
}
