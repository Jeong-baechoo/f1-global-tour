// Re-export all track modules for easy importing
export { TrackRenderer } from './TrackRenderer';
export { DRSZoneManager } from './drs/DRSZoneManager';
export { DRSAnimationController } from './animation/DRSAnimationController';
export { SectorTrackManager } from './sector/SectorTrackManager';
export { TrackEventBus } from './events/TrackEventBus';
export { trackStateManager } from './state/TrackStateManager';
export { ElevationTrackManager } from './elevation/ElevationTrackManager';

// Main function that replaces the old drawAnimatedTrack
import mapboxgl from 'mapbox-gl';
import { TrackRenderer } from './TrackRenderer';
import { TrackDrawOptions as OldTrackDrawOptions } from '@/src/shared/types/circuit';
import { trackStateManager } from './state/TrackStateManager';
import { TrackEventBus } from './events/TrackEventBus';

// Adapter function to maintain backward compatibility
export const drawAnimatedTrack = async (
  map: mapboxgl.Map,
  options: OldTrackDrawOptions
) => {
  // Convert old options format to new format
  const newOptions = {
    coordinates: options.trackCoordinates,
    trackId: options.trackId,
    color: options.color,
    width: 5, // default width
    animationDelay: options.delay,
    onComplete: options.onComplete,
    circuitId: options.trackId.replace('-track', '')
  };

  return TrackRenderer.drawAnimatedTrack(map, newOptions);
};


// Export cleanup functions
export const clearAllTrackState = () => {
  trackStateManager.clearAll();
  TrackEventBus.cleanup();
};