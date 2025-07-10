import type { LocalizedText } from '@/utils/i18n';
import { Location, LapRecord, Elevation } from './common';

export interface Circuit {
  id: string;
  name: LocalizedText;
  officialName: string;
  grandPrix: LocalizedText;
  country: string;
  city: string;
  location: Location;
  length: number; // in kilometers
  laps: number;
  corners: number;
  lapRecord: LapRecord;
  raceDate2025: string | null; // ISO date string
  round: number | null;
  sprint?: boolean;
  totalDistance: number;
  elevation?: Elevation;
}

// 서킷 관련 추가 타입들
export interface CircuitMarkerData {
  circuitId: string;
  name: LocalizedText;
  location: Location;
  grandPrix: LocalizedText;
  raceDate: string | null;
}

// 트랙 데이터
export interface TrackData {
  type: 'Feature';
  properties: Record<string, unknown>;
  geometry: {
    type: 'LineString';
    coordinates: number[][];
  };
}