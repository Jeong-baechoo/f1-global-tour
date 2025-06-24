'use client';

import {useCallback, useEffect, useRef, useState} from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import teamsData from '@/data/teams.json';
import circuitsData from '@/data/circuits.json';

import {MapAPI, MapProps} from './types';
import {FOG_CONFIG, LAYERS_TO_REMOVE, MAP_CONFIG, SKY_LAYER_CONFIG} from './constants';
import {createGlobeSpinner} from './utils/animations';
import {createRedBullMarker} from './markers/RedBullMarker';
import {addAllCircuits, findNextRace} from './markers/addAllCircuits';
import {flyToCircuitWithTrack} from './utils/circuitHelpers';
import CinematicModeButton from './CinematicModeButton';

// Circuit rotation handlers type
interface CircuitRotationHandlers {
  dragStart: () => void;
  dragEnd: () => void;
  zoomStart: () => void;
  zoomEnd: () => void;
  cleanup: () => void;
  rotation?: {
    stopRotation: () => void;
    startRotation: () => void;
    enableCinematicMode: () => void;
    disableCinematicMode: () => void;
    toggleCinematicMode: () => boolean;
    isCinematicModeEnabled: () => boolean;
    cleanup: () => void;
  };
  onCinematicModeToggle?: (enabled: boolean) => void;
}

// Mapbox 토큰 확인 및 설정
if (!process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN) {
  console.error('Mapbox access token is missing!');
}
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN!;

export default function Map({ onMarkerClick, onMapReady, onCinematicModeChange }: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  const globeSpinner = useRef<ReturnType<typeof createGlobeSpinner> | null>(null);
  const [isCircuitView, setIsCircuitView] = useState(false);
  const [mapDebugInfo, setMapDebugInfo] = useState({
    center: [0, 0] as [number, number],
    zoom: 0,
    bearing: 0,
    pitch: 0
  });
  
  // Props를 ref로 저장하여 re-render 시에도 최신 값 유지
  const propsRef = useRef({ onMarkerClick, onMapReady, onCinematicModeChange });
  useEffect(() => {
    propsRef.current = { onMarkerClick, onMapReady, onCinematicModeChange };
  }, [onMarkerClick, onMapReady, onCinematicModeChange]);

  // 시네마틱 모드 토글 핸들러
  const handleCinematicModeToggle = useCallback((): boolean => {
    if (!map.current) return false;

    const mapWithHandlers = map.current as mapboxgl.Map & {
      _circuitRotationHandlers?: CircuitRotationHandlers;
    };
    const handlers = mapWithHandlers._circuitRotationHandlers;

    if (handlers?.rotation) {
      const isEnabled = handlers.rotation.toggleCinematicMode();
      if (handlers.onCinematicModeToggle) {
        handlers.onCinematicModeToggle(isEnabled);
      }
      // 상위 컴포넌트로 상태 전달
      if (propsRef.current.onCinematicModeChange) {
        propsRef.current.onCinematicModeChange(isEnabled);
      }
      return isEnabled;
    }
    return false;
  }, []);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // 맵 초기화
    const isMobile = window.innerWidth < 640;
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      ...MAP_CONFIG,
      zoom: isMobile ? MAP_CONFIG.zoom : MAP_CONFIG.zoom // 초기 줌은 동일하게 유지
    });

    // 내비게이션 컨트롤 추가 - 모바일에서는 더 작게
    map.current.addControl(new mapboxgl.NavigationControl({
      showCompass: !isMobile, // 모바일에서는 컴패스 숨김
      showZoom: true,
      visualizePitch: !isMobile // 모바일에서는 피치 컨트롤 숨김
    }), 'top-right');

    // 글로브 회전 애니메이션 설정
    globeSpinner.current = createGlobeSpinner(map.current);

    // 이벤트 리스너 등록 - 실제 사용자 조작만 감지
    map.current.on('dragstart', globeSpinner.current.startInteracting);
    map.current.on('dragend', globeSpinner.current.stopInteracting);
    map.current.on('pitchstart', globeSpinner.current.startInteracting);
    map.current.on('pitchend', globeSpinner.current.stopInteracting);
    map.current.on('rotatestart', globeSpinner.current.startInteracting);
    map.current.on('rotateend', globeSpinner.current.stopInteracting);
    map.current.on('zoomstart', globeSpinner.current.startInteracting);
    map.current.on('zoomend', globeSpinner.current.stopInteracting);

    // 터치 이벤트만 추가 (마우스 휠은 제거)
    map.current.on('touchstart', globeSpinner.current.startInteracting);
    map.current.on('touchend', globeSpinner.current.stopInteracting);

    // flyTo API 정의
    const mapAPI: MapAPI = {
      flyToCircuit: (circuitId: string, gentle: boolean = false) => {
        if (!map.current) return;

        const circuit = circuitsData.circuits.find(c => c.id === circuitId);
        if (!circuit) return;

        if (gentle) {
          // gentle flyTo는 간단한 이동만
          const mobile = window.innerWidth < 640;
          map.current.flyTo({
            center: [circuit.location.lng, circuit.location.lat],
            zoom: mobile ? 2 : 6, // 모바일: 2, 데스크톱: 6
            pitch: 30,
            speed: 0.8,
            curve: 1,
            essential: true
          });

          // flyTo 완료 시 글로브 스피너 재개
          map.current.once('moveend', () => {
            globeSpinner.current?.stopInteracting();
          });
        } else {
          // 일반 flyTo는 트랙 그리기 포함
          // 글로브 스피너 일시 중단
          globeSpinner.current?.startInteracting();
          setIsCircuitView(true);
          // circuitId를 직접 사용하여 클로저로 캡처
          flyToCircuitWithTrack(map.current, circuit, undefined, (enabled) => {
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
          map.current.flyTo({
            center: [team.headquarters.lng, team.headquarters.lat],
            zoom: mobile ? 15 : 18, // 모바일: 15, 데스크톱: 18
            pitch: 45,
            speed: 0.6,
            curve: 1,
            essential: true
          });

          // flyTo 완료 시 글로브 스피너 재개
          map.current.once('moveend', () => {
            globeSpinner.current?.stopInteracting();
          });
        }
      },
      toggleCinematicMode: () => {
        return handleCinematicModeToggle();
      }
    };


    // 맵 로드 완료 이벤트
    map.current.on('load', () => {
      if (propsRef.current.onMapReady) {
        propsRef.current.onMapReady(mapAPI);
      }

      // 대기 효과 및 스카이 레이어 추가
      map.current!.setFog(FOG_CONFIG);
      map.current!.addLayer(SKY_LAYER_CONFIG);

      // 3D 터레인 추가
      map.current!.addSource('mapbox-dem', {
        'type': 'raster-dem',
        'url': 'mapbox://mapbox.mapbox-terrain-dem-v1',
        'tileSize': 512,
        'maxzoom': 14
      });

      // 터레인 활성화 (초기값)
      map.current!.setTerrain({
        'source': 'mapbox-dem',
        'exaggeration': 1.8
      });

      // 줌 레벨에 따른 터레인 exaggeration 동적 조정
      const updateTerrainExaggeration = () => {
        const zoom = map.current!.getZoom();
        let exaggeration: number;

        if (zoom < 5) {
          // 글로브 뷰: 지형적 특징 강조
          exaggeration = 2.0;
        } else if (zoom < 10) {
          // 중간 거리: 점진적 감소
          exaggeration = 2.0 - ((zoom - 5) * 0.1);
        } else {
          // 가까운 거리: 자연스러운 표현
          exaggeration = 1.5;
        }

        map.current!.setTerrain({
          'source': 'mapbox-dem',
          'exaggeration': exaggeration
        });
      };

      // 줌 이벤트에 터레인 업데이트 연결
      map.current!.on('zoom', updateTerrainExaggeration);

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

      // 지도 상태 변경 이벤트 리스너
      map.current!.on('move', updateMapDebugInfo);
      map.current!.on('zoom', updateMapDebugInfo);
      map.current!.on('rotate', updateMapDebugInfo);
      map.current!.on('pitch', updateMapDebugInfo);
      
      // 초기 상태 설정
      updateMapDebugInfo();

      // 불필요한 레이어 제거
      const style = map.current!.getStyle();
      if (style && style.layers) {
        style.layers.forEach(layer => {
          if (LAYERS_TO_REMOVE.some(pattern => layer.id.includes(pattern))) {
            try {
              map.current!.removeLayer(layer.id);
            } catch {
              // 레이어가 이미 제거된 경우 무시
            }
          }
        });
      }

      // 마커 추가
      setTimeout(() => {
        addMarkers();
      }, 100);
    });

    // 마커 추가 함수
    const addMarkers = () => {
      if (!map.current) return;
      
      // 레드불 레이싱 마커
      const redBullTeam = teamsData.teams.find(team => team.id === 'red-bull');
      if (redBullTeam) {
        const redBullMarker = createRedBullMarker({
          map: map.current,
          team: redBullTeam,
          onMarkerClick: propsRef.current.onMarkerClick
        });
        markers.current.push(redBullMarker);
      }

      // 다음 레이스 찾기
      const nextRace = findNextRace();

      // 모든 서킷 마커 추가
      addAllCircuits({
        map: map.current,
        onMarkerClick: propsRef.current.onMarkerClick,
        nextRaceId: nextRace.id,
        markers: markers.current
      });
    };

    // 줌 레벨 변경 감지 핸들러 등록
    const handleZoomChange = () => {
      const zoom = map.current!.getZoom();
      // 줌 레벨이 10 이하로 떨어지면 서킷 뷰가 아님
      if (zoom <= 10) {
        setIsCircuitView(false);
      }
    };

    map.current!.on('zoom', handleZoomChange);

    // cleanup 함수
    return () => {
      globeSpinner.current?.cleanup();

      markers.current.forEach(marker => {
        marker.remove();
      });
      markers.current = [];

      // 이벤트 리스너는 맵 제거 시 자동으로 정리됨
    };
  }, []); // 빈 의존성 배열로 변경하여 맵이 한 번만 초기화되도록 함

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
    </>
  );
}
