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

// Device-specific zoom thresholds for better UX
export const ZOOM_THRESHOLDS = {
  // Global thresholds (device-independent)
  GLOBE_TO_2D: 5.5,
  TEAM_MARKER_SIMPLE: 5,
  TRACK_VISIBLE: 10,
  
  // Circuit marker visibility thresholds
  CIRCUIT_MARKERS: {
    MOBILE: {
      FADE_START: 9,
      FADE_MID: 10,
      HIDDEN: 11
    },
    DESKTOP: {
      FADE_START: 11.5,
      FADE_MID: 12,
      HIDDEN: 13.5
    }
  },
  
  // DRS zone visibility thresholds  
  DRS_ZONES: {
    MOBILE: 9,
    DESKTOP: 14
  }
} as const;

// Utility function to get device-specific zoom thresholds
export const getZoomThresholds = (isMobile: boolean) => ({
  circuitMarkers: isMobile ? ZOOM_THRESHOLDS.CIRCUIT_MARKERS.MOBILE : ZOOM_THRESHOLDS.CIRCUIT_MARKERS.DESKTOP,
  drsZones: isMobile ? ZOOM_THRESHOLDS.DRS_ZONES.MOBILE : ZOOM_THRESHOLDS.DRS_ZONES.DESKTOP
});

// Zoom level states enum
export enum ZoomLevel {
  LOW = 'low',
  NORMAL = 'normal',
  FADE_1 = 'fade-1',
  FADE_2 = 'fade-2',
  HIDDEN = 'hidden'
}