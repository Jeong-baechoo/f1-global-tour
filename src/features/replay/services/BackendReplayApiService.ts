import axios from 'axios';

interface DriverDisplayRow {
  position: number;
  driverCode: string;
  teamColor: string;
  interval: string;
  intervalToAhead: string;
  currentLapTime: string;
  bestLapTime: string;
  miniSector: {
    sector1: 'fastest' | 'personal_best' | 'normal' | 'none';
    sector2: 'fastest' | 'personal_best' | 'normal' | 'none';
    sector3: 'fastest' | 'personal_best' | 'normal' | 'none';
  };
  tireInfo: {
    compound: 'SOFT' | 'MEDIUM' | 'HARD' | 'INTERMEDIATE' | 'WET' | 'UNKNOWN';
    lapCount: number;
    pitStops: number;
  };
}

interface DriverDisplayFrame {
  timeOffset: number;
  currentLap: number;
  drivers: DriverDisplayRow[];
}

export interface TelemetryFrame {
  timeOffset: number;
  speed: number;
  gear: number;
  throttle: number;
  brake: number;
  drsEnabled: boolean;
  drsAvailable: boolean;
}

interface DriverTelemetryResponse {
  driverNumber: number;
  driverCode: string;
  teamColor: string;
  frames: TelemetryFrame[];
}

export interface RaceFlagsResponse {
  sessionType: 'RACE' | 'QUALIFYING' | 'PRACTICE';
  totalLaps: number;
  lapFlags: ('NONE' | 'RED' | 'SC' | 'VSC' | 'YELLOW')[];
  totalMinutes: number;
  minuteFlags: ('NONE' | 'RED' | 'SC' | 'VSC' | 'YELLOW')[];
}

export class BackendReplayApiService {
  private static instance: BackendReplayApiService;
  private readonly baseUrl = 'http://localhost:4000/api/v1';

  private frames: DriverDisplayFrame[] = [];
  private raceFlagsData: RaceFlagsResponse | null = null;
  private sessionKey: number = 0;
  private isLoading: boolean = false;
  private isAvailable: boolean = true;

  // 드라이버별 텔레메트리 캐시
  private telemetryCache: Map<number, TelemetryFrame[]> = new Map();
  private telemetryLoading: Set<number> = new Set();

  static getInstance(): BackendReplayApiService {
    if (!BackendReplayApiService.instance) {
      BackendReplayApiService.instance = new BackendReplayApiService();
    }
    return BackendReplayApiService.instance;
  }

  setSession(sessionKey: number): void {
    if (this.sessionKey === sessionKey) return;
    this.sessionKey = sessionKey;
    this.frames = [];
    this.raceFlagsData = null;
    this.telemetryCache.clear();
    this.telemetryLoading.clear();
    this.loadAllDriverTimings(sessionKey).catch((err) => {
      console.warn('[BackendReplayApiService] Failed to load driver timings:', err);
      this.isAvailable = false;
    });
    this.loadRaceFlags(sessionKey).catch((err) => {
      console.warn('[BackendReplayApiService] Failed to load race flags:', err);
    });
  }

  // 현재 시간 기준 표시용 프레임 반환 (이진탐색)
  // timeOffset이 첫 번째 프레임보다 이전이면 null 반환 → 재생 전 빈 상태 유지
  getFrameAtTime(timeOffset: number): DriverDisplayFrame | null {
    if (this.frames.length === 0) return null;
    if (timeOffset < this.frames[0].timeOffset) return null;

    let lo = 0;
    let hi = this.frames.length - 1;

    while (lo < hi) {
      const mid = Math.floor((lo + hi + 1) / 2);
      if (this.frames[mid].timeOffset <= timeOffset) {
        lo = mid;
      } else {
        hi = mid - 1;
      }
    }

    return this.frames[lo];
  }

  isBackendApiAvailable(): boolean {
    return this.isAvailable;
  }

  async startReplaySession(sessionKey: number): Promise<{ success: boolean }> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/sessions/${sessionKey}/start-replay`,
        {},
        { timeout: 30000 },
      );
      return response.data;
    } catch {
      return { success: true };
    }
  }

  getRaceFlags(): RaceFlagsResponse | null {
    return this.raceFlagsData;
  }

  cleanup(): void {
    this.frames = [];
    this.raceFlagsData = null;
    this.isLoading = false;
    this.telemetryCache.clear();
    this.telemetryLoading.clear();
  }

  /**
   * 특정 드라이버의 텔레메트리 데이터를 백엔드에서 로드
   * 이미 캐시에 있거나 로딩 중이면 스킵
   */
  async loadDriverTelemetry(driverNumber: number): Promise<void> {
    if (this.telemetryCache.has(driverNumber) || this.telemetryLoading.has(driverNumber)) {
      return;
    }

    this.telemetryLoading.add(driverNumber);
    try {
      const response = await axios.get(
        `${this.baseUrl}/sessions/${this.sessionKey}/telemetry/${driverNumber}`,
        { timeout: 30000 },
      );

      if (!response.data.success) throw new Error('API returned success: false');

      const data = response.data.data as DriverTelemetryResponse;
      this.telemetryCache.set(driverNumber, data.frames);
    } catch (err) {
      console.warn(`[BackendReplayApiService] Telemetry load failed for driver ${driverNumber}:`, err);
    } finally {
      this.telemetryLoading.delete(driverNumber);
    }
  }

  /**
   * 특정 드라이버의 특정 시간에 해당하는 텔레메트리 프레임 반환 (이진탐색)
   */
  getTelemetryAtTime(driverNumber: number, timeOffset: number): TelemetryFrame | null {
    const frames = this.telemetryCache.get(driverNumber);
    if (!frames || frames.length === 0) return null;
    if (timeOffset < frames[0].timeOffset) return null;

    // 이진탐색으로 timeOffset 이상인 첫 인덱스 찾기
    let lo = 0;
    let hi = frames.length - 1;

    while (lo < hi) {
      const mid = Math.floor((lo + hi) / 2);
      if (frames[mid].timeOffset < timeOffset) {
        lo = mid + 1;
      } else {
        hi = mid;
      }
    }

    // lo가 정확히 일치하거나 초과하는 첫 인덱스 — 이전 인덱스와 비교하여 더 가까운 쪽 반환
    if (lo > 0) {
      const diffPrev = Math.abs(frames[lo - 1].timeOffset - timeOffset);
      const diffCurr = Math.abs(frames[lo].timeOffset - timeOffset);
      return diffPrev <= diffCurr ? frames[lo - 1] : frames[lo];
    }

    return frames[lo];
  }

  /**
   * 특정 드라이버의 텔레메트리가 로드되었는지 확인
   */
  isTelemetryLoaded(driverNumber: number): boolean {
    return this.telemetryCache.has(driverNumber);
  }

  private async loadRaceFlags(sessionKey: number): Promise<void> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/sessions/${sessionKey}/race-flags`,
        { timeout: 15000 },
      );

      if (!response.data.success) throw new Error('API returned success: false');

      this.raceFlagsData = response.data.data as RaceFlagsResponse;
    } catch (err) {
      console.warn('[BackendReplayApiService] Race flags load failed:', err);
      this.raceFlagsData = null;
    }
  }

  private async loadAllDriverTimings(sessionKey: number): Promise<void> {
    this.isLoading = true;
    try {
      const response = await axios.get(
        `${this.baseUrl}/sessions/${sessionKey}/driver-timings`,
        { timeout: 30000 },
      );

      if (!response.data.success) throw new Error('API returned success: false');

      this.frames = response.data.data.frames as DriverDisplayFrame[];
      this.isAvailable = true;
    } finally {
      this.isLoading = false;
    }
  }
}
