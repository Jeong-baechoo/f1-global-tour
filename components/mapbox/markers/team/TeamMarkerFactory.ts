import mapboxgl from 'mapbox-gl';
import { Team, MarkerData } from '../../types';
import { TeamMarkerConfig, getTeamMarkerConfig } from './teamMarkerConfig';
import { isMobile } from '../../utils/viewport';

interface TeamMarkerFactoryProps {
  map: mapboxgl.Map;
  team: Team;
  onMarkerClick?: (item: MarkerData) => void;
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

// 기본 팀 마커 스타일 상수
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

/**
 * 통합된 팀 마커 생성 팩토리
 * 모든 팀 마커를 일관된 방식으로 생성하고 관리
 */
export class TeamMarkerFactory {
  /**
   * 팀 마커 생성
   */
  static create({ map, team, onMarkerClick }: TeamMarkerFactoryProps): mapboxgl.Marker | null {
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

    // 마커 엘리먼트 생성
    const el = TeamMarkerFactory.createMarkerElement(config, mobile);
    
    // 클릭 이벤트 설정
    TeamMarkerFactory.setupClickHandler(el, team, config, map, teamHQ, onMarkerClick);

    // Mapbox 마커 생성 및 반환
    return new mapboxgl.Marker(el, { 
      anchor: 'top-left',
      offset: [0, 0]
    })
      .setLngLat(teamHQ.coordinates)
      .addTo(map);
  }

  /**
   * 마커 DOM 엘리먼트 생성
   */
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
      transformOrigin: 'center center'
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
    TeamMarkerFactory.setupGPUAcceleration(el, box);
    
    // 호버 효과 설정
    TeamMarkerFactory.setupHoverEffects(el, box, config);

    return el;
  }

  /**
   * GPU 가속 설정
   */
  private static setupGPUAcceleration(el: HTMLDivElement, box: HTMLDivElement): void {
    el.style.willChange = 'transform';
    box.style.willChange = 'transform, box-shadow';
  }

  /**
   * 호버 효과 설정
   */
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

  /**
   * 클릭 이벤트 설정
   */
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
      TeamMarkerFactory.executeMapFlyTo(map, config, teamHQ);
    });
  }

  /**
   * 지도 FlyTo 애니메이션 실행
   */
  private static executeMapFlyTo(
    map: mapboxgl.Map,
    config: TeamMarkerConfig,
    teamHQ: { coordinates: [number, number] }
  ): void {
    const flyToConfig = config.flyTo;
    const mobile = isMobile();
    
    // 팀별 모바일 전용 설정
    const mobileConfigs: Record<string, any> = {
      'red-bull': {
        center: [-0.6913, 52.0086] as [number, number],
        zoom: 15.41,
        pitch: 45,
        bearing: 0
      },
      'mclaren': {
        center: [-0.5444, 51.3457] as [number, number],
        zoom: 14.68,
        pitch: 49.5,
        bearing: 48.4
      }
    };
    
    const mobileConfig = mobile && mobileConfigs[config.teamId] ? mobileConfigs[config.teamId] : null;
    
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

  /**
   * 여러 팀 마커를 한번에 생성
   * 
   * @example
   * ```typescript
   * const markers = TeamMarkerFactory.createMultiple(map, teams, onMarkerClick);
   * ```
   */
  static createMultiple(
    map: mapboxgl.Map,
    teams: Team[],
    onMarkerClick?: (item: MarkerData) => void
  ): mapboxgl.Marker[] {
    const markers: mapboxgl.Marker[] = [];
    
    teams.forEach(team => {
      const marker = TeamMarkerFactory.create({ map, team, onMarkerClick });
      if (marker) {
        markers.push(marker);
      }
    });

    return markers;
  }

  /**
   * 모든 마커 제거
   */
  static removeAll(markers: mapboxgl.Marker[]): void {
    markers.forEach(marker => marker.remove());
    markers.length = 0;
  }
}