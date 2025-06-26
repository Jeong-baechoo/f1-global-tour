'use client';

import {useEffect, useRef, useState, memo, forwardRef, useImperativeHandle} from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import teamsData from '@/data/teams.json';
import circuitsData from '@/data/circuits.json';

import {MapProps, MapAPI} from './types';
import {addAllCircuits, findNextRace} from './markers/circuit/CircuitMarkerManager';
import {addAllTeams} from './markers/team/TeamMarkerManager';
import CinematicModeButton from './controls/CinematicModeButton';
import ZoomScrollbar from './controls/ZoomScrollbar';
import { useMapInitialization } from './hooks/useMapInitialization';
import { useCinematicMode } from './hooks/useCinematicMode';
import { ZOOM_LEVELS, TIMEOUTS, ANIMATION_SPEEDS, PITCH_ANGLES, SPECIAL_COORDINATES, CIRCUIT_MARKER_VISIBILITY } from './constants';
import { flyToCircuitWithTrack } from './utils/animations/circuitAnimation';

// Mapbox 토큰 확인 및 설정
if (!process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN) {
  console.error('Mapbox access token is missing!');
}
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN!;

const Map = forwardRef<MapAPI, MapProps>(({ onMarkerClick, onCinematicModeChange, onUserInteraction }, ref) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  const [isCircuitView, setIsCircuitView] = useState(false);
  const isCircuitViewRef = useRef(false);
  const [mapInstance, setMapInstance] = useState<mapboxgl.Map | null>(null);
  const [mapDebugInfo, setMapDebugInfo] = useState({
    center: [0, 0] as [number, number],
    zoom: 0,
    bearing: 0,
    pitch: 0
  });
  
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
        const mobile = window.innerWidth < 640;
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

      // 지도 상태 업데이트 함수
      const updateMapDebugInfo = () => {
        if (map.current) {
          const center = map.current.getCenter();
          setMapDebugInfo({
            center: [Number(center.lng.toFixed(4)), Number(center.lat.toFixed(4))],
            zoom: Number(map.current.getZoom().toFixed(2)),
            bearing: Number(map.current.getBearing().toFixed(1)),
            pitch: Number(map.current.getPitch().toFixed(1))
          });
        }
      };

      // 줌 레벨 변경 감지 핸들러
      const handleZoomChange = () => {
        if (!map.current) return;
        const zoom = map.current.getZoom();
        
        // 줌 레벨이 10 이하로 떨어지면 서킷 뷰가 아님
        if (zoom <= ZOOM_LEVELS.region) {
          setIsCircuitView(false);
        }
        
        // 서킷 마커 페이드 로직 (단순화)
        markers.current.forEach(marker => {
          const element = marker.getElement();
          
          if (element.classList.contains('circuit-marker')) {
            const show = zoom < 10;
            element.style.opacity = show ? '1' : '0';
            element.style.display = show ? 'block' : 'none';
            element.style.pointerEvents = show ? 'auto' : 'none';
          }
        });
      };

      // 이벤트 리스너 등록
      map.current.on('zoom', handleZoomChange);
      map.current.on('move', updateMapDebugInfo);
      map.current.on('rotate', updateMapDebugInfo);
      map.current.on('pitch', updateMapDebugInfo);
      
      // 초기 상태 설정
      updateMapDebugInfo();

      // 마커 추가
      setTimeout(() => {
        if (!map.current) return;
        
        // 팀 마커 추가 - 나선형 배치 시스템 사용
        addAllTeams({
          map: map.current,
          onMarkerClick: propsRef.current.onMarkerClick,
          markers: markers.current
        });
        
        // 다음 레이스 찾기
        const nextRace = findNextRace();
        
        // 모든 서킷 마커 추가
        addAllCircuits({
          map: map.current,
          onMarkerClick: propsRef.current.onMarkerClick,
          nextRaceId: nextRace?.id,
          markers: markers.current
        });
        
        // 초기 줌 레벨에 따른 마커 표시/숨김
        const initialZoom = map.current.getZoom();
        markers.current.forEach(marker => {
          const element = marker.getElement();
          if (element && element.classList.contains('circuit-marker')) {
            const markerContent = element.firstElementChild as HTMLElement;
            
            element.style.transition = 'opacity 0.15s ease-out';
            if (markerContent) {
              markerContent.style.transition = 'opacity 0.15s ease-out';
            }
            
            // 줌 레벨에 따른 opacity 계산
            let opacity = 1;
            if (initialZoom >= CIRCUIT_MARKER_VISIBILITY.startFade) {
              if (initialZoom >= CIRCUIT_MARKER_VISIBILITY.completelyHidden) {
                opacity = 0;
              } else {
                // startFade와 completelyHidden 사이에서 선형 보간
                const fadeRange = CIRCUIT_MARKER_VISIBILITY.completelyHidden - CIRCUIT_MARKER_VISIBILITY.startFade;
                opacity = 1 - ((initialZoom - CIRCUIT_MARKER_VISIBILITY.startFade) / fadeRange);
              }
            }
            
            element.style.opacity = opacity.toString();
            if (markerContent) {
              markerContent.style.opacity = opacity.toString();
            }
            
            if (opacity > 0) {
              element.style.display = 'block';
              element.style.pointerEvents = opacity > CIRCUIT_MARKER_VISIBILITY.minOpacityForClick ? 'auto' : 'none';
            } else {
              element.style.display = 'none';
              element.style.pointerEvents = 'none';
            }
          }
        });
      }, TIMEOUTS.markerDelay);
    };

    if (map.current.loaded()) {
      setupMap();
    } else {
      map.current.once('load', setupMap);
    }

    // cleanup 함수
    return () => {
      markers.current.forEach(marker => {
        marker.remove();
      });
      markers.current = [];
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 빈 의존성 배열 - 마커는 한 번만 생성

  return (
    <>
      <div ref={mapContainer} className="w-full h-full" />
      
      {/* 지도 디버그 정보 */}
      <div className="absolute top-4 left-4 bg-black/80 text-white p-3 rounded-lg text-xs font-mono z-50">
        <div className="space-y-1">
          <div>중심: {mapDebugInfo.center[0]}, {mapDebugInfo.center[1]}</div>
          <div>줌: {mapDebugInfo.zoom}</div>
          <div>방향각: {mapDebugInfo.bearing}°</div>
          <div>틸트: {mapDebugInfo.pitch}°</div>
        </div>
      </div>
      
      <CinematicModeButton
        isCircuitView={isCircuitView}
        onToggle={handleCinematicModeToggle}
      />
      
      {/* 모바일 줌 스크롤바 */}
      <ZoomScrollbar map={mapInstance} className="sm:hidden" />
    </>
  );
});

Map.displayName = 'Map';

export default memo(Map);