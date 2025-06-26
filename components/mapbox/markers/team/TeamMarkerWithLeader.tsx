import mapboxgl from 'mapbox-gl';
import { Team, MarkerData } from '../../types';
import { TeamMarkerConfig, getTeamMarkerConfig } from './teamMarkerConfig';
import { isMobile } from '../../utils/viewport';
import { MOBILE_TEAM_CONFIGS } from '../../../../configs/mobile-team-configs';

interface TeamMarkerWithLeaderProps {
  map: mapboxgl.Map;
  team: Team;
  onMarkerClick?: (item: MarkerData) => void;
  showLeaderLine?: boolean;
  leaderLineTarget?: { lat: number; lng: number };
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

export class TeamMarkerWithLeader {
  static create({ 
    map, 
    team, 
    onMarkerClick,
    showLeaderLine = false,
    leaderLineTarget
  }: TeamMarkerWithLeaderProps): mapboxgl.Marker | null {
    const config = getTeamMarkerConfig(team.id);
    if (!config) {
      console.warn(`No marker config found for team: ${team.id}`);
      return null;
    }

    const mobile = isMobile();
    
    // 팀 본부 정보 구성
    const teamHQ = {
      name: team.fullName,
      coordinates: [team.headquarters.lng, team.headquarters.lat] as [number, number],
      description: team.description,
      address: `${team.headquarters.city}, ${team.headquarters.country}`
    };

    // 컨테이너 생성
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.pointerEvents = 'none';
    
    // 리더 라인 (필요한 경우)
    if (showLeaderLine && leaderLineTarget) {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.style.position = 'absolute';
      svg.style.width = '500px';
      svg.style.height = '500px';
      svg.style.left = '-250px';
      svg.style.top = '-250px';
      svg.style.pointerEvents = 'none';
      svg.style.overflow = 'visible';
      svg.style.zIndex = '1';
      
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('stroke', config.style.borderColor);
      line.setAttribute('stroke-width', '2');
      line.setAttribute('stroke-dasharray', '4,4');
      line.setAttribute('opacity', '0.5');
      
      // 리더 라인 업데이트 함수
      const updateLeaderLine = () => {
        const sourcePoint = map.project(teamHQ.coordinates);
        const targetPoint = map.project([leaderLineTarget.lng, leaderLineTarget.lat]);
        
        const dx = targetPoint.x - sourcePoint.x;
        const dy = targetPoint.y - sourcePoint.y;
        
        line.setAttribute('x1', '250');
        line.setAttribute('y1', '250');
        line.setAttribute('x2', `${250 - dx}`);
        line.setAttribute('y2', `${250 - dy}`);
      };
      
      svg.appendChild(line);
      container.appendChild(svg);
      
      // 맵 이동 시 리더 라인 업데이트
      map.on('move', updateLeaderLine);
      map.on('zoom', updateLeaderLine);
      
      // 초기 업데이트
      setTimeout(updateLeaderLine, 10);
    }
    
    // 마커 엘리먼트 생성
    const el = this.createMarkerElement(config, mobile);
    container.appendChild(el);
    
    // 클릭 이벤트 설정
    this.setupClickHandler(el, team, config, map, teamHQ, onMarkerClick);

    // Mapbox 마커 생성 및 반환
    const marker = new mapboxgl.Marker(container, { 
      anchor: 'center',
      offset: [0, 0]
    })
      .setLngLat(teamHQ.coordinates)
      .addTo(map);
    
    // 줌 레벨에 따른 표시 변경
    this.setupZoomHandler(map, el, config);
    
    return marker;
  }

  private static createMarkerElement(
    config: TeamMarkerConfig, 
    mobile: boolean
  ): HTMLDivElement {
    const markerStyle = DEFAULT_TEAM_MARKER_STYLE;
    
    // 메인 컨테이너
    const el = document.createElement('div');
    el.className = `marker ${config.style.className}`;
    
    // 컨테이너 스타일 적용
    Object.assign(el.style, {
      position: 'absolute',
      width: mobile ? markerStyle.mobileWidth : markerStyle.width,
      height: mobile ? markerStyle.mobileHeight : markerStyle.height,
      cursor: 'pointer',
      transform: 'translate(-50%, -50%)',
      transformOrigin: 'center center',
      pointerEvents: 'auto'
    });

    // 메인 박스
    const box = document.createElement('div');
    
    // 박스 스타일 적용
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

    // GPU 가속 설정
    el.style.willChange = 'transform';
    box.style.willChange = 'transform, box-shadow';
    
    // 호버 효과 설정
    this.setupHoverEffects(el, box, config);

    return el;
  }

  private static setupZoomHandler(map: mapboxgl.Map, el: HTMLDivElement, config: TeamMarkerConfig): void {
    const box = el.firstElementChild as HTMLDivElement;
    if (!box) return;
    
    const updateDisplay = () => {
      const zoom = map.getZoom();
      
      if (zoom <= 5) {
        // 줌 5 이하: 점으로 표시
        box.style.width = '12px';
        box.style.height = '12px';
        box.style.borderRadius = '50%';
        box.style.backgroundImage = 'none';
        box.style.backgroundColor = config.style.backgroundColor;
        box.style.border = `2px solid ${config.style.borderColor}`;
        
        // 컨테이너 크기도 조정
        el.style.width = '12px';
        el.style.height = '12px';
      } else {
        // 줌 5 초과: 원래 로고 표시
        const mobile = isMobile();
        const markerStyle = DEFAULT_TEAM_MARKER_STYLE;
        
        box.style.width = mobile ? markerStyle.mobileBoxWidth : markerStyle.boxWidth;
        box.style.height = mobile ? markerStyle.mobileBoxHeight : markerStyle.boxHeight;
        box.style.borderRadius = markerStyle.borderRadius;
        box.style.backgroundImage = `url(${config.style.logoUrl})`;
        box.style.backgroundColor = config.style.backgroundColor;
        box.style.border = `2px solid ${config.style.borderColor}`;
        
        // 컨테이너 크기 복원
        el.style.width = mobile ? markerStyle.mobileWidth : markerStyle.width;
        el.style.height = mobile ? markerStyle.mobileHeight : markerStyle.height;
      }
    };
    
    // 초기 설정
    updateDisplay();
    
    // 줌 이벤트 리스너
    map.on('zoom', updateDisplay);
  }

  private static setupHoverEffects(
    el: HTMLDivElement, 
    box: HTMLDivElement, 
    config: TeamMarkerConfig
  ): void {
    el.addEventListener('mouseenter', () => {
      box.style.transform = 'scale(1.1) translateZ(0)';
      box.style.boxShadow = `0 4px 20px ${config.style.shadowColorHover}`;
    });

    el.addEventListener('mouseleave', () => {
      box.style.transform = 'scale(1) translateZ(0)';
      box.style.boxShadow = `0 2px 10px ${config.style.shadowColor}`;
    });
  }

  private static setupClickHandler(
    el: HTMLDivElement,
    team: Team,
    config: TeamMarkerConfig,
    map: mapboxgl.Map,
    teamHQ: { coordinates: [number, number] },
    onMarkerClick?: (item: MarkerData) => void
  ): void {
    el.addEventListener('click', () => {
      // 마커 클릭 콜백 실행
      if (onMarkerClick) {
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
      }

      // 지도 이동 애니메이션
      this.executeMapFlyTo(map, config, teamHQ);
    });
  }

  private static executeMapFlyTo(
    map: mapboxgl.Map,
    config: TeamMarkerConfig,
    teamHQ: { coordinates: [number, number] }
  ): void {
    const flyToConfig = config.flyTo;
    const mobile = isMobile();
    
    const mobileConfig = mobile && MOBILE_TEAM_CONFIGS[config.teamId] ? MOBILE_TEAM_CONFIGS[config.teamId] : null;
    
    map.flyTo({
      center: mobileConfig ? mobileConfig.center : (flyToConfig.center || teamHQ.coordinates),
      zoom: mobileConfig ? mobileConfig.zoom : (flyToConfig.zoom || 15.68),
      pitch: mobileConfig ? mobileConfig.pitch : (flyToConfig.pitch || 45),
      bearing: mobileConfig ? mobileConfig.bearing : (flyToConfig.bearing || 0),
      speed: flyToConfig.speed || 0.4,
      curve: flyToConfig.curve || 0.8,
      duration: flyToConfig.duration || 6000,
      essential: true
    });
  }
}