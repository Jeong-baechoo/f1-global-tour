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
  
  // Circuit marker visibility - Mobile
  CIRCUIT_FADE_START_MOBILE: 9,
  CIRCUIT_FADE_MID_MOBILE: 10,
  CIRCUIT_HIDDEN_MOBILE: 11,
  
  // Circuit marker visibility - Desktop
  CIRCUIT_FADE_START_DESKTOP: 11.5,
  CIRCUIT_FADE_MID_DESKTOP: 12,
  CIRCUIT_HIDDEN_DESKTOP: 13.5,
  
  // Track visibility
  TRACK_VISIBLE: 10,
  
  // DRS zone visibility
  DRS_VISIBLE_MOBILE: 9,
  DRS_VISIBLE_DESKTOP: 14,
  
  // General fade thresholds - Mobile
  FADE_START_MOBILE: 9,
  FADE_MID_MOBILE: 10,
  HIDE_MOBILE: 11,
  
  // General fade thresholds - Desktop
  FADE_START_DESKTOP: 11.5,
  FADE_MID_DESKTOP: 12,
  HIDE_DESKTOP: 13.5
} as const;


// Zoom level states enum
export enum ZoomLevel {
  LOW = 'low',
  NORMAL = 'normal',
  FADE_1 = 'fade-1',
  FADE_2 = 'fade-2',
  HIDDEN = 'hidden'
}