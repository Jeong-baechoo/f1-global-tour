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
      zoom: isMobile ? MAP_CONFIG.zoom : MAP_CONFIG.zoom
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