import mapboxgl from 'mapbox-gl';
import { MarkerData } from '../../types';
import { isMobile } from '../../utils/viewport';
import type { Circuit } from '@/types/f1';
import { getText, type Language } from '@/utils/i18n';

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

interface CircuitMarkerProps {
  map: mapboxgl.Map;
  circuit: Circuit;
  isNextRace?: boolean;
  language?: Language;
  onMarkerClick?: (item: MarkerData) => void;
  onMarkerCreated?: (marker: mapboxgl.Marker) => void;
}

// 레이스 시간 포맷팅 함수
const formatRaceTime = (raceDate: string | null): string => {
  if (!raceDate) return '';

  const date = new Date(raceDate);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');

  // 간단한 시간 표시 (예: 08:00 CST)
  return `${hours}:${minutes} GMT`;
};

export const createCircuitMarker = ({
  map,
  circuit,
  isNextRace = false,
  language = 'en',
  onMarkerClick,
  onMarkerCreated
}: CircuitMarkerProps): mapboxgl.Marker => {
  const mobile = isMobile();

  // 메인 컨테이너 - 점과 라벨을 포함
  const el = document.createElement('div');
  el.className = 'marker circuit-marker';
  el.style.position = 'absolute';
  el.style.cursor = 'pointer';
  el.style.willChange = 'transform';
  el.style.transform = 'translate3d(0, 0, 0)'; // GPU 레이어 강제
  el.style.backfaceVisibility = 'hidden'; // 렌더링 최적화
  el.style.perspective = '1000px'; // 3D 가속
  el.style.display = 'flex';
  el.style.alignItems = 'center';
  el.style.gap = '0';

  // 초기 opacity 설정
  el.style.opacity = '1';
  el.style.transition = 'opacity 0.3s ease';

  // 점 (실제 서킷 위치)
  const dotContainer = document.createElement('div');
  dotContainer.style.position = 'relative';
  dotContainer.style.width = '12px';
  dotContainer.style.height = '12px';
  dotContainer.style.display = 'flex';
  dotContainer.style.alignItems = 'center';
  dotContainer.style.justifyContent = 'center';

  const dot = document.createElement('div');
  dot.style.width = '12px';
  dot.style.height = '12px';
  dot.style.borderRadius = '50%';
  dot.style.backgroundColor = isNextRace ? '#FF1801' : '#DC2626';
  dot.style.border = '2px solid rgba(255, 255, 255, 0.8)';
  dot.style.boxShadow = '0 0 10px rgba(220, 38, 38, 0.6)';
  dot.style.transition = 'all 0.3s ease';
  dotContainer.appendChild(dot);

  // 연결선
  const line = document.createElement('div');
  line.style.position = 'absolute';
  line.style.left = '100%';
  line.style.top = '50%';
  line.style.transform = 'translateY(-50%)';
  line.style.width = mobile ? '20px' : '30px';
  line.style.height = '1px';
  line.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
  line.style.transition = 'all 0.3s ease';
  dotContainer.appendChild(line);

  // 라벨 컨테이너
  const labelContainer = document.createElement('div');
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
  labelContainer.style.transition = 'all 0.3s ease';
  labelContainer.style.whiteSpace = 'nowrap';
  labelContainer.style.position = 'relative';
  labelContainer.style.overflow = 'visible';
  labelContainer.style.marginLeft = mobile ? '20px' : '30px';


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
  cityName.textContent = getText(circuit.location.city, language);

  // 시간 정보 (레이스 날짜가 있을 경우)
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

  // 요소 조립
  labelContainer.appendChild(textContainer);

  // Next Race 인 경우 추가 스타일
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

  // 메인 컨테이너에 점과 라벨 추가
  el.appendChild(dotContainer);
  el.appendChild(labelContainer);

  // GPU 가속 호버 효과
  el.style.willChange = 'transform';
  labelContainer.style.willChange = 'transform, box-shadow';
  dot.style.willChange = 'transform, box-shadow';

  el.addEventListener('mouseenter', () => {
    // 라벨 효과
    labelContainer.style.transform = 'scale(1.05) translateZ(0)';
    labelContainer.style.boxShadow = isNextRace
      ? '0 6px 20px rgba(255, 24, 1, 0.8)'
      : '0 4px 12px rgba(0, 0, 0, 0.7)';
    labelContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.95)';

    // 점 효과
    dot.style.transform = 'scale(1.2) translateZ(0)';
    dot.style.boxShadow = '0 0 20px rgba(220, 38, 38, 0.8)';

    // 선 효과
    line.style.backgroundColor = 'rgba(255, 255, 255, 0.6)';
    line.style.width = mobile ? '25px' : '35px';
  });

  el.addEventListener('mouseleave', () => {
    // 라벨 효과
    labelContainer.style.transform = 'scale(1) translateZ(0)';
    labelContainer.style.boxShadow = isNextRace
      ? '0 4px 15px rgba(255, 24, 1, 0.6)'
      : '0 2px 8px rgba(0, 0, 0, 0.5)';
    labelContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.85)';

    // 점 효과
    dot.style.transform = 'scale(1) translateZ(0)';
    dot.style.boxShadow = '0 0 10px rgba(220, 38, 38, 0.6)';

    // 선 효과
    line.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
    line.style.width = mobile ? '20px' : '30px';
  });

  // 클릭 이벤트
  if (onMarkerClick) {
    el.addEventListener('click', () => {
      const markerData: MarkerData = {
        type: 'circuit',
        id: circuit.id,
        name: circuit.name, // LocalizedText 객체를 그대로 전달
        grandPrix: circuit.grandPrix, // LocalizedText 객체를 그대로 전달
        length: circuit.length,
        laps: circuit.laps,
        corners: circuit.corners || 10,
        totalDistance: circuit.laps && circuit.length ? Math.round((circuit.laps * circuit.length) * 10) / 10 : 0,
        location: circuit.location, // LocalizedText 객체를 그대로 전달
        lapRecord: circuit.lapRecord ? {
          ...circuit.lapRecord,
          year: circuit.lapRecord.year.toString()
        } : undefined
      };
      onMarkerClick(markerData);
    });
  }

  // 마커 추가 - anchor를 'left'로 설정하여 점이 정확한 위치에 오도록 함
  const marker = new mapboxgl.Marker(el, {
    anchor: 'left'
  })
    .setLngLat([circuit.location.lng, circuit.location.lat])
    .addTo(map);

  // 줌 레벨에 따른 라벨 표시/숨김 처리
  const updateLabelVisibility = () => {
    const zoom = map.getZoom();
    
    if (zoom <= 5) {
      // 줌 5 이하: 라벨과 연결선 숨기기
      labelContainer.style.display = 'none';
      line.style.display = 'none';
      
      // 컨테이너 크기 조정
      el.style.gap = '0';
    } else {
      // 줌 5 초과: 라벨과 연결선 표시
      labelContainer.style.display = 'flex';
      line.style.display = 'block';
      
      // 컨테이너 gap 복원
      el.style.gap = '0';
    }
  };
  
  // 초기 설정
  updateLabelVisibility();
  
  // 줌 이벤트 리스너
  map.on('zoom', updateLabelVisibility);

  if (onMarkerCreated) {
    onMarkerCreated(marker);
  }

  return marker;
};
