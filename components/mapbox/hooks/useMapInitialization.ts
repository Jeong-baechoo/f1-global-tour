import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import { MAP_CONFIG, LAYERS_TO_REMOVE, SKY_LAYER_CONFIG, FOG_CONFIG } from '../constants';
import { createGlobeSpinner } from '../utils/animations/globeAnimation';

interface UseMapInitializationProps {
  mapContainer: React.RefObject<HTMLDivElement | null>;
  onUserInteraction?: () => void;
}

export function useMapInitialization({ mapContainer, onUserInteraction }: UseMapInitializationProps) {
  const map = useRef<mapboxgl.Map | null>(null);
  const globeSpinner = useRef<ReturnType<typeof createGlobeSpinner> | null>(null);
  const onUserInteractionRef = useRef(onUserInteraction);
  
  // onUserInteraction 함수가 변경되면 ref 업데이트
  useEffect(() => {
    onUserInteractionRef.current = onUserInteraction;
  }, [onUserInteraction]);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // 맵 초기화
    const isMobile = window.innerWidth < 640;
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      ...MAP_CONFIG,
      zoom: isMobile ? MAP_CONFIG.zoom : MAP_CONFIG.zoom,
      // 모바일 제스처 설정
      touchPitch: false, // 터치로 피치(기울기) 변경 비활성화
      dragRotate: true, // 드래그 회전은 활성화 (두 손가락 회전 제스처용)
      touchZoomRotate: true // 핀치 줌과 회전 모두 활성화
    });

    // 내비게이션 컨트롤 추가
    map.current.addControl(new mapboxgl.NavigationControl({
      showCompass: !isMobile,
      showZoom: true,
      visualizePitch: !isMobile
    }), 'top-right');

    // 글로브 회전 애니메이션 설정
    globeSpinner.current = createGlobeSpinner(map.current);

    // 사용자 상호작용 감지 함수
    const handleUserInteraction = () => {
      if (onUserInteractionRef.current) {
        onUserInteractionRef.current();
      }
    };

    // 이벤트 리스너 등록
    type MapEvent = 'dragstart' | 'pitchstart' | 'rotatestart' | 'zoomstart' | 'touchstart' | 
                    'dragend' | 'pitchend' | 'rotateend' | 'zoomend' | 'touchend';
    
    const interactionEvents: MapEvent[] = ['dragstart', 'pitchstart', 'rotatestart', 'zoomstart', 'touchstart'];
    const stopEvents: MapEvent[] = ['dragend', 'pitchend', 'rotateend', 'zoomend', 'touchend'];

    interactionEvents.forEach(event => {
      map.current!.on(event, () => {
        globeSpinner.current?.startInteracting();
        handleUserInteraction();
      });
    });

    stopEvents.forEach(event => {
      map.current!.on(event, () => {
        globeSpinner.current?.stopInteracting();
      });
    });

    // 지도 클릭 시에도 사용자 상호작용으로 처리
    map.current.on('click', handleUserInteraction);

    // 맵 로드 완료 후 설정
    map.current.on('load', () => {
      if (!map.current) return;

      // 모바일에서 제스처 충돌 방지
      if (isMobile) {
        let touchStartTime = 0;
        let touchStartDistance = 0;
        let touchStartBearing = 0;
        let isPinching = false;
        let isRotating = false;
        
        // 두 손가락 터치 거리 계산
        const getTouchDistance = (touches: TouchList) => {
          if (touches.length < 2) return 0;
          const dx = touches[1].clientX - touches[0].clientX;
          const dy = touches[1].clientY - touches[0].clientY;
          return Math.sqrt(dx * dx + dy * dy);
        };
        
        // touchstart 이벤트 리스너
        const handleTouchStart = (e: TouchEvent) => {
          if (e.touches.length === 2) {
            touchStartTime = Date.now();
            touchStartDistance = getTouchDistance(e.touches);
            touchStartBearing = map.current!.getBearing();
            isPinching = false;
            isRotating = false;
          }
        };
        
        // touchmove 이벤트 리스너
        const handleTouchMove = (e: TouchEvent) => {
          if (e.touches.length === 2 && touchStartTime > 0) {
            const currentDistance = getTouchDistance(e.touches);
            const distanceChange = Math.abs(currentDistance - touchStartDistance);
            const currentBearing = map.current!.getBearing();
            const bearingChange = Math.abs(currentBearing - touchStartBearing);
            
            // 거리 변화가 더 크면 핀치 줌으로 판단
            if (distanceChange > 20 && !isRotating) {
              isPinching = true;
              // 핀치 줌 중에는 회전 막기
              if (bearingChange > 0.5) {
                map.current!.setBearing(touchStartBearing);
              }
            }
            // 회전 변화가 더 크면 회전으로 판단
            else if (bearingChange > 5 && !isPinching) {
              isRotating = true;
            }
          }
        };
        
        // touchend 이벤트 리스너
        const handleTouchEnd = (e: TouchEvent) => {
          if (e.touches.length < 2) {
            touchStartTime = 0;
            isPinching = false;
            isRotating = false;
          }
        };
        
        // 이벤트 리스너 등록
        const mapContainer = map.current.getContainer();
        mapContainer.addEventListener('touchstart', handleTouchStart, { passive: true });
        mapContainer.addEventListener('touchmove', handleTouchMove, { passive: true });
        mapContainer.addEventListener('touchend', handleTouchEnd, { passive: true });
        
        // Cleanup 함수에 이벤트 리스너 제거 추가
        map.current.on('remove', () => {
          mapContainer.removeEventListener('touchstart', handleTouchStart);
          mapContainer.removeEventListener('touchmove', handleTouchMove);
          mapContainer.removeEventListener('touchend', handleTouchEnd);
        });
      }

      // sky 레이어 추가
      try {
        map.current.addLayer(SKY_LAYER_CONFIG);
      } catch (error) {
        console.warn('Failed to add sky layer:', error);
      }

      // fog 설정 적용
      map.current.setFog(FOG_CONFIG);

      // 불필요한 레이어 제거
      const style = map.current.getStyle();
      if (style && style.layers) {
        style.layers.forEach(layer => {
          if (LAYERS_TO_REMOVE.some(pattern => layer.id.includes(pattern))) {
            try {
              map.current!.removeLayer(layer.id);
            } catch {
              // 레이어가 이미 제거된 경우 무시
            }
          }
        });
      }
    });

    // Cleanup
    return () => {
      globeSpinner.current?.cleanup();
      map.current?.remove();
      map.current = null;
    };
  }, [mapContainer]); // mapContainer만 의존성에 포함 - 맵은 한 번만 생성

  return { map, globeSpinner };
}