import {WeatherData} from '@/src/shared/types/weather';

export interface F1SessionSchedule {
  date: string;
  time: string | null;
}

export interface F1RaceSchedule {
  race?: F1SessionSchedule;
  qualy?: F1SessionSchedule;
  fp1?: F1SessionSchedule;
  fp2?: F1SessionSchedule;
  fp3?: F1SessionSchedule;
  sprintRace?: F1SessionSchedule;
  sprintQualy?: F1SessionSchedule;
}

export interface F1Circuit {
  circuitId: string;
  circuitName: string;
  city: string;
  country: string;
  circuitLength: string;
  corners: number;
  firstParticipationYear: number;
  lapRecord: string;
  fastestLapDriverId: string;
  fastestLapTeamId: string;
  fastestLapYear: number;
  url: string;
}

export interface F1RaceData {
  raceId: string;
  championshipId: string;
  raceName: string;
  circuit: F1Circuit;
  schedule: F1RaceSchedule;
  laps: number;
  round: number;
}

export interface F1ApiResponse {
  season: number;
  races: F1RaceData[];
}

export interface F1NextRaceResponse {
  api: string;
  url: string;
  total: number;
  season: number;
  round: number;
  championship: unknown;
  race: F1RaceData[];
}

export interface F1Team {
  teamId: string;
  teamName: string;
  country: string;
  firstAppearance: number;
  constructorsChampionships: number;
  driversChampionships: number;
  url: string;
}

export interface F1ConstructorStanding {
  classificationId: string;
  teamId: string;
  points: number;
  position: number;
  wins: number;
  team: F1Team;
}

export interface F1ConstructorChampionshipResponse {
  api: string;
  url: string;
  limit: number;
  offset: number;
  total: number;
  season: number;
  championshipId: string;
  constructors_championship: F1ConstructorStanding[];
}

export interface NextRaceSchedule {
  practice1?: string;
  practice2?: string;  
  practice3?: string;
  qualifying?: string;
  race?: string;
  sprintRace?: string;
  sprintQualy?: string;
}

class F1ApiService {
  private baseUrl = 'https://f1api.dev/api';

  async getCurrentRaces(): Promise<F1RaceData[]> {
    try {
      const response = await fetch(`${this.baseUrl}/current`);
      if (!response.ok) {
        console.error(`F1 API Error: ${response.status}`);
        return [];
      }
      
      const data: F1ApiResponse = await response.json();
      return data.races;
    } catch (error) {
      console.error('Failed to fetch F1 race data:', error);
      return [];
    }
  }

  async getNextRace(): Promise<F1RaceData | null> {
    try {
      const response = await fetch(`${this.baseUrl}/current/next`);
      if (!response.ok) {
        console.error(`F1 API Error: ${response.status}`);
        return null;
      }
      
      const data: F1NextRaceResponse = await response.json();
      return data.race && data.race.length > 0 ? data.race[0] : null;
    } catch (error) {
      console.error('Failed to fetch next F1 race data:', error);
      return null;
    }
  }

  async getRaceByCircuitName(circuitName: string): Promise<F1RaceData | null> {
    try {
      if (!circuitName) return null;
      
      const races = await this.getCurrentRaces();
      const searchTerm = circuitName.toLowerCase();
      
      
      // 서킷명과 circuitId/raceId 매핑 테이블
      // noinspection JSNonASCIINames
      const circuitMapping: Record<string, string> = {
        'albert park': 'albert_park',
        'melbourne': 'albert_park', 
        'australia': 'australian',
        'shanghai': 'chinese',
        'shanghai international circuit': 'chinese',
        'china': 'chinese',
        '중국': 'chinese',
        '중국 그랑프리': 'chinese',
        'suzuka': 'japanese',
        'suzuka circuit': 'japanese',
        'suzuka international racing course': 'japanese',
        'japan': 'japanese',
        '일본': 'japanese',
        '일본 그랑프리': 'japanese',
        '스즈카': 'japanese',
        '스즈카 서킷': 'japanese',
        'sakhir': 'sakhir',
        'bahrain': 'bahrain',
        'jeddah': 'jeddah',
        'saudi arabia': 'saudi_arabia',
        'miami': 'miami',
        'imola': 'emilia_romagna',
        'autodromo enzo e dino ferrari': 'emilia_romagna',
        'emilia romagna': 'emilia_romagna',
        '이몰라': 'emilia_romagna',
        'monaco': 'monaco',
        'monte carlo': 'monaco',
        'catalunya': 'catalunya',
        'spain': 'spanish',
        'barcelona': 'catalunya',
        'montreal': 'montreal',
        'canada': 'canadian',
        'red bull ring': 'red_bull_ring',
        'spielberg': 'red_bull_ring',
        'austria': 'austrian',
        'silverstone': 'silverstone',
        'britain': 'british',
        'uk': 'british',
        'spa': 'spa',
        'belgium': 'belgian',
        'hungaroring': 'hungaroring',
        'hungary': 'hungarian',
        'budapest': 'hungaroring',
        'zandvoort': 'zandvoort',
        'netherlands': 'dutch',
        'monza': 'monza',
        'italy': 'italian',
        'baku': 'baku',
        'azerbaijan': 'azerbaijan',
        'marina bay': 'marina_bay',
        'singapore': 'singapore',
        'cota': 'cota',
        'austin': 'cota',
        'texas': 'united_states',
        'usa': 'united_states',
        'hermanos rodriguez': 'hermanos_rodriguez',
        'mexico': 'mexican',
        'interlagos': 'brazilian',
        'autódromo josé carlos pace': 'brazilian',
        'autodromo jose carlos pace': 'brazilian',
        'brazil': 'brazilian',
        'sao paulo': 'brazilian',
        'são paulo': 'brazilian',
        '브라질': 'brazilian',
        '브라질 그랑프리': 'brazilian',
        'las vegas': 'las_vegas',
        'las vegas street circuit': 'las_vegas',
        'vegas': 'las_vegas',
        '라스베이거스': 'las_vegas',
        '라스베이거스 그랑프리': 'las_vegas',
        '라스베이거스 스트리트 서킷': 'las_vegas',
        'lusail': 'qatar',
        'losail': 'qatar',
        'losail international circuit': 'qatar',
        'lusail international circuit': 'qatar',
        'qatar': 'qatar',
        '카타르': 'qatar',
        '카타르 그랑프리': 'qatar',
        '루사일': 'qatar',
        'yas marina': 'yas_marina',
        'abu dhabi': 'abu_dhabi'
      };
      
      // 매핑 테이블에서 검색
      const mappedValue = circuitMapping[searchTerm];
      if (mappedValue) {
        const foundRace = races.find(race => 
          race.raceId.includes(mappedValue) || 
          race.circuit?.circuitId === mappedValue ||
          race.circuit?.circuitId?.includes(mappedValue)
        );
        if (foundRace) {
          return foundRace;
        }
      }
      
      // 직접 검색
      return races.find(race => 
        (race.raceName?.toLowerCase() || '').includes(searchTerm) ||
        (race.raceId?.toLowerCase() || '').includes(searchTerm) ||
        (race.circuit?.circuitName?.toLowerCase() || '').includes(searchTerm) ||
        (race.circuit?.city?.toLowerCase() || '').includes(searchTerm) ||
        (race.circuit?.country?.toLowerCase() || '').includes(searchTerm)
      ) || null;
    } catch (error) {
      console.error('Failed to find race by circuit name:', error);
      return null;
    }
  }

  formatSessionDate(session: F1SessionSchedule | undefined, language: 'ko' | 'en' = 'ko'): string {
    if (!session || !session.date) return 'TBD';
    
    const date = new Date(session.date);
    
    if (language === 'ko') {
      const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const weekday = weekdays[date.getDay()];
      return `${month}/${day} (${weekday})`;
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        weekday: 'short'
      });
    }
  }

  getSessionName(sessionType: keyof F1RaceSchedule, language: 'ko' | 'en' = 'ko'): string {
    const sessionNames = {
      ko: {
        fp1: '연습주행 1',
        fp2: '연습주행 2', 
        fp3: '연습주행 3',
        qualy: '예선',
        sprintRace: '스프린트',
        sprintQualy: '스프린트 예선',
        race: '그랑프리'
      },
      en: {
        fp1: 'Practice 1',
        fp2: 'Practice 2',
        fp3: 'Practice 3', 
        qualy: 'Qualifying',
        sprintRace: 'Sprint',
        sprintQualy: 'Sprint Qualifying',
        race: 'Grand Prix'
      }
    };
    
    return sessionNames[language][sessionType] || sessionType;
  }

  /**
   * F1 API 스케줄 데이터를 NextRaceData 형식으로 변환
   */
  convertScheduleToNextRaceFormat(schedule: F1RaceSchedule): NextRaceSchedule {
    const formatDateTime = (session: F1SessionSchedule | undefined): string | undefined => {
      if (!session?.date || !session?.time) return undefined;
      return `${session.date}T${session.time}`;
    };

    return {
      practice1: formatDateTime(schedule.fp1),
      practice2: formatDateTime(schedule.fp2),
      practice3: formatDateTime(schedule.fp3),
      qualifying: formatDateTime(schedule.qualy),
      race: formatDateTime(schedule.race),
      sprintRace: formatDateTime(schedule.sprintRace),
      sprintQualy: formatDateTime(schedule.sprintQualy)
    };
  }

  /**
   * F1 레이스 날짜/시간을 ISO 형식으로 변환
   */
  formatRaceDateTime(schedule: F1RaceSchedule): string {
    const raceSession = schedule.race;
    if (!raceSession?.date) {
      return new Date().toISOString();
    }

    const time = raceSession.time || '13:00:00Z';
    const formattedTime = time.endsWith('Z') ? time : `${time}Z`;
    return `${raceSession.date}T${formattedTime}`;
  }

  /**
   * 컨스트럭터 챔피언십 데이터 가져오기
   * 
   * API 제공 데이터:
   * - position: 컨스트럭터 순위
   * - points: 총 포인트 
   * - wins: 승리 수
   * - team: 팀 정보 (teamName, country, championships 등)
   * 
   * API에서 제공하지 않는 데이터:
   * - 포디움 수 (podiums)
   * - 폴 포지션 수 (pole positions)
   * - 최고 기록 수 (fastest laps)
   * 
   * 추가 통계 데이터가 필요한 경우 다른 API 소스 연동 필요:
   * - Ergast API: http://ergast.com/mrd/
   * - OpenF1 API: https://openf1.org/
   */
  async getConstructorChampionship(): Promise<F1ConstructorStanding[]> {
    try {
      const response = await fetch(`${this.baseUrl}/current/constructors-championship`);
      if (!response.ok) {
        console.error(`F1 Constructor Championship API Error: ${response.status}`);
        return [];
      }
      
      const data: F1ConstructorChampionshipResponse = await response.json();
      return data.constructors_championship || [];
    } catch (error) {
      console.error('Failed to fetch constructor championship data:', error);
      return [];
    }
  }

  /**
   * 팀 ID로 컨스트럭터 챔피언십 데이터 찾기
   */
  async getTeamChampionshipData(teamId: string): Promise<F1ConstructorStanding | null> {
    try {
      const standings = await this.getConstructorChampionship();
      
      // 팀 ID 매핑 테이블 (프로젝트 ID -> F1 API ID)
      const teamIdMapping: Record<string, string> = {
        'mclaren': 'mclaren',
        'red-bull': 'red_bull',
        'ferrari': 'ferrari', 
        'mercedes': 'mercedes',
        'aston-martin': 'aston_martin',
        'alpine': 'alpine',
        'haas': 'haas',
        'racing-bulls': 'rb',  // 수정: racing-bulls -> rb
        'williams': 'williams',
        'sauber': 'sauber'
      };

      const apiTeamId = teamIdMapping[teamId];
      if (!apiTeamId) return null;

      return standings.find(standing => 
        standing.teamId === apiTeamId || 
        standing.team?.teamId === apiTeamId
      ) || null;
    } catch (error) {
      console.error('Failed to get team championship data:', error);
      return null;
    }
  }

  /**
   * 레이스 종료 시간 계산 (레이스 시작 + 2시간)
   */
  calculateRaceEndTime(raceData: F1RaceData): Date {
    const raceStartTime = new Date(this.formatRaceDateTime(raceData.schedule));
     // 2시간 후
    return new Date(raceStartTime.getTime() + (2 * 60 * 60 * 1000));
  }

  /**
   * 레이스가 종료되었는지 확인 (종료 후 12시간 경과)
   */
  isRaceCompleted(raceData: F1RaceData): boolean {
    const now = new Date();
    const switchTime = new Date(this.calculateRaceEndTime(raceData).getTime() + (12 * 60 * 60 * 1000)); // 종료 후 12시간
    
    return now >= switchTime;
  }

  /**
   * 다음 레이스 가져오기 (완료된 레이스 제외)
   */
  async getNextRaceExcludingCompleted(): Promise<F1RaceData | null> {
    try {
      const races = await this.getCurrentRaces();
      if (races.length === 0) return null;

      // 현재 시간 기준으로 정렬
      const sortedRaces = races.sort((a, b) => {
        const dateA = new Date(this.formatRaceDateTime(a.schedule));
        const dateB = new Date(this.formatRaceDateTime(b.schedule));
        return dateA.getTime() - dateB.getTime();
      });

      // 완료되지 않은 다음 레이스 찾기
      for (const race of sortedRaces) {
        if (!this.isRaceCompleted(race)) {
          return race;
        }
      }

      return null;
    } catch (error) {
      console.error('Failed to get next race excluding completed:', error);
      return null;
    }
  }
}

class OpenF1ApiService {
  private baseUrl = 'https://api.openf1.org/v1';
  
  // 서킷명과 OpenF1 meeting_key 매핑 (2025 시즌)
  private circuitToMeetingKey: Record<string, number> = {
    'albert_park': 1254,
    'melbourne': 1254,
    'australia': 1254,
    'sakhir': 1257,
    'bahrain': 1257,
    'shanghai': 1255,
    'china': 1255,
    '중국': 1255,
    'suzuka': 1256,
    'japan': 1256,
    '일본': 1256,
    '스즈카': 1256,
    'jeddah': 1258,
    'saudi arabia': 1258,
    'miami': 1259,
    'imola': 1260,
    '이몰라': 1260,
    'monte_carlo': 1261,
    'monaco': 1261,
    'catalunya': 1262,
    'spain': 1262,
    'barcelona': 1262,
    'montreal': 1263,
    'canada': 1263,
    'spielberg': 1264,
    'austria': 1264,
    'red bull ring': 1264,
    'silverstone': 1277,
    'britain': 1277,
    'uk': 1277,
    'spa': 1265,
    'spa-francorchamps': 1265,
    'circuit de spa-francorchamps': 1265,
    'belgium': 1265,
    '벨기에': 1265,
    '스파': 1265,
    '스파-프랑코샹': 1265,
    '스파-프랑코샹 서킷': 1265,
    '벨기에 그랑프리': 1265,
    'belgian grand prix': 1265,
    'hungaroring': 1266,
    'hungary': 1266,
    'budapest': 1266,
    'zandvoort': 1267,
    'netherlands': 1267,
    'monza': 1268,
    'italy': 1268,
    'baku': 1269,
    'azerbaijan': 1269,
    'marina_bay': 1270,
    'singapore': 1270,
    'cota': 1271,
    'austin': 1271,
    'texas': 1271,
    'usa': 1271,
    'hermanos_rodriguez': 1272,
    'mexico': 1272,
    'interlagos': 1273,
    'brazil': 1273,
    '브라질': 1273,
    'sao paulo': 1273,
    'las_vegas': 1274,
    'vegas': 1274,
    '라스베이거스': 1274,
    'lusail': 1275,
    'qatar': 1275,
    '카타르': 1275,
    'yas_marina': 1276,
    'abu dhabi': 1276
  };

  async getWeatherData(meetingKey: number): Promise<WeatherData | null> {
    try {
      const response = await fetch(`${this.baseUrl}/weather?meeting_key=${meetingKey}`);
      if (!response.ok) {
        console.error(`OpenF1 Weather API Error: ${response.status}`);
        return null;
      }
      
      const data: WeatherData[] = await response.json();
      if (data.length === 0) return null;
      
      // 날짜 기준으로 정렬해서 가장 최신 데이터 선택
      const sortedData = data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      return sortedData[0];
    } catch (error) {
      console.error('Failed to fetch weather data:', error);
      return null;
    }
  }

  async getCurrentMeetingKey(): Promise<number | undefined> {
    try {
      const response = await fetch(`${this.baseUrl}/meetings?year=${new Date().getFullYear()}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        // 타임아웃 설정 (5초) - 빠른 실패로 UX 개선
        signal: AbortSignal.timeout(5000)
      });
      
      if (!response.ok) {
        console.warn(`API response not ok: ${response.status} ${response.statusText}`);
        return undefined;
      }
      
      const meetings = await response.json();
      const now = new Date();
      
      const currentMeeting = meetings.find((meeting: { date_start: string; date_end: string; meeting_key: number }) => {
        const startDate = new Date(meeting.date_start);
        const endDate = new Date(meeting.date_end);
        return now >= startDate && now <= endDate;
      });
      
      return currentMeeting?.meeting_key;
    } catch (error) {
      if (error instanceof DOMException && error.name === 'TimeoutError') {
        console.error('API request timeout - OpenF1 API may be slow or unavailable');
      } else if (error instanceof TypeError && error.message === 'Failed to fetch') {
        console.error('Network error - Check internet connection or OpenF1 API availability');
      } else {
        console.error('Failed to fetch current meeting key:', error);
      }
      return undefined;
    }
  }

  getMeetingKeyByCircuitName(circuitName: string): number | undefined {
    if (!circuitName) return undefined;
    
    const searchTerm = circuitName.toLowerCase();
    
    // 직접 매핑 검색
    if (this.circuitToMeetingKey[searchTerm]) {
      return this.circuitToMeetingKey[searchTerm];
    }
    
    // 부분 매칭 검색
    const mappingKey = Object.keys(this.circuitToMeetingKey).find(key => 
      key.includes(searchTerm) || searchTerm.includes(key)
    );
    
    return mappingKey ? this.circuitToMeetingKey[mappingKey] : undefined;
  }

  getMeetingKeyByRaceData(raceData: { 
    name?: { ko?: string; en?: string } | string; 
    grandPrix?: { ko?: string; en?: string } | string;
    location?: { city?: { ko?: string; en?: string } | string; country?: { ko?: string; en?: string } | string };
    circuit?: { circuitId?: string; circuitName?: string; city?: string }; 
    raceId?: string 
  }): number | undefined {
    if (!raceData) {
      return undefined;
    }
    
    // NextRaceData와 F1ApiData 모두 지원하도록 다양한 방법으로 서킷 이름 추출
    const extractString = (value: { ko?: string; en?: string } | string | undefined): string | undefined => {
      if (typeof value === 'string') return value;
      if (value && typeof value === 'object') return value.ko || value.en;
      return undefined;
    };

    const possibleNames = [
      // NextRaceData 형식에서 추출
      extractString(raceData.name)?.toLowerCase(),
      extractString(raceData.grandPrix)?.toLowerCase(),
      extractString(raceData.location?.city)?.toLowerCase(),
      extractString(raceData.location?.country)?.toLowerCase(),
      // F1ApiData 형식에서 추출 (기존 호환성)
      raceData.circuit?.circuitId,
      raceData.circuit?.circuitName?.toLowerCase(),
      raceData.raceId,
      raceData.circuit?.city?.toLowerCase()
    ].filter((name): name is string => Boolean(name));
    
    for (const name of possibleNames) {
      const meetingKey = this.getMeetingKeyByCircuitName(name);
      if (meetingKey) {
        return meetingKey;
      }
    }
    return undefined;
  }
}

export const f1ApiService = new F1ApiService();
export const openF1ApiService = new OpenF1ApiService();