import mapboxgl from 'mapbox-gl';
import teamsData from '@/data/teams.json';
import { TeamMarkerFactory } from './TeamMarkerFactory';
import { MarkerData } from '../../types';
import { getUKTeamAdjustedPosition, isUKTeam } from './UKTeamLayout';
import { getItalyTeamAdjustedPosition, isItalyTeam } from './ItalyTeamLayout';
import type { Language } from '@/utils/i18n';

// cleanup 함수를 포함하는 마커 타입
interface MarkerWithCleanup {
  marker: mapboxgl.Marker;
  cleanup: () => void;
}

interface AddAllTeamsOptions {
  map: mapboxgl.Map;
  onMarkerClick?: (item: MarkerData) => void;
  markersWithCleanup: MarkerWithCleanup[];
  language?: Language;
}

// 특별 레이아웃 팀 마커 생성 함수 (영국, 이탈리아)
const createSpecialLayoutTeamMarker = (
  map: mapboxgl.Map,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  team: any,
  onMarkerClick: ((item: MarkerData) => void) | undefined,
  markersWithCleanup: MarkerWithCleanup[],
  layoutType: 'uk' | 'italy',
  language: Language = 'en'
) => {
  // 초기 위치 계산
  const initialZoom = map.getZoom();
  const initialPosition = layoutType === 'uk' 
    ? getUKTeamAdjustedPosition(
        team.id,
        team.headquarters.lat,
        team.headquarters.lng,
        initialZoom
      )
    : getItalyTeamAdjustedPosition(
        team.id,
        team.headquarters.lat,
        team.headquarters.lng,
        initialZoom
      );
  
  // 마커 표시는 조정된 위치로, 하지만 클릭 시엔 원래 위치로 이동해야 함
  // TeamMarkerFactory가 사용할 팀 데이터는 원본 그대로 전달
  const originalTeam = team;
  
  // TeamMarkerFactory를 사용하여 마커 생성
  const markerWithCleanup = TeamMarkerFactory.create({
    map,
    team: originalTeam,
    language,
    onMarkerClick
  });
  
  if (!markerWithCleanup) return;
  
  const { marker, cleanup: factoryCleanup } = markerWithCleanup;
  
  // 마커를 조정된 위치로 즉시 이동
  marker.setLngLat([initialPosition.lng, initialPosition.lat]);
  
  // 줌 변경 시 마커 위치만 업데이트 (재생성 X)
  const updateMarkerPosition = () => {
    const zoom = map.getZoom();
    const adjustedPosition = layoutType === 'uk'
      ? getUKTeamAdjustedPosition(
          team.id,
          team.headquarters.lat,
          team.headquarters.lng,
          zoom
        )
      : getItalyTeamAdjustedPosition(
          team.id,
          team.headquarters.lat,
          team.headquarters.lng,
          zoom
        );
    
    // setLngLat을 사용하여 위치 업데이트
    marker.setLngLat([adjustedPosition.lng, adjustedPosition.lat]);
  };
  
  // 줌 이벤트 리스너
  map.on('zoom', updateMarkerPosition);
  
  // cleanup 함수를 포함한 객체 저장
  const cleanup = () => {
    map.off('zoom', updateMarkerPosition);
    factoryCleanup();
  };
  
  markersWithCleanup.push({ marker, cleanup });
};

export const addAllTeams = ({ map, onMarkerClick, markersWithCleanup, language = 'en' }: AddAllTeamsOptions) => {
  teamsData.teams.forEach((team) => {
    const isUK = isUKTeam(team.id);
    const isItaly = isItalyTeam(team.id);
    
    if (isUK) {
      // 영국 팀은 줌에 따라 위치 변경
      createSpecialLayoutTeamMarker(map, team, onMarkerClick, markersWithCleanup, 'uk', language);
    } else if (isItaly) {
      // 이탈리아 팀도 줌에 따라 위치 변경
      createSpecialLayoutTeamMarker(map, team, onMarkerClick, markersWithCleanup, 'italy', language);
    } else {
      // 영국/이탈리아 팀이 아닌 경우 일반 마커
      const markerWithCleanup = TeamMarkerFactory.create({
        map,
        team,
        language,
        onMarkerClick
      });
      
      if (markerWithCleanup) {
        markersWithCleanup.push(markerWithCleanup);
      }
    }
  });
};