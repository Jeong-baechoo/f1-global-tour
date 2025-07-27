/**
 * OpenF1 API 날씨 데이터 인터페이스
 */
export interface WeatherData {
  /** 날짜/시간 (ISO 8601 형식) */
  date: string;
  /** 레이스 이벤트 키 */
  meeting_key: number;
  /** 세션 키 */
  session_key: number;
  /** 기온 (°C) */
  air_temperature: number;
  /** 트랙 온도 (°C) */
  track_temperature: number;
  /** 습도 (%) */
  humidity: number;
  /** 풍향 (0-359°) */
  wind_direction: number;
  /** 풍속 (m/s) */
  wind_speed: number;
  /** 기압 (mbar) */
  pressure: number;
  /** 강수 여부 (0: 없음, 1: 있음) */
  rainfall: number;
}

/**
 * 날씨 API 응답 타입
 */
export interface WeatherApiResponse {
  data: WeatherData[];
}

/**
 * 날씨 정보 상태 타입
 */
export interface WeatherState {
  /** 현재 날씨 데이터 */
  currentWeather: WeatherData | null;
  /** 로딩 상태 */
  isLoading: boolean;
  /** 에러 메시지 */
  error: string | null;
  /** 마지막 업데이트 시간 */
  lastUpdated: Date | null;
}