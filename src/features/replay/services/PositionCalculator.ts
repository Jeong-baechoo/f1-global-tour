import { trackPositionService } from '@/src/features/replay';
import { DriverPosition, DriverLocationSample, ReplayDriverData, ReplayLapData } from '../types';
import { LocationCoordinateService } from './LocationCoordinateService';

export class PositionCalculator {
  private driversData: ReplayDriverData[] = [];
  private lapsData: ReplayLapData[] = [];
  private circuitId = '';

  // location(x,y) 기반 위치 계산용 데이터 (있으면 등속 추정보다 우선)
  private locationData: Map<number, DriverLocationSample[]> = new Map();
  private useLocation = false;

  setData(
    driversData: ReplayDriverData[],
    lapsData: ReplayLapData[],
    circuitId: string
  ): void {
    this.driversData = driversData;
    this.lapsData = lapsData;
    this.circuitId = circuitId;
  }

  /** OpenF1 location 시계열을 주입한다. 주입되면 calculate가 location 보간 경로를 사용한다. */
  setLocationData(
    circuitId: string,
    locationByDriver: Map<number, DriverLocationSample[]>,
    driversData?: ReplayDriverData[]
  ): void {
    this.circuitId = circuitId;
    this.locationData = locationByDriver;
    if (driversData) this.driversData = driversData;
    this.useLocation = LocationCoordinateService.hasCalibration(circuitId) && locationByDriver.size > 0;
  }

  calculateDriverPosition(driverNumber: number, currentTime: number): DriverPosition | null {
    // location 데이터가 있으면 실제 좌표 기반 시간 보간 (정확), 없으면 랩 시간 기반 등속 추정 (폴백)
    if (this.useLocation) {
      return this.calculatePositionFromLocation(driverNumber, currentTime);
    }
    return this.calculatePositionFromLapData(driverNumber, currentTime);
  }

  private calculatePositionFromLocation(driverNumber: number, currentTime: number): DriverPosition | null {
    const samples = this.locationData.get(driverNumber);
    if (!samples || samples.length === 0) return null;

    // 범위 밖 처리: 시작 전이면 첫 점, 데이터 종료 후면 마커 숨김(null)
    if (currentTime <= samples[0].t) {
      return this.makeLocationPosition(driverNumber, samples[0].x, samples[0].y);
    }
    const last = samples[samples.length - 1];
    if (currentTime >= last.t) {
      return null;
    }

    // 이진 탐색: currentTime 직후 샘플 인덱스 hi
    let lo = 0, hi = samples.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (samples[mid].t < currentTime) lo = mid + 1;
      else hi = mid;
    }
    const s1 = samples[hi];
    const s0 = samples[hi - 1];

    // 시간 기준 선형 보간
    const span = s1.t - s0.t;
    const r = span > 0 ? (currentTime - s0.t) / span : 0;
    const x = s0.x + (s1.x - s0.x) * r;
    const y = s0.y + (s1.y - s0.y) * r;

    return this.makeLocationPosition(driverNumber, x, y);
  }

  private makeLocationPosition(driverNumber: number, x: number, y: number): DriverPosition | null {
    const coords = LocationCoordinateService.toLngLat(this.circuitId, x, y);
    if (!coords) return null;
    return {
      driverNumber,
      coordinates: coords,
      longitude: coords[0],
      latitude: coords[1],
      currentLap: 0,
      lapProgress: 0,
      lapTime: null,
      position: 0,
    };
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
    this.locationData = new Map();
    this.useLocation = false;
  }
}