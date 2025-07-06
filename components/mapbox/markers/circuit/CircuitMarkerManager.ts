import circuitsData from '@/data/circuits.json';
import { CircuitMarkerManager } from '../../managers/CircuitMarkerManager';
import { F1_2025_CIRCUITS } from '../../utils/data/circuitMapping';
import { addSectorMarkers, addDRSDetectionMarkers, addSpeedTrapMarkers } from './SectorMarkerManager';

interface AddAllCircuitsOptions {
  map: mapboxgl.Map;
  onMarkerClick?: (item: MarkerData) => void;
  nextRaceId?: string;
  markers: mapboxgl.Marker[];
}

// 섹터 마커 cleanup 함수들을 저장할 배열
const sectorCleanupFunctions: (() => void)[] = [];

export const addAllCircuits = ({ 
  map, 
  onMarkerClick, 
  nextRaceId,
  markers 
}: AddAllCircuitsOptions) => {
  // 2025 시즌 서킷만 필터링
  const circuits2025 = circuitsData.circuits.filter(circuit => 
    F1_2025_CIRCUITS.includes(circuit.id)
  );
  
  // 2025년 서킷에 대해 마커 추가
  circuits2025.forEach(circuit => {
    const isNextRace = circuit.id === nextRaceId;
    
    const marker = createCircuitMarker({
      map,
      circuit,
      isNextRace,
      onMarkerClick
    });
    if (marker) {
      markers.push(marker);
    }
  });
  
  // 추가로 뉘르부르크링 추가 (데모용)
  const nurburgring = circuitsData.circuits.find(c => c.id === 'nurburgring');
  if (nurburgring) {
    const marker = createCircuitMarker({
      map,
      circuit: nurburgring,
      isNextRace: false,
      onMarkerClick
    });
    if (marker) {
      markers.push(marker);
    }
  }
};

import type { Language } from '@/utils/i18n';
// 다음 레이스 찾기
export const findNextRace = () => {
  const today = new Date();
  
  // 레이스 날짜가 있는 서킷만 필터링하고 정렬
  const sortedCircuits = circuitsData.circuits
    .filter(circuit => circuit.raceDate2025)
    .map(circuit => ({
      ...circuit,
      raceDate: new Date(circuit.raceDate2025!)
    }))
    .sort((a, b) => a.raceDate.getTime() - b.raceDate.getTime());
  
  // 오늘 이후의 첫 번째 레이스 찾기
  const nextRace = sortedCircuits.find(circuit => circuit.raceDate >= today);
  
  return nextRace ? nextRace.id : null;
};

// 특정 서킷에 섹터 마커 추가 (트랙 애니메이션 완료 후 호출)
export const addSectorMarkersForCircuit = (map: mapboxgl.Map, circuitId: string) => {
  // 뉘르부르크링을 제외한 모든 서킷에 섹터 마커 추가
  if (circuitId !== 'nurburgring') {
    // 섹터 마커 추가
    const sectorCleanup = addSectorMarkers({
      map,
      circuitId: circuitId
    });
    sectorCleanupFunctions.push(sectorCleanup);

    // DRS Detection 마커 추가
    const drsDetectionCleanup = addDRSDetectionMarkers({
      map,
      circuitId: circuitId
    });
    sectorCleanupFunctions.push(drsDetectionCleanup);

    // Speed Trap 마커 추가
    const speedTrapCleanup = addSpeedTrapMarkers({
      map,
      circuitId: circuitId
    });
    sectorCleanupFunctions.push(speedTrapCleanup);
  }
};

// 섹터 마커 정리 함수
export const cleanupSectorMarkers = () => {
  sectorCleanupFunctions.forEach(cleanup => cleanup());
  sectorCleanupFunctions.length = 0; // 배열 비우기
};