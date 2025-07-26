import mapboxgl from 'mapbox-gl';

/**
 * Map component API interface
 */
export interface MapAPI {
  flyToLocation: (coordinates: [number, number], zoom?: number) => void;
  flyToCircuit: (circuitId: string, gentle?: boolean) => void;
  flyToTeam: (teamId: string) => void;
  getCurrentBounds: () => mapboxgl.LngLatBounds | null;
  getCurrentZoom: () => number;
  getCurrentCenter: () => [number, number] | null;
  resetView: () => void;
}