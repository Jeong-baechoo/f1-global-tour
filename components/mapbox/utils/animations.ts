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
  let resumeTimeout: NodeJS.Timeout | null = null;

  const spinGlobe = () => {
    if (!map) return;

    const zoom = map.getZoom();
    const bearing = map.getBearing();
    const pitch = map.getPitch();
    
    // 조건 확인: 줌 레벨, 베어링, 피치가 모두 적절한 상태일 때만 회전
    if (ANIMATION_CONFIG.spinEnabled && 
        !userInteracting && 
        zoom < ANIMATION_CONFIG.maxSpinZoom &&
        Math.abs(bearing) <= 1 &&
        pitch <= 10) {
      
      let distancePerSecond = 360 / ANIMATION_CONFIG.secondsPerRevolution;
      if (zoom > ANIMATION_CONFIG.slowSpinZoom) {
        const zoomDif = (ANIMATION_CONFIG.maxSpinZoom - zoom) / (ANIMATION_CONFIG.maxSpinZoom - ANIMATION_CONFIG.slowSpinZoom);
        distancePerSecond *= zoomDif;
      }

      const center = map.getCenter();
      center.lng -= distancePerSecond / 60; // 60fps 기준

      // easeTo를 사용하여 부드럽게 이동 (사용자 입력 방해 최소화)
      map.easeTo({
        center: center,
        duration: 0,
        animate: false
      });
      spinAnimationId = requestAnimationFrame(spinGlobe);
    } else {
      // 조건이 맞지 않으면 애니메이션 중단
      if (spinAnimationId) {
        cancelAnimationFrame(spinAnimationId);
        spinAnimationId = null;
      }
    }
  };

  const startInteracting = () => {
    userInteracting = true;
    // 진행 중인 resume 타이머 취소
    if (resumeTimeout) {
      clearTimeout(resumeTimeout);
      resumeTimeout = null;
    }
    if (spinAnimationId) {
      cancelAnimationFrame(spinAnimationId);
      spinAnimationId = null;
    }
  };

  const stopInteracting = () => {
    userInteracting = false;
    // 줌 레벨이 높을 때는 글로브 스피닝을 시작하지 않음
    const currentZoom = map.getZoom();
    if (currentZoom >= ANIMATION_CONFIG.maxSpinZoom) {
      return;
    }
    
    // 현재 베어링이 0이 아니면 (사용자가 회전시킨 상태) 글로브 스피닝 시작하지 않음
    const currentBearing = map.getBearing();
    const currentPitch = map.getPitch();
    if (Math.abs(currentBearing) > 1 || currentPitch > 10) {
      return;
    }
    
    // 이전 타이머 취소
    if (resumeTimeout) {
      clearTimeout(resumeTimeout);
    }
    
    resumeTimeout = setTimeout(() => {
      if (!userInteracting) {
        // 다시 한 번 조건 확인
        const zoom = map.getZoom();
        const bearing = map.getBearing();
        const pitch = map.getPitch();
        if (zoom < ANIMATION_CONFIG.maxSpinZoom && Math.abs(bearing) <= 1 && pitch <= 10) {
          spinGlobe();
        }
      }
      resumeTimeout = null;
    }, 3000); // 사용자 입력 후 3초 대기
  };

  // 초기 회전 시작
  setTimeout(() => {
    spinGlobe();
  }, 2000);

  // 카메라를 초기 상태로 리셋하는 함수
  const resetCamera = () => {
    map.easeTo({
      bearing: 0,
      pitch: 0,
      duration: 1000
    });
  };

  return {
    startInteracting,
    stopInteracting,
    resetCamera,
    cleanup: () => {
      if (spinAnimationId) {
        cancelAnimationFrame(spinAnimationId);
      }
    }
  };
};

// 서킷 회전 애니메이션 (시네마틱 투어 모드)
export const createCircuitRotation = (
  map: mapboxgl.Map,
  initialBearing: number
) => {
  let bearing = initialBearing;
  let isRotating = false;
  let rotationAnimationId: number | null = null;
  let isActive = true;
  let userInteracting = false;
  let idleTimer: NodeJS.Timeout | null = null;
  let cinematicModeEnabled = false; // 시네마틱 모드 상태

  const rotateCamera = () => {
    if (map.getZoom() > 13 && isRotating && isActive && !userInteracting && cinematicModeEnabled) {
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

  const pauseCinematicMode = () => {
    userInteracting = true;
    stopRotation();
    clearIdleTimer();
    // 사용자 입력 시 자동 활성화 타이머 시작
    if (cinematicModeEnabled) {
      startIdleTimer();
    }
  };

  const resumeCinematicMode = () => {
    userInteracting = false;
    if (cinematicModeEnabled && map.getZoom() > 13 && isActive) {
      isRotating = true;
      rotateCamera();
    }
  };

  const clearIdleTimer = () => {
    if (idleTimer) {
      clearTimeout(idleTimer);
      idleTimer = null;
    }
  };

  const startIdleTimer = () => {
    clearIdleTimer();
    idleTimer = setTimeout(() => {
      if (cinematicModeEnabled && !userInteracting) {
        resumeCinematicMode();
      }
    }, 30000); // 30초 동안 입력이 없으면 자동 재개
  };

  const enableCinematicMode = () => {
    cinematicModeEnabled = true;
    userInteracting = false;
    resumeCinematicMode();
    startIdleTimer();
  };

  const disableCinematicMode = () => {
    cinematicModeEnabled = false;
    stopRotation();
    clearIdleTimer();
  };

  const toggleCinematicMode = () => {
    if (cinematicModeEnabled) {
      disableCinematicMode();
    } else {
      enableCinematicMode();
    }
    return cinematicModeEnabled;
  };

  const cleanup = () => {
    isActive = false;
    disableCinematicMode();
  };

  // 기본적으로 시네마틱 모드는 비활성화 상태로 시작
  // 사용자가 버튼을 눌러야만 활성화됨

  return { 
    stopRotation: pauseCinematicMode, 
    startRotation: resumeCinematicMode, 
    enableCinematicMode,
    disableCinematicMode,
    toggleCinematicMode,
    isCinematicModeEnabled: () => cinematicModeEnabled,
    cleanup 
  };
};