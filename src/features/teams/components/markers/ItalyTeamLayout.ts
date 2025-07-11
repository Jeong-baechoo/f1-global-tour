// 이탈리아 팀들을 위한 특별한 레이아웃 설정

// 이탈리아 기반 팀들의 ID
export const ITALY_TEAMS = [
  'ferrari',       // Maranello
  'racing-bulls'   // Faenza
];

// 이탈리아 팀들의 중심점 (대략적인 중심)
export const ITALY_CENTER = {
  lat: 44.4178,    // 페라리와 레이싱 불스 사이 중간
  lng: 11.3633
};

// 줌 레벨별 배치 반경 (km 단위)
export const ITALY_LAYOUT_RADIUS = {
  low: 50,       // 최대 분산 (50km)
  medium: 25,    // 중간 (25km)  
  high: 5        // 최소 (5km)
};

// 지구 반지름 (km)
const EARTH_RADIUS_KM = 6371;

// 팀별 고정 각도 위치
export const ITALY_TEAM_POSITIONS: Record<string, number> = {
  'ferrari': 225,        // 남서쪽 (로마 방향)
  'racing-bulls': 110    // 동남쪽 (살짝 남쪽)
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

// 팀별 분산 방향 (각 팀이 자신의 위치에서 어느 방향으로 분산될지)
const ITALY_TEAM_DISPERSION_ANGLES: Record<string, number> = {
  'ferrari': 225,        // 남서쪽으로 분산 (로마 방향)
  'racing-bulls': 45     // 북동쪽으로 분산 (베니스 방향)
};

/**
 * 이탈리아 팀의 조정된 위치 계산 - 각 팀의 실제 위치를 기준으로 분산
 */
export const getItalyTeamAdjustedPosition = (
  teamId: string, 
  originalLat: number,
  originalLng: number,
  zoom: number
): { lat: number; lng: number } => {
  // 이탈리아 팀이 아니면 원래 위치 반환
  if (!ITALY_TEAMS.includes(teamId)) {
    return { lat: originalLat, lng: originalLng };
  }
  
  // 줌 레벨에 따른 애니메이션 반경 계산 (km 단위)
  let radiusKm: number;
  if (zoom <= ZOOM_START_DISPERSION) {
    radiusKm = ITALY_LAYOUT_RADIUS.low;  // 50km - 최대 분산
  } else if (zoom >= ZOOM_END_DISPERSION) {
    radiusKm = 0;  // 실제 위치
  } else {
    // 줌 5~12 사이: 더 넓어진 구간에서 부드럽게 보간
    const progress = (zoom - ZOOM_START_DISPERSION) / (ZOOM_END_DISPERSION - ZOOM_START_DISPERSION);  // 0 to 1
    // 더 부드러운 감속을 위해 지수값을 높임 (Cubic -> Quintic Easing)
    const quinticProgress = 1 - Math.pow(1 - progress, 5);
    radiusKm = ITALY_LAYOUT_RADIUS.low * (1 - quinticProgress);
  }
  
  // 반경이 0이면 원래 위치 반환
  if (radiusKm === 0) {
    return { lat: originalLat, lng: originalLng };
  }
  
  // 팀의 분산 각도 가져오기
  const bearing = ITALY_TEAM_DISPERSION_ANGLES[teamId] || 0;
  
  // 각 팀의 실제 위치에서 지정된 방향으로 분산
  const adjustedPosition = calculateGeodesicPosition(
    originalLat,  // 팀의 실제 위도
    originalLng,  // 팀의 실제 경도
    radiusKm,
    bearing
  );
  
  return adjustedPosition;
};

/**
 * 이탈리아 팀인지 확인
 */
export const isItalyTeam = (teamId: string): boolean => {
  return ITALY_TEAMS.includes(teamId);
};