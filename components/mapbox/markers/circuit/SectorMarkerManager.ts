import mapboxgl from 'mapbox-gl';
import { 
  getDynamicSectorData, 
  getDynamicDRSDetectionData, 
  getDynamicSpeedTrapData,
  type SectorInfo,
  type DRSDetectionInfo,
  type SpeedTrapInfo
} from '../../utils/data/dynamicSectorLoader';
import { trackManager } from '../../utils/map/trackManager';

interface SectorMarkerManagerProps {
  map: mapboxgl.Map;
  circuitId: string;
}

// 섹터별 색상 반환
const getSectorColor = (sectorNumber: number): string => {
  switch (sectorNumber) {
    case 1: return '#FF0000'; // 빨간색 (Start/Finish 포함)
    case 2: return '#0000FF'; // 파란색 
    case 3: return '#FFFF00'; // 노란색
    default: return '#FF0000';
  }
};

// DRS Detection Zone 색상 반환
const getDRSDetectionColor = (zoneNumber: number): string => {
  switch (zoneNumber) {
    case 1: return '#00FF00'; // 녹색
    case 2: return '#FF6600'; // 주황색
    case 3: return '#FF00FF'; // 마젠타
    default: return '#00FF00';
  }
};

// Speed Trap 색상 반환
const getSpeedTrapColor = (): string => {
  return '#FFFFFF'; // 흰색
};

// 동적으로 GeoJSON에서 섹터 데이터를 가져오는 함수
export const getSectorData = async (circuitId: string): Promise<SectorInfo[]> => {
  try {
    const sectors = await getDynamicSectorData(circuitId);
    return sectors;
  } catch {
    return [];
  }
};

// 동적으로 GeoJSON에서 DRS Detection 데이터를 가져오는 함수
export const getDRSDetectionData = async (circuitId: string): Promise<DRSDetectionInfo[]> => {
  try {
    const drsZones = await getDynamicDRSDetectionData(circuitId);
    return drsZones;
  } catch {
    return [];
  }
};

// 동적으로 GeoJSON에서 Speed Trap 데이터를 가져오는 함수
export const getSpeedTrapData = async (circuitId: string): Promise<SpeedTrapInfo[]> => {
  try {
    const speedTraps = await getDynamicSpeedTrapData(circuitId);
    return speedTraps;
  } catch {
    return [];
  }
};

// DRS Detection과 Speed Trap 마커들을 애니메이션 완료 후 표시하는 함수
export const showDRSAndSpeedTrapMarkers = () => {
  // DRS Detection 마커 표시
  window.dispatchEvent(new CustomEvent('toggleDRSDetectionMarkers', { 
    detail: { enabled: true } 
  }));
  
  // Speed Trap 마커 표시
  window.dispatchEvent(new CustomEvent('toggleSpeedTrapMarkers', { 
    detail: { enabled: true } 
  }));
};

// 순차적으로 섹터 마커를 표시하는 함수
export const addSectorMarkersProgressively = async ({ 
  map, 
  circuitId
}: {
  map: mapboxgl.Map;
  circuitId: string;
}): Promise<(() => void)> => {
  const sectorData = await getSectorData(circuitId);
  const markers: { marker: mapboxgl.Marker; sector: SectorInfo; visible: boolean }[] = [];
  
  if (sectorData.length === 0) {
    return () => {};
  }

  // 모든 마커를 미리 생성하되 완전히 숨김 상태로 시작
  sectorData.forEach((sector) => {
    const { marker } = createSectorMarker(map, sector);
    const element = marker.getElement();
    
    // 완전히 숨김 상태로 시작
    element.style.opacity = '0';
    element.style.display = 'none'; // 완전히 숨김
    element.style.transition = 'opacity 0.5s ease';
    element.style.pointerEvents = 'none';
    
    markers.push({ marker, sector, visible: false });
  });
  
  // trackManager에 섹터 마커들 등록
  trackManager.addSectorMarkers(circuitId, markers.map(m => m.marker));
  
  // 마커 표시/숨김 제어 함수 (토글용)
  const toggleVisibility = (visible: boolean) => {
    markers.forEach(({ marker }) => {
      const element = marker.getElement();
      element.style.display = visible ? 'flex' : 'none';
      element.style.opacity = visible ? '1' : '0';
      element.style.pointerEvents = visible ? 'auto' : 'none';
    });
  };

  // 전역 이벤트 리스너 등록 - showSectorMarker (개별 마커 표시용)
  const showEventHandler = (event: CustomEvent) => {
    const { sectorId } = event.detail;
    showSectorMarker(markers, sectorId);
  };
  
  // 전역 이벤트 리스너 등록 - toggleSectorMarkers (전체 토글용)
  const toggleEventHandler = (event: CustomEvent) => {
    const { enabled } = event.detail;
    toggleVisibility(enabled);
  };
  
  window.addEventListener('showSectorMarker', showEventHandler as EventListener);
  window.addEventListener('toggleSectorMarkers', toggleEventHandler as EventListener);

  return () => {
    // 이벤트 리스너 제거
    window.removeEventListener('showSectorMarker', showEventHandler as EventListener);
    window.removeEventListener('toggleSectorMarkers', toggleEventHandler as EventListener);
    // 마커 제거
    markers.forEach(({ marker }) => marker.remove());
  };
};

// 특정 섹터 마커를 표시하는 함수
export const showSectorMarker = (
  markers: { marker: mapboxgl.Marker; sector: SectorInfo; visible: boolean }[],
  sectorId: string
) => {
  const markerData = markers.find(m => {
    // ID로 비교
    if (m.sector.id === sectorId) return true;
    // name으로 비교
    if (m.sector.name === sectorId) return true;
    // sector-N 형식으로 비교
    if (sectorId === `sector-${m.sector.number}`) return true;
    // 마지막으로 ID에 sector-N이 포함되어 있는지 확인
    if (m.sector.id.includes(`sector-${m.sector.number}`)) {
      return sectorId === `sector-${m.sector.number}`;
    }
    return false;
  });
  
  if (markerData && !markerData.visible) {
    const element = markerData.marker.getElement();
    
    // 마커 표시 준비 (여전히 투명한 상태)
    element.style.display = 'flex';
    element.style.opacity = '0'; // 아직 투명
    element.style.transition = 'opacity 0.3s ease-out'; // 빠른 페이드인
    
    // 페이드인 시작 (단순히 opacity만 변경)
    requestAnimationFrame(() => {
      element.style.opacity = '1';
      element.style.pointerEvents = 'auto';
    });
    
    markerData.visible = true;
  }
};

// 개별 DRS Detection 마커 생성 함수
const createDRSDetectionMarker = (map: mapboxgl.Map, drsDetection: DRSDetectionInfo): { marker: mapboxgl.Marker; cleanup: () => void } => {
  // 메인 컨테이너 - 점과 라벨을 포함 (세로 배치)
  const el = document.createElement('div');
  el.className = 'marker drs-detection-marker';
  el.style.cursor = 'pointer';
  el.style.display = 'flex';
  el.style.flexDirection = 'column'; // 세로 배치
  el.style.alignItems = 'center';
  el.style.gap = '0';

  // 초기 설정 (투명 상태로 시작)
  el.style.opacity = '0';
  el.style.transition = 'opacity 0.8s ease-out';

  // 점 (실제 DRS Detection 위치)
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
  dot.style.backgroundColor = getDRSDetectionColor(drsDetection.number);
  dot.style.border = '2px solid rgba(255, 255, 255, 0.8)';
  dot.style.boxShadow = `0 0 10px ${getDRSDetectionColor(drsDetection.number)}60`;
  dot.style.transition = 'all 0.3s ease';
  dotContainer.appendChild(dot);

  // 연결선 (세로)
  const line = document.createElement('div');
  line.style.position = 'absolute';
  line.style.left = '50%';
  line.style.top = '-30px'; // 점 위쪽으로
  line.style.transform = 'translateX(-50%)';
  line.style.width = '1px';
  line.style.height = '30px';
  line.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
  line.style.transition = 'all 0.3s ease';
  dotContainer.appendChild(line);

  // 라벨 컨테이너 (깃발 스타일)
  const labelContainer = document.createElement('div');
  labelContainer.style.display = 'flex';
  labelContainer.style.flexDirection = 'column';
  labelContainer.style.backgroundColor = 'transparent';
  labelContainer.style.borderLeft = '2px solid rgba(255, 255, 255, 0.9)';
  labelContainer.style.borderTop = '2px solid rgba(255, 255, 255, 0.9)';
  labelContainer.style.borderRight = '2px solid transparent';
  labelContainer.style.borderBottom = '2px solid transparent';
  labelContainer.style.borderTopLeftRadius = '8px';
  labelContainer.style.boxShadow = 'none';
  labelContainer.style.transition = 'all 0.3s ease';
  labelContainer.style.whiteSpace = 'nowrap';
  labelContainer.style.position = 'absolute';
  labelContainer.style.overflow = 'hidden';
  labelContainer.style.left = '50%';
  labelContainer.style.bottom = '50%';
  labelContainer.style.transform = 'translateX(-2px)';
  labelContainer.style.marginBottom = '0';
  labelContainer.style.minWidth = '120px';
  labelContainer.style.height = '80px';

  // 상단 섹션 - 반투명 (DRS Detection 이름)
  const topSection = document.createElement('div');
  topSection.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
  topSection.style.padding = '4px 12px 10px 12px';
  topSection.style.borderBottom = '1px solid rgba(255, 255, 255, 0.2)';
  
  const drsName = document.createElement('div');
  drsName.style.color = '#FFFFFF';
  drsName.style.fontSize = '11px';
  drsName.style.fontFamily = '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", Arial, sans-serif';
  drsName.style.fontWeight = '200';
  drsName.style.fontStyle = 'italic';
  drsName.style.letterSpacing = '1px';
  drsName.style.textTransform = 'uppercase';
  drsName.style.opacity = '0.95';
  drsName.style.textShadow = '0 1px 2px rgba(0, 0, 0, 0.3)';
  drsName.textContent = `DRS DETECTION ${drsDetection.number}`;
  topSection.appendChild(drsName);

  // 요소 조립
  labelContainer.appendChild(topSection);
  el.appendChild(labelContainer);
  el.appendChild(dotContainer);

  // 호버 효과
  labelContainer.style.willChange = 'box-shadow';
  dot.style.willChange = 'box-shadow';

  el.addEventListener('mouseenter', () => {
    labelContainer.style.transform = 'scale(1.05) translateX(-2px)';
    topSection.style.backgroundColor = 'rgba(255, 255, 255, 0.25)';
    labelContainer.style.borderLeft = '2px solid rgba(255, 255, 255, 1)';
    labelContainer.style.borderTop = '2px solid rgba(255, 255, 255, 1)';
    dot.style.transform = 'scale(1.2)';
    dot.style.boxShadow = `0 0 20px ${getDRSDetectionColor(drsDetection.number)}80`;
    line.style.backgroundColor = 'rgba(255, 255, 255, 0.6)';
    line.style.height = '35px';
  });

  el.addEventListener('mouseleave', () => {
    labelContainer.style.transform = 'scale(1) translateX(-2px)';
    topSection.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
    labelContainer.style.borderLeft = '2px solid rgba(255, 255, 255, 0.9)';
    labelContainer.style.borderTop = '2px solid rgba(255, 255, 255, 0.9)';
    dot.style.transform = 'scale(1)';
    dot.style.boxShadow = `0 0 10px ${getDRSDetectionColor(drsDetection.number)}60`;
    line.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
    line.style.height = '30px';
  });

  const marker = new mapboxgl.Marker(el, {
    anchor: 'bottom'
  })
    .setLngLat(drsDetection.position)
    .addTo(map);

  return { marker, cleanup: () => marker.remove() };
};

// 개별 Speed Trap 마커 생성 함수
const createSpeedTrapMarker = (map: mapboxgl.Map, speedTrap: SpeedTrapInfo): { marker: mapboxgl.Marker; cleanup: () => void } => {
  // 메인 컨테이너 - 점과 라벨을 포함 (세로 배치)
  const el = document.createElement('div');
  el.className = 'marker speed-trap-marker';
  el.style.cursor = 'pointer';
  el.style.display = 'flex';
  el.style.flexDirection = 'column'; // 세로 배치
  el.style.alignItems = 'center';
  el.style.gap = '0';

  // 초기 설정 (투명 상태로 시작)
  el.style.opacity = '0';
  el.style.transition = 'opacity 0.8s ease-out';

  // 점 (실제 Speed Trap 위치)
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
  dot.style.backgroundColor = getSpeedTrapColor();
  dot.style.border = '2px solid rgba(0, 0, 0, 0.8)';
  dot.style.boxShadow = `0 0 10px ${getSpeedTrapColor()}60`;
  dot.style.transition = 'all 0.3s ease';
  dotContainer.appendChild(dot);

  // 연결선 (세로)
  const line = document.createElement('div');
  line.style.position = 'absolute';
  line.style.left = '50%';
  line.style.top = '-30px'; // 점 위쪽으로
  line.style.transform = 'translateX(-50%)';
  line.style.width = '1px';
  line.style.height = '30px';
  line.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
  line.style.transition = 'all 0.3s ease';
  dotContainer.appendChild(line);

  // 라벨 컨테이너 (깃발 스타일)
  const labelContainer = document.createElement('div');
  labelContainer.style.display = 'flex';
  labelContainer.style.flexDirection = 'column';
  labelContainer.style.backgroundColor = 'transparent';
  labelContainer.style.borderLeft = '2px solid rgba(255, 255, 255, 0.9)';
  labelContainer.style.borderTop = '2px solid rgba(255, 255, 255, 0.9)';
  labelContainer.style.borderRight = '2px solid transparent';
  labelContainer.style.borderBottom = '2px solid transparent';
  labelContainer.style.borderTopLeftRadius = '8px';
  labelContainer.style.boxShadow = 'none';
  labelContainer.style.transition = 'all 0.3s ease';
  labelContainer.style.whiteSpace = 'nowrap';
  labelContainer.style.position = 'absolute';
  labelContainer.style.overflow = 'hidden';
  labelContainer.style.left = '50%';
  labelContainer.style.bottom = '50%';
  labelContainer.style.transform = 'translateX(-2px)';
  labelContainer.style.marginBottom = '0';
  labelContainer.style.minWidth = '120px';
  labelContainer.style.height = '80px';

  // 상단 섹션 - 반투명 (Speed Trap 이름)
  const topSection = document.createElement('div');
  topSection.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
  topSection.style.padding = '4px 12px 10px 12px';
  topSection.style.borderBottom = '1px solid rgba(255, 255, 255, 0.2)';
  
  const speedTrapName = document.createElement('div');
  speedTrapName.style.color = '#FFFFFF';
  speedTrapName.style.fontSize = '12px';
  speedTrapName.style.fontFamily = '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", Arial, sans-serif';
  speedTrapName.style.fontWeight = '200';
  speedTrapName.style.fontStyle = 'italic';
  speedTrapName.style.letterSpacing = '1.5px';
  speedTrapName.style.textTransform = 'uppercase';
  speedTrapName.style.opacity = '0.95';
  speedTrapName.style.textShadow = '0 1px 2px rgba(0, 0, 0, 0.3)';
  speedTrapName.textContent = `SPEED TRAP ${speedTrap.number}`;
  topSection.appendChild(speedTrapName);

  // 요소 조립
  labelContainer.appendChild(topSection);
  el.appendChild(labelContainer);
  el.appendChild(dotContainer);

  // 호버 효과
  labelContainer.style.willChange = 'box-shadow';
  dot.style.willChange = 'box-shadow';

  el.addEventListener('mouseenter', () => {
    labelContainer.style.transform = 'scale(1.05) translateX(-2px)';
    topSection.style.backgroundColor = 'rgba(255, 255, 255, 0.25)';
    labelContainer.style.borderLeft = '2px solid rgba(255, 255, 255, 1)';
    labelContainer.style.borderTop = '2px solid rgba(255, 255, 255, 1)';
    dot.style.transform = 'scale(1.2)';
    dot.style.boxShadow = `0 0 20px ${getSpeedTrapColor()}80`;
    line.style.backgroundColor = 'rgba(255, 255, 255, 0.6)';
    line.style.height = '35px';
  });

  el.addEventListener('mouseleave', () => {
    labelContainer.style.transform = 'scale(1) translateX(-2px)';
    topSection.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
    labelContainer.style.borderLeft = '2px solid rgba(255, 255, 255, 0.9)';
    labelContainer.style.borderTop = '2px solid rgba(255, 255, 255, 0.9)';
    dot.style.transform = 'scale(1)';
    dot.style.boxShadow = `0 0 10px ${getSpeedTrapColor()}60`;
    line.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
    line.style.height = '30px';
  });

  const marker = new mapboxgl.Marker(el, {
    anchor: 'bottom'
  })
    .setLngLat(speedTrap.position)
    .addTo(map);

  return { marker, cleanup: () => marker.remove() };
};

// 개별 섹터 마커 생성 함수
const createSectorMarker = (map: mapboxgl.Map, sector: SectorInfo): { marker: mapboxgl.Marker; cleanup: () => void } => {

  // 메인 컨테이너 - 점과 라벨을 포함 (세로 배치)
  const el = document.createElement('div');
    el.className = 'marker sector-marker';
    el.style.cursor = 'pointer';
    el.style.display = 'flex';
    el.style.flexDirection = 'column'; // 세로 배치
    el.style.alignItems = 'center';
    el.style.gap = '0';
    // transform 관련 속성 제거로 Mapbox 마커 고정 유지

    // 초기 설정 (투명 상태로 시작)
    el.style.opacity = '0';
    el.style.transition = 'opacity 0.3s ease-out';

    // 점 (실제 섹터 위치)
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
    dot.style.backgroundColor = getSectorColor(sector.number);
    dot.style.border = '2px solid rgba(255, 255, 255, 0.8)';
    dot.style.boxShadow = `0 0 10px ${getSectorColor(sector.number)}60`;
    dot.style.transition = 'all 0.3s ease';
    dotContainer.appendChild(dot);

    // 연결선 (세로)
    const line = document.createElement('div');
    line.style.position = 'absolute';
    line.style.left = '50%';
    line.style.top = '-30px'; // 점 위쪽으로
    line.style.transform = 'translateX(-50%)';
    line.style.width = '1px';
    line.style.height = '30px';
    line.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
    line.style.transition = 'all 0.3s ease';
    dotContainer.appendChild(line);

    // 라벨 컨테이너 (깃발 스타일)
    const labelContainer = document.createElement('div');
    labelContainer.style.display = 'flex';
    labelContainer.style.flexDirection = 'column';
    labelContainer.style.backgroundColor = 'transparent';
    labelContainer.style.borderLeft = '2px solid rgba(255, 255, 255, 0.9)';
    labelContainer.style.borderTop = '2px solid rgba(255, 255, 255, 0.9)';
    labelContainer.style.borderRight = '2px solid transparent';
    labelContainer.style.borderBottom = '2px solid transparent';
    labelContainer.style.borderTopLeftRadius = '8px';
    labelContainer.style.boxShadow = 'none';
    labelContainer.style.transition = 'all 0.3s ease';
    labelContainer.style.whiteSpace = 'nowrap';
    labelContainer.style.position = 'absolute';
    labelContainer.style.overflow = 'hidden';
    labelContainer.style.left = '50%';
    labelContainer.style.bottom = '50%';
    labelContainer.style.transform = 'translateX(-2px)'; // 깃대를 점 중앙에 정확히 위치
    labelContainer.style.marginBottom = '0';
    labelContainer.style.minWidth = '120px';
    labelContainer.style.height = '80px'; // 깃발 + 깃대 전체 높이 증가

    // 상단 섹션 - 반투명 (섹터 이름)
    const topSection = document.createElement('div');
    topSection.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
    topSection.style.padding = '4px 12px 10px 12px';
    topSection.style.borderBottom = '1px solid rgba(255, 255, 255, 0.2)';
    
    const sectorName = document.createElement('div');
    sectorName.style.color = '#FFFFFF';
    sectorName.style.fontSize = '13px';
    sectorName.style.fontFamily = '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", Arial, sans-serif';
    sectorName.style.fontWeight = '200';
    sectorName.style.fontStyle = 'italic';
    sectorName.style.letterSpacing = '2px';
    sectorName.style.textTransform = 'uppercase';
    sectorName.style.opacity = '0.95';
    sectorName.style.textShadow = '0 1px 2px rgba(0, 0, 0, 0.3)';
    sectorName.textContent = sector.isStartFinish ? 'START/FINISH' : `SECTOR ${sector.number}`;
    topSection.appendChild(sectorName);

    // 서브 텍스트 (START/FINISH인 경우 SECTOR 1 추가)
    if (sector.isStartFinish) {
      const subText = document.createElement('div');
      subText.style.color = 'rgba(255, 255, 255, 0.7)';
      subText.style.fontSize = '10px';
      subText.style.fontFamily = '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", Arial, sans-serif';
      subText.style.fontWeight = '400';
      subText.style.letterSpacing = '1px';
      subText.style.textTransform = 'uppercase';
      subText.style.opacity = '0.8';
      subText.style.textShadow = '0 1px 2px rgba(0, 0, 0, 0.3)';
      subText.style.marginTop = '2px';
      subText.textContent = 'SECTOR 1';
      topSection.appendChild(subText);
    }

    // 요소 조립 - 상단 섹션만 추가
    labelContainer.appendChild(topSection);
    el.appendChild(labelContainer);
    el.appendChild(dotContainer);

    // 호버 효과를 위한 최소한의 willChange 설정
    labelContainer.style.willChange = 'box-shadow';
    dot.style.willChange = 'box-shadow';

    el.addEventListener('mouseenter', () => {
      // 라벨 효과 (깃발 스타일) - transform 제거
      labelContainer.style.transform = 'scale(1.05) translateX(-2px)';
      topSection.style.backgroundColor = 'rgba(255, 255, 255, 0.25)';
      labelContainer.style.borderLeft = '2px solid rgba(255, 255, 255, 1)';
      labelContainer.style.borderTop = '2px solid rgba(255, 255, 255, 1)';

      // 점 효과 - transform 제거
      dot.style.transform = 'scale(1.2)';
      dot.style.boxShadow = `0 0 20px ${getSectorColor(sector.number)}80`;

      // 선 효과 (세로)
      line.style.backgroundColor = 'rgba(255, 255, 255, 0.6)';
      line.style.height = '35px'; // 세로 길이 확장
    });

    el.addEventListener('mouseleave', () => {
      // 라벨 효과 (깃발 스타일) - transform 제거
      labelContainer.style.transform = 'scale(1) translateX(-2px)';
      topSection.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
      labelContainer.style.borderLeft = '2px solid rgba(255, 255, 255, 0.9)';
      labelContainer.style.borderTop = '2px solid rgba(255, 255, 255, 0.9)';

      // 점 효과 - transform 제거
      dot.style.transform = 'scale(1)';
      dot.style.boxShadow = `0 0 10px ${getSectorColor(sector.number)}60`;

      // 선 효과 (세로)
      line.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
      line.style.height = '30px'; // 원래 세로 길이로 복원
    });

  // HTML 마커 생성 - anchor를 'bottom'으로 설정하여 점이 정확한 위치에 오도록 함
  const marker = new mapboxgl.Marker(el, {
    anchor: 'bottom'
  })
    .setLngLat(sector.position)
    .addTo(map);

  return { marker, cleanup: () => marker.remove() };
};

// DRS Detection 마커 추가 함수
export const addDRSDetectionMarkers = async ({ map, circuitId }: SectorMarkerManagerProps): Promise<(() => void)> => {
  const drsDetectionData = await getDRSDetectionData(circuitId);
  const markers: { marker: mapboxgl.Marker; element: HTMLElement }[] = [];
  
  if (drsDetectionData.length === 0) {
    return () => {};
  }

  drsDetectionData.forEach((drsDetection) => {
    const { marker } = createDRSDetectionMarker(map, drsDetection);
    const element = marker.getElement();
    
    // 초기에는 숨김 상태로 시작
    element.style.opacity = '0';
    element.style.display = 'none';
    element.style.transition = 'opacity 0.5s ease';
    element.style.pointerEvents = 'none';
    
    markers.push({ marker, element });
  });

  // trackManager에 DRS Detection 마커들 등록
  trackManager.addDRSDetectionMarkers(circuitId, markers.map(m => m.marker));

  // 마커 표시/숨김 제어 함수
  const toggleVisibility = (visible: boolean) => {
    markers.forEach(({ element }) => {
      element.style.display = visible ? 'flex' : 'none';
    });
  };

  // 전역 이벤트 리스너 등록
  const eventHandler = (event: CustomEvent) => {
    const { enabled } = event.detail;
    toggleVisibility(enabled);
  };
  
  window.addEventListener('toggleDRSDetectionMarkers', eventHandler as EventListener);

  return () => {
    window.removeEventListener('toggleDRSDetectionMarkers', eventHandler as EventListener);
    markers.forEach(({ marker }) => marker.remove());
  };
};

// Speed Trap 마커 추가 함수
export const addSpeedTrapMarkers = async ({ map, circuitId }: SectorMarkerManagerProps): Promise<(() => void)> => {
  const speedTrapData = await getSpeedTrapData(circuitId);
  const markers: { marker: mapboxgl.Marker; element: HTMLElement }[] = [];
  
  if (speedTrapData.length === 0) {
    return () => {};
  }

  speedTrapData.forEach((speedTrap) => {
    const { marker } = createSpeedTrapMarker(map, speedTrap);
    const element = marker.getElement();
    
    // 초기에는 숨김 상태로 시작
    element.style.opacity = '0';
    element.style.display = 'none';
    element.style.transition = 'opacity 0.5s ease';
    element.style.pointerEvents = 'none';
    
    markers.push({ marker, element });
  });

  // trackManager에 Speed Trap 마커들 등록
  trackManager.addSpeedTrapMarkers(circuitId, markers.map(m => m.marker));

  // 마커 표시/숨김 제어 함수
  const toggleVisibility = (visible: boolean) => {
    markers.forEach(({ element }) => {
      element.style.display = visible ? 'flex' : 'none';
    });
  };

  // 전역 이벤트 리스너 등록
  const eventHandler = (event: CustomEvent) => {
    const { enabled } = event.detail;
    toggleVisibility(enabled);
  };
  
  window.addEventListener('toggleSpeedTrapMarkers', eventHandler as EventListener);

  return () => {
    window.removeEventListener('toggleSpeedTrapMarkers', eventHandler as EventListener);
    markers.forEach(({ marker }) => marker.remove());
  };
};

// 기존 함수도 유지 (기존 코드와의 호환성을 위해)
export const addSectorMarkers = async ({ map, circuitId }: SectorMarkerManagerProps): Promise<(() => void)> => {
  const sectorData = await getSectorData(circuitId);
  const markers: { marker: mapboxgl.Marker; element: HTMLElement }[] = [];
  
  if (sectorData.length === 0) {
    return () => {};
  }

  sectorData.forEach((sector) => {
    const { marker } = createSectorMarker(map, sector);
    const element = marker.getElement();
    markers.push({ marker, element });
  });

  // 마커 표시/숨김 제어 함수
  const toggleVisibility = (visible: boolean) => {
    markers.forEach(({ element }) => {
      element.style.display = visible ? 'flex' : 'none';
    });
  };

  // 전역 이벤트 리스너 등록 (일반 섹터 마커용 - 현재 사용되지 않음)
  const eventHandler = (event: CustomEvent) => {
    const { enabled } = event.detail;
    toggleVisibility(enabled);
  };
  
  window.addEventListener('toggleSectorMarkers', eventHandler as EventListener);

  return () => {
    window.removeEventListener('toggleSectorMarkers', eventHandler as EventListener);
    markers.forEach(({ marker }) => marker.remove());
  };
};