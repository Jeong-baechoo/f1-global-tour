import mapboxgl from 'mapbox-gl';
import { drawTrack } from '../map/trackDrawing';
import { createCircuitRotation } from './globeAnimation';
import { getTrackCoordinates } from '../data/trackDataLoader';
import { getCircuitCameraConfig } from '../map/camera';
import { getCircuitColor } from '../map/circuitColors';

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
    ...cameraConfig,
    center: [circuit.location.lng, circuit.location.lat]
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
          
          const handlersObj = {
            dragStart: dragStartHandler,
            dragEnd: dragEndHandler,
            zoomStart: zoomStartHandler,
            zoomEnd: zoomEndHandler,
            moveHandler,
            touchHandler
          };
          
          rotation.setHandlers(handlersObj);

          // 이벤트 핸들러 등록
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
            cleanup: () => {
              // 이벤트 핸들러 제거
              map.off('dragstart', dragStartHandler);
              map.off('dragend', dragEndHandler);
              map.off('zoomstart', zoomStartHandler);
              map.off('zoomend', zoomEndHandler);
              map.off('movestart', moveHandler);
              map.off('touchstart', touchHandler);
              rotation.cleanup();
            },
            rotation: rotation,
            onCinematicModeToggle
          };
        }
      });
    }
  });
};