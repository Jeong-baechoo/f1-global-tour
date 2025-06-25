// 서킷별 라벨 위치 오프셋 설정
// 각 서킷의 지리적 위치와 주변 서킷들과의 관계를 고려하여 수동으로 조정

export const CIRCUIT_LABEL_OFFSETS: Record<string, { x: number; y: number }> = {
  // 유럽 서킷들 (더 넓은 간격으로 배치)
  'monaco': { x: -100, y: -40 },        // 왼쪽 위
  'spain': { x: 100, y: 0 },            // 오른쪽
  'imola': { x: -100, y: 40 },          // 왼쪽 아래
  'austria': { x: 100, y: -40 },        // 오른쪽 위
  'silverstone': { x: -120, y: 0 },     // 왼쪽
  'hungary': { x: 120, y: 40 },         // 오른쪽 아래
  'spa': { x: -100, y: -60 },           // 왼쪽 위
  'netherlands': { x: 100, y: -60 },    // 오른쪽 위
  'monza': { x: 80, y: 60 },            // 오른쪽 아래
  
  // 중동 서킷들
  'bahrain': { x: 100, y: 20 },         // 오른쪽
  'saudi-arabia': { x: -100, y: -20 },  // 왼쪽
  'qatar': { x: 100, y: -40 },          // 오른쪽 위
  'abu-dhabi': { x: -100, y: 40 },      // 왼쪽 아래
  
  // 아시아 서킷들
  'japan': { x: 100, y: 0 },            // 오른쪽
  'china': { x: -100, y: 0 },           // 왼쪽
  'singapore': { x: 100, y: -40 },      // 오른쪽 위
  'azerbaijan': { x: -100, y: -40 },    // 왼쪽 위
  
  // 아메리카 서킷들
  'canada': { x: 100, y: 20 },          // 오른쪽
  'miami': { x: -100, y: -20 },         // 왼쪽
  'usa': { x: 100, y: -60 },            // 오른쪽 위
  'mexico': { x: -100, y: 60 },         // 왼쪽 아래
  'brazil': { x: 120, y: 0 },           // 오른쪽
  'vegas': { x: -120, y: 0 },           // 왼쪽
  
  // 오세아니아
  'australia': { x: 100, y: 0 },        // 오른쪽
  
  // 특별 서킷
  'nurburgring': { x: -100, y: -80 },   // 왼쪽 위
  
  // 기본값 (정의되지 않은 서킷용)
  'default': { x: 100, y: 0 }
};

// 서킷 ID로 라벨 오프셋 가져오기
export const getCircuitLabelOffset = (circuitId: string): { x: number; y: number } => {
  return CIRCUIT_LABEL_OFFSETS[circuitId] || CIRCUIT_LABEL_OFFSETS['default'];
};