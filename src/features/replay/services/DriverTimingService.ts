import { ReplayDriverData, ReplayLapData, ReplaySessionData, DriverPosition } from '../types';
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
  private drivers: ReplayDriverData[] = [];
  private laps: ReplayLapData[] = [];
  private backendService: BackendReplayApiService;
  private mockService: OpenF1MockDataService;
  private preferredServiceType: ReplayDataServiceType;
  private currentDriverPositions: DriverPosition[] = [];
  private isUsingBackend: boolean = false;

  static getInstance(): DriverTimingService {
    if (!DriverTimingService.instance) {
      DriverTimingService.instance = new DriverTimingService();
    }
    return DriverTimingService.instance;
  }

  constructor() {
    this.drivers = [];
    this.laps = [];
    this.currentSession = null;

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

  // 실제 드라이버 위치 업데이트 (ReplayAnimationEngine에서 호출)
  updateDriverPositions(positions: DriverPosition[]): void {
    this.currentDriverPositions = positions;
  }

  getInitialDriverTimings(): DriverTiming[] {
    return this.mockService.getInitialDriverTimings();
  }

  // 백엔드 프레임의 currentLap 반환 (스토어 동기화용)
  getCurrentLapFromFrame(currentTime: number): number | null {
    const frame = this.backendService.getFrameAtTime(currentTime);
    return frame ? frame.currentLap : null;
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

  getAvailableSessions(): ReplaySessionData[] {
    return [];
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

  // 미사용이지만 외부에서 참조할 수 있으므로 유지
  private formatLapTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(3);
    return `${minutes}:${secs.padStart(6, '0')}`;
  }

  private calculateGapToLeader(driverLaps: ReplayLapData[], leaderTime: number): string {
    if (!driverLaps.length) return '--';
    const driverCurrentTime = driverLaps
      .filter((lap) => lap.lapNumber <= this.currentLap)
      .reduce((total, lap) => total + lap.lapDuration, 0);
    if (driverCurrentTime === leaderTime) return '--';
    const gap = driverCurrentTime - leaderTime;
    return gap > 0 ? `+${gap.toFixed(3)}` : `${gap.toFixed(3)}`;
  }

  private syncWithRealPositions(mockTimings: DriverTiming[]): DriverTiming[] {
    if (!this.currentDriverPositions || this.currentDriverPositions.length === 0) {
      return mockTimings.slice(0, 20);
    }
    const sortedPositions = [...this.currentDriverPositions]
      .sort((a, b) => a.position - b.position)
      .slice(0, 20);
    const synced: DriverTiming[] = [];
    const usedDriverCodes = new Set<string>();
    for (let i = 0; i < Math.min(sortedPositions.length, 20); i++) {
      const realPosition = sortedPositions[i];
      const driverCode = this.getDriverCodeFromNumber(realPosition.driverNumber);
      if (usedDriverCodes.has(driverCode)) continue;
      const mockData = mockTimings.find((timing) => timing.driverCode === driverCode);
      if (mockData) {
        usedDriverCodes.add(driverCode);
        synced.push({
          ...mockData,
          position: i + 1,
          interval: i === 0 ? '--' : mockData.interval,
        });
      }
    }
    return synced.slice(0, 20);
  }

  private getDriverCodeFromNumber(driverNumber: number): string {
    const driver = this.drivers.find((d) => d.driverNumber === driverNumber);
    return driver?.nameAcronym || 'UNK';
  }
}
