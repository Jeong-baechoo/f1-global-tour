// OpenF1 API 타입은 openF1Types.ts에서 관리
export type { OpenF1Session, OpenF1Driver, OpenF1Lap } from './openF1Types';

// 플래그/세션 타입 (UI 컴포넌트와 공유)
export type FlagStatus = 'GREEN' | 'RED' | 'SC' | 'VSC' | 'YELLOW';
export type LapFlagStatus = 'NONE' | 'RED' | 'SC' | 'VSC' | 'YELLOW';
export type SessionType = 'RACE' | 'QUALIFYING' | 'PRACTICE';

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
  currentSession: ReplaySessionData | null;
  drivers: ReplayDriverData[];
  lapsData: ReplayLapData[];
  isPlaying: boolean;
  isPaused: boolean;
  currentTime: number;
  totalDuration: number;
  playbackSpeed: number;
  currentLap: number;
  selectedDrivers: number[];
  showControls: boolean;
  showDriverInfo: boolean;
}

// 드라이버 위치 정보
export interface DriverPosition {
  driverNumber: number;
  coordinates: [number, number]; // [lng, lat]
  longitude: number;
  latitude: number;
  currentLap: number;
  lapProgress: number; // 0-1
  lapTime: number | null;
  position: number; // 현재 순위
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

// 에러 타입
export interface ReplayError {
  code: string;
  message: string;
  details?: unknown;
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
  showTrajectory: boolean;
  trajectoryLength: number;
  cameraFollow: boolean;
  selectedCamera: 'overview' | 'driver' | 'sector';
  showLapTimes: boolean;
  showPositions: boolean;
  enableSmoothAnimation: boolean;
}

// 레이스 상태 정보 (플래그 포함)
export interface RaceStatus {
  sessionType: SessionType;
  currentFlag: FlagStatus;
  // 레이스용
  currentLap: number;
  totalLaps: number;
  lapFlags: LapFlagStatus[];
  // 퀄리파잉/연습용
  currentMinute: number;
  totalMinutes: number;
  minuteFlags: LapFlagStatus[];
}
