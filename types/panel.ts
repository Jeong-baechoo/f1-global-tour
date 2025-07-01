import type { Driver, Car } from '@/components/mapbox/types';
import type { LocalizedText } from '@/utils/i18n';

export interface PanelData {
  type?: string;
  id?: string;
  name?: LocalizedText;
  principal?: LocalizedText;
  location?: LocalizedText | { city: LocalizedText; country: LocalizedText };
  headquarters?: { city: LocalizedText; country: LocalizedText; lat: number; lng: number };
  color?: string;
  drivers?: string[];
  drivers2025?: Driver[];
  car2025?: Car;
  championships2025?: {
    totalPoints: number;
    raceResults: { race: string; points: number }[];
  };
  grandPrix?: LocalizedText;
  length?: number;
  laps?: number;
  corners?: number;
  totalDistance?: number;
  raceDate?: string;
  lapRecord?: {
    time: string;
    driver: string;
    year: string;
  };
  schedule?: {
    practice1?: string;
    practice2?: string;
    practice3?: string;
    qualifying?: string;
    race?: string;
  };
}