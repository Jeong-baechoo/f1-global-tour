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

// 드라이버 location 시계열 샘플 (OpenF1 x,y 기반) — mock/PoC 전용
export interface DriverLocationSample {
  t: number; // 레이스 시작 기준 상대 시간 (초)
  x: number; // OpenF1 로컬 좌표
  y: number;
}

// 백엔드가 보내는 렌더 직전 좌표 시계열 (변환·스냅 완료됨 → 프론트는 시간 보간만)
export interface DriverPositionSample {
  t: number; // 레이스 시작 기준 상대 시간 (초)
  lng: number;
  lat: number;
}

// 트랙별 어파인 변환 계수 (x,y -> lng,lat)
export interface AffineCoefficients {
  a: number; b: number; e: number; // lng = a*x + b*y + e
  c: number; d: number; f: number; // lat = c*x + d*y + f
}

// 트랙별 2차 다항식 변환 계수 (어파인으로 안 잡히는 비선형 왜곡 보정).
// value = [x, y, x², y², xy, 1] 계수 순서
export interface QuadraticCoefficients {
  lng: [number, number, number, number, number, number];
  lat: [number, number, number, number, number, number];
}

// 트랙별 TPS(Thin-Plate Spline) 국소 비선형 변환 계수.
// 검증된 base 어파인 위에 '잔차'만 RBF로 보정한다 (특정 코너의 뱅킹/far-corner 왜곡 대응).
//   lng = (a*x+b*y+e) + res_lng(xn,yn),  lat = (c*x+d*y+f) + res_lat(xn,yn)
//   xn=(x-cx)/s, yn=(y-cy)/s
//   res = α[0] + α[1]*xn + α[2]*yn + Σ w_i·U(r_i),  U(r)=r²·ln r,  r_i=|(xn,yn)-control_i|
export interface TpsResidual {
  a: [number, number, number]; // 잔차의 어파인 항 [1, xn, yn]
  w: number[];                 // control_i 별 RBF 가중치 (controls와 같은 길이)
}
export interface TpsCoefficients {
  affine: AffineCoefficients;          // base 변환
  norm: { cx: number; cy: number; s: number }; // RBF 수치안정용 정규화
  controls: [number, number][];        // 정규화 좌표계 제어점
  lng: TpsResidual;
  lat: TpsResidual;
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
