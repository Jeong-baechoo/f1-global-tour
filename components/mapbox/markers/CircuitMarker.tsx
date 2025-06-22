import mapboxgl from 'mapbox-gl';
import { MarkerData } from '../types';
import { MARKER_STYLES } from '../constants';

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
  const el = document.createElement('div');
  el.style.width = MARKER_STYLES.circuitMarker.width;
  el.style.height = MARKER_STYLES.circuitMarker.height;
  el.style.cursor = 'pointer';

  const marker = document.createElement('div');
  marker.style.width = MARKER_STYLES.circuitMarker.width;
  marker.style.height = MARKER_STYLES.circuitMarker.height;
  
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
      <div style="font-size: 12px; font-weight: bold; color: white; text-align: center;">
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
      <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
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

  // 팝업 생성
  const popup = new mapboxgl.Popup({ offset: 25 })
    .setHTML(`
      <div style="padding: 10px;">
        <h3 style="margin: 0 0 5px 0; color: ${isNextRace ? '#FF1801' : '#dc2626'};">${circuit.name}</h3>
        <p style="margin: 0 0 5px 0; font-size: 14px;">${circuit.officialName}</p>
        <p style="margin: 0 0 3px 0; font-size: 12px;"><strong>Country:</strong> ${circuit.country}</p>
        <p style="margin: 0 0 3px 0; font-size: 12px;"><strong>Track Length:</strong> ${circuit.length} km</p>
        ${circuit.lapRecord ? `<p style="margin: 0 0 3px 0; font-size: 12px;"><strong>Lap Record:</strong> ${circuit.lapRecord.time} (${circuit.lapRecord.driver}, ${circuit.lapRecord.year})</p>` : ''}
      </div>
    `);

  // 마커 생성
  const mapMarker = new mapboxgl.Marker(el)
    .setLngLat([circuit.location.lng, circuit.location.lat])
    .setPopup(popup)
    .addTo(map);

  if (onMarkerCreated) {
    onMarkerCreated(mapMarker);
  }

  return mapMarker;
};