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
    
    // 선택적 세분화
    let finalCoords = interpolatedCoords;
    if (SUBDIVISION_LEVEL > 0) {
      const detailedCoords = [];
      for (let i = 0; i < interpolatedCoords.length - 1; i++) {
        const coord1 = interpolatedCoords[i];
        const coord2 = interpolatedCoords[i + 1];
        
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
      detailedCoords.push(interpolatedCoords[interpolatedCoords.length - 1]);
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
    for (let i = 0; i < trackCoordinates.length; i++) {
      let perpX = 0, perpY = 0;
      
      if (i === 0) {
        // 첫 점: 다음 점과의 벡터 사용
        const dx = trackCoordinates[1][0] - trackCoordinates[0][0];
        const dy = trackCoordinates[1][1] - trackCoordinates[0][1];
        const length = Math.sqrt(dx * dx + dy * dy);
        perpX = -dy / length;
        perpY = dx / length;
      } else if (i === trackCoordinates.length - 1) {
        // 마지막 점: 이전 점과의 벡터 사용
        const dx = trackCoordinates[i][0] - trackCoordinates[i-1][0];
        const dy = trackCoordinates[i][1] - trackCoordinates[i-1][1];
        const length = Math.sqrt(dx * dx + dy * dy);
        perpX = -dy / length;
        perpY = dx / length;
      } else {
        // 중간 점: 이전과 다음 점의 평균 벡터 사용
        const dx1 = trackCoordinates[i][0] - trackCoordinates[i-1][0];
        const dy1 = trackCoordinates[i][1] - trackCoordinates[i-1][1];
        const dx2 = trackCoordinates[i+1][0] - trackCoordinates[i][0];
        const dy2 = trackCoordinates[i+1][1] - trackCoordinates[i][1];
        
        const length1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);
        const length2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
        
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
      
      perpVectors.push([perpX, perpY]);
    }
    
    for (let i = 0; i < trackCoordinates.length - 1; i++) {
      const coord1 = trackCoordinates[i];
      const coord2 = trackCoordinates[i + 1];
      
      // 미터를 도 단위로 변환 (대략적)
      const metersToDegreesLat = 1 / 111320;
      const metersToDegreesLng = 1 / (111320 * Math.cos(coord1[1] * Math.PI / 180));
      
      const halfWidth = segmentWidth / 2;
      
      // 각 점에서의 오프셋 계산
      const offset1X = perpVectors[i][0] * halfWidth * metersToDegreesLng;
      const offset1Y = perpVectors[i][1] * halfWidth * metersToDegreesLat;
      const offset2X = perpVectors[i + 1][0] * halfWidth * metersToDegreesLng;
      const offset2Y = perpVectors[i + 1][1] * halfWidth * metersToDegreesLat;
      
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
      if (i > 0 && i < trackCoordinates.length - 2) {
        // 4개의 제어점 사용
        const p0Progress = Math.max(0, i - 1) / (trackCoordinates.length - 1);
        const p3Progress = Math.min(1, i + 2) / (trackCoordinates.length - 1);
        
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
            // --- 가장 낮은 구간 (Lowest Point) ---
            0, '#020617',     // 거의 검정에 가까운 짙은 남색 (0m) - 바닥 강조
            
            // --- 낮은 구간 (Low Elevations) ---
            15, '#1E40AF',    // 진한 파랑 (15m) - 깊이감
            30, '#3B82F6',    // 기본 파랑 (30m) - 물의 색
            
            // --- 중간 저점 (Mid-Low Elevations) ---
            45, '#16A34A',    // 짙은 초록 (45m) - 안정감
            60, '#22C55E',    // 기본 초록 (60m) - 평온함
            
            // --- 중간 고점 (Mid-High Elevations) ---
            75, '#EAB308',    // 노랑/금색 (75m) - 주의, 상승 시작
            90, '#F97316',    // 주황 (90m) - 에너지, 전환
            
            // --- 높은 구간 (High Elevations) ---
            105, '#DC2626',   // 기본 빨강 (105m) - F1 핵심색, 위험
            120, '#EF4444',   // 밝은 빨강 (120m) - 극적인 강조
            
            // --- 가장 높은 구간 (Highest Point) ---
            130, '#F8FAFC'    // 거의 흰색 (130m+) - 정점, 하늘과 가까운 곳
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
            5, '#1a1a1a',
            10, '#222222',
            15, '#2a2a2a',
            20, '#333333',
            25, '#3b3b3b',
            30, '#444444',
            35, '#4c4c4c',
            40, '#555555',
            45, '#5d5d5d',
            50, '#666666',
            60, '#6e6e6e',
            70, '#777777',
            80, '#7f7f7f',
            90, '#888888',
            100, '#909090',
            120, '#999999',
            150, '#a2a2a2'
          ],
          'fill-opacity': 0.9  // 불투명도 증가
        }
      });
    }
  }
}