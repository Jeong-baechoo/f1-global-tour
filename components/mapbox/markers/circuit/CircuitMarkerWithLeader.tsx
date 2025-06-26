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
  
  // 컨테이너 요소 (고정 크기)
  const container = document.createElement('div');
  container.className = 'circuit-marker';
  container.style.position = 'absolute';
  container.style.width = '14px';
  container.style.height = '14px';
  container.style.transform = 'translate(-50%, -50%)';
  container.style.transformOrigin = 'center center';
  
  // 점 마커 (서킷 위치)
  const dotElement = document.createElement('div');
  dotElement.style.position = 'absolute';
  dotElement.style.width = mobile ? '12px' : '14px';
  dotElement.style.height = mobile ? '12px' : '14px';
  dotElement.style.borderRadius = '50%';
  dotElement.style.backgroundColor = isNextRace ? '#FF1801' : '#DC2626';
  dotElement.style.border = '2px solid rgba(255, 255, 255, 0.8)';
  dotElement.style.boxShadow = '0 0 10px rgba(220, 38, 38, 0.6)';
  dotElement.style.cursor = 'pointer';
  dotElement.style.transition = 'all 0.3s ease';
  dotElement.style.left = '50%';
  dotElement.style.top = '50%';
  dotElement.style.transform = 'translate(-50%, -50%)';
  
  // 라벨 + 리더라인 컨테이너
  const labelContainer = document.createElement('div');
  labelContainer.style.position = 'absolute';
  labelContainer.style.left = '20px';
  labelContainer.style.top = '-40px';
  labelContainer.style.pointerEvents = 'none';
  
  // SVG 리더 라인
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.style.position = 'absolute';
  svg.style.width = '100px';
  svg.style.height = '60px';
  svg.style.left = '-20px';
  svg.style.top = '40px';
  svg.style.pointerEvents = 'none';
  svg.style.overflow = 'visible';
  
  const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  line.setAttribute('x1', '0');
  line.setAttribute('y1', '0');
  line.setAttribute('x2', '20');
  line.setAttribute('y2', '-40');
  line.setAttribute('stroke', 'rgba(255, 255, 255, 0.3)');
  line.setAttribute('stroke-width', '1');
  line.setAttribute('stroke-dasharray', '2,2');
  svg.appendChild(line);
  
  // 라벨
  const label = document.createElement('div');
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
  
  // 라벨 컨테이너에 SVG와 라벨 추가
  labelContainer.appendChild(svg);
  labelContainer.appendChild(label);
  
  // 컨테이너에 요소들 추가
  container.appendChild(dotElement);
  container.appendChild(labelContainer);
  
  // 줌 레벨 및 지구 반대편 체크
  const updateVisibility = () => {
    const zoom = map.getZoom();
    const showLabel = zoom > 5.5;
    
    // 지구본 모드에서 뒷면 체크 (줌 레벨이 낮을 때)
    if (zoom < 6) {
      // 카메라 중심과 마커 위치 간의 거리 계산
      const center = map.getCenter();
      const markerLng = circuit.location.lng;
      const markerLat = circuit.location.lat;
      
      // 경도 차이 계산 (180도 넘으면 반대편)
      let lngDiff = Math.abs(center.lng - markerLng);
      if (lngDiff > 180) lngDiff = 360 - lngDiff;
      
      // 위도 차이도 고려
      const latDiff = Math.abs(center.lat - markerLat);
      
      // 75도 이상 차이나면 숨김 (지구 반대편)
      const isOnBackside = lngDiff > 75 || (latDiff > 50 && lngDiff > 50);
      
      container.style.display = isOnBackside ? 'none' : 'block';
      container.style.opacity = isOnBackside ? '0' : '1';
    } else {
      // 높은 줌 레벨에서는 항상 표시
      container.style.display = 'block';
      container.style.opacity = '1';
    }
    
    // 라벨 표시/숨김
    label.style.opacity = showLabel ? '1' : '0';
    label.style.display = showLabel ? 'block' : 'none';
    line.style.opacity = showLabel ? '1' : '0';
  };
  
  // 마커 생성 - 팀 마커와 동일한 설정 사용
  const marker = new mapboxgl.Marker(container, {
    anchor: 'top-left',
    offset: [0, 0]
  })
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
    
    container.addEventListener('click', handleClick);
    label.addEventListener('click', handleClick);
  }
  
  // 초기 가시성 설정
  updateVisibility();
  
  // 맵 이벤트 리스너
  map.on('zoom', updateVisibility);
  map.on('move', updateVisibility);
  map.on('rotate', updateVisibility);
  map.on('pitch', updateVisibility);
  
  if (onMarkerCreated) {
    onMarkerCreated(marker);
  }
  
  return { marker };
};