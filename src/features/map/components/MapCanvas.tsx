'use client';

import React, { useRef, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import { useMapStore } from '../store';
import { MapService } from '../services/MapService';
import { circuitTrackManager } from '@/src/features/circuits/services/CircuitTrackManager';
import { createGlobeSpinner } from '@/components/mapbox/utils/animations/globeAnimation';

// Mapbox 토큰
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || 
  'pk.eyJ1IjoiYmFlY2hvb2tpbmciLCJhIjoiY21iajAwaTd1MGJrZjJqb2g3M3RsZ2hhaiJ9.B1BuVoKpl3Xt1HSZq6ugeA';

interface MapCanvasProps {
  onLoad?: (map: mapboxgl.Map) => void;
  onGlobeSpinnerReady?: (spinner: ReturnType<typeof createGlobeSpinner>) => void;
}

/**
 * MapCanvas - Mapbox GL JS 맵 인스턴스를 관리하는 컴포넌트
 * MapService를 사용하여 맵 초기화 및 관리
 */
export const MapCanvas: React.FC<MapCanvasProps> = React.memo(({ onLoad, onGlobeSpinnerReady }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapService = useRef<MapService | null>(null);
  const globeSpinner = useRef<ReturnType<typeof createGlobeSpinner> | null>(null);
  const { setMap, setMapLoaded, center, zoom, bearing, pitch, isCinematicMode, isUserInteracting } = useMapStore();

  useEffect(() => {
    if (!mapContainer.current) return;

    // Mapbox 액세스 토큰 설정
    mapboxgl.accessToken = MAPBOX_TOKEN;

    // MapService 인스턴스 생성
    mapService.current = new MapService();

    // 맵 초기화
    const isMobile = window.innerWidth < 640;
    const map = mapService.current.initializeMap({
      container: mapContainer.current,
      // style은 MapService의 defaultConfig에서 관리 (dark-v11)
      center: center || [0, isMobile ? 10 : 20],
      zoom: zoom || (isMobile ? 1.2 : 1.5),
      bearing: bearing || 0,
      pitch: pitch || 0,
    });

    // 스토어에 맵 인스턴스 저장
    setMap(map);

    // 맵 로드 완료 시
    map.on('load', () => {
      console.log('MapCanvas: Map loaded successfully');
      setMapLoaded(true);
      onLoad?.(map);
      
      // 네비게이션 컨트롤 추가 (모바일에서는 간소화)
      mapService.current?.addNavigationControls('top-right');
      
      // CircuitTrackManager 초기화
      circuitTrackManager.setMap(map);
      
      // Globe 회전 애니메이션 시작
      globeSpinner.current = createGlobeSpinner(map);
      onGlobeSpinnerReady?.(globeSpinner.current);
    });

    // 맵 상태 변경 시 스토어 업데이트
    map.on('move', () => {
      const viewport = mapService.current?.getViewport();
      if (viewport) {
        useMapStore.setState({
          center: viewport.center,
          zoom: viewport.zoom,
          bearing: viewport.bearing,
          pitch: viewport.pitch
        });
      }
    });
    
    // 사용자 인터랙션 감지
    const handleUserInteraction = () => {
      useMapStore.getState().setUserInteracting(true);
      globeSpinner.current?.startInteracting();
    };
    
    const handleInteractionEnd = () => {
      setTimeout(() => {
        useMapStore.getState().setUserInteracting(false);
        globeSpinner.current?.stopInteracting();
      }, 1000);
    };
    
    map.on('dragstart', handleUserInteraction);
    map.on('zoomstart', handleUserInteraction);
    map.on('rotatestart', handleUserInteraction);
    map.on('pitchstart', handleUserInteraction);
    map.on('touchstart', handleUserInteraction);
    
    map.on('dragend', handleInteractionEnd);
    map.on('zoomend', handleInteractionEnd);
    map.on('rotateend', handleInteractionEnd);
    map.on('pitchend', handleInteractionEnd);
    map.on('touchend', handleInteractionEnd);

    // 클린업
    return () => {
      // GlobeSpinner 정리
      if (globeSpinner.current) {
        globeSpinner.current.cleanup();
        globeSpinner.current = null;
      }
      
      // CircuitTrackManager 정리
      circuitTrackManager.cleanup();
      
      mapService.current?.destroy();
      mapService.current = null;
      setMap(null);
      setMapLoaded(false);
    };
  }, []); // 의도적으로 한 번만 실행

  return (
    <div 
      ref={mapContainer} 
      className="absolute inset-0 w-full h-full"
    />
  );
});

MapCanvas.displayName = 'MapCanvas';