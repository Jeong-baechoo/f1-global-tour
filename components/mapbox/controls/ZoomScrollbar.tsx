'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

// 상수 정의
const ZOOM_CONFIG = {
  CENTER_POSITION: 50,
  BASE_SPEED: 0.001,
  MAX_SPEED: 0.03,
  FRAME_RATE: 16, // 60fps
  RETURN_DURATION: 800, // 0.8초
  BUTTON_ZOOM_STEP: 0.5,
  INTERACTION_TIMEOUT: 100,
} as const;

const EASING = {
  CUBIC_OUT: (t: number) => 1 - Math.pow(1 - t, 3),
} as const;

interface ZoomScrollbarProps {
  map: mapboxgl.Map | null;
  className?: string;
}

const ZoomScrollbar = ({ map, className = '' }: ZoomScrollbarProps) => {
  const [zoomLevel, setZoomLevel] = useState(2);
  const [isDragging, setIsDragging] = useState(false);
  const [thumbPosition, setThumbPosition] = useState(50); // 중앙 위치 (50%)
  const scrollbarRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const isUserInteracting = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const zoomIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const returnIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const minZoom = map?.getMinZoom() ?? 0.5;
  const maxZoom = map?.getMaxZoom() ?? 20;

  // 썸 위치에 따른 줌 속도 계산 (중앙 기준)
  const calculateZoomSpeed = useCallback((position: number): number => {
    const distance = Math.abs(position - ZOOM_CONFIG.CENTER_POSITION) / ZOOM_CONFIG.CENTER_POSITION;
    const speedRange = ZOOM_CONFIG.MAX_SPEED - ZOOM_CONFIG.BASE_SPEED;
    return ZOOM_CONFIG.BASE_SPEED + (distance * distance * speedRange);
  }, []);

  // 줌 방향 계산 (중앙 기준)
  const getZoomDirection = useCallback((position: number): -1 | 0 | 1 => {
    if (position < ZOOM_CONFIG.CENTER_POSITION) return 1; // 위쪽 = 줌 인
    if (position > ZOOM_CONFIG.CENTER_POSITION) return -1; // 아래쪽 = 줌 아웃
    return 0; // 중앙 = 정지
  }, []);

  // 연속 줌 동작 중지
  const stopContinuousZoom = useCallback((): void => {
    if (zoomIntervalRef.current) {
      clearInterval(zoomIntervalRef.current);
      zoomIntervalRef.current = null;
    }
  }, []);

  // 연속 줌 동작 시작
  const startContinuousZoom = useCallback((position: number): void => {
    stopContinuousZoom();

    const direction = getZoomDirection(position);
    if (direction === 0 || !map) return;

    const speed = calculateZoomSpeed(position);
    
    zoomIntervalRef.current = setInterval(() => {
      const currentZoom = map.getZoom();
      const newZoom = currentZoom + (direction * speed);
      const clampedZoom = Math.max(minZoom, Math.min(maxZoom, newZoom));
      
      setZoomLevel(clampedZoom);
      map.setZoom(clampedZoom);
    }, ZOOM_CONFIG.FRAME_RATE);
  }, [map, minZoom, maxZoom, getZoomDirection, calculateZoomSpeed, stopContinuousZoom]);

  // 인터벌 정리 헬퍼 함수
  const clearAllIntervals = useCallback((): void => {
    if (zoomIntervalRef.current) {
      clearInterval(zoomIntervalRef.current);
      zoomIntervalRef.current = null;
    }
    if (returnIntervalRef.current) {
      clearInterval(returnIntervalRef.current);
      returnIntervalRef.current = null;
    }
  }, []);

  // 썸을 중앙으로 복귀
  const returnToCenter = useCallback((): void => {
    if (returnIntervalRef.current) {
      clearInterval(returnIntervalRef.current);
    }

    const startPosition = thumbPosition;
    const startTime = Date.now();

    returnIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / ZOOM_CONFIG.RETURN_DURATION, 1);
      
      const easeOut = EASING.CUBIC_OUT(progress);
      const currentPosition = startPosition + (ZOOM_CONFIG.CENTER_POSITION - startPosition) * easeOut;
      
      setThumbPosition(currentPosition);
      
      if (progress >= 1) {
        clearInterval(returnIntervalRef.current!);
        returnIntervalRef.current = null;
        setThumbPosition(ZOOM_CONFIG.CENTER_POSITION);
      }
    }, ZOOM_CONFIG.FRAME_RATE);
  }, [thumbPosition]);

  // 썸 위치 업데이트 함수
  const updateThumbPosition = useCallback((clientY: number): void => {
    if (!scrollbarRef.current) return;
    
    const rect = scrollbarRef.current.getBoundingClientRect();
    const relativeY = clientY - rect.top;
    const position = (relativeY / rect.height) * 100;
    const clampedPosition = Math.max(0, Math.min(100, position));
    
    setThumbPosition(clampedPosition);
    startContinuousZoom(clampedPosition);
  }, [startContinuousZoom]);

  // 타임아웃 설정 함수
  const setInteractionTimeout = useCallback((): void => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      isUserInteracting.current = false;
    }, ZOOM_CONFIG.INTERACTION_TIMEOUT);
  }, []);

  // 맵의 줄 레벨 변화 감지
  useEffect(() => {
    if (!map) return;

    const handleZoomChange = () => {
      if (!isUserInteracting.current) {
        const currentZoom = map.getZoom();
        setZoomLevel(currentZoom);
      }
    };

    map.on('zoom', handleZoomChange);
    
    // 초기 줌 레벨 설정
    setZoomLevel(map.getZoom());

    return () => {
      map.off('zoom', handleZoomChange);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      clearAllIntervals();
    };
  }, [map, clearAllIntervals]);

  // 드래그 핸들러
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    isUserInteracting.current = true;

    // 모든 애니메이션 중지
    clearAllIntervals();

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      updateThumbPosition(e.clientY);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      stopContinuousZoom();
      returnToCenter();
      setInteractionTimeout();
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [updateThumbPosition, stopContinuousZoom, returnToCenter, setInteractionTimeout, clearAllIntervals]);

  // 터치 핸들러
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    // React 이벤트에서는 preventDefault를 호출하지 않음
    e.stopPropagation();
    setIsDragging(true);
    isUserInteracting.current = true;

    // 모든 애니메이션 중지
    clearAllIntervals();

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length > 0) {
        updateThumbPosition(e.touches[0].clientY);
      }
    };

    const handleTouchEnd = () => {
      setIsDragging(false);
      stopContinuousZoom();
      returnToCenter();
      setInteractionTimeout();
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };

    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });
  }, [updateThumbPosition, stopContinuousZoom, returnToCenter, setInteractionTimeout, clearAllIntervals]);

  // 스크롤바 클릭 핸들러 (새로운 동작에서는 사용하지 않음)
  const handleScrollbarClick = useCallback((e: React.MouseEvent) => {
    // 새로운 동작에서는 클릭으로 바로 이동하지 않고 드래그만 허용
    e.preventDefault();
    e.stopPropagation();
  }, []);

  // map이 없으면 렌더링하지 않음
  if (!map) {
    return null;
  }

  return (
    <div className={`fixed right-4 top-1/2 transform -translate-y-1/2 z-50 ${className}`}>
      <div className="flex flex-col items-center">
        {/* 줌 인 버튼 */}
        <button
          aria-label="줌 인"
          onClick={() => {
            if (map) {
              const currentZoom = map.getZoom();
              const newZoom = Math.min(maxZoom, currentZoom + ZOOM_CONFIG.BUTTON_ZOOM_STEP);
              isUserInteracting.current = true;
              setZoomLevel(newZoom);
              map.setZoom(newZoom);
              setInteractionTimeout();
            }
          }}
          className="w-9 h-9 bg-[#1A1A1A]/60 backdrop-blur-sm hover:bg-[#1A1A1A]/80 rounded-t border border-[#FF1801]/20 hover:border-[#FF1801]/40 flex items-center justify-center text-lg font-bold text-white transition-all duration-300"
        >
          +
        </button>

        {/* 스크롤바 */}
        <div
          ref={scrollbarRef}
          onClick={handleScrollbarClick}
          className="w-9 h-28 bg-[#1A1A1A]/60 backdrop-blur-sm border-l border-r border-[#FF1801]/20 relative cursor-pointer"
        >
          {/* 스크롤바 썸 */}
          <div
            ref={thumbRef}
            onMouseDown={handleMouseDown}
            onTouchStart={(e) => {
              // passive: false를 명시적으로 설정
              if (e.nativeEvent && 'preventDefault' in e.nativeEvent) {
                handleTouchStart(e);
              }
            }}
            className={`absolute w-full h-4 bg-[#FF1801] hover:bg-[#FF1801]/90 cursor-grab ${
              isDragging ? 'cursor-grabbing bg-[#FF1801]/90' : ''
            } transition-all duration-300 rounded select-none border border-[#FF1801]/40`}
            style={{
              top: `${thumbPosition}%`,
              transform: 'translateY(-50%)',
              zIndex: 10,
              touchAction: 'none' // 터치 동작 비활성화
            }}
          />
          
          {/* 스크롤바 트랙 표시선들 및 중앙선 */}
          <div className="absolute inset-0 flex flex-col justify-between p-1.5">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className={`w-full h-px ${i === 2 ? 'bg-[#FF1801]/60' : 'bg-[#FF1801]/20'}`}
              />
            ))}
          </div>
          
          {/* 중앙 표시 */}
          <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-[#FF1801]/40 rounded-full" />
        </div>

        {/* 줌 아웃 버튼 */}
        <button
          aria-label="줌 아웃"
          onClick={() => {
            if (map) {
              const currentZoom = map.getZoom();
              const newZoom = Math.max(minZoom, currentZoom - ZOOM_CONFIG.BUTTON_ZOOM_STEP);
              isUserInteracting.current = true;
              setZoomLevel(newZoom);
              map.setZoom(newZoom);
              setInteractionTimeout();
            }
          }}
          className="w-9 h-9 bg-[#1A1A1A]/60 backdrop-blur-sm hover:bg-[#1A1A1A]/80 rounded-b border border-[#FF1801]/20 hover:border-[#FF1801]/40 flex items-center justify-center text-lg font-bold text-white transition-all duration-300"
        >
          −
        </button>

        {/* 줌 레벨 표시 */}
        <div className="mt-2 px-2 py-1 bg-[#1A1A1A]/60 backdrop-blur-sm border border-[#FF1801]/20 text-[#FF1801] text-xs rounded font-mono">
          {zoomLevel.toFixed(1)}x
        </div>
      </div>
    </div>
  );
};

export default ZoomScrollbar;