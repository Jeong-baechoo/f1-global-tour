// OpenF1 API 데이터 타입 정의
export interface OpenF1Interval {
  date: string; // ISO 8601 UTC format
  driver_number: number;
  gap_to_leader: number | null; // seconds, null for leader
  interval: number | null; // seconds to car ahead, null for leader
  meeting_key: number;
  session_key: number;
}

export interface OpenF1Lap {
  date_start: string; // ISO 8601 UTC format
  driver_number: number;
  duration_sector_1: number | null; // seconds
  duration_sector_2: number | null; // seconds
  duration_sector_3: number | null; // seconds
  i1_speed: number | null; // km/h
  i2_speed: number | null; // km/h
  is_pit_out_lap: boolean;
  lap_duration: number | null; // total lap time in seconds
  lap_number: number;
  meeting_key: number;
  segments_sector_1: number[]; // mini-sector performance indicators
  segments_sector_2: number[];
  segments_sector_3: number[];
  session_key: number;
  st_speed: number | null; // speed trap km/h
}

export interface OpenF1Driver {
  driver_number: number;
  broadcast_name: string;
  full_name: string;
  name_acronym: string;
  team_name: string;
  team_colour: string;
  first_name: string;
  last_name: string;
  headshot_url: string | null;
  country_code: string;
  session_key: number;
  meeting_key: number;
}

export interface OpenF1Session {
  circuit_key: number;
  circuit_short_name: string;
  country_code: string;
  country_name: string;
  date_end: string;
  date_start: string;
  gmt_offset: string;
  location: string;
  meeting_key: number;
  session_key: number;
  session_name: string;
  session_type: string;
  year: number;
}

// 실시간 업데이트를 위한 확장 타입
export interface RealtimeDriverData {
  driver_number: number;
  position: number;
  name_acronym: string;
  team_colour: string;
  current_lap: number;
  current_interval: OpenF1Interval | null;
  latest_lap: OpenF1Lap | null;
  best_lap: OpenF1Lap | null;
  sector_times: {
    sector1: number | null;
    sector2: number | null;
    sector3: number | null;
  };
  sector_performance: {
    sector1: 'fastest' | 'personal_best' | 'normal' | 'slow' | 'none';
    sector2: 'fastest' | 'personal_best' | 'normal' | 'slow' | 'none';
    sector3: 'fastest' | 'personal_best' | 'normal' | 'slow' | 'none';
  };
  tire_info: {
    compound: 'SOFT' | 'MEDIUM' | 'HARD' | 'INTERMEDIATE' | 'WET';
    age: number; // laps on current tires
    pit_stops: number;
  };
  speeds: {
    i1_speed: number | null;
    i2_speed: number | null;
    st_speed: number | null;
  };
  telemetry: {
    speed: number; // km/h
    gear: number; // 1-8, 0 for neutral, -1 for reverse  
    throttle: number; // 0-100%
    brake: number; // 0-100%
    drs_enabled: boolean;
    drs_available: boolean;
  };
}