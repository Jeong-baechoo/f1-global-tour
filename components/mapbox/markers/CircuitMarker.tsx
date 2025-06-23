import mapboxgl from 'mapbox-gl';
import { MarkerData } from '../types';
import { MARKER_STYLES } from '../constants';
import { createBaseMarker } from './MarkerFactory';

interface Circuit {
  id: string;
  name: string;
  grandPrix: string;
  officialName: string;
  country: string;
  location: {
    lng: number;
    lat: number;
    city: string;
    country: string;
  };
  length: number;
  laps?: number;
  corners?: number;
  lapRecord?: {
    time: string;
    driver: string;
    year: number;
  };
}

interface CircuitMarkerProps {
  map: mapboxgl.Map;
  circuit: Circuit;
  isNextRace?: boolean;
  onMarkerClick?: (item: MarkerData) => void;
  onMarkerCreated?: (marker: mapboxgl.Marker) => void;
}

export const createCircuitMarker = ({ 
  map, 
  circuit, 
  isNextRace = false, 
  onMarkerClick,
  onMarkerCreated 
}: CircuitMarkerProps): mapboxgl.Marker => {
  const markerStyle = isNextRace ? MARKER_STYLES.nextRaceMarker : MARKER_STYLES.circuitMarker;
  
  const customContent = (mobile: boolean) => {
    if (isNextRace) {
      return `
        <div style="font-size: ${mobile ? '10px' : '12px'}; font-weight: bold; color: white; text-align: center;">
          NEXT<br>RACE
        </div>
      `;
    } else {
      return `
        <svg width="${mobile ? '22' : '30'}" height="${mobile ? '22' : '30'}" viewBox="0 0 24 24" fill="none">
          <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="white" stroke-width="2"/>
          <path d="M9 12l2 2 4-4" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      `;
    }
  };

  const markerData: MarkerData = {
    type: 'circuit',
    id: circuit.id,
    name: circuit.name,
    grandPrix: circuit.grandPrix,
    length: circuit.length,
    laps: circuit.laps,
    corners: circuit.corners || 10,
    location: `${circuit.location.city}, ${circuit.location.country}`
  };

  const marker = createBaseMarker({
    map,
    coordinates: [circuit.location.lng, circuit.location.lat],
    markerStyle: {
      ...markerStyle,
      boxShadow: isNextRace ? '0 4px 15px rgba(255, 24, 1, 0.6)' : '0 4px 15px rgba(220, 38, 38, 0.4)'
    },
    onMarkerClick: onMarkerClick ? () => onMarkerClick(markerData) : undefined,
    markerData,
    customContent,
    hoverEffects: {
      scale: 1.1,
      boxShadow: isNextRace ? '0 6px 20px rgba(255, 24, 1, 0.8)' : '0 6px 20px rgba(220, 38, 38, 0.6)'
    }
  });

  if (onMarkerCreated) {
    onMarkerCreated(marker);
  }

  return marker;
};
