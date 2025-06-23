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
  name: string;
  officialName: string;
  grandPrix: string;
  country: string;
  city: string;
  location: {
    lat: number;
    lng: number;
    city: string;
    country: string;
  };
  length: number; // in kilometers
  laps: number;
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
}