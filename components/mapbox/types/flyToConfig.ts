// FlyTo 설정 관련 타입 정의
export interface FlyToConfig {
  center?: [number, number];
  zoom: number;
  pitch: number;
  bearing: number;
  speed?: number;
  curve?: number;
  duration?: number;
}

// 모바일/데스크톱 설정을 포함하는 확장된 FlyTo 설정
export interface ResponsiveFlyToConfig {
  desktop: FlyToConfig;
  mobile?: Partial<FlyToConfig>;
}

// 팀별 FlyTo 설정 타입
export interface TeamFlyToConfigs {
  [teamId: string]: ResponsiveFlyToConfig;
}