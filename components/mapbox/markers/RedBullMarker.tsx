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

interface RedBullMarkerProps {
  map: mapboxgl.Map;
  team: Team;
  onMarkerClick?: (item: MarkerData) => void;
}

export const createRedBullMarker = ({ map, team, onMarkerClick }: RedBullMarkerProps): mapboxgl.Marker => {
  const mobile = isMobile();
  const markerStyle = MARKER_STYLES.redBullMarker;
  
  const redBullHQ = {
    name: team.fullName,
    coordinates: [team.headquarters.lng, team.headquarters.lat],
    description: team.description,
    address: `${team.headquarters.city}, ${team.headquarters.country}`
  };

  // 커스텀 마커 엘리먼트 생성
  const el = document.createElement('div');
  el.className = 'marker';
  el.style.position = 'relative';
  el.style.width = mobile ? markerStyle.mobileWidth : markerStyle.width;
  el.style.height = mobile ? markerStyle.mobileHeight : markerStyle.height;
  el.style.cursor = 'pointer';

  // 메인 박스
  const box = document.createElement('div');
  box.style.width = mobile ? markerStyle.mobileBoxWidth : markerStyle.boxWidth;
  box.style.height = mobile ? markerStyle.mobileBoxHeight : markerStyle.boxHeight;
  box.style.backgroundImage = 'url(https://upload.wikimedia.org/wikipedia/de/thumb/c/c4/Red_Bull_Racing_logo.svg/200px-Red_Bull_Racing_logo.svg.png)';
  box.style.backgroundSize = 'contain';
  box.style.backgroundPosition = 'center';
  box.style.backgroundRepeat = 'no-repeat';
  box.style.backgroundColor = MARKER_STYLES.redBullMarker.backgroundColor;
  box.style.borderRadius = MARKER_STYLES.redBullMarker.borderRadius;
  box.style.border = MARKER_STYLES.redBullMarker.border;
  box.style.boxShadow = '0 2px 10px rgba(0,0,0,0.3)';
  box.style.transition = 'all 0.3s ease';

  // 아래 삼각형 (외부 테두리)
  const triangleOuter = document.createElement('div');
  triangleOuter.style.position = 'absolute';
  triangleOuter.style.bottom = mobile ? '-9px' : '-12px';
  triangleOuter.style.left = '50%';
  triangleOuter.style.transform = 'translateX(-50%)';
  triangleOuter.style.width = '0';
  triangleOuter.style.height = '0';
  triangleOuter.style.borderLeft = `${mobile ? '9px' : '12px'} solid transparent`;
  triangleOuter.style.borderRight = `${mobile ? '9px' : '12px'} solid transparent`;
  triangleOuter.style.borderTop = `${mobile ? '9px' : '12px'} solid #1e3a8a`;

  // 아래 삼각형 (내부 흰색)
  const triangleInner = document.createElement('div');
  triangleInner.style.position = 'absolute';
  triangleInner.style.bottom = mobile ? '-7px' : '-9px';
  triangleInner.style.left = '50%';
  triangleInner.style.transform = 'translateX(-50%)';
  triangleInner.style.width = '0';
  triangleInner.style.height = '0';
  triangleInner.style.borderLeft = `${mobile ? '7px' : '9px'} solid transparent`;
  triangleInner.style.borderRight = `${mobile ? '7px' : '9px'} solid transparent`;
  triangleInner.style.borderTop = `${mobile ? '7px' : '9px'} solid white`;

  el.appendChild(box);
  el.appendChild(triangleOuter);
  el.appendChild(triangleInner);

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
        id: 'red-bull',
        name: team.fullName,
        principal: team.teamPrincipal,
        location: team.headquarters,
        color: team.colors.primary,
        drivers: ['Max Verstappen', 'Sergio Pérez']
      });
    }

    map.flyTo({
      center: redBullHQ.coordinates as [number, number],
      zoom: 18,
      pitch: 45,
      bearing: 0,
      speed: 0.4,
      curve: 0.8,
      duration: 6000,
      essential: true
    });
  });

  // 팝업 생성
  const popup = new mapboxgl.Popup({ offset: 25 })
    .setHTML(`
      <div style="padding: 10px;">
        <h3 style="margin: 0 0 5px 0; color: #1e3a8a;">${redBullHQ.name}</h3>
        <p style="margin: 0 0 5px 0; font-size: 14px;">${redBullHQ.description}</p>
        <p style="margin: 0; font-size: 12px; color: #666;">${redBullHQ.address}</p>
      </div>
    `);

  // 마커 추가
  return new mapboxgl.Marker(el, { offset: [0, -25] })
    .setLngLat(redBullHQ.coordinates as [number, number])
    .setPopup(popup)
    .addTo(map);
};