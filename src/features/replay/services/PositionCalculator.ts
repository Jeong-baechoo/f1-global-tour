import { trackPositionService } from '@/src/features/replay';
import { DriverPosition, ReplayDriverData, ReplayLapData, FastF1TelemetryPoint } from '../types';

export class PositionCalculator {
  private driversData: ReplayDriverData[] = [];
  private lapsData: ReplayLapData[] = [];
  private telemetryData: FastF1TelemetryPoint[] = [];
  private circuitId = '';

  setData(
    driversData: ReplayDriverData[], 
    lapsData: ReplayLapData[], 
    telemetryData: FastF1TelemetryPoint[], 
    circuitId: string
  ): void {
    this.driversData = driversData;
    this.lapsData = lapsData;
    this.telemetryData = telemetryData;
    this.circuitId = circuitId;
  }

  calculateDriverPosition(driverNumber: number, currentTime: number): DriverPosition | null {
    // FastF1 텔레메트리 데이터가 있으면 그것을 사용
    if (this.telemetryData.length > 0) {
      return this.calculatePositionFromTelemetry(driverNumber, currentTime);
    }

    // 기존 랩 데이터 기반 계산
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
      if (process.env.NODE_ENV === 'development') {
        console.log(`🚫 No lap data for driver ${driverNumber} at time ${currentTime.toFixed(1)}s`);
      }
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

    // 현재 랩이 없으면 마지막 완주 랩 사용
    if (!currentLap && driverLaps.length > 0) {
      currentLap = driverLaps[driverLaps.length - 1];
      lapProgress = 1; // 100% 완주
      if (process.env.NODE_ENV === 'development') {
        console.log(`🏁 Driver ${driverNumber}: Using last lap ${currentLap.lapNumber}, Progress 100%`);
      }
    }

    if (!currentLap) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`❌ No valid lap data for driver ${driverNumber} at time ${currentTime.toFixed(1)}s`);
      }
      return null;
    }

    // 트랙 상의 위치 계산
    const coordinates = trackPositionService.getPositionAtProgress(this.circuitId, lapProgress);

    if (!coordinates) return null;

    return {
      driverNumber,
      coordinates,
      currentLap: currentLap.lapNumber,
      lapProgress,
      lapTime: currentLap.lapDuration,
      position: this.calculateRacePosition(driverNumber, currentTime)
    };
  }

  private calculatePositionFromTelemetry(driverNumber: number, currentTime: number): DriverPosition | null {
    if (!this.telemetryData.length) return null;

    // 현재 시간에 가장 가까운 텔레메트리 포인트 찾기
    const startTime = this.telemetryData[0].time || 0;
    const adjustedTime = startTime + currentTime;

    // 이진 검색으로 가장 가까운 포인트 찾기
    let left = 0;
    let right = this.telemetryData.length - 1;
    let closestPoint = this.telemetryData[0];

    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      const point = this.telemetryData[mid];
      const pointTime = point.time || 0;
      const closestTime = closestPoint.time || 0;
      
      if (Math.abs(pointTime - adjustedTime) < Math.abs(closestTime - adjustedTime)) {
        closestPoint = point;
      }
      
      if (pointTime < adjustedTime) {
        left = mid + 1;
      } else {
        right = mid - 1;
      }
    }

    // 실제 위도/경도 좌표 사용 (안전성 체크)
    const longitude = closestPoint.longitude ?? 0;
    const latitude = closestPoint.latitude ?? 0;
    const coordinates: [number, number] = [longitude, latitude];
    
    // 트랙 진행률 계산 (distance 기반)
    const totalDistance = Math.max(...this.telemetryData.map(p => p.distance || 0));
    const lapProgress = Math.min(1, (closestPoint.distance || 0) / totalDistance);

    // 좌표가 유효하지 않은 경우 경고 (개발 중에만)
    if (longitude === 0 && latitude === 0 && process.env.NODE_ENV === 'development') {
      console.warn(`⚠️ Driver ${driverNumber}: Invalid coordinates at ${currentTime.toFixed(1)}s`);
    }

    return {
      driverNumber,
      coordinates,
      currentLap: 1, // FastF1 데이터에서는 단일 랩
      lapProgress,
      lapTime: 90, // 평균 랩 타임
      position: 1 // 단일 드라이버이므로 1위
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
    this.telemetryData = [];
    this.circuitId = '';
  }
}