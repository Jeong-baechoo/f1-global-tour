import mapboxgl from 'mapbox-gl';
import { Team, MarkerData } from '../../types';
import { TeamMarkerConfig, getTeamMarkerConfig } from './teamMarkerConfig';
import { isMobile } from '../../utils/viewport';
import { MOBILE_TEAM_CONFIGS } from '../../../../configs/mobile-team-configs';

interface TeamMarkerWithAnchorProps {
  map: mapboxgl.Map;
  team: Team;
  onMarkerClick?: (item: MarkerData) => void;
  displayPosition: { lat: number; lng: number };  // 분산된 위치 (마커가 표시될 위치)
  onMarkerCreated?: (marker: mapboxgl.Marker) => void;
}

interface TeamMarkerStyle {
  width: string;
  height: string;
  boxWidth: string;
  boxHeight: string;
  borderRadius: string;
  mobileWidth: string;
  mobileHeight: string;
  mobileBoxWidth: string;
  mobileBoxHeight: string;
}

const DEFAULT_TEAM_MARKER_STYLE: TeamMarkerStyle = {
  width: '80px',
  height: '95px',
  boxWidth: '80px',
  boxHeight: '80px',
  borderRadius: '4px',
  mobileWidth: '60px',
  mobileHeight: '71px',
  mobileBoxWidth: '60px',
  mobileBoxHeight: '60px'
};

export const createTeamMarkerWithAnchor = ({ 
  map, 
  team, 
  onMarkerClick,
  displayPosition,  // 이건 리더 라인이 가리킬 위치
  onMarkerCreated
}: TeamMarkerWithAnchorProps): { marker: mapboxgl.Marker } => {
  let currentDisplayPosition = displayPosition;
  const config = getTeamMarkerConfig(team.id);
  if (!config) {
    console.warn(`No marker config found for team: ${team.id}`);
    return { marker: new mapboxgl.Marker() };
  }

  const mobile = isMobile();
  
  // 컨테이너 요소 (고정 크기)
  const container = document.createElement('div');
  container.className = 'team-marker';
  container.style.position = 'absolute';
  container.style.width = '14px';
  container.style.height = '14px';
  container.style.transform = 'translate(-50%, -50%)';
  container.style.transformOrigin = 'center center';
  container.style.zIndex = '10';
  
  // 실제 위치를 나타내는 점 (리더 라인 끝점) - 숨김 처리
  const actualLocationDot = document.createElement('div');
  actualLocationDot.style.position = 'absolute';
  actualLocationDot.style.width = '6px';
  actualLocationDot.style.height = '6px';
  actualLocationDot.style.borderRadius = '50%';
  actualLocationDot.style.backgroundColor = config.style.borderColor;
  actualLocationDot.style.opacity = '0';  // 완전히 숨김
  actualLocationDot.style.display = 'none';  // display도 none으로
  actualLocationDot.style.zIndex = '5';
  
  // 팀 마커 + 리더라인 컨테이너
  const markerContainer = document.createElement('div');
  markerContainer.style.position = 'absolute';
  markerContainer.style.pointerEvents = 'none';
  markerContainer.style.width = '1px';
  markerContainer.style.height = '1px';
  
  // SVG 리더 라인
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.style.position = 'absolute';
  svg.style.pointerEvents = 'none';
  svg.style.overflow = 'visible';
  svg.style.left = '-1000px';
  svg.style.top = '-1000px';
  svg.style.width = '2000px';
  svg.style.height = '2000px';
  
  const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  line.setAttribute('stroke', config.style.borderColor);
  line.setAttribute('stroke-width', '2');
  line.setAttribute('stroke-dasharray', '4,4');
  line.setAttribute('opacity', '0.4');
  svg.appendChild(line);
  
  
  // 팀 마커 요소
  const teamElement = createTeamElement(config, mobile);
  
  // 줌 레벨 및 위치에 따른 표시/숨김
  const updateVisibility = () => {
    const zoom = map.getZoom();
    // 영국 팀은 항상 리더 라인 표시
    // 영국 팀은 항상 리더 라인 표시
    
    // 실제 위치와 표시 위치 계산
    const actualPoint = map.project([team.headquarters.lng, team.headquarters.lat]);
    const displayPoint = map.project([currentDisplayPosition.lng, currentDisplayPosition.lat]);
    
    // 리더 라인의 방향: 표시 위치(0,0)에서 실제 위치로
    const dx = actualPoint.x - displayPoint.x;
    const dy = actualPoint.y - displayPoint.y;
    
    // 팀 마커는 컨테이너 중심에 위치
    markerContainer.style.left = '0px';
    markerContainer.style.top = '0px';
    
    // 팀 요소를 중앙에 배치
    
    teamElement.style.transform = `translate(-50%, -50%)`;
    
    // 리더 라인 업데이트 - 표시 위치(0,0)에서 실제 위치로
    line.setAttribute('x1', '1000');  // 표시 위치 (마커 중심)
    line.setAttribute('y1', '1000');
    line.setAttribute('x2', `${1000 + dx}`);  // 실제 팀 위치
    line.setAttribute('y2', `${1000 + dy}`);
    
    line.style.opacity = '0.4';
    markerContainer.style.display = 'block';
    svg.style.display = 'block';
    
    // 줌 5 이하에서 점으로 변경
    updateTeamDisplay(teamElement, config, zoom);
  };
  
  // 컨테이너에 요소들 추가
  markerContainer.appendChild(svg);
  markerContainer.appendChild(teamElement);
  container.appendChild(markerContainer);
  
  // 실제 위치 점 업데이트 함수
  const updateActualLocationDot = () => {
    const actualPoint = map.project([team.headquarters.lng, team.headquarters.lat]);
    const displayPoint = map.project([currentDisplayPosition.lng, currentDisplayPosition.lat]);
    const dx = actualPoint.x - displayPoint.x;
    const dy = actualPoint.y - displayPoint.y;
    
    actualLocationDot.style.left = `${dx + 7}px`;  // 7px = 컨테이너 중심 오프셋
    actualLocationDot.style.top = `${dy + 7}px`;
    actualLocationDot.style.transform = 'translate(-50%, -50%)';
  };
  
  container.appendChild(actualLocationDot);
  updateActualLocationDot();
  
  // 맵 이동 시 실제 위치 점 업데이트
  map.on('move', updateActualLocationDot);
  map.on('zoom', updateActualLocationDot);
  
  // 마커 생성 - 분산된 위치에 배치
  const marker = new mapboxgl.Marker(container, {
    anchor: 'top-left',
    offset: [0, 0]
  })
    .setLngLat([currentDisplayPosition.lng, currentDisplayPosition.lat])
    .addTo(map);
  
  // 마커 위치 업데이트 함수 (외부에서 호출 가능)
  const markerWithUpdate = marker as mapboxgl.Marker & { updatePosition?: (pos: { lat: number; lng: number }) => void };
  markerWithUpdate.updatePosition = (newPosition: { lat: number; lng: number }) => {
    currentDisplayPosition = newPosition;
    marker.setLngLat([newPosition.lng, newPosition.lat]);
    updateVisibility();  // 리더 라인도 업데이트
  };
  
  // 클릭 이벤트
  if (onMarkerClick) {
    const handleClick = () => {
      const markerData: MarkerData = {
        type: 'team',
        id: team.id,
        name: team.fullName,
        principal: team.teamPrincipal,
        location: team.headquarters,
        color: team.colors.primary,
        drivers: config.drivers2025?.map(d => d.name) || [],
        drivers2025: config.drivers2025,
        car2025: config.car2025
      };
      
      onMarkerClick(markerData);
      
      // FlyTo 실행
      const flyToConfig = config.flyTo;
      const mobile = isMobile();
      const mobileConfig = mobile && MOBILE_TEAM_CONFIGS[config.teamId] ? 
        MOBILE_TEAM_CONFIGS[config.teamId] : null;
      
      map.flyTo({
        center: mobileConfig ? mobileConfig.center : 
          (flyToConfig.center || [team.headquarters.lng, team.headquarters.lat]),
        zoom: mobileConfig ? mobileConfig.zoom : (flyToConfig.zoom || 15.68),
        pitch: mobileConfig ? mobileConfig.pitch : (flyToConfig.pitch || 45),
        bearing: mobileConfig ? mobileConfig.bearing : (flyToConfig.bearing || 0),
        speed: flyToConfig.speed || 0.4,
        curve: flyToConfig.curve || 0.8,
        duration: flyToConfig.duration || 6000,
        essential: true
      });
    };
    
    teamElement.addEventListener('click', handleClick);
  }
  
  // 초기 가시성 설정
  updateVisibility();
  
  // 맵 이벤트 리스너
  map.on('zoom', updateVisibility);
  map.on('move', updateVisibility);
  map.on('rotate', updateVisibility);
  map.on('pitch', updateVisibility);
  
  if (onMarkerCreated) {
    onMarkerCreated(marker);
  }
  
  return { marker };
};

// 팀 요소 생성 함수
function createTeamElement(config: TeamMarkerConfig, mobile: boolean): HTMLDivElement {
  const markerStyle = DEFAULT_TEAM_MARKER_STYLE;
  
  const el = document.createElement('div');
  el.className = `marker ${config.style.className}`;
  
  Object.assign(el.style, {
    position: 'absolute',
    width: mobile ? markerStyle.mobileWidth : markerStyle.width,
    height: mobile ? markerStyle.mobileHeight : markerStyle.height,
    cursor: 'pointer',
    pointerEvents: 'auto'
  });

  const box = document.createElement('div');
  
  Object.assign(box.style, {
    width: mobile ? markerStyle.mobileBoxWidth : markerStyle.boxWidth,
    height: mobile ? markerStyle.mobileBoxHeight : markerStyle.boxHeight,
    backgroundImage: `url(${config.style.logoUrl})`,
    backgroundSize: config.style.backgroundSize || 'contain',
    backgroundPosition: config.style.backgroundPosition || 'center',
    backgroundRepeat: 'no-repeat',
    backgroundColor: config.style.backgroundColor,
    borderRadius: markerStyle.borderRadius,
    border: `2px solid ${config.style.borderColor}`,
    boxShadow: `0 2px 10px ${config.style.shadowColor}`,
    transition: 'all 0.3s ease'
  });

  el.appendChild(box);

  // 호버 효과
  el.addEventListener('mouseenter', () => {
    box.style.transform = 'scale(1.1) translateZ(0)';
    box.style.boxShadow = `0 4px 20px ${config.style.shadowColorHover}`;
  });

  el.addEventListener('mouseleave', () => {
    box.style.transform = 'scale(1) translateZ(0)';
    box.style.boxShadow = `0 2px 10px ${config.style.shadowColor}`;
  });

  return el;
}

// 줌 레벨에 따른 팀 표시 업데이트
function updateTeamDisplay(
  teamElement: HTMLDivElement, 
  config: TeamMarkerConfig, 
  zoom: number
): void {
  const box = teamElement.firstElementChild as HTMLDivElement;
  if (!box) return;
  
  if (zoom <= 5) {
    // 점으로 표시
    box.style.width = '12px';
    box.style.height = '12px';
    box.style.borderRadius = '50%';
    box.style.backgroundImage = 'none';
    teamElement.style.width = '12px';
    teamElement.style.height = '12px';
  } else {
    // 로고 표시
    const mobile = isMobile();
    const markerStyle = DEFAULT_TEAM_MARKER_STYLE;
    
    box.style.width = mobile ? markerStyle.mobileBoxWidth : markerStyle.boxWidth;
    box.style.height = mobile ? markerStyle.mobileBoxHeight : markerStyle.boxHeight;
    box.style.borderRadius = markerStyle.borderRadius;
    box.style.backgroundImage = `url(${config.style.logoUrl})`;
    
    teamElement.style.width = mobile ? markerStyle.mobileWidth : markerStyle.width;
    teamElement.style.height = mobile ? markerStyle.mobileHeight : markerStyle.height;
  }
}