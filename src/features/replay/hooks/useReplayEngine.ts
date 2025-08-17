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
      
      // 콜백 설정
      engineRef.current.setOnTimeUpdate((time) => {
        setCurrentTime(time);
      });
      
      engineRef.current.setOnDriverPositionsUpdate((positions) => {
        updateDriverPositions(positions);
      });
    }

    return () => {
      if (engineRef.current) {
        engineRef.current.destroy();
        engineRef.current = null;
      }
    };
  }, [map, setCurrentTime, updateDriverPositions]);

  // 세션 로드
  const loadSession = useCallback(async (session: ReplaySessionData): Promise<boolean> => {
    if (!engineRef.current) {
      console.error('Animation engine not initialized');
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
      console.log('🎬 Engine not ready for playback control');
      return;
    }

    if (isPlaying && !engineRef.current.isCurrentlyPlaying()) {
      console.log('🎬 Engine: Starting playback...');
      engineRef.current.play();
    } else if (!isPlaying && engineRef.current.isCurrentlyPlaying()) {
      console.log('🎬 Engine: Pausing playback...');
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

  // 현재 세션이 변경되면 로드
  useEffect(() => {
    if (currentSession) {
      console.log('🎬 Loading session:', currentSession.sessionName);
      loadSession(currentSession);
    }
  }, [currentSession, loadSession]);

  return {
    loadSession,
    play,
    pause,
    stop,
    setSpeed,
    seekTo,
    isEngineReady: !!engineRef.current,
    engine: engineRef.current
  };
};