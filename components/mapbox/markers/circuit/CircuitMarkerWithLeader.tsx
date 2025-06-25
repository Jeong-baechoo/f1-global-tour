import mapboxgl from 'mapbox-gl';
import { MarkerData } from '../../types';
import { isMobile } from '../../utils/viewport';

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
  raceDate2025?: string | null;
}

interface CircuitMarkerProps {
  map: mapboxgl.Map;
  circuit: Circuit;
  isNextRace?: boolean;
  onMarkerClick?: (item: MarkerData) => void;
  onMarkerCreated?: (marker: mapboxgl.Marker, labelElement: HTMLElement) => void;
  labelOffset?: { x: number; y: number };
}

// 레이스 시간 포맷팅
const formatRaceTime = (raceDate: string | null): string => {
  if (!raceDate) return '';
  const date = new Date(raceDate);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes} GMT`;
};

export const createCircuitMarkerWithLeader = ({ 
  map, 
  circuit, 
  isNextRace = false, 
  onMarkerClick,
  onMarkerCreated,
  labelOffset = { x: 60, y: 0 }
}: CircuitMarkerProps): { marker: mapboxgl.Marker; updateLeaderLine: () => void } => {
  const mobile = isMobile();
  
  // 메인 컨테이너
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.pointerEvents = 'none';
  
  // SVG for leader line
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.style.position = 'absolute';
  svg.style.pointerEvents = 'none';
  svg.style.overflow = 'visible';
  svg.style.width = '1px';
  svg.style.height = '1px';
  svg.style.left = '0';
  svg.style.top = '0';
  
  // Leader line
  const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  line.setAttribute('stroke', 'rgba(255, 255, 255, 0.2)');
  line.setAttribute('stroke-width', '0.5'); // Ultra thin
  line.setAttribute('stroke-dasharray', '2,2');
  line.style.transition = 'all 0.3s ease';
  svg.appendChild(line);
  
  // 점 (실제 서킷 위치)
  const dot = document.createElement('div');
  dot.style.position = 'absolute';
  dot.style.width = mobile ? '8px' : '10px';
  dot.style.height = mobile ? '8px' : '10px';
  dot.style.borderRadius = '50%';
  dot.style.backgroundColor = isNextRace ? '#FF1801' : '#DC2626';
  dot.style.border = '2px solid rgba(255, 255, 255, 0.8)';
  dot.style.boxShadow = '0 0 10px rgba(220, 38, 38, 0.6)';
  dot.style.left = '-6px';
  dot.style.top = '-6px';
  dot.style.cursor = 'pointer';
  dot.style.pointerEvents = 'auto';
  dot.style.transition = 'all 0.3s ease';
  dot.style.zIndex = '2';
  
  // 라벨 컨테이너
  const labelContainer = document.createElement('div');
  labelContainer.style.position = 'absolute';
  labelContainer.style.display = 'flex';
  labelContainer.style.alignItems = 'center';
  labelContainer.style.gap = '6px';
  labelContainer.style.padding = mobile ? '4px 8px' : '6px 12px';
  labelContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.85)';
  labelContainer.style.borderRadius = '4px';
  labelContainer.style.border = isNextRace ? '2px solid #FF1801' : '1px solid rgba(255, 255, 255, 0.2)';
  labelContainer.style.boxShadow = isNextRace 
    ? '0 4px 15px rgba(255, 24, 1, 0.6)' 
    : '0 2px 8px rgba(0, 0, 0, 0.5)';
  labelContainer.style.whiteSpace = 'nowrap';
  labelContainer.style.cursor = 'pointer';
  labelContainer.style.pointerEvents = 'auto';
  labelContainer.style.transition = 'all 0.3s ease';
  labelContainer.style.zIndex = '1';
  labelContainer.style.transform = 'translate(-50%, -50%)';
  
  // 텍스트 컨테이너
  const textContainer = document.createElement('div');
  textContainer.style.display = 'flex';
  textContainer.style.flexDirection = 'column';
  textContainer.style.alignItems = 'flex-start';
  textContainer.style.gap = '2px';
  
  // 도시 이름
  const cityName = document.createElement('div');
  cityName.style.color = '#FFFFFF';
  cityName.style.fontSize = mobile ? '11px' : '13px';
  cityName.style.fontWeight = '600';
  cityName.style.letterSpacing = '0.5px';
  cityName.style.textTransform = 'uppercase';
  cityName.textContent = circuit.location.city;
  
  // 시간 정보
  if (circuit.raceDate2025) {
    const timeInfo = document.createElement('div');
    timeInfo.style.color = 'rgba(255, 255, 255, 0.7)';
    timeInfo.style.fontSize = mobile ? '9px' : '10px';
    timeInfo.style.fontWeight = '400';
    timeInfo.textContent = formatRaceTime(circuit.raceDate2025);
    textContainer.appendChild(cityName);
    textContainer.appendChild(timeInfo);
  } else {
    textContainer.appendChild(cityName);
  }
  
  labelContainer.appendChild(textContainer);
  
  // Next Race 라벨
  if (isNextRace) {
    const nextRaceLabel = document.createElement('div');
    nextRaceLabel.style.position = 'absolute';
    nextRaceLabel.style.top = '-20px';
    nextRaceLabel.style.left = '50%';
    nextRaceLabel.style.transform = 'translateX(-50%)';
    nextRaceLabel.style.backgroundColor = '#FF1801';
    nextRaceLabel.style.color = '#FFFFFF';
    nextRaceLabel.style.fontSize = mobile ? '9px' : '10px';
    nextRaceLabel.style.fontWeight = '700';
    nextRaceLabel.style.padding = '2px 6px';
    nextRaceLabel.style.borderRadius = '2px';
    nextRaceLabel.style.whiteSpace = 'nowrap';
    nextRaceLabel.textContent = 'NEXT RACE';
    labelContainer.appendChild(nextRaceLabel);
  }
  
  // 컨테이너에 추가
  container.appendChild(svg);
  container.appendChild(dot);
  container.appendChild(labelContainer);
  
  // 초기 라벨 위치 설정
  labelContainer.style.left = `${labelOffset.x}px`;
  labelContainer.style.top = `${labelOffset.y}px`;
  
  // 리더 라인 업데이트 함수
  const updateLeaderLine = () => {
    const dotCenterX = 0;
    const dotCenterY = 0;
    // 현재 라벨의 실제 위치 가져오기
    const labelLeft = parseFloat(labelContainer.style.left) || labelOffset.x;
    const labelTop = parseFloat(labelContainer.style.top) || labelOffset.y;
    
    line.setAttribute('x1', dotCenterX.toString());
    line.setAttribute('y1', dotCenterY.toString());
    line.setAttribute('x2', labelLeft.toString());
    line.setAttribute('y2', labelTop.toString());
  };
  
  updateLeaderLine();
  
  // 호버 효과
  const handleMouseEnter = () => {
    dot.style.transform = 'scale(1.2)';
    dot.style.boxShadow = '0 0 20px rgba(220, 38, 38, 0.8)';
    labelContainer.style.transform = 'translate(-50%, -50%) scale(1.05)';
    labelContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.95)';
    line.setAttribute('stroke', 'rgba(255, 255, 255, 0.5)');
    line.setAttribute('stroke-width', '1');
  };
  
  const handleMouseLeave = () => {
    dot.style.transform = 'scale(1)';
    dot.style.boxShadow = '0 0 10px rgba(220, 38, 38, 0.6)';
    labelContainer.style.transform = 'translate(-50%, -50%) scale(1)';
    labelContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.85)';
    line.setAttribute('stroke', 'rgba(255, 255, 255, 0.2)');
    line.setAttribute('stroke-width', '0.5');
  };
  
  dot.addEventListener('mouseenter', handleMouseEnter);
  dot.addEventListener('mouseleave', handleMouseLeave);
  labelContainer.addEventListener('mouseenter', handleMouseEnter);
  labelContainer.addEventListener('mouseleave', handleMouseLeave);
  
  // 클릭 이벤트
  if (onMarkerClick) {
    const handleClick = () => {
      const markerData: MarkerData = {
        type: 'circuit',
        id: circuit.id,
        name: circuit.name,
        grandPrix: circuit.grandPrix,
        length: circuit.length,
        laps: circuit.laps,
        corners: circuit.corners || 10,
        totalDistance: circuit.laps && circuit.length ? Math.round((circuit.laps * circuit.length) * 10) / 10 : 0,
        location: `${circuit.location.city}, ${circuit.location.country}`
      };
      onMarkerClick(markerData);
    };
    
    dot.addEventListener('click', handleClick);
    labelContainer.addEventListener('click', handleClick);
  }
  
  // 마커 생성
  const marker = new mapboxgl.Marker(container, { anchor: 'center' })
    .setLngLat([circuit.location.lng, circuit.location.lat])
    .addTo(map);
  
  if (onMarkerCreated) {
    onMarkerCreated(marker, labelContainer);
  }
  
  return { marker, updateLeaderLine };
};