import mapboxgl from 'mapbox-gl';
import { MarkerData } from '../types';
import { MARKER_STYLES } from '../constants';
import { isMobile } from '../utils/device';

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
  const mobile = isMobile();
  const markerSize = isNextRace ? MARKER_STYLES.nextRaceMarker : MARKER_STYLES.circuitMarker;
  
  const el = document.createElement('div');
  el.style.width = mobile ? markerSize.mobileWidth : markerSize.width;
  el.style.height = mobile ? markerSize.mobileHeight : markerSize.height;
  el.style.cursor = 'pointer';

  const marker = document.createElement('div');
  marker.style.width = mobile ? markerSize.mobileWidth : markerSize.width;
  marker.style.height = mobile ? markerSize.mobileHeight : markerSize.height;
  
  if (isNextRace) {
    // Next Race 스타일
    marker.style.backgroundColor = MARKER_STYLES.nextRaceMarker.backgroundColor;
    marker.style.borderRadius = MARKER_STYLES.nextRaceMarker.borderRadius;
    marker.style.border = MARKER_STYLES.nextRaceMarker.border;
    marker.style.display = 'flex';
    marker.style.alignItems = 'center';
    marker.style.justifyContent = 'center';
    marker.style.boxShadow = '0 4px 15px rgba(255, 24, 1, 0.6)';
    marker.style.transition = 'all 0.3s ease';
    marker.innerHTML = `
      <div style="font-size: ${mobile ? '10px' : '12px'}; font-weight: bold; color: white; text-align: center;">
        NEXT<br>RACE
      </div>
    `;
    el.classList.add('active-race');
  } else {
    // 일반 서킷 스타일
    marker.style.backgroundColor = MARKER_STYLES.circuitMarker.backgroundColor;
    marker.style.borderRadius = MARKER_STYLES.circuitMarker.borderRadius;
    marker.style.border = MARKER_STYLES.circuitMarker.border;
    marker.style.display = 'flex';
    marker.style.alignItems = 'center';
    marker.style.justifyContent = 'center';
    marker.style.boxShadow = '0 4px 15px rgba(220, 38, 38, 0.4)';
    marker.style.transition = 'all 0.3s ease';
    marker.innerHTML = `
      <svg width="${mobile ? '22' : '30'}" height="${mobile ? '22' : '30'}" viewBox="0 0 24 24" fill="none">
        <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="white" stroke-width="2"/>
        <path d="M9 12l2 2 4-4" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
  }

  el.appendChild(marker);

  // GPU 가속 호버 효과
  el.style.willChange = 'transform';
  marker.style.willChange = 'transform, box-shadow';
  marker.style.transform = 'translateZ(0)';

  el.addEventListener('mouseenter', () => {
    marker.style.transform = 'scale(1.1) translateZ(0)';
    if (isNextRace) {
      marker.style.boxShadow = '0 6px 20px rgba(255, 24, 1, 0.8)';
    } else {
      marker.style.boxShadow = '0 6px 20px rgba(220, 38, 38, 0.6)';
    }
  });

  el.addEventListener('mouseleave', () => {
    marker.style.transform = 'scale(1) translateZ(0)';
    if (isNextRace) {
      marker.style.boxShadow = '0 4px 15px rgba(255, 24, 1, 0.6)';
    } else {
      marker.style.boxShadow = '0 4px 15px rgba(220, 38, 38, 0.4)';
    }
  });

  // 클릭 이벤트
  el.addEventListener('click', () => {
    if (onMarkerClick) {
      onMarkerClick({
        type: 'circuit',
        id: circuit.id,
        name: circuit.name,
        grandPrix: circuit.grandPrix,
        length: circuit.length,
        laps: circuit.laps,
        corners: circuit.corners || 10,
        location: `${circuit.location.city}, ${circuit.location.country}`
      });
    }
  });

  // 마커 생성 (팝업 없이)
  const mapMarker = new mapboxgl.Marker(el)
    .setLngLat([circuit.location.lng, circuit.location.lat])
    .addTo(map);

  if (onMarkerCreated) {
    onMarkerCreated(mapMarker);
  }

  return mapMarker;
};
