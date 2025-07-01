// Zoom level thresholds
export const ZOOM_THRESHOLDS = {
  GLOBE_TO_2D: 5.5,    // Mapbox transitions from 3D globe to 2D map
  FADE_START: 12,      // Start fading out markers
  FADE_MID: 13,        // Mid-fade point
  HIDE: 14            // Completely hide markers
} as const;

// Globe occlusion settings
export const OCCLUSION_SETTINGS = {
  BASE_THRESHOLD: 90,  // Base longitude difference threshold in degrees
  PITCH_FACTOR: 0.3,   // How much pitch affects occlusion threshold
  RENDER_THROTTLE: 32  // Milliseconds between render checks (~2 frames at 60fps)
} as const;

// Animation timings
export const ANIMATION_TIMINGS = {
  HOVER_DELAY: 300,    // Delay before removing hover effect
  TRANSITION_DURATION: 300  // CSS transition duration
} as const;

// Marker dimensions
export const MARKER_DIMENSIONS = {
  DOT_SIZE: 12,
  DOT_OFFSET: -6,      // Half of dot size for centering
  PULSE_SIZE: 20,
  LINE_HEIGHT: 1
} as const;

// Enums
export enum ZoomLevel {
  LOW = 'low',
  NORMAL = 'normal',
  FADE_1 = 'fade-1',
  FADE_2 = 'fade-2',
  HIDDEN = 'hidden'
}

export enum MarkerOcclusionState {
  VISIBLE = 'visible',
  OCCLUDED = 'occluded'
}