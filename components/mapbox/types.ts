import mapboxgl from 'mapbox-gl';
import type { LocalizedText } from '@/utils/i18n';

// 공통 위치 타입
export interface Location {
  city: string;
  country: string;
}

export interface Headquarters extends Location {
  lat: number;
  lng: number;
}

// 드라이버 정보
export interface Driver {
  name: string;
  number: number;
  nationality: string;
  image: string;
}

// 차량 정보
export interface Car {
  name: string;
  image: string;
}

// 마커 데이터 (InteractivePanel과 호환)
export interface MarkerData {
  type: string;
  id?: string;
  name?: string | LocalizedText;
  principal?: string;
  location?: string | Location | { city: LocalizedText; country: LocalizedText; lat: number; lng: number };
  headquarters?: Headquarters;
  color?: string;
  drivers?: string[];
  drivers2025?: Driver[];
  car2025?: Car;
  championships2025?: {
    totalPoints: number;
    raceResults: { race: string; points: number }[];
  };
  grandPrix?: string | LocalizedText;
  length?: number;
  laps?: number;
  corners?: number;
  totalDistance?: number;
  raceDate?: string;
  lapRecord?: {
    time: string;
    driver: string;
    year: string;
  };
}

export interface MapAPI {
  flyToLocation: (coordinates: [number, number], zoom?: number) => void;
  flyToCircuit: (circuitId: string, gentle?: boolean) => void;
  flyToTeam: (teamId: string) => void;
  getCurrentBounds: () => mapboxgl.LngLatBounds | null;
  getCurrentZoom: () => number;
  getCurrentCenter: () => [number, number] | null;
  resetView: () => void;
  toggleCinematicMode?: () => boolean;
}

export interface MapProps {
  onMarkerClick?: (item: MarkerData) => void;
  onCinematicModeChange?: (enabled: boolean) => void;
  onUserInteraction?: () => void;
}

export interface TrackDrawOptions {
  trackId: string;
  trackCoordinates: number[][];
  color?: string;
  delay?: number;
  onComplete?: () => void;
}

export interface MarkerCreationOptions {
  map: mapboxgl.Map;
  onMarkerClick?: (item: MarkerData) => void;
}

// 팀 정보
export interface Team {
  id: string;
  name: string;
  fullName: string;
  description: string;
  teamPrincipal: string;
  foundingYear: number;
  headquarters: Headquarters;
  colors: {
    primary: string;
    secondary: string;
  };
  drivers2025?: Driver[];
  car2025?: Car;
  championships2025?: {
    totalPoints: number;
    raceResults: { race: string; points: number }[];
  };
}

export interface TransformedTeam extends Team {
  logo: string;
  drivers: string[];
}