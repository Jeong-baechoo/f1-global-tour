import { CIRCUIT_ID_MAPPING } from './circuitMapping';

// GeoJSON 데이터 타입
interface GeoJSONFeature {
  type: string;
  id?: string;
  properties: {
    id?: string;
    Location?: string;
    Name?: string;
    opened?: number;
    firstgp?: number;
    length?: number;
    altitude?: number;
    drs?: number;
    sector?: number;
    name?: string;
    description?: string;
    color?: string;
    drs_detection?: number;
    speed_trap?: number;
  };
  geometry: {
    type: string;
    coordinates: number[][];
  };
}

interface GeoJSONData {
  type: string;
  features: GeoJSONFeature[];
}

// GeoJSON 데이터 캐시
let geoJSONCache: GeoJSONData | null = null;

// GeoJSON 파일 로드
export const loadGeoJSONData = async (): Promise<GeoJSONData> => {
  if (geoJSONCache) {
    return geoJSONCache;
  }

  try {
    const response = await fetch('/data/circuits-geojson/f1-circuits.geojson');
    const data = await response.json();
    geoJSONCache = data;
    return data;
  } catch (error) {
    console.error('Failed to load GeoJSON data:', error);
    throw error;
  }
};

// DRS 존 데이터 타입
interface DRSZone {
  id: string;
  name: string;
  description: string;
  color: string;
  coordinates: number[][];
}

// 서킷 ID 매핑 테이블
const CIRCUIT_GEOJSON_MAPPING: { [key: string]: string } = {
  'abu-dhabi': 'ae-2009',
  'australia': 'au-1953',
  'austria': 'at-1969',
  'azerbaijan': 'az-2016',
  'bahrain': 'bh-2002',
  'belgium': 'be-1925',
  'brazil': 'br-1940',
  'britain': 'gb-1948',
  'canada': 'ca-1978',
  'china': 'cn-2004',
  'hungary': 'hu-1986',
  'imola': 'it-1953',
  'italy': 'it-1922',
  'japan': 'jp-1962',
  'las-vegas': 'us-2023',
  'mexico': 'mx-1962',
  'miami': 'us-2022',
  'monaco': 'mc-1929',
  'netherlands': 'nl-1948',
  'qatar': 'qa-2004',
  'saudi-arabia': 'sa-2021',
  'singapore': 'sg-2008',
  'spain': 'es-1991',
  'usa': 'us-2012'
};

// 특정 서킷의 트랙 데이터 가져오기
export const getTrackCoordinates = async (circuitId: string): Promise<number[][] | null> => {
  try {
    // 뉘르부르크링은 기존 방식 사용
    if (circuitId === 'nurburgring') {
      try {
        const trackData = await import(`@/data/${circuitId}-track.json`);
        return trackData.default || trackData;
      } catch {
        return null;
      }
    }

    // 새로운 GeoJSON 파일에서 로드
    if (CIRCUIT_GEOJSON_MAPPING[circuitId]) {
      try {
        const response = await fetch(`/data/circuits-geojson/${circuitId}.geojson`);
        const data = await response.json();
        
        const expectedId = CIRCUIT_GEOJSON_MAPPING[circuitId];
        
        // 메인 트랙 데이터 찾기 (DRS, sector가 아닌 메인 트랙)
        const trackFeature = data.features.find((feature: GeoJSONFeature) => 
          feature.properties.id === expectedId || 
          (!feature.properties.drs && !feature.properties.sector && !feature.properties.drs_detection && !feature.properties.speed_trap)
        );
        
        if (trackFeature && trackFeature.geometry.coordinates) {
          return trackFeature.geometry.coordinates;
        }
      } catch {
        // Failed to load track data
      }
    }
    
    const geoJSONData = await loadGeoJSONData();
    
    // circuits.json ID를 geojson ID로 변환
    const geoJSONId = CIRCUIT_ID_MAPPING[circuitId];
    if (!geoJSONId) {
      // 개별 트랙 파일 시도 (기존 방식 폴백)
      try {
        const trackData = await import(`@/data/${circuitId}-track.json`);
        return trackData.default || trackData;
      } catch {
        return null;
      }
    }
    
    // GeoJSON에서 해당 서킷 찾기
    const feature = geoJSONData.features.find(f => f.properties.id === geoJSONId);
    if (!feature) {
      return null;
    }
    
    return feature.geometry.coordinates;
  } catch (error) {
    console.error(`Failed to load track data for circuit: ${circuitId}`, error);
    return null;
  }
};


// 섹터 데이터 타입
interface SectorData {
  id: string;
  name: string;
  description: string;
  color: string;
  coordinates: number[][];
  sector: number;
}

// 특정 서킷의 섹터 데이터 가져오기 (트랙 색칠용)
export const getSectorData = async (circuitId: string): Promise<SectorData[] | null> => {
  try {
    // 개별 GeoJSON 파일에서 섹터 데이터를 로드할 수 있는 서킷들
    const supportedCircuits = ['austria', 'britain', 'australia', 'belgium'];
    
    if (supportedCircuits.includes(circuitId)) {
      try {
        const response = await fetch(`/data/circuits-geojson/${circuitId}.geojson`);
        const data = await response.json();
        
        // 섹터 데이터 찾기
        const sectorFeatures = data.features.filter((feature: GeoJSONFeature) => 
          feature.properties.sector && feature.properties.sector > 0
        );
        
        return sectorFeatures.map((feature: GeoJSONFeature) => {
          // 섹터별 색상 강제 설정
          let sectorColor: string; // 기본 빨간색
          switch (feature.properties.sector) {
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
            id: feature.id || `sector-${feature.properties.sector}`,
            name: feature.properties.name || `Sector ${feature.properties.sector}`,
            description: feature.properties.description || '',
            color: sectorColor,
            coordinates: feature.geometry.coordinates,
            sector: feature.properties.sector || 1
          };
        });
      } catch {
        // Failed to load sector data
      }
    }
    
    // 매핑되지 않은 서킷은 null 반환
    return null;
  } catch (error) {
    console.error(`Failed to load sector data for circuit: ${circuitId}`, error);
    return null;
  }
};

// 특정 서킷의 DRS 존 데이터 가져오기
export const getDRSZones = async (circuitId: string): Promise<DRSZone[] | null> => {
  try {
    // 뉘르부르크링은 DRS 존 데이터가 없음
    if (circuitId === 'nurburgring') {
      return null;
    }

    // 새로운 GeoJSON 파일에서 로드
    if (CIRCUIT_GEOJSON_MAPPING[circuitId]) {
      try {
        const response = await fetch(`/data/circuits-geojson/${circuitId}.geojson`);
        const data = await response.json();
        
        // DRS 존 데이터 찾기
        const drsFeatures = data.features.filter((feature: GeoJSONFeature) => 
          feature.properties.drs && feature.properties.drs > 0
        );
        
        return drsFeatures.map((feature: GeoJSONFeature) => ({
          id: feature.id || `drs-zone-${feature.properties.drs}`,
          name: feature.properties.name || `DRS Zone ${feature.properties.drs}`,
          description: feature.properties.description || '',
          color: feature.properties.color || '#FFD700',
          coordinates: feature.geometry.coordinates
        }));
      } catch {
        // Failed to load DRS zones
      }
    }
    
    // 매핑되지 않은 서킷은 null 반환 (기존 퍼센티지 방식 사용)
    return null;
  } catch (error) {
    console.error(`Failed to load DRS zones for circuit: ${circuitId}`, error);
    return null;
  }
};

