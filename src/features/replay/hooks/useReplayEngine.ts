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
  getIsEngineReady: () => boolean;
  getEngine: () => ReplayAnimationEngine | null;
}

export const useReplayEngine = (): UseReplayEngineReturn => {
  const map = useMapStore(state => state.map);
  const engineRef = useRef<ReplayAnimationEngine | null>(null);

  const {
    currentSession,
    isPlaying,
    playbackSpeed,
  } = useReplayStore();

  const {
    setCurrentTime,
    updateDriverPositions,
    setTotalDuration,
    setLapsData
  } = useReplayActions();


  // 애니메이션 엔진 초기화
  useEffect(() => {
    if (!map) return;

    if (!engineRef.current) {
      engineRef.current = new ReplayAnimationEngine(map);
    }

    // 엔진 콜백 설정
    engineRef.current.setOnTimeUpdate(setCurrentTime);
    engineRef.current.setOnDriverPositionsUpdate(updateDriverPositions);

    // 전역 cleanup 이벤트 리스너
    const handleCleanup = () => {
      engineRef.current?.cleanup();
    };

    window.addEventListener('replayEngineCleanup', handleCleanup);

    return () => {
      window.removeEventListener('replayEngineCleanup', handleCleanup);

      if (engineRef.current) {
        engineRef.current.destroy();
        engineRef.current = null;
      }
    };
  }, [map, setCurrentTime, updateDriverPositions]);

  // 세션 로드
  const loadSession = useCallback(async (session: ReplaySessionData): Promise<boolean> => {
    if (!engineRef.current || !map) {
      return false;
    }

    try {
      const success = await engineRef.current.loadReplayData(session);

      if (success && engineRef.current) {
        // 콜백 재설정 (이전 세션의 cleanup()에서 제거되었을 수 있음)
        engineRef.current.setOnTimeUpdate(setCurrentTime);
        engineRef.current.setOnDriverPositionsUpdate(updateDriverPositions);

        // 엔진에서 실제 랩 데이터와 총 시간을 가져와 store에 동기화
        setLapsData(engineRef.current.getLapsData());
        setTotalDuration(engineRef.current.getTotalDuration());
      }

      return success;
    } catch {
      return false;
    }
  }, [setTotalDuration, setLapsData, setCurrentTime, updateDriverPositions, map]);

  // 재생 제어 메서드들
  const play = useCallback(() => { engineRef.current?.play(); }, []);
  const pause = useCallback(() => { engineRef.current?.pause(); }, []);
  const stop = useCallback(() => { engineRef.current?.stop(); }, []);
  const setSpeed = useCallback((speed: number) => { engineRef.current?.setPlaybackSpeed(speed); }, []);
  const seekTo = useCallback((time: number) => { engineRef.current?.seekTo(time); }, []);
  const cleanup = useCallback(() => { engineRef.current?.cleanup(); }, []);

  // 재생 상태 동기화
  useEffect(() => {
    if (!engineRef.current) return;

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

  // 현재 세션이 변경되면 로드 (엔진이 준비된 후에만)
  useEffect(() => {
    if (currentSession && engineRef.current && map) {
      loadSession(currentSession);
    }
  }, [currentSession, loadSession, map]);

  return {
    loadSession,
    play,
    pause,
    stop,
    setSpeed,
    seekTo,
    cleanup,
    getIsEngineReady: () => !!engineRef.current,
    getEngine: () => engineRef.current
  };
};
