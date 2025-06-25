import mapboxgl from 'mapbox-gl';
import circuitsData from '@/data/circuits.json';
import { createCircuitMarker } from './CircuitMarker';
import { createCircuitMarkerWithLeader } from './CircuitMarkerWithLeader';
import { getCircuitLabelOffset } from './CircuitLabelPlacements';
import { LabelCollisionSystem } from './LabelCollisionSystem';
import { MarkerData } from '../../types';
import { F1_2025_CIRCUITS } from '../../utils/data/circuitMapping';

interface AddAllCircuitsOptions {
  map: mapboxgl.Map;
  onMarkerClick?: (item: MarkerData) => void;
  nextRaceId?: string;
  markers: mapboxgl.Marker[];
}

// 전역 충돌 시스템 인스턴스
let collisionSystem: LabelCollisionSystem | null = null;

export const addAllCircuits = ({ 
  map, 
  onMarkerClick, 
  nextRaceId,
  markers 
}: AddAllCircuitsOptions) => {
  // 충돌 시스템 초기화
  if (collisionSystem) {
    collisionSystem.clear();
  }
  collisionSystem = new LabelCollisionSystem(map);
  
  // 2025 시즌 서킷만 필터링
  const circuits2025 = circuitsData.circuits.filter(circuit => 
    F1_2025_CIRCUITS.includes(circuit.id)
  );
  
  const markerInfos: Array<{
    circuit: any;
    marker: mapboxgl.Marker;
    labelElement: HTMLElement;
    updateLeaderLine: () => void;
  }> = [];
  
  // 2025년 서킷에 대해 마커 추가
  circuits2025.forEach(circuit => {
    const isNextRace = circuit.id === nextRaceId;
    const labelOffset = getCircuitLabelOffset(circuit.id);
    
    let labelElementRef: HTMLElement | null = null;
    let updateLeaderLineRef: (() => void) | null = null;
    
    const { marker, updateLeaderLine } = createCircuitMarkerWithLeader({
      map,
      circuit,
      isNextRace,
      onMarkerClick,
      labelOffset,
      onMarkerCreated: (m, labelEl) => {
        markers.push(m);
        labelElementRef = labelEl;
      }
    });
    
    updateLeaderLineRef = updateLeaderLine;
    
    // onMarkerCreated 후에 markerInfos에 추가
    if (labelElementRef && updateLeaderLineRef) {
      markerInfos.push({
        circuit,
        marker,
        labelElement: labelElementRef,
        updateLeaderLine: updateLeaderLineRef
      });
    }
  });
  
  // 추가로 뉘르부르크링 추가 (데모용)
  const nurburgring = circuitsData.circuits.find(c => c.id === 'nurburgring');
  if (nurburgring) {
    const labelOffset = getCircuitLabelOffset(nurburgring.id);
    
    let labelElementRef: HTMLElement | null = null;
    let updateLeaderLineRef: (() => void) | null = null;
    
    const { marker, updateLeaderLine } = createCircuitMarkerWithLeader({
      map,
      circuit: nurburgring,
      isNextRace: false,
      onMarkerClick,
      labelOffset,
      onMarkerCreated: (m, labelEl) => {
        markers.push(m);
        labelElementRef = labelEl;
      }
    });
    
    updateLeaderLineRef = updateLeaderLine;
    
    // onMarkerCreated 후에 markerInfos에 추가
    if (labelElementRef && updateLeaderLineRef) {
      markerInfos.push({
        circuit: nurburgring,
        marker,
        labelElement: labelElementRef,
        updateLeaderLine: updateLeaderLineRef
      });
    }
  }
  
  // 충돌 시스템 비활성화 (수동 배치만 사용)
  // 나중에 필요하면 다시 활성화할 수 있음
  /*
  setTimeout(() => {
    markerInfos.forEach(({ circuit, marker, labelElement, updateLeaderLine }) => {
      collisionSystem!.registerLabel(
        circuit.id,
        labelElement,
        marker,
        updateLeaderLine
      );
    });
    
    // 충돌 시스템 시작
    collisionSystem!.start();
  }, 100);
  
  // 맵 이동/줌 시 충돌 시스템 업데이트
  const handleMapMove = () => {
    if (collisionSystem) {
      collisionSystem.update();
    }
  };
  
  map.on('move', handleMapMove);
  map.on('zoom', handleMapMove);
  */
};

// 다음 레이스 찾기
export const findNextRace = () => {
  const today = new Date();
  
  // 레이스 날짜가 있는 서킷만 필터링하고 정렬
  const sortedCircuits = circuitsData.circuits
    .filter((circuit) => circuit.raceDate2025 !== null)
    .sort((a, b) => {
      const dateA = new Date(a.raceDate2025!).getTime();
      const dateB = new Date(b.raceDate2025!).getTime();
      return dateA - dateB;
    });
  
  // 다음 레이스 찾기
  const nextRace = sortedCircuits.find((circuit) => {
    if (!circuit.raceDate2025) return false;
    return new Date(circuit.raceDate2025) > today;
  });
  
  return nextRace || sortedCircuits[0]; // 미래 레이스가 없으면 시즌 첫 레이스
};