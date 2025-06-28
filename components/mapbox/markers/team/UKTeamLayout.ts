// 영국 팀들을 위한 특별한 레이아웃 설정

// Team position interface (for future use)

// 영국 기반 팀들의 ID
export const UK_TEAMS = [
  'red-bull',      // Milton Keynes
  'mercedes',      // Brackley  
  'mclaren',       // Woking
  'aston-martin',  // Silverstone
  'alpine',        // Enstone (잘못된 좌표 - 프랑스에 있음, 실제로는 영국 Enstone)
  'williams'       // Grove
];

// 영국 모터스포츠 밸리 중심점 (대략적인 중심)
export const UK_MOTORSPORT_VALLEY_CENTER = {
  lat: 51.8,
  lng: -1.0
};

// 줌 레벨별 배치 반경 (km 단위)
export const UK_LAYOUT_RADIUS = {
  low: 150,    // 최대 분산 (150km) - 더 넓게 분산
  medium: 75,  // 중간 (75km)  
  high: 20     // 최소 (20km)
};

// 지구 반지름 (km)
const EARTH_RADIUS_KM = 6371;

// 팀별 고정 각도 위치 (정육각형 배치)
export const UK_TEAM_POSITIONS: Record<string, number> = {
  'mercedes': 0,        // 북쪽 (12시)
  'red-bull': 60,       // 북동쪽 (2시)
  'aston-martin': 120,  // 남동쪽 (4시)
  'mclaren': 180,       // 남쪽 (6시)
  'williams': 240,      // 남서쪽 (8시)
  'alpine': 300         // 북서쪽 (10시)
};

/**
 * 측지선 공식을 사용하여 중심점에서 특정 거리와 방위각에 있는 좌표 계산
 */
const calculateGeodesicPosition = (
  centerLat: number,
  centerLng: number,
  distanceKm: number,
  bearingDegrees: number
): { lat: number; lng: number } => {
  const centerLatRad = (centerLat * Math.PI) / 180;
  const bearingRad = (bearingDegrees * Math.PI) / 180;
  const distanceRad = distanceKm / EARTH_RADIUS_KM;
  
  // 새로운 위도 계산
  const newLatRad = Math.asin(
    Math.sin(centerLatRad) * Math.cos(distanceRad) +
    Math.cos(centerLatRad) * Math.sin(distanceRad) * Math.cos(bearingRad)
  );
  
  // 새로운 경도 계산
  const newLngRad = ((centerLng * Math.PI) / 180) + Math.atan2(
    Math.sin(bearingRad) * Math.sin(distanceRad) * Math.cos(centerLatRad),
    Math.cos(distanceRad) - Math.sin(centerLatRad) * Math.sin(newLatRad)
  );
  
  const newLat = (newLatRad * 180) / Math.PI;
  const newLng = (newLngRad * 180) / Math.PI;
  
  return { lat: newLat, lng: newLng };
};

// 전환 구간을 상수로 정의하여 관리 용이하게 함
const ZOOM_START_DISPERSION = 5;
const ZOOM_END_DISPERSION = 12; // 기존 8에서 12로 확대

// 팀별 분산 방향 (정육각형 배치로 각 팀이 중심에서 바깥으로 분산)
const UK_TEAM_DISPERSION_ANGLES: Record<string, number> = {
  'mercedes': 0,        // 북쪽으로 분산 (12시)
  'red-bull': 60,       // 북동쪽으로 분산 (2시)
  'aston-martin': 120,  // 남동쪽으로 분산 (4시)
  'mclaren': 180,       // 남쪽으로 분산 (6시)
  'williams': 240,      // 남서쪽으로 분산 (8시)
  'alpine': 300         // 북서쪽으로 분산 (10시)
};

/**
 * 영국 팀의 조정된 위치 계산 - 낮은 줌에서는 중심점 기반, 높은 줌에서는 실제 위치
 */
export const getUKTeamAdjustedPosition = (
  teamId: string, 
  originalLat: number,
  originalLng: number,
  zoom: number
): { lat: number; lng: number } => {
  // 영국 팀이 아니면 원래 위치 반환
  if (!UK_TEAMS.includes(teamId)) {
    return { lat: originalLat, lng: originalLng };
  }
  
  // Alpine의 경우 실제 영국 Enstone 좌표로 수정
  // TODO: 이상적으로는 데이터 소스에서 수정해야 하지만,
  // 현재는 임시로 여기서 처리
  if (teamId === 'alpine') {
    originalLat = 51.9273;
    originalLng = -1.2797;
  }
  
  // 줌 레벨에 따른 진행도 계산
  let progress: number;
  if (zoom <= ZOOM_START_DISPERSION) {
    progress = 0;  // 완전히 분산된 상태
  } else if (zoom >= ZOOM_END_DISPERSION) {
    progress = 1;  // 완전히 실제 위치
  } else {
    // 줌 5~12 사이: 부드럽게 전환
    progress = (zoom - ZOOM_START_DISPERSION) / (ZOOM_END_DISPERSION - ZOOM_START_DISPERSION);
    // Quintic easing 적용
    progress = 1 - Math.pow(1 - progress, 5);
  }
  
  // 정육각형 배치 위치 계산 (UK Motorsport Valley 중심)
  const hexagonAngle = UK_TEAM_DISPERSION_ANGLES[teamId] || 0;
  const hexagonPosition = calculateGeodesicPosition(
    UK_MOTORSPORT_VALLEY_CENTER.lat,
    UK_MOTORSPORT_VALLEY_CENTER.lng,
    UK_LAYOUT_RADIUS.low,  // 150km 반경
    hexagonAngle
  );
  
  // 선형 보간으로 최종 위치 계산
  const lat = hexagonPosition.lat + (originalLat - hexagonPosition.lat) * progress;
  const lng = hexagonPosition.lng + (originalLng - hexagonPosition.lng) * progress;
  
  return { lat, lng };
};

/**
 * 영국 팀인지 확인
 */
export const isUKTeam = (teamId: string): boolean => {
  return UK_TEAMS.includes(teamId);
};

// shouldUseUKLayout 함수는 항상 true를 반환하므로 제거 고려
// 향후 확장 가능성을 위해 남겨둘 수 있지만, 
// 현재는 호출하는 쪽에서 직접 true로 처리하는 것을 권장