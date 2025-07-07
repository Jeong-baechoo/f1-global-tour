import mapboxgl from 'mapbox-gl';
import { interpolateCoordinates } from '../animations/globeAnimation';
import { TrackDrawOptions } from '../../types';
import { ANIMATION_CONFIG } from '../../constants';
import { CIRCUIT_ID_MAPPING } from '../data/circuitMapping';
import { getDRSZones, getSectorData } from '../data/trackDataLoader';
import { getSectorData as getSectorMarkerData } from '../../markers/circuit/SectorMarkerManager';
import { trackManager } from './trackManager';

// DRS 존 인덱스 정의 - 동적으로 계산
const DRS_ZONES: { [key: string]: Array<{ start: number; end: number; wrapAround?: boolean }> | 'dynamic' } = {
  'nurburgring': 'dynamic',  // 전체 트랙의 초반 10%를 DRS 존으로 설정
  // 다른 서킷들의 DRS 존 추가 가능
};


// SVG 쉐브론 생성 함수
const createChevronSVG = (color: string = '#00FF00', opacity: number = 1): string => {
  return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6 15L12 9L18 15" stroke="${color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" opacity="${opacity}"/>
  </svg>`;
};

// GeoJSON DRS 존 그리기 함수
const drawGeoJSONDRSZones = async (
  map: mapboxgl.Map,
  trackId: string,
  geoJsonDrsZones: Array<{ id: string; name: string; coordinates: number[][]; color: string }>
) => {
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

  const currentDrsLayers: string[] = [];

  geoJsonDrsZones.forEach((drsZone, index) => {
    const drsId = `${trackId}-drs-${index}`;


    // DRS 존 좌표에 보간 적용
    const interpolatedCoordinates = interpolateCoordinates(drsZone.coordinates);

    // DRS 포인트 생성 (Symbol용)
    const features = [];
    const pointInterval = 5;

    for (let i = 0; i < interpolatedCoordinates.length - 1; i += pointInterval) {
      const coordIndex = Math.floor(i);
      const coord = interpolatedCoordinates[coordIndex];
      const nextCoord = interpolatedCoordinates[Math.min(coordIndex + 1, interpolatedCoordinates.length - 1)];

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

    // Symbol 레이어 추가 (가장 위에 표시되도록)
    const layerId = `${drsId}-symbols`;
    if (!map.getLayer(layerId)) {
      map.addLayer({
        id: layerId,
        type: 'symbol',
        source: drsId,
        layout: {
          'icon-image': 'chevron-dim', // 초기 상태
          'icon-size': 0.8,
          'icon-rotate': ['get', 'bearing'],
          'icon-rotation-alignment': 'map', // 맵에 고정 (카메라 회전과 무관)
          'icon-pitch-alignment': 'map',    // 피치에도 맵 고정
          'icon-allow-overlap': true,
          'icon-ignore-placement': true,
          'visibility': 'visible' // 명시적으로 표시
        }
      });
      currentDrsLayers.push(layerId);
    }
  });

  // DRS 레이어 정보 저장
  if (currentDrsLayers.length > 0) {
    drsLayers.push({
      trackId,
      drsLayers: currentDrsLayers
    });
  }
};

// DRS 존 그리기 함수 (Symbol 기반)
const drawDRSZones = async (
  map: mapboxgl.Map,
  trackId: string,
  trackCoordinates: number[][],
  circuitId: string
) => {
  // DRS ID 목록 수집용
  const drsIds: string[] = [];


  // Circuit ID 매핑 (austria -> at-1969)
  const mappedCircuitId = CIRCUIT_ID_MAPPING[circuitId] || circuitId;

  let drsZones;
  
  // 1순위: GeoJSON 좌표 방식 시도
  try {
    const geoJsonDrsZones = await getDRSZones(circuitId);
    if (geoJsonDrsZones && geoJsonDrsZones.length > 0) {
      // GeoJSON 좌표를 Symbol 방식으로 직접 처리
      await drawGeoJSONDRSZones(map, trackId, geoJsonDrsZones);
      return;
    }
  } catch {
  }
  
  // 2순위: 인덱스 방식 (DRS_ZONES)
  drsZones = DRS_ZONES[mappedCircuitId];

  // 3순위: Dynamic 방식
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

  // drsZones가 배열인지 확인 후 처리
  if (Array.isArray(drsZones)) {
    const currentDrsLayers: string[] = [];

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
    const layerId = `${drsId}-symbols`;
    if (!map.getLayer(layerId)) {
      map.addLayer({
        id: layerId,
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
          'icon-ignore-placement': true,
          'visibility': 'visible' // 명시적으로 표시
        }
      });
      currentDrsLayers.push(layerId);
    }

    // DRS 레이어 정보 저장
    if (currentDrsLayers.length > 0) {
      drsLayers.push({
        trackId,
        drsLayers: currentDrsLayers
      });
    }
    });
  }
};

// 트랙 좌표 순서에서 섹터 시작 지점의 인덱스를 찾는 함수
const findSectorIndexInTrack = (trackCoordinates: number[][], sectorCoord: number[], threshold: number = 0.001): number => {
  let closestIndex = -1;
  let minDistance = Infinity;

  for (let i = 0; i < trackCoordinates.length; i++) {
    const coord = trackCoordinates[i];
    const dx = coord[0] - sectorCoord[0];
    const dy = coord[1] - sectorCoord[1];
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < minDistance) {
      minDistance = distance;
      closestIndex = i;
    }

    // 임계값 내에 있으면 즉시 반환
    if (distance < threshold) {
      return i;
    }
  }

  // 임계값 내에서 찾지 못하면 가장 가까운 지점 반환
  if (closestIndex >= 0) {
    return closestIndex;
  }

  return -1; // 찾지 못함
};

// 특정 서킷의 섹터 3 하드코딩된 위치 (트랙 진행률 기준)
const HARDCODED_SECTOR3_POSITIONS = {
  'monaco': 0.72,       // 72% 지점
  'netherlands': 0.68,  // 68% 지점  
  'singapore': 0.75,    // 75% 지점
  'saudi-arabia': 0.73  // 73% 지점
};

// 섹터 마커 데이터에 트랙 인덱스 추가
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const enrichSectorDataWithTrackIndex = (sectorData: any[], originalTrackCoordinates: number[][], smoothTrackCoordinates: number[][], circuitId: string) => {
  return sectorData.map(sector => {
    let originalTrackIndex: number;
    let originalProgress: number;

    // 특정 서킷의 섹터 3은 하드코딩된 위치 사용
    if (sector.number === 3 && HARDCODED_SECTOR3_POSITIONS[circuitId as keyof typeof HARDCODED_SECTOR3_POSITIONS]) {
      originalProgress = HARDCODED_SECTOR3_POSITIONS[circuitId as keyof typeof HARDCODED_SECTOR3_POSITIONS];
      originalTrackIndex = Math.floor(originalProgress * originalTrackCoordinates.length);
    } else {
      // 일반적인 경우: 원본 트랙 좌표에서 섹터 위치 찾기
      originalTrackIndex = findSectorIndexInTrack(originalTrackCoordinates, sector.position);
      
      if (originalTrackIndex < 0) {
        return { ...sector, trackIndex: -1, trackProgress: -1 };
      }
      
      originalProgress = originalTrackIndex / originalTrackCoordinates.length;
    }
    
    // 보간된 트랙에서의 해당 인덱스 계산
    const smoothTrackIndex = Math.floor(originalProgress * smoothTrackCoordinates.length);
    
    
    return {
      ...sector,
      trackIndex: smoothTrackIndex,
      trackProgress: originalProgress
    };
  }).filter(sector => sector.trackIndex >= 0) // 트랙에서 찾지 못한 섹터는 제외
    .sort((a, b) => a.trackIndex - b.trackIndex); // 트랙 순서대로 정렬
};

// 섹터별 색상으로 트랙을 그리는 함수
export const drawSectorColoredTrack = async (
  map: mapboxgl.Map,
  trackId: string,
  circuitId: string
) => {

  // 1차: 기존 trackDataLoader에서 섹터 데이터 시도
  let sectorData = await getSectorData(circuitId);
  
  // 2차: 실패시 동적 로더에서 섹터 데이터를 가져와서 변환
  if (!sectorData || sectorData.length === 0) {
    
    // 동적 로더에서 GeoJSON 로드
    const { loadCircuitGeoJSON } = await import('../data/dynamicSectorLoader');
    const geoJsonData = await loadCircuitGeoJSON(circuitId);
    
    if (geoJsonData) {
      // GeoJSON에서 섹터 좌표 추출
      const geoSectorFeatures = geoJsonData.features.filter(feature => 
        feature.properties.sector !== undefined
      );
      
      if (geoSectorFeatures.length > 0) {
        // SectorData 형식으로 변환
        sectorData = geoSectorFeatures
          .filter(feature => feature.geometry.type === 'LineString' && typeof feature.properties.sector === 'number')
          .map(feature => {
            const sectorNumber = feature.properties.sector as number;
            
            // 섹터별 색상 설정
            let sectorColor = '#FF0000'; // 기본 빨간색
            switch (sectorNumber) {
              case 1:
                sectorColor = '#FF0000'; // 빨간색
                break;
              case 2:
                sectorColor = '#0000FF'; // 파란색
                break;
              case 3:
                sectorColor = '#FFFF00'; // 노란색
                break;
              default:
                sectorColor = '#00FF00'; // 녹색 (4섹터 이상)
                break;
            }
            
            return {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              id: (feature as any).id || `sector-${sectorNumber}`,
              name: feature.properties.name || feature.properties.Name || `Sector ${sectorNumber}`,
              description: feature.properties.description || '',
              color: sectorColor,
              coordinates: feature.geometry.coordinates as number[][],
              sector: sectorNumber
            };
          });
      }
    }
  }

  if (sectorData && sectorData.length > 0) {

    // 원래 트랙 데이터는 이미 drawTrack에서 저장됨

    // 기존 트랙 레이어 제거
    if (map.getLayer(`${trackId}-main`)) {
      map.removeLayer(`${trackId}-main`);
    }
    if (map.getLayer(`${trackId}-outline`)) {
      map.removeLayer(`${trackId}-outline`);
    }
    if (map.getSource(trackId)) {
      map.removeSource(trackId);
    }

    const currentSectorLayers: string[] = [];

    // 섹터별로 새로운 레이어 추가
    sectorData.forEach((sector) => {
      const sectorTrackId = `${trackId}-sector-${sector.sector}`;


      // 섹터별 소스 추가
      if (!map.getSource(sectorTrackId)) {
        map.addSource(sectorTrackId, {
          type: 'geojson',
          data: {
            type: 'Feature' as const,
            properties: {},
            geometry: {
              type: 'LineString' as const,
              coordinates: sector.coordinates
            }
          }
        });
      }

      // 섹터별 아웃라인 레이어
      const outlineLayerId = `${sectorTrackId}-outline`;
      if (!map.getLayer(outlineLayerId)) {
        map.addLayer({
          id: outlineLayerId,
          type: 'line',
          source: sectorTrackId,
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
        currentSectorLayers.push(outlineLayerId);
      }

      // 섹터별 메인 레이어
      const mainLayerId = `${sectorTrackId}-main`;
      if (!map.getLayer(mainLayerId)) {
        map.addLayer({
          id: mainLayerId,
          type: 'line',
          source: sectorTrackId,
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': sector.color,
            'line-width': 5
          }
        });
        currentSectorLayers.push(mainLayerId);
      }
    });

    // 섹터 레이어 정보 저장
    sectorLayers.push({
      trackId,
      sectorLayers: currentSectorLayers
    });

    // DRS 존 레이어들을 섹터 트랙 위로 이동 (비활성화 - 문제 발생 시)
    // setTimeout(() => {
    //   moveDRSLayersToTop(map, trackId);
    // }, 100);

    return true;
  } else {
    return false;
  }
};

// 저장된 레이어 정보
const sectorLayers: {trackId: string, sectorLayers: string[]}[] = [];
const drsLayers: {trackId: string, drsLayers: string[]}[] = [];
const originalTrackData: {trackId: string, coordinates: number[][], color: string}[] = [];

// DRS 존 레이어들을 가장 위로 이동시키는 함수
const moveDRSLayersToTop = (map: mapboxgl.Map, trackId: string) => {
  const savedDrsLayers = drsLayers.find(item => item.trackId === trackId);

  if (savedDrsLayers && savedDrsLayers.drsLayers.length > 0) {
    savedDrsLayers.drsLayers.forEach(layerId => {
      if (map.getLayer(layerId)) {
        // 레이어를 제거한 후 다시 추가하여 가장 위로 이동
        const layer = map.getLayer(layerId);
        const source = map.getSource(layerId.replace('-symbols', ''));

        if (layer && source) {
          // 레이어 정보 백업 (paint 속성이 없을 수 있으므로 체크)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const layerSpec: any = {
            id: layerId,
            type: layer.type,
            source: layerId.replace('-symbols', ''),
            layout: layer.layout
          };

          // paint 속성이 있는 경우에만 추가
          if (layer.paint && Object.keys(layer.paint).length > 0) {
            layerSpec.paint = layer.paint;
          }

          // 레이어 제거 후 재추가
          map.removeLayer(layerId);
          map.addLayer(layerSpec);

        }
      }
    });
  } else {
  }
};

// 원래 트랙 복원 함수
const restoreOriginalTrack = (map: mapboxgl.Map, trackId: string) => {
  const savedData = originalTrackData.find(item => item.trackId === trackId);
  if (savedData) {

    // 기존 레이어들 제거
    if (map.getLayer(`${trackId}-main`)) {
      map.removeLayer(`${trackId}-main`);
    }
    if (map.getLayer(`${trackId}-outline`)) {
      map.removeLayer(`${trackId}-outline`);
    }
    if (map.getSource(trackId)) {
      map.removeSource(trackId);
    }

    // 원래 소스 복원
    map.addSource(trackId, {
      type: 'geojson',
      data: {
        type: 'Feature' as const,
        properties: {},
        geometry: {
          type: 'LineString' as const,
          coordinates: savedData.coordinates
        }
      }
    });

    // 트랙 아웃라인 레이어 복원
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

    // 메인 트랙 레이어 복원
    map.addLayer({
      id: `${trackId}-main`,
      type: 'line',
      source: trackId,
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': savedData.color,
        'line-width': 5
      }
    });

    // DRS 존 레이어들을 트랙 위로 이동
    setTimeout(() => {
      moveDRSLayersToTop(map, trackId);
    }, 50);

    return true;
  }

  return false;
};

// 섹터 트랙 색상 토글 함수
export const toggleSectorTrackColors = (trackId: string, enabled: boolean, map: mapboxgl.Map) => {
  const savedLayers = sectorLayers.find(item => item.trackId === trackId);

  if (enabled) {
    // 원래 트랙 숨기기
    if (map.getLayer(`${trackId}-main`)) {
      map.setLayoutProperty(`${trackId}-main`, 'visibility', 'none');
    }
    if (map.getLayer(`${trackId}-outline`)) {
      map.setLayoutProperty(`${trackId}-outline`, 'visibility', 'none');
    }

    // 섹터 색상 트랙 표시
    if (savedLayers) {
      savedLayers.sectorLayers.forEach(layerId => {
        if (map.getLayer(layerId)) {
          map.setLayoutProperty(layerId, 'visibility', 'visible');
        }
      });
    }
  } else {
    // 섹터 색상 트랙 숨기기 및 원래 트랙 복원
    if (savedLayers) {
      savedLayers.sectorLayers.forEach(layerId => {
        if (map.getLayer(layerId)) {
          map.setLayoutProperty(layerId, 'visibility', 'none');
        }
      });
    }

    // 원래 트랙 복원
    restoreOriginalTrack(map, trackId);
  }
};

// 범용 트랙 그리기 함수
export const drawTrack = (
  map: mapboxgl.Map,
  { trackId, trackCoordinates, color = '#FF1801', delay = 0, onComplete, sectorMarkerCleanup }: TrackDrawOptions
) => {
  setTimeout(async () => {
    // Enhanced map readiness check
    const waitForMapReady = () => {
      return new Promise<void>((resolve, reject) => {
        let attempts = 0;
        const maxAttempts = 20; // 1 second total wait time
        
        const checkReady = () => {
          attempts++;
          if (map && map.loaded() && !map.isMoving()) {
            resolve();
          } else if (attempts >= maxAttempts) {
            reject(new Error(`Map not ready for track ${trackId} after ${maxAttempts} attempts`));
          } else {
            setTimeout(checkReady, 50);
          }
        };
        checkReady();
      });
    };

    try {
      await waitForMapReady();
    } catch (error) {
      console.warn(`Skipping track animation: ${error}`);
      return;
    }

    // 서킷 ID 추출 (trackId는 보통 'circuitId-track' 형식)
    const circuitId = trackId.replace('-track', '');

    // 줌 레벨 확인
    if (!trackManager.canShowTrack()) {
      return;
    }

    // 이미 트랙이 그려져 있으면 스킵
    if (map.getLayer(`${trackId}-main`)) {
      return;
    }

    // TrackManager에 등록 (이미 등록되어 있지 않은 경우만)
    if (!trackManager.hasTrack(circuitId)) {
      trackManager.registerTrack(circuitId, trackId);
    }

    // 좌표 보간
    const smoothCoordinates = interpolateCoordinates(trackCoordinates);

    // 원래 트랙 데이터 저장 (복원용)
    const existingData = originalTrackData.find(item => item.trackId === trackId);
    if (!existingData) {
      originalTrackData.push({
        trackId,
        coordinates: smoothCoordinates,
        color
      });
    }

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

    // 섹터 마커 데이터 로드 및 트랙 인덱스 매핑 (원본 좌표로 매칭 후 보간된 좌표로 변환)
    const rawSectorData = await getSectorMarkerData(circuitId);
    const sectorMarkerData = enrichSectorDataWithTrackIndex(rawSectorData, trackCoordinates, smoothCoordinates, circuitId);
    const passedSectors = new Set<string>(); // 이미 지나친 섹터 추적



    if (sectorMarkerData.length === 0) {
    }

    // 트랙 애니메이션
    const startTime = performance.now();
    const totalPoints = smoothCoordinates.length;

    const animateTrack = async () => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / ANIMATION_CONFIG.trackAnimationDuration, 1);

      // 더 부드러운 easing - ease-in-out-cubic
      const easeProgress = progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      // 마지막 부분에서 더 세밀한 인덱스 계산
      const currentIndex = Math.floor(easeProgress * totalPoints);
      const animatedCoordinates = smoothCoordinates.slice(0, currentIndex + 1);

      // 섹터 마커 순차 표시 로직 (트랙 인덱스 기반)
      if (sectorMarkerData.length > 0 && currentIndex >= 0) {
        sectorMarkerData.forEach(sector => {
          // 트랙 진행률이 섹터 지점을 지나면 마커 표시
          if (!passedSectors.has(sector.id) && currentIndex >= sector.trackIndex) {
            // 전역 이벤트 발생으로 마커 표시
            setTimeout(() => {
              window.dispatchEvent(new CustomEvent('showSectorMarker', {
                detail: { sectorId: sector.id }
              }));
            }, 100); // 약간의 지연으로 자연스럽게 표시

            passedSectors.add(sector.id);
          }
        });
      }

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
        const source = map.getSource(trackId) as mapboxgl.GeoJSONSource;
        if (source) {
          source.setData({
            type: 'Feature' as const,
            properties: {},
            geometry: {
              type: 'LineString' as const,
              coordinates: animatedCoordinates
            }
          });
        } else {
          return; // 애니메이션 중단
        }
      }

      if (progress < 1) {
        requestAnimationFrame(animateTrack);
      } else {
        // 모든 서킷에서 섹터별 색상 적용 시도
        setTimeout(async () => {
          const sectorApplied = await drawSectorColoredTrack(map, trackId, circuitId);
          if (sectorApplied) {

            // 2. 섹터 색상 적용 후 DRS 존 생성 (자동으로 위에 위치)
            await drawDRSZones(map, trackId, smoothCoordinates, circuitId);
            setTimeout(() => animateDRSSequentialSignal(map, trackId), 300);
          } else {
            // 섹터 색상 적용 실패시 기존 방식 (DRS 존 색칠 + 애니메이션)
            await drawDRSZones(map, trackId, smoothCoordinates, circuitId);
            setTimeout(() => animateDRSSequentialSignal(map, trackId), 500);
          }
        }, 200);

        // cleanup 함수 저장 (나중에 사용)
        if (sectorMarkerCleanup) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (map as any)._sectorMarkerCleanup = sectorMarkerCleanup;
        }

        if (onComplete) {
          onComplete();
        }
      }
    };

    animateTrack();
  }, delay);
};

// DRS 애니메이션 제어 변수들
const activeDRSAnimations: Map<string, {
  animationId: number;
  isActive: boolean;
  restartFunction?: () => void
}> = new Map();

// 모든 DRS 애니메이션 정리 함수
export const clearAllDRSAnimations = () => {
  activeDRSAnimations.forEach((animationInfo) => {
    animationInfo.isActive = false;
    if (animationInfo.animationId) {
      cancelAnimationFrame(animationInfo.animationId);
    }
  });
  activeDRSAnimations.clear();
};

// 모든 트랙 관련 전역 상태 정리 함수
export const clearAllTrackState = () => {
  // 레이어 정보 정리
  sectorLayers.length = 0;
  drsLayers.length = 0;
  originalTrackData.length = 0;
  
  // DRS 애니메이션 정리
  clearAllDRSAnimations();
};

// DRS 애니메이션 토글 함수
export const toggleDRSAnimations = (trackId: string, enabled: boolean) => {
  const animationInfo = activeDRSAnimations.get(trackId);

  if (animationInfo) {
    animationInfo.isActive = enabled;
    if (!enabled) {
      // 애니메이션 프레임 취소
      if (animationInfo.animationId) {
        cancelAnimationFrame(animationInfo.animationId);
        animationInfo.animationId = 0;
      }
    } else {
      // 애니메이션 다시 시작
      if (animationInfo.restartFunction) {
        animationInfo.restartFunction();
      }
    }
  } else {
  }
};

// DRS 존 레이어 토글 함수
export const toggleDRSZoneLayers = (trackId: string, enabled: boolean, map: mapboxgl.Map) => {
  const savedLayers = drsLayers.find(item => item.trackId === trackId);
  if (savedLayers) {
    savedLayers.drsLayers.forEach(layerId => {
      if (map.getLayer(layerId)) {
        map.setLayoutProperty(layerId, 'visibility', enabled ? 'visible' : 'none');
      }
    });
  } else {
    // DRS 존 레이어들 찾기 (fallback)
    let drsIndex = 0;
    const currentDrsLayers: string[] = [];
    while (true) {
      const drsId = `${trackId}-drs-${drsIndex}`;
      const layerId = `${drsId}-symbols`;

      if (!map.getLayer(layerId)) break; // 더 이상 DRS 존이 없으면 종료

      // 레이어 가시성 설정
      map.setLayoutProperty(layerId, 'visibility', enabled ? 'visible' : 'none');
      currentDrsLayers.push(layerId);

      drsIndex++;
    }

    // 새로 발견한 레이어들 저장
    if (currentDrsLayers.length > 0) {
      drsLayers.push({
        trackId,
        drsLayers: currentDrsLayers
      });
    }

  }

  // DRS 애니메이션도 함께 토글
  toggleDRSAnimations(trackId, enabled);
};

// DRS 존 시퀀셜 시그널 애니메이션 (Symbol 기반)
const animateDRSSequentialSignal = (map: mapboxgl.Map, trackId: string) => {
  const animationDuration = 2000; // 2초

  const startAnimation = () => {
    const startTime = performance.now();

    const animate = () => {
      const animationInfo = activeDRSAnimations.get(trackId);

      // 애니메이션이 비활성화되었으면 중단
      if (!animationInfo || !animationInfo.isActive) {
        return;
      }

      const elapsed = performance.now() - startTime;
      const totalProgress = (elapsed / animationDuration) % 1;

      // 모든 DRS 존에 애니메이션 적용
      let drsIndex = 0;
      let foundLayers = 0;
      while (true) {
        const drsId = `${trackId}-drs-${drsIndex}`;
        const layerId = `${drsId}-symbols`;

        if (!map.getLayer(layerId)) {
          if (drsIndex === 0) {
          }
          break; // 더 이상 DRS 존이 없으면 종료
        }

        foundLayers++;

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

      // 첫 번째 루프에서만 로그 출력
      if (foundLayers > 0 && elapsed < 100) {
      }

      const currentAnimationInfo = activeDRSAnimations.get(trackId);
      if (currentAnimationInfo && currentAnimationInfo.isActive) {
        currentAnimationInfo.animationId = requestAnimationFrame(animate);
      }
    };

    animate();
  };

  // 애니메이션 정보 등록
  const animationInfo = {
    animationId: 0,
    isActive: true,
    restartFunction: startAnimation
  };
  activeDRSAnimations.set(trackId, animationInfo);

  // 애니메이션 시작
  startAnimation();

  // 각 트랙별로 이벤트 리스너 등록 (이전 방식으로 복원)
  const drsEventHandler = (event: CustomEvent) => {
    const { enabled } = event.detail;
    toggleDRSZoneLayers(trackId, enabled, map);
  };

  const sectorTrackEventHandler = (event: CustomEvent) => {
    const { enabled } = event.detail;
    toggleSectorTrackColors(trackId, enabled, map);
  };

  window.addEventListener('toggleDRSZoneLayers', drsEventHandler as EventListener);
  window.addEventListener('toggleSectorTrackColors', sectorTrackEventHandler as EventListener);

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