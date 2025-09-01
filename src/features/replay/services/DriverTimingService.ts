import { ReplayDriverData, ReplayLapData, ReplaySessionData } from '../types';
import { mockDrivers, mockLaps, mockSessions } from '../data/mockData';
import { DriverTiming } from '@/src/features/replay/components/ui';
import { OpenF1MockDataService } from '@/src/features/replay';

export class DriverTimingService {
  private static instance: DriverTimingService;
  private currentSession: ReplaySessionData | null = null;
  private currentLap: number = 1;
  private drivers: ReplayDriverData[] = [];
  private laps: ReplayLapData[] = [];
  private openF1Service: OpenF1MockDataService;

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
    this.openF1Service = OpenF1MockDataService.getInstance();
  }

  setCurrentSession(session: ReplaySessionData): void {
    this.currentSession = session;
    this.currentLap = 1;
  }

  setCurrentLap(lapNumber: number): void {
    this.currentLap = lapNumber;
    // OpenF1 서비스에도 현재 랩 동기화
    this.openF1Service.setCurrentLap(lapNumber);
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

  generateCurrentDriverTimings(): DriverTiming[] {
    if (!this.currentSession) return [];

    // OpenF1 기반 실시간 데이터 사용
    try {
      return this.openF1Service.convertToDriverTimings();
    } catch (error) {
      console.warn('OpenF1 서비스에서 데이터 생성 실패, 기존 방식 사용:', error);
      return this.generateLegacyDriverTimings();
    }
  }

  // 기존 로직을 백업으로 유지
  private generateLegacyDriverTimings(): DriverTiming[] {
    // 각 드라이버별로 현재 랩까지의 데이터 계산
    const driverTimings: DriverTiming[] = [];
    let leaderTime = Infinity;

    // 먼저 리더 시간 계산
    for (const driver of this.drivers) {
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
    for (const driver of this.drivers) {
      const driverLaps = this.laps.filter(lap => 
        lap.driverNumber === driver.driverNumber && 
        lap.lapNumber <= this.currentLap
      );

      if (driverLaps.length === 0) continue;

      const currentLap = driverLaps[driverLaps.length - 1];
      const bestLap = driverLaps.reduce((best, lap) => 
        lap.lapDuration < best.lapDuration ? lap : best
      );

      const totalTime = driverLaps.reduce((total, lap) => total + lap.lapDuration, 0);
      const gapToLeader = this.calculateGapToLeader(driverLaps, leaderTime);

      // 섹터 성능 계산 (간소화된 버전)
      const allSector1Times = this.laps
        .filter(lap => lap.sectorTimes && lap.sectorTimes.length > 0)
        .map(lap => lap.sectorTimes[0]);
      const allSector2Times = this.laps
        .filter(lap => lap.sectorTimes && lap.sectorTimes.length > 1)
        .map(lap => lap.sectorTimes[1]);
      const allSector3Times = this.laps
        .filter(lap => lap.sectorTimes && lap.sectorTimes.length > 2)
        .map(lap => lap.sectorTimes[2]);

      const bestSector1 = Math.min(...allSector1Times);
      const bestSector2 = Math.min(...allSector2Times);
      const bestSector3 = Math.min(...allSector3Times);

      const personalBestSectors = driverLaps.reduce((best, lap) => {
        if (!lap.sectorTimes || lap.sectorTimes.length < 3) return best;
        return [
          Math.min(best[0], lap.sectorTimes[0]),
          Math.min(best[1], lap.sectorTimes[1]),
          Math.min(best[2], lap.sectorTimes[2])
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
          sector1: currentLap.sectorTimes && currentLap.sectorTimes.length > 0 
            ? this.getSectorPerformance(currentLap.sectorTimes[0], bestSector1, personalBestSectors[0])
            : 'normal',
          sector2: currentLap.sectorTimes && currentLap.sectorTimes.length > 1
            ? this.getSectorPerformance(currentLap.sectorTimes[1], bestSector2, personalBestSectors[1])
            : 'normal',
          sector3: currentLap.sectorTimes && currentLap.sectorTimes.length > 2
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
    const sortedTimings = driverTimings.sort((a, b) => {
      const aTime = parseFloat(a.interval.replace('+', '') || '0');
      const bTime = parseFloat(b.interval.replace('+', '') || '0');
      return aTime - bTime;
    });

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
}