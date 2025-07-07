// import mapboxgl from 'mapbox-gl';
// import { CIRCUIT_ID_MAPPING } from './circuitMapping';

// 섹터 정보 인터페이스
export interface SectorInfo {
  id: string;
  name: string;
  position: [number, number]; // [lng, lat]
  number: number; // 1, 2, 3 for sectors, 0 for start/finish
  isStartFinish?: boolean;
}

export interface DRSDetectionInfo {
  id: string;
  name: string;
  position: [number, number]; // [lng, lat]
  number: number; // DRS detection zone number
  type: 'drs_detection';
}

export interface SpeedTrapInfo {
  id: string;
  name: string;
  position: [number, number]; // [lng, lat]
  number: number; // Speed trap number
  type: 'speed_trap';
}

// GeoJSON Feature 타입
interface GeoJSONFeature {
  type: 'Feature';
  properties: {
    id?: string;
    name?: string;
    Name?: string;
    sector?: number;
    drs_detection?: number;
    speed_trap?: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  };
  geometry: {
    type: 'Point' | 'LineString' | 'Polygon';
    coordinates: number[] | number[][] | number[][][];
  };
}

interface GeoJSONData {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
}

// 서킷별 GeoJSON 데이터 캐시
const circuitGeoJSONCache = new Map<string, GeoJSONData>();

/**
 * 서킷별 GeoJSON 파일 로드
 */
export const loadCircuitGeoJSON = async (circuitId: string): Promise<GeoJSONData | null> => {
  // 캐시 확인
  if (circuitGeoJSONCache.has(circuitId)) {
    return circuitGeoJSONCache.get(circuitId) || null;
  }

  try {
    // 개별 서킷 GeoJSON 파일 경로
    const geoJsonPath = `/data/circuits-geojson/${circuitId}.geojson`;
    
    const response = await fetch(geoJsonPath);
    if (!response.ok) {
      return null;
    }

    const data: GeoJSONData = await response.json();
    
    // 캐시에 저장
    circuitGeoJSONCache.set(circuitId, data);
    
    return data;
  } catch (error) {
    console.error(`Failed to load GeoJSON for ${circuitId}:`, error);
    return null;
  }
};

/**
 * GeoJSON에서 섹터 정보 추출
 */
export const extractSectorData = (geoJsonData: GeoJSONData, circuitId: string): SectorInfo[] => {
  const sectors: SectorInfo[] = [];
  
  // 섹터 정보가 있는 Features 찾기
  const sectorFeatures = geoJsonData.features.filter(feature => 
    feature.properties.sector !== undefined
  );
  
  sectorFeatures.forEach((feature) => {
    const { sector, name, Name, id } = feature.properties;
    const sectorNumber = sector;
    
    // sectorNumber가 유효하지 않으면 스킵
    if (typeof sectorNumber !== 'number' || sectorNumber <= 0) {
      return;
    }
    
    let coordinates: [number, number] | null = null;
    
    // 좌표 추출 (Point 또는 LineString geometry에서)
    if (feature.geometry.type === 'Point') {
      coordinates = feature.geometry.coordinates as [number, number];
    } else if (feature.geometry.type === 'LineString') {
      // LineString의 경우 첫 번째 좌표를 섹터 시작점으로 사용
      const lineCoordinates = feature.geometry.coordinates as number[][];
      if (lineCoordinates.length > 0) {
        coordinates = lineCoordinates[0] as [number, number];
      }
    }
    
    if (coordinates) {
      sectors.push({
        id: id || `${circuitId}-sector-${sectorNumber}`,
        name: name || Name || `Sector ${sectorNumber}`,
        position: coordinates,
        number: sectorNumber,
        isStartFinish: sectorNumber === 1 // Sector 1은 Start/Finish로 간주
      });
    }
  });
  
  // 섹터 번호로 정렬
  sectors.sort((a, b) => a.number - b.number);
  
  return sectors;
};

/**
 * GeoJSON에서 DRS Detection 정보 추출
 */
export const extractDRSDetectionData = (geoJsonData: GeoJSONData, circuitId: string): DRSDetectionInfo[] => {
  const drsZones: DRSDetectionInfo[] = [];
  
  // DRS Detection 정보가 있는 Features 찾기
  const drsFeatures = geoJsonData.features.filter(feature => 
    feature.properties.drs_detection !== undefined
  );
  
  drsFeatures.forEach((feature) => {
    const { drs_detection, name, Name, id } = feature.properties;
    const zoneNumber = drs_detection;
    
    // zoneNumber가 유효하지 않으면 스킵
    if (typeof zoneNumber !== 'number' || zoneNumber <= 0) {
      return;
    }
    
    let coordinates: [number, number] | null = null;
    
    // 좌표 추출 (Point 또는 LineString geometry에서)
    if (feature.geometry.type === 'Point') {
      coordinates = feature.geometry.coordinates as [number, number];
    } else if (feature.geometry.type === 'LineString') {
      // LineString의 경우 첫 번째 좌표를 DRS 시작점으로 사용
      const lineCoordinates = feature.geometry.coordinates as number[][];
      if (lineCoordinates.length > 0) {
        coordinates = lineCoordinates[0] as [number, number];
      }
    }
    
    if (coordinates) {
      drsZones.push({
        id: id || `${circuitId}-drs-detection-${zoneNumber}`,
        name: name || Name || `DRS Detection Zone ${zoneNumber}`,
        position: coordinates,
        number: zoneNumber,
        type: 'drs_detection'
      });
    }
  });
  
  // DRS 존 번호로 정렬
  drsZones.sort((a, b) => a.number - b.number);
  
  return drsZones;
};

/**
 * GeoJSON에서 Speed Trap 정보 추출
 */
export const extractSpeedTrapData = (geoJsonData: GeoJSONData, circuitId: string): SpeedTrapInfo[] => {
  const speedTraps: SpeedTrapInfo[] = [];
  
  // Speed Trap 정보가 있는 Features 찾기
  const speedTrapFeatures = geoJsonData.features.filter(feature => 
    feature.properties.speed_trap !== undefined
  );
  
  speedTrapFeatures.forEach((feature) => {
    const { speed_trap, name, Name, id } = feature.properties;
    const trapNumber = speed_trap;
    
    // trapNumber가 유효하지 않으면 스킵
    if (typeof trapNumber !== 'number' || trapNumber <= 0) {
      return;
    }
    
    let coordinates: [number, number] | null = null;
    
    // 좌표 추출 (Point 또는 LineString geometry에서)
    if (feature.geometry.type === 'Point') {
      coordinates = feature.geometry.coordinates as [number, number];
    } else if (feature.geometry.type === 'LineString') {
      // LineString의 경우 첫 번째 좌표를 Speed Trap 위치로 사용
      const lineCoordinates = feature.geometry.coordinates as number[][];
      if (lineCoordinates.length > 0) {
        coordinates = lineCoordinates[0] as [number, number];
      }
    }
    
    if (coordinates) {
      speedTraps.push({
        id: id || `${circuitId}-speed-trap-${trapNumber}`,
        name: name || Name || `Speed Trap ${trapNumber}`,
        position: coordinates,
        number: trapNumber,
        type: 'speed_trap'
      });
    }
  });
  
  // Speed Trap 번호로 정렬
  speedTraps.sort((a, b) => a.number - b.number);
  
  return speedTraps;
};

/**
 * 동적으로 서킷의 섹터 데이터를 가져오는 함수
 */
export const getDynamicSectorData = async (circuitId: string): Promise<SectorInfo[]> => {
  const geoJsonData = await loadCircuitGeoJSON(circuitId);
  if (!geoJsonData) {
    return [];
  }
  
  return extractSectorData(geoJsonData, circuitId);
};

/**
 * 동적으로 서킷의 DRS Detection 데이터를 가져오는 함수
 */
export const getDynamicDRSDetectionData = async (circuitId: string): Promise<DRSDetectionInfo[]> => {
  const geoJsonData = await loadCircuitGeoJSON(circuitId);
  if (!geoJsonData) {
    return [];
  }
  
  return extractDRSDetectionData(geoJsonData, circuitId);
};

/**
 * 동적으로 서킷의 Speed Trap 데이터를 가져오는 함수
 */
export const getDynamicSpeedTrapData = async (circuitId: string): Promise<SpeedTrapInfo[]> => {
  const geoJsonData = await loadCircuitGeoJSON(circuitId);
  if (!geoJsonData) {
    return [];
  }
  
  return extractSpeedTrapData(geoJsonData, circuitId);
};

