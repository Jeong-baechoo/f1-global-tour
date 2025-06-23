import mapboxgl from 'mapbox-gl';
import { MarkerData } from '../types';
import { MARKER_STYLES } from '../constants';
import { createBaseMarker } from './MarkerFactory';

// 실제 F1 서킷 코너 정보
const CIRCUIT_CORNERS: Record<string, number> = {
  'bahrain': 15,
  'saudi-arabia': 27,
  'australia': 14,  // 2022년 레이아웃 변경으로 16→14 코너
  'japan': 18,
  'china': 16,
  'miami': 19,
  'imola': 19,
  'monaco': 19,
  'canada': 14,
  'spain': 16,
  'austria': 10,
  'silverstone': 18,
  'britain': 18,
  'hungary': 14,
  'spa': 19,
  'netherlands': 14,
  'monza': 11,
  'italy': 11,
  'azerbaijan': 20,
  'singapore': 19,  // 2023년 레이아웃 변경으로 23→19 코너
  'usa': 20,
  'mexico': 17,
  'brazil': 15,
  'vegas': 17,
  'qatar': 16,
  'abu-dhabi': 16,
  'nurburgring': 15  // 정확한 GP 서킷 코너 수
};

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
    corners: CIRCUIT_CORNERS[circuit.id] || 10,
    totalDistance: circuit.laps && circuit.length ? Math.round((circuit.laps * circuit.length) * 10) / 10 : 0,
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
