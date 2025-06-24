import mapboxgl from 'mapbox-gl';
import circuitsData from '@/data/circuits.json';
import { createCircuitMarker } from './CircuitMarker';
import { MarkerData } from '../types';
import { F1_2025_CIRCUITS } from '../utils/circuitMapping';

interface AddAllCircuitsOptions {
  map: mapboxgl.Map;
  onMarkerClick?: (item: MarkerData) => void;
  nextRaceId?: string;
  markers: mapboxgl.Marker[];
}

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
    
    createCircuitMarker({
      map,
      circuit,
      isNextRace,
      onMarkerClick,
      onMarkerCreated: (marker) => {
        markers.push(marker);
      }
    });
  });
  
  // 추가로 뉘르부르크링 추가 (데모용)
  const nurburgring = circuitsData.circuits.find(c => c.id === 'nurburgring');
  if (nurburgring) {
    createCircuitMarker({
      map,
      circuit: nurburgring,
      isNextRace: false,
      onMarkerClick,
      onMarkerCreated: (marker) => {
        markers.push(marker);
      }
    });
  }
};

// 다음 레이스 찾기 헬퍼 함수
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