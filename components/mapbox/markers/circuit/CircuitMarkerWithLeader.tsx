import mapboxgl from 'mapbox-gl';
import { MarkerData } from '../../types';
import { isMobile } from '../../utils/viewport';

interface CircuitMarkerProps {
  map: mapboxgl.Map;
  circuit: {
    id: string;
    name: string;
    location: {
      lng: number;
      lat: number;
      city: string;
      country: string;
    };
    length: number;
    laps?: number;
    corners?: number;
    raceDate2025?: string | null;
  };
  isNextRace?: boolean;
  onMarkerClick?: (item: MarkerData) => void;
  onMarkerCreated?: (marker: mapboxgl.Marker) => void;
}

export const createCircuitMarkerWithLeader = ({ 
  map, 
  circuit, 
  isNextRace = false, 
  onMarkerClick,
  onMarkerCreated
}: CircuitMarkerProps): { marker: mapboxgl.Marker } => {
  const mobile = isMobile();
  
  // 메인 컨테이너
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.pointerEvents = 'none';
  
  // 점 (서킷 위치에 고정)
  const dot = document.createElement('div');
  dot.style.position = 'absolute';
  dot.style.width = mobile ? '12px' : '14px';
  dot.style.height = mobile ? '12px' : '14px';
  dot.style.borderRadius = '50%';
  dot.style.backgroundColor = isNextRace ? '#FF1801' : '#DC2626';
  dot.style.border = '2px solid rgba(255, 255, 255, 0.8)';
  dot.style.boxShadow = '0 0 10px rgba(220, 38, 38, 0.6)';
  dot.style.cursor = 'pointer';
  dot.style.pointerEvents = 'auto';
  dot.style.transition = 'all 0.3s ease';
  dot.style.transform = 'translate(-50%, -50%)';
  dot.style.zIndex = '2';
  
  // 간단한 리더 라인 (SVG)
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.style.position = 'absolute';
  svg.style.pointerEvents = 'none';
  svg.style.overflow = 'visible';
  svg.style.width = '200px';
  svg.style.height = '100px';
  svg.style.left = '-100px';
  svg.style.top = '-50px';
  
  const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  line.setAttribute('x1', '100');
  line.setAttribute('y1', '50');
  line.setAttribute('x2', '150');
  line.setAttribute('y2', '30');
  line.setAttribute('stroke', 'rgba(255, 255, 255, 0.3)');
  line.setAttribute('stroke-width', '1');
  svg.appendChild(line);
  
  // 라벨
  const label = document.createElement('div');
  label.style.position = 'absolute';
  label.style.left = '150px';
  label.style.top = '20px';
  label.style.transform = 'translateX(-50%)';
  label.style.padding = mobile ? '4px 8px' : '6px 12px';
  label.style.backgroundColor = 'rgba(0, 0, 0, 0.85)';
  label.style.border = '1px solid rgba(255, 255, 255, 0.2)';
  label.style.borderRadius = '4px';
  label.style.color = '#FFFFFF';
  label.style.fontSize = mobile ? '12px' : '13px';
  label.style.fontWeight = '500';
  label.style.whiteSpace = 'nowrap';
  label.style.cursor = 'pointer';
  label.style.pointerEvents = 'auto';
  label.style.transition = 'opacity 0.3s ease';
  label.textContent = circuit.name;
  
  // NEXT RACE 뱃지
  if (isNextRace) {
    const badge = document.createElement('span');
    badge.style.marginLeft = '8px';
    badge.style.backgroundColor = '#FF1801';
    badge.style.color = 'white';
    badge.style.fontSize = '10px';
    badge.style.fontWeight = '700';
    badge.style.padding = '2px 6px';
    badge.style.borderRadius = '2px';
    badge.textContent = 'NEXT RACE';
    label.appendChild(badge);
  }
  
  // 줌 레벨에 따른 표시/숨김
  const updateVisibility = () => {
    const zoom = map.getZoom();
    const show = zoom > 5.5;
    
    label.style.opacity = show ? '1' : '0';
    label.style.display = show ? 'block' : 'none';
    line.style.opacity = show ? '1' : '0';
  };
  
  // 컨테이너에 추가
  svg.appendChild(label);
  container.appendChild(svg);
  container.appendChild(dot);
  
  // 마커 생성
  const marker = new mapboxgl.Marker(container, { anchor: 'center' })
    .setLngLat([circuit.location.lng, circuit.location.lat])
    .addTo(map);
  
  // 클릭 이벤트
  if (onMarkerClick) {
    const handleClick = () => {
      const markerData: MarkerData = {
        id: circuit.id,
        name: circuit.name,
        type: 'circuit',
        location: circuit.location,
        data: circuit
      };
      onMarkerClick(markerData);
    };
    
    dot.addEventListener('click', handleClick);
    label.addEventListener('click', handleClick);
  }
  
  // 초기 가시성 설정
  updateVisibility();
  
  // 맵 줌 이벤트 리스너
  map.on('zoom', updateVisibility);
  
  if (onMarkerCreated) {
    onMarkerCreated(marker);
  }
  
  return { marker };
};