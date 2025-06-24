import mapboxgl from 'mapbox-gl';
import { MarkerData } from '../types';
import { MARKER_STYLES } from '../constants';
import { isMobile } from '../utils/device';

interface Team {
  id: string;
  fullName: string;
  description: string;
  teamPrincipal: string;
  headquarters: {
    city: string;
    country: string;
    lat: number;
    lng: number;
  };
  colors: {
    primary: string;
    secondary: string;
  };
}

interface AstonMartinMarkerProps {
  map: mapboxgl.Map;
  team: Team;
  onMarkerClick?: (item: MarkerData) => void;
}

export const createAstonMartinMarker = ({ map, team, onMarkerClick }: AstonMartinMarkerProps): mapboxgl.Marker => {
  const mobile = isMobile();
  const markerStyle = MARKER_STYLES.redBullMarker; // 기본 스타일 재사용
  
  const astonMartinHQ = {
    name: team.fullName,
    coordinates: [team.headquarters.lng, team.headquarters.lat],
    description: team.description,
    address: `${team.headquarters.city}, ${team.headquarters.country}`
  };

  // 커스텀 마커 엘리먼트 생성
  const el = document.createElement('div');
  el.className = 'marker aston-martin-marker';
  el.style.position = 'absolute';
  el.style.width = mobile ? markerStyle.mobileWidth : markerStyle.width;
  el.style.height = mobile ? markerStyle.mobileHeight : markerStyle.height;
  el.style.cursor = 'pointer';
  // 정확한 중심점 설정
  el.style.transform = 'translate(-50%, -50%)';
  el.style.transformOrigin = 'center center';

  // 메인 박스
  const box = document.createElement('div');
  box.style.width = mobile ? markerStyle.mobileBoxWidth : markerStyle.boxWidth;
  box.style.height = mobile ? markerStyle.mobileBoxHeight : markerStyle.boxHeight;
  box.style.backgroundImage = 'url(/team-logos/Aston_Martin_Aramco-Mercedes_logo.png)';
  box.style.backgroundSize = 'contain';
  box.style.backgroundPosition = 'center';
  box.style.backgroundRepeat = 'no-repeat';
  box.style.backgroundColor = '#006F62'; // Aston Martin green
  box.style.borderRadius = MARKER_STYLES.redBullMarker.borderRadius;
  box.style.border = '2px solid #004D40'; // Dark green border
  box.style.boxShadow = '0 2px 10px rgba(0,111,98,0.4)'; // Aston Martin green shadow
  box.style.transition = 'all 0.3s ease';

  el.appendChild(box);

  // GPU 가속 호버 효과
  el.style.willChange = 'transform';
  box.style.willChange = 'transform, box-shadow';

  el.addEventListener('mouseenter', () => {
    box.style.transform = 'scale(1.1) translateZ(0)';
    box.style.boxShadow = '0 4px 20px rgba(0,111,98,0.6)'; // Enhanced Aston Martin green shadow
  });

  el.addEventListener('mouseleave', () => {
    box.style.transform = 'scale(1) translateZ(0)';
    box.style.boxShadow = '0 2px 10px rgba(0,111,98,0.4)';
  });

  // 클릭 이벤트
  el.addEventListener('click', () => {
    if (onMarkerClick) {
      onMarkerClick({
        type: 'team',
        id: 'aston-martin',
        name: team.fullName,
        principal: team.teamPrincipal,
        location: team.headquarters,
        color: team.colors.primary,
        drivers: ['Fernando Alonso', 'Lance Stroll']
      });
    }

    map.flyTo({
      center: [-1.0288, 52.0762],
      zoom: 15.68,
      pitch: 49,
      bearing: 136,
      speed: 0.4,
      curve: 0.8,
      duration: 6000,
      essential: true
    });
  });

  // 마커 추가 (팝업 없이) - 정확한 위치 고정
  return new mapboxgl.Marker(el, { 
    anchor: 'top-left',
    offset: [0, 0]
  })
    .setLngLat(astonMartinHQ.coordinates as [number, number])
    .addTo(map);
};