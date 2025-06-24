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
  flyToCircuit: (circuitId: string, gentle?: boolean) => void;
  flyToTeam: (teamId: string) => void;
  toggleCinematicMode?: () => boolean;
}

export interface MapProps {
  onMarkerClick?: (item: MarkerData) => void;
  onMapReady?: (mapAPI: MapAPI) => void;
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