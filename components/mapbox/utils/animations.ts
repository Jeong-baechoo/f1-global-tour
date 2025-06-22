import mapboxgl from 'mapbox-gl';
import { ANIMATION_CONFIG } from '../constants';

// 좌표 보간 함수
export const interpolateCoordinates = (coords: number[][]): number[][] => {
  const interpolated: number[][] = [];

  for (let i = 0; i < coords.length - 1; i++) {
    const start = coords[i];
    const end = coords[i + 1];

    // 원래 점 추가
    interpolated.push(start);

    // 두 점 사이의 거리 계산
    const dx = end[0] - start[0];
    const dy = end[1] - start[1];
    const distance = Math.sqrt(dx * dx + dy * dy);

    // 거리에 따라 보간 점 개수 결정
    const numInterpolations = Math.ceil(distance * 5000);

    // 보간 점 추가
    for (let j = 1; j < numInterpolations; j++) {
      const t = j / numInterpolations;
      interpolated.push([
        start[0] + dx * t,
        start[1] + dy * t
      ]);
    }
  }

  // 마지막 점 추가
  interpolated.push(coords[coords.length - 1]);

  return interpolated;
};

// 글로브 회전 애니메이션
export const createGlobeSpinner = (map: mapboxgl.Map) => {
  let userInteracting = false;
  let spinAnimationId: number | null = null;

  const spinGlobe = () => {
    if (!map) return;

    const zoom = map.getZoom();
    if (ANIMATION_CONFIG.spinEnabled && !userInteracting && zoom < ANIMATION_CONFIG.maxSpinZoom) {
      let distancePerSecond = 360 / ANIMATION_CONFIG.secondsPerRevolution;
      if (zoom > ANIMATION_CONFIG.slowSpinZoom) {
        const zoomDif = (ANIMATION_CONFIG.maxSpinZoom - zoom) / (ANIMATION_CONFIG.maxSpinZoom - ANIMATION_CONFIG.slowSpinZoom);
        distancePerSecond *= zoomDif;
      }

      const center = map.getCenter();
      center.lng -= distancePerSecond / 60; // 60fps 기준

      map.setCenter(center);
      spinAnimationId = requestAnimationFrame(spinGlobe);
    }
  };

  const startInteracting = () => {
    userInteracting = true;
    if (spinAnimationId) {
      cancelAnimationFrame(spinAnimationId);
      spinAnimationId = null;
    }
  };

  const stopInteracting = () => {
    userInteracting = false;
    setTimeout(() => {
      if (!userInteracting) {
        spinGlobe();
      }
    }, 500);
  };

  // 초기 회전 시작
  setTimeout(() => {
    spinGlobe();
  }, 2000);

  return {
    startInteracting,
    stopInteracting,
    cleanup: () => {
      if (spinAnimationId) {
        cancelAnimationFrame(spinAnimationId);
      }
    }
  };
};

// 서킷 회전 애니메이션
export const createCircuitRotation = (
  map: mapboxgl.Map,
  initialBearing: number,
  userInteracting: boolean
) => {
  let bearing = initialBearing;
  let isRotating = false;
  let rotationAnimationId: number | null = null;

  const rotateCamera = () => {
    if (map.getZoom() > 13 && isRotating) {
      bearing += ANIMATION_CONFIG.rotationSpeed;
      map.setBearing(bearing);
      rotationAnimationId = requestAnimationFrame(rotateCamera);
    }
  };

  const stopRotation = () => {
    isRotating = false;
    if (rotationAnimationId) {
      cancelAnimationFrame(rotationAnimationId);
      rotationAnimationId = null;
    }
  };

  const startRotation = () => {
    if (!isRotating && map.getZoom() > 13) {
      setTimeout(() => {
        if (!userInteracting) {
          isRotating = true;
          rotateCamera();
        }
      }, 500);
    }
  };

  // 회전 시작
  isRotating = true;
  rotateCamera();

  return { stopRotation, startRotation };
};