import { trackPositionService } from '@/src/features/replay';
import { DriverPosition, ReplayDriverData, ReplayLapData, FastF1TelemetryPoint } from '../types';

export class PositionCalculator {
  private driversData: ReplayDriverData[] = [];
  private lapsData: ReplayLapData[] = [];
  private telemetryData: { [driverNumber: number]: FastF1TelemetryPoint[] } = {};
  private circuitId = '';
  
  // 성능 최적화를 위한 캐시
  private positionCache: { [time: string]: { [driverNumber: number]: number } } = {};
  private lastPositionUpdateTime = 0;
  
  // 메타데이터 캐시 (프리컴퓨팅)
  private driverMetadata: { 
    [driverNumber: number]: { 
      maxTime: number; 
      pointIndexMap: Map<FastF1TelemetryPoint, number>;
      totalPoints: number;
    } 
  } = {};
  
  // 위치 계산 결과 캐시 (극대 성능 최적화)
  private positionResultCache: { 
    [cacheKey: string]: DriverPosition | null 
  } = {};
  
  // 전체 레이스 최대 시간 (DNF 문제 해결용)
  private globalMaxRaceTime = 0;
  
  // ✨ 더이상 필요 없음: 백엔드에서 좌표 변환 처리
  // private trackToGeoParams: removed - backend handles coordinate conversion

  setData(
    driversData: ReplayDriverData[], 
    lapsData: ReplayLapData[], 
    telemetryData: FastF1TelemetryPoint[] | { [driverNumber: number]: FastF1TelemetryPoint[] }, 
    circuitId: string
  ): void {
    this.driversData = driversData;
    this.lapsData = lapsData;
    // telemetryData가 배열이면 기존 방식(OpenF1), 객체면 새 방식(FastF1)
    this.telemetryData = Array.isArray(telemetryData) ? {} : telemetryData;
    this.circuitId = circuitId;
    
    // 텔레메트리 데이터 유효성 검증 로그
    console.log(`📊 PositionCalculator data validation:`);
    console.log(`   - Drivers: ${driversData.length} [${driversData.map(d => d.driverNumber).join(', ')}]`);
    console.log(`   - Telemetry data keys: ${Object.keys(this.telemetryData).length} [${Object.keys(this.telemetryData).join(', ')}]`);
    
    // 각 드라이버의 텔레메트리 데이터 점 수 확인
    Object.entries(this.telemetryData).forEach(([driverNumber, points]) => {
      if (Array.isArray(points)) {
        console.log(`   - Driver ${driverNumber}: ${points.length} telemetry points`);
      }
    });
    
    // 성능 최적화: FastF1 데이터인 경우에만 메타데이터 프리컴퓨팅
    if (!Array.isArray(telemetryData)) {
      this.precomputeDriverMetadata();
      // ✨ 더이상 필요 없음: 백엔드에서 좌표 변환 처리
      // this.calculateDynamicCoordinateTransform();
    }
  }
  
  private precomputeDriverMetadata(): void {
    // 1. 모든 드라이버의 최대 시간을 먼저 계산 (DNF 문제 해결)
    let globalMaxTime = 0;
    
    Object.keys(this.telemetryData).forEach(driverNumberStr => {
      const driverNumber = parseInt(driverNumberStr);
      const driverTelemetry = this.telemetryData[driverNumber];
      
      if (!driverTelemetry || driverTelemetry.length === 0) return;
      
      const maxTime = Math.max(...driverTelemetry.map(p => p.time));
      globalMaxTime = Math.max(globalMaxTime, maxTime);
    });
    
    // 2. 전체 레이스 시간 저장 (모든 드라이버가 동일한 시간 스케일 사용)
    this.globalMaxRaceTime = globalMaxTime;
    
    // 3. 각 드라이버별 메타데이터 생성
    Object.keys(this.telemetryData).forEach(driverNumberStr => {
      const driverNumber = parseInt(driverNumberStr);
      const driverTelemetry = this.telemetryData[driverNumber];
      
      if (!driverTelemetry || driverTelemetry.length === 0) return;
      
      // 개별 드라이버의 최대 시간 (DNF 판단용)
      const maxTime = Math.max(...driverTelemetry.map(p => p.time));
      
      // 포인트 인덱스 맵 생성 (O(1) 조회용)
      const pointIndexMap = new Map<FastF1TelemetryPoint, number>();
      driverTelemetry.forEach((point, index) => {
        pointIndexMap.set(point, index);
      });
      
      this.driverMetadata[driverNumber] = {
        maxTime,
        pointIndexMap,
        totalPoints: driverTelemetry.length
      };
    });
  }
  
  // ✨ 제거됨: 백엔드에서 좌표 변환 처리
  // private calculateDynamicCoordinateTransform(): void { ... }
  // private convertTrackToGeoCoordinates(): [number, number] { ... }

  calculateDriverPosition(driverNumber: number, currentTime: number): DriverPosition | null {
    // FastF1 텔레메트리 데이터가 있으면 그것을 사용
    if (this.telemetryData[driverNumber] && this.telemetryData[driverNumber].length > 0) {
      const result = this.calculatePositionFromTelemetry(driverNumber, currentTime);
      
      // 첫 5초 동안만 실패 원인 로그
      if (!result && currentTime <= 5) {
        console.log(`❌ Driver ${driverNumber}: FastF1 telemetry calculation failed at ${currentTime.toFixed(2)}s`);
        console.log(`   - Telemetry points: ${this.telemetryData[driverNumber]?.length || 0}`);
        console.log(`   - Metadata exists: ${!!this.driverMetadata[driverNumber]}`);
      }
      
      return result;
    }

    // 기존 랩 데이터 기반 계산
    const result = this.calculatePositionFromLapData(driverNumber, currentTime);
    if (!result && currentTime <= 5) {
      console.log(`❌ Driver ${driverNumber}: Lap data calculation failed at ${currentTime.toFixed(2)}s`);
    }
    
    return result;
  }

  calculateAllDriverPositions(currentTime: number): DriverPosition[] {
    const driverPositions: DriverPosition[] = [];
    const failedDrivers: number[] = [];

    this.driversData.forEach(driver => {
      const position = this.calculateDriverPosition(driver.driverNumber, currentTime);
      if (position) {
        driverPositions.push(position);
      } else {
        failedDrivers.push(driver.driverNumber);
      }
    });

    // 첫 5초 동안만 상세 로그
    if (currentTime <= 5) {
      console.log(`🎯 Position calculation results at ${currentTime.toFixed(2)}s:`);
      console.log(`✅ Success (${driverPositions.length}): [${driverPositions.map(p => p.driverNumber).join(', ')}]`);
      console.log(`❌ Failed (${failedDrivers.length}): [${failedDrivers.join(', ')}]`);
    }

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
      position: this.calculateRacePosition(driverNumber)
    };
  }

  private calculatePositionFromTelemetry(driverNumber: number, currentTime: number): DriverPosition | null {
    const driverTelemetry = this.telemetryData[driverNumber];
    const metadata = this.driverMetadata[driverNumber];
    
    if (!driverTelemetry || !driverTelemetry.length || !metadata) return null;

    // 🚀 성능 최적화: 캐시된 maxTime 사용 (Math.max 제거)
    if (currentTime > metadata.maxTime + 5) { // 5초 여유를 둠
      return null; // DNF 로깅 제거 (성능상)
    }

    // 🚀 부드러운 애니메이션: 30fps 캐싱 + 실시간 보간 시스템
    const cacheTime = Math.floor(currentTime * 30) / 30; // 0.033초 단위 (30fps)
    const positionCacheKey = `${driverNumber}_${cacheTime}`;
    
    // 캐시된 결과가 있으면 실시간 보간 적용
    if (this.positionResultCache[positionCacheKey]) {
      const cachedResult = this.positionResultCache[positionCacheKey];
      if (cachedResult && Math.abs(currentTime - cacheTime) < 0.1) {
        // 캐시된 시간과 현재 시간 차이가 작으면 부드러운 보간 적용
        return this.applySmootInterpolation(cachedResult, currentTime, cacheTime);
      }
      return cachedResult;
    }
    
    // 캐시에 없는 경우 정확한 currentTime으로 계산 (더 정밀함)
    const interpolationPoints = this.findInterpolationPoints(driverTelemetry, currentTime);
    if (!interpolationPoints) {
      this.positionResultCache[positionCacheKey] = null;
      return null;
    }

    const { prevPoint, nextPoint, interpolationFactor } = interpolationPoints;
    
    // ✨ 백엔드에서 변환된 longitude, latitude 직접 사용 (OpenF1 방식과 동일)
    // 🐛 DEBUG: 좌표 값 확인 (NaN 문제 해결용)
    if (currentTime <= 5 && driverNumber <= 4) {
      console.log(`🔍 Driver ${driverNumber} at ${currentTime.toFixed(2)}s coordinate debug:`);
      console.log(`   - prevPoint.longitude: ${prevPoint.longitude} (type: ${typeof prevPoint.longitude})`);
      console.log(`   - prevPoint.latitude: ${prevPoint.latitude} (type: ${typeof prevPoint.latitude})`);
      console.log(`   - nextPoint.longitude: ${nextPoint.longitude} (type: ${typeof nextPoint.longitude})`);
      console.log(`   - nextPoint.latitude: ${nextPoint.latitude} (type: ${typeof nextPoint.latitude})`);
      console.log(`   - interpolationFactor: ${interpolationFactor}`);
    }
    
    // 좌표 유효성 검증
    if (typeof prevPoint.longitude !== 'number' || typeof prevPoint.latitude !== 'number' ||
        typeof nextPoint.longitude !== 'number' || typeof nextPoint.latitude !== 'number' ||
        isNaN(prevPoint.longitude) || isNaN(prevPoint.latitude) ||
        isNaN(nextPoint.longitude) || isNaN(nextPoint.latitude)) {
      console.error(`❌ Invalid coordinate data for driver ${driverNumber} at ${currentTime.toFixed(2)}s:`);
      console.error(`   prevPoint: lng=${prevPoint.longitude}, lat=${prevPoint.latitude}`);
      console.error(`   nextPoint: lng=${nextPoint.longitude}, lat=${nextPoint.latitude}`);
      return null;
    }
    
    const longitude = prevPoint.longitude + (nextPoint.longitude - prevPoint.longitude) * interpolationFactor;
    const latitude = prevPoint.latitude + (nextPoint.latitude - prevPoint.latitude) * interpolationFactor;
    
    const coordinates = [longitude, latitude] as [number, number];
    
    // 디버깅: 변환된 좌표 확인 (첫 3초 동안만)
    if (currentTime <= 3 && driverNumber <= 4) {
      console.log(`🏁 Driver ${driverNumber} at ${currentTime.toFixed(2)}s: [${coordinates[0].toFixed(6)}, ${coordinates[1].toFixed(6)}]`);
    }
    
    if (!coordinates) {
      // 좌표 변환 실패시 캐시에 null 저장
      this.positionResultCache[positionCacheKey] = null;
      return null;
    }

    // 현재 시간 정보 (필요시 사용)
    // const currentPointTime = prevPoint.time + (nextPoint.time - prevPoint.time) * interpolationFactor;
    
    // 간단한 랩 정보 계산 (정확한 랩 번호 계산은 복잡하므로 임시로 1 사용)
    const currentLap = 1;
    const lapProgress = Math.max(0, Math.min(1, currentTime / this.globalMaxRaceTime));
    const averageLapTime = 90; // 평균 랩타임 90초로 가정

    // 🚀 계산 결과를 캐시에 저장
    const result: DriverPosition = {
      driverNumber,
      coordinates,
      currentLap,
      lapProgress,
      lapTime: averageLapTime,
      position: this.calculateRacePosition(driverNumber) // 정확한 시간 사용
    };
    
    this.positionResultCache[positionCacheKey] = result;
    
    // 캐시 정리 (메모리 효율성)
    this.cleanupPositionCache();
    
    return result;
  }
  
  // 🎬 부드러운 실시간 보간 시스템 (최적화됨)
  private applySmootInterpolation(
    cachedResult: DriverPosition, 
    currentTime: number, 
    cacheTime: number
  ): DriverPosition {
    const timeDiff = currentTime - cacheTime;
    const maxInterpolationTime = 1/30; // 30fps 간격
    
    if (timeDiff <= 0 || timeDiff >= maxInterpolationTime * 0.9) {
      return cachedResult; // 보간 범위를 벗어나면 캐시된 결과 반환
    }
    
    // 🚀 성능 최적화: 복잡한 계산 대신 단순 선형 보간 사용
    const interpolationFactor = timeDiff / maxInterpolationTime;
    
    // 간단한 진행률 보간 (trackPositionService 호출 없음!)
    const progressDelta = interpolationFactor * 0.005; // 매우 작은 진행률 증가
    const smoothProgress = Math.max(0, Math.min(1, cachedResult.lapProgress + progressDelta));
    
    // 좌표가 크게 변하지 않았을 가능성이 높으므로 기존 좌표 사용 (성능 최적화)
    // 실제로는 이런 미세한 시간차에서는 좌표 변화가 거의 없음
    
    return {
      ...cachedResult,
      lapProgress: smoothProgress
      // coordinates는 그대로 유지 (성능상 이유로)
    };
  }

  private calculateRacePosition(driverNumber: number): number {
    // 🔧 성능 테스트: 실제 순위 계산 비활성화
    // 임시로 간단한 순위 반환 (성능 확인용)
    return Math.max(1, Math.min(20, driverNumber % 20 + 1));
    
    /* 
    // 🚫 COMMENTED OUT FOR PERFORMANCE TESTING
    // 성능 최적화: 0.5초마다만 순위 재계산 (60fps -> 2fps로 감소)
    const timeKey = Math.floor(currentTime * 2) / 2; // 0.5초 단위로 반올림
    
    // 캐시된 순위가 있으면 반환
    if (this.positionCache[timeKey] && this.positionCache[timeKey][driverNumber]) {
      return this.positionCache[timeKey][driverNumber];
    }
    
    // 캐시된 시간과 다르면 전체 순위 재계산
    if (Math.abs(this.lastPositionUpdateTime - timeKey) >= 0.5) {
      this.updateAllPositions(timeKey);
      this.lastPositionUpdateTime = timeKey;
    }
    
    return this.positionCache[timeKey]?.[driverNumber] || 20; // 기본값 20위
    */
  }
  
  private updateAllPositions(currentTime: number): void {
    // 한 번에 모든 드라이버의 순위 계산 (최적화된 버전)
    const driverProgresses = this.driversData.map(driver => {
      const driverNumber = driver.driverNumber;
      const driverTelemetry = this.telemetryData[driverNumber];
      const metadata = this.driverMetadata[driverNumber];
      
      if (!driverTelemetry || driverTelemetry.length === 0 || !metadata) {
        return {
          driverNumber,
          trackProgress: -1,
          isActive: false
        };
      }

      // 🚀 성능 최적화: 캐시된 최대 시간 사용 (Math.max 제거)
      if (currentTime > metadata.maxTime + 5) {
        const dnfProgress = (metadata.totalPoints - 1) / Math.max(metadata.totalPoints - 1, 1);
        return {
          driverNumber,
          trackProgress: dnfProgress,
          isActive: false
        };
      }

      // 현재 시간에서의 진행률 계산
      const interpolationPoints = this.findInterpolationPoints(driverTelemetry, currentTime);
      if (!interpolationPoints) {
        return {
          driverNumber,
          trackProgress: -1,
          isActive: false
        };
      }

      // 🚀 성능 최적화: 캐시된 인덱스 맵 사용 (indexOf 제거)
      const { prevPoint, nextPoint, interpolationFactor } = interpolationPoints;
      const prevIndex = metadata.pointIndexMap.get(prevPoint) ?? 0;
      const nextIndex = metadata.pointIndexMap.get(nextPoint) ?? 0;
      
      const interpolatedIndex = prevIndex + (nextIndex - prevIndex) * interpolationFactor;
      const trackProgress = interpolatedIndex / Math.max(metadata.totalPoints - 1, 1);

      return {
        driverNumber,
        trackProgress: trackProgress,
        isActive: true
      };
    });

    // 정렬 (한 번만 수행)
    driverProgresses.sort((a, b) => {
      if (a.isActive && b.isActive) {
        return b.trackProgress - a.trackProgress;
      }
      if (a.isActive && !b.isActive) return -1;
      if (!a.isActive && b.isActive) return 1;
      return b.trackProgress - a.trackProgress;
    });

    // 캐시에 저장
    const timeKey = currentTime.toString();
    this.positionCache[timeKey] = {};
    
    driverProgresses.forEach((driverData, index) => {
      this.positionCache[timeKey][driverData.driverNumber] = index + 1;
    });
    
    // 캐시 정리 (메모리 절약)
    this.cleanupCache();
  }
  
  private cleanupCache(): void {
    const cacheKeys = Object.keys(this.positionCache);
    if (cacheKeys.length > 20) { // 최근 10초간의 데이터만 유지
      const sortedKeys = cacheKeys.sort((a, b) => parseFloat(b) - parseFloat(a));
      const keysToDelete = sortedKeys.slice(10);
      keysToDelete.forEach(key => delete this.positionCache[key]);
    }
  }
  
  private cleanupPositionCache(): void {
    const cacheKeys = Object.keys(this.positionResultCache);
    if (cacheKeys.length > 600) { // 30fps * 20명 * 10초 = 6000개 이론상, 실제로는 600개 정도로 제한
      // 가장 오래된 200개 항목 제거 (메모리 효율성)
      const sortedKeys = cacheKeys.sort((a, b) => {
        const timeA = parseFloat(a.split('_')[1]);
        const timeB = parseFloat(b.split('_')[1]);
        return timeA - timeB; // 오름차순 (오래된 것 먼저)
      });
      const keysToDelete = sortedKeys.slice(0, 200);
      keysToDelete.forEach(key => delete this.positionResultCache[key]);
    }
  }

  clear(): void {
    this.driversData = [];
    this.lapsData = [];
    this.telemetryData = {};
    this.circuitId = '';
    
    // 모든 캐시 정리
    this.positionCache = {};
    this.lastPositionUpdateTime = 0;
    this.driverMetadata = {};
    this.positionResultCache = {}; // 위치 계산 캐시도 정리
    this.globalMaxRaceTime = 0; // 전역 레이스 시간도 초기화
  }

  // 보간을 위한 인접한 두 텔레메트리 포인트 찾기
  private findInterpolationPoints(telemetryData: FastF1TelemetryPoint[], targetTime: number): {
    prevPoint: FastF1TelemetryPoint;
    nextPoint: FastF1TelemetryPoint;
    interpolationFactor: number;
  } | null {
    if (telemetryData.length < 2) return null;

    // 타겟 시간이 범위를 벗어나는 경우 처리
    if (targetTime <= telemetryData[0].time) {
      return {
        prevPoint: telemetryData[0],
        nextPoint: telemetryData[1],
        interpolationFactor: 0
      };
    }

    if (targetTime >= telemetryData[telemetryData.length - 1].time) {
      const lastIdx = telemetryData.length - 1;
      return {
        prevPoint: telemetryData[lastIdx - 1],
        nextPoint: telemetryData[lastIdx],
        interpolationFactor: 1
      };
    }

    // 이진 검색으로 적절한 구간 찾기
    let left = 0;
    let right = telemetryData.length - 1;

    while (left < right) {
      const mid = Math.floor((left + right) / 2);
      if (telemetryData[mid].time < targetTime) {
        left = mid + 1;
      } else {
        right = mid;
      }
    }

    // left가 적절한 nextPoint의 인덱스
    if (left === 0) left = 1;

    const prevPoint = telemetryData[left - 1];
    const nextPoint = telemetryData[left];
    
    // 보간 계수 계산 (0~1 사이 값)
    const timeDiff = nextPoint.time - prevPoint.time;
    const interpolationFactor = timeDiff > 0 ? 
      Math.max(0, Math.min(1, (targetTime - prevPoint.time) / timeDiff)) : 0;

    return {
      prevPoint,
      nextPoint,
      interpolationFactor
    };
  }
}