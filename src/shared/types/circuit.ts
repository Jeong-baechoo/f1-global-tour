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

// 서킷 관련 추가 타입들 - 통합 마커 타입으로 대체됨
// @deprecated Use CircuitMarkerData from '@/src/shared/types/marker' instead


// Track state management types
export interface TrackLayerInfo {
  trackId: string;
  sectorLayers: string[];
  sectorData?: Array<unknown>;
}

export interface DRSLayerInfo {
  trackId: string;
  drsLayers: string[];
}

export interface OriginalTrackData {
  trackId: string;
  originalData: {
    type: 'Feature';
    properties: Record<string, unknown>;
    geometry: {
      type: 'LineString';
      coordinates: number[][];
    };
  };
}

export interface DRSAnimationInfo {
  animationId: number;
  isActive: boolean;
  restartFunction?: () => void;
}

export interface TrackDrawOptions {
  trackId: string;
  trackCoordinates: number[][];
  color?: string;
  delay?: number;
  onProgress?: (progress: number) => void;
  onComplete?: () => void;
  sectorMarkerCleanup?: () => void;
}