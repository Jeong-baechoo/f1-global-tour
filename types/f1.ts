import { MultiLanguageText } from '@/utils/i18n';

export interface Team {
  id: string;
  name: string;
  fullName: string;
  colors: {
    primary: string;
    secondary: string;
  };
  headquarters: {
    city: string;
    country: string;
    lat: number;
    lng: number;
  };
  teamPrincipal: string;
  foundingYear: number;
  description: string;
}

export interface Circuit {
  id: string;
  name: string | MultiLanguageText;
  officialName: string | MultiLanguageText;
  grandPrix: string | MultiLanguageText;
  country: string;
  city: string;
  location: {
    lat: number;
    lng: number;
    city: string | MultiLanguageText;
    country: string | MultiLanguageText;
  };
  length: number; // in kilometers
  laps: number;
  corners: number;
  totalDistance: number;
  lapRecord: {
    time: string;
    driver: string;
    year: number;
  };
  raceDate2025: string | null; // ISO date string
  round: number | null;
  sprint?: boolean;
  elevation?: {
    highest: number;
    lowest: number;
    difference: number;
  };
  schedule?: {
    practice1?: string;
    practice2?: string;
    practice3?: string;
    qualifying?: string;
    race: string;
  };
}