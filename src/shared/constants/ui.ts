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

// UI timing constants
export const UI_TIMING = {
  LANGUAGE_CHANGE_DELAY: 100,
  SECTOR_MARKER_ANIMATION_DELAY: 300,
  DRS_ANIMATION_DELAY: 500,
  ZOOM_THRESHOLD_TRACK_VISIBLE: 10,
  SECTOR_MARKER_DISPLAY_ZOOM: 10
} as const;

// Panel animation constants
export const PANEL_ANIMATION = {
  ENTER_DURATION: 300,
  EXIT_DURATION: 200
} as const;

