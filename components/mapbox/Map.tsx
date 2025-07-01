'use client';

import {useEffect, useRef, useState, memo, forwardRef, useImperativeHandle} from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import teamsData from '@/data/teams.json';
import circuitsData from '@/data/circuits.json';
import { useLanguage } from '@/contexts/LanguageContext';

import {MapProps, MapAPI} from './types';
import {addAllCircuits, findNextRace} from './markers/circuit/CircuitMarkerManager';
import {addAllTeams} from './markers/team/TeamMarkerManager';
import CinematicModeButton from './controls/CinematicModeButton';
import ZoomScrollbar from './controls/ZoomScrollbar';
import { useMapInitialization } from './hooks/useMapInitialization';
import { useCinematicMode } from './hooks/useCinematicMode';
import { ZOOM_LEVELS, TIMEOUTS, ANIMATION_SPEEDS, PITCH_ANGLES, SPECIAL_COORDINATES } from './constants';
import { flyToCircuitWithTrack } from './utils/animations/circuitAnimation';

// Mapbox 토큰 확인 및 설정
if (!process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN) {
  console.error('Mapbox access token is missing!');
}
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN!;

// cleanup 함수를 포함하는 마커 타입
interface MarkerWithCleanup {
  marker: mapboxgl.Marker;
  cleanup: () => void;
}

const Map = forwardRef<MapAPI, MapProps>(({ onMarkerClick, onCinematicModeChange, onUserInteraction }, ref) => {
  const { language } = useLanguage();
  const mapContainer = useRef<HTMLDivElement>(null);
  const markers = useRef<MarkerWithCleanup[]>([]);
  const [isCircuitView, setIsCircuitView] = useState(false);
  const isCircuitViewRef = useRef(false);
  const [mapInstance, setMapInstance] = useState<mapboxgl.Map | null>(null);
  
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
        flyToCircuitWithTrack(map.current, circuit, undefined, (enabled: boolean) => {
          // 시네마틱 모드 토글 콜백 처리
          if (propsRef.current.onCinematicModeChange) {
            propsRef.current.onCinematicModeChange(enabled);
          }
        });
      }
    },
    
    flyToTeam: (teamId: string) => {
      if (!map.current) return;

      const team = teamsData.teams.find(t => t.id === teamId);
      if (team) {
        const mobile = typeof window !== 'undefined' && window.innerWidth < 640;
        // 글로브 스피너 일시 중단
        globeSpinner.current?.startInteracting();
        
        // Red Bull만 특별한 좌표 사용, 나머지는 공통 설정
        const center = teamId === 'red-bull' 
          ? SPECIAL_COORDINATES.redBull
          : [team.headquarters.lng, team.headquarters.lat] as [number, number];
          
        map.current.flyTo({
          center,
          zoom: mobile ? ZOOM_LEVELS.teamHQ.mobile : ZOOM_LEVELS.teamHQ.desktop,
          bearing: 0,
          pitch: PITCH_ANGLES.teamHQ,
          speed: ANIMATION_SPEEDS.flyTo,
          curve: ANIMATION_SPEEDS.curve,
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


      // 줌 레벨 변경 감지 핸들러
      const handleZoomChange = () => {
        if (!map.current) return;
        const zoom = map.current.getZoom();
        
        // 줌 레벨이 10 이하로 떨어지면 서킷 뷰가 아님
        if (zoom <= ZOOM_LEVELS.region) {
          setIsCircuitView(false);
        }
        
      };

      // 이벤트 리스너 등록
      map.current.on('zoom', handleZoomChange);

      // 마커 추가
      setTimeout(() => {
        if (!map.current) return;
        
        // 팀 마커 추가 - 나선형 배치 시스템 사용
        addAllTeams({
          map: map.current,
          onMarkerClick: propsRef.current.onMarkerClick,
          markersWithCleanup: markers.current,
          language
        });
        
        // 다음 레이스 찾기
        const nextRace = findNextRace();
        
        // 모든 서킷 마커 추가
        addAllCircuits({
          map: map.current,
          onMarkerClick: propsRef.current.onMarkerClick,
          nextRaceId: nextRace || undefined,
          markersWithCleanup: markers.current,
          language
        });
        
      }, TIMEOUTS.markerDelay);
    };

    if (map.current.loaded()) {
      setupMap();
    } else {
      map.current.once('load', setupMap);
    }

    // cleanup 함수 - cleanup 메서드 호출
    return () => {
      markers.current.forEach(({ cleanup }) => {
        cleanup();
      });
      markers.current = [];
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 초기 설정은 한 번만 실행

  // 언어 변경 시 마커 텍스트만 업데이트
  useEffect(() => {
    if (!map.current || markers.current.length === 0) return;

    // 기존 마커들을 제거하고 새로운 언어로 재생성
    markers.current.forEach(({ cleanup }) => {
      cleanup();
    });
    markers.current = [];

    // 새로운 언어로 마커 재생성 (부드러운 전환을 위해 짧은 딘레이)
    const timeoutId = setTimeout(() => {
      if (!map.current) return;
      
      // 팀 마커 추가
      addAllTeams({
        map: map.current,
        onMarkerClick: propsRef.current.onMarkerClick,
        markersWithCleanup: markers.current,
        language
      });
      
      // 다음 레이스 찾기
      const nextRace = findNextRace();
      
      // 모든 서킷 마커 추가
      addAllCircuits({
        map: map.current,
        onMarkerClick: propsRef.current.onMarkerClick,
        nextRaceId: nextRace || undefined,
        markersWithCleanup: markers.current,
        language
      });
      
    }, 50); // 최소한의 딘레이로 빠른 업데이트

    return () => clearTimeout(timeoutId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]); // language가 변경될 때만 마커 재생성 (map은 ref이므로 의존성에서 제외)

  return (
    <>
      <div ref={mapContainer} className="w-full h-full" />
      
      
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