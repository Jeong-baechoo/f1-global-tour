import { OpenF1Interval, OpenF1Lap, OpenF1Driver, RealtimeDriverData } from '../types/openF1Types';
import { DriverTiming } from '../components/ui/DriverInfoPanel/types';

export class OpenF1MockDataService {
  private static instance: OpenF1MockDataService;
  private currentLap: number = 1;
  private maxLaps: number = 58;
  private sessionKey: number = 9472; // Mock session key
  private meetingKey: number = 1217; // Mock meeting key
  
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
    { driver_number: 2, broadcast_name: "L SARGEANT", full_name: "Logan Sargeant", name_acrononym: "SAR", team_name: "Williams", team_colour: "64C4FF", first_name: "Logan", last_name: "Sargeant", headshot_url: null, country_code: "USA", session_key: this.sessionKey, meeting_key: this.meetingKey },
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
  }

  setCurrentLap(lap: number): void {
    this.currentLap = Math.max(1, Math.min(lap, this.maxLaps));
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

  // 특정 랩의 랩 데이터 생성
  private generateLapData(lapNumber: number): OpenF1Lap[] {
    return this.drivers.map(driver => {
      const baseTime = this.getBaselapTime(driver.driver_number);
      const variation = (Math.random() - 0.5) * 2; // ±1초 변동
      const lapTime = baseTime + variation;
      
      const sector1 = lapTime * (0.28 + (Math.random() - 0.5) * 0.05); // ~28% of lap
      const sector2 = lapTime * (0.35 + (Math.random() - 0.5) * 0.05); // ~35% of lap  
      const sector3 = lapTime - sector1 - sector2; // 나머지

      return {
        date_start: new Date(Date.now() - (this.maxLaps - lapNumber) * 90000).toISOString(),
        driver_number: driver.driver_number,
        duration_sector_1: sector1,
        duration_sector_2: sector2,
        duration_sector_3: sector3,
        i1_speed: 280 + Math.random() * 40, // 280-320 km/h
        i2_speed: 290 + Math.random() * 35, // 290-325 km/h
        is_pit_out_lap: lapNumber === 1 || (Math.random() < 0.02), // 2% chance of pit stop
        lap_duration: lapTime,
        lap_number: lapNumber,
        meeting_key: this.meetingKey,
        segments_sector_1: this.generateSegments(),
        segments_sector_2: this.generateSegments(),
        segments_sector_3: this.generateSegments(),
        session_key: this.sessionKey,
        st_speed: 310 + Math.random() * 25 // 310-335 km/h speed trap
      };
    });
  }

  // 특정 랩의 인터벌 데이터 생성
  private generateIntervalData(lapNumber: number): OpenF1Interval[] {
    const laps = this.lapData.get(lapNumber) || [];
    
    // 누적 시간으로 포지션 계산
    const cumulativeTimes = this.drivers.map(driver => {
      let totalTime = 0;
      for (let i = 1; i <= lapNumber; i++) {
        const lapData = this.lapData.get(i)?.find(l => l.driver_number === driver.driver_number);
        totalTime += lapData?.lap_duration || this.getBaselapTime(driver.driver_number);
      }
      return { driver_number: driver.driver_number, totalTime };
    });

    // 시간 순으로 정렬하여 포지션 결정
    cumulativeTimes.sort((a, b) => a.totalTime - b.totalTime);
    const leaderTime = cumulativeTimes[0].totalTime;

    return cumulativeTimes.map((data, index) => ({
      date: new Date().toISOString(),
      driver_number: data.driver_number,
      gap_to_leader: index === 0 ? null : data.totalTime - leaderTime,
      interval: index === 0 ? null : data.totalTime - cumulativeTimes[index - 1].totalTime,
      meeting_key: this.meetingKey,
      session_key: this.sessionKey
    }));
  }

  // 드라이버별 기본 랩타임 (차별화를 위해)
  private getBaselapTime(driverNumber: number): number {
    const baseTimes: { [key: number]: number } = {
      1: 78.5,   // VER - 가장 빠름
      81: 78.7,  // PIA
      4: 78.8,   // NOR
      16: 78.9,  // LEC
      44: 79.0,  // HAM
      55: 79.1,  // SAI
      63: 79.2,  // RUS
      11: 79.3,  // PER
      14: 79.5,  // ALO
      10: 79.7,  // GAS
      23: 79.9,  // ALB
      31: 80.0,  // OCO
      18: 80.2,  // STR
      22: 80.3,  // TSU
      3: 80.4,   // RIC
      27: 80.5,  // HUL
      20: 80.7,  // MAG
      77: 80.8,  // BOT
      24: 81.0,  // ZHO
      2: 81.2    // SAR - 가장 느림
    };
    return baseTimes[driverNumber] || 80.0;
  }

  // 세그먼트 성능 데이터 생성 (0=best, 2048=normal, 2049=slow, 2051=fastest overall)
  private generateSegments(): number[] {
    const segments = [];
    for (let i = 0; i < 8; i++) {
      const rand = Math.random();
      if (rand < 0.05) segments.push(2051); // 5% fastest overall (purple)
      else if (rand < 0.15) segments.push(0); // 10% personal best (green)  
      else if (rand < 0.25) segments.push(2049); // 10% slow (red)
      else segments.push(2048); // 75% normal (yellow)
    }
    return segments;
  }

  // 현재 랩의 실시간 드라이버 데이터 생성
  generateRealtimeDriverData(): RealtimeDriverData[] {
    const currentLapData = this.lapData.get(this.currentLap) || [];
    const currentIntervals = this.intervalData.get(this.currentLap) || [];
    
    return this.drivers.map(driver => {
      const lapData = currentLapData.find(l => l.driver_number === driver.driver_number);
      const intervalData = currentIntervals.find(i => i.driver_number === driver.driver_number);
      const position = currentIntervals.findIndex(i => i.driver_number === driver.driver_number) + 1;
      
      // 베스트 랩 찾기
      let bestLap: OpenF1Lap | null = null;
      let bestTime = Infinity;
      for (let i = 1; i <= this.currentLap; i++) {
        const lap = this.lapData.get(i)?.find(l => l.driver_number === driver.driver_number);
        if (lap && lap.lap_duration && lap.lap_duration < bestTime) {
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
          sector1: this.getSectorPerformance(lapData?.segments_sector_1 || []),
          sector2: this.getSectorPerformance(lapData?.segments_sector_2 || []),
          sector3: this.getSectorPerformance(lapData?.segments_sector_3 || []),
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
        }
      };
    });
  }

  // 세그먼트 데이터를 기반으로 섹터 성능 계산
  private getSectorPerformance(segments: number[]): 'fastest' | 'personal_best' | 'normal' | 'slow' {
    if (!segments.length) return 'normal';
    
    if (segments.some(s => s === 2051)) return 'fastest'; // Purple
    if (segments.some(s => s === 0)) return 'personal_best'; // Green
    if (segments.some(s => s === 2049)) return 'slow'; // Red
    return 'normal'; // Yellow
  }

  // 타이어 컴파운드 결정
  private getTireCompound(lapNumber: number, driverNumber: number): string {
    const stints = Math.floor((lapNumber - 1) / 20);
    const compounds = ['SOFT', 'MEDIUM', 'HARD'];
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
      .map(data => ({
        position: data.position,
        driverCode: data.name_acronym,
        teamColor: `#${data.team_colour}`,
        interval: data.current_interval?.gap_to_leader === null 
          ? '--' 
          : `+${data.current_interval.gap_to_leader.toFixed(3)}`,
        intervalToAhead: data.current_interval?.interval === null
          ? ''
          : `+${data.current_interval.interval.toFixed(3)}`,
        currentLapTime: data.latest_lap?.lap_duration 
          ? this.formatTime(data.latest_lap.lap_duration)
          : '--:--:---',
        bestLapTime: data.best_lap?.lap_duration
          ? this.formatTime(data.best_lap.lap_duration)
          : '--:--:---',
        miniSector: {
          sector1: data.sector_performance.sector1,
          sector2: data.sector_performance.sector2,
          sector3: data.sector_performance.sector3,
        },
        tireInfo: {
          pitStops: data.tire_info.pit_stops,
          lapCount: data.tire_info.age,
          compound: data.tire_info.compound,
        }
      }));
  }

  private formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(3);
    return `${minutes}:${secs.padStart(6, '0')}`;
  }
}