import axios from 'axios';
import {
  ReplaySessionData,
  ReplayDriverData,
  ReplayLapData,
  ApiResponse,
  FastF1Data,
  FastF1TelemetryPoint
} from '../types';
import { mockSessions, mockDrivers, mockLaps, checkShouldForceMockData } from '../data/mockData';

export class ReplayDataService {
  private fastF1BaseUrl = 'http://localhost:8000';

  async getSessions(year: number, countryName?: string): Promise<ApiResponse<ReplaySessionData[]>> {
    // 강제 목 데이터 사용 설정이 있으면 목 데이터 사용
    if (checkShouldForceMockData()) {
      return this.getMockSessions(year, countryName);
    }

    // FastF1 백엔드 서버는 세션 목록을 제공하지 않으므로 Mock 데이터 사용
    console.log('Using mock session data (FastF1 backend does not provide session list)');
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
    // FastF1 백엔드는 드라이버 목록을 별도로 제공하지 않으므로 Mock 데이터 사용
    console.log('Using mock driver data (FastF1 backend provides race data instead)');
    return this.getMockDrivers(sessionKey);
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
    // FastF1 백엔드는 랩 데이터를 별도로 제공하지 않으므로 Mock 데이터 사용
    console.log('Using mock lap data (FastF1 backend provides race telemetry instead)');
    return this.getMockLaps(sessionKey, driverNumber, lapNumber);
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
  async getFastF1TelemetryData(year: number, round: number, driverNumber: number): Promise<ApiResponse<FastF1Data | null>> {
    try {
      console.log(`Fetching FastF1 telemetry for ${year}/${round}/${driverNumber}... (This may take 1-2 minutes for first load)`);
      const response = await axios.get(`${this.fastF1BaseUrl}/mapbox/${year}/${round}/${driverNumber}`, {
        timeout: 120000, // 2분 타임아웃 (FastF1 첫 로드 시 시간이 오래 걸림)
        headers: {
          'Accept': 'application/json',
        }
      });

      console.log(`FastF1 telemetry data received: ${response.data.telemetry_points} points`);
      
      // 🐛 DEBUG: 백엔드 데이터 구조 확인 (좌표 변환 문제 해결용)
      if (response.data.telemetry && response.data.telemetry.length > 0) {
        const telemetryData = response.data.telemetry as FastF1TelemetryPoint[];
        const firstPoint = telemetryData[0];
        const lastPoint = telemetryData[telemetryData.length - 1];
        console.log(`🔍 Backend data validation for driver ${driverNumber}:`);
        console.log(`   - First telemetry point:`, firstPoint);
        console.log(`   - First point longitude/latitude: ${firstPoint.longitude}/${firstPoint.latitude}`);
        console.log(`   - Last point longitude/latitude: ${lastPoint.longitude}/${lastPoint.latitude}`);
        console.log(`   - Longitude range: ${Math.min(...telemetryData.map(p => p.longitude))} - ${Math.max(...telemetryData.map(p => p.longitude))}`);
        console.log(`   - Latitude range: ${Math.min(...telemetryData.map(p => p.latitude))} - ${Math.max(...telemetryData.map(p => p.latitude))}`);
      }
      
      return {
        data: response.data,
        success: true
      };
    } catch (error) {
      console.error('FastF1 API error:', error);
      return {
        data: null,
        success: false,
        error: { 
          code: 'FASTF1_FETCH_ERROR',
          message: 'Failed to fetch FastF1 telemetry data' 
        }
      };
    }
  }

  async getFastF1FullRaceData(year: number, round: number, driverNumber: number): Promise<ApiResponse<FastF1Data | null>> {
    try {
      console.log(`Fetching FastF1 full race telemetry for ${year}/${round}/${driverNumber}... (This may take 2-5 minutes)`);
      const response = await axios.get(`${this.fastF1BaseUrl}/mapbox/${year}/${round}/${driverNumber}/full-race`, {
        timeout: 300000, // 5분 타임아웃 (전체 레이스 데이터는 더 오래 걸림)
        headers: {
          'Accept': 'application/json',
        }
      });

      console.log(`FastF1 full race telemetry data received: ${response.data.telemetry_points} points`);
      
      // 🐛 DEBUG: 백엔드 전체 레이스 데이터 구조 확인 (좌표 변환 문제 해결용)
      if (response.data.telemetry && response.data.telemetry.length > 0) {
        const telemetryData = response.data.telemetry as FastF1TelemetryPoint[];
        const firstPoint = telemetryData[0];
        const lastPoint = telemetryData[telemetryData.length - 1];
        console.log(`🔍 Backend FULL RACE data validation for driver ${driverNumber}:`);
        console.log(`   - First telemetry point:`, firstPoint);
        console.log(`   - First point longitude/latitude: ${firstPoint.longitude}/${firstPoint.latitude}`);
        console.log(`   - Last point longitude/latitude: ${lastPoint.longitude}/${lastPoint.latitude}`);
        console.log(`   - Longitude range: ${Math.min(...telemetryData.map(p => p.longitude))} - ${Math.max(...telemetryData.map(p => p.longitude))}`);
        console.log(`   - Latitude range: ${Math.min(...telemetryData.map(p => p.latitude))} - ${Math.max(...telemetryData.map(p => p.latitude))}`);
        
        // 좌표가 undefined나 null인 포인트 개수 확인
        const invalidLongitudeCount = telemetryData.filter(p => p.longitude == null || isNaN(p.longitude)).length;
        const invalidLatitudeCount = telemetryData.filter(p => p.latitude == null || isNaN(p.latitude)).length;
        console.log(`   - Invalid coordinates: longitude=${invalidLongitudeCount}, latitude=${invalidLatitudeCount} out of ${telemetryData.length} points`);
      }
      
      return {
        data: response.data,
        success: true
      };
    } catch (error) {
      console.error('FastF1 full race API error:', error);
      return {
        data: null,
        success: false,
        error: { 
          code: 'FASTF1_FULL_RACE_FETCH_ERROR',
          message: 'Failed to fetch FastF1 full race data' 
        }
      };
    }
  }

  // FastF1 텔레메트리에서 리플레이용 데이터 변환
  convertFastF1ToReplayData(fastF1Data: FastF1Data): {
    drivers: ReplayDriverData[],
    laps: ReplayLapData[],
    telemetryPoints: FastF1TelemetryPoint[]
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

  private generateLapsFromTelemetry(driverNumber: number, telemetryPoints: FastF1TelemetryPoint[]): ReplayLapData[] {
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
      'Ferrari': 'E80020',
      'Mercedes': '27F4D2',
      'McLaren': 'FF8000',
      'Aston Martin': '229971',
      'Alpine': '0093cc',
      'Williams': '64C4FF',
      'RB': '6692FF',                    // 2024년 RB (구 AlphaTauri)
      'Kick Sauber': '52e252',          // 2024년 Kick Sauber (구 Alfa Romeo)
      'Haas F1 Team': 'B6BABD',        // 정확한 팀명
      'Haas': 'B6BABD'                 // 예비 매핑
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

  // 2024년 F1 드라이버 번호 목록
  private static readonly F1_2024_DRIVER_NUMBERS = [
    1,   // Max Verstappen (Red Bull)
    2,   // Logan Sargeant (Williams)
    3,   // Daniel Ricciardo (RB)
    4,   // Lando Norris (McLaren)
    10,  // Pierre Gasly (Alpine)
    11,  // Sergio Perez (Red Bull)
    14,  // Fernando Alonso (Aston Martin)
    16,  // Charles Leclerc (Ferrari)
    18,  // Lance Stroll (Aston Martin)
    20,  // Kevin Magnussen (Haas)
    22,  // Yuki Tsunoda (RB)
    23,  // Alexander Albon (Williams)
    24,  // Zhou Guanyu (Kick Sauber)
    27,  // Nico Hulkenberg (Haas)
    31,  // Esteban Ocon (Alpine)
    44,  // Lewis Hamilton (Mercedes)
    55,  // Carlos Sainz (Ferrari)
    63,  // George Russell (Mercedes)
    77,  // Valtteri Bottas (Kick Sauber)
    81,  // Oscar Piastri (McLaren)
  ];

  // 2024 F1 드라이버 번호들 반환
  getF1DriverNumbers(): number[] {
    return [...ReplayDataService.F1_2024_DRIVER_NUMBERS];
  }

  // 다중 드라이버 FastF1 텔레메트리 데이터 로딩
  async getFastF1MultiDriverData(year: number, round: number, driverNumbers?: number[]): Promise<ApiResponse<FastF1Data[]>> {
    try {
      const driversToLoad = driverNumbers || ReplayDataService.F1_2024_DRIVER_NUMBERS;
      
      // 병렬로 모든 드라이버의 전체 레이스 데이터 로딩
      const driverPromises = driversToLoad.map(async (driverNumber) => {
        try {
          const response = await this.getFastF1FullRaceData(year, round, driverNumber);
          return {
            driverNumber,
            success: response.success,
            data: response.data
          };
        } catch {
          return {
            driverNumber,
            success: false,
            data: null
          };
        }
      });

      const results = await Promise.all(driverPromises);
      
      // 성공한 드라이버 데이터만 필터링
      const successfulDrivers = results
        .filter(result => result.success && result.data)
        .map(result => result.data!);

      const failedDrivers = results
        .filter(result => !result.success)
        .map(result => result.driverNumber);

      // 에러가 있을 때만 로그 출력
      if (failedDrivers.length > 0) {
        console.warn(`⚠️ Failed to load ${failedDrivers.length} drivers: [${failedDrivers.join(', ')}]`);
      }

      return {
        data: successfulDrivers,
        success: successfulDrivers.length > 0,
        error: successfulDrivers.length === 0 ? {
          code: 'NO_DRIVER_DATA',
          message: 'Failed to load any driver data'
        } : undefined
      };

    } catch (error) {
      console.error('❌ Error loading multi-driver FastF1 data:', error);
      return {
        data: [],
        success: false,
        error: {
          code: 'MULTI_DRIVER_LOAD_ERROR',
          message: 'Failed to load multi-driver FastF1 data',
          details: error
        }
      };
    }
  }

  // 다중 드라이버 데이터를 리플레이용 데이터로 변환
  convertMultipleFastF1ToReplayData(fastF1DataArray: FastF1Data[]): {
    drivers: ReplayDriverData[],
    laps: ReplayLapData[],
    telemetryPoints: { [driverNumber: number]: FastF1TelemetryPoint[] }
  } {
    const allDrivers: ReplayDriverData[] = [];
    const allLaps: ReplayLapData[] = [];
    const allTelemetryPoints: { [driverNumber: number]: FastF1TelemetryPoint[] } = {};

    fastF1DataArray.forEach(fastF1Data => {
      const converted = this.convertFastF1ToReplayData(fastF1Data);
      
      allDrivers.push(...converted.drivers);
      allLaps.push(...converted.laps);
      
      // 각 드라이버별 텔레메트리 포인트 저장
      if (converted.drivers.length > 0) {
        const driverNumber = converted.drivers[0].driverNumber;
        allTelemetryPoints[driverNumber] = converted.telemetryPoints;
      }
    });

    return {
      drivers: allDrivers,
      laps: allLaps,
      telemetryPoints: allTelemetryPoints
    };
  }
}

