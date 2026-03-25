import axios from 'axios';
import {
  ReplaySessionData,
  ReplayDriverData,
  ReplayLapData,
  ApiResponse
} from '../types';
import { checkShouldForceMockData } from '../data/mockData';

interface BackendSession {
  session_key: number;
  session_name: string;
  session_type: string;
  circuit_short_name: string;
  country_name: string;
  year: number;
  date_start: string;
  date_end: string;
}

interface BackendDriver {
  number: number;
  name: string;
  fullName: string;
  team: string;
  teamColor: string;
  countryCode: string;
}

interface BackendLapSectors {
  sector1?: number;
  sector2?: number;
  sector3?: number;
}

interface BackendLap {
  driverNumber: number;
  lapNumber: number;
  lapTime: number | null;
  timestamp: string;
  sectors?: BackendLapSectors;
  isPitOutLap?: boolean;
}

export class ReplayDataService {
  private backendApiUrl = 'http://localhost:4000/api/v1';

  async getSessions(year: number, countryName?: string): Promise<ApiResponse<ReplaySessionData[]>> {
    if (checkShouldForceMockData()) {
      return { data: [], success: false, error: { code: 'MOCK_DISABLED', message: 'Mock data is disabled' } };
    }

    return await this.getSessionsFromBackend(year, countryName);
  }

  private async getSessionsFromBackend(year: number, countryName?: string): Promise<ApiResponse<ReplaySessionData[]>> {
    const params = new URLSearchParams();
    params.append('year', year.toString());
    if (countryName) {
      params.append('country', countryName);
    }

    const response = await axios.get(`${this.backendApiUrl}/sessions?${params.toString()}`, {
      timeout: 30000,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    // 백엔드 API 응답 형식: { success: true, data: [...] }
    if (response.data.success) {
      const sessions = this.transformBackendSessions(response.data.data);
      return {
        data: sessions,
        success: true
      };
    } else {
      throw new Error('Backend API returned unsuccessful response');
    }
  }


  async getDrivers(sessionKey: number): Promise<ApiResponse<ReplayDriverData[]>> {
    if (checkShouldForceMockData()) {
      return { data: [], success: false, error: { code: 'MOCK_DISABLED', message: 'Mock data is disabled' } };
    }

    const response = await axios.get(`${this.backendApiUrl}/sessions/${sessionKey}/drivers`, {
      timeout: 30000,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    if (response.data.success) {
      const drivers = this.transformBackendDrivers(response.data.data);
      return { data: drivers, success: true };
    } else {
      throw new Error('Backend API returned unsuccessful response');
    }
  }

  async getLaps(
    sessionKey: number,
    driverNumber?: number,
    lapNumber?: number
  ): Promise<ApiResponse<ReplayLapData[]>> {
    if (checkShouldForceMockData()) {
      return { data: [], success: false, error: { code: 'MOCK_DISABLED', message: 'Mock data is disabled' } };
    }

    const params = new URLSearchParams();
    if (driverNumber !== undefined) {
      params.append('driverNumber', driverNumber.toString());
    }
    if (lapNumber !== undefined) {
      params.append('lapNumber', lapNumber.toString());
    }

    const endpoint = `/laps/session/${sessionKey}${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await axios.get(`${this.backendApiUrl}${endpoint}`, {
      timeout: 30000,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    if (response.data.success || response.data.data) {
      const laps = this.transformBackendLaps(response.data.data);
      return { data: laps, success: true };
    } else {
      throw new Error('Backend API returned unsuccessful response');
    }
  }

  async getFullRaceData(sessionKey: number): Promise<ApiResponse<{
    drivers: ReplayDriverData[];
    laps: ReplayLapData[];
  }>> {
    try {
      // 병렬로 드라이버와 랩 데이터 가져오기
      const [driversResponse, lapsResponse] = await Promise.all([
        this.getDrivers(sessionKey),
        this.getLaps(sessionKey)
      ]);

      if (!driversResponse.success || !lapsResponse.success) {
        return {
          data: { drivers: [], laps: [] },
          success: false,
          error: {
            code: 'FETCH_RACE_DATA_ERROR',
            message: 'Failed to fetch complete race data',
            details: 'One or more data sources failed'
          }
        };
      }

      // 랩 데이터 정렬 및 정리
      const sortedLaps = this.sortAndProcessLaps(lapsResponse.data);

      return {
        data: {
          drivers: driversResponse.data,
          laps: sortedLaps
        },
        success: true
      };
    } catch (error) {
      console.error('[ReplayDataService] Error loading race data:', error);
      return {
        data: { drivers: [], laps: [] },
        success: false,
        error: {
          code: 'FETCH_RACE_DATA_ERROR',
          message: 'Failed to fetch complete race data',
          details: error
        }
      };
    }
  }

  private transformBackendSessions(backendSessions: BackendSession[]): ReplaySessionData[] {
    return backendSessions.map(session => ({
      sessionKey: session.session_key,
      sessionName: session.session_name,
      sessionType: session.session_type,
      circuitShortName: session.circuit_short_name,
      countryName: session.country_name,
      year: session.year,
      dateStart: session.date_start,
      dateEnd: session.date_end
    }));
  }

  private transformBackendDrivers(backendDrivers: BackendDriver[]): ReplayDriverData[] {
    return backendDrivers.map(driver => ({
      driverNumber: driver.number,
      name: driver.fullName,
      nameAcronym: driver.name,
      teamName: driver.team,
      teamColor: driver.teamColor,
      broadcastName: driver.fullName,
      countryCode: driver.countryCode
    }));
  }

  private transformBackendLaps(backendLaps: BackendLap[]): ReplayLapData[] {
    // 레드플래그 등으로 비정상적으로 긴 랩을 감지하기 위한 임계값 (5분 = 300초)
    // F1 어떤 서킷에서도 정상 랩타임은 300초를 초과하지 않음
    const MAX_REASONABLE_LAP_DURATION = 300;

    return backendLaps
      .filter(lap => {
        // 백엔드 데이터 구조: { lapNumber, lapTime, sectors: {sector1, sector2, sector3}, timestamp, driverNumber, ... }
        const lapTime = lap.lapTime; // 백엔드는 lapTime 사용
        const isValid = lapTime !== null && lapTime !== undefined;

        if (!isValid) {
          return false;
        }

        // 레드플래그 등으로 인한 비정상 랩타임 필터링
        if (lapTime > MAX_REASONABLE_LAP_DURATION) {
          return false;
        }

        return true;
      })
      .map(lap => {
        // 랩 시작 시간을 ISO 문자열에서 타임스탬프로 변환
        const lapStartTimestamp = new Date(lap.timestamp).getTime();

        return {
          driverNumber: lap.driverNumber,
          lapNumber: lap.lapNumber,
          lapDuration: lap.lapTime as number, // 백엔드는 lapTime 필드 사용 (filter에서 null 제거됨)
          lapStartTime: lapStartTimestamp,
          sectorTimes: [
            lap.sectors?.sector1,
            lap.sectors?.sector2,
            lap.sectors?.sector3
          ] as [number | null, number | null, number | null],
          isPitOutLap: lap.isPitOutLap || false
        };
      });
  }

  private sortAndProcessLaps(laps: ReplayLapData[]): ReplayLapData[] {
    // 드라이버별로 그룹화
    const driverLapsMap = new Map<number, ReplayLapData[]>();
    for (const lap of laps) {
      const arr = driverLapsMap.get(lap.driverNumber) ?? [];
      arr.push(lap);
      driverLapsMap.set(lap.driverNumber, arr);
    }

    // 레이스 시작 시점 결정: 모든 드라이버의 가장 작은 lap_number의 timestamp 중 최빈값
    // (2024 일본 GP 예시: 모든 드라이버 lap 1 = 05:32:00, 레드플래그 lap 2 = 05:06:xx)
    const firstLapTimestamps: number[] = [];
    for (const [, driverLaps] of driverLapsMap) {
      // 가장 작은 lapNumber를 가진 랩의 timestamp
      const minLapNum = Math.min(...driverLaps.map(l => l.lapNumber));
      const firstLap = driverLaps.find(l => l.lapNumber === minLapNum);
      if (firstLap) {
        firstLapTimestamps.push(firstLap.lapStartTime);
      }
    }
    // 가장 많은 드라이버가 공유하는 timestamp = 실제 레이스 시작 시점
    // (동일 timestamp가 없으면 10초 이내를 같은 그룹으로 봄)
    const raceStartTime = this.findMostCommonTimestamp(firstLapTimestamps);

    // 실제 타임스탬프 기반 상대 시간 변환 (드라이버 간 실제 간격 보존)
    // 누적 방식은 필터링된 랩의 실제 소요시간을 무시하여 순위가 어긋남
    const allRaceLaps: ReplayLapData[] = [];

    for (const [, driverLaps] of driverLapsMap) {
      // 레이스 시작 이전의 랩 제외 (레드플래그 이전 formation lap 등)
      const raceLaps = driverLaps.filter(l => l.lapStartTime >= raceStartTime - 60000);
      // 60초(60000ms) 여유: 동일 시점 타임스탬프의 미세 차이 허용
      for (const lap of raceLaps) {
        allRaceLaps.push(lap);
      }
    }

    // 타임스탬프를 레이스 시작 기준 상대 초로 변환
    return allRaceLaps.map(lap => ({
      ...lap,
      lapStartTime: Math.max(0, (lap.lapStartTime - raceStartTime) / 1000),
    }));
  }

  // 타임스탬프 배열에서 가장 많은 값이 밀집된 클러스터의 최솟값 반환
  private findMostCommonTimestamp(timestamps: number[]): number {
    if (timestamps.length === 0) return 0;
    if (timestamps.length === 1) return timestamps[0];

    // 10초 이내의 타임스탬프를 같은 클러스터로 묶음
    const CLUSTER_THRESHOLD = 10000; // 10초 (ms)
    const sorted = [...timestamps].sort((a, b) => a - b);

    let bestClusterStart = 0;
    let bestClusterSize = 0;

    let clusterStart = 0;
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i] - sorted[clusterStart] > CLUSTER_THRESHOLD) {
        const clusterSize = i - clusterStart;
        if (clusterSize > bestClusterSize) {
          bestClusterSize = clusterSize;
          bestClusterStart = clusterStart;
        }
        clusterStart = i;
      }
    }
    // 마지막 클러스터 확인
    const lastClusterSize = sorted.length - clusterStart;
    if (lastClusterSize > bestClusterSize) {
      bestClusterStart = clusterStart;
    }

    return sorted[bestClusterStart];
  }

  // 캐싱을 위한 메서드들
  private cache = new Map<string, { data: unknown; timestamp: number }>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5분

  private getCacheKey(method: string, params: Record<string, unknown>): string {
    return `${method}_${JSON.stringify(params)}`;
  }

  private getCachedData<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data as T;
    }
    return null;
  }

  private setCachedData(key: string, data: unknown): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  async getCachedSessions(year: number, countryName?: string): Promise<ApiResponse<ReplaySessionData[]>> {
    const cacheKey = this.getCacheKey('sessions', { year, countryName });
    const cached = this.getCachedData<ReplaySessionData[]>(cacheKey);
    
    if (cached) {
      return {
        data: cached,
        success: true
      };
    }

    const result = await this.getSessions(year, countryName);
    if (result.success) {
      this.setCachedData(cacheKey, result.data);
    }
    
    return result;
  }

}

