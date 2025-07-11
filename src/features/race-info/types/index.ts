import type { LocalizedText } from '@/utils/i18n';
import { Driver, Car, Championship, Location, LapRecord } from '@/src/shared/types';

export type PanelModule = 'next-race' | 'circuit-detail' | 'team-hq';

export interface PanelState {
  isOpen: boolean;
  isMinimized: boolean;
  module: PanelModule | null;
  data: PanelData | null;
}

export interface PanelData {
  type?: string;
  id?: string;
  name?: string | LocalizedText;
  principal?: string | LocalizedText;
  location?: string | Location | { city: LocalizedText; country: LocalizedText; lat: number; lng: number };
  headquarters?: Location;
  color?: string;
  colors?: {
    primary: string;
    secondary: string;
  };
  drivers?: string[];
  drivers2025?: Driver[];
  car2025?: Car;
  championships2025?: Championship;
  grandPrix?: string | LocalizedText;
  length?: number;
  laps?: number;
  corners?: number;
  totalDistance?: number;
  raceDate?: string;
  lapRecord?: LapRecord | {
    time: string;
    driver: string;
    year: string;
  };
  schedule?: {
    practice1?: string;
    practice2?: string;
    practice3?: string;
    qualifying?: string;
    race?: string;
  };
}

export interface NextRaceData extends PanelData {
  raceDate: string;
  grandPrix: LocalizedText;
  name: LocalizedText;
  location: Location;
}

export interface CircuitDetailData extends PanelData {
  type: 'circuit';
  id: string;
  name: LocalizedText;
  location: Location;
  grandPrix: LocalizedText;
  length: number;
  corners: number;
  laps: number;
  totalDistance: number;
  lapRecord?: LapRecord;
}

export interface TeamHQData extends PanelData {
  type: 'team';
  id: string;
  name: LocalizedText;
  headquarters: Location;
  principal: string;
  color: string;
  colors?: {
    primary: string;
    secondary: string;
  };
  drivers2025: Driver[];
  car2025: Car;
  championships2025: Championship;
}