import type { LocalizedText } from '@/utils/i18n';
import { Location, Driver, Car, Championship, LapRecord } from './common';

/**
 * Base marker data interface for common fields
 */
export interface BaseMarkerData {
  id: string;
  name: LocalizedText | string;
  location: Location;
}

/**
 * Team marker data interface
 */
export interface TeamMarkerData extends BaseMarkerData {
  type: 'team';
  name: LocalizedText;
  principal: string;
  headquarters: Location;
  color: string;
  colors?: {
    primary: string;
    secondary: string;
  };
  drivers?: string[];
  drivers2025?: Driver[];
  car2025?: Car;
  championships2025?: Championship;
}

/**
 * Circuit marker data interface
 */
export interface CircuitMarkerData extends BaseMarkerData {
  type: 'circuit';
  name: LocalizedText;
  grandPrix: LocalizedText;
  length: number;
  corners: number;
  laps: number;
  totalDistance: number;
  lapRecord?: LapRecord;
  raceDate?: string;
}

/**
 * Union type for all marker data
 */
export type MarkerData = TeamMarkerData | CircuitMarkerData;

/**
 * Type guard for team marker data
 */
export function isTeamMarkerData(data: MarkerData): data is TeamMarkerData {
  return data.type === 'team';
}

/**
 * Type guard for circuit marker data
 */
export function isCircuitMarkerData(data: MarkerData): data is CircuitMarkerData {
  return data.type === 'circuit';
}

/**
 * Legacy marker data interface for backward compatibility
 * @deprecated Use MarkerData instead
 */
export interface LegacyMarkerData {
  type: 'team';
  id: string;
  name: string;
  principal: string;
  location: {
    city: string;
    country: string;
  };
  headquarters: {
    city: string;
    country: string;
    lat: number;
    lng: number;
  };
  color: string;
  drivers: string[];
  drivers2025?: Driver[];
  car2025?: Car;
  championships2025?: Championship;
}