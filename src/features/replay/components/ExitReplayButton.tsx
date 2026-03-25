'use client';

import React, { useCallback } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useReplayStore, useReplayActions } from '@/src/features/replay';
import { cn } from '@/lib/utils';
import type { MapAPI } from '@/src/shared/types';

interface ExitReplayButtonProps {
  className?: string;
  onExitAction?: () => void;
  mapRef?: React.RefObject<MapAPI | null>;
  setIsReplayMode?: (isReplayMode: boolean) => void;
}

export const ExitReplayButton: React.FC<ExitReplayButtonProps> = ({ 
  className,
  onExitAction,
  mapRef,
  setIsReplayMode
}) => {
  const isPlaying = useReplayStore(state => state.isPlaying);
  const currentSession = useReplayStore(state => state.currentSession);
  const { stop, cleanup } = useReplayActions();

  const handleExit = useCallback(() => {
    // 리플레이가 진행 중이면 먼저 정지
    if (isPlaying) {
      stop();
    }
    
    // 맵 줌레벨을 5로 변경 (현재 중심좌표 유지)
    if (mapRef?.current) {
      try {
        const map = mapRef.current;
        const mapboxMap = map.getMapboxMap();
        if (mapboxMap) {
          mapboxMap.flyTo({
            zoom: 5,         // 줌레벨만 5로 변경
            duration: 2000   // 2초 애니메이션
          });
        }
      } catch (error) {
        console.warn('맵 줌아웃 중 오류 발생:', error);
      }
    }
    
    // 리플레이 엔진 정리 및 스토어 완전 초기화
    cleanup();
    
    // 리플레이 모드 비활성화
    if (setIsReplayMode) {
      setIsReplayMode(false);
    }
    
    // 커스텀 콜백 실행
    onExitAction?.();
  }, [isPlaying, stop, cleanup, mapRef, onExitAction, setIsReplayMode]);

  // 리플레이 세션이 있을 때만 표시 (진행 중이 아니어도)
  if (!currentSession) {
    return null;
  }

  return (
    <button
      onClick={handleExit}
      className={cn(
        "fixed top-24 left-4 z-[9999]",
        "flex items-center gap-2 px-4 py-2",
        "bg-red-600/90 backdrop-blur-sm text-white",
        "border border-red-500/50 rounded-lg",
        "hover:bg-red-700/90 hover:border-red-400/70",
        "active:bg-red-800/90",
        "transition-all duration-200",
        "shadow-lg hover:shadow-xl",
        "font-medium",
        className
      )}
      title="Exit Replay"
    >
      <ArrowLeft className="w-4 h-4" />
      <span className="text-sm font-medium">Exit Replay</span>
    </button>
  );
};