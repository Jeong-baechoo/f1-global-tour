import mapboxgl from 'mapbox-gl';

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
  name?: string;
  principal?: string;
  location?: string | Location;
  headquarters?: Headquarters;
  color?: string;
  drivers?: string[];
  drivers2025?: Driver[];
  car2025?: Car;
  championships2025?: {
    totalPoints: number;
    raceResults: { race: string; points: number }[];
  };
  grandPrix?: string;
  length?: number;
  laps?: number;
  corners?: number;
  totalDistance?: number;
  raceDate?: string;
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
  showSectors?: boolean;
  showDRS?: boolean;
}

export interface DRSZone {
  id: string;
  name: string;
  detectionPoint: string;
  activationPoint: string;
  length: number;
  description: string;
  startPercentage?: number;
  endPercentage?: number;
}

export interface TrackDetails {
  drsZones?: DRSZone[];
  sectors?: Array<{
    id: string;
    name: string;
    corners: string[];
    characteristics: string;
    startPercentage?: number;
    endPercentage?: number;
  }>;
  keyCorners?: Array<{
    number: number;
    name: string;
    type: string;
    characteristics: string;
  }>;
  elevation?: {
    highest: number;
    lowest: number;
    difference: number;
  };
}

export interface TrackDrawOptions {
  trackId: string;
  trackCoordinates: number[][];
  color?: string;
  delay?: number;
  onComplete?: () => void;
  trackDetails?: TrackDetails;
  showDRSZones?: boolean;
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