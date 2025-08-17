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
import { mockSessions, mockDrivers, mockLaps, shouldForceMockData } from '../data/mockData';

export class ReplayDataService {
  private fastF1BaseUrl = 'http://localhost:8000';
  private openF1BaseUrl = 'https://api.openf1.org/v1';

  async getSessions(year: number, countryName?: string): Promise<ApiResponse<ReplaySessionData[]>> {
    // 강제 목 데이터 사용 설정이 있으면 목 데이터 사용
    if (shouldForceMockData()) {
      return this.getMockSessions(year, countryName);
    }

    // FastF1 API 먼저 시도
    try {
      console.log('Attempting to fetch sessions from FastF1 API...');
      return await this.getSessionsFromFastF1(year, countryName);
    } catch (fastF1Error) {
      console.warn('FastF1 API failed, trying OpenF1 API:', fastF1Error);
      
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
            'Accept': 'application/json',
            'User-Agent': 'F1-Global-Tour/1.0'
          }
        });
        const sessions = this.transformSessions(response.data);

        console.log(`Successfully fetched ${sessions.length} sessions from OpenF1 API`);
        return {
          data: sessions,
          success: true
        };
      } catch (openF1Error) {
        console.warn('Both APIs failed, falling back to mock data:', openF1Error);
        return this.getMockSessions(year, countryName);
      }
    }
  }

  private async getSessionsFromFastF1(year: number, countryName?: string): Promise<ApiResponse<ReplaySessionData[]>> {
    // FastF1 API는 아직 세션 목록 엔드포인트가 없을 수 있으니 Mock 데이터 반환
    console.log('FastF1 API sessions endpoint not implemented yet, using mock data');
    return this.getMockSessions(year, countryName);
  }

  private getMockSessions(year: number, countryName?: string): Promise<ApiResponse<ReplaySessionData[]>> {
    console.log('Using mock session data');
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
    if (shouldForceMockData()) {
      return this.getMockDrivers(sessionKey);
    }

    try {
      console.log('Attempting to fetch drivers from OpenF1 API for session:', sessionKey);
      const response = await axios.get(`${this.baseUrl}/drivers?session_key=${sessionKey}`, {
        timeout: 10000,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'F1-Global-Tour/1.0'
        }
      });
      const drivers = this.transformDrivers(response.data);

      console.log(`Successfully fetched ${drivers.length} drivers from OpenF1 API`);
      return {
        data: drivers,
        success: true
      };
    } catch (error) {
      console.warn('Failed to fetch drivers from OpenF1 API, falling back to mock data:', error);
      return this.getMockDrivers(sessionKey);
    }
  }

  private getMockDrivers(sessionKey: number): Promise<ApiResponse<ReplayDriverData[]>> {
    console.log('Using mock driver data for session:', sessionKey);
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
    if (shouldForceMockData()) {
      return this.getMockLaps(sessionKey, driverNumber, lapNumber);
    }

    try {
      const params = new URLSearchParams();
      params.append('session_key', sessionKey.toString());
      
      if (driverNumber !== undefined) {
        params.append('driver_number', driverNumber.toString());
      }
      
      if (lapNumber !== undefined) {
        params.append('lap_number', lapNumber.toString());
      }

      console.log('Attempting to fetch laps from OpenF1 API for session:', sessionKey);
      const response = await axios.get(`${this.baseUrl}/laps?${params.toString()}`, {
        timeout: 10000,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'F1-Global-Tour/1.0'
        }
      });
      const laps = this.transformLaps(response.data);

      console.log(`Successfully fetched ${laps.length} laps from OpenF1 API`);
      return {
        data: laps,
        success: true
      };
    } catch (error) {
      console.warn('Failed to fetch laps from OpenF1 API, falling back to mock data:', error);
      return this.getMockLaps(sessionKey, driverNumber, lapNumber);
    }
  }

  private getMockLaps(
    sessionKey: number, 
    driverNumber?: number, 
    lapNumber?: number
  ): Promise<ApiResponse<ReplayLapData[]>> {
    console.log('Using mock lap data for session:', sessionKey, 'driver:', driverNumber, 'lap:', lapNumber);
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
      // 병렬로 드라이버와 랩 데이터 가져오기
      const [driversResponse, lapsResponse] = await Promise.all([
        this.getDrivers(sessionKey),
        this.getLaps(sessionKey)
      ]);

      if (!driversResponse.success || !lapsResponse.success) {
        throw new Error('Failed to fetch complete race data');
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
      console.error('Error fetching full race data:', error);
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

  // FastF1 API 지원 메서드들
  async getFastF1TelemetryData(year: number, round: number, driverNumber: number): Promise<ApiResponse<any>> {
    try {
      console.log(`Fetching FastF1 telemetry for ${year}/${round}/${driverNumber}... (This may take 1-2 minutes for first load)`);
      const response = await axios.get(`${this.fastF1BaseUrl}/mapbox/${year}/${round}/${driverNumber}`, {
        timeout: 120000, // 2분 타임아웃 (FastF1 첫 로드 시 시간이 오래 걸림)
        headers: {
          'Accept': 'application/json',
        }
      });

      console.log(`FastF1 telemetry data received: ${response.data.telemetry_points} points`);
      return {
        data: response.data,
        success: true
      };
    } catch (error) {
      console.error('FastF1 API error:', error);
      return {
        data: null,
        success: false,
        error: { message: 'Failed to fetch FastF1 telemetry data' }
      };
    }
  }

  // FastF1 텔레메트리에서 리플레이용 데이터 변환
  convertFastF1ToReplayData(fastF1Data: any): {
    drivers: ReplayDriverData[],
    laps: ReplayLapData[],
    telemetryPoints: any[]
  } {
    if (!fastF1Data) {
      return { drivers: [], laps: [], telemetryPoints: [] };
    }

    // 드라이버 정보 생성
    const driver: ReplayDriverData = {
      driverNumber: fastF1Data.driver_number,
      name: fastF1Data.full_name,
      nameAcronym: fastF1Data.driver,
      teamName: fastF1Data.team,
      teamColor: this.getTeamColor(fastF1Data.team),
      broadcastName: fastF1Data.full_name,
      countryCode: this.getCountryCode(fastF1Data.driver)
    };

    // 텔레메트리 포인트에서 랩 데이터 생성
    const telemetryPoints = fastF1Data.telemetry || [];
    const laps = this.generateLapsFromTelemetry(driver.driverNumber, telemetryPoints);

    return {
      drivers: [driver],
      laps,
      telemetryPoints
    };
  }

  private generateLapsFromTelemetry(driverNumber: number, telemetryPoints: any[]): ReplayLapData[] {
    if (!telemetryPoints.length) return [];

    const laps: ReplayLapData[] = [];
    const lapDuration = 90; // 평균 랩 타임 90초
    const startTime = telemetryPoints[0].time;
    const endTime = telemetryPoints[telemetryPoints.length - 1].time;
    const totalDuration = endTime - startTime;
    const lapCount = Math.ceil(totalDuration / lapDuration);

    for (let lapNumber = 1; lapNumber <= Math.min(lapCount, 10); lapNumber++) {
      const lapStartTime = (lapNumber - 1) * lapDuration;
      const currentLapDuration = lapDuration + (Math.random() - 0.5) * 10; // ±5초 변화

      laps.push({
        driverNumber,
        lapNumber,
        lapDuration: currentLapDuration,
        lapStartTime,
        sectorTimes: [
          currentLapDuration * 0.33,
          currentLapDuration * 0.33,
          currentLapDuration * 0.34
        ],
        isPitOutLap: lapNumber === 1
      });
    }

    return laps;
  }

  private getTeamColor(teamName: string): string {
    const teamColors: Record<string, string> = {
      'Red Bull Racing': '3671C6',
      'Ferrari': 'E8002D',
      'Mercedes': '27F4D2',
      'McLaren': 'FF8000',
      'Aston Martin': '229971',
      'Alpine': '2293D1',
      'Williams': '64C4FF',
      'AlphaTauri': '5E8FAA',
      'Alfa Romeo': 'C92D4B',
      'Haas': 'B6BABD'
    };
    return teamColors[teamName] || 'FFFFFF';
  }

  private getCountryCode(driver: string): string {
    const driverCountries: Record<string, string> = {
      'VER': 'NLD',
      'PER': 'MEX',
      'LEC': 'MCO',
      'SAI': 'ESP',
      'HAM': 'GBR',
      'RUS': 'GBR',
      'NOR': 'GBR',
      'PIA': 'AUS'
    };
    return driverCountries[driver] || 'UNK';
  }
}

// 싱글톤 인스턴스
export const replayDataService = new ReplayDataService();