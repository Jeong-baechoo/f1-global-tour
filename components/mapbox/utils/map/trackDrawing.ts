import mapboxgl from 'mapbox-gl';
import { interpolateCoordinates } from '../animations/globeAnimation';
import { TrackDrawOptions } from '../../types';
import { ANIMATION_CONFIG } from '../../constants';

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
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
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