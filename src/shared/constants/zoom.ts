// Zoom level constants

// Main zoom level definitions
export const ZOOM_LEVELS = {
  // View levels
  globe: 1.5,
  country: 5,
  region: 10,
  city: 12,
  circuit: 14,
  detail: 16,
  
  // Feature-specific zoom levels
  teamHQ: {
    mobile: 15,
    desktop: 18
  },
  circuitView: {
    mobile: 2,
    desktop: 6
  }
} as const;

// Zoom thresholds for visibility changes
export const ZOOM_THRESHOLDS = {
  // Globe to 2D transition
  GLOBE_TO_2D: 5.5,
  
  // Team marker display mode change
  TEAM_MARKER_SIMPLE: 5,
  
  // Circuit marker visibility
  CIRCUIT_FADE_START: 11.5,
  CIRCUIT_FADE_MID: 12,
  CIRCUIT_HIDDEN: 13.5,
  
  // Track visibility
  TRACK_VISIBLE: 10,
  
  // DRS zone visibility
  DRS_VISIBLE: 14,
  
  // General fade thresholds
  FADE_START: 12,
  FADE_MID: 13,
  HIDE: 14
} as const;


// Zoom level states enum
export enum ZoomLevel {
  LOW = 'low',
  NORMAL = 'normal',
  FADE_1 = 'fade-1',
  FADE_2 = 'fade-2',
  HIDDEN = 'hidden'
}