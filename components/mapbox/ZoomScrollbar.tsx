'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface ZoomScrollbarProps {
  map: mapboxgl.Map | null;
  className?: string;
}

const ZoomScrollbar = ({ map, className = '' }: ZoomScrollbarProps) => {
  const [zoomLevel, setZoomLevel] = useState(2);
  const [isDragging, setIsDragging] = useState(false);
  const scrollbarRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const isUserInteracting = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const minZoom = map?.getMinZoom() ?? 0.5;
  const maxZoom = map?.getMaxZoom() ?? 20;

  // 줄 레벨을 스크롤바 위치로 변환 (아래가 최소줄, 위가 최대줄)
  const zoomToPosition = useCallback((zoom: number) => {
    return 100 - ((zoom - minZoom) / (maxZoom - minZoom)) * 100;
  }, [minZoom, maxZoom]);

  // 스크롤바 위치를 줄 레벨로 변환 (아래가 최소줄, 위가 최대줄)
  const positionToZoom = useCallback((position: number) => {
    const invertedPosition = 100 - position;
    return minZoom + (invertedPosition / 100) * (maxZoom - minZoom);
  }, [minZoom, maxZoom]);

  // 공통 줄 업데이트 함수
  const updateZoom = useCallback((clientY: number) => {
    if (!scrollbarRef.current || !map) return;
    
    const rect = scrollbarRef.current.getBoundingClientRect();
    const relativeY = clientY - rect.top;
    const position = (relativeY / rect.height) * 100;
    const clampedPosition = Math.max(0, Math.min(100, position));
    const newZoom = positionToZoom(clampedPosition);
    
    setZoomLevel(newZoom);
    map.setZoom(newZoom);
  }, [map, positionToZoom]);

  // 타임아웃 설정 함수
  const setInteractionTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      isUserInteracting.current = false;
    }, 100);
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
    
    // 초기 줄 레벨 설정
    setZoomLevel(map.getZoom());

    return () => {
      map.off('zoom', handleZoomChange);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [map]);

  // 드래그 핸들러
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    isUserInteracting.current = true;

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      updateZoom(e.clientY);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setInteractionTimeout();
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [updateZoom, setInteractionTimeout]);

  // 터치 핸들러
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    isUserInteracting.current = true;

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length > 0) {
        updateZoom(e.touches[0].clientY);
      }
    };

    const handleTouchEnd = () => {
      setIsDragging(false);
      setInteractionTimeout();
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };

    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
  }, [updateZoom, setInteractionTimeout]);

  // 스크롤바 클릭 핸들러
  const handleScrollbarClick = useCallback((e: React.MouseEvent) => {
    // 썸을 클릭했을 때는 드래그로 처리하므로 스크롤바 클릭 무시
    if (!scrollbarRef.current || !map || isDragging || e.target !== scrollbarRef.current) return;
    
    isUserInteracting.current = true;
    updateZoom(e.clientY);
    setInteractionTimeout();
  }, [map, isDragging, updateZoom, setInteractionTimeout]);

  const thumbPosition = zoomToPosition(zoomLevel);

  // map이 없으면 렌더링하지 않음
  if (!map) {
    return null;
  }

  return (
    <div className={`fixed right-4 top-1/2 transform -translate-y-1/2 z-50 ${className}`}>
      <div className="flex flex-col items-center">
        {/* 줄 인 버튼 */}
        <button
          aria-label="줄 인"
          onClick={() => {
            if (map) {
              const newZoom = Math.min(maxZoom, zoomLevel + 1);
              isUserInteracting.current = true;
              setZoomLevel(newZoom);
              map.setZoom(newZoom);
              setInteractionTimeout();
            }
          }}
          className="w-10 h-10 bg-white/90 hover:bg-white shadow-lg rounded-t-lg flex items-center justify-center text-lg font-bold text-gray-700 hover:text-black transition-colors border border-gray-200"
        >
          +
        </button>

        {/* 스크롤바 */}
        <div
          ref={scrollbarRef}
          onClick={handleScrollbarClick}
          className="w-10 h-32 bg-white/90 shadow-lg border-l border-r border-gray-200 relative cursor-pointer"
        >
          {/* 스크롤바 썸 */}
          <div
            ref={thumbRef}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            className={`absolute w-full h-4 bg-blue-500 hover:bg-blue-600 cursor-grab ${
              isDragging ? 'cursor-grabbing bg-blue-600' : ''
            } transition-colors rounded-sm select-none`}
            style={{
              top: `${thumbPosition}%`,
              transform: 'translateY(-50%)',
              zIndex: 10
            }}
          />
          
          {/* 스크롤바 트랙 표시선들 */}
          <div className="absolute inset-0 flex flex-col justify-between p-1">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="w-full h-px bg-gray-300"
              />
            ))}
          </div>
        </div>

        {/* 줄 아웃 버튼 */}
        <button
          aria-label="줄 아웃"
          onClick={() => {
            if (map) {
              const newZoom = Math.max(minZoom, zoomLevel - 1);
              isUserInteracting.current = true;
              setZoomLevel(newZoom);
              map.setZoom(newZoom);
              setInteractionTimeout();
            }
          }}
          className="w-10 h-10 bg-white/90 hover:bg-white shadow-lg rounded-b-lg flex items-center justify-center text-lg font-bold text-gray-700 hover:text-black transition-colors border border-gray-200"
        >
          −
        </button>

        {/* 줄 레벨 표시 */}
        <div className="mt-2 px-2 py-1 bg-black/80 text-white text-xs rounded font-mono">
          {zoomLevel.toFixed(1)}x
        </div>
      </div>
    </div>
  );
};

export default ZoomScrollbar;