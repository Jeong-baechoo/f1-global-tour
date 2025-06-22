import { CIRCUIT_ID_MAPPING } from './circuitMapping';

// GeoJSON 데이터 타입
interface GeoJSONFeature {
  type: string;
  properties: {
    id: string;
    Location: string;
    Name: string;
    opened: number;
    firstgp: number;
    length: number;
    altitude: number;
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

// 특정 서킷의 트랙 데이터 가져오기
export const getTrackCoordinates = async (circuitId: string): Promise<number[][] | null> => {
  try {
    const geoJSONData = await loadGeoJSONData();
    
    // circuits.json ID를 geojson ID로 변환
    const geoJSONId = CIRCUIT_ID_MAPPING[circuitId];
    if (!geoJSONId) {
      console.warn(`No mapping found for circuit ID: ${circuitId}`);
      
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
      console.warn(`No track data found for circuit: ${geoJSONId}`);
      return null;
    }
    
    return feature.geometry.coordinates;
  } catch (error) {
    console.error(`Failed to load track data for circuit: ${circuitId}`, error);
    return null;
  }
};