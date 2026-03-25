import { trackPositionService } from '@/src/features/replay';
import { DriverPosition, ReplayDriverData, ReplayLapData } from '../types';

export class PositionCalculator {
  private driversData: ReplayDriverData[] = [];
  private lapsData: ReplayLapData[] = [];
  private circuitId = '';

  setData(
    driversData: ReplayDriverData[],
    lapsData: ReplayLapData[],
    circuitId: string
  ): void {
    this.driversData = driversData;
    this.lapsData = lapsData;
    this.circuitId = circuitId;
  }

  calculateDriverPosition(driverNumber: number, currentTime: number): DriverPosition | null {
    // 랩 데이터 기반 계산
    return this.calculatePositionFromLapData(driverNumber, currentTime);
  }

  calculateAllDriverPositions(currentTime: number): DriverPosition[] {
    const driverPositions: DriverPosition[] = [];

    this.driversData.forEach(driver => {
      const position = this.calculateDriverPosition(driver.driverNumber, currentTime);
      if (position) {
        driverPositions.push(position);
      }
    });

    return driverPositions;
  }

  private calculatePositionFromLapData(driverNumber: number, currentTime: number): DriverPosition | null {
    const driverLaps = this.lapsData.filter(lap => lap.driverNumber === driverNumber);

    if (driverLaps.length === 0) {
      return null;
    }

    // 현재 시간에 해당하는 랩 찾기
    let currentLap: ReplayLapData | null = null;
    let lapProgress = 0;

    for (const lap of driverLaps) {
      const lapEndTime = lap.lapStartTime + lap.lapDuration;
      
      if (currentTime >= lap.lapStartTime && currentTime <= lapEndTime) {
        currentLap = lap;
        lapProgress = (currentTime - lap.lapStartTime) / lap.lapDuration;
        break;
      }
    }

    // 현재 랩이 없으면 현재 시간 이전에 시작한 가장 최근 랩 사용
    if (!currentLap && driverLaps.length > 0) {
      const lastLap = driverLaps[driverLaps.length - 1];
      const lastLapEnd = lastLap.lapStartTime + lastLap.lapDuration;

      // 마지막 랩 종료 이후 → DNF/리타이어로 판단, null 반환하여 마커 숨김
      if (currentTime > lastLapEnd) {
        return null;
      }

      const pastLaps = driverLaps.filter(l => l.lapStartTime <= currentTime);
      if (pastLaps.length > 0) {
        currentLap = pastLaps[pastLaps.length - 1];
        lapProgress = Math.min(1, (currentTime - currentLap.lapStartTime) / currentLap.lapDuration);
      } else {
        // 아직 레이스 시작 전이면 출발선에 배치
        currentLap = driverLaps[0];
        lapProgress = 0;
      }
    }

    if (!currentLap) {
      return null;
    }

    // 트랙 상의 위치 계산
    const coordinates = trackPositionService.getPositionAtProgress(this.circuitId, lapProgress);

    if (!coordinates) return null;

    return {
      driverNumber,
      coordinates,
      longitude: coordinates[0],
      latitude: coordinates[1],
      currentLap: currentLap.lapNumber,
      lapProgress,
      lapTime: currentLap.lapDuration,
      position: this.calculateRacePosition(driverNumber, currentTime)
    };
  }


  private calculateRacePosition(driverNumber: number, currentTime: number): number {
    // 모든 드라이버의 현재 진행률 계산하여 순위 결정
    const driverProgresses = this.driversData.map(driver => {
      const driverLaps = this.lapsData.filter(lap => lap.driverNumber === driver.driverNumber);
      let totalProgress = 0;

      for (const lap of driverLaps) {
        const lapEndTime = lap.lapStartTime + lap.lapDuration;
        
        if (currentTime >= lapEndTime) {
          totalProgress += 1; // 완주한 랩
        } else if (currentTime >= lap.lapStartTime) {
          totalProgress += (currentTime - lap.lapStartTime) / lap.lapDuration;
          break;
        }
      }

      return {
        driverNumber: driver.driverNumber,
        progress: totalProgress
      };
    });

    // 진행률로 정렬하여 순위 계산
    driverProgresses.sort((a, b) => b.progress - a.progress);

    return driverProgresses.findIndex(d => d.driverNumber === driverNumber) + 1;
  }

  clear(): void {
    this.driversData = [];
    this.lapsData = [];
    this.circuitId = '';
  }
}