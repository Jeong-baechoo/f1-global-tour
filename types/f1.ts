import type { LocalizedText } from '@/utils/i18n';

export interface Team {
  id: string;
  name: LocalizedText;
  fullName: string;
  colors: {
    primary: string;
    secondary: string;
  };
  headquarters: {
    city: LocalizedText;
    country: LocalizedText;
    lat: number;
    lng: number;
  };
  teamPrincipal: LocalizedText;
  foundingYear: number;
  description: string;
  championships2025?: {
    totalPoints: number;
    raceResults: { race: string; points: number }[];
  };
}

export interface Circuit {
  id: string;
  name: LocalizedText;
  officialName: string;
  grandPrix: LocalizedText;
  country: string;
  city: string;
  location: {
    lat: number;
    lng: number;
    city: LocalizedText;
    country: LocalizedText;
  };
  length: number; // in kilometers
  laps: number;
  corners: number;
  lapRecord: {
    time: string;
    driver: string;
    year: number;
  };
  raceDate2025: string | null; // ISO date string
  round: number | null;
  sprint?: boolean;
  totalDistance: number;
  elevation?: {
    highest: number;
    lowest: number;
    difference: number;
  };
}