import mapboxgl from 'mapbox-gl';
import { interpolateCoordinates } from '../animations/globeAnimation';
import { TrackDrawOptions } from '../../types';
import { ANIMATION_CONFIG } from '../../constants';
import { CIRCUIT_ID_MAPPING } from '../data/circuitMapping';
import { trackManager } from './trackManager';

// DRS 존 인덱스 정의 - 동적으로 계산
const DRS_ZONES: { [key: string]: Array<{ start: number; end: number; wrapAround?: boolean }> | 'dynamic' } = {
  'nurburgring': 'dynamic',  // 전체 트랙의 초반 10%를 DRS 존으로 설정
  // 다른 서킷들의 DRS 존 추가 가능
};

// 퍼센티지 기반 DRS 존 정의
const DRS_ZONES_PERCENTAGE: { [key: string]: Array<{ startPercent: number; endPercent: number; name?: string; wrapAround?: boolean }> } = {
  // 2025 F1 Calendar Circuits
  //todo: 추후 geojson으로 분리
  'au-1953': [ // Australia - Albert Park
    { startPercent: 0.92, endPercent: 0.055, name: 'Main Straight', wrapAround: true },
    { startPercent: 0.1, endPercent: 0.18, name: 'Back Straight' },
    { startPercent: 0.5, endPercent: 0.6, name: 'Back Straight' },
    { startPercent: 0.67, endPercent: 0.76, name: 'Back Straight' }
  ],
  'cn-2004': [ // China - Shanghai
    { startPercent: 0.9, endPercent: 0.02, name: 'Main Straight', wrapAround: true },
    { startPercent: 0.65, endPercent: 0.8, name: 'Back Straight' }
  ],
  'jp-1962': [ // Japan - Suzuka
    { startPercent: 0.95, endPercent: 0.065, name: 'Main Straight', wrapAround: true }
  ],
  'bh-2002': [ // Bahrain
    { startPercent: 0.94, endPercent: 0.09, name: 'Main Straight', wrapAround: true },
    { startPercent: 0.15, endPercent: 0.245, name: 'Back Straight' },
    { startPercent: 0.49, endPercent: 0.605, name: 'Sector 3' }
  ],
  'sa-2021': [ // Saudi Arabia - Jeddah
    { startPercent: 0.93, endPercent: 0.065, name: 'Main Straight', wrapAround: true },
    { startPercent: 0.575, endPercent: 0.69, name: 'Sector 1' },
    { startPercent: 0.75, endPercent: 0.875, name: 'Sector 3' }
  ],
  'us-2022': [ // Miami
    { startPercent: 0.85, endPercent: 0.94, name: 'Main Straight'},
    { startPercent: 0.3, endPercent: 0.45, name: 'Back Straight' },
    { startPercent: 0.62, endPercent: 0.78, name: 'Back Straight' }
  ],
  'it-1953': [ // Imola
    { startPercent: 0.82, endPercent: 0.1, name: 'Main Straight', wrapAround: true },
    { startPercent: 0.4, endPercent: 0.55, name: 'Back Straight' }
  ],
  'mc-1929': [ // Monaco
    { startPercent: 0.15, endPercent: 0.3, name: 'Tunnel Section' }
  ],
  'es-1991': [ // Spain - Barcelona
    { startPercent: 0.85, endPercent: 0.1, name: 'Main Straight', wrapAround: true },
    { startPercent: 0.4, endPercent: 0.55, name: 'Back Straight' }
  ],
  'ca-1978': [ // Canada - Montreal
    { startPercent: 0.82, endPercent: 0.08, name: 'Main Straight', wrapAround: true },
    { startPercent: 0.35, endPercent: 0.5, name: 'Back Straight' }
  ],
  'at-1969': [ // Austria - Red Bull Ring
    { startPercent: 0.1, endPercent: 0.25, name: 'Main Straight' },
    { startPercent: 0.3, endPercent: 0.45, name: 'Back Straight' },
    { startPercent: 0.91, endPercent: 0.07, name: 'Sector 3', wrapAround: true }
  ],
  'gb-1948': [ // Britain - Silverstone
    { startPercent: 0.82, endPercent: 0.1, name: 'Main Straight', wrapAround: true },
    { startPercent: 0.35, endPercent: 0.5, name: 'Wellington Straight' },
    { startPercent: 0.65, endPercent: 0.75, name: 'Hangar Straight' }
  ],
  'be-1925': [ // Belgium - Spa
    { startPercent: 0.8, endPercent: 0.1, name: 'Main Straight', wrapAround: true },
    { startPercent: 0.35, endPercent: 0.5, name: 'Kemmel Straight' },
    { startPercent: 0.65, endPercent: 0.75, name: 'Back Section' }
  ],
  'hu-1986': [ // Hungary - Hungaroring
    { startPercent: 0.85, endPercent: 0.08, name: 'Main Straight', wrapAround: true },
    { startPercent: 0.4, endPercent: 0.55, name: 'Back Section' }
  ],
  'nl-1948': [ // Netherlands - Zandvoort
    { startPercent: 0.82, endPercent: 0.08, name: 'Main Straight', wrapAround: true },
    { startPercent: 0.4, endPercent: 0.55, name: 'Back Straight' }
  ],
  'it-1922': [ // Italy - Monza
    { startPercent: 0.8, endPercent: 0.15, name: 'Main Straight', wrapAround: true },
    { startPercent: 0.35, endPercent: 0.5, name: 'Back Straight' },
    { startPercent: 0.65, endPercent: 0.75, name: 'Lesmo Section' }
  ],
  'az-2016': [ // Azerbaijan - Baku
    { startPercent: 0.75, endPercent: 0.15, name: 'Main Straight', wrapAround: true },
    { startPercent: 0.3, endPercent: 0.45, name: 'Castle Section' }
  ],
  'sg-2008': [ // Singapore
    { startPercent: 0.8, endPercent: 0.05, name: 'Main Straight', wrapAround: true },
    { startPercent: 0.25, endPercent: 0.4, name: 'Esplanade' },
    { startPercent: 0.6, endPercent: 0.7, name: 'Marina Bay' }
  ],
  'us-2012': [ // USA - Austin (COTA)
    { startPercent: 0.82, endPercent: 0.1, name: 'Main Straight', wrapAround: true },
    { startPercent: 0.4, endPercent: 0.55, name: 'Back Straight' }
  ],
  'mx-1962': [ // Mexico
    { startPercent: 0.8, endPercent: 0.1, name: 'Main Straight', wrapAround: true },
    { startPercent: 0.35, endPercent: 0.5, name: 'Back Straight' },
    { startPercent: 0.65, endPercent: 0.75, name: 'Stadium Section' }
  ],
  'br-1940': [ // Brazil - Interlagos
    { startPercent: 0.8, endPercent: 0.1, name: 'Main Straight', wrapAround: true },
    { startPercent: 0.4, endPercent: 0.55, name: 'Back Straight' }
  ],
  'us-2023': [ // Las Vegas
    { startPercent: 0.75, endPercent: 0.15, name: 'Las Vegas Boulevard', wrapAround: true },
    { startPercent: 0.3, endPercent: 0.45, name: 'Koval Zone' },
    { startPercent: 0.6, endPercent: 0.7, name: 'Harmon Zone' }
  ],
  'qa-2004': [ // Qatar - Losail
    { startPercent: 0.82, endPercent: 0.1, name: 'Main Straight', wrapAround: true },
    { startPercent: 0.35, endPercent: 0.5, name: 'Back Straight' },
    { startPercent: 0.65, endPercent: 0.75, name: 'Sector 3' }
  ],
  'ae-2009': [ // Abu Dhabi - Yas Marina
    { startPercent: 0.8, endPercent: 0.1, name: 'Main Straight', wrapAround: true },
    { startPercent: 0.35, endPercent: 0.5, name: 'Back Straight' },
    { startPercent: 0.65, endPercent: 0.75, name: 'Marina Section' }
  ],
  
  // Historic/Demo Circuits
  'nurburgring': [
    { startPercent: 0.05, endPercent: 0.25, name: 'Start/Finish Straight' },
    { startPercent: 0.5, endPercent: 0.7, name: 'Döttinger Höhe' }
  ],
  'de-1927': [ // Nurburgring (mapped ID)
    { startPercent: 0.05, endPercent: 0.25, name: 'Start/Finish Straight' },
    { startPercent: 0.5, endPercent: 0.7, name: 'Döttinger Höhe' }
  ]
};

// SVG 쉐브론 생성 함수
const createChevronSVG = (color: string = '#00FF00', opacity: number = 1): string => {
  return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6 15L12 9L18 15" stroke="${color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" opacity="${opacity}"/>
  </svg>`;
};


// DRS 존 그리기 함수 (Symbol 기반)
const drawDRSZones = (
  map: mapboxgl.Map,
  trackId: string,
  trackCoordinates: number[][],
  circuitId: string
) => {
  // DRS ID 목록 수집용
  const drsIds: string[] = [];
  
  // Circuit ID 매핑 (austria -> at-1969)
  const mappedCircuitId = CIRCUIT_ID_MAPPING[circuitId] || circuitId;
  
  let drsZones = DRS_ZONES[mappedCircuitId];
  
  // 1순위: 퍼센티지 기반 DRS 존 확인
  const percentageDrsZones = DRS_ZONES_PERCENTAGE[mappedCircuitId];
  if (percentageDrsZones) {
    const totalPoints = trackCoordinates.length;
    const newDrsZones: Array<{ start: number; end: number; wrapAround?: boolean }> = [];
    
    percentageDrsZones.forEach(zone => {
      const startIndex = Math.floor(totalPoints * zone.startPercent);
      const endIndex = Math.floor(totalPoints * zone.endPercent);
      
      if (zone.wrapAround && endIndex < startIndex) {
        // 랩어라운드: 특별 표시로 처리 (나중에 특별 로직 적용)
        newDrsZones.push({ start: startIndex, end: endIndex, wrapAround: true });
      } else {
        // 일반적인 경우
        newDrsZones.push({ start: startIndex, end: endIndex });
      }
    });
    
    drsZones = newDrsZones;
  }
  
  // 3순위: 기존 DRS_ZONES 또는 dynamic 방식
  if (!percentageDrsZones) {
    // DRS_ZONES에 정의되지 않은 서킷은 기본적으로 dynamic 사용
    if (!drsZones) {
      drsZones = 'dynamic';
    }

    // 'dynamic'인 경우 트랙의 초반 10%를 DRS 존으로 설정
    if (drsZones === 'dynamic') {
      const totalPoints = trackCoordinates.length;
      const drsEndIndex = Math.floor(totalPoints * 0.1); // 10%
      drsZones = [{ start: 0, end: drsEndIndex }];
    }
  }

  // SVG 이미지 로드 (여러 색상/투명도)
  const chevronStates = [
    { color: '#003300', opacity: 0.3, name: 'chevron-dim' },
    { color: '#006600', opacity: 0.5, name: 'chevron-mid' },
    { color: '#00FF00', opacity: 0.8, name: 'chevron-bright' },
    { color: '#00FFFF', opacity: 1, name: 'chevron-max' }
  ];
  
  // 모든 상태의 쉐브론 이미지 로드
  chevronStates.forEach((state) => {
    if (!map.hasImage(state.name)) {
      const svg = createChevronSVG(state.color, state.opacity);
      const blob = new Blob([svg], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      
      const img = new Image();
      img.onload = () => {
        map.addImage(state.name, img);
        URL.revokeObjectURL(url);
      };
      img.src = url;
    }
  });

  // drsZones가 배열인지 확인 후 처리
  if (Array.isArray(drsZones)) {
    drsZones.forEach((zone, index) => {
    let drsLineCoordinates;
    
    if (zone.wrapAround) {
      // 랩어라운드: start부터 끝까지 + 시작부터 end까지 연결
      const endPart = trackCoordinates.slice(zone.start);
      const startPart = trackCoordinates.slice(0, zone.end + 1);
      drsLineCoordinates = [...endPart, ...startPart];
    } else {
      // 일반적인 경우
      drsLineCoordinates = trackCoordinates.slice(zone.start, zone.end + 1);
    }
    
    const drsId = `${trackId}-drs-${index}`;
    drsIds.push(drsId);
    
    // DRS 포인트 생성 (Symbol용)
    const features = [];
    const pointInterval = 5;
    
    for (let i = 0; i < drsLineCoordinates.length - 1; i += pointInterval) {
      const coordIndex = Math.floor(i);
      const coord = drsLineCoordinates[coordIndex];
      const nextCoord = drsLineCoordinates[Math.min(coordIndex + 1, drsLineCoordinates.length - 1)];
      
      // 방향 계산 (도 단위) - 트랙 진행 방향
      const dx = nextCoord[0] - coord[0];
      const dy = nextCoord[1] - coord[1];
      // Mapbox는 북쪽을 0도로 하고 시계방향으로 증가
      const bearing = Math.atan2(dx, dy) * 180 / Math.PI;
      
      features.push({
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: coord
        },
        properties: {
          bearing: bearing, // 트랙 진행 방향으로 회전
          index: Math.floor(i / pointInterval)
        }
      });
    }
    
    // DRS 포인트 소스 추가
    if (!map.getSource(drsId)) {
      map.addSource(drsId, {
        type: 'geojson',
        data: {
          type: 'FeatureCollection' as const,
          features: features
        }
      });
    }
    
    // Symbol 레이어 추가 (줌 레벨 14 이상에서만 표시)
    if (!map.getLayer(`${drsId}-symbols`)) {
      map.addLayer({
        id: `${drsId}-symbols`,
        type: 'symbol',
        source: drsId,
        minzoom: 14, // 줌 레벨 14 이상에서만 표시
        layout: {
          'icon-image': 'chevron-dim', // 초기 상태
          'icon-size': [
            'interpolate',
            ['linear'],
            ['zoom'],
            14, 0.6,  // 줌 14에서 작게 시작
            16, 0.8,  // 줌 16에서 기본 크기
            18, 1.0   // 줌 18에서 크게
          ],
          'icon-rotate': ['get', 'bearing'],
          'icon-rotation-alignment': 'map', // 맵에 고정 (카메라 회전과 무관)
          'icon-pitch-alignment': 'map',    // 피치에도 맵 고정
          'icon-allow-overlap': true,
          'icon-ignore-placement': true
        }
      });
    }
    });
  }
  
  // TrackManager에 DRS 정보 추가
  if (drsIds.length > 0) {
    trackManager.addDRSElements(circuitId, drsIds);
  }
};

// 범용 트랙 그리기 함수
export const drawTrack = (
  map: mapboxgl.Map,
  { trackId, trackCoordinates, color = '#FF1801', delay = 0, onComplete }: TrackDrawOptions
) => {
  setTimeout(() => {
    if (!map) return;

    // 서킷 ID 추출 (trackId는 보통 'circuitId-track' 형식)
    const circuitId = trackId.replace('-track', '');

    // 줌 레벨 확인
    if (!trackManager.canShowTrack()) {
      console.log(`Zoom level too low to show track for ${circuitId}`);
      return;
    }

    // 이미 트랙이 그려져 있으면 스킵
    if (map.getLayer(`${trackId}-main`)) {
      return;
    }

    // TrackManager에 등록
    trackManager.registerTrack(circuitId, trackId);

    // 좌표 보간
    const smoothCoordinates = interpolateCoordinates(trackCoordinates);

    // 트랙 소스 추가
    if (!map.getSource(trackId)) {
      map.addSource(trackId, {
        type: 'geojson',
        data: {
          type: 'Feature' as const,
          properties: {},
          geometry: {
            type: 'LineString' as const,
            coordinates: []
          }
        }
      });
      trackManager.addTrackSource(circuitId, trackId);
    }

    // 트랙 아웃라인 레이어
    if (!map.getLayer(`${trackId}-outline`)) {
      map.addLayer({
        id: `${trackId}-outline`,
        type: 'line',
        source: trackId,
        minzoom: 10,  // 줌 10 이상에서만 표시 (가까이 있을 때만)
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#FFFFFF',
          'line-width': [
            'interpolate',
            ['linear'],
            ['zoom'],
            10, 6,   // 줌 10에서 얇게
            12, 8,   // 줌 12에서 기본
            16, 10   // 줌 16에서 두껍게
          ],
          'line-blur': 1,
          'line-opacity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            10, 0.3,  // 줌 10에서 희미하게 시작
            11, 0.7,  // 줌 11에서 더 진해짐
            12, 1     // 줌 12 이상에서 완전히 불투명
          ]
        }
      });
      trackManager.addTrackLayer(circuitId, `${trackId}-outline`);
    }

    // 메인 트랙 레이어
    if (!map.getLayer(`${trackId}-main`)) {
      map.addLayer({
        id: `${trackId}-main`,
        type: 'line',
        source: trackId,
        minzoom: 10,  // 줌 10 이상에서만 표시 (가까이 있을 때만)
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': color,
          'line-width': [
            'interpolate',
            ['linear'],
            ['zoom'],
            10, 3,   // 줌 10에서 얇게
            12, 5,   // 줌 12에서 기본
            16, 7    // 줌 16에서 두껍게
          ],
          'line-opacity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            10, 0.4,  // 줌 10에서 희미하게 시작
            11, 0.8,  // 줌 11에서 더 진해짐
            12, 1     // 줌 12 이상에서 완전히 불투명
          ]
        }
      });
      trackManager.addTrackLayer(circuitId, `${trackId}-main`);
    }

    // 트랙 애니메이션
    const startTime = performance.now();
    const totalPoints = smoothCoordinates.length;

    const animateTrack = () => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / ANIMATION_CONFIG.trackAnimationDuration, 1);

      // 더 부드러운 easing - ease-in-out-cubic
      const easeProgress = progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      // 마지막 부분에서 더 세밀한 인덱스 계산
      const currentIndex = Math.floor(easeProgress * totalPoints);
      const animatedCoordinates = smoothCoordinates.slice(0, currentIndex + 1);

      // 90% 이상 진행되었을 때 더 세밀한 업데이트
      if (progress > 0.9 && currentIndex < totalPoints - 1) {
        const subProgress = (easeProgress * totalPoints) - currentIndex;
        if (subProgress > 0 && smoothCoordinates[currentIndex + 1]) {
          // 현재 점과 다음 점 사이를 보간
          const currentPoint = smoothCoordinates[currentIndex];
          const nextPoint = smoothCoordinates[currentIndex + 1];
          const interpolatedPoint = [
            currentPoint[0] + (nextPoint[0] - currentPoint[0]) * subProgress,
            currentPoint[1] + (nextPoint[1] - currentPoint[1]) * subProgress
          ];
          animatedCoordinates.push(interpolatedPoint);
        }
      }

      // 트랙이 완성되면 닫힌 루프로 만들기
      if (currentIndex >= totalPoints - 1 && animatedCoordinates.length > 0) {
        animatedCoordinates.push(smoothCoordinates[0]);
      }

      if (animatedCoordinates.length > 1) {
        (map.getSource(trackId) as mapboxgl.GeoJSONSource).setData({
          type: 'Feature' as const,
          properties: {},
          geometry: {
            type: 'LineString' as const,
            coordinates: animatedCoordinates
          }
        });
      }

      if (progress < 1) {
        requestAnimationFrame(animateTrack);
      } else {
        // 트랙 애니메이션 완료 후 DRS 존 그리기
        drawDRSZones(map, trackId, smoothCoordinates, circuitId);

        // DRS 존 시퀀셜 시그널 애니메이션
        setTimeout(() => animateDRSSequentialSignal(map, trackId), 500);

        if (onComplete) {
          onComplete();
        }
      }
    };

    animateTrack();
  }, delay);
};

// DRS 존 시퀀셜 시그널 애니메이션 (Symbol 기반)
const animateDRSSequentialSignal = (map: mapboxgl.Map, trackId: string) => {
  const animationDuration = 2000; // 2초
  const startTime = performance.now();
  
  const animate = () => {
    // 줌 레벨 확인 - 14 미만이면 애니메이션 중지
    const currentZoom = map.getZoom();
    if (currentZoom < 14) {
      // 1초 후에 다시 체크
      setTimeout(() => {
        if (map.getZoom() >= 14) {
          animateDRSSequentialSignal(map, trackId);
        }
      }, 1000);
      return;
    }
    
    const elapsed = performance.now() - startTime;
    const totalProgress = (elapsed / animationDuration) % 1;
    
    // 모든 DRS 존에 애니메이션 적용
    let drsIndex = 0;
    while (true) {
      const drsId = `${trackId}-drs-${drsIndex}`;
      const layerId = `${drsId}-symbols`;
      
      if (!map.getLayer(layerId)) break; // 더 이상 DRS 존이 없으면 종료
      
      // Symbol 레이어의 icon-image를 표현식으로 업데이트
      map.setLayoutProperty(layerId, 'icon-image', [
        'case',
        ['<', 
          ['%', 
            ['+', 
              ['get', 'index'], 
              ['-', 30, ['*', totalProgress, 30]]
            ], 
            30
          ], 
          7.5
        ], 'chevron-dim',
        ['<', 
          ['%', 
            ['+', 
              ['get', 'index'], 
              ['-', 30, ['*', totalProgress, 30]]
            ], 
            30
          ], 
          15
        ], 'chevron-mid',
        ['<', 
          ['%', 
            ['+', 
              ['get', 'index'], 
              ['-', 30, ['*', totalProgress, 30]]
            ], 
            30
          ], 
          22.5
        ], 'chevron-bright',
        'chevron-max'
      ]);
      
      drsIndex++; // 다음 DRS 존으로 이동
    }
    
    requestAnimationFrame(animate);
  };
  
  animate();
};