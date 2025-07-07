// Re-export all constants from the new modular structure
export * from './constants/index';

// Deprecated - These are kept for backward compatibility
// Please use the new imports from './constants/index' instead
// TODO: Remove these after updating all imports

// Legacy marker styles - moved to dimensions.ts
export const MARKER_STYLES = {
  redBullMarker: {
    width: '80px',
    height: '95px',
    boxWidth: '80px',
    boxHeight: '80px',
    borderRadius: '4px',
    border: '3px solid #1e3a8a',
    backgroundColor: 'white',
    // Mobile sizes
    mobileWidth: '60px',
    mobileHeight: '71px',
    mobileBoxWidth: '60px',
    mobileBoxHeight: '60px'
  },
  nextRaceMarker: {
    width: '60px',
    height: '60px',
    backgroundColor: '#FF1801',
    borderRadius: '50%',
    border: '3px solid #FFFFFF',
    // Mobile sizes
    mobileWidth: '45px',
    mobileHeight: '45px'
  },
  circuitMarker: {
    width: '60px',
    height: '60px',
    backgroundColor: '#1e293b',
    borderRadius: '50%',
    border: '3px solid #dc2626',
    // Mobile sizes
    mobileWidth: '45px',
    mobileHeight: '45px'
  }
};
