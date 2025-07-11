import { useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import { useMapStore } from '../store';

interface UseMapInteractionProps {
  map: React.MutableRefObject<mapboxgl.Map | null>;
}

export const useMapInteraction = ({ map }: UseMapInteractionProps) => {
  const store = useMapStore();
  const toggleCinematicMode = store.toggleCinematicMode;
  const setUserInteracting = store.setUserInteracting;

  // 현재 맵 경계 가져오기
  const getCurrentBounds = useCallback(() => {
    return map.current?.getBounds() || null;
  }, [map]);

  // 현재 줌 레벨 가져오기
  const getCurrentZoom = useCallback(() => {
    return map.current?.getZoom() || 0;
  }, [map]);

  // 현재 중심점 가져오기
  const getCurrentCenter = useCallback((): [number, number] | null => {
    const center = map.current?.getCenter();
    return center ? [center.lng, center.lat] : null;
  }, [map]);

  // 현재 베어링 가져오기
  const getCurrentBearing = useCallback(() => {
    return map.current?.getBearing() || 0;
  }, [map]);

  // 현재 피치 가져오기
  const getCurrentPitch = useCallback(() => {
    return map.current?.getPitch() || 0;
  }, [map]);

  // 맵 상태 가져오기
  const getMapState = useCallback(() => {
    if (!map.current) return null;
    
    return {
      center: getCurrentCenter(),
      zoom: getCurrentZoom(),
      bearing: getCurrentBearing(),
      pitch: getCurrentPitch(),
      bounds: getCurrentBounds()
    };
  }, [map, getCurrentCenter, getCurrentZoom, getCurrentBearing, getCurrentPitch, getCurrentBounds]);

  // 사용자 인터랙션 트래킹
  const trackInteraction = useCallback(() => {
    setUserInteracting(true);
    
    // 3초 후 인터랙션 상태 해제
    const timeoutId = setTimeout(() => {
      setUserInteracting(false);
    }, 3000);

    return () => clearTimeout(timeoutId);
  }, [setUserInteracting]);

  // 시네마틱 모드 토글 핸들러
  const handleCinematicModeToggle = useCallback((): boolean => {
    trackInteraction();
    const newMode = toggleCinematicMode();
    return newMode;
  }, [toggleCinematicMode, trackInteraction]);

  return {
    getCurrentBounds,
    getCurrentZoom,
    getCurrentCenter,
    getCurrentBearing,
    getCurrentPitch,
    getMapState,
    trackInteraction,
    toggleCinematicMode: handleCinematicModeToggle
  };
};