'use client';

import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import teamsData from '@/data/teams.json';
import circuitsData from '@/data/circuits.json';
import nurburgringTrack from '@/data/nurburgring-track.json';

mapboxgl.accessToken = 'pk.eyJ1IjoiYmFlY2hvb2tpbmciLCJhIjoiY21iajAwaTd1MGJrZjJqb2g3M3RsZ2hhaiJ9.B1BuVoKpl3Xt1HSZq6ugeA';

export default function Map() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;
    
    // 기존 맵 인스턴스가 있으면 재사용
    if (map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: [0, 20],
      zoom: 1.5,
      projection: 'globe',
      maxZoom: 22,
      minZoom: 0,
      renderWorldCopies: false,  // 성능 최적화
      maxPitch: 85,
      antialias: false,  // 안티앨리어싱 비활성화로 성능 향상
      fadeDuration: 0,  // 타일 페이드 애니메이션 제거
      refreshExpiredTiles: false,  // 만료된 타일 자동 새로고침 비활성화
      maxTileCacheSize: 100,  // 타일 캐시 크기 증가
      crossSourceCollisions: false  // 교차 소스 충돌 검사 비활성화
    });

    // 지구본 자동 회전
    let userInteracting = false;
    
    map.current.on('mousedown', () => {
      userInteracting = true;
    });
    
    map.current.on('mouseup', () => {
      userInteracting = false;
    });
    
    map.current.on('dragend', () => {
      userInteracting = false;
    });
    
    map.current.on('load', () => {
      // 지도에 대기 효과 추가
      map.current!.setFog({
        'range': [0.5, 10],
        'color': 'white',
        'high-color': '#245cdf',
        'space-color': 'black',
        'star-intensity': 0.5
      });
      // 레드불 레이싱 데이터를 teams.json에서 가져오기
      const redBullTeam = teamsData.find(team => team.id === 'red-bull');
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
      
      // 마우스 호버 효과 (성능 최적화)
      let hoverTimeout: NodeJS.Timeout;
      el.addEventListener('mouseenter', () => {
        clearTimeout(hoverTimeout);
        hoverTimeout = setTimeout(() => {
          box.style.transform = 'scale(1.1)';
          box.style.boxShadow = '0 4px 20px rgba(0,0,0,0.4)';
        }, 50);
      });
      
      el.addEventListener('mouseleave', () => {
        clearTimeout(hoverTimeout);
        box.style.transform = 'scale(1)';
        box.style.boxShadow = '0 2px 10px rgba(0,0,0,0.3)';
      });
      
      // 펄스 애니메이션 제거 (성능 최적화)
      
      // 클릭 이벤트 추가
      el.addEventListener('click', () => {
        userInteracting = true; // 회전 멈추기
        
        // 부드러운 전환을 위한 fade out
        mapContainer.current!.style.transition = 'opacity 0.5s ease';
        mapContainer.current!.style.opacity = '0.7';
        
        // 스타일을 standard로 변경
        setTimeout(() => {
          map.current!.setStyle('mapbox://styles/mapbox/standard');
        }, 200);
        
        // 스타일 로드 완료 후 flyTo
        map.current!.once('styledata', () => {
          mapContainer.current!.style.opacity = '1';
          map.current!.flyTo({
            center: redBullHQ.coordinates as [number, number],
            zoom: 18,
            pitch: 60,
            bearing: 0,
            duration: 3000,
            essential: true
          });
          
          // flyTo 완료 후 다시 위성 스타일로 변경 (선택사항)
          map.current!.once('moveend', () => {
            setTimeout(() => {
              if (map.current!.getZoom() < 10) {
                map.current!.setStyle('mapbox://styles/mapbox/satellite-streets-v12');
              }
            }, 2000);
          });
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
      new mapboxgl.Marker(el, { offset: [0, -25] })
        .setLngLat(redBullHQ.coordinates as [number, number])
        .setPopup(popup)
        .addTo(map.current!);

      // 뉘르부르크링 서킷 마커 추가
      const nurburgring = circuitsData.find(circuit => circuit.id === 'nurburgring');
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
        
        // 호버 효과 (성능 최적화)
        let circuitHoverTimeout: NodeJS.Timeout;
        circuitEl.addEventListener('mouseenter', () => {
          clearTimeout(circuitHoverTimeout);
          circuitHoverTimeout = setTimeout(() => {
            circuitMarker.style.transform = 'scale(1.1)';
            circuitMarker.style.boxShadow = '0 6px 20px rgba(220, 38, 38, 0.6)';
          }, 50);
        });
        
        circuitEl.addEventListener('mouseleave', () => {
          clearTimeout(circuitHoverTimeout);
          circuitMarker.style.transform = 'scale(1)';
          circuitMarker.style.boxShadow = '0 4px 15px rgba(220, 38, 38, 0.4)';
        });
        
        // 클릭 이벤트 추가
        circuitEl.addEventListener('click', () => {
          userInteracting = true; // 회전 멈추기
          
          // 부드러운 전환을 위한 fade out
          mapContainer.current!.style.transition = 'opacity 0.5s ease';
          mapContainer.current!.style.opacity = '0.7';
          
          // 벡터 타일 기반 스타일로 변경
          setTimeout(() => {
            map.current!.setStyle('mapbox://styles/mapbox/outdoors-v12');
          }, 200);
          
          // 스타일 로드 완료 후 3D 지형 추가 및 flyTo
          map.current!.once('styledata', () => {
            // 3D 지형 추가
            map.current!.addSource('mapbox-dem', {
              'type': 'raster-dem',
              'url': 'mapbox://mapbox.mapbox-terrain-dem-v1',
              'tileSize': 512,
              'maxzoom': 14
            });
            
            // 지형 레이어 설정 및 과장
            map.current!.setTerrain({ 
              'source': 'mapbox-dem', 
              'exaggeration': 1.5  // 지형 효과 강조 (성능 최적화를 위해 감소)
            });
            
            // 하늘 레이어 추가 (간단한 gradient로 변경)
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
            
            // 불필요한 레이어 숨기기
            const layersToHide = [
              'contour-label',  // 등고선 라벨
              'contour',        // 등고선
              'poi-label',      // POI 라벨
              'place-label',    // 장소 라벨
              'road-label',     // 도로 라벨
              'waterway-label', // 수로 라벨
              'transit-label',  // 대중교통 라벨
              'building',       // 건물
              'landuse',        // 토지 이용
              'hillshade'       // 음영
            ];
            
            // 레이어 숨기기 최적화 (idle 이벤트 사용)
            map.current!.once('idle', () => {
              const layers = map.current!.getStyle().layers;
              if (layers) {
                layers.forEach(layer => {
                  if (layersToHide.some(hideId => layer.id.includes(hideId))) {
                    map.current!.setLayoutProperty(layer.id, 'visibility', 'none');
                  }
                });
              }
            });
            
            // 서킷 트랙 추가
            map.current!.addSource('circuit-track', {
              'type': 'geojson',
              'data': {
                'type': 'Feature',
                'properties': {},
                'geometry': {
                  'type': 'LineString',
                  'coordinates': nurburgringTrack
                }
              }
            });
            
            // 트랙 아웃라인 (외곽선)
            map.current!.addLayer({
              'id': 'circuit-track-outline',
              'type': 'line',
              'source': 'circuit-track',
              'layout': {
                'line-join': 'round',
                'line-cap': 'round'
              },
              'paint': {
                'line-color': '#000000',
                'line-width': 8,
                'line-opacity': 0.6
              }
            });
            
            // 메인 트랙 라인
            map.current!.addLayer({
              'id': 'circuit-track-main',
              'type': 'line',
              'source': 'circuit-track',
              'layout': {
                'line-join': 'round',
                'line-cap': 'round'
              },
              'paint': {
                'line-color': '#dc2626',
                'line-width': 5,
                'line-opacity': 1
              }
            });
            
            // 트랙 중앙선
            map.current!.addLayer({
              'id': 'circuit-track-centerline',
              'type': 'line',
              'source': 'circuit-track',
              'layout': {
                'line-join': 'round',
                'line-cap': 'round'
              },
              'paint': {
                'line-color': '#ffffff',
                'line-width': 1,
                'line-dasharray': [4, 2],
                'line-opacity': 0.8
              }
            });
            
            mapContainer.current!.style.opacity = '1';
            map.current!.flyTo({
              center: [nurburgring.location.lng, nurburgring.location.lat],
              zoom: 14.5,
              pitch: 65,  // 3D 효과 강조
              bearing: 45,
              duration: 3000,
              essential: true
            });
            
            // 추가 애니메이션: 서킷 주변 회전 (성능 최적화)
            map.current!.once('moveend', () => {
              let bearing = 45;
              let animationId: number;
              const rotateCamera = () => {
                if (map.current!.getZoom() > 13 && !userInteracting) {
                  bearing += 0.3;  // 회전 속도 감소
                  map.current!.setBearing(bearing);
                  animationId = requestAnimationFrame(rotateCamera);
                } else if (animationId) {
                  cancelAnimationFrame(animationId);
                }
              };
              rotateCamera();
            });
          });
        });
        
        // 서킷 팝업
        const circuitPopup = new mapboxgl.Popup({ offset: 25 })
          .setHTML(`
            <div style="padding: 10px;">
              <h3 style="margin: 0 0 5px 0; color: #dc2626;">${nurburgring.name}</h3>
              <p style="margin: 0 0 5px 0; font-size: 14px;">${nurburgring.officialName}</p>
              <p style="margin: 0 0 3px 0; font-size: 12px;"><strong>Country:</strong> ${nurburgring.country}</p>
              <p style="margin: 0 0 3px 0; font-size: 12px;"><strong>Track Length:</strong> ${nurburgring.trackLength} km</p>
              <p style="margin: 0 0 3px 0; font-size: 12px;"><strong>Lap Record:</strong> ${nurburgring.lapRecord.time} (${nurburgring.lapRecord.driver}, ${nurburgring.lapRecord.year})</p>
              ${nurburgring.elevation ? `<p style="margin: 0; font-size: 12px; color: #dc2626;"><strong>Elevation Change:</strong> ${nurburgring.elevation.difference}m (${nurburgring.elevation.lowest}m - ${nurburgring.elevation.highest}m)</p>` : ''}
            </div>
          `);
        
        // 서킷 마커 추가
        new mapboxgl.Marker(circuitEl)
          .setLngLat([nurburgring.location.lng, nurburgring.location.lat])
          .setPopup(circuitPopup)
          .addTo(map.current!);
      }

      // 자동 회전 설정 (성능 최적화)
      const secondsPerRevolution = 180;  // 회전 속도 감소
      const maxSpinZoom = 5;
      const slowSpinZoom = 3;
      
      let spinEnabled = true;
      let spinTimeout: NodeJS.Timeout;
      
      function spinGlobe() {
        const zoom = map.current!.getZoom();
        if (spinEnabled && !userInteracting && zoom < maxSpinZoom) {
          let distancePerSecond = 360 / secondsPerRevolution;
          if (zoom > slowSpinZoom) {
            const zoomDif = (maxSpinZoom - zoom) / (maxSpinZoom - slowSpinZoom);
            distancePerSecond *= zoomDif;
          }
          const center = map.current!.getCenter();
          center.lng -= distancePerSecond;
          map.current!.easeTo({ center, duration: 1500, easing: (n) => n });  // duration 증가
        }
      }
      
      // debounce를 사용하여 moveend 이벤트 최적화
      map.current!.on('moveend', () => {
        clearTimeout(spinTimeout);
        spinTimeout = setTimeout(() => {
          spinGlobe();
        }, 100);
      });
      
      spinGlobe();
    });

    // cleanup 함수에서 맵을 제거하지 않고 유지
    return () => {
      // map.current?.remove(); // 제거하지 않음
    };
  }, []);

  return <div ref={mapContainer} className="w-full h-full" />;
}