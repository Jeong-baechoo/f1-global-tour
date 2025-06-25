// 서킷별 색상 정의
export const getCircuitColor = (circuitId: string): string => {
  const colors: { [key: string]: string } = {
    // 유럽
    'austria': '#FF1801',      // 오스트리아 - Red Bull 색상
    'nurburgring': '#000000',  // 독일 - 검정
    'monaco': '#dc2626',       // 모나코 - 빨강
    'britain': '#1e40af',      // 영국 - 파랑
    'italy': '#16a34a',        // 이탈리아 - 초록
    'belgium': '#f59e0b',      // 벨기에 - 노랑
    'spain': '#dc2626',        // 스페인 - 빨강
    'hungary': '#16a34a',      // 헝가리 - 초록
    'netherlands': '#ea580c',  // 네덜란드 - 오렌지
    'emilia-romagna': '#0ea5e9', // 이탈리아 이몰라 - 하늘색

    // 아시아/중동
    'bahrain': '#dc2626',      // 바레인 - 빨강
    'saudi-arabia': '#16a34a', // 사우디 - 초록
    'azerbaijan': '#0ea5e9',   // 아제르바이잔 - 하늘색
    'singapore': '#dc2626',    // 싱가포르 - 빨강
    'japan': '#dc2626',        // 일본 - 빨강
    'qatar': '#8b5cf6',        // 카타르 - 보라
    'abu-dhabi': '#0ea5e9',    // 아부다비 - 하늘색
    'china': '#f59e0b',        // 중국 - 노랑

    // 아메리카
    'usa': '#1e40af',          // 미국 오스틴 - 파랑
    'usa-miami': '#ec4899',    // 미국 마이애미 - 핑크
    'usa-vegas': '#f59e0b',    // 미국 라스베가스 - 노랑/금색
    'mexico': '#16a34a',       // 멕시코 - 초록
    'brazil': '#f59e0b',       // 브라질 - 노랑
    'canada': '#dc2626',       // 캐나다 - 빨강

    // 오세아니아
    'australia': '#1e40af',    // 호주 - 파랑
  };

  return colors[circuitId] || '#FF1801'; // 기본값은 F1 레드
};