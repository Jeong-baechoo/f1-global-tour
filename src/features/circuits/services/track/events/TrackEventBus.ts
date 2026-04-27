import { DRSZoneManager } from '../drs/DRSZoneManager';
import { DRSAnimationController } from '@/src/features/circuits/services';
import { SectorTrackManager } from '../sector/SectorTrackManager';
import { ElevationTrackManager } from '@/src/features/circuits/services';
import mapboxgl from 'mapbox-gl';

type EventHandler = (event: CustomEvent) => void;

// 이벤트 네임스페이스 전역 상수
const TRACK_EVENTS = {
  TOGGLE_DRS_ZONES: 'track:toggleDRSZones',
  TOGGLE_DRS_ANIMATIONS: 'track:toggleDRSAnimations', 
  TOGGLE_SECTOR_INFO: 'track:toggleSectorInfo',
  TOGGLE_ELEVATION: 'track:toggleElevation'
} as const;

export class TrackEventBus {
  private static eventHandlers = new Map<string, Map<string, EventHandler>>();
  private static isClientSide = typeof window !== 'undefined';

  /**
   * Register event handlers for a specific track
   */
  static registerTrackEventHandlers(trackId: string, map: mapboxgl.Map): void {
    // 클라이언트에서만 실행
    if (!this.isClientSide) return;
    // DRS zone toggle handler
    const drsZonesHandler: EventHandler = (event) => {
      const { enabled } = event.detail;
      DRSZoneManager.toggleDRSZoneLayers(trackId, enabled, map);
    };
    
    // DRS animation toggle handler  
    const drsAnimationsHandler: EventHandler = (event) => {
      const { enabled } = event.detail;
      DRSAnimationController.toggleAnimation(trackId, enabled);
    };

    // Sector info toggle handler
    const sectorInfoHandler: EventHandler = (event) => {
      const { enabled } = event.detail;
      SectorTrackManager.toggleSectorColors(trackId, enabled, map);
      // Also toggle sector markers (using non-namespaced event for sector markers)
      window.dispatchEvent(new CustomEvent('toggleSectorMarkers', { 
        detail: { enabled } 
      }));
    };
    
    // 3D Elevation toggle handler
    const elevationHandler: EventHandler = (event) => {
      const { enabled } = event.detail;
      if (enabled) {
        ElevationTrackManager.show3DElevationTrack(trackId, map);
      } else {
        ElevationTrackManager.hide3DElevationTrack(trackId, map);
      }
    };

    // Store handlers for this track
    const handlers = new Map<string, EventHandler>();
    handlers.set(TRACK_EVENTS.TOGGLE_DRS_ZONES, drsZonesHandler);
    handlers.set(TRACK_EVENTS.TOGGLE_DRS_ANIMATIONS, drsAnimationsHandler);
    handlers.set(TRACK_EVENTS.TOGGLE_SECTOR_INFO, sectorInfoHandler);
    handlers.set(TRACK_EVENTS.TOGGLE_ELEVATION, elevationHandler);
    this.eventHandlers.set(trackId, handlers);

    // Register namespaced event listeners
    window.addEventListener(TRACK_EVENTS.TOGGLE_DRS_ZONES, drsZonesHandler as EventListener);
    window.addEventListener(TRACK_EVENTS.TOGGLE_DRS_ANIMATIONS, drsAnimationsHandler as EventListener);
    window.addEventListener(TRACK_EVENTS.TOGGLE_SECTOR_INFO, sectorInfoHandler as EventListener);
    window.addEventListener(TRACK_EVENTS.TOGGLE_ELEVATION, elevationHandler as EventListener);
  }



  /**
   * Clean up all event handlers
   */
  static cleanup(): void {
    // Remove all event listeners
    if (this.isClientSide) {
      this.eventHandlers.forEach((handlers) => {
        handlers.forEach((handler, eventName) => {
          window.removeEventListener(eventName, handler as EventListener);
        });
      });
    }
    
    // Clear the map
    this.eventHandlers.clear();
  }

  /**
   * Get event names for external usage
   */
  static getEventNames() {
    return TRACK_EVENTS;
  }
}