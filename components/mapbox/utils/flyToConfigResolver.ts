import { isMobile } from './viewport';
import { ResponsiveFlyToConfig } from '../types/flyToConfig';
import { TEAM_FLYTO_CONFIGS, DEFAULT_TEAM_FLYTO } from '../config/teamFlyToConfig';
import { CIRCUIT_CAMERA_CONFIGS, DEFAULT_CIRCUIT_CAMERA } from '../config/circuitCameraConfig';
import { TeamFlyToConfig } from '../markers/team/teamMarkerConfig';
import { CameraConfig } from './map/camera';

// MapboxGL FlyTo options type definition
type FlyToOptions = {
  center: [number, number];
  zoom: number;
  pitch: number;
  bearing: number;
  speed: number;
  curve: number;
  duration?: number;
  essential?: boolean;
};

/**
 * 팀별 FlyTo 설정을 해결하는 유틸리티
 */
export class FlyToConfigResolver {
  /**
   * 팀 ID와 현재 환경(모바일/데스크톱)에 따라 최적의 FlyTo 설정을 반환
   */
  static resolveTeamFlyToConfig(
    teamId: string, 
    originalConfig: TeamFlyToConfig,
    teamHQ: { coordinates: [number, number] }
  ): FlyToOptions {
    const mobile = isMobile();
    const responsiveConfig = TEAM_FLYTO_CONFIGS[teamId];
    
    // 1. 커스텀 반응형 설정이 있는 경우
    if (responsiveConfig) {
      const config = mobile && responsiveConfig.mobile 
        ? { ...responsiveConfig.desktop, ...responsiveConfig.mobile }
        : responsiveConfig.desktop;
        
      return {
        center: config.center || teamHQ.coordinates,
        zoom: config.zoom,
        pitch: config.pitch,
        bearing: config.bearing,
        speed: config.speed || DEFAULT_TEAM_FLYTO.speed,
        curve: config.curve || DEFAULT_TEAM_FLYTO.curve,
        duration: config.duration || DEFAULT_TEAM_FLYTO.duration,
        essential: true
      };
    }
    
    // 2. 기존 설정 사용 (fallback)
    return {
      center: originalConfig.center || teamHQ.coordinates,
      zoom: originalConfig.zoom || DEFAULT_TEAM_FLYTO.zoom,
      pitch: originalConfig.pitch || DEFAULT_TEAM_FLYTO.pitch,
      bearing: originalConfig.bearing || DEFAULT_TEAM_FLYTO.bearing,
      speed: originalConfig.speed || DEFAULT_TEAM_FLYTO.speed,
      curve: originalConfig.curve || DEFAULT_TEAM_FLYTO.curve,
      duration: originalConfig.duration || DEFAULT_TEAM_FLYTO.duration,
      essential: true
    };
  }
  
  /**
   * 특정 팀에 모바일 설정이 있는지 확인
   */
  static hasMobileConfig(teamId: string): boolean {
    return !!TEAM_FLYTO_CONFIGS[teamId]?.mobile;
  }
  
  /**
   * 서킷별 카메라 설정을 해결하는 메서드
   */
  static resolveCircuitCameraConfig(circuitId: string): CameraConfig {
    const mobile = isMobile();
    const responsiveConfig = CIRCUIT_CAMERA_CONFIGS[circuitId];
    
    if (responsiveConfig) {
      const config = mobile && responsiveConfig.mobile 
        ? { ...responsiveConfig.desktop, ...responsiveConfig.mobile }
        : responsiveConfig.desktop;
        
      return {
        center: [0, 0], // Will be set by caller
        zoom: config.zoom,
        pitch: config.pitch,
        bearing: config.bearing,
        speed: config.speed || DEFAULT_CIRCUIT_CAMERA.speed,
        curve: config.curve || DEFAULT_CIRCUIT_CAMERA.curve,
        duration: config.duration,
        essential: true
      };
    }
    
    // 기본 설정 반환
    return {
      center: [0, 0],
      zoom: mobile ? DEFAULT_CIRCUIT_CAMERA.zoom - 0.5 : DEFAULT_CIRCUIT_CAMERA.zoom,
      pitch: DEFAULT_CIRCUIT_CAMERA.pitch,
      bearing: DEFAULT_CIRCUIT_CAMERA.bearing,
      speed: DEFAULT_CIRCUIT_CAMERA.speed,
      curve: DEFAULT_CIRCUIT_CAMERA.curve,
      essential: true
    };
  }
  
  /**
   * 새로운 팀 설정을 런타임에 추가 (확장성)
   */
  static addTeamConfig(teamId: string, config: ResponsiveFlyToConfig): void {
    TEAM_FLYTO_CONFIGS[teamId] = config;
  }
  
  /**
   * 새로운 서킷 설정을 런타임에 추가 (확장성)
   */
  static addCircuitConfig(circuitId: string, config: ResponsiveFlyToConfig): void {
    CIRCUIT_CAMERA_CONFIGS[circuitId] = config;
  }
}