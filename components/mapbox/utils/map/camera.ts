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

// 서킷별 카메라 설정 타입
interface CircuitConfig extends Partial<CameraConfig> {
  mobile?: Partial<CameraConfig>;
}

// 서킷별 카메라 설정
export const getCircuitCameraConfig = (circuitId: string): CameraConfig => {
  const mobile = isMobile();
  const configs: { [key: string]: CircuitConfig } = {
    'austria': {
      zoom: 15.45,
      pitch: 60,
      bearing: -20,
      speed: 1.2,
      curve: 1,
      mobile: {
        zoom: 14,
        pitch: 60,
        bearing: -20,
      }
    },
    'nurburgring': {
      zoom: 14.32,
      pitch: 36.5,
      bearing: -45.4,
      speed: 0.4,
      curve: 0.8,
      duration: 6000,
      mobile: {
        zoom: 13.62,
        pitch: 36.5,
        bearing: -125.4,
      }
    },
    'monaco': {
      zoom: 14.87,
      pitch: 51.2,
      bearing: -80.3,
      speed: 0.6,
      curve: 1.2,
      mobile: {
        zoom: 13.9,
        pitch: 51.2,
        bearing: -85.3,
      }
    },
    'britain': {
      zoom: 14.8,
      pitch: 51.5,
      bearing: 172.8,
      speed: 0.8,
      curve: 1,
      mobile: {
        zoom: 13.77,
        pitch: 51.5,
        bearing: 172.8
      }
    },
    'bahrain': {
      zoom: 15,
      pitch: 57,
      bearing: 92,
      speed: 1.2,
      curve: 1,
      mobile: {
        zoom: 14.1,
        pitch: 57,
        bearing: 92,
      }
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
      curve: 1,
      mobile: {
        zoom: 13.69,
        pitch: 60,
        bearing: -90,
      }
    },
    'spain': {
      zoom: 14.53,
      pitch: 40.5,
      bearing: -28.8,
      speed: 1.2,
      curve: 1,
      mobile: {
        zoom: 13.62,
        pitch: 40.5,
        bearing: -70,
      }
    },
    'hungary': {
      zoom: 15.27,
      pitch: 38.5,
      bearing: 52.3,
      speed: 1.2,
      curve: 1,
      mobile: {
        zoom: 14,
        pitch: 38.5,
        bearing: 52.3,
      }
    },
    'italy': {
      zoom: 14.52,
      pitch: 57,
      bearing: 0,
      speed: 1.2,
      curve: 1,
      mobile: {
        zoom: 13.62,
        pitch: 40.5,
        bearing: 30,
      }
    },
    'belgium': {
      zoom: 14.57,
      pitch: 56,
      bearing: 0,
      speed: 1.2,
      curve: 1,
      mobile: {
        zoom: 13.13,
        pitch: 56,
        bearing: 0,
      }
    },
    'singapore': {
      zoom: 15.11,
      pitch: 64.5,
      bearing: -31.2,
      speed: 1.2,
      curve: 1,
      mobile: {
        zoom: 13.66,
        pitch: 64.5,
        bearing: -40,
      }
    },
    'japan': {
      zoom: 14.71,
      pitch: 60,
      bearing: 0,
      speed: 1.2,
      curve: 1,
      mobile: {
        zoom: 13.88,
        pitch: 60,
        bearing: -70,
      }
    },
    'australia': {
      zoom: 14.41,
      pitch: 52,
      bearing: 51.2,
      speed: 1.2,
      curve: 1,
      mobile: {
        zoom: 13.65,
        pitch: 56,
        bearing: 140,
      }
    },
    'brazil': {
      zoom: 15.25,
      pitch: 56.5,
      bearing: 73.6,
      speed: 1.2,
      curve: 1,
      mobile: {
        zoom: 14.5,
        pitch: 56,
        bearing: 150,
      }
    },
    'las-vegas': {
      zoom: 14.99,
      pitch: 60,
      bearing: 0,
      speed: 1.2,
      curve: 1,
      mobile: {
        zoom: 13.5,
        pitch: 60,
        bearing: 0,
      }
    },
    'mexico': {
      zoom: 15,
      pitch: 60.5,
      bearing: 7,
      speed: 1.2,
      curve: 1,
      mobile: {
        zoom: 13.8,
        pitch: 60.5,
        bearing: 37,
      }
    },
    'canada': {
      zoom: 14.93,
      pitch: 51,
      bearing: 90,
      speed: 1.2,
      curve: 1,
      mobile: {
        zoom: 13.5,
        pitch: 50,
        bearing: 0,
      }
    },
    'china': {
      zoom: 14.84,
      pitch: 60,
      bearing: 0,
      speed: 1.2,
      curve: 1,
      mobile: {
        zoom: 14.1,
        pitch: 60,
        bearing: -30,
      }
    },
    'netherlands': {
      zoom: 15.44,
      pitch: 60,
      bearing: 0,
      speed: 1.2,
      curve: 1,
      mobile: {
        zoom: 13.64,
        pitch: 60,
        bearing: 0
      }
    },
    'usa': {
      zoom: 14.61,
      pitch: 60,
      bearing: 0,
      speed: 1.2,
      curve: 1,
      mobile: {
        zoom: 14,
        pitch: 60,
        bearing: 60,
      }
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
    'miami': {
      zoom: 14.94,
      pitch: 60,
      bearing: 0,
      speed: 1.2,
      curve: 1
    },
    'imola': {
      zoom: 14.13,
      pitch: 56,
      bearing: -8.8,
      speed: 1.2,
      curve: 1,
      mobile: {
        zoom: 13.5,
        pitch: 60,
        bearing: 60,
      }
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
  
  // 모바일 전용 설정이 있는 경우 사용
  const finalConfig = mobile && circuitConfig.mobile 
    ? { ...circuitConfig, ...circuitConfig.mobile }
    : circuitConfig;
  
  return {
    ...defaultConfig,
    ...finalConfig,
    zoom: mobile && !circuitConfig.mobile 
      ? (finalConfig.zoom || defaultConfig.zoom) - 0.5 
      : (finalConfig.zoom || defaultConfig.zoom)
  };
};