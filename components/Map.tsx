'use client';

import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import teamsData from '@/data/teams.json';
import circuitsData from '@/data/circuits.json';
import nurburgringTrack from '@/data/nurburgring-track.json';
import austriaTrack from '@/data/austria-track.json';

// Mapbox 토큰 확인
if (!process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN) {
  console.error('Mapbox access token is missing!');
}
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN!;

interface MarkerData {
  type: string;
  id?: string;
  name?: string;
  principal?: string;
  location?: string | { city: string; country: string };
  headquarters?: { city: string; country: string; lat: number; lng: number };
  color?: string;
  drivers?: string[];
  grandPrix?: string;
  length?: number;
  laps?: number;
  corners?: number;
}

interface MapAPI {
  flyToCircuit: (circuitId: string, gentle?: boolean) => void;
  flyToTeam: (teamId: string) => void;
}

interface MapProps {
  onMarkerClick?: (item: MarkerData) => void;
  onMapReady?: (mapAPI: MapAPI) => void;
}

export default function Map({ onMarkerClick, onMapReady }: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  const eventHandlers = useRef<{ event: string; handler: () => void }[]>([]);
  const animationId = useRef<number | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    // 기존 맵 인스턴스가 있으면 재사용
    if (map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',  // Dark theme for engineer console
      center: [0, 20],
      zoom: 1.5,
      projection: { name: 'globe' }
    });

    // 내비게이션 컨트롤 추가 (줌, 회전, 나침반)
    map.current.addControl(new mapboxgl.NavigationControl({
      showCompass: true,
      showZoom: true,
      visualizePitch: true
    }), 'top-right');

    // 자동 회전을 위한 변수
    let userInteracting = false;
    const spinEnabled = true;
    let spinAnimationId: number | null = null;
    const secondsPerRevolution = 240; // 천천히 회전 (4분에 한 바퀴)
    const maxSpinZoom = 5;
    const slowSpinZoom = 3;

    // spinGlobe 함수 정의
    const spinGlobe = () => {
      if (!map.current) return;

      const zoom = map.current.getZoom();
      if (spinEnabled && !userInteracting && zoom < maxSpinZoom) {
        let distancePerSecond = 360 / secondsPerRevolution;
        if (zoom > slowSpinZoom) {
          const zoomDif = (maxSpinZoom - zoom) / (maxSpinZoom - slowSpinZoom);
          distancePerSecond *= zoomDif;
        }

        const center = map.current.getCenter();
        center.lng -= distancePerSecond / 60; // 60fps 기준

        map.current.setCenter(center);

        spinAnimationId = requestAnimationFrame(spinGlobe);
      }
    };

    // 사용자 인터랙션 감지
    const startInteracting = () => {
      userInteracting = true;
      if (spinAnimationId) {
        cancelAnimationFrame(spinAnimationId);
        spinAnimationId = null;
      }
    };

    const stopInteracting = () => {
      userInteracting = false;
      setTimeout(() => {
        if (!userInteracting) {
          spinGlobe(); // 인터랙션이 끝나고 0.5초 후 다시 회전 시작
        }
      }, 500);
    };

    // 이벤트 리스너 등록
    map.current.on('dragstart', startInteracting);
    map.current.on('dragend', stopInteracting);
    map.current.on('pitchstart', startInteracting);
    map.current.on('pitchend', stopInteracting);
    map.current.on('rotatestart', startInteracting);
    map.current.on('rotateend', stopInteracting);
    map.current.on('zoomstart', startInteracting);
    map.current.on('zoomend', stopInteracting);


    // 좌표 보간 함수 - 더 부드러운 트랙을 위해
    const interpolateCoordinates = (coords: number[][]): number[][] => {
      const interpolated: number[][] = [];

      for (let i = 0; i < coords.length - 1; i++) {
        const start = coords[i];
        const end = coords[i + 1];

        // 원래 점 추가
        interpolated.push(start);

        // 두 점 사이의 거리 계산
        const dx = end[0] - start[0];
        const dy = end[1] - start[1];
        const distance = Math.sqrt(dx * dx + dy * dy);

        // 거리에 따라 보간 점 개수 결정 (더 많은 점 추가)
        const numInterpolations = Math.ceil(distance * 5000);

        // 보간 점 추가
        for (let j = 1; j < numInterpolations; j++) {
          const t = j / numInterpolations;
          interpolated.push([
            start[0] + dx * t,
            start[1] + dy * t
          ]);
        }
      }

      // 마지막 점 추가
      interpolated.push(coords[coords.length - 1]);

      return interpolated;
    };

    // 범용 트랙 그리기 함수
    const drawTrack = (
      trackId: string,
      trackCoordinates: number[][],
      color: string = '#FF1801',
      delay: number = 0,
      onComplete?: () => void
    ) => {
      setTimeout(() => {
        if (!map.current) return;

        // 이미 트랙이 그려져 있으면 스킵
        if (map.current.getLayer(`${trackId}-main`)) {
          return;
        }

        // 좌표 보간
        const smoothCoordinates = interpolateCoordinates(trackCoordinates);

        // 트랙 소스 추가
        if (!map.current.getSource(trackId)) {
          map.current.addSource(trackId, {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates: []  // 빈 좌표로 시작 (애니메이션을 위해)
              }
            }
          });
        }

        // 트랙 아웃라인 레이어
        if (!map.current.getLayer(`${trackId}-outline`)) {
          map.current.addLayer({
            id: `${trackId}-outline`,
            type: 'line',
            source: trackId,
            layout: {
              'line-join': 'round',
              'line-cap': 'round'
            },
            paint: {
              'line-color': '#FFFFFF',
              'line-width': 8,
              'line-blur': 1
            }
          });
        }

        // 메인 트랙 레이어
        if (!map.current.getLayer(`${trackId}-main`)) {
          map.current.addLayer({
            id: `${trackId}-main`,
            type: 'line',
            source: trackId,
            layout: {
              'line-join': 'round',
              'line-cap': 'round'
            },
            paint: {
              'line-color': color,
              'line-width': 5
            }
          });
        }

        // 트랙 애니메이션
        const animationDuration = 3000;
        const startTime = performance.now();
        const totalPoints = smoothCoordinates.length;

        const animateTrack = () => {
          const elapsed = performance.now() - startTime;
          const progress = Math.min(elapsed / animationDuration, 1);

          // 부드러운 진행
          const easeProgress = progress < 0.5
            ? 2 * progress * progress
            : -1 + (4 - 2 * progress) * progress;

          const currentIndex = Math.floor(easeProgress * totalPoints);
          const animatedCoordinates = smoothCoordinates.slice(0, currentIndex + 1);

          // 트랙이 완성되면 닫힌 루프로 만들기
          if (currentIndex >= totalPoints - 1 && animatedCoordinates.length > 0) {
            animatedCoordinates.push(smoothCoordinates[0]); // 시작점으로 돌아가기
          }

          if (animatedCoordinates.length > 1) {
            (map.current!.getSource(trackId) as mapboxgl.GeoJSONSource).setData({
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates: animatedCoordinates
              }
            });
          }

          if (progress < 1) {
            requestAnimationFrame(animateTrack);
          } else if (onComplete) {
            onComplete();
          }
        };

        animateTrack();
      }, delay);
    };


    // 오스트리아 트랙 그리기 함수
    const drawAustriaTrack = (delay: number = 0) => {
      const trackCoordinates = austriaTrack.features[0].geometry.coordinates;

      drawTrack('austria-track', trackCoordinates, '#FF1801', delay, () => {
        // 서킷 주변 회전 애니메이션
        let bearing = -20;
        let isRotating = false;
        let rotationAnimationId: number | null = null;

        const rotateCamera = () => {
          if (map.current!.getZoom() > 13 && isRotating) {
            bearing += 0.2;
            map.current!.setBearing(bearing);
            rotationAnimationId = requestAnimationFrame(rotateCamera);
          }
        };

        // 사용자 인터랙션 감지하여 회전 중지
        const stopRotation = () => {
          isRotating = false;
          if (rotationAnimationId) {
            cancelAnimationFrame(rotationAnimationId);
            rotationAnimationId = null;
          }
        };

        const startRotation = () => {
          if (!isRotating && map.current!.getZoom() > 13) {
            setTimeout(() => {
              if (!userInteracting) {
                isRotating = true;
                rotateCamera();
              }
            }, 500);
          }
        };

        // 회전 시작
        isRotating = true;
        rotateCamera();

        // 이벤트 리스너 추가
        map.current!.on('dragstart', stopRotation);
        map.current!.on('dragend', startRotation);
        map.current!.on('zoomstart', stopRotation);
        map.current!.on('zoomend', startRotation);
      });
    };

    // flyTo methods for scenarios
    const mapAPI = {
      flyToCircuit: (circuitId: string, gentle: boolean = false) => {
        if (!map.current) return;

        if (circuitId === 'redbullring' || circuitId === 'austria') {
          map.current.flyTo({
            center: [14.7647, 47.2197],
            zoom: gentle ? 5 : 15,
            pitch: gentle ? 30 : 60,
            bearing: -20,
            speed: gentle ? 0.4 : 0.6,
            curve: 1,
            essential: true
          });

          // gentle flyTo (자동 flyTo)인 경우 트랙을 그리지 않음
          if (!gentle) {
            // flyTo 완료 후 트랙 그리기
            map.current.once('moveend', () => {
              if (map.current!.getZoom() > 10) {  // 충분히 줌인된 경우에만 트랙 그리기
                drawAustriaTrack(500);
              }
            });
          }
        }
      },
      flyToTeam: (teamId: string) => {
        if (!map.current) return;

        const team = teamsData.teams.find(t => t.id === teamId);
        if (team) {
          map.current.flyTo({
            center: [team.headquarters.lng, team.headquarters.lat],
            zoom: 17,
            pitch: 45,
            speed: 0.6,
            curve: 1,
            essential: true
          });
        }
      }
    };

    map.current.on('load', () => {
      // Map이 완전히 로드된 후에 mapAPI 전달
      if (onMapReady) {
        onMapReady(mapAPI);
      }
      // 3D 터레인은 globe projection과 충돌할 수 있으므로 제거
      // 대신 fog와 sky layer로 3D 효과 구현

      // 지도에 대기 효과 추가
      map.current!.setFog({
        'range': [0.5, 10],
        'color': 'white',
        'high-color': '#245cdf',
        'space-color': 'black',
        'star-intensity': 0.5
      });

      // 하늘 레이어 추가
      map.current!.addLayer({
        'id': 'sky',
        'type': 'sky',
        'paint': {
          'sky-type': 'gradient',
          'sky-gradient': [
            'interpolate',
            ['linear'],
            ['sky-radial-progress'],
            0.8,
            'rgba(135, 206, 235, 1)',
            1,
            'rgba(0, 0, 0, 0.1)'
          ]
        }
      });

      // satellite 스타일에서도 불필요한 레이어 제거 (있는 경우)
      // 주의: 레이어 제거 후 마커 추가하도록 순서 조정
      const style = map.current!.getStyle();
      if (style && style.layers) {
        const layersToRemove = [
          'country-label',
          'state-label',
          'settlement-label',
          'settlement-subdivision-label',
          'airport-label',
          'poi-label',
          'water-label',
          'place-label',
          'road-label',
          'transit-label'
        ];

        style.layers.forEach(layer => {
          if (layersToRemove.some(pattern => layer.id.includes(pattern))) {
            try {
              map.current!.removeLayer(layer.id);
            } catch (e) {
              // 레이어가 이미 제거된 경우 무시
            }
          }
        });
      }
      
      // 마커 추가를 약간 지연시켜 스타일 로드 완료 확실히 하기
      setTimeout(() => {
        addMarkers();
      }, 100);
    });

    // 마커 추가 함수를 별도로 분리
    const addMarkers = () => {
      if (!map.current) return;

      // 레드불 레이싱 데이터를 teams.json에서 가져오기
      const redBullTeam = teamsData.teams.find(team => team.id === 'red-bull');
      if (!redBullTeam) return;

      const redBullHQ = {
        name: redBullTeam.fullName,
        coordinates: [redBullTeam.headquarters.lng, redBullTeam.headquarters.lat],
        description: redBullTeam.description,
        address: `${redBullTeam.headquarters.city}, ${redBullTeam.headquarters.country}`
      };

      // 커스텀 마커 엘리먼트 생성
      const el = document.createElement('div');
      el.className = 'marker';
      el.style.position = 'relative';
      el.style.width = '80px';
      el.style.height = '95px';
      el.style.cursor = 'pointer';

      // 메인 박스
      const box = document.createElement('div');
      box.style.width = '80px';
      box.style.height = '80px';
      box.style.backgroundImage = 'url(https://upload.wikimedia.org/wikipedia/de/thumb/c/c4/Red_Bull_Racing_logo.svg/200px-Red_Bull_Racing_logo.svg.png)';
      box.style.backgroundSize = 'contain';
      box.style.backgroundPosition = 'center';
      box.style.backgroundRepeat = 'no-repeat';
      box.style.backgroundColor = 'white';
      box.style.borderRadius = '4px';
      box.style.border = '3px solid #1e3a8a';
      box.style.boxShadow = '0 2px 10px rgba(0,0,0,0.3)';
      box.style.transition = 'all 0.3s ease';

      // 아래 삼각형 (외부 테두리)
      const triangleOuter = document.createElement('div');
      triangleOuter.style.position = 'absolute';
      triangleOuter.style.bottom = '-12px';
      triangleOuter.style.left = '50%';
      triangleOuter.style.transform = 'translateX(-50%)';
      triangleOuter.style.width = '0';
      triangleOuter.style.height = '0';
      triangleOuter.style.borderLeft = '12px solid transparent';
      triangleOuter.style.borderRight = '12px solid transparent';
      triangleOuter.style.borderTop = '12px solid #1e3a8a';

      // 아래 삼각형 (내부 흰색)
      const triangleInner = document.createElement('div');
      triangleInner.style.position = 'absolute';
      triangleInner.style.bottom = '-9px';
      triangleInner.style.left = '50%';
      triangleInner.style.transform = 'translateX(-50%)';
      triangleInner.style.width = '0';
      triangleInner.style.height = '0';
      triangleInner.style.borderLeft = '9px solid transparent';
      triangleInner.style.borderRight = '9px solid transparent';
      triangleInner.style.borderTop = '9px solid white';

      el.appendChild(box);
      el.appendChild(triangleOuter);
      el.appendChild(triangleInner);

      // GPU 가속 호버 효과
      el.style.willChange = 'transform';
      box.style.willChange = 'transform, box-shadow';

      el.addEventListener('mouseenter', () => {
        box.style.transform = 'scale(1.1) translateZ(0)';
        box.style.boxShadow = '0 4px 20px rgba(0,0,0,0.4)';
      });

      el.addEventListener('mouseleave', () => {
        box.style.transform = 'scale(1) translateZ(0)';
        box.style.boxShadow = '0 2px 10px rgba(0,0,0,0.3)';
      });

      // 펄스 애니메이션 제거 (성능 최적화)

      // 클릭 이벤트 추가
      el.addEventListener('click', () => {
        // 정보 시트 열기
        if (onMarkerClick) {
          onMarkerClick({
            type: 'team',
            id: 'red-bull',
            name: redBullTeam.fullName,
            principal: redBullTeam.teamPrincipal,
            location: redBullTeam.headquarters,
            color: redBullTeam.colors.primary,
            drivers: ['Max Verstappen', 'Sergio Pérez']
          });
        }

        // satellite 스타일에서는 레이어 숨기기 불필요 (이미 최소화됨)

        map.current!.flyTo({
          center: redBullHQ.coordinates as [number, number],
          zoom: 18,
          pitch: 45,  // 2.5D 뷰에 적합한 각도로 감소
          bearing: 0,
          speed: 0.4,  // 속도 더 감소 (기본값: 1.2)
          curve: 0.8,   // 곡선 더 감소 (기본값: 1.42)
          duration: 6000,  // 지속 시간 6초로 증가
          essential: true
        });

      });

      // 팝업 생성
      const popup = new mapboxgl.Popup({ offset: 25 })
        .setHTML(`
          <div style="padding: 10px;">
            <h3 style="margin: 0 0 5px 0; color: #1e3a8a;">${redBullHQ.name}</h3>
            <p style="margin: 0 0 5px 0; font-size: 14px;">${redBullHQ.description}</p>
            <p style="margin: 0; font-size: 12px; color: #666;">${redBullHQ.address}</p>
          </div>
        `);

      // 마커 추가 (offset 조정)
      const redBullMarker = new mapboxgl.Marker(el, { offset: [0, -25] })
        .setLngLat(redBullHQ.coordinates as [number, number])
        .setPopup(popup)
        .addTo(map.current!);

      markers.current.push(redBullMarker);

      // 오스트리아 레드불 링 서킷 마커 추가
      const redbullRing = circuitsData.circuits.find(circuit => circuit.id === 'austria');

      // 뉘르부르크링도 추가
      const nurburgring = circuitsData.circuits.find(circuit => circuit.id === 'nurburgring');

      // 레드불 링 마커 추가
      if (redbullRing) {
        const austGPEl = document.createElement('div');
        austGPEl.style.width = '60px';
        austGPEl.style.height = '60px';
        austGPEl.style.cursor = 'pointer';

        const austGPMarker = document.createElement('div');
        austGPMarker.style.width = '60px';
        austGPMarker.style.height = '60px';
        austGPMarker.style.backgroundColor = '#FF1801';
        austGPMarker.style.borderRadius = '50%';
        austGPMarker.style.border = '3px solid #FFFFFF';
        austGPMarker.style.display = 'flex';
        austGPMarker.style.alignItems = 'center';
        austGPMarker.style.justifyContent = 'center';
        austGPMarker.style.boxShadow = '0 4px 15px rgba(255, 24, 1, 0.6)';
        austGPMarker.style.transition = 'all 0.3s ease';
        austGPMarker.innerHTML = `
          <div style="font-size: 12px; font-weight: bold; color: white; text-align: center;">
            NEXT<br>RACE
          </div>
        `;

        austGPEl.appendChild(austGPMarker);
        austGPEl.classList.add('active-race');

        austGPEl.addEventListener('click', () => {
          if (onMarkerClick) {
            onMarkerClick({
              type: 'circuit',
              id: 'austria',
              name: redbullRing.name,
              grandPrix: redbullRing.grandPrix,
              length: redbullRing.length,
              laps: redbullRing.laps,
              corners: 10,
              location: `${redbullRing.location.city}, ${redbullRing.location.country}`
            });
          }

          // flyTo 및 트랙 그리기
          map.current!.flyTo({
            center: [redbullRing.location.lng, redbullRing.location.lat],
            zoom: 15,
            pitch: 60,
            bearing: -20,
            speed: 1.2,
            curve: 1,
            essential: true
          });

          map.current!.once('moveend', () => {
            drawAustriaTrack(500);
          });
        });

        // 오스트리아 Red Bull Ring 마커 추가
        const austGPMark = new mapboxgl.Marker(austGPEl)
          .setLngLat([14.7647, 47.2197])
          .addTo(map.current!);

        markers.current.push(austGPMark);
      }

      // 뉘르부르크링 서킷 마커 추가
      if (nurburgring) {
        // 서킷 마커 엘리먼트 생성
        const circuitEl = document.createElement('div');
        circuitEl.style.width = '60px';
        circuitEl.style.height = '60px';
        circuitEl.style.cursor = 'pointer';
        circuitEl.style.position = 'relative';

        // 서킷 마커 스타일
        const circuitMarker = document.createElement('div');
        circuitMarker.style.width = '60px';
        circuitMarker.style.height = '60px';
        circuitMarker.style.backgroundColor = '#1e293b';
        circuitMarker.style.borderRadius = '50%';
        circuitMarker.style.border = '3px solid #dc2626';
        circuitMarker.style.display = 'flex';
        circuitMarker.style.alignItems = 'center';
        circuitMarker.style.justifyContent = 'center';
        circuitMarker.style.boxShadow = '0 4px 15px rgba(220, 38, 38, 0.4)';
        circuitMarker.style.transition = 'all 0.3s ease';
        circuitMarker.innerHTML = `
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
            <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="white" stroke-width="2"/>
            <path d="M9 12l2 2 4-4" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        `;

        circuitEl.appendChild(circuitMarker);

        // GPU 가속 호버 효과
        circuitEl.style.willChange = 'transform';
        circuitMarker.style.willChange = 'transform, box-shadow';
        circuitMarker.style.transform = 'translateZ(0)';

        circuitEl.addEventListener('mouseenter', () => {
          circuitMarker.style.transform = 'scale(1.1) translateZ(0)';
          circuitMarker.style.boxShadow = '0 6px 20px rgba(220, 38, 38, 0.6)';
        });

        circuitEl.addEventListener('mouseleave', () => {
          circuitMarker.style.transform = 'scale(1) translateZ(0)';
          circuitMarker.style.boxShadow = '0 4px 15px rgba(220, 38, 38, 0.4)';
        });

        // 클릭 이벤트 추가
        circuitEl.addEventListener('click', () => {
          // 정보 시트 열기
          if (onMarkerClick) {
            onMarkerClick({
              type: 'circuit',
              name: 'Nürburgring',
              grandPrix: 'German Grand Prix',
              length: 5.148,
              laps: 60,
              location: {
                city: 'Nürburg',
                country: 'Germany'
              }
            });
          }




          map.current!.flyTo({
            center: [nurburgring.location.lng, nurburgring.location.lat],
            zoom: 14.5,
            pitch: 45,  // 2.5D 뷰에 적합한 각도
            bearing: 45,
            speed: 0.4,  // 속도 더 감소 (기본값: 1.2)
            curve: 0.8,   // 곡선 더 감소 (기본값: 1.42)
            duration: 6000,  // 지속 시간 6초로 증가
            essential: true
          });

          // flyTo 완료 후 처리
          map.current!.once('moveend', () => {

            // flyTo 완료 후 트랙 그리기
            drawTrack('nurburgring-track', nurburgringTrack, '#dc2626', 50);


            // 서킷 주변 회전 애니메이션
            let bearing = 45;
            let isRotating = false;
            let localAnimationId: number | null = null;

            const rotateCamera = () => {
              if (map.current!.getZoom() > 13 && isRotating) {
                bearing += 0.3;  // 회전 속도 감소
                map.current!.setBearing(bearing);
                localAnimationId = requestAnimationFrame(rotateCamera);
                animationId.current = localAnimationId;
              } else if (localAnimationId) {
                cancelAnimationFrame(localAnimationId);
                if (animationId.current === localAnimationId) {
                  animationId.current = null;
                }
              }
            };

            // 사용자 인터랙션 감지하여 회전 중지
            const stopRotation = () => {
              isRotating = false;
              if (localAnimationId) {
                cancelAnimationFrame(localAnimationId);
                localAnimationId = null;
              }
            };

            const startRotation = () => {
              if (!isRotating && map.current!.getZoom() > 13) {
                setTimeout(() => {
                  if (!userInteracting) {
                    isRotating = true;
                    rotateCamera();
                  }
                }, 500);
              }
            };

            // 회전 시작
            isRotating = true;
            rotateCamera();

            // 이벤트 리스너 추가
            map.current!.on('dragstart', stopRotation);
            map.current!.on('dragend', startRotation);
            map.current!.on('zoomstart', stopRotation);
            map.current!.on('zoomend', startRotation);
          });
        });

        // 서킷 팝업
        const circuitPopup = new mapboxgl.Popup({ offset: 25 })
          .setHTML(`
            <div style="padding: 10px;">
              <h3 style="margin: 0 0 5px 0; color: #dc2626;">${nurburgring.name}</h3>
              <p style="margin: 0 0 5px 0; font-size: 14px;">${nurburgring.officialName}</p>
              <p style="margin: 0 0 3px 0; font-size: 12px;"><strong>Country:</strong> ${nurburgring.country}</p>
              <p style="margin: 0 0 3px 0; font-size: 12px;"><strong>Track Length:</strong> ${nurburgring.length} km</p>
              <p style="margin: 0 0 3px 0; font-size: 12px;"><strong>Lap Record:</strong> ${nurburgring.lapRecord.time} (${nurburgring.lapRecord.driver}, ${nurburgring.lapRecord.year})</p>
              ${nurburgring.elevation ? `<p style="margin: 0; font-size: 12px; color: #dc2626;"><strong>Elevation Change:</strong> ${nurburgring.elevation.difference}m (${nurburgring.elevation.lowest}m - ${nurburgring.elevation.highest}m)</p>` : ''}
            </div>
          `);

        // 서킷 마커 추가
        const nurburgringMarker = new mapboxgl.Marker(circuitEl)
          .setLngLat([nurburgring.location.lng, nurburgring.location.lat])
          .setPopup(circuitPopup)
          .addTo(map.current!);

        markers.current.push(nurburgringMarker);
      }

    };

    // 초기 회전 시작
    setTimeout(() => {
      spinGlobe();
    }, 2000); // 2초 후 시작

    // cleanup 함수
    return () => {
      // 애니메이션 취소
      if (animationId.current) {
        cancelAnimationFrame(animationId.current);
        animationId.current = null;
      }

      if (spinAnimationId) {
        cancelAnimationFrame(spinAnimationId);
        spinAnimationId = null;
      }

      // 모든 이벤트 리스너 제거
      if (map.current) {
        eventHandlers.current.forEach(({ event, handler }) => {
          // MapboxGL doesn't have proper TypeScript types for off method
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (map.current as any).off(event, handler);
        });
      }

      // 모든 마커 제거
      markers.current.forEach(marker => {
        marker.remove();
      });

      // 참조 초기화
      markers.current = [];
      eventHandlers.current = [];

      // 맵 인스턴스 제거 (옵션)
      // map.current?.remove();
      // map.current = null;
    };
  }, [onMapReady, onMarkerClick]);

  return (
    <>
      <div ref={mapContainer} className="w-full h-full" />
    </>
  );
}
