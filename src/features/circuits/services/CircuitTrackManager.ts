import mapboxgl from 'mapbox-gl';
import { ZOOM_THRESHOLDS } from '@/components/mapbox/constants';

interface TrackState {
  circuitId: string;
  trackId: string;
  hasTrack: boolean;
  hasDRS: boolean;
  layers: string[];
  sources: string[];
  sectorMarkers: mapboxgl.Marker[];
  drsDetectionMarkers: mapboxgl.Marker[];
  speedTrapMarkers: mapboxgl.Marker[];
}

export class CircuitTrackManager {
  private static instance: CircuitTrackManager;
  private tracksState: Map<string, TrackState> = new Map();
  private map: mapboxgl.Map | null = null;
  private zoomHandler?: () => void;

  private constructor() {}

  static getInstance(): CircuitTrackManager {
    if (!CircuitTrackManager.instance) {
      CircuitTrackManager.instance = new CircuitTrackManager();
    }
    return CircuitTrackManager.instance;
  }

  setMap(map: mapboxgl.Map) {
    this.map = map;
    this.setupZoomListener();
  }

  private setupZoomListener() {
    if (!this.map) return;

    // Remove existing listener if any
    if (this.zoomHandler) {
      this.map.off('zoom', this.zoomHandler);
    }

    this.zoomHandler = () => {
      const zoom = this.map!.getZoom();

      // 줌 레벨이 10 미만이면 모든 트랙 제거
      if (zoom < ZOOM_THRESHOLDS.TRACK_VISIBLE) {

        // First, hide ALL sector-related markers immediately by querying DOM
        this.hideAllSectorMarkersImmediately();

        // Then remove all tracks through the normal process
        this.removeAllTracks();

        // Remove terrain at low zoom levels
        if (zoom < ZOOM_THRESHOLDS.GLOBE_TO_2D) {
          this.removeTerrain();
        }
      }
    };

    this.map.on('zoom', this.zoomHandler);
  }

  registerTrack(circuitId: string, trackId: string) {
    this.tracksState.set(circuitId, {
      circuitId,
      trackId,
      hasTrack: true,
      hasDRS: false,
      layers: [],
      sources: [],
      sectorMarkers: [],
      drsDetectionMarkers: [],
      speedTrapMarkers: []
    });
    console.log(`🎯 Track registered for ${circuitId}`);
  }

  addTrackLayer(circuitId: string, layerId: string) {
    const state = this.tracksState.get(circuitId);
    if (state && !state.layers.includes(layerId)) {
      state.layers.push(layerId);
    }
  }

  addTrackSource(circuitId: string, sourceId: string) {
    const state = this.tracksState.get(circuitId);
    if (state && !state.sources.includes(sourceId)) {
      state.sources.push(sourceId);
    }
  }

  addDRSElements(circuitId: string, drsIds: string[]) {
    const state = this.tracksState.get(circuitId);
    if (state) {
      state.hasDRS = true;
      drsIds.forEach(id => {
        if (!state.layers.includes(`${id}-symbols`)) {
          state.layers.push(`${id}-symbols`);
        }
        if (!state.sources.includes(id)) {
          state.sources.push(id);
        }
      });
    }
  }

  addSectorMarkers(circuitId: string, markers: mapboxgl.Marker[]) {
    const state = this.tracksState.get(circuitId);
    if (state) {
      state.sectorMarkers.push(...markers);
      console.log(`✅ Added ${markers.length} sector markers for ${circuitId}`);
      console.log(`📍 Current zoom level when adding markers:`, this.map?.getZoom());

      // Immediately check zoom level and hide if necessary
      if (this.map && this.map.getZoom() < ZOOM_THRESHOLDS.TRACK_VISIBLE) {
        console.log(`⚠️ Zoom level too low (${this.map.getZoom()}), hiding markers immediately`);
        markers.forEach(marker => {
          const el = marker.getElement();
          el.style.display = 'none';
          el.style.opacity = '0';
        });
      }
    }
  }

  addDRSDetectionMarkers(circuitId: string, markers: mapboxgl.Marker[]) {
    const state = this.tracksState.get(circuitId);
    if (state) {
      state.drsDetectionMarkers.push(...markers);
    }
  }

  addSpeedTrapMarkers(circuitId: string, markers: mapboxgl.Marker[]) {
    const state = this.tracksState.get(circuitId);
    if (state) {
      state.speedTrapMarkers.push(...markers);
    }
  }

  removeTrack(circuitId: string) {
    if (!this.map) return;

    const state = this.tracksState.get(circuitId);
    if (!state) return;

    console.log(`🗑️ Removing track for ${circuitId}`, {
      sectorMarkers: state.sectorMarkers.length,
      drsDetectionMarkers: state.drsDetectionMarkers.length,
      speedTrapMarkers: state.speedTrapMarkers.length,
      layers: state.layers.length,
      sources: state.sources.length
    });

    // Remove all markers
    console.log(`🗑️ Removing ${state.sectorMarkers.length} sector markers`);
    state.sectorMarkers.forEach(marker => {
      marker.remove();
    });
    console.log(`🗑️ Removing ${state.drsDetectionMarkers.length} DRS detection markers`);
    state.drsDetectionMarkers.forEach(marker => marker.remove());
    console.log(`🗑️ Removing ${state.speedTrapMarkers.length} speed trap markers`);
    state.speedTrapMarkers.forEach(marker => marker.remove());

    // Remove layers
    state.layers.forEach(layerId => {
      if (this.map!.getLayer(layerId)) {
        this.map!.removeLayer(layerId);
      }
    });

    // Remove sources
    state.sources.forEach(sourceId => {
      if (this.map!.getSource(sourceId)) {
        this.map!.removeSource(sourceId);
      }
    });

    // Clear state
    this.tracksState.delete(circuitId);
  }

  removeAllTracks() {
    this.tracksState.forEach((_, circuitId) => {
      this.removeTrack(circuitId);
    });

    // Clean up any unknown track-related layers
    if (this.map) {
      const style = this.map.getStyle();
      if (style && style.layers) {
        const trackLayers = style.layers.filter(layer =>
          layer.id.includes('-track') ||
          layer.id.includes('-sector') ||
          layer.id.includes('-drs') ||
          layer.id.includes('-symbols')
        );

        trackLayers.forEach(layer => {
          if (this.map!.getLayer(layer.id)) {
            this.map!.removeLayer(layer.id);
          }
        });
      }

      // Clean up sources
      if (style && style.sources) {
        Object.keys(style.sources).forEach(sourceId => {
          if (sourceId.includes('-track') ||
              sourceId.includes('-sector') ||
              sourceId.includes('-drs')) {
            if (this.map!.getSource(sourceId)) {
              this.map!.removeSource(sourceId);
            }
          }
        });
      }
    }
  }

  private hideAllSectorMarkersImmediately() {
    // Query all sector-related markers in the DOM and hide them
    const sectorMarkers = document.querySelectorAll('.sector-marker, .drs-detection-marker, .speed-trap-marker');
    console.log(`🗑️ Immediately hiding ${sectorMarkers.length} sector-related markers from DOM`);

    sectorMarkers.forEach((marker) => {
      const element = marker as HTMLElement;
      element.style.display = 'none';
      element.style.opacity = '0';
      element.style.pointerEvents = 'none';
    });

    // Also dispatch events to hide markers
    window.dispatchEvent(new CustomEvent('toggleSectorMarkers', { detail: { enabled: false } }));
    window.dispatchEvent(new CustomEvent('toggleDRSDetectionMarkers', { detail: { enabled: false } }));
    window.dispatchEvent(new CustomEvent('toggleSpeedTrapMarkers', { detail: { enabled: false } }));
  }

  private removeTerrain() {
    if (!this.map) return;

    try {
      // Remove terrain (set to null)
      this.map.setTerrain(null);
      console.log('🏔️ Terrain removed at low zoom level');
    } catch (error) {
      console.warn('Failed to remove terrain:', error);
    }
  }

  private restoreTerrain() {
    if (!this.map) return;

    try {
      // Restore terrain with minimal exaggeration
      if (this.map.getSource('mapbox-dem')) {
        this.map.setTerrain({
          source: 'mapbox-dem',
          exaggeration: 0.001
        });
        console.log('🏔️ Terrain restored');
      }
    } catch (error) {
      console.warn('Failed to restore terrain:', error);
    }
  }

  hasTrack(circuitId: string): boolean {
    return this.tracksState.has(circuitId);
  }

  canShowTrack(): boolean {
    return this.map ? this.map.getZoom() >= ZOOM_THRESHOLDS.TRACK_VISIBLE : false;
  }

  getAllTrackSources(): string[] {
    const sources: string[] = [];
    this.tracksState.forEach(state => {
      sources.push(...state.sources);
    });
    return sources;
  }

  cleanup() {
    // Remove all tracks
    this.removeAllTracks();

    // Remove zoom listener
    if (this.map && this.zoomHandler) {
      this.map.off('zoom', this.zoomHandler);
    }

    // Clear references
    this.map = null;
    this.zoomHandler = undefined;
    this.tracksState.clear();
  }
}

// Export singleton instance
export const circuitTrackManager = CircuitTrackManager.getInstance();
