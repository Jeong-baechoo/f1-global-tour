/**
 * 날씨 관련 상수 정의
 */

// 시간 계산 상수
export const TIME_CONSTANTS = {
  MILLISECONDS_IN_HOUR: 1000 * 60 * 60,
  MILLISECONDS_IN_DAY: 1000 * 60 * 60 * 24,
  MINUTES_IN_MILLISECOND: 60 * 1000,
  OLD_DATA_THRESHOLD_DAYS: 7,
} as const;

// 기본 업데이트 간격 (분)
export const DEFAULT_UPDATE_INTERVAL = 5;

// 폴백 meeting key
export const FALLBACK_MEETING_KEY = 1265; // 스파 서킷

// 풍향 방위 매핑
export const WIND_DIRECTIONS = [
  'N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 
  'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'
] as const;

// 바람 강도별 이모지 매핑
export const WIND_ICONS = {
  CALM: '💨',
  MODERATE: '🌬️', 
  STRONG: '💨💨'
} as const;

// 바람 강도 임계값
export const WIND_THRESHOLDS = {
  MODERATE: 5,
  STRONG: 15
} as const;

// 에러 메시지
export const ERROR_MESSAGES = {
  NO_RACE_INFO: '레이스 정보를 찾을 수 없습니다',
  DATA_NOT_READY: '아직 날씨 데이터가 제공되기 전입니다',
  F1_WEEKEND_ONLY: 'F1 레이스 주말에만 실시간 데이터 제공',
  UNKNOWN_ERROR: '알 수 없는 오류가 발생했습니다',
  DATA_UNAVAILABLE: {
    ko: '날씨 정보를 불러올 수 없습니다',
    en: 'Weather data unavailable'
  } as const,
  DATA_NOT_AVAILABLE_YET: {
    ko: '아직 날씨 데이터가 제공되기 전입니다',
    en: 'Weather data not available yet'
  } as const
} as const;