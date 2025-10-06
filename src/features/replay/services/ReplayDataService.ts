import axios from 'axios';
import {
  OpenF1Session,
  OpenF1Driver,
  OpenF1Lap,
  ReplaySessionData,
  ReplayDriverData,
  ReplayLapData,
  ApiResponse
} from '../types';
import { mockSessions, mockDrivers, mockLaps, checkShouldForceMockData } from '../data/mockData';

export class ReplayDataService {
  private openF1BaseUrl = 'https://api.openf1.org/v1';
  private backendApiUrl = 'http://localhost:4000/api/v1';

  async getSessions(year: number, countryName?: string): Promise<ApiResponse<ReplaySessionData[]>> {
    // 강제 목 데이터 사용 설정이 있으면 목 데이터 사용
    if (checkShouldForceMockData()) {
      return this.getMockSessions(year, countryName);
    }

    // 백엔드 API 먼저 시도
    try {
      return await this.getSessionsFromBackend(year, countryName);
    } catch (backendError) {

      // OpenF1 API로 fallback
      try {
        const params = new URLSearchParams();
        params.append('year', year.toString());
        if (countryName) {
          params.append('country_name', countryName);
        }

        const response = await axios.get(`${this.openF1BaseUrl}/sessions?${params.toString()}`, {
          timeout: 10000,
          headers: {
            'Accept': 'application/json'
          }
        });
        const sessions = this.transformSessions(response.data);

        return {
          data: sessions,
          success: true
        };
      } catch (openF1Error) {
        return this.getMockSessions(year, countryName);
      }
    }
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


  private getMockSessions(year: number, countryName?: string): Promise<ApiResponse<ReplaySessionData[]>> {
    return new Promise((resolve) => {
      setTimeout(() => {
        let filteredSessions = mockSessions.filter(session => session.year === year);
        
        if (countryName) {
          filteredSessions = filteredSessions.filter(session => 
            session.countryName.toLowerCase().includes(countryName.toLowerCase())
          );
        }
        
        resolve({
          data: filteredSessions,
          success: true
        });
      }, 500); // 실제 API 호출을 시뮬레이션하기 위한 지연
    });
  }

  async getDrivers(sessionKey: number): Promise<ApiResponse<ReplayDriverData[]>> {
    // 강제 목 데이터 사용 설정이 있으면 목 데이터 사용
    if (checkShouldForceMockData()) {
      return this.getMockDrivers(sessionKey);
    }

    // 백엔드 API 먼저 시도
    try {
      const response = await axios.get(`${this.backendApiUrl}/sessions/${sessionKey}/drivers`, {
        timeout: 30000,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        const drivers = this.transformBackendDrivers(response.data.data);
        return {
          data: drivers,
          success: true
        };
      } else {
        throw new Error('Backend API returned unsuccessful response');
      }
    } catch (backendError) {

      // OpenF1 API로 fallback
      try {
        const response = await axios.get(`${this.openF1BaseUrl}/drivers?session_key=${sessionKey}`, {
          timeout: 10000,
          headers: {
            'Accept': 'application/json'
          }
        });
        const drivers = this.transformDrivers(response.data);

        return {
          data: drivers,
          success: true
        };
      } catch (openF1Error) {
        return this.getMockDrivers(sessionKey);
      }
    }
  }

  private getMockDrivers(sessionKey: number): Promise<ApiResponse<ReplayDriverData[]>> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          data: mockDrivers,
          success: true
        });
      }, 300);
    });
  }

  async getLaps(
    sessionKey: number,
    driverNumber?: number,
    lapNumber?: number
  ): Promise<ApiResponse<ReplayLapData[]>> {
    // 강제 목 데이터 사용 설정이 있으면 목 데이터 사용
    if (checkShouldForceMockData()) {
      return this.getMockLaps(sessionKey, driverNumber, lapNumber);
    }

    // 백엔드 API 먼저 시도
    try {
      const params = new URLSearchParams();
      if (driverNumber !== undefined) {
        params.append('driverNumber', driverNumber.toString());
      }
      if (lapNumber !== undefined) {
        params.append('lapNumber', lapNumber.toString());
      }

      const endpoint = `/laps/session/${sessionKey}${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await axios.get(`${this.backendApiUrl}${endpoint}`, {
        timeout: 30000, // 대량의 lap 데이터를 위해 30초로 증가
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success || response.data.data) {
        const laps = this.transformBackendLaps(response.data.data);
        console.log('✅ [ReplayDataService] Laps loaded from backend:', laps.length);
        return {
          data: laps,
          success: true
        };
      } else {
        throw new Error('Backend API returned unsuccessful response');
      }
    } catch (backendError) {
      console.warn('⚠️ [ReplayDataService] Backend laps API failed, trying OpenF1:', backendError);

      // OpenF1 API로 fallback
      try {
        const params = new URLSearchParams();
        params.append('session_key', sessionKey.toString());

        if (driverNumber !== undefined) {
          params.append('driver_number', driverNumber.toString());
        }

        if (lapNumber !== undefined) {
          params.append('lap_number', lapNumber.toString());
        }

        const response = await axios.get(`${this.openF1BaseUrl}/laps?${params.toString()}`, {
          timeout: 10000,
          headers: {
            'Accept': 'application/json'
          }
        });
        const laps = this.transformLaps(response.data);
        console.log('✅ [ReplayDataService] Laps loaded from OpenF1:', laps.length);

        return {
          data: laps,
          success: true
        };
      } catch (openF1Error) {
        console.warn('⚠️ [ReplayDataService] OpenF1 laps API also failed, using mock data');
        return this.getMockLaps(sessionKey, driverNumber, lapNumber);
      }
    }
  }

  private getMockLaps(
    sessionKey: number, 
    driverNumber?: number, 
    lapNumber?: number
  ): Promise<ApiResponse<ReplayLapData[]>> {
    return new Promise((resolve) => {
      setTimeout(() => {
        let filteredLaps = mockLaps;
        
        if (driverNumber !== undefined) {
          filteredLaps = filteredLaps.filter(lap => lap.driverNumber === driverNumber);
        }
        
        if (lapNumber !== undefined) {
          filteredLaps = filteredLaps.filter(lap => lap.lapNumber === lapNumber);
        }
        
        resolve({
          data: filteredLaps,
          success: true
        });
      }, 400);
    });
  }

  async getFullRaceData(sessionKey: number): Promise<ApiResponse<{
    drivers: ReplayDriverData[];
    laps: ReplayLapData[];
  }>> {
    try {
      console.log('🚀 [ReplayDataService] Loading full race data for session:', sessionKey);

      // 병렬로 드라이버와 랩 데이터 가져오기
      const [driversResponse, lapsResponse] = await Promise.all([
        this.getDrivers(sessionKey),
        this.getLaps(sessionKey)
      ]);

      console.log('🎯 [ReplayDataService] Drivers response:', {
        success: driversResponse.success,
        driversCount: driversResponse.data?.length || 0,
        firstDriver: driversResponse.data?.[0]
      });

      console.log('🎯 [ReplayDataService] Laps response:', {
        success: lapsResponse.success,
        lapsCount: lapsResponse.data?.length || 0
      });

      if (!driversResponse.success || !lapsResponse.success) {
        console.error('🔴 [ReplayDataService] Failed to fetch race data:', {
          driversSuccess: driversResponse.success,
          lapsSuccess: lapsResponse.success
        });

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

      console.log('✅ [ReplayDataService] Race data loaded successfully:', {
        driversCount: driversResponse.data.length,
        lapsCount: sortedLaps.length
      });

      return {
        data: {
          drivers: driversResponse.data,
          laps: sortedLaps
        },
        success: true
      };
    } catch (error) {
      console.error('🔴 [ReplayDataService] Error loading race data:', error);
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

  private transformBackendSessions(backendSessions: any[]): ReplaySessionData[] {
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

  private transformSessions(openF1Sessions: OpenF1Session[]): ReplaySessionData[] {
    return openF1Sessions.map(session => ({
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

  private transformBackendDrivers(backendDrivers: any[]): ReplayDriverData[] {
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

  private transformDrivers(openF1Drivers: OpenF1Driver[]): ReplayDriverData[] {
    return openF1Drivers.map(driver => ({
      driverNumber: driver.driver_number,
      name: driver.full_name,
      nameAcronym: driver.name_acronym,
      teamName: driver.team_name,
      teamColor: driver.team_colour,
      broadcastName: driver.broadcast_name,
      countryCode: driver.country_code
    }));
  }

  private transformBackendLaps(backendLaps: any[]): ReplayLapData[] {
    console.log('🔍 [ReplayDataService] Transforming backend laps:', {
      totalLaps: backendLaps.length,
      sampleLap: backendLaps[0]
    });

    return backendLaps
      .filter(lap => {
        // 백엔드 데이터 구조: { lapNumber, lapTime, sectors: {sector1, sector2, sector3}, timestamp, driverNumber, ... }
        const lapTime = lap.lapTime; // 백엔드는 lapTime 사용
        const isValid = lapTime !== null && lapTime !== undefined;

        if (!isValid) {
          console.log('⚠️ [ReplayDataService] Filtering out invalid lap:', lap);
        }

        return isValid;
      })
      .map(lap => {
        // 랩 시작 시간을 ISO 문자열에서 타임스탬프로 변환
        const lapStartTimestamp = new Date(lap.timestamp).getTime();

        return {
          driverNumber: lap.driverNumber,
          lapNumber: lap.lapNumber,
          lapDuration: lap.lapTime, // 백엔드는 lapTime 필드 사용
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

  private transformLaps(openF1Laps: OpenF1Lap[]): ReplayLapData[] {
    return openF1Laps
      .filter(lap => lap.lap_duration !== null) // 유효한 랩타임만 필터링
      .map(lap => {
        // 랩 시작 시간을 ISO 문자열에서 타임스탬프로 변환
        const lapStartTimestamp = new Date(lap.date_start).getTime();
        
        return {
          driverNumber: lap.driver_number,
          lapNumber: lap.lap_number,
          lapDuration: lap.lap_duration || 0,
          lapStartTime: lapStartTimestamp,
          sectorTimes: [
            lap.duration_sector_1,
            lap.duration_sector_2,
            lap.duration_sector_3
          ] as [number | null, number | null, number | null],
          isPitOutLap: lap.is_pit_out_lap
        };
      });
  }

  private sortAndProcessLaps(laps: ReplayLapData[]): ReplayLapData[] {
    // 드라이버별, 랩 번호별로 정렬
    const sortedLaps = laps.sort((a, b) => {
      if (a.driverNumber !== b.driverNumber) {
        return a.driverNumber - b.driverNumber;
      }
      return a.lapNumber - b.lapNumber;
    });

    // 각 드라이버별로 상대적인 랩 시작 시간 계산
    const processedLaps: ReplayLapData[] = [];
    const driverFirstLapTimes = new Map<number, number>();

    // 각 드라이버의 첫 번째 랩 시작 시간 찾기
    sortedLaps.forEach(lap => {
      if (!driverFirstLapTimes.has(lap.driverNumber)) {
        driverFirstLapTimes.set(lap.driverNumber, lap.lapStartTime);
      }
    });

    // 레이스 시작 시간 (가장 빠른 첫 랩 시작 시간)
    const raceStartTime = Math.min(...Array.from(driverFirstLapTimes.values()));

    // 상대적 시간으로 변환
    sortedLaps.forEach(lap => {
      const relativeStartTime = (lap.lapStartTime - raceStartTime) / 1000; // 밀리초를 초로 변환
      
      processedLaps.push({
        ...lap,
        lapStartTime: Math.max(0, relativeStartTime) // 음수 방지
      });
    });

    return processedLaps;
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

  clearCache(): void {
    this.cache.clear();
  }

  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

}

