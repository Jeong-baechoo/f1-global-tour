import { DRSZoneManager } from '../drs/DRSZoneManager';
import { DRSAnimationController } from '../animation/DRSAnimationController';
import { SectorTrackManager } from '../sector/SectorTrackManager';
import mapboxgl from 'mapbox-gl';

type EventHandler = (event: CustomEvent) => void;

export class TrackEventBus {
  private static eventHandlers = new Map<string, Map<string, EventHandler>>();

  /**
   * Register event handlers for a specific track
   */
  static registerTrackEventHandlers(trackId: string, map: mapboxgl.Map): void {
    // DRS zone toggle handler
    const drsHandler: EventHandler = (event) => {
      const { enabled } = event.detail;
      DRSZoneManager.toggleDRSZoneLayers(trackId, enabled, map);
      DRSAnimationController.toggleAnimation(trackId, enabled);
    };

    // Sector color toggle handler
    const sectorHandler: EventHandler = (event) => {
      const { enabled } = event.detail;
      SectorTrackManager.toggleSectorColors(trackId, enabled, map);
    };

    // Store handlers for this track
    const handlers = new Map<string, EventHandler>();
    handlers.set('toggleDRSZoneLayers', drsHandler);
    handlers.set('toggleSectorTrackColors', sectorHandler);
    this.eventHandlers.set(trackId, handlers);

    // Register global event listeners
    window.addEventListener('toggleDRSZoneLayers', drsHandler as EventListener);
    window.addEventListener('toggleSectorTrackColors', sectorHandler as EventListener);
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