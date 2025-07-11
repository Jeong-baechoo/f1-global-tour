import { useCallback, useRef } from 'react';
import mapboxgl from 'mapbox-gl';

// Circuit rotation handlers type
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

interface UseCinematicModeProps {
  map: React.RefObject<mapboxgl.Map | null>;
  onCinematicModeChange?: (enabled: boolean) => void;
}

export function useCinematicMode({ map, onCinematicModeChange }: UseCinematicModeProps) {
  const propsRef = useRef({ onCinematicModeChange });
  propsRef.current = { onCinematicModeChange };

  const handleCinematicModeToggle = useCallback((): boolean => {
    if (!map.current) return false;

    const mapWithHandlers = map.current as mapboxgl.Map & {
      _circuitRotationHandlers?: CircuitRotationHandlers;
    };
    const handlers = mapWithHandlers._circuitRotationHandlers;

    if (handlers?.rotation) {
      const isEnabled = handlers.rotation.toggleCinematicMode();
      if (handlers.onCinematicModeToggle) {
        handlers.onCinematicModeToggle(isEnabled);
      }
      // 상위 컴포넌트로 상태 전달
      if (propsRef.current.onCinematicModeChange) {
        propsRef.current.onCinematicModeChange(isEnabled);
      }
      return isEnabled;
    }
    return false;
  }, [map]);

  return { handleCinematicModeToggle };
}