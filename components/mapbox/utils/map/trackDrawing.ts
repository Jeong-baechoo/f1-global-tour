import mapboxgl from 'mapbox-gl';
import { interpolateCoordinates } from '../animations/globeAnimation';
import { TrackDrawOptions } from '../../types';
import { ANIMATION_CONFIG } from '../../constants';

// DRS 존 인덱스 정의 - 동적으로 계산
const DRS_ZONES: { [key: string]: Array<{ start: number; end: number }> | 'dynamic' } = {
  'nurburgring': 'dynamic',  // 전체 트랙의 초반 10%를 DRS 존으로 설정
  // 다른 서킷들의 DRS 존 추가 가능
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
  let drsZones = DRS_ZONES[circuitId];
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

  drsZones.forEach((zone, index) => {
    const drsLineCoordinates = trackCoordinates.slice(zone.start, zone.end + 1);
    const drsId = `${trackId}-drs-${index}`;
    
    // DRS 포인트 생성 (Symbol용)
    const features = [];
    const pointInterval = 5; // 5포인트마다 하나의 쉐브론
    
    for (let i = 0; i < drsLineCoordinates.length - 1; i += pointInterval) {
      const coord = drsLineCoordinates[i];
      const nextCoord = drsLineCoordinates[Math.min(i + 1, drsLineCoordinates.length - 1)];
      
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
    
    // Symbol 레이어 추가
    if (!map.getLayer(`${drsId}-symbols`)) {
      map.addLayer({
        id: `${drsId}-symbols`,
        type: 'symbol',
        source: drsId,
        layout: {
          'icon-image': 'chevron-dim', // 초기 상태
          'icon-size': 0.8,
          'icon-rotate': ['get', 'bearing'],
          'icon-rotation-alignment': 'map', // 맵에 고정 (카메라 회전과 무관)
          'icon-pitch-alignment': 'map',    // 피치에도 맵 고정
          'icon-allow-overlap': true,
          'icon-ignore-placement': true
        }
      });
    }
  });
};

// 범용 트랙 그리기 함수
export const drawTrack = (
  map: mapboxgl.Map,
  { trackId, trackCoordinates, color = '#FF1801', delay = 0, onComplete }: TrackDrawOptions
) => {
  setTimeout(() => {
    if (!map) return;

    // 이미 트랙이 그려져 있으면 스킵
    if (map.getLayer(`${trackId}-main`)) {
      return;
    }

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
    }

    // 트랙 아웃라인 레이어
    if (!map.getLayer(`${trackId}-outline`)) {
      map.addLayer({
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
    if (!map.getLayer(`${trackId}-main`)) {
      map.addLayer({
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

    // 서킷 ID 추출 (trackId는 보통 'circuitId-track' 형식)
    const circuitId = trackId.replace('-track', '');

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
  const drsId = `${trackId}-drs-0`;
  
  const animate = () => {
    const elapsed = performance.now() - startTime;
    const totalProgress = (elapsed / animationDuration) % 1;
    
    // Symbol 레이어의 icon-image를 표현식으로 업데이트
    if (map.getLayer(`${drsId}-symbols`)) {
      // 각 포인트의 인덱스와 진행도에 따라 다른 이미지 표시
      map.setLayoutProperty(`${drsId}-symbols`, 'icon-image', [
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
    }
    
    requestAnimationFrame(animate);
  };
  
  animate();
};