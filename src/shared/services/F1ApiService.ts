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
}

export const f1ApiService = new F1ApiService();