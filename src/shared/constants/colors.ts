// Color constants

// F1 brand colors
export const F1_COLORS = {
  RED: '#FF1801',      // Official F1 red
  WHITE: '#FFFFFF',
  BLACK: '#000000'
} as const;

// Sector colors (F1 standard)
export const SECTOR_COLORS = {
  SECTOR_1: '#FF0000', // Red
  SECTOR_2: '#0000FF', // Blue  
  SECTOR_3: '#FFFF00', // Yellow
  SECTOR_4: '#00FF00', // Green (if exists)
} as const;

// DRS zone colors
export const DRS_COLORS = {
  ZONE_INACTIVE: '#003300',
  ZONE_LOW: '#006600',
  ZONE_ACTIVE: '#00FF00',
  ZONE_MAX: '#00FFFF'
} as const;

// Circuit colors by ID
export const CIRCUIT_COLORS: { [key: string]: string } = {
  // Europe
  'austria': '#FF1801',      // Austria - Red Bull color
  'nurburgring': '#000000',  // Germany - Black
  'monaco': '#dc2626',       // Monaco - Red
  'britain': '#1e40af',      // Britain - Blue
  'italy': '#16a34a',        // Italy - Green
  'belgium': '#f59e0b',      // Belgium - Yellow
  'spain': '#dc2626',        // Spain - Red
  'hungary': '#16a34a',      // Hungary - Green
  'netherlands': '#ea580c',  // Netherlands - Orange
  'emilia-romagna': '#0ea5e9', // Italy Imola - Sky blue

  // Asia/Middle East
  'bahrain': '#dc2626',      // Bahrain - Red
  'saudi-arabia': '#16a34a', // Saudi Arabia - Green
  'azerbaijan': '#0ea5e9',   // Azerbaijan - Sky blue
  'singapore': '#dc2626',    // Singapore - Red
  'japan': '#dc2626',        // Japan - Red
  'qatar': '#8b5cf6',        // Qatar - Purple
  'abu-dhabi': '#0ea5e9',    // Abu Dhabi - Sky blue
  'china': '#f59e0b',        // China - Yellow

  // Americas
  'usa': '#1e40af',          // USA Austin - Blue
  'usa-miami': '#ec4899',    // USA Miami - Pink
  'usa-vegas': '#f59e0b',    // USA Las Vegas - Yellow/Gold
  'mexico': '#16a34a',       // Mexico - Green
  'brazil': '#f59e0b',       // Brazil - Yellow
  'canada': '#dc2626',       // Canada - Red

  // Oceania
  'australia': '#1e40af',    // Australia - Blue
};

// Default circuit color fallback
export const DEFAULT_CIRCUIT_COLOR = F1_COLORS.RED;

// Helper function to get circuit color
export const getCircuitColor = (circuitId: string): string => {
  return CIRCUIT_COLORS[circuitId] || DEFAULT_CIRCUIT_COLOR;
};