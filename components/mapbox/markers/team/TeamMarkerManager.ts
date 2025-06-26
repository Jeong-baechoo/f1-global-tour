import mapboxgl from 'mapbox-gl';
import teamsData from '@/data/teams.json';
import { TeamMarkerFactory } from './TeamMarkerFactory';
import { createTeamMarkerWithAnchor } from './TeamMarkerWithAnchor';
import { MarkerData } from '../../types';
import { getUKTeamAdjustedPosition, isUKTeam } from './UKTeamLayout';

interface AddAllTeamsOptions {
  map: mapboxgl.Map;
  onMarkerClick?: (item: MarkerData) => void;
  markers: mapboxgl.Marker[];
}

// 영국 팀 마커 생성 함수
const createUKTeamMarker = (
  map: mapboxgl.Map,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  team: any,
  onMarkerClick: ((item: MarkerData) => void) | undefined,
  markers: mapboxgl.Marker[]
) => {
  let markerInstance: mapboxgl.Marker | null = null;
  
  // 초기 위치 계산
  const initialZoom = map.getZoom();
  const initialPosition = getUKTeamAdjustedPosition(
    team.id,
    team.headquarters.lat,
    team.headquarters.lng,
    initialZoom
  );
  
  // 마커 생성
  createTeamMarkerWithAnchor({
    map,
    team,
    onMarkerClick,
    displayPosition: initialPosition,
    onMarkerCreated: (m) => {
      markerInstance = m;
      markers.push(m);
    }
  });
  
  // 줌 변경 시 마커 위치만 업데이트 (재생성 X)
  const updateMarkerPosition = () => {
    if (!markerInstance) return;
    
    const zoom = map.getZoom();
    const adjustedPosition = getUKTeamAdjustedPosition(
      team.id,
      team.headquarters.lat,
      team.headquarters.lng,
      zoom
    );
    
    // updatePosition 메서드 호출
    const markerWithUpdate = markerInstance as mapboxgl.Marker & { updatePosition?: (pos: { lat: number; lng: number }) => void };
    if (markerWithUpdate.updatePosition) {
      markerWithUpdate.updatePosition(adjustedPosition);
    }
  };
  
  // 줌 이벤트 리스너
  map.on('zoom', updateMarkerPosition);
};

export const addAllTeams = ({ map, onMarkerClick, markers }: AddAllTeamsOptions) => {
  teamsData.teams.forEach((team) => {
    const isUK = isUKTeam(team.id);
    
    if (isUK) {
      // 영국 팀은 줌에 따라 위치 변경
      createUKTeamMarker(map, team, onMarkerClick, markers);
    } else {
      // 영국 팀이 아닌 경우 일반 마커
      const marker = TeamMarkerFactory.create({
        map,
        team,
        onMarkerClick
      });
      
      if (marker) {
        markers.push(marker);
      }
    }
  });
};