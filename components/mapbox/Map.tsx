'use client';

import {useEffect, useRef, useState, memo, forwardRef, useImperativeHandle} from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@/styles/circuit-marker.css';
import teamsData from '@/data/teams.json';
import circuitsData from '@/data/circuits.json';
import { useLanguage } from '@/contexts/LanguageContext';
import { TEAM_FLYTO_CONFIGS, DEFAULT_TEAM_FLYTO } from './config/teamFlyToConfig';

import {MapProps, MapAPI} from './types';
import {addAllCircuitsWithExtensions, findNextRace, cleanupSectorMarkers} from './utils/circuitManagerExtensions';
import { CircuitMarkerManager } from './managers/CircuitMarkerManager';
import { TeamMarkerManager } from './managers/TeamMarkerManager';
import CinematicModeButton from './controls/CinematicModeButton';
import ZoomScrollbar from './controls/ZoomScrollbar';
import CircuitInfoPanel from './controls/CircuitInfoPanel';
import { useMapInitialization } from './hooks/useMapInitialization';
import { useCinematicMode } from './hooks/useCinematicMode';
import { ZOOM_LEVELS, ANIMATION_SPEEDS, PITCH_ANGLES, ANIMATION_TIMINGS } from './constants';
import { flyToCircuitWithTrack } from './utils/animations/circuitAnimation';
import { trackManager } from './utils/map/trackManager';
import { ElevationTrackManager } from './track/elevation/ElevationTrackManager';
import { getDRSInfo } from './utils/data/dynamicSectorLoader';

// Mapbox 토큰 확인 및 설정
if (!process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN) {
  console.error('Mapbox access token is missing!');
}
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN!;

// cleanup 함수를 포함하는 마커 타입 - TeamMarkerManager로 이동됨
// interface MarkerWithCleanup {
//   marker: mapboxgl.Marker;
//   cleanup: () => void;
// }

const Map = forwardRef<MapAPI, MapProps>(({ onMarkerClick, onCinematicModeChange, onUserInteraction }, ref) => {
  const { language } = useLanguage();
  const mapContainer = useRef<HTMLDivElement>(null);
  // const markers = useRef<MarkerWithCleanup[]>([]); // No longer needed with TeamMarkerManager
  const circuitMarkerManager = useRef<CircuitMarkerManager | null>(null);
  const teamMarkerManager = useRef<TeamMarkerManager | null>(null);
  const [isCircuitView, setIsCircuitView] = useState(false);
  const isCircuitViewRef = useRef(false);
  const [mapInstance, setMapInstance] = useState<mapboxgl.Map | null>(null);
  
  // Circuit info panel states
  const [sectorInfoEnabled, setSectorInfoEnabled] = useState(true);
  const [drsInfoEnabled, setDRSInfoEnabled] = useState(true);
  const [elevationEnabled, setElevationEnabled] = useState(true);
  const [currentCircuit, setCurrentCircuit] = useState<any>(null);
  const [drsZoneCount, setDrsZoneCount] = useState<number>(0);
  const [drsDetectionCount, setDrsDetectionCount] = useState<number>(0);
  const [isTrackAnimating, setIsTrackAnimating] = useState(false);
  const isTrackAnimatingRef = useRef(isTrackAnimating);

  // isTrackAnimating 상태 변경 시 ref 업데이트
  useEffect(() => {
    isTrackAnimatingRef.current = isTrackAnimating;
  }, [isTrackAnimating]);

  // 패널 상태 초기화 함수
  const resetPanelStates = () => {
    setSectorInfoEnabled(true);
    setDRSInfoEnabled(true);
    setElevationEnabled(true);
  };

  // Custom hooks 사용
  const { map, globeSpinner } = useMapInitialization({ mapContainer, onUserInteraction });
  const { handleCinematicModeToggle } = useCinematicMode({ map, onCinematicModeChange });
  
  // Props를 ref로 저장하여 re-render 시에도 최신 값 유지
  const propsRef = useRef({ onMarkerClick, onCinematicModeChange });
  useEffect(() => {
    propsRef.current = { onMarkerClick, onCinematicModeChange };
  }, [onMarkerClick, onCinematicModeChange]);
  
  // isCircuitView 값을 ref와 동기화
  useEffect(() => {
    isCircuitViewRef.current = isCircuitView;
  }, [isCircuitView]);


  // Map API를 부모 컴포넌트에 노출
  useImperativeHandle(ref, () => ({
    flyToLocation: (coordinates: [number, number], zoom: number = 15) => {
      map.current?.flyTo({
        center: coordinates,
        zoom,
        speed: ANIMATION_SPEEDS.flyTo,
        curve: ANIMATION_SPEEDS.curve,
        essential: true
      });
    },
    
    flyToCircuit: (circuitId: string, gentle: boolean = false) => {
      if (!map.current) {
        return;
      }

      const circuit = circuitsData.circuits.find(c => c.id === circuitId);
      if (!circuit) {
        return;
      }

      // 현재 서킷 정보 업데이트
      setCurrentCircuit(circuit);
      
      // 패널 상태 초기화 (새로운 서킷 선택 시)
      resetPanelStates();
      
      // DRS 관련 정보 계산
      getDRSInfo(circuitId).then(drsInfo => {
        setDrsZoneCount(drsInfo.drsZoneCount);
        setDrsDetectionCount(drsInfo.drsDetectionCount);
      }).catch(error => {
        console.error('Error calculating DRS info:', error);
        setDrsZoneCount(0);
        setDrsDetectionCount(0);
      });

      if (gentle) {
        // gentle flyTo는 간단한 이동만
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
          globeSpinner.current?.stopInteracting();
        });
      } else {
        // 일반 flyTo는 트랙 그리기 포함
        globeSpinner.current?.startInteracting();
        setIsCircuitView(true);
        setIsTrackAnimating(true);
        flyToCircuitWithTrack(map.current, circuit, undefined, (enabled: boolean) => {
          // 시네마틱 모드 토글 콜백 처리
          if (propsRef.current.onCinematicModeChange) {
            propsRef.current.onCinematicModeChange(enabled);
          }
        });
        
        // 트랙 애니메이션 완료 후 플래그 리셋
        setTimeout(() => {
          setIsTrackAnimating(false);
        }, 8000); // 트랙 애니메이션이 보통 6-7초 정도 걸리므로 8초로 설정
      }
    },
    
    flyToTeam: (teamId: string) => {
      if (!map.current) return;

      const team = teamsData.teams.find(t => t.id === teamId);
      if (team) {
        const mobile = typeof window !== 'undefined' && window.innerWidth < 640;
        // 글로브 스피너 일시 중단
        globeSpinner.current?.startInteracting();
        
        // 중앙화된 FlyTo 설정 사용
        const teamConfig = TEAM_FLYTO_CONFIGS[teamId];
        const teamHQ = [team.headquarters.lng, team.headquarters.lat] as [number, number];
        
        // 팀별 설정이 있으면 사용, 없으면 기본값 사용
        const config = mobile && teamConfig?.mobile 
          ? { ...DEFAULT_TEAM_FLYTO, ...teamConfig.mobile }
          : teamConfig?.desktop 
          ? { ...DEFAULT_TEAM_FLYTO, ...teamConfig.desktop }
          : DEFAULT_TEAM_FLYTO;
          
        map.current.flyTo({
          center: 'center' in config && config.center ? config.center : teamHQ,
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
          globeSpinner.current?.stopInteracting();
        });
      }
    },
    
    getCurrentBounds: () => {
      return map.current?.getBounds() || null;
    },
    
    getCurrentZoom: () => {
      return map.current?.getZoom() || 0;
    },
    
    getCurrentCenter: () => {
      const center = map.current?.getCenter();
      return center ? [center.lng, center.lat] as [number, number] : null;
    },
    
    resetView: () => {
      map.current?.flyTo({
        center: [0, 0],
        zoom: 2,
        pitch: PITCH_ANGLES.default,
        bearing: 0,
        speed: ANIMATION_SPEEDS.flyToReset,
        curve: ANIMATION_SPEEDS.curve,
        essential: true
      });
    },
    
    toggleCinematicMode: handleCinematicModeToggle
  }), [map, globeSpinner, setIsCircuitView, handleCinematicModeToggle]);

  // 마커 추가 및 지도 상태 업데이트
  useEffect(() => {
    if (!map.current) return;

    // 맵이 로드되었는지 확인
    const setupMap = () => {
      if (!map.current) return;

      // map instance를 state에 저장
      setMapInstance(map.current);

      // TrackManager 초기화
      trackManager.setMap(map.current);

      // CircuitMarkerManager 초기화
      if (!circuitMarkerManager.current) {
        circuitMarkerManager.current = new CircuitMarkerManager();
        circuitMarkerManager.current.setMap(map.current);
        if (propsRef.current.onMarkerClick) {
          circuitMarkerManager.current.setOnMarkerClick(propsRef.current.onMarkerClick);
        }
      }

      // TeamMarkerManager 초기화
      if (!teamMarkerManager.current) {
        teamMarkerManager.current = new TeamMarkerManager();
        teamMarkerManager.current.setMap(map.current);
        teamMarkerManager.current.setLanguage(language);
        if (propsRef.current.onMarkerClick) {
          teamMarkerManager.current.setOnMarkerClick(propsRef.current.onMarkerClick);
        }
      }

      // 줌 레벨 변경 감지 핸들러
      
      const handleZoomChange = () => {
        if (!map.current) return;
        const zoom = map.current.getZoom();
        
        // 줌 레벨이 10 이하로 떨어지면 서킷 뷰가 아님
        // 단, 트랙 애니메이션 중이 아니고 현재 서킷 뷰 상태일 때만 리셋
        if (zoom <= ZOOM_LEVELS.region && isCircuitViewRef.current && !isTrackAnimatingRef.current) {
          setIsCircuitView(false);
          // 줌아웃 시 패널 상태 초기화
          resetPanelStates();
          setCurrentCircuit(null);
          setDrsZoneCount(0);
          setDrsDetectionCount(0);
        }
        
      };

      // 이벤트 리스너 등록
      map.current.on('zoom', handleZoomChange);

      // 마커 추가
      setTimeout(() => {
        if (!map.current) return;
        
        // 팀 마커 추가 - TeamMarkerManager 사용
        if (teamMarkerManager.current) {
          teamMarkerManager.current.addAllTeamMarkers(teamsData.teams);
        }
        
        // 다음 레이스 찾기
        const nextRace = findNextRace();
        
        // 모든 서킷 마커 추가 (CircuitMarkerManager 사용)
        if (circuitMarkerManager.current) {
          addAllCircuitsWithExtensions(circuitMarkerManager.current, nextRace || undefined, language);
        }
        
      }, ANIMATION_TIMINGS.MARKER_DELAY);
    };

    if (map.current.loaded()) {
      setupMap();
    } else {
      map.current.once('load', setupMap);
    }

    // cleanup 함수 - cleanup 메서드 호출
    return () => {
      // 팀 마커 매니저 cleanup
      if (teamMarkerManager.current) {
        teamMarkerManager.current.cleanup();
        teamMarkerManager.current = null;
      }

      // 석터 마커도 정리
      cleanupSectorMarkers();

      // 서킷 마커 매니저 cleanup
      if (circuitMarkerManager.current) {
        circuitMarkerManager.current.cleanup();
        circuitMarkerManager.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 초기 설정은 한 번만 실행

  // 언어 변경 시 마커 텍스트만 업데이트
  useEffect(() => {
    if (!map.current) return;

    // 팀 마커 매니저 언어 업데이트
    if (teamMarkerManager.current) {
      teamMarkerManager.current.updateLanguage(language);
    }

    // 서킷 마커 매니저도 정리
    if (circuitMarkerManager.current) {
      circuitMarkerManager.current.cleanup();
      circuitMarkerManager.current = null;
    }

    // 새로운 언어로 마커 재생성 (부드러운 전환을 위해 짧은 딘레이)
    const timeoutId = setTimeout(() => {
      if (!map.current) return;

      // CircuitMarkerManager 재초기화
      if (!circuitMarkerManager.current) {
        circuitMarkerManager.current = new CircuitMarkerManager();
        circuitMarkerManager.current.setMap(map.current);
        if (propsRef.current.onMarkerClick) {
          circuitMarkerManager.current.setOnMarkerClick(propsRef.current.onMarkerClick);
        }
      }

      // 팀 마커는 이미 updateLanguage로 처리됨

      // 다음 레이스 찾기
      const nextRace = findNextRace();

      // 모든 서킷 마커 추가 (CircuitMarkerManager 사용)
      if (circuitMarkerManager.current) {
        addAllCircuitsWithExtensions(circuitMarkerManager.current, nextRace || undefined, language);
      }

    }, ANIMATION_TIMINGS.LANGUAGE_CHANGE_DELAY); // 최소한의 딘레이로 빠른 업데이트

    return () => clearTimeout(timeoutId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]); // language가 변경될 때만 마커 재생성 (map은 ref이므로 의존성에서 제외)

  // Sector info toggle handlers
  const handleToggleSectorInfo = (enabled: boolean) => {
    setSectorInfoEnabled(enabled);

    // 섹터 마커 토글
    window.dispatchEvent(new CustomEvent('toggleSectorMarkers', {
      detail: { enabled }
    }));

    // 섹터 트랙 색상 토글
    window.dispatchEvent(new CustomEvent('toggleSectorTrackColors', {
      detail: { enabled }
    }));
  };

  // DRS info toggle handlers
  const handleToggleDRSInfo = (enabled: boolean) => {
    setDRSInfoEnabled(enabled);

    // DRS Detection 마커 토글
    window.dispatchEvent(new CustomEvent('toggleDRSDetectionMarkers', {
      detail: { enabled }
    }));

    // Speed Trap 마커 토글
    window.dispatchEvent(new CustomEvent('toggleSpeedTrapMarkers', {
      detail: { enabled }
    }));

    // DRS 존 레이어 및 애니메이션 토글
    window.dispatchEvent(new CustomEvent('toggleDRSZoneLayers', {
      detail: { enabled }
    }));
  };

  // Elevation toggle handler
  const handleToggleElevation = (enabled: boolean) => {
    setElevationEnabled(enabled);

    // 현재 표시되고 있는 모든 서킷의 3D 트랙 토글
    if (map.current) {
      // trackManager에서 활성화된 트랙 ID들을 가져와서 각각에 대해 토글
      const trackSources = trackManager.getAllTrackSources();
      trackSources.forEach(sourceId => {
        const trackId = sourceId.replace('-track', '');
        ElevationTrackManager.toggle3DElevationTrack(map.current!, `${trackId}-track`, enabled);
      });
    }
  };

  return (
    <>
      <div ref={mapContainer} className="w-full h-full" />
      
      {/* Circuit Info Panel - 항상 표시 (테스트용) */}
      <CircuitInfoPanel
        isVisible={true}
        onToggleSectorInfo={handleToggleSectorInfo}
        onToggleDRSInfo={handleToggleDRSInfo}
        onToggleElevation={handleToggleElevation}
        sectorInfoEnabled={sectorInfoEnabled}
        drsInfoEnabled={drsInfoEnabled}
        elevationEnabled={elevationEnabled}
        currentCircuit={currentCircuit}
        drsZoneCount={drsZoneCount}
        drsDetectionCount={drsDetectionCount}
      />

      <CinematicModeButton
        isCircuitView={isCircuitView}
        onToggleAction={handleCinematicModeToggle}
      />
      
      {/* 모바일 줌 스크롤바 */}
      <ZoomScrollbar map={mapInstance} className="sm:hidden" />
    </>
  );
});

Map.displayName = 'Map';

export default memo(Map);