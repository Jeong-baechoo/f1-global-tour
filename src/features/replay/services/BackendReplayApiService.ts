import axios, { AxiosResponse, AxiosError } from 'axios';
import { OpenF1Interval, OpenF1Lap, OpenF1Driver, RealtimeDriverData } from '../types/openF1Types';
import { DriverTiming } from '@/src/features/replay/components/ui';
import type { FlagStatus } from '@/src/features/replay/components/ui';
import type { RaceStatus } from '../types';
import { OpenF1MockDataService } from './OpenF1MockDataService';

// 백엔드 API 응답 형식 (실제 NestJS API 응답 구조)
interface BackendApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

// 백엔드 API 에러 응답 형식
interface BackendApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  timestamp: string;
}

// 환경 설정 타입
interface BackendConfig {
  baseUrl: string;
  timeout: number;
  maxRetries: number;
  fallbackEnabled: boolean;
}

export class BackendReplayApiService {
  private static instance: BackendReplayApiService;
  private config: BackendConfig;
  private currentLap: number = 1;
  private maxLaps: number = 58;
  private sessionKey: number = 9472;
  private isApiAvailable: boolean = true;
  private fallbackService: OpenF1MockDataService;
  private retryCount: number = 0;
  private lastHealthCheck: number = 0;
  private healthCheckInterval: number = 30000; // 30초마다 헬스 체크

  // 클라이언트 측 캐싱 (API 요청용)
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private cacheExpiry: number = 60000; // 60초 캐시 유효기간

  // 세션별 전체 데이터 캐싱 (세션당 한 번만 로드)
  private sessionDataCache: Map<number, {
    intervals: any[];
    laps: any[];
    drivers: any[];
    loadedAt: number;
  }> = new Map();

  static getInstance(): BackendReplayApiService {
    if (!BackendReplayApiService.instance) {
      BackendReplayApiService.instance = new BackendReplayApiService();
    }
    return BackendReplayApiService.instance;
  }

  constructor() {
    // 기본 설정
    this.config = {
      baseUrl: 'http://localhost:4000/api/v1',
      timeout: 30000, // 10초 → 30초로 증가 (대용량 데이터 처리)
      maxRetries: 3,
      fallbackEnabled: true
    };

    // Fallback Mock 서비스 초기화
    this.fallbackService = OpenF1MockDataService.getInstance();

    // 백그라운드에서 초기 헬스 체크 (블로킹하지 않음)
    this.performHealthCheck().catch(() => {
      console.log('🔄 [Backend API] Initial health check skipped, will try actual API calls');
    });
  }

  // ===============================
  // 헬스 체크 및 Fallback 관리
  // ===============================

  private async performHealthCheck(): Promise<void> {
    const now = Date.now();

    // 마지막 헬스 체크에서 충분한 시간이 지났을 때만 체크
    if (now - this.lastHealthCheck < this.healthCheckInterval) {
      return;
    }

    this.lastHealthCheck = now;

    try {
      await axios.get(`${this.config.baseUrl}/health`, {
        timeout: 5000
      });
      this.isApiAvailable = true;
      this.retryCount = 0;
      console.log('✅ [Backend API] Health check passed');
    } catch (error) {
      this.isApiAvailable = false;
      console.warn('❌ [Backend API] Health check failed:', error);
    }
  }

  private async makeApiRequest<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    const url = `${this.config.baseUrl}${endpoint}`;
    const queryParams = params ? new URLSearchParams(params).toString() : '';
    const fullUrl = queryParams ? `${url}?${queryParams}` : url;

    // 캐시 키 생성
    const cacheKey = fullUrl;
    const now = Date.now();

    // 캐시 확인
    const cached = this.cache.get(cacheKey);
    if (cached && (now - cached.timestamp) < this.cacheExpiry) {
      console.log(`💾 [Backend API] Using cached data for ${endpoint}`);
      return cached.data;
    }

    try {
      const response: AxiosResponse<BackendApiResponse<T>> = await axios.get(fullUrl, {
        timeout: this.config.timeout,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      // 백엔드 응답이 성공인지 확인
      if (!response.data.success) {
        throw new Error(`Backend API returned success: false`);
      }

      this.isApiAvailable = true;
      this.retryCount = 0;

      // 캐시에 저장
      this.cache.set(cacheKey, { data: response.data.data, timestamp: now });

      return response.data.data;
    } catch (error) {
      this.handleApiError(error, endpoint);
      throw error;
    }
  }

  private handleApiError(error: unknown, endpoint: string): void {
    this.retryCount++;
    
    if (this.retryCount >= this.config.maxRetries) {
      this.isApiAvailable = false;
    }
    
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<BackendApiError>;
      if (axiosError.response?.data?.error) {
      }
    }
    
  }

  // ===============================
  // OpenF1MockDataService 호환 인터페이스
  // ===============================

  // 세션 설정
  setSession(sessionKey: number): void {
    this.sessionKey = sessionKey;
    this.fallbackService.setSession(sessionKey);

    // 세션 변경 시 전체 데이터 로드 (백그라운드)
    this.loadSessionData(sessionKey).catch(error => {
      console.warn('⚠️ [Backend API] Failed to preload session data:', error);
    });
  }

  // 세션 전체 데이터 로드 (한 번만 실행)
  private async loadSessionData(sessionKey: number): Promise<void> {
    // 이미 캐시된 데이터가 있으면 스킵
    if (this.sessionDataCache.has(sessionKey)) {
      console.log('💾 [Backend API] Session data already cached for session', sessionKey);
      return;
    }

    console.log('📥 [Backend API] Loading full session data for session', sessionKey);

    try {
      // 모든 데이터를 병렬로 가져오기
      const [backendIntervals, backendLaps, backendDrivers] = await Promise.all([
        this.makeApiRequest<any[]>(`/intervals/session/${sessionKey}`),
        this.makeApiRequest<any[]>(`/laps/session/${sessionKey}`),
        this.makeApiRequest<any[]>(`/sessions/${sessionKey}/drivers`)
      ]);

      // 캐시에 저장
      this.sessionDataCache.set(sessionKey, {
        intervals: backendIntervals,
        laps: backendLaps,
        drivers: backendDrivers,
        loadedAt: Date.now()
      });

      console.log('✅ [Backend API] Session data cached:', {
        intervals: backendIntervals.length,
        laps: backendLaps.length,
        drivers: backendDrivers.length,
        sessionKey
      });
    } catch (error) {
      console.error('❌ [Backend API] Failed to load session data:', error);
      throw error;
    }
  }

  setCurrentLap(lap: number): void {
    this.currentLap = Math.max(1, Math.min(lap, this.maxLaps));
    this.fallbackService.setCurrentLap(lap);
  }

  getCurrentLap(): number {
    return this.currentLap;
  }

  // 실시간 드라이버 데이터 생성 (백엔드 API 기반)
  async generateRealtimeDriverData(): Promise<RealtimeDriverData[]> {
    try {
      // 백엔드 API를 통해 드라이버 타이밍 정보 가져오기
      const timings = await this.getDriverTimings(this.sessionKey);
      
      // DriverTiming을 RealtimeDriverData로 변환
      return this.convertDriverTimingsToRealtimeData(timings);
    } catch (error) {
      return this.fallbackService.generateRealtimeDriverData();
    }
  }

  // DriverTiming 형식으로 변환 (핵심 메서드)
  async convertToDriverTimings(): Promise<DriverTiming[]> {
    try {
      return await this.getDriverTimings(this.sessionKey);
    } catch (error) {
      return this.fallbackService.convertToDriverTimings();
    }
  }

  // ===============================
  // 실시간 업데이트 시스템 (4초 간격)
  // ===============================

  private intervalTimer: NodeJS.Timeout | null = null;
  private intervalCallbacks: ((timings: DriverTiming[]) => void)[] = [];
  
  // 4초마다 업데이트되는 실시간 구독 시작
  startRealtimeUpdates(callback: (timings: DriverTiming[]) => void): void {
    this.intervalCallbacks.push(callback);
    
    if (this.intervalCallbacks.length === 1 && !this.intervalTimer) {
      
      // 즉시 한 번 실행
      this.updateTimings();
      
      // 4초마다 업데이트
      this.intervalTimer = setInterval(() => {
        this.updateTimings();
      }, 4000);
    }
  }
  
  // 실시간 구독 중지
  stopRealtimeUpdates(callback?: (timings: DriverTiming[]) => void): void {
    if (callback) {
      this.intervalCallbacks = this.intervalCallbacks.filter(cb => cb !== callback);
    } else {
      this.intervalCallbacks = [];
    }
    
    if (this.intervalCallbacks.length === 0 && this.intervalTimer) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = null;
    }
  }

  // 타이밍 업데이트 실행
  private async updateTimings(): Promise<void> {
    try {
      const timings = await this.convertToDriverTimings();
      this.intervalCallbacks.forEach(callback => callback(timings));
    } catch (error) {
      // 백엔드 실패 시 fallback 서비스 사용
      try {
        const fallbackTimings = this.fallbackService.convertToDriverTimings();
        this.intervalCallbacks.forEach(callback => callback(fallbackTimings));
      } catch (fallbackError) {
        this.intervalCallbacks.forEach(callback => callback([]));
      }
    }
  }

  // ===============================
  // 백엔드 API 호출 메서드들
  // ===============================

  // 드라이버 타이밍 데이터 가져오기 (캐시된 전체 데이터 활용)
  async getDriverTimings(sessionKey: number, date?: string): Promise<DriverTiming[]> {
    try {
      // 캐시된 세션 데이터가 없으면 로드
      if (!this.sessionDataCache.has(sessionKey)) {
        console.log('📥 [Backend API] No cached data, loading session data first...');
        await this.loadSessionData(sessionKey);
      }

      const cachedData = this.sessionDataCache.get(sessionKey);
      if (!cachedData) {
        throw new Error('Failed to load session data');
      }

      console.log(`🔍 [Backend API] Using cached session data (current lap: ${this.currentLap})`);

      console.log('🔄 [Backend API] Converting cached data to OpenF1 format...');

      // 전체 데이터를 OpenF1 형식으로 변환
      const allIntervals = cachedData.intervals.map(interval => this.convertBackendToOpenF1Interval(interval));
      const allLaps = cachedData.laps.map(lap => this.convertBackendToOpenF1Lap(lap));
      const drivers = cachedData.drivers.map(driver => this.convertBackendToOpenF1Driver(driver));

      console.log('📊 [Backend API] Converted data:', {
        totalIntervals: allIntervals.length,
        totalLaps: allLaps.length,
        totalDrivers: drivers.length,
        sampleInterval: allIntervals[0],
        sampleLap: allLaps[0]
      });

      // 현재 랩에 해당하는 데이터만 필터링
      const currentLapIntervals = this.filterIntervalsByLap(allIntervals, allLaps, this.currentLap);
      const currentLapLaps = allLaps.filter(lap => lap.lap_number <= this.currentLap);

      console.log('📊 [Backend API] Filtered data for current lap:', {
        currentLap: this.currentLap,
        intervals: currentLapIntervals.length,
        laps: currentLapLaps.length,
        drivers: drivers.length,
        firstInterval: currentLapIntervals[0]
      });

      return this.convertToDriverTimings_Backend(currentLapIntervals, currentLapLaps, drivers);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('❌ [Backend API] Axios error details:', {
          message: error.message,
          code: error.code,
          status: error.response?.status,
          statusText: error.response?.statusText,
          url: error.config?.url,
          baseURL: this.config.baseUrl
        });
      } else {
        console.error('❌ [Backend API] Non-Axios error:', error);
      }
      // 백엔드 API 실패 시 에러를 던져서 fallback으로 전환
      throw error;
    }
  }

  // 현재 랩에 해당하는 인터벌 데이터 필터링
  private filterIntervalsByLap(intervals: OpenF1Interval[], laps: OpenF1Lap[], currentLap: number): OpenF1Interval[] {
    // 각 드라이버의 가장 최근 인터벌 데이터 찾기 (간단한 방법)
    const driverLatestIntervals = new Map<number, OpenF1Interval>();

    // 모든 인터벌 데이터를 드라이버별로 그룹화하고 가장 최근 것만 선택
    intervals.forEach(interval => {
      const existing = driverLatestIntervals.get(interval.driver_number);

      // 기존 데이터가 없거나, 현재 데이터가 더 최근이면 업데이트
      if (!existing || new Date(interval.date).getTime() > new Date(existing.date).getTime()) {
        driverLatestIntervals.set(interval.driver_number, interval);
      }
    });

    const result = Array.from(driverLatestIntervals.values());

    // gap_to_leader로 정렬 (순위 순서대로)
    result.sort((a, b) => {
      if (a.gap_to_leader === null) return 1;
      if (b.gap_to_leader === null) return -1;
      return a.gap_to_leader - b.gap_to_leader;
    });

    return result;
  }

  // 세션의 드라이버 목록 가져오기
  async getSessionDrivers(sessionKey: number): Promise<OpenF1Driver[]> {
    try {
      return await this.makeApiRequest<OpenF1Driver[]>(`/sessions/${sessionKey}/drivers`);
    } catch (error) {
      // Mock 서비스에서 드라이버 데이터 변환
      const mockData = this.fallbackService.generateRealtimeDriverData();
      return mockData.map(driver => ({
        driver_number: driver.driver_number,
        broadcast_name: driver.name_acronym,
        full_name: driver.name_acronym,
        name_acronym: driver.name_acronym,
        team_name: 'Unknown Team',
        team_colour: driver.team_colour,
        first_name: driver.name_acronym.substring(0, 3),
        last_name: driver.name_acronym.substring(3),
        headshot_url: null,
        country_code: 'UNK',
        session_key: sessionKey,
        meeting_key: 0
      }));
    }
  }

  // 리플레이 시작 (캐싱 트리거)
  async startReplaySession(sessionKey: number): Promise<{ success: boolean; fallback?: boolean }> {
    try {
      const response = await axios.post(`${this.config.baseUrl}/sessions/${sessionKey}/start-replay`, {}, {
        timeout: 30000, // 캐싱에 시간이 걸릴 수 있으므로 30초 타임아웃
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      return response.data;
    } catch (error) {
      // 리플레이 시작 실패해도 Mock 서비스로 계속 진행
      return { success: true, fallback: true };
    }
  }

  // ===============================
  // 플래그 상태 관련 메서드들
  // ===============================

  async getCurrentFlag(): Promise<FlagStatus | null> {
    try {
      await this.makeApiRequest<unknown[]>(`/race-control/${this.sessionKey}`, { category: 'Flag' });
      // 최신 플래그 상태를 파싱하여 반환
      // TODO: 실제 백엔드 API 응답 형식에 따라 구현
      return null; // 임시로 null 반환
    } catch (error) {
      return this.fallbackService.getCurrentFlag();
    }
  }

  async getRaceStatus(): Promise<RaceStatus> {
    try {
      // 백엔드 API에서 레이스 상태 정보를 가져와 변환
      // TODO: 실제 백엔드 API 응답 형식에 따라 구현
      return {
        sessionType: 'RACE',
        currentFlag: 'GREEN',
        currentLap: this.currentLap,
        totalLaps: this.maxLaps,
        lapFlags: Array(this.maxLaps).fill('NONE'),
        currentMinute: 1,
        totalMinutes: 90,
        minuteFlags: Array(90).fill('NONE')
      };
    } catch (error) {
      return this.fallbackService.getRaceStatus();
    }
  }

  // ===============================
  // 데이터 변환 로직
  // ===============================

  // 백엔드 API 데이터를 DriverTiming 형식으로 변환
  private convertToDriverTimings_Backend(
    intervals: OpenF1Interval[],
    laps: OpenF1Lap[],
    drivers: OpenF1Driver[]
  ): DriverTiming[] {
    const timings: DriverTiming[] = [];

    // intervals 데이터를 기준으로 순위 결정
    intervals.forEach((interval, index) => {
      const driver = drivers.find(d => d.driver_number === interval.driver_number);
      const driverLaps = laps.filter(l => l.driver_number === interval.driver_number);
      const latestLap = driverLaps.find(l => l.lap_number === this.currentLap) || driverLaps[driverLaps.length - 1];
      const bestLap = driverLaps.reduce((best, current) => {
        if (!best || (current.lap_duration && best.lap_duration && current.lap_duration < best.lap_duration)) {
          return current;
        }
        return best;
      }, null as OpenF1Lap | null);

      // 리타이어 여부 확인 (lap_duration이 null이면 DNF로 간주)
      const isRetired = latestLap && latestLap.lap_duration === null;
      const isLeader = index === 0;

      if (driver) {
        // Interval (gap to leader) 계산
        let intervalDisplay: string;
        if (isLeader) {
          intervalDisplay = '--'; // 리더는 간격 없음
        } else if (isRetired) {
          intervalDisplay = 'DNF'; // 리타이어는 DNF 표시
        } else if (interval.gap_to_leader !== null) {
          intervalDisplay = `+${interval.gap_to_leader.toFixed(3)}`;
        } else {
          intervalDisplay = '--'; // 데이터 없음
        }

        // Interval to ahead (바로 앞 차와의 간격) 계산
        let intervalToAheadDisplay: string;
        if (isLeader) {
          intervalToAheadDisplay = ''; // 리더는 빈 문자열
        } else if (isRetired) {
          // 리타이어 드라이버도 앞 차와의 간격 표시 (부분 완주 시간 기반)
          if (interval.interval !== null) {
            intervalToAheadDisplay = `+${interval.interval.toFixed(3)}`;
          } else {
            intervalToAheadDisplay = 'DNF';
          }
        } else if (interval.interval !== null) {
          intervalToAheadDisplay = `+${interval.interval.toFixed(3)}`;
        } else {
          intervalToAheadDisplay = ''; // 데이터 없음
        }

        timings.push({
          position: index + 1,
          driverCode: driver.name_acronym,
          teamColor: `#${driver.team_colour}`,
          interval: intervalDisplay,
          intervalToAhead: intervalToAheadDisplay,
          currentLapTime: isRetired
            ? 'DNF'
            : (latestLap?.lap_duration
                ? this.formatTime(latestLap.lap_duration)
                : '--:--:---'),
          bestLapTime: bestLap?.lap_duration
            ? this.formatTime(bestLap.lap_duration)
            : '--:--:---',
          miniSector: {
            sector1: isRetired ? 'none' : this.getSectorPerformance(latestLap?.segments_sector_1 || []),
            sector2: isRetired ? 'none' : this.getSectorPerformance(latestLap?.segments_sector_2 || []),
            sector3: isRetired ? 'none' : this.getSectorPerformance(latestLap?.segments_sector_3 || []),
          },
          tireInfo: {
            pitStops: Math.floor((this.currentLap - 1) / 20), // 임시 계산
            lapCount: ((this.currentLap - 1) % 20) + 1,
            compound: this.getTireCompound(this.currentLap), // 임시 계산
          }
        });
      }
    });

    return timings.sort((a, b) => a.position - b.position);
  }

  // DriverTiming을 RealtimeDriverData로 변환
  private convertDriverTimingsToRealtimeData(timings: DriverTiming[]): RealtimeDriverData[] {
    return timings.map(timing => ({
      driver_number: this.getDriverNumberFromCode(timing.driverCode),
      position: timing.position,
      name_acronym: timing.driverCode,
      team_colour: timing.teamColor.replace('#', ''),
      current_lap: this.currentLap,
      current_interval: null, // TODO: 실제 interval 데이터로 채우기
      latest_lap: null, // TODO: 실제 lap 데이터로 채우기
      best_lap: null, // TODO: 실제 best lap 데이터로 채우기
      sector_times: {
        sector1: null,
        sector2: null,
        sector3: null,
      },
      sector_performance: timing.miniSector,
      tire_info: {
        compound: timing.tireInfo.compound,
        age: timing.tireInfo.lapCount, // lapCount -> age
        pit_stops: timing.tireInfo.pitStops, // pitStops -> pit_stops
      },
      speeds: {
        i1_speed: null,
        i2_speed: null,
        st_speed: null,
      },
      telemetry: {
        speed: 0,
        gear: 0,
        throttle: 0,
        brake: 0,
        drs_enabled: false,
        drs_available: false
      }
    }));
  }

  // OpenF1 세그먼트를 섹터 성능으로 변환
  private getSectorPerformance(segments: number[]): 'fastest' | 'personal_best' | 'normal' | 'slow' | 'none' {
    if (!segments.length) return 'none';
    
    if (segments.some(s => s === 2051)) return 'fastest'; // Purple
    if (segments.some(s => s === 0)) return 'personal_best'; // Green
    if (segments.some(s => s === 2049)) return 'slow'; // Red
    return 'normal'; // Yellow
  }

  // 타이어 컴파운드 추정 (임시 로직)
  private getTireCompound(lapNumber: number): 'SOFT' | 'MEDIUM' | 'HARD' | 'INTERMEDIATE' | 'WET' {
    const stints = Math.floor((lapNumber - 1) / 20);
    const compounds: ('SOFT' | 'MEDIUM' | 'HARD')[] = ['SOFT', 'MEDIUM', 'HARD'];
    return compounds[stints % compounds.length];
  }

  // 시간 포맷팅
  private formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(3);
    return `${minutes}:${secs.padStart(6, '0')}`;
  }

  // 드라이버 코드에서 번호로 변환 (임시 매핑)
  private getDriverNumberFromCode(driverCode: string): number {
    const mapping: { [key: string]: number } = {
      'VER': 1, 'PER': 11, 'HAM': 44, 'RUS': 63, 'LEC': 16, 'SAI': 55,
      'NOR': 4, 'PIA': 81, 'ALO': 14, 'STR': 18, 'GAS': 10, 'OCO': 31,
      'ALB': 23, 'SAR': 2, 'TSU': 22, 'RIC': 3, 'MAG': 20, 'HUL': 27,
      'BOT': 77, 'ZHO': 24
    };
    return mapping[driverCode] || 99;
  }

  // ===============================
  // Mock 서비스 호환 메서드들
  // ===============================

  // Monaco 시나리오 초기화 (Mock 서비스와 동일)
  resetToMonacoScenario(): void {
    this.currentLap = 1;
    this.maxLaps = 2;
    this.sessionKey = 9161;
    
    // Fallback 서비스도 동기화
    this.fallbackService.resetToMonacoScenario();
  }

  // API 사용 가능 상태 확인
  isBackendApiAvailable(): boolean {
    return this.isApiAvailable;
  }

  // 설정 업데이트
  updateConfig(newConfig: Partial<BackendConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  // 완전 정리 (컴포넌트 언마운트 시)
  cleanup(): void {
    this.stopRealtimeUpdates();
    this.fallbackService.stopRealtimeUpdates();
    this.cache.clear(); // API 요청 캐시 정리
    this.sessionDataCache.clear(); // 세션 데이터 캐시 정리
  }

  // 캐시 수동 정리
  clearCache(): void {
    this.cache.clear();
    this.sessionDataCache.clear();
    console.log('🧹 [Backend API] All caches cleared');
  }

  // 특정 세션 데이터 캐시 정리
  clearSessionCache(sessionKey: number): void {
    this.sessionDataCache.delete(sessionKey);
    console.log(`🧹 [Backend API] Session ${sessionKey} cache cleared`);
  }

  // ===============================
  // 백엔드 응답을 OpenF1 형식으로 변환하는 어댑터 메서드들
  // ===============================

  private convertBackendToOpenF1Interval(backendInterval: any): OpenF1Interval {
    return {
      date: backendInterval.timestamp,
      driver_number: backendInterval.driverNumber,
      gap_to_leader: backendInterval.gapToLeader,
      interval: backendInterval.interval,
      meeting_key: backendInterval.meetingKey,
      session_key: backendInterval.sessionKey
    };
  }

  private convertBackendToOpenF1Lap(backendLap: any): OpenF1Lap {
    // 백엔드 변환 형식:
    // {lapNumber, lapTime, sectors, speeds, segments, timestamp, driverNumber, sessionKey, meetingKey, ...}

    // segments가 객체 형식인 경우 배열로 추출
    const segments_sector_1 = backendLap.segments?.sector1?.map((s: any) => s.value || s) || [];
    const segments_sector_2 = backendLap.segments?.sector2?.map((s: any) => s.value || s) || [];
    const segments_sector_3 = backendLap.segments?.sector3?.map((s: any) => s.value || s) || [];

    return {
      date_start: backendLap.timestamp,
      driver_number: backendLap.driverNumber,
      duration_sector_1: backendLap.sectors?.sector1,
      duration_sector_2: backendLap.sectors?.sector2,
      duration_sector_3: backendLap.sectors?.sector3,
      i1_speed: backendLap.speeds?.i1Speed,
      i2_speed: backendLap.speeds?.i2Speed,
      is_pit_out_lap: backendLap.isPitOutLap,
      lap_duration: backendLap.lapTime, // ← 백엔드는 lapTime으로 변환함
      lap_number: backendLap.lapNumber,
      meeting_key: backendLap.meetingKey,
      segments_sector_1,
      segments_sector_2,
      segments_sector_3,
      session_key: backendLap.sessionKey,
      st_speed: null // 백엔드에서 제공하지 않음
    };
  }

  private convertBackendToOpenF1Driver(backendDriver: any): OpenF1Driver {
    // 백엔드 변환 형식:
    // {number, name, fullName, team, teamColor, sessionKey, meetingKey}

    // teamColor에서 # 제거 (백엔드는 #을 포함하지만 OpenF1은 포함하지 않음)
    const teamColour = backendDriver.teamColor?.replace('#', '') || '';

    return {
      driver_number: backendDriver.number,
      broadcast_name: backendDriver.name || '', // 백엔드에서 제공하지 않음
      full_name: backendDriver.fullName || '',
      name_acronym: backendDriver.name,
      team_name: backendDriver.team || '',
      team_colour: teamColour,
      first_name: '', // 백엔드에서 제공하지 않음
      last_name: '', // 백엔드에서 제공하지 않음
      headshot_url: null, // 백엔드에서 제공하지 않음
      country_code: '', // 백엔드에서 제공하지 않음
      session_key: backendDriver.sessionKey,
      meeting_key: backendDriver.meetingKey
    };
  }
}