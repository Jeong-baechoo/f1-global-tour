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
import {createFerrariMarker} from './markers/FerrariMarker';
import {createMercedesMarker} from './markers/MercedesMarker';
import {createMcLarenMarker} from './markers/McLarenMarker';
import {createAstonMartinMarker} from './markers/AstonMartinMarker';
import {createAlpineMarker} from './markers/AlpineMarker';
import {createHaasMarker} from './markers/HaasMarker';
import {createRacingBullsMarker} from './markers/RacingBullsMarker';
import {createWilliamsMarker} from './markers/WilliamsMarker';
import {createSauberMarker} from './markers/SauberMarker';
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
const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
if (!mapboxToken) {
  console.error('Mapbox access token is missing! Check environment variables.');
} else {
  console.log('[Map] Mapbox token loaded successfully');
}
mapboxgl.accessToken = mapboxToken || '';

export default function Map({ onMarkerClick, onMapReady, onCinematicModeChange, onUserInteraction }: MapProps) {
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
      if (onCinematicModeChange) {
        onCinematicModeChange(isEnabled);
      }
      return isEnabled;
    }
    return false;
  }, [onCinematicModeChange]);

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

    // 사용자 상호작용 감지 함수
    const handleUserInteraction = () => {
      if (onUserInteraction) {
        onUserInteraction();
      }
    };

    // 이벤트 리스너 등록 - 실제 사용자 조작만 감지
    map.current.on('dragstart', () => {
      globeSpinner.current?.startInteracting();
      handleUserInteraction();
    });
    map.current.on('dragend', globeSpinner.current.stopInteracting);
    map.current.on('pitchstart', () => {
      globeSpinner.current?.startInteracting();
      handleUserInteraction();
    });
    map.current.on('pitchend', globeSpinner.current.stopInteracting);
    map.current.on('rotatestart', () => {
      globeSpinner.current?.startInteracting();
      handleUserInteraction();
    });
    map.current.on('rotateend', globeSpinner.current.stopInteracting);
    map.current.on('zoomstart', () => {
      globeSpinner.current?.startInteracting();
      handleUserInteraction();
    });
    map.current.on('zoomend', globeSpinner.current.stopInteracting);

    // 터치 이벤트만 추가 (마우스 휠은 제거)
    map.current.on('touchstart', () => {
      globeSpinner.current?.startInteracting();
      handleUserInteraction();
    });
    map.current.on('touchend', globeSpinner.current.stopInteracting);

    // 지도 클릭 시에도 사용자 상호작용으로 처리
    map.current.on('click', handleUserInteraction);

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
            if (onCinematicModeChange) {
              onCinematicModeChange(enabled);
            }
          });
        }
      },
      flyToTeam: (teamId: string) => {
        if (!map.current) return;

        const team = teamsData.teams.find(t => t.id === teamId);
        if (team) {
          // 글로브 스피너 일시 중단
          globeSpinner.current?.startInteracting();
          
          let flyToOptions;
          if (teamId === 'red-bull') {
            flyToOptions = {
              center: [-0.689, 52.0092] as [number, number],
              zoom: 15.68,
              bearing: 0,
              pitch: 45,
              speed: 0.6,
              curve: 1,
              essential: true
            };
          } else if (teamId === 'ferrari') {
            flyToOptions = {
              center: [team.headquarters.lng, team.headquarters.lat] as [number, number],
              zoom: 15.68,
              bearing: 0,
              pitch: 45,
              speed: 0.6,
              curve: 1,
              essential: true
            };
          } else if (teamId === 'mercedes') {
            flyToOptions = {
              center: [team.headquarters.lng, team.headquarters.lat] as [number, number],
              zoom: 15.68,
              bearing: 0,
              pitch: 45,
              speed: 0.6,
              curve: 1,
              essential: true
            };
          } else if (teamId === 'mclaren') {
            flyToOptions = {
              center: [team.headquarters.lng, team.headquarters.lat] as [number, number],
              zoom: 15.68,
              bearing: 0,
              pitch: 45,
              speed: 0.6,
              curve: 1,
              essential: true
            };
          } else if (teamId === 'aston-martin') {
            flyToOptions = {
              center: [team.headquarters.lng, team.headquarters.lat] as [number, number],
              zoom: 15.68,
              bearing: 0,
              pitch: 45,
              speed: 0.6,
              curve: 1,
              essential: true
            };
          } else if (teamId === 'alpine') {
            flyToOptions = {
              center: [team.headquarters.lng, team.headquarters.lat] as [number, number],
              zoom: 15.68,
              bearing: 0,
              pitch: 45,
              speed: 0.6,
              curve: 1,
              essential: true
            };
          } else if (teamId === 'haas') {
            flyToOptions = {
              center: [team.headquarters.lng, team.headquarters.lat] as [number, number],
              zoom: 15.68,
              bearing: 0,
              pitch: 45,
              speed: 0.6,
              curve: 1,
              essential: true
            };
          } else if (teamId === 'racing-bulls') {
            flyToOptions = {
              center: [team.headquarters.lng, team.headquarters.lat] as [number, number],
              zoom: 15.68,
              bearing: 0,
              pitch: 45,
              speed: 0.6,
              curve: 1,
              essential: true
            };
          } else if (teamId === 'williams') {
            flyToOptions = {
              center: [team.headquarters.lng, team.headquarters.lat] as [number, number],
              zoom: 15.68,
              bearing: 0,
              pitch: 45,
              speed: 0.6,
              curve: 1,
              essential: true
            };
          } else if (teamId === 'alfa-romeo') {
            flyToOptions = {
              center: [team.headquarters.lng, team.headquarters.lat] as [number, number],
              zoom: 15.68,
              bearing: 0,
              pitch: 45,
              speed: 0.6,
              curve: 1,
              essential: true
            };
          } else {
            // 다른 팀들은 기본 설정 사용
            flyToOptions = {
              center: [team.headquarters.lng, team.headquarters.lat] as [number, number],
              zoom: 15.68,
              bearing: 0,
              pitch: 45,
              speed: 0.6,
              curve: 1,
              essential: true
            };
          }
          
          map.current.flyTo(flyToOptions);

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
      if (onMapReady) {
        onMapReady(mapAPI);
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

      console.log('[Map] Starting to add markers...');
      
      // 레드불 레이싱 마커
      const redBullTeam = teamsData.teams.find(team => team.id === 'red-bull');
      if (redBullTeam) {
        const redBullMarker = createRedBullMarker({
          map: map.current,
          team: redBullTeam,
          onMarkerClick
        });
        markers.current.push(redBullMarker);
        console.log('[Map] Red Bull marker added');
      }

      // 페라리 마커
      const ferrariTeam = teamsData.teams.find(team => team.id === 'ferrari');
      if (ferrariTeam) {
        const ferrariMarker = createFerrariMarker({
          map: map.current,
          team: ferrariTeam,
          onMarkerClick
        });
        markers.current.push(ferrariMarker);
        console.log('[Map] Ferrari marker added');
      }

      // 메르세데스 마커
      const mercedesTeam = teamsData.teams.find(team => team.id === 'mercedes');
      if (mercedesTeam) {
        const mercedesMarker = createMercedesMarker({
          map: map.current,
          team: mercedesTeam,
          onMarkerClick
        });
        markers.current.push(mercedesMarker);
        console.log('[Map] Mercedes marker added');
      }

      // 맥라렌 마커
      const mclarenTeam = teamsData.teams.find(team => team.id === 'mclaren');
      if (mclarenTeam) {
        const mclarenMarker = createMcLarenMarker({
          map: map.current,
          team: mclarenTeam,
          onMarkerClick
        });
        markers.current.push(mclarenMarker);
        console.log('[Map] McLaren marker added');
      }

      // 애스턴 마틴 마커
      const astonMartinTeam = teamsData.teams.find(team => team.id === 'aston-martin');
      if (astonMartinTeam) {
        const astonMartinMarker = createAstonMartinMarker({
          map: map.current,
          team: astonMartinTeam,
          onMarkerClick
        });
        markers.current.push(astonMartinMarker);
        console.log('[Map] Aston Martin marker added');
      }

      // 알핀 마커
      const alpineTeam = teamsData.teams.find(team => team.id === 'alpine');
      if (alpineTeam) {
        const alpineMarker = createAlpineMarker({
          map: map.current,
          team: alpineTeam,
          onMarkerClick
        });
        markers.current.push(alpineMarker);
        console.log('[Map] Alpine marker added');
      }

      // 하스 마커
      const haasTeam = teamsData.teams.find(team => team.id === 'haas');
      if (haasTeam) {
        const haasMarker = createHaasMarker({
          map: map.current,
          team: haasTeam,
          onMarkerClick
        });
        markers.current.push(haasMarker);
        console.log('[Map] Haas marker added');
      }

      // 레이싱 불스 마커
      const racingBullsTeam = teamsData.teams.find(team => team.id === 'racing-bulls');
      if (racingBullsTeam) {
        const racingBullsMarker = createRacingBullsMarker({
          map: map.current,
          team: racingBullsTeam,
          onMarkerClick
        });
        markers.current.push(racingBullsMarker);
        console.log('[Map] Racing Bulls marker added');
      }

      // 윌리엄스 마커
      const williamsTeam = teamsData.teams.find(team => team.id === 'williams');
      if (williamsTeam) {
        const williamsMarker = createWilliamsMarker({
          map: map.current,
          team: williamsTeam,
          onMarkerClick
        });
        markers.current.push(williamsMarker);
        console.log('[Map] Williams marker added');
      }

      // 자우버 마커
      const sauberTeam = teamsData.teams.find(team => team.id === 'alfa-romeo');
      if (sauberTeam) {
        const sauberMarker = createSauberMarker({
          map: map.current,
          team: sauberTeam,
          onMarkerClick
        });
        markers.current.push(sauberMarker);
        console.log('[Map] Sauber marker added');
      }

      // 다음 레이스 찾기
      const nextRace = findNextRace();

      // 모든 서킷 마커 추가
      addAllCircuits({
        map: map.current,
        onMarkerClick,
        nextRaceId: nextRace.id,
        markers: markers.current
      });
      
      console.log(`[Map] Total markers created: ${markers.current.length}`);
    };

    // 줌 레벨 변경 감지 핸들러 등록
    const handleZoomChange = () => {
      const zoom = map.current!.getZoom();
      console.log(`[Map] Zoom level: ${zoom.toFixed(2)}`);
      
      // 줌 레벨이 10 이하로 떨어지면 서킷 뷰가 아님
      if (zoom <= 10) {
        setIsCircuitView(false);
      }
      
      // 줌 레벨에 따른 서킷 마커 표시/숨김
      let circuitMarkersFound = 0;
      let circuitMarkersHidden = 0;
      
      markers.current.forEach(marker => {
        const element = marker.getElement();
        if (element && element.classList.contains('circuit-marker')) {
          circuitMarkersFound++;
          if (zoom >= 12) {
            // 줌 레벨이 12 이상이면 서킷 마커 숨김
            element.style.opacity = '0';
            element.style.pointerEvents = 'none';
            element.style.display = 'none'; // 완전히 숨김
            circuitMarkersHidden++;
          } else {
            // 줌 레벨이 12 미만이면 서킷 마커 표시
            element.style.opacity = '1';
            element.style.pointerEvents = 'auto';
            element.style.display = 'block';
          }
        }
      });
      
      console.log(`[Map] Circuit markers found: ${circuitMarkersFound}, hidden: ${circuitMarkersHidden}`);
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
  }, [onMapReady, onMarkerClick, onCinematicModeChange, onUserInteraction, handleCinematicModeToggle]);

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
