import mapboxgl from 'mapbox-gl';
import { drawTrack } from './tracks';
import { createCircuitRotation } from './animations';
import { getTrackCoordinates } from './trackDataLoader';
import { isMobile } from './device';

// 타입 정의
interface CircuitRotationHandlers {
  dragStart: () => void;
  dragEnd: () => void;
  zoomStart: () => void;
  zoomEnd: () => void;
  cleanup: () => void;
  rotation?: {
    stopRotation: () => void;
    startRotation: () => void;
    enableCinematicMode: () => void;
    disableCinematicMode: () => void;
    toggleCinematicMode: () => boolean;
    isCinematicModeEnabled: () => boolean;
    cleanup: () => void;
  };
  onCinematicModeToggle?: (enabled: boolean) => void;
}

interface MapWithHandlers extends mapboxgl.Map {
  _circuitRotationHandlers?: CircuitRotationHandlers;
}

// 서킷별 색상 정의
export const getCircuitColor = (circuitId: string): string => {
  const colors: { [key: string]: string } = {
    // 유럽
    'austria': '#FF1801',      // 오스트리아 - Red Bull 색상
    'nurburgring': '#000000',  // 독일 - 검정
    'monaco': '#dc2626',       // 모나코 - 빨강
    'britain': '#1e40af',      // 영국 - 파랑
    'italy': '#16a34a',        // 이탈리아 - 초록
    'belgium': '#f59e0b',      // 벨기에 - 노랑
    'spain': '#dc2626',        // 스페인 - 빨강
    'hungary': '#16a34a',      // 헝가리 - 초록
    'netherlands': '#ea580c',  // 네덜란드 - 오렌지
    'emilia-romagna': '#0ea5e9', // 이탈리아 이몰라 - 하늘색

    // 아시아/중동
    'bahrain': '#dc2626',      // 바레인 - 빨강
    'saudi-arabia': '#16a34a', // 사우디 - 초록
    'azerbaijan': '#0ea5e9',   // 아제르바이잔 - 하늘색
    'singapore': '#dc2626',    // 싱가포르 - 빨강
    'japan': '#dc2626',        // 일본 - 빨강
    'qatar': '#881337',        // 카타르 - 마룬
    'abu-dhabi': '#16a34a',    // UAE - 초록

    // 아메리카
    'canada': '#dc2626',       // 캐나다 - 빨강
    'usa': '#1e40af',          // 미국 - 파랑
    'miami': '#ec4899',        // 마이애미 - 핑크
    'las-vegas': '#a855f7',    // 라스베가스 - 보라
    'mexico': '#16a34a',       // 멕시코 - 초록
    'brazil': '#facc15',       // 브라질 - 노랑

    // 오세아니아
    'australia': '#facc15',    // 호주 - 노랑
  };
  return colors[circuitId] || '#FF1801'; // 기본값은 F1 레드
};

interface CameraConfig {
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
      zoom: mobile ? 14 : 16,  // 모바일: 14, 데스크톱: 16
      pitch: 70,  // 터레인 효과 극대화
      bearing: -20,
      speed: 1.2,
      curve: 1
    },
    'nurburgring': {
      zoom: mobile ? 13.5 : 15.5,  // 모바일: 13.5, 데스크톱: 15.5
      pitch: 65,  // 터레인이 잘 보이도록 상향
      bearing: 45,
      speed: 0.4,
      curve: 0.8,
      duration: 6000
    },
    'monaco': {
      zoom: mobile ? 13 : 15,  // 모바일: 13, 데스크톱: 15
      pitch: 70,  // 해안 지형 강조
      bearing: 30,
      speed: 0.6,
      curve: 1.2
    },
    'silverstone': {
      zoom: mobile ? 13 : 15,  // 모바일: 13, 데스크톱: 15
      pitch: 65,
      bearing: 0,
      speed: 0.8,
      curve: 1
    },
  };

  const defaultConfig: CameraConfig = {
    zoom: mobile ? 13 : 15,  // 모바일: 13, 데스크톱: 15
    pitch: 70,  // 기본 pitch 값 상향
    bearing: 0,
    speed: 1.2,
    curve: 1.2,
    essential: true
  };

  return { ...defaultConfig, ...(configs[circuitId] || {}) };
};

// 서킷으로 flyTo하고 트랙 그리기
interface Circuit {
  id: string;
  location: {
    lng: number;
    lat: number;
  };
}

export const flyToCircuitWithTrack = async (
  map: mapboxgl.Map,
  circuit: Circuit,
  onRotationStart?: () => void,
  onCinematicModeToggle?: (enabled: boolean) => void
) => {
  const mapWithHandlers = map as MapWithHandlers;
  
  // Clean up any existing circuit rotation handlers
  if (mapWithHandlers._circuitRotationHandlers) {
    const handlers = mapWithHandlers._circuitRotationHandlers;
    map.off('dragstart', handlers.dragStart);
    map.off('dragend', handlers.dragEnd);
    map.off('zoomstart', handlers.zoomStart);
    map.off('zoomend', handlers.zoomEnd);
    if (handlers.cleanup) {
      handlers.cleanup();
    }
    delete mapWithHandlers._circuitRotationHandlers;
  }

  const cameraConfig = getCircuitCameraConfig(circuit.id);

  map.flyTo({
    center: [circuit.location.lng, circuit.location.lat],
    ...cameraConfig
  });

  map.once('moveend', async () => {
    // 트랙 데이터 로드 시도
    const trackData = await getTrackCoordinates(circuit.id);

    if (trackData && map.getZoom() > 10) {
      drawTrack(map, {
        trackId: `${circuit.id}-track`,
        trackCoordinates: trackData,
        color: getCircuitColor(circuit.id),
        delay: 500,
        onComplete: () => {
          // 회전 애니메이션 시작
          if (onRotationStart) {
            onRotationStart();
          }

          const rotation = createCircuitRotation(
            map,
            cameraConfig.bearing || 0
          );

          // Store event handlers for cleanup
          const dragStartHandler = () => rotation.stopRotation();
          const dragEndHandler = () => rotation.startRotation();
          const zoomStartHandler = () => rotation.stopRotation();
          const zoomEndHandler = () => rotation.startRotation();
          const moveHandler = () => rotation.stopRotation();
          const touchHandler = () => rotation.stopRotation();

          // Listen to all user interactions
          map.on('dragstart', dragStartHandler);
          map.on('dragend', dragEndHandler);
          map.on('zoomstart', zoomStartHandler);
          map.on('zoomend', zoomEndHandler);
          map.on('movestart', moveHandler);
          map.on('touchstart', touchHandler);

          // Store handlers and rotation object for potential cleanup later
          mapWithHandlers._circuitRotationHandlers = {
            dragStart: dragStartHandler,
            dragEnd: dragEndHandler,
            zoomStart: zoomStartHandler,
            zoomEnd: zoomEndHandler,
            cleanup: rotation.cleanup,
            rotation: rotation,
            onCinematicModeToggle
          };
        }
      });
    }
  });
};
