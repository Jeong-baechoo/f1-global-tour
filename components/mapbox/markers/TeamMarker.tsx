import mapboxgl from 'mapbox-gl';
import { MarkerData, TransformedTeam } from '../types';
import { MARKER_STYLES, SPECIAL_COORDINATES, ZOOM_LEVELS, ANIMATION_SPEEDS, PITCH_ANGLES } from '../constants';
import { isMobile } from '../utils/device';

interface TeamMarkerProps {
  map: mapboxgl.Map;
  team: TransformedTeam;
  onMarkerClick?: (item: MarkerData) => void;
}

// 팀별 스타일 설정
const TEAM_STYLES: Record<string, {
  backgroundColor: string;
  borderColor: string;
  logoUrl: string;
}> = {
  'red-bull': {
    backgroundColor: 'white',
    borderColor: '#1e3a8a',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/de/thumb/c/c4/Red_Bull_Racing_logo.svg/200px-Red_Bull_Racing_logo.svg.png'
  },
  'ferrari': {
    backgroundColor: '#DC0000',
    borderColor: '#FFF200',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/de/thumb/c/c0/Scuderia_Ferrari_Logo.svg/200px-Scuderia_Ferrari_Logo.svg.png'
  },
  'mercedes': {
    backgroundColor: '#00D2BE',
    borderColor: '#000000',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fb/Mercedes_AMG_Petronas_F1_Logo.svg/200px-Mercedes_AMG_Petronas_F1_Logo.svg.png'
  },
  'mclaren': {
    backgroundColor: '#FF8700',
    borderColor: '#000000',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/6/66/McLaren_Racing_logo.svg/200px-McLaren_Racing_logo.svg.png'
  },
  'aston-martin': {
    backgroundColor: '#006F62',
    borderColor: '#90EE90',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/de/thumb/5/5e/Aston_Martin_Aramco_Cognizant_F1.svg/200px-Aston_Martin_Aramco_Cognizant_F1.svg.png'
  },
  'alpine': {
    backgroundColor: '#0090FF',
    borderColor: '#FF13F0',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Alpine_F1_Team_Logo.svg/200px-Alpine_F1_Team_Logo.svg.png'
  },
  'haas': {
    backgroundColor: '#B6BABD',
    borderColor: '#E6002D',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Logo_Haas_F1.png/200px-Logo_Haas_F1.png'
  },
  'racing-bulls': {
    backgroundColor: '#1E3A8A',
    borderColor: '#00FFF0',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/7/7a/Scuderia_AlphaTauri_logo.svg/200px-Scuderia_AlphaTauri_logo.svg.png'
  },
  'williams': {
    backgroundColor: '#005AFF',
    borderColor: '#00A0DE',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/Logo_Williams_Racing.png/200px-Logo_Williams_Racing.png'
  },
  'alfa-romeo': {
    backgroundColor: '#A51E36',
    borderColor: '#FFFFFF',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/1/18/Stake_F1_Team_Kick_Sauber_logo.png/200px-Stake_F1_Team_Kick_Sauber_logo.png'
  }
};

export const createTeamMarker = ({ map, team, onMarkerClick }: TeamMarkerProps): mapboxgl.Marker => {
  const mobile = isMobile();
  const markerStyle = MARKER_STYLES.redBullMarker;
  const teamStyle = TEAM_STYLES[team.id] || TEAM_STYLES['red-bull'];
  
  const teamHQ = {
    name: team.fullName,
    coordinates: [team.headquarters.lng, team.headquarters.lat],
    description: team.description,
    address: `${team.headquarters.city}, ${team.headquarters.country}`
  };

  // 커스텀 마커 엘리먼트 생성
  const el = document.createElement('div');
  el.className = `marker ${team.id}-marker`;
  el.style.position = 'absolute';
  el.style.width = mobile ? markerStyle.mobileWidth : markerStyle.width;
  el.style.height = mobile ? markerStyle.mobileHeight : markerStyle.height;
  el.style.cursor = 'pointer';
  el.style.willChange = 'transform';
  el.style.transform = 'translateZ(0)'; // GPU 가속

  // 메인 박스
  const box = document.createElement('div');
  box.style.width = mobile ? markerStyle.mobileBoxWidth : markerStyle.boxWidth;
  box.style.height = mobile ? markerStyle.mobileBoxHeight : markerStyle.boxHeight;
  box.style.backgroundImage = `url(${teamStyle.logoUrl})`;
  box.style.backgroundSize = 'contain';
  box.style.backgroundPosition = 'center';
  box.style.backgroundRepeat = 'no-repeat';
  box.style.backgroundColor = teamStyle.backgroundColor;
  box.style.borderRadius = markerStyle.borderRadius;
  box.style.border = `3px solid ${teamStyle.borderColor}`;
  box.style.boxShadow = '0 2px 10px rgba(0,0,0,0.3)';
  box.style.transition = 'all 0.3s ease';

  el.appendChild(box);

  // GPU 가속 호버 효과
  el.style.willChange = 'transform';
  box.style.willChange = 'transform, box-shadow';

  el.addEventListener('mouseenter', () => {
    box.style.transform = 'scale(1.1) translateZ(0)';
    box.style.boxShadow = '0 4px 20px rgba(0,0,0,0.4)';
  });

  el.addEventListener('mouseleave', () => {
    box.style.transform = 'scale(1) translateZ(0)';
    box.style.boxShadow = '0 2px 10px rgba(0,0,0,0.3)';
  });

  // 클릭 이벤트
  el.addEventListener('click', () => {
    if (onMarkerClick) {
      onMarkerClick({
        type: 'team',
        id: team.id,
        name: team.fullName,
        principal: team.teamPrincipal,
        headquarters: team.headquarters,
        color: team.colors.primary,
        drivers: team.drivers
      });
    }

    // Red Bull은 특별한 좌표 사용
    const center = team.id === 'red-bull' 
      ? SPECIAL_COORDINATES.redBull 
      : teamHQ.coordinates as [number, number];

    map.flyTo({
      center,
      zoom: mobile ? ZOOM_LEVELS.teamHQ.mobile : ZOOM_LEVELS.teamHQ.desktop,
      pitch: PITCH_ANGLES.teamHQ,
      bearing: 0,
      speed: ANIMATION_SPEEDS.flyTo,
      curve: ANIMATION_SPEEDS.curve,
      essential: true
    });
  });

  // 마커 추가 (팝업 없이)
  return new mapboxgl.Marker(el, { 
    anchor: 'center'
  })
    .setLngLat(teamHQ.coordinates as [number, number])
    .addTo(map);
};