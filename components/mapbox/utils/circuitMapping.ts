// circuits.json ID와 f1-circuits.geojson ID 매핑 (2025 시즌)
export const CIRCUIT_ID_MAPPING: { [key: string]: string } = {
  // circuits.json ID -> geojson ID
  'australia': 'au-1953',      // 1. 호주 GP - 알버트 파크
  'china': 'cn-2004',          // 2. 중국 GP - 상하이
  'japan': 'jp-1962',          // 3. 일본 GP - 스즈카
  'bahrain': 'bh-2002',        // 4. 바레인 GP
  'saudi-arabia': 'sa-2021',   // 5. 사우디 GP - 제다
  'miami': 'us-2022',          // 6. 마이애미 GP
  'imola': 'it-1953', // 7. 이몰라 GP
  'monaco': 'mc-1929',         // 8. 모나코 GP
  'spain': 'es-1991',          // 9. 스페인 GP - 바르셀로나
  'canada': 'ca-1978',         // 10. 캐나다 GP - 몬트리올
  'austria': 'at-1969',        // 11. 오스트리아 GP - 레드불 링
  'britain': 'gb-1948',        // 12. 영국 GP - 실버스톤
  'belgium': 'be-1925',        // 13. 벨기에 GP - 스파
  'hungary': 'hu-1986',        // 14. 헝가리 GP - 헝가로링
  'netherlands': 'nl-1948',    // 15. 네덜란드 GP - 잔드포르트
  'italy': 'it-1922',          // 16. 이탈리아 GP - 몬자
  'azerbaijan': 'az-2016',     // 17. 아제르바이잔 GP - 바쿠
  'singapore': 'sg-2008',      // 18. 싱가포르 GP
  'usa': 'us-2012',            // 19. 미국 GP - 오스틴
  'mexico': 'mx-1962',         // 20. 멕시코 GP
  'brazil': 'br-1940',         // 21. 브라질 GP - 인터라고스
  'las-vegas': 'us-2023',      // 22. 라스베가스 GP
  'qatar': 'qa-2004',          // 23. 카타르 GP - 로사일
  'abu-dhabi': 'ae-2009',      // 24. 아부다비 GP
  
  // 추가 서킷 (데모용)
  'nurburgring': 'de-1927'     // 뉘르부르크링
};

// 2025 시즌 서킷 ID 목록
export const F1_2025_CIRCUITS = [
  'australia', 'china', 'japan', 'bahrain', 'saudi-arabia',
  'miami', 'imola', 'monaco', 'spain', 'canada',
  'austria', 'britain', 'belgium', 'hungary', 'netherlands',
  'italy', 'azerbaijan', 'singapore', 'usa', 'mexico',
  'brazil', 'las-vegas', 'qatar', 'abu-dhabi'
];