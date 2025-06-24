import mapboxgl from 'mapbox-gl';

export interface MarkerData {
  type: string;
  id?: string;
  name?: string;
  principal?: string;
  location?: string | { city: string; country: string };
  headquarters?: { city: string; country: string; lat: number; lng: number };
  color?: string;
  drivers?: string[];
  grandPrix?: string;
  length?: number;
  laps?: number;
  corners?: number;
  totalDistance?: number;
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

export interface Team {
  id: string;
  name: string;
  fullName: string;
  description: string;
  teamPrincipal: string;
  headquarters: {
    city: string;
    country: string;
    lat: number;
    lng: number;
  };
  colors: {
    primary: string;
    secondary: string;
  };
  foundingYear: number;
}

export interface TransformedTeam extends Team {
  logo: string;
  drivers: string[];
}