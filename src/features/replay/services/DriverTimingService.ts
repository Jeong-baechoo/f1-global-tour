import { ReplaySessionData, RaceStatus } from '../types';
import { DriverTiming } from '@/src/features/replay/components/ui';
import { OpenF1MockDataService } from './OpenF1MockDataService';
import { BackendReplayApiService } from './BackendReplayApiService';

// 사용할 데이터 서비스 타입
type ReplayDataServiceType = 'backend' | 'mock';

// 환경 변수나 설정으로 서비스 선택
const getPreferredService = (): ReplayDataServiceType => {
  if (typeof window !== 'undefined') {
    const preference = localStorage.getItem('replay-service-preference');
    if (preference === 'backend' || preference === 'mock') {
      return preference;
    }
  }
  return 'backend';
};

export class DriverTimingService {
  private static instance: DriverTimingService;
  private currentSession: ReplaySessionData | null = null;
  private currentLap: number = 1;
  private backendService: BackendReplayApiService;
  private mockService: OpenF1MockDataService;
  private preferredServiceType: ReplayDataServiceType;
  private isUsingBackend: boolean = false;

  static getInstance(): DriverTimingService {
    if (!DriverTimingService.instance) {
      DriverTimingService.instance = new DriverTimingService();
    }
    return DriverTimingService.instance;
  }

  private constructor() {
    this.backendService = BackendReplayApiService.getInstance();
    this.mockService = OpenF1MockDataService.getInstance();
    this.preferredServiceType = getPreferredService();
  }

  setCurrentSession(session: ReplaySessionData): void {
    this.currentSession = session;
    this.currentLap = 1;

    this.mockService.setSession(session.sessionKey);
    this.backendService.setSession(session.sessionKey);
  }

  setCurrentLap(lapNumber: number): void {
    this.currentLap = lapNumber;
    this.mockService.setCurrentLap(lapNumber);
  }

  getInitialDriverTimings(): DriverTiming[] {
    return this.mockService.getInitialDriverTimings();
  }

  // 백엔드 프레임의 currentLap 반환 (스토어 동기화용)
  getCurrentLapFromFrame(currentTime: number): number | null {
    const frame = this.backendService.getFrameAtTime(currentTime);
    return frame ? frame.currentLap : null;
  }

  // 백엔드 플래그 데이터 + 현재 프레임의 currentLap으로 RaceStatus 생성
  getRaceStatus(currentTime: number): RaceStatus | null {
    const flags = this.backendService.getRaceFlags();
    if (!flags) return null;

    const frame = this.backendService.getFrameAtTime(currentTime);
    const currentLap = frame?.currentLap ?? 1;

    // lapFlags에서 현재 랩의 플래그를 currentFlag로 변환
    const currentLapFlag = flags.lapFlags[currentLap - 1] ?? 'NONE';
    const currentFlag = currentLapFlag === 'NONE' ? 'GREEN' : currentLapFlag as RaceStatus['currentFlag'];

    // 시간 기반 세션의 currentMinute 계산
    let currentMinute = 0;
    if (flags.sessionType !== 'RACE' && flags.totalMinutes > 0) {
      currentMinute = Math.min(Math.floor(currentTime / 60), flags.totalMinutes);
    }

    return {
      sessionType: flags.sessionType,
      currentFlag,
      currentLap,
      totalLaps: flags.totalLaps,
      lapFlags: flags.lapFlags,
      currentMinute,
      totalMinutes: flags.totalMinutes,
      minuteFlags: flags.minuteFlags,
    };
  }

  // currentTime 기준으로 백엔드에서 사전 병합된 프레임 반환
  // displayDataLap 결정, lapTime/sector/interval 병합 등은 백엔드에서 완료
  getTimingsForDisplay(currentTime: number): DriverTiming[] {
    const frame = this.backendService.getFrameAtTime(currentTime);
    if (!frame || frame.drivers.length === 0) return [];

    return frame.drivers.map((row) => ({
      position: row.position,
      driverCode: row.driverCode,
      teamColor: row.teamColor,
      interval: row.interval,
      intervalToAhead: row.intervalToAhead,
      currentLapTime: row.currentLapTime,
      bestLapTime: row.bestLapTime,
      miniSector: row.miniSector,
      tireInfo: {
        compound: row.tireInfo.compound === 'UNKNOWN'
          ? 'SOFT' as const  // fallback for display
          : row.tireInfo.compound,
        lapCount: row.tireInfo.lapCount,
        pitStops: row.tireInfo.pitStops,
      },
    }));
  }

  getCurrentSession(): ReplaySessionData | null {
    return this.currentSession;
  }

  getCurrentLap(): number {
    return this.currentLap;
  }

  // ===============================
  // 서비스 전환 및 관리 메서드들
  // ===============================

  getCurrentServiceType(): ReplayDataServiceType {
    return this.isUsingBackend ? 'backend' : 'mock';
  }

  isBackendAvailable(): boolean {
    return this.backendService.isBackendApiAvailable();
  }

  switchToService(serviceType: ReplayDataServiceType): void {
    this.preferredServiceType = serviceType;
    if (typeof window !== 'undefined') {
      localStorage.setItem('replay-service-preference', serviceType);
    }
  }

  async tryBackendService(): Promise<boolean> {
    try {
      const frame = this.backendService.getFrameAtTime(0);
      this.isUsingBackend = frame !== null;
      return this.isUsingBackend;
    } catch {
      this.isUsingBackend = false;
      return false;
    }
  }

  getServiceStatus() {
    return {
      preferred: this.preferredServiceType,
      current: this.getCurrentServiceType(),
      backendAvailable: this.isBackendAvailable(),
      isUsingBackend: this.isUsingBackend,
    };
  }

  async startReplaySession(sessionKey: number): Promise<void> {
    if (this.preferredServiceType === 'backend') {
      try {
        await this.backendService.startReplaySession(sessionKey);
      } catch {
        // ignore
      }
    }
  }

  cleanup(): void {
    this.backendService.cleanup();
    this.mockService.stopRealtimeUpdates();
  }
}
