'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useMapStore } from '@/src/features/map/store/useMapStore';
import { useReplayStore, useReplayActions } from '@/src/features/replay';
import { ReplayAnimationEngine } from '@/src/features/replay';
import { ReplaySessionData } from '../types';

interface UseReplayEngineReturn {
  loadSession: (session: ReplaySessionData) => Promise<boolean>;
  play: () => void;
  pause: () => void;
  stop: () => void;
  setSpeed: (speed: number) => void;
  seekTo: (time: number) => void;
  cleanup: () => void;
  isEngineReady: boolean;
  engine: ReplayAnimationEngine | null;
}

export const useReplayEngine = (): UseReplayEngineReturn => {
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
    if (!map) return;

    if (!engineRef.current) {
      engineRef.current = new ReplayAnimationEngine(map);
      console.log('🎨 Replay engine initialized');
    }
    
    // 엔진 콜백 설정
    if (engineRef.current) {
      engineRef.current.setOnTimeUpdate(setCurrentTime);
      engineRef.current.setOnDriverPositionsUpdate(updateDriverPositions);
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
        console.log('🎨 Replay engine destroyed');
      }
    };
  }, [map, setCurrentTime, updateDriverPositions]);

  // 세션 로드
  const loadSession = useCallback(async (session: ReplaySessionData): Promise<boolean> => {
    if (!engineRef.current) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️ Animation engine not ready yet, skipping session load');
      }
      return false;
    }

    try {
      console.log('🎨 Loading session:', session.sessionName);
      const success = await engineRef.current.loadReplayData(session);
      
      if (success) {
        setTotalDuration(5400);
        console.log('✅ Session loaded successfully');
      } else {
        console.error('❌ Failed to load session');
      }
      
      return success;
    } catch (error) {
      console.error('❌ Error loading session:', error);
      return false;
    }
  }, [setTotalDuration]);

  // 재생 제어 메서드들
  const play = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.play();
      console.log('▶️ Replay started');
    }
  }, []);

  const pause = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.pause();
      console.log('⏸️ Replay paused');
    }
  }, []);

  const stop = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.stop();
      console.log('⏹️ Replay stopped');
    }
  }, []);

  const setSpeed = useCallback((speed: number) => {
    if (engineRef.current) {
      engineRef.current.setPlaybackSpeed(speed);
      console.log(`⏩ Playback speed set to ${speed}x`);
    }
  }, []);

  const seekTo = useCallback((time: number) => {
    if (engineRef.current) {
      engineRef.current.seekTo(time);
      console.log(`⏭️ Seeked to ${time.toFixed(1)}s`);
    }
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

    if (selectedDrivers.length === 0) {
      console.log('🏎️ No drivers selected, showing all drivers');
      return;
    }

    console.log(`🏎️ Selected ${selectedDrivers.length} drivers:`, selectedDrivers);
    // TODO: 개별 마커 표시/숨기기 구현
  }, [selectedDrivers]);

  // 현재 세션이 변경되면 로드 (엔진이 준비된 후에만)
  useEffect(() => {
    if (currentSession && engineRef.current) {
      console.log('🎬 Loading session:', currentSession.sessionName);
      loadSession(currentSession);
    }
  }, [currentSession, loadSession, map]); // map을 dependency에 추가하여 맵 로드 후 재시도

  const cleanup = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.cleanup();
      console.log('🧹 Manual cleanup performed');
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