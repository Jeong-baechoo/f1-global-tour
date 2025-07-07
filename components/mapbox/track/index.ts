// Re-export all track modules for easy importing
export { TrackRenderer } from './renderer/TrackRenderer';
export { DRSZoneManager } from './drs/DRSZoneManager';
export { DRSAnimationController } from './animation/DRSAnimationController';
export { SectorTrackManager } from './sector/SectorTrackManager';
export { TrackEventBus } from './events/TrackEventBus';
export { trackStateManager } from './state/TrackStateManager';

// Main function that replaces the old drawAnimatedTrack
import mapboxgl from 'mapbox-gl';
import { TrackRenderer } from './renderer/TrackRenderer';
import { TrackDrawOptions as OldTrackDrawOptions } from '../types';
import { trackStateManager } from './state/TrackStateManager';
import { TrackEventBus } from './events/TrackEventBus';
import { DRSAnimationController } from './animation/DRSAnimationController';

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
    onProgress: (progress: number) => {
      // Progress callback - sector markers are now handled by events in TrackRenderer
      if (options.onProgress) {
        options.onProgress(progress);
      }
    },
    onComplete: options.onComplete,
    circuitId: options.trackId.replace('-track', '')
  };

  return TrackRenderer.drawAnimatedTrack(map, newOptions);
};

// Alias for backward compatibility
export const drawTrack = drawAnimatedTrack;

// Export cleanup functions
export const clearAllTrackState = () => {
  trackStateManager.clearAll();
  TrackEventBus.cleanup();
};

export const clearAllDRSAnimations = () => {
  DRSAnimationController.clearAllAnimations();
};