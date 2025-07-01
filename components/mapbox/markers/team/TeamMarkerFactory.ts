import mapboxgl from 'mapbox-gl';
import { MarkerData } from '../../types';
import { Team } from '@/types/f1';
import { TeamMarkerConfig, getTeamMarkerConfig } from './teamMarkerConfig';
import { isMobile } from '../../utils/viewport';
import { MOBILE_TEAM_CONFIGS } from '../../../../configs/mobile-team-configs';
import { getText, type Language } from '@/utils/i18n';

interface TeamMarkerFactoryProps {
  map: mapboxgl.Map;
  team: Team;
  language?: Language;
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

// 마커와 cleanup 함수를 포함하는 인터페이스
export interface TeamMarkerWithCleanup {
  marker: mapboxgl.Marker;
  cleanup: () => void;
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
   * @returns 마커와 cleanup 함수를 포함한 객체
   */
  static create({ map, team, language = 'en', onMarkerClick }: TeamMarkerFactoryProps): TeamMarkerWithCleanup | null {
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
    
    // Mapbox 마커 생성
    const marker = new mapboxgl.Marker(el, { 
      anchor: 'center'  // 중앙 정렬로 변경
    })
      .setLngLat(teamHQ.coordinates)
      .addTo(map);
    
    // 클릭 이벤트 설정 (marker를 전달)
    TeamMarkerFactory.setupClickHandler(el, team, config, map, teamHQ, marker, language, onMarkerClick);
    
    // 줌 레벨에 따른 표시 변경 및 cleanup 함수 반환
    const zoomCleanup = TeamMarkerFactory.setupZoomHandler(map, el, config);
    
    // cleanup 함수 정의
    const cleanup = () => {
      zoomCleanup();
      marker.remove();
    };
    
    return { marker, cleanup };
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
      cursor: 'pointer'
      // transform 제거 - anchor: 'center' 사용으로 불필요
    });

    // 메인 박스
    const box = document.createElement('div');
    
    // 박스 스타일 적용 - 공통 메서드 사용
    TeamMarkerFactory.applyMarkerStyle(el, box, config, mobile);
    
    // 추가 스타일
    Object.assign(box.style, {
      backgroundSize: config.style.backgroundSize || 'contain',
      backgroundPosition: config.style.backgroundPosition || 'center',
      backgroundRepeat: 'no-repeat',
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
   * 줌 레벨에 따른 표시 변경
   * @returns cleanup 함수
   */
  /**
   * 마커 스타일을 적용하는 헬퍼 메서드
   */
  private static applyMarkerStyle(
    el: HTMLDivElement,
    box: HTMLDivElement,
    config: TeamMarkerConfig,
    mobile: boolean
  ): void {
    const markerStyle = DEFAULT_TEAM_MARKER_STYLE;
    
    // 컨테이너 스타일
    el.style.width = mobile ? markerStyle.mobileWidth : markerStyle.width;
    el.style.height = mobile ? markerStyle.mobileHeight : markerStyle.height;
    
    // 박스 스타일
    box.style.width = mobile ? markerStyle.mobileBoxWidth : markerStyle.boxWidth;
    box.style.height = mobile ? markerStyle.mobileBoxHeight : markerStyle.boxHeight;
    box.style.borderRadius = markerStyle.borderRadius;
    box.style.backgroundImage = `url(${config.style.logoUrl})`;
    box.style.backgroundColor = config.style.backgroundColor;
    box.style.border = `2px solid ${config.style.borderColor}`;
  }

  private static setupZoomHandler(map: mapboxgl.Map, el: HTMLDivElement, config: TeamMarkerConfig): () => void {
    const box = el.firstElementChild as HTMLDivElement;
    if (!box) return () => {};
    
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
        // 줌 5 초과: 원래 로고 표시 - 헬퍼 메서드 사용
        TeamMarkerFactory.applyMarkerStyle(el, box, config, isMobile());
      }
    };
    
    // 초기 설정
    updateDisplay();
    
    // 줌 이벤트 리스너 등록
    map.on('zoom', updateDisplay);
    
    // cleanup 함수 반환
    return () => {
      map.off('zoom', updateDisplay);
    };
  }
  
  /**
   * GPU 가속 설정
   */
  private static setupGPUAcceleration(el: HTMLDivElement, box: HTMLDivElement): void {
    // willChange 제거 - 드래그 시 마커 움직임 문제 해결
    // el.style.willChange = 'transform';
    box.style.willChange = 'box-shadow';
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
    marker: mapboxgl.Marker,
    language: Language,
    onMarkerClick?: (item: MarkerData) => void
  ): void {
    el.addEventListener('click', () => {
      // 마커 클릭 콜백 실행
      if (onMarkerClick) {
        const markerData: MarkerData = {
          type: 'team',
          id: team.id,
          name: team.fullName,
          principal: getText(team.teamPrincipal, language),
          location: {
            city: getText(team.headquarters.city, language),
            country: getText(team.headquarters.country, language)
          },
          headquarters: {
            city: getText(team.headquarters.city, language),
            country: getText(team.headquarters.country, language),
            lat: team.headquarters.lat,
            lng: team.headquarters.lng
          },
          color: team.colors.primary,
          drivers: config.drivers2025?.map(d => d.name) || [],
          drivers2025: config.drivers2025,
          car2025: config.car2025,
          championships2025: team.championships2025
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
    
    // 팀별 모바일 전용 설정은 별도 config 파일에서 관리
    
    const mobileConfig = mobile && MOBILE_TEAM_CONFIGS[config.teamId] ? MOBILE_TEAM_CONFIGS[config.teamId] : null;
    
    map.flyTo({
      center: mobileConfig ? mobileConfig.center : (flyToConfig.center || teamHQ.coordinates),
      zoom: mobileConfig ? mobileConfig.zoom : (flyToConfig.zoom || 15.68),
      pitch: mobileConfig ? mobileConfig.pitch : (flyToConfig.pitch || 45),
      bearing: mobileConfig ? mobileConfig.bearing : (flyToConfig.bearing || 0),
      speed: flyToConfig.speed || 0.25,  // 0.4에서 0.25로 감소 (더 느리게)
      curve: flyToConfig.curve || 0.8,
      duration: flyToConfig.duration || 8000,  // 6초에서 8초로 증가
      essential: true
    });
  }

  /**
   * 여러 팀 마커를 한번에 생성
   * 
   * @example
   * ```typescript
   * const markerCleanups = TeamMarkerFactory.createMultiple(map, teams, onMarkerClick);
   * ```
   */
  static createMultiple(
    map: mapboxgl.Map,
    teams: Team[],
    onMarkerClick?: (item: MarkerData) => void
  ): TeamMarkerWithCleanup[] {
    const markerCleanups: TeamMarkerWithCleanup[] = [];
    
    teams.forEach(team => {
      const markerWithCleanup = TeamMarkerFactory.create({ map, team, onMarkerClick });
      if (markerWithCleanup) {
        markerCleanups.push(markerWithCleanup);
      }
    });

    return markerCleanups;
  }

  /**
   * 모든 마커 제거 및 cleanup 실행
   */
  static removeAll(markerCleanups: TeamMarkerWithCleanup[]): void {
    markerCleanups.forEach(({ cleanup }) => cleanup());
    markerCleanups.length = 0;
  }
}