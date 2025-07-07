/**
 * This file has been refactored into smaller modules.
 * Please use the new modular imports instead:
 * 
 * import { 
 *   drawAnimatedTrack,
 *   clearAllTrackState,
 *   clearAllDRSAnimations
 * } from '@/components/mapbox/track';
 * 
 * For specific functionality:
 * - DRS Zones: import { DRSZoneManager } from '@/components/mapbox/track/drs/DRSZoneManager';
 * - DRS Animations: import { DRSAnimationController } from '@/components/mapbox/track/animation/DRSAnimationController';
 * - Sector Colors: import { SectorTrackManager } from '@/components/mapbox/track/sector/SectorTrackManager';
 * - Track Rendering: import { TrackRenderer } from '@/components/mapbox/track/renderer/TrackRenderer';
 * - Event Handling: import { TrackEventBus } from '@/components/mapbox/track/events/TrackEventBus';
 * - State Management: import { trackStateManager } from '@/components/mapbox/track/state/TrackStateManager';
 */

import mapboxgl from 'mapbox-gl';

// Re-export everything from the new modular structure for backward compatibility
export {
  drawAnimatedTrack,
  drawTrack,
  clearAllTrackState,
  clearAllDRSAnimations,
  TrackRenderer,
  DRSZoneManager,
  DRSAnimationController,
  SectorTrackManager,
  TrackEventBus,
  trackStateManager
} from '../../track';

// Additional exports for backward compatibility
export const toggleDRSZoneLayers = (trackId: string, enabled: boolean, map: mapboxgl.Map) => {
  import('../../track').then(({ DRSZoneManager }) => {
    DRSZoneManager.toggleDRSZoneLayers(trackId, enabled, map);
  });
};

export const toggleSectorTrackColors = (trackId: string, enabled: boolean, map: mapboxgl.Map) => {
  import('../../track').then(({ SectorTrackManager }) => {
    SectorTrackManager.toggleSectorColors(trackId, enabled, map);
  });
};

export const toggleDRSAnimations = (trackId: string, enabled: boolean) => {
  import('../../track').then(({ DRSAnimationController }) => {
    DRSAnimationController.toggleAnimation(trackId, enabled);
  });
};