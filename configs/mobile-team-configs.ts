export interface MobileTeamConfig {
  center: [number, number];
  zoom: number;
  pitch: number;
  bearing: number;
}

// Team['id'] 타입을 사용하여 타입 안정성 강화
export const MOBILE_TEAM_CONFIGS: Partial<Record<string, MobileTeamConfig>> = {
  'red-bull': {
    center: [-0.6913, 52.0086],
    zoom: 15.41,
    pitch: 45,
    bearing: 0
  },
  'mclaren': {
    center: [-0.5444, 51.3457],
    zoom: 14.68,
    pitch: 49.5,
    bearing: 48.4
  }
} as const;