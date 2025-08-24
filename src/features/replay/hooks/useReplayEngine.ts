'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useMapStore } from '@/src/features/map/store/useMapStore';
import { useReplayStore, useReplayActions } from '../store/useReplayStore';
import { ReplayAnimationEngine } from '../services/ReplayAnimationEngine';
import { ReplaySessionData } from '../types';

export const useReplayEngine = () => {
  const map = useMapStore(state => state.map);
  const engineRef = useRef<ReplayAnimationEngine | null>(null);
  
  const {
    currentSession,
    isPlaying,
    playbackSpeed,
    selectedDrivers
  } = useReplayStore();
  
  const {
    setCurrentTime,
    updateDriverPositions,
    setTotalDuration
  } = useReplayActions();

  // 애니메이션 엔진 초기화
  useEffect(() => {
    if (map && !engineRef.current) {
      engineRef.current = new ReplayAnimationEngine(map);
    }
    
    // 엔진이 있으면 항상 콜백 재설정 (cleanup 후에도 동작하도록)
    if (engineRef.current) {
      engineRef.current.setOnTimeUpdate((time) => {
        setCurrentTime(time);
      });
      
      engineRef.current.setOnDriverPositionsUpdate((positions) => {
        updateDriverPositions(positions);
      });
    }

    // 전역 cleanup 이벤트 리스너 추가
    const handleCleanup = () => {
      if (engineRef.current) {
        // 엔진 데이터만 정리하고 인스턴스는 유지 (재사용 가능)
        engineRef.current.cleanup();
        // destroy()와 null 설정은 하지 않음 - 엔진을 재사용할 수 있도록 유지
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('replayEngineCleanup', handleCleanup);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('replayEngineCleanup', handleCleanup);
      }
      
      if (engineRef.current) {
        engineRef.current.destroy();
        engineRef.current = null;
      }
    };
  }, [map, setCurrentTime, updateDriverPositions]);

  // 세션 로드
  const loadSession = useCallback(async (session: ReplaySessionData): Promise<boolean> => {
    // 엔진이 초기화될 때까지 잠시 기다림
    if (!engineRef.current) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Animation engine not ready yet, skipping session load');
      }
      return false;
    }

    try {
      const success = await engineRef.current.loadReplayData(session);
      
      if (success) {
        // 총 지속 시간 설정 (임시로 5400초 = 90분 설정)
        setTotalDuration(5400);
      }
      
      return success;
    } catch (error) {
      console.error('Failed to load session:', error);
      return false;
    }
  }, [setTotalDuration]);

  // 재생 제어
  const play = useCallback(() => {
    engineRef.current?.play();
  }, []);

  const pause = useCallback(() => {
    engineRef.current?.pause();
  }, []);

  const stop = useCallback(() => {
    engineRef.current?.stop();
  }, []);

  const setSpeed = useCallback((speed: number) => {
    engineRef.current?.setPlaybackSpeed(speed);
  }, []);

  const seekTo = useCallback((time: number) => {
    engineRef.current?.seekTo(time);
  }, []);

  // 재생 상태 동기화
  useEffect(() => {
    if (!engineRef.current) {
      return;
    }

    if (isPlaying && !engineRef.current.isCurrentlyPlaying()) {
      engineRef.current.play();
    } else if (!isPlaying && engineRef.current.isCurrentlyPlaying()) {
      engineRef.current.pause();
    }
  }, [isPlaying]);

  // 재생 속도 동기화
  useEffect(() => {
    if (engineRef.current && engineRef.current.getPlaybackSpeed() !== playbackSpeed) {
      engineRef.current.setPlaybackSpeed(playbackSpeed);
    }
  }, [playbackSpeed]);

  // 선택된 드라이버 마커 표시/숨기기
  useEffect(() => {
    if (!engineRef.current) return;

    // 선택된 드라이버가 없으면 모든 드라이버 표시
    if (selectedDrivers.length === 0) {
      console.log('🏎️ No drivers selected, keeping all drivers visible');
      // 마커를 제거하지 않고 모든 마커를 그대로 유지
      return;
    }

    console.log(`🏎️ Showing ${selectedDrivers.length} selected drivers:`, selectedDrivers);
    
    // 특정 드라이버가 선택된 경우에만 필터링 로직 실행
    // TODO: 개별 마커 표시/숨기기 구현 필요
  }, [selectedDrivers]);

  // 현재 세션이 변경되면 로드 (엔진이 준비된 후에만)
  useEffect(() => {
    if (currentSession && engineRef.current) {
      console.log('🎬 Loading session:', currentSession.sessionName);
      loadSession(currentSession);
    }
  }, [currentSession, loadSession, map]); // map을 dependency에 추가하여 맵 로드 후 재시도

  // 데이터 정리를 위한 cleanup 함수 (엔진 인스턴스는 유지)
  const cleanup = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.cleanup();
      // 엔진 인스턴스는 유지하여 재사용 가능하도록 함
    }
  }, []);

  return {
    loadSession,
    play,
    pause,
    stop,
    setSpeed,
    seekTo,
    cleanup,
    isEngineReady: !!engineRef.current,
    engine: engineRef.current
  };
};