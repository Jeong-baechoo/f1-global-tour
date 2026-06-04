import { trackPositionService } from '@/src/features/replay';
import { DriverPosition, DriverLocationSample, DriverPositionSample, ReplayDriverData, ReplayLapData } from '../types';
import { LocationCoordinateService } from './LocationCoordinateService';
import { RoadSnapService } from './RoadSnapService';

export class PositionCalculator {
  private driversData: ReplayDriverData[] = [];
  private lapsData: ReplayLapData[] = [];
  private circuitId = '';

  // 백엔드 {t,lng,lat} 시계열 (변환·스냅 완료 → 시간 보간만). 최우선 경로.
  private backendPositions: Map<number, DriverPositionSample[]> = new Map();
  private useBackendPositions = false;

  // location(x,y) 기반 위치 계산용 데이터 (mock/PoC 전용, 등속 추정보다 우선)
  private locationData: Map<number, DriverLocationSample[]> = new Map();
  private useLocation = false;
  // 평행 도로 구간(monaco S/F 등) 런타임 진행률 스냅 (mock/PoC 전용)
  private roadSnap = new RoadSnapService();

  setData(
    driversData: ReplayDriverData[],
    lapsData: ReplayLapData[],
    circuitId: string
  ): void {
    this.driversData = driversData;
    this.lapsData = lapsData;
    this.circuitId = circuitId;
  }

  /**
   * 백엔드 {t,lng,lat} 시계열을 주입한다. 주입되면 calculate가 변환/스냅 없이 시간 보간만 한다.
   * (프로덕션 경로 — 좌표 변환·도로스냅은 백엔드가 이미 처리.)
   */
  setBackendPositions(
    circuitId: string,
    byDriver: Map<number, DriverPositionSample[]>,
    drivers?: ReplayDriverData[]
  ): void {
    this.circuitId = circuitId;
    this.backendPositions = byDriver;
    if (drivers) this.driversData = drivers;
    this.useBackendPositions = byDriver.size > 0;
  }

  /** OpenF1 location 시계열을 주입한다 (mock/PoC 전용). */
  setLocationData(
    circuitId: string,
    locationByDriver: Map<number, DriverLocationSample[]>,
    driversData?: ReplayDriverData[]
  ): void {
    this.circuitId = circuitId;
    this.locationData = locationByDriver;
    if (driversData) this.driversData = driversData;
    this.useLocation = LocationCoordinateService.hasCalibration(circuitId) && locationByDriver.size > 0;
    // 평행 도로 구간 진행률 사전계산(비동기). 준비 전엔 스냅이 fallback 반환.
    if (this.useLocation) void this.roadSnap.prepare(circuitId, locationByDriver);
  }

  calculateDriverPosition(driverNumber: number, currentTime: number): DriverPosition | null {
    // 우선순위: 백엔드 좌표(프로덕션) > location PoC(mock) > 랩 등속 추정(폴백)
    if (this.useBackendPositions) {
      return this.calcFromBackend(driverNumber, currentTime);
    }
    if (this.useLocation) {
      return this.calculatePositionFromLocation(driverNumber, currentTime);
    }
    return this.calculatePositionFromLapData(driverNumber, currentTime);
  }

  /** 백엔드 {t,lng,lat} 이진탐색 + 선형보간 (변환/스냅 호출 없음 — 백엔드가 이미 처리). */
  private calcFromBackend(driverNumber: number, currentTime: number): DriverPosition | null {
    const s = this.backendPositions.get(driverNumber);
    if (!s || s.length === 0) return null;

    // 범위 밖: 시작 전이면 첫 점, 데이터 종료 후면 마커 숨김(null)
    if (currentTime <= s[0].t) return this.makeBackendPos(driverNumber, s[0].lng, s[0].lat);
    if (currentTime >= s[s.length - 1].t) return null;

    let lo = 0, hi = s.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (s[mid].t < currentTime) lo = mid + 1;
      else hi = mid;
    }
    const a = s[hi - 1], b = s[hi];
    const r = (currentTime - a.t) / (b.t - a.t || 1);
    return this.makeBackendPos(
      driverNumber,
      a.lng + (b.lng - a.lng) * r,
      a.lat + (b.lat - a.lat) * r
    );
  }

  // currentLap/lapProgress/position은 0 placeholder. 백엔드 좌표 경로는 마커 좌표만 사용하고
  // 순위·랩 정보는 DriverTimingService(별도 경로)가 제공한다. 향후 UI가 이 필드를 소비하게 되면 채울 것.
  private makeBackendPos(driverNumber: number, lng: number, lat: number): DriverPosition {
    return {
      driverNumber,
      coordinates: [lng, lat],
      longitude: lng,
      latitude: lat,
      currentLap: 0,
      lapProgress: 0,
      lapTime: null,
      position: 0,
    };
  }

  private calculatePositionFromLocation(driverNumber: number, currentTime: number): DriverPosition | null {
    const samples = this.locationData.get(driverNumber);
    if (!samples || samples.length === 0) return null;

    // 범위 밖 처리: 시작 전이면 첫 점, 데이터 종료 후면 마커 숨김(null)
    if (currentTime <= samples[0].t) {
      return this.makeLocationPosition(driverNumber, samples[0].x, samples[0].y, currentTime);
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

    return this.makeLocationPosition(driverNumber, x, y, currentTime);
  }

  private makeLocationPosition(driverNumber: number, x: number, y: number, currentTime: number): DriverPosition | null {
    const coords = LocationCoordinateService.toLngLat(this.circuitId, x, y);
    if (!coords) return null;
    // 평행 도로 구간이면 진행률 기반 도로 스냅으로 옆 도로 이탈 방지
    const snapped = this.roadSnap.snap(driverNumber, currentTime, coords);
    return {
      driverNumber,
      coordinates: snapped,
      longitude: snapped[0],
      latitude: snapped[1],
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
    this.backendPositions = new Map();
    this.useBackendPositions = false;
    this.locationData = new Map();
    this.useLocation = false;
    this.roadSnap.clear();
  }
}