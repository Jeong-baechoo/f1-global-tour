// Circuit-specific constants

// Circuit view configuration
export const CIRCUIT_VIEW = {
  // Zoom levels
  ZOOM: {
    MOBILE: 2,
    DESKTOP: 6
  },
  
  // Camera angles
  PITCH: 30,
  
  // Animation delays
  DRAW_DELAY: 500,
  MARKER_DELAY: 500
} as const;

// Circuit marker states
export const CIRCUIT_MARKER_STATES = {
  DEFAULT: 'default',
  HOVER: 'hover',
  ACTIVE: 'active',
  NEXT_RACE: 'next-race'
} as const;