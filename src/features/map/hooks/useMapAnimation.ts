import { useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import { useMapStore } from '../store';
import teamsData from '@/data/teams.json';
import circuitsData from '@/data/circuits.json';
import { ZOOM_LEVELS, ANIMATION_SPEEDS, PITCH_ANGLES } from '@/src/shared/constants';
import { TEAM_FLYTO_CONFIGS, DEFAULT_TEAM_FLYTO } from '@/src/shared/config/teamFlyToConfig';
import { flyToCircuitWithTrack } from '@/src/features/circuits/services/CircuitAnimationService';
import { getDRSInfo } from '@/src/shared/utils/data/dynamicSectorLoader';

interface UseMapAnimationProps {
  map: React.MutableRefObject<mapboxgl.Map | null>;
  globeSpinner?: React.MutableRefObject<unknown>;
  onCircuitSelect?: (circuit: unknown) => void;
  setIsCircuitView?: (isCircuitView: boolean) => void;
  setCurrentCircuit?: (circuit: unknown) => void;
  setDrsZoneCount?: (count: number) => void;
  setDrsDetectionCount?: (count: number) => void;
  resetPanelStates?: () => void;
  setIsTrackAnimating?: (isAnimating: boolean) => void;
}

export const useMapAnimation = ({
  map,
  globeSpinner,
  onCircuitSelect,
  setIsCircuitView,
  setCurrentCircuit,
  setDrsZoneCount,
  setDrsDetectionCount,
  resetPanelStates: _resetPanelStates,
  setIsTrackAnimating,
}: UseMapAnimationProps) => {
  const { setUserInteracting } = useMapStore();
  
  // Suppress unused variable warning
  void _resetPanelStates;

  // FlyTo 특정 위치
  const flyToLocation = useCallback((coordinates: [number, number], zoom: number = 15) => {
    if (!map.current) return;
    
    setUserInteracting(true);
    map.current.flyTo({
      center: coordinates,
      zoom,
      speed: ANIMATION_SPEEDS.flyTo,
      curve: ANIMATION_SPEEDS.curve,
      essential: true
    });

    // 애니메이션 완료 후 상태 업데이트
    map.current.once('moveend', () => {
      setTimeout(() => setUserInteracting(false), 1000);
    });
  }, [map, setUserInteracting]);

  // FlyTo 서킷
  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const flyToCircuit = useCallback((circuitId: string, gentle: boolean = false) => {
    if (!map.current) return;

    const circuit = circuitsData.circuits.find(c => c.id === circuitId);
    if (!circuit) return;

    setUserInteracting(true);
    
    // 현재 서킷 정보 업데이트
    setCurrentCircuit?.(circuit);
    onCircuitSelect?.(circuit);
    
    // 패널 상태 초기화 제거 - 자동으로 패널이 닫히는 문제 해결
    // resetPanelStates?.();
    
    // DRS 관련 정보 계산
    getDRSInfo(circuitId).then(drsInfo => {
      setDrsZoneCount?.(drsInfo.drsZoneCount);
      setDrsDetectionCount?.(drsInfo.drsDetectionCount);
    }).catch(error => {
      console.error('Error calculating DRS info:', error);
      setDrsZoneCount?.(0);
      setDrsDetectionCount?.(0);
    });

    if (gentle) {
      // Gentle flyTo는 간단한 이동만
      const mobile = window.innerWidth < 640;
      map.current.flyTo({
        center: [circuit.location.lng, circuit.location.lat],
        zoom: mobile ? ZOOM_LEVELS.circuitView.mobile : ZOOM_LEVELS.circuitView.desktop,
        pitch: PITCH_ANGLES.circuit,
        speed: ANIMATION_SPEEDS.flyToGentle,
        curve: ANIMATION_SPEEDS.curve,
        essential: true
      });

      // flyTo 완료 시 글로브 스피너 재개
      map.current.once('moveend', () => {
        (globeSpinner?.current as { stopInteracting?: () => void })?.stopInteracting?.();
        setTimeout(() => setUserInteracting(false), 1000);
      });
    } else {
      // 일반 flyTo는 트랙 그리기 포함
      (globeSpinner?.current as { startInteracting?: () => void })?.startInteracting?.();
      setIsCircuitView?.(true);
      
      flyToCircuitWithTrack(map.current, circuit, undefined, () => {
        // 시네마틱 모드 토글 처리
      });
      
      // 트랙 애니메이션 상태 업데이트
      setIsTrackAnimating?.(true);
      setTimeout(() => {
        setIsTrackAnimating?.(false);
        setUserInteracting(false);
      }, 8000); // 트랙 애니메이션이 보통 6-7초 정도 걸리므로 8초로 설정
    }
  }, [
    map, 
    setUserInteracting, 
    globeSpinner, 
    onCircuitSelect,
    setIsCircuitView,
    setCurrentCircuit,
    setDrsZoneCount,
    setDrsDetectionCount,
    setIsTrackAnimating
  ]);

  // FlyTo 팀
  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const flyToTeam = useCallback((teamId: string) => {
    if (!map.current) return;

    const team = teamsData.teams.find(t => t.id === teamId);
    if (!team) return;


    setUserInteracting(true);
    const mobile = typeof window !== 'undefined' && window.innerWidth < 640;
    
    // 글로브 스피너 일시 중단
    (globeSpinner?.current as { startInteracting?: () => void })?.startInteracting?.();
    
    // 중앙화된 FlyTo 설정 사용
    const teamConfig = TEAM_FLYTO_CONFIGS[teamId];
    const teamHQ = [team.headquarters.lng, team.headquarters.lat] as [number, number];
    
    // 팀별 설정이 있으면 사용, 없으면 기본값 사용
    const config = mobile && teamConfig?.mobile 
      ? { ...DEFAULT_TEAM_FLYTO, ...teamConfig.mobile }
      : teamConfig?.desktop 
      ? { ...DEFAULT_TEAM_FLYTO, ...teamConfig.desktop }
      : DEFAULT_TEAM_FLYTO;
    
    const finalCenter = 'center' in config && config.center ? config.center : teamHQ;
      
    map.current.flyTo({
      center: finalCenter,
      zoom: config.zoom,
      pitch: config.pitch,
      bearing: config.bearing,
      speed: config.speed,
      curve: config.curve,
      duration: config.duration,
      essential: true
    });

    // flyTo 완료 시 글로브 스피너 재개
    map.current.once('moveend', () => {
      (globeSpinner?.current as { stopInteracting?: () => void })?.stopInteracting?.();
      setTimeout(() => setUserInteracting(false), 1000);
    });
  }, [map, setUserInteracting, globeSpinner]);

  // 뷰 리셋
  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const resetView = useCallback(() => {
    if (!map.current) return;

    setUserInteracting(true);
    const isPortrait = window.innerHeight > window.innerWidth;
    
    map.current.flyTo({
      center: [0, isPortrait ? 10 : 20],
      zoom: isPortrait ? 1.2 : 1.5,
      pitch: 0,
      bearing: 0,
      speed: ANIMATION_SPEEDS.flyToReset,
      curve: ANIMATION_SPEEDS.curve,
      essential: true
    });

    // flyTo 완료 시 글로브 스피너 재개
    map.current.once('moveend', () => {
      (globeSpinner?.current as { stopInteracting?: () => void })?.stopInteracting?.();
      setIsCircuitView?.(false);
      setTimeout(() => setUserInteracting(false), 1000);
    });
  }, [map, setUserInteracting, globeSpinner, setIsCircuitView]);

  return {
    flyToLocation,
    flyToCircuit,
    flyToTeam,
    resetView
  };
};