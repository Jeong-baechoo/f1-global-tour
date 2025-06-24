import mapboxgl from 'mapbox-gl';
import { createTeamMarker } from '../markers/TeamMarker';
import { MarkerData, Team, TransformedTeam } from '../types';
import { TEAM_DRIVERS } from '../data/teamDrivers';

// 팀 데이터를 TeamMarker 형식으로 변환
function transformTeamData(team: Team): TransformedTeam {
  return {
    ...team,
    logo: '', // 로고 URL은 TeamMarker 내부에서 관리
    drivers: TEAM_DRIVERS[team.id] || []
  };
}

// 여러 팀 마커를 일괄 생성
export function createTeamMarkers(
  map: mapboxgl.Map,
  teams: Team[],
  onMarkerClick?: (data: MarkerData) => void
): mapboxgl.Marker[] {
  const markers: mapboxgl.Marker[] = [];

  teams.forEach(team => {
    try {
      const transformedTeam = transformTeamData(team);
      const marker = createTeamMarker({ 
        map, 
        team: transformedTeam, 
        onMarkerClick 
      });
      markers.push(marker);
      console.log(`[TeamHelpers] ${team.name} marker added`);
    } catch (error) {
      console.error(`[TeamHelpers] Failed to create ${team.name} marker:`, error);
    }
  });

  return markers;
}