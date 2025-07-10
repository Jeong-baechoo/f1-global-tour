import circuitsData from '@/data/circuits.json';
import { CircuitMarkerManager } from '../services/managers/CircuitMarkerManager';
import { F1_2025_CIRCUITS } from '@/components/mapbox/utils/data/circuitMapping';
import { addSectorMarkers, addDRSDetectionMarkers, addSpeedTrapMarkers } from '@/components/mapbox/markers/circuit/SectorMarkerManager';
import type { Language } from '@/utils/i18n';

// 섹터 마커 cleanup 함수들을 저장할 배열
const sectorCleanupFunctions: (() => void)[] = [];

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

// CircuitMarkerManager를 사용하여 모든 서킷 마커 추가 (확장된 기능)
export const addAllCircuitsWithExtensions = (
  circuitMarkerManager: CircuitMarkerManager,
  nextRace?: string,
  language?: Language
) => {
  // 2025 시즌 서킷만 필터링
  const circuits2025 = circuitsData.circuits.filter(circuit => 
    F1_2025_CIRCUITS.includes(circuit.id)
  );
  
  // 언어 설정
  if (language && circuitMarkerManager.setLanguage) {
    circuitMarkerManager.setLanguage(language);
  }
  
  // 2025년 서킷에 대해 마커 추가
  circuits2025.forEach(circuit => {
    const isNextRace = circuit.id === nextRace;
    circuitMarkerManager.addCircuitMarker(circuit, isNextRace);
  });
  
  // 추가로 뉘르부르크링 추가 (데모용)
  const nurburgring = circuitsData.circuits.find(c => c.id === 'nurburgring');
  if (nurburgring) {
    circuitMarkerManager.addCircuitMarker(nurburgring, false);
  }
};

// 특정 서킷에 섹터 마커 추가 (트랙 애니메이션 완료 후 호출)
export const addSectorMarkersForCircuit = async (map: mapboxgl.Map, circuitId: string) => {
  // 뉘르부르크링을 제외한 모든 서킷에 섹터 마커 추가
  if (circuitId !== 'nurburgring') {
    // 섹터 마커 추가
    const sectorCleanup = await addSectorMarkers({
      map,
      circuitId: circuitId
    });
    sectorCleanupFunctions.push(sectorCleanup);

    // DRS Detection 마커 추가
    const drsDetectionCleanup = await addDRSDetectionMarkers({
      map,
      circuitId: circuitId
    });
    sectorCleanupFunctions.push(drsDetectionCleanup);

    // Speed Trap 마커 추가
    const speedTrapCleanup = await addSpeedTrapMarkers({
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