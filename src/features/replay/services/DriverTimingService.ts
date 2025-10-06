import { ReplayDriverData, ReplayLapData, ReplaySessionData, DriverPosition } from '../types';
import { mockDrivers, mockLaps, mockSessions } from '../data/mockData';
import { DriverTiming } from '@/src/features/replay/components/ui';
import { OpenF1MockDataService } from './OpenF1MockDataService';
import { BackendReplayApiService } from './BackendReplayApiService';

// 사용할 데이터 서비스 타입
type ReplayDataServiceType = 'backend' | 'mock';

// 환경 변수나 설정으로 서비스 선택
const getPreferredService = (): ReplayDataServiceType => {
  // 환경 변수로 제어 가능
  if (typeof window !== 'undefined') {
    const preference = localStorage.getItem('replay-service-preference');
    if (preference === 'backend' || preference === 'mock') {
      return preference;
    }
  }
  
  // 기본값은 backend 시도 후 mock fallback
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
    this.drivers = mockDrivers;
    this.laps = mockLaps;
    this.currentSession = mockSessions[0]; // 첫 번째 세션을 기본으로 설정
    
    // 두 서비스 모두 초기화
    this.backendService = BackendReplayApiService.getInstance();
    this.mockService = OpenF1MockDataService.getInstance();
    this.preferredServiceType = getPreferredService();
    
  }

  setCurrentSession(session: ReplaySessionData): void {
    this.currentSession = session;
    this.currentLap = 1;
    
    // 두 서비스 모두에 세션 정보 전달
    this.mockService.setSession(session.sessionKey);
    this.backendService.setSession(session.sessionKey);
    
  }

  setCurrentLap(lapNumber: number): void {
    this.currentLap = lapNumber;
    
    // 두 서비스 모두에 현재 랩 동기화
    this.mockService.setCurrentLap(lapNumber);
    this.backendService.setCurrentLap(lapNumber);
    
  }

  // 실제 드라이버 위치 업데이트 (ReplayAnimationEngine에서 호출)
  updateDriverPositions(positions: DriverPosition[]): void {
    this.currentDriverPositions = positions;
  }

  private formatLapTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(3);
    return `${minutes}:${secs.padStart(6, '0')}`;
  }

  private calculateGapToLeader(driverLaps: ReplayLapData[], leaderTime: number): string {
    if (!driverLaps.length) return '--';
    
    const driverCurrentTime = driverLaps
      .filter(lap => lap.lapNumber <= this.currentLap)
      .reduce((total, lap) => total + lap.lapDuration, 0);

    if (driverCurrentTime === leaderTime) return '--';
    
    const gap = driverCurrentTime - leaderTime;
    return gap > 0 ? `+${gap.toFixed(3)}` : `${gap.toFixed(3)}`;
  }

  private getSectorPerformance(sectorTime: number, bestSector: number, personalBest: number): 'fastest' | 'personal_best' | 'normal' | 'slow' {
    if (Math.abs(sectorTime - bestSector) < 0.01) return 'fastest';
    if (Math.abs(sectorTime - personalBest) < 0.01) return 'personal_best';
    if (sectorTime > personalBest + 0.5) return 'slow';
    return 'normal';
  }

  async generateCurrentDriverTimings(): Promise<DriverTiming[]> {
    if (!this.currentSession) return [];

    // 백엔드 서비스를 먼저 시도
    if (this.preferredServiceType === 'backend') {
      try {
        console.log('🔄 [DriverTimingService] Attempting to use backend API...');
        const backendTimings = await this.backendService.convertToDriverTimings();

        // 성공하면 backend 사용 상태로 설정
        this.isUsingBackend = true;
        console.log('✅ [DriverTimingService] Using BACKEND API service');

        // 실제 드라이버 위치가 있다면 순위를 동기화
        if (this.currentDriverPositions.length > 0) {
          return this.syncWithRealPositions(backendTimings);
        }

        return backendTimings;
      } catch (error) {
        this.isUsingBackend = false;
        console.warn('⚠️ [DriverTimingService] Backend API failed, falling back to mock service:', error);
      }
    }

    // Mock 서비스 사용 (fallback 또는 preferred)
    try {
      console.log('📝 [DriverTimingService] Using MOCK data service');
      const mockTimings = this.mockService.convertToDriverTimings();

      // 실제 드라이버 위치가 있다면 순위를 동기화
      if (this.currentDriverPositions.length > 0) {
        return this.syncWithRealPositions(mockTimings);
      }

      return mockTimings;
    } catch (error) {
      console.error('❌ [DriverTimingService] Mock service also failed, using legacy:', error);
      return this.generateLegacyDriverTimings();
    }
  }

  // 실제 리플레이 위치와 mock 데이터를 동기화
  private syncWithRealPositions(mockTimings: DriverTiming[]): DriverTiming[] {
    // 입력 검증
    if (!this.currentDriverPositions || this.currentDriverPositions.length === 0) {
      return mockTimings.slice(0, 20); // 최대 20명으로 제한
    }

    // 실제 위치를 현재 순위 기준으로 정렬 (position이 작을수록 앞서 가는 것)
    const sortedPositions = [...this.currentDriverPositions]
      .sort((a, b) => a.position - b.position)
      .slice(0, 20); // 최대 20명으로 제한

    // mock 데이터를 실제 위치 순서에 맞게 재정렬
    const synced: DriverTiming[] = [];
    const usedDriverCodes = new Set<string>(); // 중복 방지

    for (let i = 0; i < Math.min(sortedPositions.length, 20); i++) {
      const realPosition = sortedPositions[i];
      const driverCode = this.getDriverCodeFromNumber(realPosition.driverNumber);

      // 이미 사용된 드라이버 코드인지 확인
      if (usedDriverCodes.has(driverCode)) {
        continue;
      }

      const mockData = mockTimings.find(timing => timing.driverCode === driverCode);

      if (mockData) {
        usedDriverCodes.add(driverCode);
        synced.push({
          ...mockData,
          position: i + 1, // 실제 위치에 맞게 순위 업데이트
          interval: i === 0 ? '--' : mockData.interval, // 1위는 간격 없음
        });
      }
    }

    // 최대 20명까지만 반환
    return synced.slice(0, 20);
  }

  // 드라이버 번호를 코드로 변환하는 헬퍼 메서드
  private getDriverCodeFromNumber(driverNumber: number): string {
    const driver = this.drivers.find(d => d.driverNumber === driverNumber);
    return driver?.nameAcronym || 'UNK';
  }

  // 기존 로직을 백업으로 유지
  private generateLegacyDriverTimings(): DriverTiming[] {
    // 각 드라이버별로 현재 랩까지의 데이터 계산 (최대 20명 제한)
    const limitedDrivers = this.drivers.slice(0, 20);
    const driverTimings: DriverTiming[] = [];
    let leaderTime = Infinity;

    // 먼저 리더 시간 계산
    for (const driver of limitedDrivers) {
      const driverLaps = this.laps.filter(lap =>
        lap.driverNumber === driver.driverNumber &&
        lap.lapNumber <= this.currentLap
      );

      if (driverLaps.length > 0) {
        const totalTime = driverLaps.reduce((total, lap) => total + lap.lapDuration, 0);
        if (totalTime < leaderTime) {
          leaderTime = totalTime;
        }
      }
    }

    // 각 드라이버의 타이밍 정보 생성
    for (const driver of limitedDrivers) {
      const driverLaps = this.laps.filter(lap =>
        lap.driverNumber === driver.driverNumber &&
        lap.lapNumber <= this.currentLap
      );

      if (driverLaps.length === 0) continue;

      const currentLap = driverLaps[driverLaps.length - 1];
      const bestLap = driverLaps.reduce((best, lap) =>
        lap.lapDuration < best.lapDuration ? lap : best
      );

      const gapToLeader = this.calculateGapToLeader(driverLaps, leaderTime);

      // 섹터 성능 계산 (간소화된 버전)
      const allSector1Times = this.laps
        .filter(lap => lap.sectorTimes && lap.sectorTimes.length > 0)
        .map(lap => lap.sectorTimes![0])
        .filter(time => typeof time === 'number');
      const allSector2Times = this.laps
        .filter(lap => lap.sectorTimes && lap.sectorTimes.length > 1)
        .map(lap => lap.sectorTimes![1])
        .filter(time => typeof time === 'number');
      const allSector3Times = this.laps
        .filter(lap => lap.sectorTimes && lap.sectorTimes.length > 2)
        .map(lap => lap.sectorTimes![2])
        .filter(time => typeof time === 'number');

      const bestSector1 = allSector1Times.length > 0 ? Math.min(...allSector1Times) : 0;
      const bestSector2 = allSector2Times.length > 0 ? Math.min(...allSector2Times) : 0;
      const bestSector3 = allSector3Times.length > 0 ? Math.min(...allSector3Times) : 0;

      const personalBestSectors = driverLaps.reduce((best, lap) => {
        if (!lap.sectorTimes || lap.sectorTimes.length < 3) return best;
        const sector1 = lap.sectorTimes[0];
        const sector2 = lap.sectorTimes[1];
        const sector3 = lap.sectorTimes[2];
        return [
          typeof sector1 === 'number' ? Math.min(best[0], sector1) : best[0],
          typeof sector2 === 'number' ? Math.min(best[1], sector2) : best[1],
          typeof sector3 === 'number' ? Math.min(best[2], sector3) : best[2]
        ];
      }, [Infinity, Infinity, Infinity]);

      const timing: DriverTiming = {
        position: 1, // 임시값, 나중에 정렬 후 설정
        driverCode: driver.nameAcronym,
        teamColor: `#${driver.teamColor}`,
        interval: gapToLeader,
        intervalToAhead: gapToLeader, // 간소화
        currentLapTime: this.formatLapTime(currentLap.lapDuration),
        bestLapTime: this.formatLapTime(bestLap.lapDuration),
        miniSector: {
          sector1: currentLap.sectorTimes && currentLap.sectorTimes.length > 0 && typeof currentLap.sectorTimes[0] === 'number'
            ? this.getSectorPerformance(currentLap.sectorTimes[0], bestSector1, personalBestSectors[0])
            : 'normal',
          sector2: currentLap.sectorTimes && currentLap.sectorTimes.length > 1 && typeof currentLap.sectorTimes[1] === 'number'
            ? this.getSectorPerformance(currentLap.sectorTimes[1], bestSector2, personalBestSectors[1])
            : 'normal',
          sector3: currentLap.sectorTimes && currentLap.sectorTimes.length > 2 && typeof currentLap.sectorTimes[2] === 'number'
            ? this.getSectorPerformance(currentLap.sectorTimes[2], bestSector3, personalBestSectors[2])
            : 'normal'
        },
        tireInfo: {
          pitStops: Math.floor(this.currentLap / 20) || 1, // 간소화된 피트스톱 계산
          lapCount: (this.currentLap % 25) + 10, // 간소화된 타이어 사용 랩 수
          compound: this.currentLap > 30 ? 'HARD' : this.currentLap > 15 ? 'MEDIUM' : 'SOFT'
        }
      };

      driverTimings.push(timing);
    }

    // 총 시간으로 정렬하고 포지션 설정
    const sortedTimings = driverTimings
      .sort((a, b) => {
        const aTime = parseFloat(a.interval.replace('+', '') || '0');
        const bTime = parseFloat(b.interval.replace('+', '') || '0');
        return aTime - bTime;
      })
      .slice(0, 20); // 최대 20명 제한

    // 포지션 설정
    sortedTimings.forEach((timing, index) => {
      timing.position = index + 1;
      if (index === 0) {
        timing.interval = '--';
        timing.intervalToAhead = '';
      }
    });

    return sortedTimings;
  }

  getCurrentSession(): ReplaySessionData | null {
    return this.currentSession;
  }

  getCurrentLap(): number {
    return this.currentLap;
  }

  getAvailableSessions(): ReplaySessionData[] {
    return mockSessions;
  }

  // ===============================
  // 서비스 전환 및 관리 메서드들
  // ===============================

  // 현재 사용중인 서비스 확인
  getCurrentServiceType(): ReplayDataServiceType {
    return this.isUsingBackend ? 'backend' : 'mock';
  }

  // 백엔드 API 사용 가능 상태 확인
  isBackendAvailable(): boolean {
    return this.backendService.isBackendApiAvailable();
  }

  // 서비스 타입 수동 변경
  switchToService(serviceType: ReplayDataServiceType): void {
    this.preferredServiceType = serviceType;
    
    // localStorage에 설정 저장
    if (typeof window !== 'undefined') {
      localStorage.setItem('replay-service-preference', serviceType);
    }
    
  }

  // 백엔드로 강제 전환 시도
  async tryBackendService(): Promise<boolean> {
    try {
      await this.backendService.convertToDriverTimings();
      this.isUsingBackend = true;
      return true;
    } catch (error) {
      this.isUsingBackend = false;
      return false;
    }
  }

  // 서비스 상태 정보 반환
  getServiceStatus() {
    return {
      preferred: this.preferredServiceType,
      current: this.getCurrentServiceType(),
      backendAvailable: this.isBackendAvailable(),
      isUsingBackend: this.isUsingBackend
    };
  }

  // 리플레이 세션 시작 (백엔드 캐싱 트리거)
  async startReplaySession(sessionKey: number): Promise<void> {
    if (this.preferredServiceType === 'backend') {
      try {
        await this.backendService.startReplaySession(sessionKey);
      } catch (error) {
      }
    }
  }

  // 완전 정리 (컴포넌트 언마운트 시)
  cleanup(): void {
    this.backendService.cleanup();
    this.mockService.stopRealtimeUpdates();
  }
}