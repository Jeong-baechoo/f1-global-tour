import { 
  TIME_CONSTANTS, 
  WIND_DIRECTIONS, 
  WIND_ICONS, 
  WIND_THRESHOLDS 
} from '../constants/weather';

/**
 * 날씨 관련 유틸리티 함수들
 */

export type Language = 'ko' | 'en';

/**
 * 시간 차이를 사람이 읽기 쉬운 형태로 포맷
 */
export function formatTimeAgo(dateString: string, language: Language = 'ko'): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / TIME_CONSTANTS.MILLISECONDS_IN_HOUR);
  
  if (diffHours < 1) {
    return language === 'ko' ? '1시간 이내' : 'Within 1 hour';
  } else if (diffHours < 24) {
    return language === 'ko' ? `${diffHours}시간 전` : `${diffHours}h ago`;
  } else {
    const diffDays = Math.floor(diffHours / 24);
    return language === 'ko' ? `${diffDays}일 전` : `${diffDays}d ago`;
  }
}

/**
 * 날짜가 오래된 데이터인지 확인
 */
export function isOldWeatherData(dateString: string): boolean {
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / TIME_CONSTANTS.MILLISECONDS_IN_DAY);
  return diffDays > TIME_CONSTANTS.OLD_DATA_THRESHOLD_DAYS;
}

/**
 * 풍향을 방위로 변환
 */
export function formatWindDirection(degrees: number): string {
  const index = Math.round(degrees / 22.5) % 16;
  return WIND_DIRECTIONS[index];
}

/**
 * 바람 강도에 따른 아이콘 반환
 */
export function getWindIcon(windSpeed: number): string {
  if (windSpeed < WIND_THRESHOLDS.MODERATE) return WIND_ICONS.CALM;
  if (windSpeed < WIND_THRESHOLDS.STRONG) return WIND_ICONS.MODERATE;
  return WIND_ICONS.STRONG;
}

/**
 * 강수 여부 확인
 */
export function isRainy(rainfall: number): boolean {
  return rainfall > 0;
}

/**
 * 시간을 로케일에 맞게 포맷
 */
export function formatTime(date: Date, language: Language = 'ko'): string {
  return date.toLocaleTimeString(language === 'ko' ? 'ko-KR' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
}