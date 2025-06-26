// 영국 팀들을 위한 특별한 레이아웃 설정

interface TeamPosition {
  teamId: string;
  offset: { x: number; y: number };
  scale?: number;
}

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

// 줌 레벨별 배치 반경 (더 넓게)
export const UK_LAYOUT_RADIUS = {
  low: 2.5,    // 최대 분산 (더 넓게)
  medium: 1.8, // 중간  
  high: 0.6    // 최소
};

// 팀별 고정 각도 위치 (북쪽부터 시계방향)
export const UK_TEAM_POSITIONS: Record<string, number> = {
  'mercedes': 0,        // 북쪽
  'red-bull': 60,       // 북동쪽
  'aston-martin': 120,  // 남동쪽
  'mclaren': 180,       // 남쪽
  'williams': 240,      // 남서쪽
  'alpine': 300         // 북서쪽
};

/**
 * 영국 팀의 조정된 위치 계산
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
  if (teamId === 'alpine') {
    originalLat = 51.9273;
    originalLng = -1.2797;
  }
  
  // 줌 레벨에 따른 애니메이션 반경 계산 (지수적 감소)
  let radius: number;
  if (zoom <= 5) {
    radius = UK_LAYOUT_RADIUS.low;  // 2.5 - 최대 분산
  } else if (zoom >= 8) {
    radius = 0;  // 실제 위치
  } else {
    // 줌 5-8 사이: 지수적 감소 (exponential decay)
    const progress = (zoom - 5) / 3;  // 0 to 1
    // 지수 함수 사용: 처음에는 천천히, 나중에는 빠르게 감소
    const exponentialProgress = 1 - Math.pow(1 - progress, 3);  // cubic easing
    radius = UK_LAYOUT_RADIUS.low * (1 - exponentialProgress);
  }
  
  // 팀의 각도 가져오기
  const angle = UK_TEAM_POSITIONS[teamId] || 0;
  const angleRad = (angle * Math.PI) / 180;
  
  // 원형 배치 계산 (위도/경도 좌표곀4에 맞게 수정)
  const lat = originalLat + radius * Math.cos(angleRad);
  const lng = originalLng + radius * Math.sin(angleRad);
  
  return { lat, lng };
};

/**
 * 영국 팀인지 확인
 */
export const isUKTeam = (teamId: string): boolean => {
  return UK_TEAMS.includes(teamId);
};

/**
 * 줌 레벨에서 영국 특별 레이아웃을 사용해야 하는지 확인
 * 영국 팀은 항상 특별 레이아웃 사용
 */
export const shouldUseUKLayout = (zoom: number): boolean => {
  return true; // 항상 true
};