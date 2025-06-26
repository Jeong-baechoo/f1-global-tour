import { ResponsiveFlyToConfig } from '../types/flyToConfig';

// 서킷별 카메라 설정
export const CIRCUIT_CAMERA_CONFIGS: Record<string, ResponsiveFlyToConfig> = {
  'austria': {
    desktop: { zoom: 15.45, pitch: 60, bearing: -20, speed: 1.2, curve: 1 },
    mobile: { zoom: 14, pitch: 60, bearing: -20 }
  },
  'nurburgring': {
    desktop: { zoom: 14.32, pitch: 36.5, bearing: -45.4, speed: 0.4, curve: 0.8, duration: 6000 },
    mobile: { zoom: 13.62, pitch: 36.5, bearing: -125.4 }
  },
  'monaco': {
    desktop: { zoom: 14.87, pitch: 51.2, bearing: -80.3, speed: 0.6, curve: 1.2 },
    mobile: { zoom: 13.9, pitch: 51.2, bearing: -85.3 }
  },
  'britain': {
    desktop: { zoom: 14.8, pitch: 51.5, bearing: 172.8, speed: 0.8, curve: 1 },
    mobile: { zoom: 13.77, pitch: 51.5, bearing: 172.8 }
  },
  'bahrain': {
    desktop: { zoom: 15, pitch: 57, bearing: 92, speed: 1.2, curve: 1 },
    mobile: { zoom: 14.1, pitch: 57, bearing: 92 }
  },
  'saudi-arabia': {
    desktop: { zoom: 15, pitch: 60, bearing: 0, speed: 1.2, curve: 1 }
  },
  'azerbaijan': {
    desktop: { zoom: 14.89, pitch: 60, bearing: 0, speed: 1.2, curve: 1 },
    mobile: { zoom: 13.69, pitch: 60, bearing: -90 }
  },
  'spain': {
    desktop: { zoom: 14.53, pitch: 40.5, bearing: -28.8, speed: 1.2, curve: 1 },
    mobile: { zoom: 13.76, pitch: 40.5, bearing: -28.8 }
  },
  'hungary': {
    desktop: { zoom: 15.27, pitch: 38.5, bearing: 52.3, speed: 1.2, curve: 1 },
    mobile: { zoom: 14, pitch: 38.5, bearing: 52.3 }
  },
  'italy': {
    desktop: { zoom: 14.52, pitch: 57, bearing: 0, speed: 1.2, curve: 1 },
    mobile: { zoom: 13.62, pitch: 40.5, bearing: 30 }
  },
  'belgium': {
    desktop: { zoom: 14.57, pitch: 56, bearing: 0, speed: 1.2, curve: 1 },
    mobile: { zoom: 13.13, pitch: 56, bearing: 0 }
  },
  'singapore': {
    desktop: { zoom: 15.11, pitch: 64.5, bearing: -31.2, speed: 1.2, curve: 1 },
    mobile: { zoom: 13.66, pitch: 64.5, bearing: -40 }
  },
  'japan': {
    desktop: { zoom: 14.71, pitch: 60, bearing: 0, speed: 1.2, curve: 1 },
    mobile: { zoom: 13.88, pitch: 60, bearing: -70 }
  },
  'australia': {
    desktop: { zoom: 14.41, pitch: 52, bearing: 51.2, speed: 1.2, curve: 1 },
    mobile: { zoom: 13.65, pitch: 56, bearing: 140 }
  },
  'brazil': {
    desktop: { zoom: 15.25, pitch: 56.5, bearing: 73.6, speed: 1.2, curve: 1 },
    mobile: { zoom: 14.5, pitch: 56, bearing: 150 }
  },
  'las-vegas': {
    desktop: { zoom: 14.99, pitch: 60, bearing: 0, speed: 1.2, curve: 1 },
    mobile: { zoom: 13.5, pitch: 60, bearing: 0 }
  },
  'mexico': {
    desktop: { zoom: 15, pitch: 60.5, bearing: 7, speed: 1.2, curve: 1 },
    mobile: { zoom: 13.8, pitch: 60.5, bearing: 37 }
  },
  'canada': {
    desktop: { zoom: 14.93, pitch: 51, bearing: 90, speed: 1.2, curve: 1 },
    mobile: { zoom: 13.5, pitch: 50, bearing: 0 }
  },
  'china': {
    desktop: { zoom: 14.84, pitch: 60, bearing: 0, speed: 1.2, curve: 1 },
    mobile: { zoom: 14.1, pitch: 60, bearing: -30 }
  },
  'netherlands': {
    desktop: { zoom: 15.44, pitch: 60, bearing: 0, speed: 1.2, curve: 1 },
    mobile: { zoom: 13.64, pitch: 60, bearing: 0 }
  },
  'usa': {
    desktop: { zoom: 14.61, pitch: 60, bearing: 0, speed: 1.2, curve: 1 },
    mobile: { zoom: 14, pitch: 60, bearing: 60 }
  },
  'qatar': {
    desktop: { zoom: 14.94, pitch: 60, bearing: 0, speed: 1.2, curve: 1 }
  },
  'abu-dhabi': {
    desktop: { zoom: 14.97, pitch: 60, bearing: 0, speed: 1.2, curve: 1 }
  },
  'miami': {
    desktop: { zoom: 14.94, pitch: 60, bearing: 0, speed: 1.2, curve: 1 }
  },
  'imola': {
    desktop: { zoom: 14.13, pitch: 56, bearing: -8.8, speed: 1.2, curve: 1 },
    mobile: { zoom: 13.5, pitch: 60, bearing: 60 }
  }
};

// 기본 서킷 카메라 설정
export const DEFAULT_CIRCUIT_CAMERA = {
  zoom: 15,
  pitch: 60,
  bearing: 0,
  speed: 1.2,
  curve: 1,
  essential: true
} as const;