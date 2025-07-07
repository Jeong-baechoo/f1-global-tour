import mapboxgl from 'mapbox-gl';
import { Team, MarkerData } from '../../types';

// Symbol Layer를 사용한 마커 추가 (WebGL 렌더링)
export const addTeamMarkersAsSymbols = (
  map: mapboxgl.Map,
  teams: Team[],
  onMarkerClick?: (item: MarkerData) => void
) => {
  // 팀 아이콘 로드
  teams.forEach(team => {
    const iconUrl = `/markers/${team.id}-logo.png`;
    
    if (!map.hasImage(team.id)) {
      map.loadImage(iconUrl, (error, image) => {
        if (error) return;
        if (image) map.addImage(team.id, image);
      });
    }
  });

  // GeoJSON 데이터 생성
  const geojson = {
    type: 'FeatureCollection' as const,
    features: teams.map(team => ({
      type: 'Feature' as const,
      geometry: {
        type: 'Point' as const,
        coordinates: [team.headquarters.lng, team.headquarters.lat]
      },
      properties: {
        ...team,
        type: 'team'
      }
    }))
  };

  // 소스 추가
  map.addSource('teams', {
    type: 'geojson',
    data: geojson
  });

  // Symbol Layer 추가
  map.addLayer({
    id: 'team-markers',
    type: 'symbol',
    source: 'teams',
    layout: {
      'icon-image': ['get', 'id'],
      'icon-size': 0.8,
      'icon-allow-overlap': true,
      'icon-ignore-placement': true
    }
  });

  // 클릭 이벤트
  map.on('click', 'team-markers', (e) => {
    if (e.features && e.features[0] && onMarkerClick) {
      const properties = e.features[0].properties;
      onMarkerClick({
        type: 'team',
        ...properties
      });
    }
  });

  // 호버 커서
  map.on('mouseenter', 'team-markers', () => {
    map.getCanvas().style.cursor = 'pointer';
  });
  
  map.on('mouseleave', 'team-markers', () => {
    map.getCanvas().style.cursor = '';
  });
};