import type { LocalizedText } from '@/utils/i18n';

// 공통 위치 타입
export interface Location {
  city: LocalizedText;
  country: LocalizedText;
  lat: number;
  lng: number;
}

// 드라이버 정보
export interface Driver {
  name: string;
  number: number;
  nationality: string;
  image: string;
}

// 차량 정보
export interface Car {
  name: string;
  image: string;
}

// 챔피언십 정보
export interface Championship {
  totalPoints?: number;
  raceResults?: RaceResult[];
  constructors?: number;
  drivers?: number;
}

// 레이스 결과
export interface RaceResult {
  race: string;
  points: number;
}

// 랩 레코드
export interface LapRecord {
  time: string;
  driver: string;
  year: number;
}

// 고도 정보
export interface Elevation {
  highest: number;
  lowest: number;
  difference: number;
}

// 색상 정보
export interface Colors {
  primary: string;
  secondary: string;
}