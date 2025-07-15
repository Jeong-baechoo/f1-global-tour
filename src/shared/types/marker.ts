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


