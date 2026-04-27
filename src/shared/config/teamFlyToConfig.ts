import { TeamFlyToConfigs } from '../types/flyToConfig';

// 기본 FlyTo 설정
export const DEFAULT_TEAM_FLYTO = {
  zoom: 15.68,
  pitch: 45,
  bearing: 0,
  speed: 0.25,  // 느린 속도로 통일
  curve: 0.8,
  duration: 8000  // 8초로 통일
} as const;

// 팀별 모바일/데스크톱 FlyTo 설정 (특별한 설정이 필요한 팀만)
export const TEAM_FLYTO_CONFIGS: TeamFlyToConfigs = {
  'red-bull': {
    desktop: {
      center: [-0.689, 52.0092],
      ...DEFAULT_TEAM_FLYTO
    },
    mobile: {
      center: [-0.6913, 52.0086],
      zoom: 15.41,
      pitch: 45,
      bearing: 0
    }
  },
  'mclaren': {
    desktop: {
      center: [-0.5459, 51.3446],
      zoom: 15.68,
      pitch: 49.5,
      bearing: 48.8,
      speed: DEFAULT_TEAM_FLYTO.speed,
      curve: DEFAULT_TEAM_FLYTO.curve,
      duration: DEFAULT_TEAM_FLYTO.duration
    },
    mobile: {
      center: [-0.5444, 51.3457],
      zoom: 14.68,
      pitch: 49.5,
      bearing: 48.4
    }
  },
  'aston-martin': {
    desktop: {
      center: [-1.0288, 52.0762],
      zoom: 15.68,
      pitch: 49,
      bearing: 136,
      speed: DEFAULT_TEAM_FLYTO.speed,
      curve: DEFAULT_TEAM_FLYTO.curve,
      duration: DEFAULT_TEAM_FLYTO.duration
    }
  },
  'ferrari': {
    desktop: {
      ...DEFAULT_TEAM_FLYTO
    }
  },
  'mercedes': {
    desktop: {
      ...DEFAULT_TEAM_FLYTO
    }
  },
  'alpine': {
    desktop: {
      ...DEFAULT_TEAM_FLYTO
    }
  },
  'williams': {
    desktop: {
      ...DEFAULT_TEAM_FLYTO
    }
  },
  'racing-bulls': {
    desktop: {
      ...DEFAULT_TEAM_FLYTO
    }
  },
  'audi': {
    desktop: {
      ...DEFAULT_TEAM_FLYTO
    }
  },
  'haas': {
    desktop: {
      ...DEFAULT_TEAM_FLYTO
    }
  }
};