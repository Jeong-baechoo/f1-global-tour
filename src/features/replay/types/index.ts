// OpenF1 API 응답 타입
export interface OpenF1Session {
  circuit_key: number;
  circuit_short_name: string;
  country_code: string;
  country_key: number;
  country_name: string;
  date_end: string;
  date_start: string;
  gmt_offset: string;
  location: string;
  meeting_key: number;
  session_key: number;
  session_name: string;
  session_type: string;
  year: number;
}

export interface OpenF1Driver {
  broadcast_name: string;
  country_code: string;
  driver_number: number;
  first_name: string;
  full_name: string;
  headshot_url: string;
  last_name: string;
  name_acronym: string;
  session_key: number;
  team_colour: string;
  team_name: string;
}

export interface OpenF1Lap {
  date_start: string;
  driver_number: number;
  duration_sector_1: number | null;
  duration_sector_2: number | null;
  duration_sector_3: number | null;
  i1_speed: number | null;
  i2_speed: number | null;
  is_pit_out_lap: boolean;
  lap_duration: number | null;
  lap_number: number;
  segments_sector_1: number[];
  segments_sector_2: number[];
  segments_sector_3: number[];
  session_key: number;
  st_speed: number | null;
}

// 내부 데이터 구조
export interface ReplayLapData {
  driverNumber: number;
  lapNumber: number;
  lapDuration: number; // 초 단위
  lapStartTime: number; // 레이스 시작부터 경과 시간 (초)
  sectorTimes: [number | null, number | null, number | null];
  isPitOutLap: boolean;
}

export interface ReplayDriverData {
  driverNumber: number;
  name: string;
  nameAcronym: string;
  teamName: string;
  teamColor: string;
  broadcastName: string;
  countryCode: string;
}

export interface ReplaySessionData {
  sessionKey: number;
  sessionName: string;
  sessionType: string;
  circuitShortName: string;
  countryName: string;
  year: number;
  dateStart: string;
  dateEnd: string;
}

// 리플레이 상태
export interface ReplayState {
  // 현재 세션 정보
  currentSession: ReplaySessionData | null;
  
  // 드라이버 정보
  drivers: ReplayDriverData[];
  
  // 랩 데이터
  lapsData: ReplayLapData[];
  
  // 재생 상태
  isPlaying: boolean;
  isPaused: boolean;
  currentTime: number; // 현재 재생 시간 (초)
  totalDuration: number; // 전체 레이스 시간 (초)
  playbackSpeed: number; // 재생 속도 (0.5x ~ 10x)
  
  // 트랙 정보
  currentLap: number;
  selectedDrivers: number[]; // 추적할 드라이버 번호 배열
  
  // UI 상태
  showControls: boolean;
  showDriverInfo: boolean;
}

// 드라이버 위치 정보
export interface DriverPosition {
  driverNumber: number;
  coordinates: [number, number]; // [lng, lat]
  currentLap: number;
  lapProgress: number; // 0-1
  lapTime: number | null;
  position: number; // 현재 순위
}

// 리플레이 프레임 데이터
export interface ReplayFrame {
  timestamp: number; // 레이스 시작부터 경과 시간 (초)
  drivers: DriverPosition[];
}

// 재생 제어
export interface PlaybackControls {
  play: () => void;
  pause: () => void;
  stop: () => void;
  setSpeed: (speed: number) => void;
  seekTo: (time: number) => void;
  jumpToLap: (lap: number) => void;
}

// 트랙 진행률 계산 관련
export interface TrackProgress {
  lapNumber: number;
  progress: number; // 0-1 (현재 랩에서의 진행률)
  totalProgress: number; // 0-1 (전체 레이스에서의 진행률)
  coordinates: [number, number];
}

// 서킷 좌표 변환 관련
export interface CircuitCoordinates {
  circuitId: string;
  trackCoordinates: [number, number][]; // GeoJSON LineString 좌표
  totalDistance: number; // 총 트랙 길이 (미터)
}

// 애니메이션 관련
export interface AnimationConfig {
  duration: number; // 애니메이션 지속 시간 (ms)
  easing: 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out';
  smoothing: boolean; // 부드러운 보간 활성화
}

// 에러 타입
export interface ReplayError {
  code: string;
  message: string;
  details?: unknown;
}

// FastF1 API 응답 타입
export interface FastF1TelemetryPoint {
  time: number;
  longitude?: number;
  latitude?: number;
  distance?: number;
  speed?: number;
  rpm?: number;
  gear?: number;
  throttle?: number;
  brake?: number;
  drs?: number;
}

export interface FastF1Data {
  driver_number: number;
  full_name: string;
  driver: string;
  team: string;
  team_name: string;
  team_color: string;
  telemetry: FastF1TelemetryPoint[];
}

// API 응답 타입
export interface ApiResponse<T> {
  data: T;
  error?: ReplayError;
  success: boolean;
}

// 리플레이 설정
export interface ReplaySettings {
  autoPlay: boolean;
  defaultSpeed: number;
  showTrajectory: boolean; // 드라이버 궤적 표시
  trajectoryLength: number; // 궤적 길이 (초)
  cameraFollow: boolean; // 카메라 자동 추적
  selectedCamera: 'overview' | 'driver' | 'sector';
}