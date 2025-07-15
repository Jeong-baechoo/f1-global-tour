// Animation related constants

// Animation speeds - camera movement speeds
export const ANIMATION_SPEEDS = {
  flyTo: 0.6,        // Regular flyTo speed
  flyToGentle: 0.8,  // Gentle flyTo speed
  flyToReset: 0.8,   // Reset view flyTo speed
  curve: 1           // Curve degree
} as const;

// Animation timings in milliseconds
export const ANIMATION_TIMINGS = {
  // UI interactions
  HOVER_DELAY: 300,
  TRANSITION_DURATION: 300,
  
  // Map setup delays
  MARKER_DELAY: 100,
  LANGUAGE_CHANGE_DELAY: 50,
  MAP_READY_CHECK: 50,
  MAP_READY_DELAY: 100,
  
  // Track animation
  TRACK_DRAW_DELAY: 500,
  TRACK_ANIMATION_DURATION: 11000,
  DRS_MARKER_DELAY: 500,
  
  // Globe rotation
  SECONDS_PER_REVOLUTION: 240,
  ROTATION_SPEED: 0.07
} as const;

// Animation configuration
export const ANIMATION_CONFIG = {
  spinEnabled: true,
  secondsPerRevolution: ANIMATION_TIMINGS.SECONDS_PER_REVOLUTION,
  maxSpinZoom: 5,
  slowSpinZoom: 3,
  trackAnimationDuration: ANIMATION_TIMINGS.TRACK_ANIMATION_DURATION,
  rotationSpeed: ANIMATION_TIMINGS.ROTATION_SPEED
} as const;


