import { Circuit as SharedCircuit } from '@/src/shared/types/circuit';
import { Location } from '@/src/shared/types/common';

// Re-export shared types
export type { Circuit } from '@/src/shared/types/circuit';

// Circuits module specific types
export interface CircuitMarker {
  id: string;
  circuitId: string;
  location: Location;
  marker?: mapboxgl.Marker;
}

export interface TrackData {
  type: 'Feature';
  properties: {
    circuitId: string;
    name: string;
  };
  geometry: {
    type: 'LineString';
    coordinates: [number, number][];
  };
}

export interface CircuitView {
  center: [number, number];
  zoom: number;
  pitch?: number;
  bearing?: number;
  duration?: number;
}

export interface CircuitsState {
  circuits: SharedCircuit[];
  selectedCircuit: SharedCircuit | null;
  circuitMarkers: CircuitMarker[];
  trackData: Map<string, TrackData>;
  isLoading: boolean;
  error: string | null;
  animatingCircuitId: string | null;
  setCircuits: (circuits: SharedCircuit[]) => void;
  selectCircuit: (circuit: SharedCircuit | null) => void;
  setCircuitMarkers: (markers: CircuitMarker[]) => void;
  setTrackData: (circuitId: string, data: TrackData) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  setAnimatingCircuitId: (circuitId: string | null) => void;
  reset: () => void;
}

export interface CircuitServiceOptions {
  dataPath?: string;
  tracksPath?: string;
  cacheEnabled?: boolean;
  cacheDuration?: number;
}

export interface CircuitMarkerOptions {
  interactive?: boolean;
  className?: string;
  offset?: [number, number];
  anchor?: 'center' | 'top' | 'bottom' | 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

export interface TrackAnimationOptions {
  duration?: number;
  framesPerSecond?: number;
  lineColor?: string;
  lineWidth?: number;
  easing?: (t: number) => number;
}