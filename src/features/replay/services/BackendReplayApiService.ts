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

export class BackendReplayApiService {
  private static instance: BackendReplayApiService;
  private readonly baseUrl = 'http://localhost:4000/api/v1';

  private frames: DriverDisplayFrame[] = [];
  private sessionKey: number = 0;
  private isLoading: boolean = false;
  private isAvailable: boolean = true;

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
    this.loadAllDriverTimings(sessionKey).catch((err) => {
      console.warn('[BackendReplayApiService] Failed to load driver timings:', err);
      this.isAvailable = false;
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

  cleanup(): void {
    this.frames = [];
    this.isLoading = false;
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
