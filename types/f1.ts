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
  country: string;
  city: string;
  location: {
    lat: number;
    lng: number;
  };
  trackLength: number; // in kilometers
  lapRecord: {
    time: string;
    driver: string;
    year: number;
  };
  raceDate2024: string; // ISO date string
  round: number;
}