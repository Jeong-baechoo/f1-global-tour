import { TeamFlyToConfigs } from '../types/flyToConfig';

// 팀별 모바일/데스크톱 FlyTo 설정
export const TEAM_FLYTO_CONFIGS: TeamFlyToConfigs = {
  'red-bull': {
    desktop: {
      center: [-0.689, 52.0092],
      zoom: 15.68,
      pitch: 45,
      bearing: 0,
      speed: 0.4,
      curve: 0.8,
      duration: 6000
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
      speed: 0.4,
      curve: 0.8,
      duration: 6000
    },
    mobile: {
      center: [-0.5444, 51.3457],
      zoom: 14.68,
      pitch: 49.5,
      bearing: 48.4
    }
  }
};

// 기본 FlyTo 설정
export const DEFAULT_TEAM_FLYTO = {
  zoom: 15.68,
  pitch: 45,
  bearing: 0,
  speed: 0.4,
  curve: 0.8,
  duration: 6000
} as const;