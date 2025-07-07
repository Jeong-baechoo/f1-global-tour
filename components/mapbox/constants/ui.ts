// UI related constants

// Opacity values used throughout the app
export const OPACITY = {
  HIDDEN: 0,
  VERY_LOW: 0.1,
  LOW: 0.3,
  MEDIUM_LOW: 0.4,
  MEDIUM: 0.5,
  MEDIUM_HIGH: 0.7,
  HIGH: 0.8,
  FULL: 1
} as const;

// Blur values
export const BLUR = {
  NONE: 0,
  LIGHT: 1,
  MEDIUM: 2,
  HEAVY: 3
} as const;

// Timeout values
export const TIMEOUTS = {
  markerDelay: 100,
  mapReadyCheck: 50,
  mapReadyDelay: 100,
  languageChangeDelay: 50,
  trackDrawDelay: 500,
  drsMarkerDelay: 500,
  imageLoadTimeout: 100
} as const;

// Z-index values for layering
export const Z_INDEX = {
  MAP: 0,
  MARKERS: 10,
  CONTROLS: 20,
  OVERLAY: 30,
  MODAL: 40
} as const;