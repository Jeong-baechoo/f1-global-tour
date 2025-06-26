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

// 줌 레벨별 배치 반경
export const ITALY_LAYOUT_RADIUS = {
  low: 1.5,      // 최대 분산
  medium: 1.0,   // 중간  
  high: 0.3      // 최소
};

// 팀별 고정 각도 위치
export const ITALY_TEAM_POSITIONS: Record<string, number> = {
  'ferrari': 225,        // 남서쪽 (로마 방향)
  'racing-bulls': 110    // 동남쪽 (살짝 남쪽)
};

/**
 * 이탈리아 팀의 조정된 위치 계산
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
  
  // 줌 레벨에 따른 애니메이션 반경 계산 (지수적 감소) - 영국과 동일
  let radius: number;
  if (zoom <= 5) {
    radius = ITALY_LAYOUT_RADIUS.low;  // 1.5 - 최대 분산
  } else if (zoom >= 8) {
    radius = 0;  // 실제 위치
  } else {
    // 줌 5-8 사이: 지수적 감소 (exponential decay)
    const progress = (zoom - 5) / 3;  // 0 to 1
    // 지수 함수 사용: 처음에는 천천히, 나중에는 빠르게 감소
    const exponentialProgress = 1 - Math.pow(1 - progress, 3);  // cubic easing
    radius = ITALY_LAYOUT_RADIUS.low * (1 - exponentialProgress);
  }
  
  // 팀의 각도 가져오기
  const angle = ITALY_TEAM_POSITIONS[teamId] || 0;
  const angleRad = (angle * Math.PI) / 180;
  
  // 원형 배치 계산 (위도/경도 좌표계에 맞게 수정)
  const lat = originalLat + radius * Math.cos(angleRad);
  const lng = originalLng + radius * Math.sin(angleRad);
  
  return { lat, lng };
};

/**
 * 이탈리아 팀인지 확인
 */
export const isItalyTeam = (teamId: string): boolean => {
  return ITALY_TEAMS.includes(teamId);
};