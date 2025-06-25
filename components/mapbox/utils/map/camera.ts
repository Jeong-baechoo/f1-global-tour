import { isMobile } from '../viewport';

// 카메라 설정 타입
export interface CameraConfig {
  center: [number, number];
  zoom: number;
  pitch: number;
  bearing: number;
  speed: number;
  curve: number;
  duration?: number;
  essential?: boolean;
}

// 서킷별 카메라 설정
export const getCircuitCameraConfig = (circuitId: string): CameraConfig => {
  const mobile = isMobile();
  const configs: { [key: string]: Partial<CameraConfig> } = {
    'austria': {
      zoom: 15.45,
      pitch: 60,
      bearing: -20,
      speed: 1.2,
      curve: 1
    },
    'nurburgring': {
      zoom: 14.32,
      pitch: 36.5,
      bearing: -45.4,
      speed: 0.4,
      curve: 0.8,
      duration: 6000
    },
    'monaco': {
      zoom: 14.87,
      pitch: 51.2,
      bearing: -80.3,
      speed: 0.6,
      curve: 1.2
    },
    'britain': {
      zoom: 14.8,
      pitch: 51.5,
      bearing: 172.8,
      speed: 0.8,
      curve: 1
    },
    'bahrain': {
      zoom: 15,
      pitch: 57,
      bearing: 92,
      speed: 1.2,
      curve: 1
    },
    'saudi-arabia': {
      zoom: 15,
      pitch: 60,
      bearing: 0,
      speed: 1.2,
      curve: 1
    },
    'azerbaijan': {
      zoom: 14.89,
      pitch: 60,
      bearing: 0,
      speed: 1.2,
      curve: 1
    },
    'spain': {
      zoom: 14.53,
      pitch: 40.5,
      bearing: -28.8,
      speed: 1.2,
      curve: 1
    },
    'hungary': {
      zoom: 15.27,
      pitch: 38.5,
      bearing: 52.3,
      speed: 1.2,
      curve: 1
    },
    'italy': {
      zoom: 14.52,
      pitch: 57,
      bearing: 0,
      speed: 1.2,
      curve: 1
    },
    'belgium': {
      zoom: 14.57,
      pitch: 56,
      bearing: 0,
      speed: 1.2,
      curve: 1
    },
    'singapore': {
      zoom: 15.11,
      pitch: 64.5,
      bearing: -31.2,
      speed: 1.2,
      curve: 1
    },
    'japan': {
      zoom: 14.71,
      pitch: 60,
      bearing: 0,
      speed: 1.2,
      curve: 1
    },
    'australia': {
      zoom: 14.41,
      pitch: 52,
      bearing: 51.2,
      speed: 1.2,
      curve: 1
    },
    'brazil': {
      zoom: 15.25,
      pitch: 56.5,
      bearing: 73.6,
      speed: 1.2,
      curve: 1
    },
    'las-vegas': {
      zoom: 14.99,
      pitch: 60,
      bearing: 0,
      speed: 1.2,
      curve: 1
    },
    'mexico': {
      zoom: 15,
      pitch: 60.5,
      bearing: 7,
      speed: 1.2,
      curve: 1
    },
    'canada': {
      zoom: 14.93,
      pitch: 51,
      bearing: 90,
      speed: 1.2,
      curve: 1
    },
    'china': {
      zoom: 14.84,
      pitch: 60,
      bearing: 0,
      speed: 1.2,
      curve: 1
    },
    'netherlands': {
      zoom: 15.44,
      pitch: 60,
      bearing: 0,
      speed: 1.2,
      curve: 1
    },
    'usa': {
      zoom: 14.61,
      pitch: 60,
      bearing: 0,
      speed: 1.2,
      curve: 1
    },
    'qatar': {
      zoom: 14.94,
      pitch: 60,
      bearing: 0,
      speed: 1.2,
      curve: 1
    },
    'abu-dhabi': {
      zoom: 14.97,
      pitch: 60,
      bearing: 0,
      speed: 1.2,
      curve: 1
    },
    'usa-miami': {
      zoom: 14.94,
      pitch: 60,
      bearing: 0,
      speed: 1.2,
      curve: 1
    },
    'usa-vegas': {
      zoom: 13.25,
      pitch: 60,
      bearing: 0,
      speed: 1.2,
      curve: 1
    },
    'emilia-romagna': {
      zoom: 15.02,
      pitch: 56,
      bearing: -8.8,
      speed: 1.2,
      curve: 1
    }
  };

  const defaultConfig: CameraConfig = {
    center: [0, 0], // Will be set by caller
    zoom: mobile ? 14 : 15,
    pitch: 60,
    bearing: 0,
    speed: 1.2,
    curve: 1,
    essential: true
  };

  const circuitConfig = configs[circuitId] || {};
  
  return {
    ...defaultConfig,
    ...circuitConfig,
    zoom: mobile ? (circuitConfig.zoom || defaultConfig.zoom) - 0.5 : (circuitConfig.zoom || defaultConfig.zoom)
  };
};