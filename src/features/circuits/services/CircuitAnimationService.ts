import mapboxgl from 'mapbox-gl';
import { drawAnimatedTrack as drawTrack, clearAllTrackState } from '@/components/mapbox/utils/map/trackDrawing';
import { createCircuitRotation } from '@/components/mapbox/utils/animations/globeAnimation';
import { getTrackCoordinates } from '@/components/mapbox/utils/data/trackDataLoader';
import { getCircuitCameraConfig } from '@/components/mapbox/utils/map/camera';
import { getCircuitColor } from '@/components/mapbox/utils/map/circuitColors';
import { addSectorMarkersProgressively } from '@/components/mapbox/markers/circuit/SectorMarkerManager';
import { cleanupSectorMarkers } from '@/src/features/circuits/utils/circuitManagerExtensions';
import { circuitTrackManager } from './CircuitTrackManager';
import { ZOOM_THRESHOLDS, ANIMATION_TIMINGS, CIRCUIT_VIEW } from '@/components/mapbox/constants';

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
    cleanup?: () => void;
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

export class CircuitAnimationService {
  private static instance: CircuitAnimationService;

  private constructor() {}

  static getInstance(): CircuitAnimationService {
    if (!CircuitAnimationService.instance) {
      CircuitAnimationService.instance = new CircuitAnimationService();
    }
    return CircuitAnimationService.instance;
  }

  async flyToCircuitWithTrack(
    map: mapboxgl.Map,
    circuit: Circuit,
    onRotationStart?: () => void,
    onCinematicModeToggle?: (enabled: boolean) => void
  ) {
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

    // Clean up all existing tracks, animations, and markers
    circuitTrackManager.removeAllTracks();
    clearAllTrackState();
    cleanupSectorMarkers();

    const cameraConfig = getCircuitCameraConfig(circuit.id);

    map.flyTo({
      ...cameraConfig,
      center: [circuit.location.lng, circuit.location.lat]
    });

    // Wait for the map to be ready and flyTo to complete
    const waitForMapReady = () => {
      return new Promise<void>((resolve) => {
        const checkReady = () => {
          if (map.loaded() && !map.isMoving()) {
            resolve();
          } else {
            setTimeout(checkReady, ANIMATION_TIMINGS.MAP_READY_CHECK);
          }
        };
        checkReady();
      });
    };

    map.once('moveend', async () => {
      // Ensure map is fully ready before proceeding
      await waitForMapReady();
      
      // Additional small delay to ensure stability
      await new Promise(resolve => setTimeout(resolve, ANIMATION_TIMINGS.MAP_READY_DELAY));
      // 트랙 데이터 로드 시도
      const trackData = await getTrackCoordinates(circuit.id);

      if (trackData && map.getZoom() > ZOOM_THRESHOLDS.TRACK_VISIBLE) {
        // circuitTrackManager에 먼저 트랙 등록
        circuitTrackManager.registerTrack(circuit.id, `${circuit.id}-track`);
        
        // 줌 레벨이 충분할 때만 섹터 마커 생성
        let sectorMarkerCleanup: (() => void) | undefined = undefined;
        const currentZoom = map.getZoom();
        console.log('🎯 Current zoom level:', currentZoom, 'Track visible threshold:', ZOOM_THRESHOLDS.TRACK_VISIBLE);
        
        if (currentZoom > ZOOM_THRESHOLDS.TRACK_VISIBLE) {
          // 섹터 마커를 먼저 생성 (숨김 상태)
          sectorMarkerCleanup = await addSectorMarkersProgressively({
            map,
            circuitId: circuit.id
          });
        } else {
          console.log('⚠️ Zoom level too low, skipping sector marker creation');
        }

        // DRS Detection과 Speed Trap 마커도 생성 (오스트리아, 영국, 호주 서킷)
        let drsDetectionCleanup: (() => void) | null = null;
        let speedTrapCleanup: (() => void) | null = null;

        // 뉘르부르크링을 제외한 모든 서킷에서 DRS Detection과 Speed Trap 마커 지원
        if (circuit.id !== 'nurburgring' && currentZoom > ZOOM_THRESHOLDS.TRACK_VISIBLE) {
          // DRS Detection 마커 추가 (숨김 상태로 생성)
          const { addDRSDetectionMarkers, addSpeedTrapMarkers } = await import('@/components/mapbox/markers/circuit/SectorMarkerManager');

          drsDetectionCleanup = await addDRSDetectionMarkers({
            map,
            circuitId: circuit.id
          });

          speedTrapCleanup = await addSpeedTrapMarkers({
            map,
            circuitId: circuit.id
          });
        }

        drawTrack(map, {
            trackId: `${circuit.id}-track`,
            trackCoordinates: trackData,
            color: getCircuitColor(circuit.id),
            delay: CIRCUIT_VIEW.DRAW_DELAY,
            sectorMarkerCleanup: sectorMarkerCleanup || undefined, // 청리업 함수 전달 (null을 undefined로 변환)
            onComplete: () => {
              // Check zoom level before showing markers
              const finalZoom = map.getZoom();
              console.log('🎯 Track drawing complete, final zoom:', finalZoom);
              
              // 트랙 그리기 완료 후 DRS Detection과 Speed Trap 마커 표시 (뉘르부르크링 제외)
              if (circuit.id !== 'nurburgring' && finalZoom > ZOOM_THRESHOLDS.TRACK_VISIBLE) {
                import('@/components/mapbox/markers/circuit/SectorMarkerManager').then(({ showDRSAndSpeedTrapMarkers }) => {
                  setTimeout(() => {
                    showDRSAndSpeedTrapMarkers(map);
                  }, CIRCUIT_VIEW.MARKER_DELAY); // 트랙 그리기 완료 후 0.5초 딜레이
                });
              }

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

                  // 마커 cleanup 함수들 호출
                  if (sectorMarkerCleanup) sectorMarkerCleanup();
                  if (drsDetectionCleanup) drsDetectionCleanup();
                  if (speedTrapCleanup) speedTrapCleanup();
                },
                rotation: rotation,
                onCinematicModeToggle: onCinematicModeToggle
              };
            }
          });
      } else {
        // No track data - just start rotation animation
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
          onCinematicModeToggle: onCinematicModeToggle
        };
      }
    });
  }
}

// Export singleton instance and function for backward compatibility
export const circuitAnimationService = CircuitAnimationService.getInstance();

// Legacy function export for backward compatibility
export const flyToCircuitWithTrack = (
  map: mapboxgl.Map,
  circuit: Circuit,
  onRotationStart?: () => void,
  onCinematicModeToggle?: (enabled: boolean) => void
) => {
  return circuitAnimationService.flyToCircuitWithTrack(map, circuit, onRotationStart, onCinematicModeToggle);
};