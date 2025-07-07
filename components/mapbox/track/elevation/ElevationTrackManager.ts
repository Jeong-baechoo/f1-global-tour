import mapboxgl from 'mapbox-gl';
import { interpolateCoordinates } from '../../utils/animations/globeAnimation';

export class ElevationTrackManager {
  // Mapbox Terrain API를 사용하여 실제 고도 가져오기
  private static async getElevationFromMapbox(
    map: mapboxgl.Map,
    coordinates: number[][]
  ): Promise<number[]> {
    // Terrain 소스 확인 및 설정
    if (!map.getSource('mapbox-dem')) {
      map.addSource('mapbox-dem', {
        type: 'raster-dem',
        url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
        tileSize: 512,
        maxzoom: 14
      });
    }
    
    // setTerrain이 설정되어 있는지 확인
    const terrainEnabled = map.getTerrain();
    if (!terrainEnabled || terrainEnabled.exaggeration === 0) {
      console.log('Setting minimal terrain exaggeration for elevation data...');
      map.setTerrain({
        source: 'mapbox-dem',
        exaggeration: 0.001 // 매우 작은 값으로 설정 - 시각적으로는 평평하지만 고도 데이터 접근 가능
      });
    }
    
    // 지형 타일이 로드될 때까지 대기
    await new Promise((resolve) => {
      const checkTerrain = () => {
        // 첫 번째 좌표로 테스트
        const testElevation = map.queryTerrainElevation(coordinates[0] as [number, number]);
        if (testElevation !== null && testElevation !== undefined && testElevation > 0) {
          console.log('Terrain tiles loaded, test elevation:', testElevation);
          resolve(true);
        } else {
          // 재시도
          setTimeout(checkTerrain, 500);
        }
      };
      
      // 최대 10초 대기
      setTimeout(() => resolve(false), 10000);
      checkTerrain();
    });
    
    const elevations: number[] = [];
    
    // 각 좌표의 고도 가져오기
    for (let i = 0; i < coordinates.length; i++) {
      const coord = coordinates[i];
      try {
        const elevation = map.queryTerrainElevation([coord[0], coord[1]] as [number, number]);
        if (elevation !== null && elevation !== undefined) {
          elevations.push(elevation);
        } else {
          // 인접한 점들의 평균값으로 추정
          if (i > 0 && i < coordinates.length - 1) {
            const prevElev = elevations[i - 1] || 0;
            elevations.push(prevElev); // 이전 값 사용
          } else {
            elevations.push(0);
          }
        }
      } catch (e) {
        console.error(`Error at index ${i}:`, e);
        elevations.push(elevations[elevations.length - 1] || 0);
      }
    }
    
    // 고도가 모두 0인 경우 경고
    const hasValidElevation = elevations.some(e => e > 0);
    if (!hasValidElevation) {
      console.error('All elevations are 0, terrain data may not be available for this region');
    }
    
    // 데이터를 가져온 후에도 매우 작은 exaggeration 유지
    // (0으로 설정하면 다음에 고도 데이터를 가져올 수 없음)
    map.setTerrain({
      source: 'mapbox-dem',
      exaggeration: 0.001
    });
    
    return elevations;
  }

  // 3D 고저차 트랙 그리기
  static async draw3DElevationTrack(
    map: mapboxgl.Map,
    trackId: string,
    trackCoordinates: number[][],
    circuitId: string
  ): Promise<void> {
    // 세분화 레벨 조절 (0: 추가 세분화 없음, 1: 각 세그먼트당 1개 중간점 추가)
    const SUBDIVISION_LEVEL = 1; // 각 세그먼트당 1개 중간점 추가
    
    // 기본 보간만 적용
    const interpolatedCoords = interpolateCoordinates(trackCoordinates);
    
    // 트랙이 닫힌 루프인지 확인
    const firstCoord = interpolatedCoords[0];
    const lastCoord = interpolatedCoords[interpolatedCoords.length - 1];
    const distance = Math.sqrt(
      Math.pow(firstCoord[0] - lastCoord[0], 2) + 
      Math.pow(firstCoord[1] - lastCoord[1], 2)
    );
    
    // 첫 점과 마지막 점이 가까우면 닫힌 트랙으로 처리
    const isClosedTrack = distance < 0.001;
    
    // 닫힌 트랙이면 마지막 점을 첫 점으로 대체하여 완전히 닫기
    if (isClosedTrack && interpolatedCoords[interpolatedCoords.length - 1] !== interpolatedCoords[0]) {
      interpolatedCoords[interpolatedCoords.length - 1] = interpolatedCoords[0];
    }
    
    // 선택적 세분화
    let finalCoords = interpolatedCoords;
    if (SUBDIVISION_LEVEL > 0) {
      const detailedCoords = [];
      const loopLength = isClosedTrack ? interpolatedCoords.length : interpolatedCoords.length - 1;
      
      for (let i = 0; i < loopLength; i++) {
        const coord1 = interpolatedCoords[i];
        const coord2 = interpolatedCoords[(i + 1) % interpolatedCoords.length];
        
        detailedCoords.push(coord1);
        
        // 지정된 레벨만큼 중간점 추가
        for (let j = 1; j <= SUBDIVISION_LEVEL; j++) {
          const t = j / (SUBDIVISION_LEVEL + 1);
          detailedCoords.push([
            coord1[0] + (coord2[0] - coord1[0]) * t,
            coord1[1] + (coord2[1] - coord1[1]) * t
          ]);
        }
      }
      
      // 닫힌 트랙이 아닌 경우에만 마지막 점 추가
      if (!isClosedTrack) {
        detailedCoords.push(interpolatedCoords[interpolatedCoords.length - 1]);
      }
      
      finalCoords = detailedCoords;
    }
    
    trackCoordinates = finalCoords;
    
    // 항상 실제 고도 데이터 사용
    console.log(`Circuit ${circuitId}: Using actual terrain data from Mapbox`);
    const actualElevations = await this.getElevationFromMapbox(map, trackCoordinates);
    const minElevation = Math.min(...actualElevations);
    const maxElevation = Math.max(...actualElevations);
    const elevationRange = maxElevation - minElevation;
    
    // exaggeration 0.001로 인한 축소를 보정하여 실제 고도 표시
    const actualMinElev = minElevation * 1000;
    const actualMaxElev = maxElevation * 1000;
    const actualRange = elevationRange * 1000;
    console.log(`Actual elevation range: ${actualMinElev.toFixed(1)}m - ${actualMaxElev.toFixed(1)}m (${actualRange.toFixed(1)}m range)`);
    
    // 트랙을 세그먼트로 나누어 각각 3D 폴리곤으로 표현
    const segmentWidth = 15; // 트랙 폭 (미터) - 곡선에서의 갈라짐 방지를 위해 줄임
    const segments = [];
    
    // 고도 프로파일을 트랙 좌표에 맞게 보간
    const interpolateElevation = (progress: number): number => {
      // 실제 고도 데이터 사용 - 더 부드러운 보간
      const scaledIndex = progress * (actualElevations.length - 1);
      const lowerIndex = Math.floor(scaledIndex);
      const upperIndex = Math.ceil(scaledIndex);
      
      if (lowerIndex === upperIndex) {
        return actualElevations[lowerIndex] - minElevation;
      }
      
      // 선형 보간으로 부드럽게
      const fraction = scaledIndex - lowerIndex;
      const lowerValue = actualElevations[lowerIndex];
      const upperValue = actualElevations[upperIndex];
      
      return (lowerValue + (upperValue - lowerValue) * fraction) - minElevation;
    };
    
    // 각 점에서의 수직 벡터를 미리 계산 (부드러운 연결을 위해)
    const perpVectors = [];
    const isLoopTrack = Math.sqrt(
      Math.pow(trackCoordinates[0][0] - trackCoordinates[trackCoordinates.length - 1][0], 2) + 
      Math.pow(trackCoordinates[0][1] - trackCoordinates[trackCoordinates.length - 1][1], 2)
    ) < 0.001;
    
    for (let i = 0; i < trackCoordinates.length; i++) {
      let perpX = 0, perpY = 0;
      
      // 이전과 다음 인덱스 계산 (닫힌 루프 고려)
      const prevIdx = isLoopTrack ? 
        (i - 1 + trackCoordinates.length) % trackCoordinates.length : 
        Math.max(0, i - 1);
      const nextIdx = isLoopTrack ? 
        (i + 1) % trackCoordinates.length : 
        Math.min(trackCoordinates.length - 1, i + 1);
      
      if (i === 0 && !isLoopTrack) {
        // 열린 트랙의 첫 점: 다음 점과의 벡터 사용
        const dx = trackCoordinates[nextIdx][0] - trackCoordinates[i][0];
        const dy = trackCoordinates[nextIdx][1] - trackCoordinates[i][1];
        const length = Math.sqrt(dx * dx + dy * dy);
        perpX = -dy / length;
        perpY = dx / length;
      } else if (i === trackCoordinates.length - 1 && !isLoopTrack) {
        // 열린 트랙의 마지막 점: 이전 점과의 벡터 사용
        const dx = trackCoordinates[i][0] - trackCoordinates[prevIdx][0];
        const dy = trackCoordinates[i][1] - trackCoordinates[prevIdx][1];
        const length = Math.sqrt(dx * dx + dy * dy);
        perpX = -dy / length;
        perpY = dx / length;
      } else {
        // 중간 점 또는 닫힌 트랙의 모든 점: 이전과 다음 점의 평균 벡터 사용
        const dx1 = trackCoordinates[i][0] - trackCoordinates[prevIdx][0];
        const dy1 = trackCoordinates[i][1] - trackCoordinates[prevIdx][1];
        const dx2 = trackCoordinates[nextIdx][0] - trackCoordinates[i][0];
        const dy2 = trackCoordinates[nextIdx][1] - trackCoordinates[i][1];
        
        const length1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);
        const length2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
        
        if (length1 > 0 && length2 > 0) {
          const perp1X = -dy1 / length1;
          const perp1Y = dx1 / length1;
          const perp2X = -dy2 / length2;
          const perp2Y = dx2 / length2;
          
          // 두 수직 벡터의 평균 (정규화)
          perpX = (perp1X + perp2X) / 2;
          perpY = (perp1Y + perp2Y) / 2;
          const avgLength = Math.sqrt(perpX * perpX + perpY * perpY);
          if (avgLength > 0) {
            perpX /= avgLength;
            perpY /= avgLength;
          }
        }
      }
      
      perpVectors.push([perpX, perpY]);
    }
    
    // 트랙이 닫힌 루프인지 다시 확인
    const firstPoint = trackCoordinates[0];
    const lastPoint = trackCoordinates[trackCoordinates.length - 1];
    const trackDistance = Math.sqrt(
      Math.pow(firstPoint[0] - lastPoint[0], 2) + 
      Math.pow(firstPoint[1] - lastPoint[1], 2)
    );
    const isLoop = trackDistance < 0.001;
    
    // 세그먼트 생성 (닫힌 트랙의 경우 마지막과 첫 번째를 연결)
    const segmentCount = isLoop ? trackCoordinates.length : trackCoordinates.length - 1;
    
    for (let i = 0; i < segmentCount; i++) {
      const coord1 = trackCoordinates[i];
      const coord2 = trackCoordinates[(i + 1) % trackCoordinates.length];
      
      // 미터를 도 단위로 변환 (대략적)
      const metersToDegreesLat = 1 / 111320;
      const metersToDegreesLng = 1 / (111320 * Math.cos(coord1[1] * Math.PI / 180));
      
      const halfWidth = segmentWidth / 2;
      
      // 각 점에서의 오프셋 계산
      const offset1X = perpVectors[i][0] * halfWidth * metersToDegreesLng;
      const offset1Y = perpVectors[i][1] * halfWidth * metersToDegreesLat;
      
      // 다음 인덱스 (닫힌 루프 고려)
      const nextPerpIdx = (i + 1) % perpVectors.length;
      const offset2X = perpVectors[nextPerpIdx][0] * halfWidth * metersToDegreesLng;
      const offset2Y = perpVectors[nextPerpIdx][1] * halfWidth * metersToDegreesLat;
      
      // 고도 계산 (보간 사용)
      const progress1 = i / (trackCoordinates.length - 1);
      const progress2 = (i + 1) / (trackCoordinates.length - 1);
      
      const elevation1 = interpolateElevation(progress1);
      const elevation2 = interpolateElevation(progress2);
      
      // 각 세그먼트의 네 모서리에 대한 고도 설정
      // 모든 서킷에 동일한 스케일 적용하여 실제 고저차 비율 유지
      const heightScale = 1000; // 실제 데이터는 1000배로 고정
      const scaledElevation1 = elevation1 * heightScale;
      const scaledElevation2 = elevation2 * heightScale;
      
      // 3차 스플라인 보간을 위한 계산
      let smoothedElevation1 = scaledElevation1;
      let smoothedElevation2 = scaledElevation2;
      
      // Catmull-Rom 스플라인 보간 적용
      if (i > 0 && i < segmentCount - 1) {
        // 4개의 제어점 사용 (닫힌 루프 고려)
        const p0Idx = isLoop ? (i - 1 + trackCoordinates.length) % trackCoordinates.length : Math.max(0, i - 1);
        const p3Idx = isLoop ? (i + 2) % trackCoordinates.length : Math.min(trackCoordinates.length - 1, i + 2);
        
        const p0Progress = p0Idx / (trackCoordinates.length - 1);
        const p3Progress = p3Idx / (trackCoordinates.length - 1);
        
        const p0Elev = interpolateElevation(p0Progress) * heightScale;
        const p1Elev = scaledElevation1;
        const p2Elev = scaledElevation2;
        const p3Elev = interpolateElevation(p3Progress) * heightScale;
        
        // Catmull-Rom 보간 계수
        const tension = 0.5;
        
        // 첫 번째 점에서의 보간
        const t1 = 0.0;
        const t1_2 = t1 * t1;
        const t1_3 = t1_2 * t1;
        
        smoothedElevation1 = tension * (
          (2 * p1Elev) +
          (-p0Elev + p2Elev) * t1 +
          (2 * p0Elev - 5 * p1Elev + 4 * p2Elev - p3Elev) * t1_2 +
          (-p0Elev + 3 * p1Elev - 3 * p2Elev + p3Elev) * t1_3
        );
        
        // 두 번째 점에서의 보간
        const t2 = 1.0;
        const t2_2 = t2 * t2;
        const t2_3 = t2_2 * t2;
        
        smoothedElevation2 = tension * (
          (2 * p1Elev) +
          (-p0Elev + p2Elev) * t2 +
          (2 * p0Elev - 5 * p1Elev + 4 * p2Elev - p3Elev) * t2_2 +
          (-p0Elev + 3 * p1Elev - 3 * p2Elev + p3Elev) * t2_3
        );
      }
      
      // 세분화 없이 하나의 폴리곤만 생성 (빛 반사 문제 해결)
      segments.push({
        type: 'Feature' as const,
        properties: {
          height1Left: smoothedElevation1 + 10,
          height1Right: smoothedElevation1 + 10,
          height2Left: smoothedElevation2 + 10,
          height2Right: smoothedElevation2 + 10,
          avgHeight: (smoothedElevation1 + smoothedElevation2) / 2 + 10,
          baseHeight: -0.1
        },
        geometry: {
          type: 'Polygon' as const,
          coordinates: [[
            [coord1[0] - offset1X, coord1[1] - offset1Y],
            [coord1[0] + offset1X, coord1[1] + offset1Y],
            [coord2[0] + offset2X, coord2[1] + offset2Y],
            [coord2[0] - offset2X, coord2[1] - offset2Y],
            [coord1[0] - offset1X, coord1[1] - offset1Y] // 폐합
          ]]
        }
      });
    }
    
    // 3D 트랙 소스 추가
    const source3DId = `${trackId}-3d`;
    if (!map.getSource(source3DId)) {
      map.addSource(source3DId, {
        type: 'geojson',
        data: {
          type: 'FeatureCollection' as const,
          features: segments
        }
      });
    }
    
    // 3D 폴리곤 레이어 추가
    if (!map.getLayer(`${source3DId}-extrusion`)) {
      map.addLayer({
        id: `${source3DId}-extrusion`,
        type: 'fill-extrusion',
        source: source3DId,
        paint: {
          'fill-extrusion-color': [
            'interpolate',
            ['linear'],
            ['get', 'avgHeight'],
            // --- 0-40m: 대부분의 서킷 구간 (세밀한 그라데이션) ---
            0, '#1e3a8a',     // 딥한 파란색 (0m)
            3, '#1e40af',     // 진한 파랑 (3m)
            6, '#2563eb',     // 중간 파랑 (6m)
            9, '#3b82f6',     // 기본 파랑 (9m)
            12, '#06b6d4',    // 시안 (12m)
            15, '#0891b2',    // 진한 시안 (15m)
            18, '#059669',    // 에메랄드 (18m)
            21, '#10b981',    // 밝은 에메랄드 (21m)
            24, '#22c55e',    // 초록 (24m)
            27, '#84cc16',    // 라임 (27m)
            30, '#eab308',    // 노랑 (30m)
            33, '#f59e0b',    // 앰버 (33m)
            36, '#f97316',    // 주황 (36m)
            39, '#ea580c',    // 진한 주황 (39m)
            
            // --- 40m 이상: 특별한 고저차 구간 ---
            40, '#dc2626',    // 빨강 (40m) - 특별 구간 시작
            45, '#b91c1c',    // 진한 빨강 (45m)
            50, '#991b1b',    // 매우 진한 빨강 (50m)
            55, '#ef4444',    // 밝은 빨강 (55m)
            60, '#f87171',    // 연한 빨강 (60m)
            65, '#fca5a5',    // 매우 연한 빨강 (65m)
            70, '#fbbf24',    // 금색 (70m)
            75, '#f59e0b',    // 진한 금색 (75m)
            80, '#d97706',    // 매우 진한 금색 (80m)
            85, '#b45309',    // 브론즈 (85m)
            90, '#92400e',    // 진한 브론즈 (90m)
            95, '#78350f',    // 매우 진한 브론즈 (95m)
            
            // --- 최고 구간 (매우 드문 경우) ---
            98, '#a855f7',    // 보라색 (98m)
            100, '#c084fc',   // 연보라색 (100m)
            102, '#e9d5ff',   // 매우 연한 보라색 (102m)
            105, '#faf5ff'    // 거의 흰 보라색 (105m)
          ],
          'fill-extrusion-height': [
            'interpolate',
            ['linear'],
            ['zoom'],
            12, ['get', 'avgHeight'],
            16, ['*', ['get', 'avgHeight'], 1.5]
          ],
          'fill-extrusion-base': ['get', 'baseHeight'],
          'fill-extrusion-opacity': 0.9,  // 불투명도를 약간 낮춤
          'fill-extrusion-vertical-gradient': false,
          // 난반사를 줄이기 위한 설정
          'fill-extrusion-ambient-occlusion-intensity': 0.5,  // 주변광 차폐 강도 증가
          'fill-extrusion-ambient-occlusion-radius': 5  // 주변광 차폐 반경
        }
      });
    }
    
    // 3D 트랙 상단 면 추가 (더 부드러운 표현을 위해)
    if (!map.getLayer(`${source3DId}-top`)) {
      map.addLayer({
        id: `${source3DId}-top`,
        type: 'fill',
        source: source3DId,
        paint: {
          'fill-color': [
            'interpolate',
            ['linear'],
            ['get', 'avgHeight'],
            // --- 0-40m: 대부분의 서킷 구간 (세밀한 그라데이션) ---
            0, '#1a1a2e',     // 어두운 남색
            3, '#1e2434',
            6, '#222e3a',
            9, '#263840',
            12, '#2a4246',
            15, '#2e4c4c',
            18, '#325652',
            21, '#366058',
            24, '#3a6a5e',
            27, '#3e7464',
            30, '#427e6a',
            33, '#468870',
            36, '#4a9276',
            39, '#4e9c7c',
            
            // --- 40m 이상: 특별한 고저차 구간 ---
            40, '#6b3c3a',    // 갈색-빨강 전환
            45, '#763c40',
            50, '#813c46',
            55, '#8c3c4c',
            60, '#973c52',
            65, '#a23c58',
            70, '#ad3c5e',
            75, '#b84c64',
            80, '#c35c6a',
            85, '#ce6c70',
            90, '#d97c76',
            95, '#e48c7c',
            98, '#ef9c82',
            100, '#fa9c88',   // 100m까지 빨간 계열
            102, '#b8a2e8',   // 연보라
            105, '#d4c5f9'    // 매우 연한 보라
          ],
          'fill-opacity': 0.9  // 불투명도 증가
        }
      });
    }
  }
}