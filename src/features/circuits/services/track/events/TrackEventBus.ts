import { DRSZoneManager } from '../drs/DRSZoneManager';
import { DRSAnimationController } from '../animation/DRSAnimationController';
import { SectorTrackManager } from '../sector/SectorTrackManager';
import { ElevationTrackManager } from '../elevation/ElevationTrackManager';
import mapboxgl from 'mapbox-gl';

type EventHandler = (event: CustomEvent) => void;

export class TrackEventBus {
  private static eventHandlers = new Map<string, Map<string, EventHandler>>();

  /**
   * Register event handlers for a specific track
   */
  static registerTrackEventHandlers(trackId: string, map: mapboxgl.Map): void {
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
      // Also toggle sector markers
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
    handlers.set('toggleDRSZones', drsZonesHandler);
    handlers.set('toggleDRSAnimations', drsAnimationsHandler);
    handlers.set('toggleSectorInfo', sectorInfoHandler);
    handlers.set('toggleElevation', elevationHandler);
    this.eventHandlers.set(trackId, handlers);

    // Register global event listeners
    window.addEventListener('toggleDRSZones', drsZonesHandler as EventListener);
    window.addEventListener('toggleDRSAnimations', drsAnimationsHandler as EventListener);
    window.addEventListener('toggleSectorInfo', sectorInfoHandler as EventListener);
    window.addEventListener('toggleElevation', elevationHandler as EventListener);
  }

  /**
   * Unregister event handlers for a specific track
   */
  static unregisterTrackEventHandlers(trackId: string): void {
    const handlers = this.eventHandlers.get(trackId);
    if (!handlers) return;

    // Remove event listeners
    handlers.forEach((handler, eventName) => {
      window.removeEventListener(eventName, handler as EventListener);
    });

    // Clean up
    this.eventHandlers.delete(trackId);
  }

  /**
   * Emit a custom event
   */
  static emit(eventName: string, detail: Record<string, unknown>): void {
    window.dispatchEvent(new CustomEvent(eventName, { detail }));
  }

  /**
   * Clean up all event handlers
   */
  static cleanup(): void {
    // Remove all event listeners
    this.eventHandlers.forEach((handlers) => {
      handlers.forEach((handler, eventName) => {
        window.removeEventListener(eventName, handler as EventListener);
      });
    });
    
    // Clear the map
    this.eventHandlers.clear();
  }
}