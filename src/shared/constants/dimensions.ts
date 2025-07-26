// Dimension constants

// Marker dimensions
export const MARKER_DIMENSIONS = {
  // General marker dot
  DOT_SIZE: 12,
  DOT_OFFSET: -6,      // Half of dot size for centering
  PULSE_SIZE: 20,
  LINE_HEIGHT: 1,
  
  // Team marker dimensions
  TEAM_MARKER: {
    // Desktop
    width: '80px',
    height: '95px',
    boxWidth: '80px',
    boxHeight: '80px',
    borderRadius: '4px',
    borderWidth: '3px',
    
    // Mobile
    mobileWidth: '60px',
    mobileHeight: '71px',
    mobileBoxWidth: '60px',
    mobileBoxHeight: '60px',
    
    // Simple mode (zoomed out)
    simpleSize: '12px',
    simpleBorderRadius: '50%',
    simpleBorderWidth: '2px'
  },
  
  // Next race marker
  NEXT_RACE_MARKER: {
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    borderWidth: '3px',
    mobileWidth: '45px',
    mobileHeight: '45px'
  },
  
  // Circuit marker
  CIRCUIT_MARKER: {
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    borderWidth: '3px',
    mobileWidth: '45px',
    mobileHeight: '45px'
  }
} as const;

// Track line widths
export const TRACK_LINE_WIDTHS = {
  // Ghost track
  GHOST: {
    base: 6,
    mid: 8,
    high: 10
  },
  // Main track
  MAIN: {
    base: 3,
    mid: 5,
    high: 7
  }
} as const;

// isMobile function removed - use the one from @/src/shared/utils/viewport instead