export interface DriverTiming {
  position: number;
  driverCode: string; // 3-letter code like 'PIA', 'NOR', 'VER'
  teamColor: string; // hex color for the left bar
  interval: string; // "--" for leader, "+1.290", "+7.499" etc
  intervalToAhead: string; // for second line of interval
  currentLapTime: string; // "1:14.119"
  bestLapTime: string; // "1:13.965"
  miniSector: {
    sector1: 'fastest' | 'personal_best' | 'normal' | 'slow' | 'none'; // purple, green, yellow, gray, transparent
    sector2: 'fastest' | 'personal_best' | 'normal' | 'slow' | 'none';
    sector3: 'fastest' | 'personal_best' | 'normal' | 'slow' | 'none';
  };
  tireInfo: {
    pitStops: number; // 1 for "1PIT", -1 for "-PIT"
    lapCount: number; // 20 for "20LAP"
    compound: 'SOFT' | 'MEDIUM' | 'HARD' | 'INTERMEDIATE' | 'WET';
  };
}

export interface DriverInfoPanelProps {
  isReplayMode: boolean;
  drivers: DriverTiming[];
  selectedDrivers?: string[]; // highlighted driver codes
  onDriverSelect?: (driverCode: string) => void;
  className?: string;
}