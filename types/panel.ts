import { MultiLanguageText } from '@/utils/i18n';
import { Driver, Car } from '@/components/mapbox/types';

export interface PanelData {
  type?: string;
  id?: string;
  name?: string | MultiLanguageText;
  principal?: string | MultiLanguageText;
  location?: string | { city: string | MultiLanguageText; country: string | MultiLanguageText };
  headquarters?: { 
    city: string | MultiLanguageText; 
    country: string | MultiLanguageText; 
    lat: number; 
    lng: number; 
  };
  color?: string;
  drivers?: string[];
  drivers2025?: Driver[];
  car2025?: Car;
  championships2025?: {
    totalPoints: number;
    raceResults: { race: string; points: number }[];
  };
  grandPrix?: string | MultiLanguageText;
  length?: number;
  laps?: number;
  corners?: number;
  totalDistance?: number;
  raceDate?: string;
  lapRecord?: {
    time: string;
    driver: string;
    year: number;
  };
  schedule?: {
    practice1?: string;
    practice2?: string;
    practice3?: string;
    qualifying?: string;
    race: string;
  };
}