// 다국어 텍스트 타입 정의
export interface MultiLanguageText {
  en: string;
  ko: string;
}

// 언어에 따른 텍스트 반환 함수
export function getText(textObj: MultiLanguageText | string, language: 'en' | 'ko', fallback?: string): string {
  // 문자열인 경우 그대로 반환 (하위 호환성)
  if (typeof textObj === 'string') {
    return textObj;
  }
  
  // 다국어 객체인 경우 해당 언어 반환, 없으면 영어로 폴백, 그것도 없으면 fallback 사용
  return textObj[language] || textObj.en || fallback || '';
}

// 팀 데이터 타입 정의
export interface TeamData {
  id: string;
  name: MultiLanguageText;
  fullName: MultiLanguageText;
  colors: {
    primary: string;
    secondary: string;
  };
  headquarters: {
    city: MultiLanguageText;
    country: MultiLanguageText;
    lat: number;
    lng: number;
  };
  teamPrincipal: MultiLanguageText;
  foundingYear: number;
  description: MultiLanguageText;
  championships2025: {
    totalPoints: number;
    raceResults: Array<{
      race: string;
      points: number;
    }>;
  };
}

// 서킷 데이터 타입 정의 (향후 사용)
export interface CircuitData {
  id: string;
  name: MultiLanguageText;
  location: {
    city: MultiLanguageText;
    country: MultiLanguageText;
    lat: number;
    lng: number;
  };
  description?: MultiLanguageText;
}