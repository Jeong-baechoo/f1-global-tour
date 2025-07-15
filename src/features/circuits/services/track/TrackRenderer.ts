import mapboxgl from 'mapbox-gl';
import { interpolateCoordinates } from '@/src/shared/utils/animations/globeAnimation';
import { ANIMATION_CONFIG, TRACK_LINE_WIDTHS, OPACITY, BLUR, ZOOM_THRESHOLDS } from '@/src/shared/constants';
import { circuitTrackManager } from '@/src/features/circuits/services/CircuitTrackManager';
import { trackStateManager } from './state/TrackStateManager';
import { DRSZoneManager } from './drs/DRSZoneManager';
import { DRSAnimationController } from '@/src/features/circuits/services';
import { SectorTrackManager } from './sector/SectorTrackManager';
import { TrackEventBus } from './events/TrackEventBus';
import { getSectorData as getSectorMarkerData } from '../../components/markers/SectorMarkerManager';
import { ElevationTrackManager } from '@/src/features/circuits/services';

// New TrackDrawOptions interface for the refactored version
interface TrackDrawOptions {
  coordinates: number[][];
  trackId: string;
  color?: string;
  width?: number;
  animationDelay?: number;
  onProgress?: (progress: number, sectorName?: string) => void;
  onComplete?: () => void;
  circuitId: string;
}

interface SectorMarkerData {
  id?: string;
  name: string;
  type: 'sector' | 'drs_detection' | 'speed_trap';
  position: { lat: number; lng: number };
  trackIndex?: number;
  coordinates?: [number, number];
  number?: number;
}

export class TrackRenderer {
  /**
   * Draw an animated track on the map
   */
  static async drawAnimatedTrack(
    map: mapboxgl.Map,
    options: TrackDrawOptions
  ): Promise<void> {
    const { 
      coordinates, 
      trackId, 
      color = '#FF1801',
      animationDelay = 0,
      onProgress,
      onComplete,
      circuitId
    } = options;

    const delay = animationDelay || 0;

    // Register track with CircuitTrackManager
    circuitTrackManager.registerTrack(circuitId, trackId);

    setTimeout(async () => {
      const smoothCoordinates = interpolateCoordinates(coordinates);
      const trackCoordinates = coordinates;

      const geoJSON = {
        type: 'Feature' as const,
        properties: {},
        geometry: {
          type: 'LineString' as const,
          coordinates: []
        }
      };

      // Save original track data
      trackStateManager.addOriginalTrackData({
        trackId,
        originalData: {
          ...geoJSON,
          geometry: {
            ...geoJSON.geometry,
            coordinates: [...smoothCoordinates]
          }
        }
      });

      // Add source if it doesn't exist
      if (!map.getSource(trackId)) {
        map.addSource(trackId, {
          type: 'geojson',
          data: geoJSON
        });
        circuitTrackManager.addTrackSource(circuitId, trackId);
      }

      // Add track layers
      this.addTrackLayers(map, trackId, color, circuitId);

      // Load sector marker data
      const rawSectorData = await getSectorMarkerData(circuitId);
      const sectorMarkerData = this.enrichSectorDataWithTrackIndex(
        rawSectorData, 
        trackCoordinates, 
        smoothCoordinates, 
        circuitId
      );
      const passedSectors = new Set<string>();

      // Start track animation
      await this.animateTrack(
        map,
        trackId,
        smoothCoordinates,
        sectorMarkerData,
        passedSectors,
        onProgress,
        async () => {
          // Apply sector colors after animation
          const sectorApplied = await SectorTrackManager.applySectorColors(map, trackId, circuitId);
          
          // Draw DRS zones
          await DRSZoneManager.drawDRSZones(map, trackId, smoothCoordinates, circuitId);
          
          // Draw 3D elevation track
          ElevationTrackManager.draw3DElevationTrack(map, trackId, smoothCoordinates, circuitId).catch(console.error);
          
          // Start DRS animation
          setTimeout(() => {
            DRSAnimationController.startAnimation(map, trackId);
          }, sectorApplied ? 300 : 500);

          // Register event handlers
          TrackEventBus.registerTrackEventHandlers(trackId, map);

          if (onComplete) {
            onComplete();
          }
        }
      );
    }, delay);
  }

  /**
   * Add track layers to the map
   */
  private static addTrackLayers(
    map: mapboxgl.Map,
    trackId: string,
    color: string,
    circuitId: string
  ): void {
    // Track outline layer
    if (!map.getLayer(`${trackId}-outline`)) {
      map.addLayer({
        id: `${trackId}-outline`,
        type: 'line',
        source: trackId,
        minzoom: ZOOM_THRESHOLDS.TRACK_VISIBLE,
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#FFFFFF',
          'line-width': [
            'interpolate',
            ['linear'],
            ['zoom'],
            10, TRACK_LINE_WIDTHS.GHOST.base,
            12, TRACK_LINE_WIDTHS.GHOST.mid,
            16, TRACK_LINE_WIDTHS.GHOST.high
          ],
          'line-blur': BLUR.LIGHT,
          'line-opacity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            10, OPACITY.LOW,
            11, OPACITY.MEDIUM_HIGH,
            12, OPACITY.FULL
          ]
        }
      });
      circuitTrackManager.addTrackLayer(circuitId, `${trackId}-outline`);
    }

    // Main track layer
    if (!map.getLayer(`${trackId}-main`)) {
      map.addLayer({
        id: `${trackId}-main`,
        type: 'line',
        source: trackId,
        minzoom: ZOOM_THRESHOLDS.TRACK_VISIBLE,
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': color,
          'line-width': [
            'interpolate',
            ['linear'],
            ['zoom'],
            10, TRACK_LINE_WIDTHS.MAIN.base,
            12, TRACK_LINE_WIDTHS.MAIN.mid,
            16, TRACK_LINE_WIDTHS.MAIN.high
          ],
          'line-opacity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            10, OPACITY.MEDIUM_LOW,
            11, OPACITY.HIGH,
            12, OPACITY.FULL
          ]
        }
      });
      circuitTrackManager.addTrackLayer(circuitId, `${trackId}-main`);
    }
  }

  /**
   * Animate track drawing
   */
  private static async animateTrack(
    map: mapboxgl.Map,
    trackId: string,
    smoothCoordinates: number[][],
    sectorMarkerData: SectorMarkerData[],
    passedSectors: Set<string>,
    onProgress?: (progress: number, sectorName?: string) => void,
    onComplete?: () => void
  ): Promise<void> {
    const startTime = performance.now();
    const totalPoints = smoothCoordinates.length;
    let previousIndex = 0;

    const animate = async () => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / ANIMATION_CONFIG.trackAnimationDuration, 1);

      // Easing function
      const easeProgress = progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      const currentIndex = Math.floor(easeProgress * totalPoints);
      const animatedCoordinates = smoothCoordinates.slice(0, currentIndex + 1);

      // Update track
      const source = map.getSource(trackId) as mapboxgl.GeoJSONSource;
      if (source) {
        source.setData({
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: animatedCoordinates
          }
        });
      }

      // Check for sector markers - show when track animation passes through the sector position
      if (sectorMarkerData.length > 0 && currentIndex > previousIndex) {
        sectorMarkerData.forEach(sector => {
          const sectorKey = sector.id || sector.name || `sector-${sector.number}`;
          
          if (!passedSectors.has(sectorKey) && sector.trackIndex !== undefined) {
            // Check if the sector position is between the previous and current index
            const sectorIdx = sector.trackIndex;
            
            // The track has just passed through this sector if:
            // 1. The sector index is between previous and current index (inclusive)
            // 2. Or we've just reached exactly the sector index
            if (sectorIdx >= previousIndex && sectorIdx <= currentIndex) {
              // Only show sector markers if zoom level is high enough
              const currentZoom = map.getZoom();
              if (currentZoom > ZOOM_THRESHOLDS.TRACK_VISIBLE) {
                // Dispatch event to show sector marker
                const sectorId = sector.id || sector.name;
                
                window.dispatchEvent(new CustomEvent('showSectorMarker', {
                  detail: { sectorId: sectorId }
                }));
              }

              passedSectors.add(sectorKey);
              
              if (onProgress) {
                onProgress(progress, sector.name);
              }
            }
          }
        });
      }

      // Update previous index for next frame
      previousIndex = currentIndex;

      // Check zoom level
      const currentZoom = map.getZoom();
      if (currentZoom < ZOOM_THRESHOLDS.TRACK_VISIBLE) {
        // Remove track if zoom is too low
        const circuitId = trackId.replace('-track', '');
        circuitTrackManager.removeTrack(circuitId);
        return; // Stop animation
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else if (onComplete) {
        onComplete();
      }
    };

    await animate();
  }

  /**
   * Find sector index in track coordinates with improved accuracy
   */
  private static findSectorIndexInTrack(
    trackCoordinates: number[][], 
    sectorCoord: number[], 
    threshold: number = 0.0005  // More precise threshold for exact matching
  ): number {
    let closestIndex = -1;
    let minDistance = Infinity;

    for (let i = 0; i < trackCoordinates.length; i++) {
      const coord = trackCoordinates[i];
      const dx = coord[0] - sectorCoord[0];
      const dy = coord[1] - sectorCoord[1];
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = i;
      }

      // Return immediately if very close
      if (distance < threshold) {
        return i;
      }
    }
    
    // If closest distance is reasonable (within ~100m), use it
    if (minDistance < 0.001) {
      return closestIndex;
    }

    // For less precise matches, still accept if within ~1km
    if (minDistance < 0.01) {
      return closestIndex;
    }

    // Return -1 if too far
    return -1;
  }

  // Hardcoded sector 3 positions for specific circuits
  private static HARDCODED_SECTOR3_POSITIONS: Record<string, number> = {
    'monaco': 0.72,       // 72% position
    'netherlands': 0.68,  // 68% position  
    'singapore': 0.75,    // 75% position
    'saudi-arabia': 0.73  // 73% position
  };

  /**
   * Enrich sector data with track indices
   */
  private static enrichSectorDataWithTrackIndex(
    sectorData: Array<{number: number; position: unknown; name: string}>,
    trackCoordinates: number[][],
    smoothCoordinates: number[][],
    circuitId: string
  ): SectorMarkerData[] {
    return sectorData.map(sector => {
      let originalTrackIndex: number;
      let originalProgress: number;

      // Use hardcoded position for sector 3 on specific circuits
      if (sector.number === 3 && this.HARDCODED_SECTOR3_POSITIONS[circuitId]) {
        originalProgress = this.HARDCODED_SECTOR3_POSITIONS[circuitId];
        Math.floor(originalProgress * trackCoordinates.length);
      } else {
        // Normal case: find sector position in original track
        // Handle both array and object formats for position
        let sectorCoord: number[];
        if (Array.isArray(sector.position)) {
          sectorCoord = sector.position;
        } else if (sector.position && typeof sector.position === 'object' && 'lng' in sector.position && 'lat' in sector.position) {
          const posObj = sector.position as { lng: number; lat: number };
          sectorCoord = [posObj.lng, posObj.lat];
        } else {
          return { 
            id: `sector-${sector.number}`,
            name: sector.name,
            type: 'sector' as const,
            position: sector.position as { lat: number; lng: number },
            number: sector.number,
            trackIndex: -1 
          } as SectorMarkerData;
        }
        
        originalTrackIndex = this.findSectorIndexInTrack(
          trackCoordinates, 
          sectorCoord
        );
        
        if (originalTrackIndex < 0) {
          return { 
            id: `sector-${sector.number}`,
            name: sector.name,
            type: 'sector' as const,
            position: { lat: sectorCoord[1], lng: sectorCoord[0] },
            number: sector.number,
            trackIndex: -1 
          } as SectorMarkerData;
        }
        
        originalProgress = originalTrackIndex / trackCoordinates.length;
      }
      
      // Calculate corresponding index in smoothed track
      const smoothTrackIndex = Math.floor(originalProgress * smoothCoordinates.length);
      
      // Handle both array and object formats for position
      let sectorCoord: number[];
      if (Array.isArray(sector.position)) {
        sectorCoord = sector.position;
      } else if (sector.position && typeof sector.position === 'object' && 'lng' in sector.position && 'lat' in sector.position) {
        const positionObj = sector.position as { lng: number; lat: number };
        sectorCoord = [positionObj.lng, positionObj.lat];
      } else {
        sectorCoord = [0, 0]; // fallback
      }

      return {
        id: `sector-${sector.number}`,
        name: sector.name || `sector-${sector.number}`,
        type: 'sector' as const,
        position: { lat: sectorCoord[1], lng: sectorCoord[0] },
        number: sector.number,
        trackIndex: smoothTrackIndex,
        coordinates: smoothCoordinates[smoothTrackIndex] as [number, number]
      } as SectorMarkerData;
    })
    .filter(sector => sector.trackIndex !== undefined && sector.trackIndex >= 0) // Exclude sectors not found in track
    .sort((a, b) => (a.trackIndex ?? 0) - (b.trackIndex ?? 0)); // Sort by track order
  }
}