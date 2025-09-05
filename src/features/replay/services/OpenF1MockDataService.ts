import { OpenF1Interval, OpenF1Lap, OpenF1Driver, RealtimeDriverData } from '../types/openF1Types';
import { DriverTiming } from '@/src/features/replay/components/ui';
import type { FlagStatus, LapFlagStatus, SessionType } from '@/src/features/replay/components/ui';
import type { RaceStatus } from '../types';

export class OpenF1MockDataService {
  private static instance: OpenF1MockDataService;
  private currentLap: number = 1;
  private maxLaps: number = 58; // Default lap count
  private sessionKey: number = 9472; // Default session key
  private meetingKey: number = 1217; // Mock meeting key
  private retiredDrivers: Set<number> = new Set(); // No retired drivers by default
  private isMonacoDebugMode: boolean = false; // Monaco 2-lap debug mode flag
  private currentFlag: FlagStatus | null = null; // 현재 플래그 상태
  private lapFlags: LapFlagStatus[] = []; // 각 랩별 플래그 상태
  private sessionType: SessionType = 'RACE'; // 세션 타입
  private currentMinute: number = 1; // 현재 경과 시간 (분)
  private totalMinutes: number = 90; // 전체 세션 시간 (분)
  private minuteFlags: LapFlagStatus[] = []; // 각 분별 플래그 상태
  
  // 2024 시즌 실제 드라이버 정보
  private drivers: OpenF1Driver[] = [
    { driver_number: 1, broadcast_name: "M VERSTAPPEN", full_name: "Max Verstappen", name_acronym: "VER", team_name: "Red Bull Racing", team_colour: "3671C6", first_name: "Max", last_name: "Verstappen", headshot_url: null, country_code: "NED", session_key: this.sessionKey, meeting_key: this.meetingKey },
    { driver_number: 11, broadcast_name: "S PEREZ", full_name: "Sergio Perez", name_acronym: "PER", team_name: "Red Bull Racing", team_colour: "3671C6", first_name: "Sergio", last_name: "Perez", headshot_url: null, country_code: "MEX", session_key: this.sessionKey, meeting_key: this.meetingKey },
    { driver_number: 44, broadcast_name: "L HAMILTON", full_name: "Lewis Hamilton", name_acronym: "HAM", team_name: "Mercedes", team_colour: "27F4D2", first_name: "Lewis", last_name: "Hamilton", headshot_url: null, country_code: "GBR", session_key: this.sessionKey, meeting_key: this.meetingKey },
    { driver_number: 63, broadcast_name: "G RUSSELL", full_name: "George Russell", name_acronym: "RUS", team_name: "Mercedes", team_colour: "27F4D2", first_name: "George", last_name: "Russell", headshot_url: null, country_code: "GBR", session_key: this.sessionKey, meeting_key: this.meetingKey },
    { driver_number: 16, broadcast_name: "C LECLERC", full_name: "Charles Leclerc", name_acronym: "LEC", team_name: "Ferrari", team_colour: "E8002D", first_name: "Charles", last_name: "Leclerc", headshot_url: null, country_code: "MON", session_key: this.sessionKey, meeting_key: this.meetingKey },
    { driver_number: 55, broadcast_name: "C SAINZ", full_name: "Carlos Sainz", name_acronym: "SAI", team_name: "Ferrari", team_colour: "E8002D", first_name: "Carlos", last_name: "Sainz Jr", headshot_url: null, country_code: "ESP", session_key: this.sessionKey, meeting_key: this.meetingKey },
    { driver_number: 4, broadcast_name: "L NORRIS", full_name: "Lando Norris", name_acronym: "NOR", team_name: "McLaren", team_colour: "FF8000", first_name: "Lando", last_name: "Norris", headshot_url: null, country_code: "GBR", session_key: this.sessionKey, meeting_key: this.meetingKey },
    { driver_number: 81, broadcast_name: "O PIASTRI", full_name: "Oscar Piastri", name_acronym: "PIA", team_name: "McLaren", team_colour: "FF8000", first_name: "Oscar", last_name: "Piastri", headshot_url: null, country_code: "AUS", session_key: this.sessionKey, meeting_key: this.meetingKey },
    { driver_number: 14, broadcast_name: "F ALONSO", full_name: "Fernando Alonso", name_acronym: "ALO", team_name: "Aston Martin", team_colour: "229971", first_name: "Fernando", last_name: "Alonso", headshot_url: null, country_code: "ESP", session_key: this.sessionKey, meeting_key: this.meetingKey },
    { driver_number: 18, broadcast_name: "L STROLL", full_name: "Lance Stroll", name_acronym: "STR", team_name: "Aston Martin", team_colour: "229971", first_name: "Lance", last_name: "Stroll", headshot_url: null, country_code: "CAN", session_key: this.sessionKey, meeting_key: this.meetingKey },
    { driver_number: 10, broadcast_name: "P GASLY", full_name: "Pierre Gasly", name_acronym: "GAS", team_name: "Alpine", team_colour: "2293D1", first_name: "Pierre", last_name: "Gasly", headshot_url: null, country_code: "FRA", session_key: this.sessionKey, meeting_key: this.meetingKey },
    { driver_number: 31, broadcast_name: "E OCON", full_name: "Esteban Ocon", name_acronym: "OCO", team_name: "Alpine", team_colour: "2293D1", first_name: "Esteban", last_name: "Ocon", headshot_url: null, country_code: "FRA", session_key: this.sessionKey, meeting_key: this.meetingKey },
    { driver_number: 23, broadcast_name: "A ALBON", full_name: "Alexander Albon", name_acronym: "ALB", team_name: "Williams", team_colour: "64C4FF", first_name: "Alexander", last_name: "Albon", headshot_url: null, country_code: "THA", session_key: this.sessionKey, meeting_key: this.meetingKey },
    { driver_number: 2, broadcast_name: "L SARGEANT", full_name: "Logan Sargeant", name_acronym: "SAR", team_name: "Williams", team_colour: "64C4FF", first_name: "Logan", last_name: "Sargeant", headshot_url: null, country_code: "USA", session_key: this.sessionKey, meeting_key: this.meetingKey },
    { driver_number: 22, broadcast_name: "Y TSUNODA", full_name: "Yuki Tsunoda", name_acronym: "TSU", team_name: "AlphaTauri", team_colour: "5E8FAA", first_name: "Yuki", last_name: "Tsunoda", headshot_url: null, country_code: "JPN", session_key: this.sessionKey, meeting_key: this.meetingKey },
    { driver_number: 3, broadcast_name: "D RICCIARDO", full_name: "Daniel Ricciardo", name_acronym: "RIC", team_name: "AlphaTauri", team_colour: "5E8FAA", first_name: "Daniel", last_name: "Ricciardo", headshot_url: null, country_code: "AUS", session_key: this.sessionKey, meeting_key: this.meetingKey },
    { driver_number: 20, broadcast_name: "K MAGNUSSEN", full_name: "Kevin Magnussen", name_acronym: "MAG", team_name: "Haas", team_colour: "B6BABD", first_name: "Kevin", last_name: "Magnussen", headshot_url: null, country_code: "DEN", session_key: this.sessionKey, meeting_key: this.meetingKey },
    { driver_number: 27, broadcast_name: "N HULKENBERG", full_name: "Nico Hulkenberg", name_acronym: "HUL", team_name: "Haas", team_colour: "B6BABD", first_name: "Nico", last_name: "Hulkenberg", headshot_url: null, country_code: "GER", session_key: this.sessionKey, meeting_key: this.meetingKey },
    { driver_number: 77, broadcast_name: "V BOTTAS", full_name: "Valtteri Bottas", name_acronym: "BOT", team_name: "Alfa Romeo", team_colour: "C92D4B", first_name: "Valtteri", last_name: "Bottas", headshot_url: null, country_code: "FIN", session_key: this.sessionKey, meeting_key: this.meetingKey },
    { driver_number: 24, broadcast_name: "G ZHOU", full_name: "Guanyu Zhou", name_acronym: "ZHO", team_name: "Alfa Romeo", team_colour: "C92D4B", first_name: "Guanyu", last_name: "Zhou", headshot_url: null, country_code: "CHN", session_key: this.sessionKey, meeting_key: this.meetingKey }
  ];

  // 랩별 동적 데이터 저장소
  private lapData: Map<number, OpenF1Lap[]> = new Map();
  private intervalData: Map<number, OpenF1Interval[]> = new Map();
  
  static getInstance(): OpenF1MockDataService {
    if (!OpenF1MockDataService.instance) {
      OpenF1MockDataService.instance = new OpenF1MockDataService();
    }
    return OpenF1MockDataService.instance;
  }

  constructor() {
    this.generateAllLapData();
    this.initializeFlagData();
    this.initializeMinuteFlagData();
  }

  // 세션 설정 (sessionKey에 따라 시나리오 결정)
  setSession(sessionKey: number): void {
    this.sessionKey = sessionKey;
    
    // Monaco 2-Lap Debug 시나리오 (sessionKey: 9999)
    if (sessionKey === 9999) {
      this.isMonacoDebugMode = true;
      this.maxLaps = 2;
      this.currentLap = 1;
      this.retiredDrivers.clear();
      this.retiredDrivers.add(20); // Magnussen retired
    } else {
      this.isMonacoDebugMode = false;
      this.maxLaps = 58;
      this.currentLap = 1;
      this.retiredDrivers.clear();
    }
    
    // 데이터 재생성
    this.generateAllLapData();
  }

  setCurrentLap(lap: number): void {
    this.currentLap = Math.max(1, Math.min(lap, this.maxLaps));
    this.updateFlagStatus(); // 랩 변경 시 플래그 상태 업데이트
  }

  getCurrentLap(): number {
    return this.currentLap;
  }

  // 모든 랩에 대한 데이터를 미리 생성
  private generateAllLapData(): void {
    for (let lap = 1; lap <= this.maxLaps; lap++) {
      this.lapData.set(lap, this.generateLapData(lap));
      this.intervalData.set(lap, this.generateIntervalData(lap));
    }
  }

  // Monaco 특별 랩 데이터 생성 (리타이어 및 피트스톱 시나리오 포함)
  private generateLapData(lapNumber: number): OpenF1Lap[] {
    return this.drivers.map(driver => {
      // Kevin Magnussen (20) - 랩 1에서 리타이어
      if (driver.driver_number === 20 && lapNumber === 1) {
        return {
          date_start: new Date(Date.now() - (this.maxLaps - lapNumber) * 90000).toISOString(),
          driver_number: driver.driver_number,
          duration_sector_1: 17.456,
          duration_sector_2: null, // 섹터 2에서 멈춤
          duration_sector_3: null,
          i1_speed: 150, // 느린 속도로 피트로 돌아감
          i2_speed: null,
          is_pit_out_lap: false,
          lap_duration: null, // 완주하지 못함
          lap_number: lapNumber,
          meeting_key: this.meetingKey,
          segments_sector_1: [], // 리타이어로 인해 빈 세그먼트
          segments_sector_2: [],
          segments_sector_3: [],
          session_key: this.sessionKey,
          st_speed: null
        };
      }
      
      // 리타이어한 드라이버는 랩 2 데이터 없음
      if (this.retiredDrivers.has(driver.driver_number) && lapNumber > 1) {
        return null;
      }
      
      const baseTime = this.getBaselapTime(driver.driver_number);
      let lapTime = baseTime;
      let isPitStop = false;
      
      // Charles Leclerc (16) - 랩 2에서 피트스톱
      if (driver.driver_number === 16 && lapNumber === 2) {
        lapTime = baseTime + 24; // 모나코 피트 페널티
        isPitStop = true;
      } else {
        // 일반적인 랩타임 변동 (±0.5초)
        const variation = (Math.random() - 0.5);
        lapTime = baseTime + variation;
      }
      
      // Monaco 섹터 비율: S1(~20%), S2(~52%), S3(~28%)
      let sector1 = lapTime * (0.20 + (Math.random() - 0.5) * 0.02);
      let sector2 = lapTime * (0.52 + (Math.random() - 0.5) * 0.02);
      let sector3 = lapTime - sector1 - sector2;
      
      // 피트스톱인 경우 첫 섹터에 피트타임 포함
      if (isPitStop) {
        sector1 += 24; // 피트 시간 추가
        sector2 = lapTime * 0.52;
        sector3 = lapTime * 0.28;
      }

      return {
        date_start: new Date(Date.now() - (this.maxLaps - lapNumber) * 75000).toISOString(), // Monaco는 75초 간격
        driver_number: driver.driver_number,
        duration_sector_1: sector1,
        duration_sector_2: sector2,
        duration_sector_3: sector3,
        i1_speed: 160 + Math.random() * 30, // Monaco는 느린 서킷 (160-190 km/h)
        i2_speed: 170 + Math.random() * 25, // 170-195 km/h
        is_pit_out_lap: isPitStop,
        lap_duration: lapTime,
        lap_number: lapNumber,
        meeting_key: this.meetingKey,
        segments_sector_1: this.generateMonacoSegments(driver.driver_number, 1, lapNumber),
        segments_sector_2: this.generateMonacoSegments(driver.driver_number, 2, lapNumber),
        segments_sector_3: this.generateMonacoSegments(driver.driver_number, 3, lapNumber),
        session_key: this.sessionKey,
        st_speed: 180 + Math.random() * 20 // Monaco 스피드 트랩 (180-200 km/h)
      };
    }).filter(lap => lap !== null); // 리타이어한 드라이버의 null 데이터 제거
  }

  // Monaco 인터벌 데이터 생성 (리타이어 및 피트스톱 고려)
  private generateIntervalData(lapNumber: number): OpenF1Interval[] {
    const laps = this.lapData.get(lapNumber) || [];
    
    // 모든 드라이버 포함 (리타이어한 드라이버도 마지막 기록된 위치에 표시)
    const activeDrivers = this.drivers.filter(driver => {
      // 리타이어한 드라이버는 리타이어한 랩에만 포함
      if (this.retiredDrivers.has(driver.driver_number)) {
        return lapNumber === 1; // MAG는 랩 1에서 리타이어했으므로 랩 1에만 포함
      }
      return true;
    });
    
    // 누적 시간으로 포지션 계산
    const cumulativeTimes = activeDrivers.map(driver => {
      let totalTime = 0;
      let hasRetired = false;
      let isPartialLap = false;
      
      for (let i = 1; i <= lapNumber; i++) {
        const lapData = this.lapData.get(i)?.find(l => l.driver_number === driver.driver_number);
        
        if (lapData) {
          if (lapData.lap_duration) {
            totalTime += lapData.lap_duration;
          } else if (this.retiredDrivers.has(driver.driver_number) && i === lapNumber) {
            // 리타이어한 드라이버는 섹터 1 시간만 추가 (부분 완주)
            totalTime += lapData.duration_sector_1 || 0;
            hasRetired = true;
            isPartialLap = true;
          }
        } else if (!this.retiredDrivers.has(driver.driver_number)) {
          totalTime += this.getBaselapTime(driver.driver_number);
        } else {
          hasRetired = true;
          break;
        }
      }
      
      return { 
        driver_number: driver.driver_number, 
        totalTime,
        hasRetired,
        isPartialLap
      };
    });

    // 완주한 드라이버와 리타이어한 드라이버를 분리하여 정렬
    const completedDrivers = cumulativeTimes.filter(data => !data.hasRetired);
    const retiredDrivers = cumulativeTimes.filter(data => data.hasRetired);
    
    // 완주한 드라이버들을 시간 순으로 정렬
    completedDrivers.sort((a, b) => a.totalTime - b.totalTime);
    
    const leaderTime = completedDrivers[0]?.totalTime || 0;
    const intervals: OpenF1Interval[] = [];

    // 완주한 드라이버들의 인터벌 계산
    completedDrivers.forEach((data, index) => {
      intervals.push({
        date: new Date().toISOString(),
        driver_number: data.driver_number,
        gap_to_leader: index === 0 ? null : data.totalTime - leaderTime,
        interval: index === 0 ? null : data.totalTime - completedDrivers[index - 1].totalTime,
        meeting_key: this.meetingKey,
        session_key: this.sessionKey
      });
    });

    // 리타이어한 드라이버들을 맨 뒤에 추가 (순위 표시용)
    retiredDrivers.forEach((data) => {
      intervals.push({
        date: new Date().toISOString(),
        driver_number: data.driver_number,
        gap_to_leader: null, // 리타이어는 간격 없음
        interval: null,
        meeting_key: this.meetingKey,
        session_key: this.sessionKey
      });
    });

    return intervals;
  }

  // Monaco 기준 드라이버별 기본 랩타임 (1:12-1:18 범위)
  private getBaselapTime(driverNumber: number): number {
    const monacoBaseTimes: { [key: number]: number } = {
      1: 72.456,   // VER - 가장 빠름
      16: 72.789,  // LEC - 홈 레이스 강함
      4: 73.123,   // NOR
      11: 73.567,  // PER
      81: 73.890,  // PIA
      55: 74.123,  // SAI
      44: 74.456,  // HAM
      63: 74.789,  // RUS
      14: 75.123,  // ALO
      18: 75.567,  // STR
      10: 75.890,  // GAS
      31: 76.234,  // OCO
      23: 76.567,  // ALB
      2: 76.890,   // SAR
      77: 77.123,  // BOT
      24: 77.456,  // ZHO
      27: 77.789,  // HUL
      3: 78.123,   // RIC
      22: 78.456,  // TSU
      20: 999.999  // MAG - 리타이어
    };
    return monacoBaseTimes[driverNumber] || 75.0;
  }

  // Monaco 특화 세그먼트 성능 데이터 생성
  private generateMonacoSegments(driverNumber: number, sector: number, lapNumber: number): number[] {
    const segments = [];
    
    // Charles Leclerc - Monaco 홈 어드밴티지 (더 많은 personal best)
    // Max Verstappen - 일관된 최고 성능
    const isHomeAdvantage = driverNumber === 16; // Leclerc
    const isTopPerformer = [1, 4, 16].includes(driverNumber); // VER, NOR, LEC
    
    for (let i = 0; i < 8; i++) {
      const rand = Math.random();
      
      if (isTopPerformer) {
        if (rand < 0.10) segments.push(2051); // 10% fastest overall (purple)
        else if (rand < 0.25) segments.push(0); // 15% personal best (green)
        else if (rand < 0.30) segments.push(2049); // 5% slow (red)
        else segments.push(2048); // 70% normal (yellow)
      } else if (isHomeAdvantage && this.isMonacoDebugMode && lapNumber === 1) {
        if (rand < 0.08) segments.push(2051); // 8% fastest overall
        else if (rand < 0.30) segments.push(0); // 22% personal best
        else if (rand < 0.35) segments.push(2049); // 5% slow
        else segments.push(2048); // 65% normal
      } else {
        // 일반 드라이버들
        if (rand < 0.03) segments.push(2051); // 3% fastest overall
        else if (rand < 0.15) segments.push(0); // 12% personal best
        else if (rand < 0.25) segments.push(2049); // 10% slow
        else segments.push(2048); // 75% normal
      }
    }
    
    return segments;
  }

  // 현재 랩의 실시간 드라이버 데이터 생성
  generateRealtimeDriverData(): RealtimeDriverData[] {
    const currentLapData = this.lapData.get(this.currentLap) || [];
    const currentIntervals = this.intervalData.get(this.currentLap) || [];
    
    return this.drivers
      .filter(driver => {
        // 리타이어한 드라이버는 랩 2 이후에는 제외
        if (this.retiredDrivers.has(driver.driver_number)) {
          return this.currentLap === 1;
        }
        return true;
      })
      .map(driver => {
        const lapData = currentLapData.find(l => l.driver_number === driver.driver_number);
        const intervalData = currentIntervals.find(i => i.driver_number === driver.driver_number);
        
        // 포지션 계산: 인터벌 데이터에서의 인덱스 + 1
        let position = currentIntervals.findIndex(i => i.driver_number === driver.driver_number) + 1;
        
        // 리타이어한 드라이버는 맨 뒤 순위로 설정
        if (this.retiredDrivers.has(driver.driver_number)) {
          position = currentIntervals.length; // 마지막 순위
        }
        
        // 베스트 랩 찾기 (리타이어 전까지의 완주 랩만)
        let bestLap: OpenF1Lap | null = null;
        let bestTime = Infinity;
        for (let i = 1; i <= this.currentLap; i++) {
          const lap = this.lapData.get(i)?.find(l => l.driver_number === driver.driver_number);
          if (lap && lap.lap_duration && lap.lap_duration < bestTime && lap.lap_duration < 999) {
            bestTime = lap.lap_duration;
            bestLap = lap;
          }
        }

        return {
          driver_number: driver.driver_number,
          position,
          name_acronym: driver.name_acronym,
          team_colour: driver.team_colour,
          current_lap: this.currentLap,
          current_interval: intervalData || null,
          latest_lap: lapData || null,
          best_lap: bestLap,
          sector_times: {
            sector1: lapData?.duration_sector_1 || null,
            sector2: lapData?.duration_sector_2 || null,
            sector3: lapData?.duration_sector_3 || null,
          },
          sector_performance: {
            sector1: this.retiredDrivers.has(driver.driver_number) 
              ? 'none' 
              : this.getSectorPerformance(lapData?.segments_sector_1 || [], this.currentLap, 1),
            sector2: this.retiredDrivers.has(driver.driver_number) 
              ? 'none' 
              : this.getSectorPerformance(lapData?.segments_sector_2 || [], this.currentLap, 2),
            sector3: this.retiredDrivers.has(driver.driver_number) 
              ? 'none' 
              : this.getSectorPerformance(lapData?.segments_sector_3 || [], this.currentLap, 3),
          },
          tire_info: {
            compound: this.getTireCompound(this.currentLap, driver.driver_number),
            age: this.getTireAge(this.currentLap, driver.driver_number),
            pit_stops: Math.floor((this.currentLap - 1) / 20),
          },
          speeds: {
            i1_speed: lapData?.i1_speed || null,
            i2_speed: lapData?.i2_speed || null,
            st_speed: lapData?.st_speed || null,
          },
          telemetry: this.generateTelemetryData(driver.driver_number, this.currentLap)
        };
      });
  }

  // 세그먼트 데이터를 기반으로 섹터 성능 계산
  private getSectorPerformance(segments: number[], lapNumber: number, sectorNumber: number): 'fastest' | 'personal_best' | 'normal' | 'slow' | 'none' {
    // 첫 랩에서는 섹터 완료 여부에 따라 다르게 처리
    if (lapNumber === 1) {
      // 첫 랩에서 섹터 1은 항상 완료, 섹터 2,3은 진행 상황에 따라
      if (sectorNumber === 2 || sectorNumber === 3) {
        // 세그먼트 데이터가 없으면 아직 완료되지 않음
        if (!segments.length) return 'none';
      }
    }
    
    // 데이터가 없으면 'none' 반환
    if (!segments.length) return 'none';
    
    if (segments.some(s => s === 2051)) return 'fastest'; // Purple
    if (segments.some(s => s === 0)) return 'personal_best'; // Green
    if (segments.some(s => s === 2049)) return 'slow'; // Red
    return 'normal'; // Yellow
  }

  // 타이어 컴파운드 결정
  private getTireCompound(lapNumber: number, driverNumber: number): 'SOFT' | 'MEDIUM' | 'HARD' | 'INTERMEDIATE' | 'WET' {
    const stints = Math.floor((lapNumber - 1) / 20);
    const compounds: ('SOFT' | 'MEDIUM' | 'HARD')[] = ['SOFT', 'MEDIUM', 'HARD'];
    return compounds[stints % compounds.length];
  }

  // 타이어 나이 계산
  private getTireAge(lapNumber: number, driverNumber: number): number {
    return ((lapNumber - 1) % 20) + 1;
  }

  // DriverTiming 형식으로 변환
  convertToDriverTimings(): DriverTiming[] {
    const realtimeData = this.generateRealtimeDriverData();
    
    return realtimeData
      .sort((a, b) => a.position - b.position)
      .map(data => {
        const isRetired = this.retiredDrivers.has(data.driver_number);
        
        return {
          position: data.position,
          driverCode: data.name_acronym,
          teamColor: `#${data.team_colour}`,
          interval: isRetired 
            ? 'DNF' // Did Not Finish
            : (data.current_interval?.gap_to_leader == null 
                ? '--' 
                : `+${data.current_interval.gap_to_leader.toFixed(3)}`),
          intervalToAhead: isRetired 
            ? 'DNF'
            : (data.current_interval?.interval == null
                ? ''
                : `+${data.current_interval.interval.toFixed(3)}`),
          currentLapTime: isRetired
            ? 'DNF'
            : (data.latest_lap?.lap_duration 
                ? this.formatTime(data.latest_lap.lap_duration)
                : '--:--:---'),
          bestLapTime: data.best_lap?.lap_duration
            ? this.formatTime(data.best_lap.lap_duration)
            : '--:--:---',
          miniSector: {
            sector1: isRetired ? 'none' : data.sector_performance.sector1,
            sector2: isRetired ? 'none' : data.sector_performance.sector2,
            sector3: isRetired ? 'none' : data.sector_performance.sector3,
          },
          tireInfo: {
            pitStops: data.tire_info.pit_stops,
            lapCount: data.tire_info.age,
            compound: data.tire_info.compound,
          }
        };
      });
  }

  private formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(3);
    return `${minutes}:${secs.padStart(6, '0')}`;
  }
  
  // OpenF1 API와 동일한 4초 간격 실시간 업데이트 시뮬레이션
  private intervalTimer: NodeJS.Timeout | null = null;
  private intervalCallbacks: ((timings: DriverTiming[]) => void)[] = [];
  
  // 4초마다 업데이트되는 실시간 구독 시작
  startRealtimeUpdates(callback: (timings: DriverTiming[]) => void): void {
    this.intervalCallbacks.push(callback);
    
    // 첫 번째 콜백이 등록되면 타이머 시작
    if (this.intervalCallbacks.length === 1 && !this.intervalTimer) {
      // Starting realtime updates
      
      // 즉시 한 번 실행
      const initialTimings = this.convertToDriverTimings();
      this.intervalCallbacks.forEach(cb => cb(initialTimings));
      
      // 4초마다 업데이트
      this.intervalTimer = setInterval(() => {
        const timings = this.convertToDriverTimings();
        this.intervalCallbacks.forEach(cb => cb(timings));
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
    
    // 모든 콜백이 제거되면 타이머 정지
    if (this.intervalCallbacks.length === 0 && this.intervalTimer) {
      // Stopping realtime updates
      clearInterval(this.intervalTimer);
      this.intervalTimer = null;
    }
  }
  
  // Monaco 시나리오 초기화
  resetToMonacoScenario(): void {
    // Resetting to Monaco 2-lap scenario
    this.currentLap = 1;
    this.maxLaps = 2;
    this.sessionKey = 9161;
    this.retiredDrivers.clear();
    this.retiredDrivers.add(20); // Kevin Magnussen
    
    // 데이터 재생성
    this.generateAllLapData();
  }

  // 드라이버별 텔레메트리 데이터 생성
  private generateTelemetryData(driverNumber: number, lapNumber: number) {
    // 리타이어한 드라이버는 모든 텔레메트리 0
    if (this.retiredDrivers.has(driverNumber)) {
      return {
        speed: 0,
        gear: 0,
        throttle: 0,
        brake: 0,
        drs_enabled: false,
        drs_available: false
      };
    }

    const time = Date.now();
    const baseSpeed = this.getBaseSpeed(driverNumber);
    const variation = Math.sin(time / 2000) * 0.3; // 부드러운 변화
    
    // Monaco의 다양한 섹션별 속도 시뮬레이션
    const sectionVariation = Math.sin(time / 5000) * 40; // 섹션별 속도 변화
    const speed = Math.max(60, Math.min(320, baseSpeed + sectionVariation + (variation * 20)));
    
    // 기어 계산 (속도 기반)
    let gear = 1;
    if (speed > 80) gear = 2;
    if (speed > 120) gear = 3;
    if (speed > 160) gear = 4;
    if (speed > 200) gear = 5;
    if (speed > 240) gear = 6;
    if (speed > 280) gear = 7;
    if (speed > 300) gear = 8;
    
    // 코너링 상황 시뮬레이션
    const isCorner = Math.sin(time / 3000) < -0.3;
    const isBraking = Math.sin(time / 3000) < -0.7;
    
    // 액셀/브레이크 개도량
    const throttle = isBraking ? 0 : Math.max(0, Math.min(100, 70 + (Math.sin(time / 1500) * 30)));
    const brake = isBraking ? Math.max(0, Math.min(100, 60 + (Math.sin(time / 1000) * 40))) : 0;
    
    // DRS (높은 속도에서만 사용 가능, Monaco에서는 제한적)
    const drs_available = speed > 200 && !isCorner;
    const drs_enabled = drs_available && Math.sin(time / 4000) > 0.3;
    
    return {
      speed: Math.round(speed),
      gear,
      throttle: Math.round(throttle),
      brake: Math.round(brake),
      drs_enabled,
      drs_available
    };
  }

  // 드라이버별 기본 속도 (경쟁력 반영)
  private getBaseSpeed(driverNumber: number): number {
    const speedMap: { [key: number]: number } = {
      1: 180,   // VER - 최고 속도
      16: 178,  // LEC - Monaco 강자
      4: 175,   // NOR
      11: 172,  // PER
      81: 170,  // PIA
      55: 168,  // SAI
      44: 165,  // HAM
      63: 163,  // RUS
      14: 160,  // ALO
      18: 158,  // STR
      10: 155,  // GAS
      31: 153,  // OCO
      23: 150,  // ALB
      2: 148,   // SAR
      77: 145,  // BOT
      24: 143,  // ZHO
      27: 140,  // HUL
      3: 138,   // RIC
      22: 135,  // TSU
      20: 0     // MAG - 리타이어
    };
    return speedMap[driverNumber] || 150;
  }

  // 플래그 데이터 초기화
  private initializeFlagData(): void {
    // 전체 랩 수만큼 플래그 상태 초기화 (모두 NONE으로 시작)
    this.lapFlags = Array.from({ length: this.maxLaps }, () => 'NONE');
    
    // 일부 랩에 플래그 상황 설정 (시뮬레이션용)
    this.generateFlagScenarios();
  }

  // 플래그 시나리오 생성 (레이스 중 발생할 수 있는 상황들)
  private generateFlagScenarios(): void {
    // 랩 10-12: Safety Car (사고 상황)
    for (let lap = 9; lap < 12; lap++) {
      if (lap < this.maxLaps) {
        this.lapFlags[lap] = 'SC';
      }
    }

    // 랩 25: Red Flag (심각한 사고)
    if (this.maxLaps > 25) {
      this.lapFlags[24] = 'RED';
    }

    // 랩 35-37: Virtual Safety Car 
    for (let lap = 34; lap < 37; lap++) {
      if (lap < this.maxLaps) {
        this.lapFlags[lap] = 'VSC';
      }
    }

    // 랩 50: 또 다른 Safety Car
    if (this.maxLaps > 50) {
      this.lapFlags[49] = 'SC';
      this.lapFlags[50] = 'SC';
    }
  }

  // 현재 플래그 상태 가져오기
  getCurrentFlag(): FlagStatus | null {
    return this.currentFlag;
  }

  // 현재 랩의 플래그 상태 가져오기
  getCurrentLapFlag(): LapFlagStatus {
    const lapIndex = this.currentLap - 1;
    return this.lapFlags[lapIndex] || 'NONE';
  }

  // 모든 랩의 플래그 상태 가져오기 (현재 랩까지만)
  getLapFlags(): LapFlagStatus[] {
    return [...this.lapFlags];
  }


  // 분별 플래그 데이터 초기화 (퀄리파잉/연습용)
  private initializeMinuteFlagData(): void {
    // 전체 세션 시간만큼 플래그 상태 초기화
    this.minuteFlags = Array.from({ length: this.totalMinutes }, () => 'NONE');
    
    // 시간 기반 플래그 시나리오 생성
    this.generateMinuteFlagScenarios();
  }

  // 시간 기반 플래그 시나리오 생성
  private generateMinuteFlagScenarios(): void {
    if (this.sessionType === 'QUALIFYING') {
      // 퀄리파잉: 짧은 세션에서 몇 분 동안만 플래그
      if (this.totalMinutes > 5) {
        this.minuteFlags[4] = 'SC'; // 5분째 Safety Car
      }
      if (this.totalMinutes > 12) {
        this.minuteFlags[11] = 'VSC'; // 12분째 VSC
        this.minuteFlags[12] = 'VSC';
      }
    } else if (this.sessionType === 'PRACTICE') {
      // 연습주행: 더 많은 플래그 상황
      for (let minute = 14; minute < 17; minute++) {
        if (minute < this.totalMinutes) {
          this.minuteFlags[minute] = 'SC';
        }
      }
      if (this.totalMinutes > 35) {
        this.minuteFlags[34] = 'RED'; // 35분째 Red Flag
      }
      for (let minute = 55; minute < 58; minute++) {
        if (minute < this.totalMinutes) {
          this.minuteFlags[minute] = 'VSC';
        }
      }
    }
  }

  // 세션 타입 설정
  setSessionType(sessionType: SessionType, totalMinutes?: number): void {
    this.sessionType = sessionType;
    
    if (sessionType !== 'RACE' && totalMinutes) {
      this.totalMinutes = totalMinutes;
      this.currentMinute = 1;
      this.initializeMinuteFlagData();
    }
  }

  // 현재 분 설정 (퀄리파잉/연습용)
  setCurrentMinute(minute: number): void {
    this.currentMinute = Math.max(1, Math.min(minute, this.totalMinutes));
    if (this.sessionType !== 'RACE') {
      this.updateFlagStatus();
    }
  }

  // 현재 분의 플래그 상태 가져오기
  getCurrentMinuteFlag(): LapFlagStatus {
    const minuteIndex = this.currentMinute - 1;
    return this.minuteFlags[minuteIndex] || 'NONE';
  }

  // 모든 분의 플래그 상태 가져오기
  getMinuteFlags(): LapFlagStatus[] {
    return [...this.minuteFlags];
  }

  // 플래그 상태 업데이트 (랩 또는 분 진행 시)
  private updateFlagStatus(): void {
    const isRace = this.sessionType === 'RACE';
    const currentFlag = isRace ? this.getCurrentLapFlag() : this.getCurrentMinuteFlag();
    
    // 현재 플래그 상태에 따라 전체 플래그 상태 결정
    switch (currentFlag) {
      case 'RED':
        this.currentFlag = 'RED';
        break;
      case 'SC':
        this.currentFlag = 'SC';
        break;
      case 'VSC':
        this.currentFlag = 'VSC';
        break;
      case 'NONE':
      default:
        this.currentFlag = null; // Green flag (정상 상황)
        break;
    }
  }

  // 플래그 정보가 포함된 세션 상태 가져오기
  getRaceStatus(): RaceStatus {
    const isRace = this.sessionType === 'RACE';
    
    return {
      sessionType: this.sessionType,
      // 레이스용 데이터
      currentLap: this.currentLap,
      totalLaps: this.maxLaps,
      lapFlags: this.getLapFlags(),
      // 퀄리파잉/연습용 데이터
      currentMinute: this.currentMinute,
      totalMinutes: this.totalMinutes,
      minuteFlags: this.getMinuteFlags(),
      // 공통 데이터
      currentFlag: this.getCurrentFlag() || 'GREEN'
    };
  }
}