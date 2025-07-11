// Track-specific constants

// Track animation configuration
export const TRACK_CONFIG = {
  // Animation settings
  ANIMATION_DURATION: 11000,
  INTERPOLATION_FACTOR: 5,
  
  // Sector detection
  SECTOR_THRESHOLD: 0.01,
  MAX_DISTANCE_THRESHOLD: 0.1,
  
  // Visibility
  MIN_ZOOM: 10,
  
  // Line styles
  LINE_BLUR: 1,
  
  // DRS zone percentage
  DRS_ZONE_PERCENTAGE: 0.1  // 10% of track
} as const;

// Hardcoded sector 3 positions for specific circuits
export const HARDCODED_SECTOR3_POSITIONS: { [key: string]: number } = {
  'monaco': 0.72,
  'netherlands': 0.68,
  'singapore': 0.75,
  'saudi-arabia': 0.73
};

// DRS zone types
export const DRS_ZONE_TYPES = {
  DYNAMIC: 'dynamic',
  STATIC: 'static'
} as const;

// Special circuit configurations
export const SPECIAL_CIRCUIT_CONFIG: { [key: string]: { drsZones?: string } } = {
  'nurburgring': {
    drsZones: DRS_ZONE_TYPES.DYNAMIC
  }
};