import mapboxgl from 'mapbox-gl';
import { getSectorData } from '@/src/shared/utils/data/trackDataLoader';
import { loadCircuitGeoJSON } from '@/src/shared/utils/data/dynamicSectorLoader';
import { trackStateManager } from '../state/TrackStateManager';
import { trackManager } from '@/src/shared/utils/map/trackManager';


export class SectorTrackManager {
  /**
   * Apply sector-based coloring to track
   */
  static async applySectorColors(
    map: mapboxgl.Map,
    trackId: string,
    circuitId: string
  ): Promise<boolean> {
    try {
      // Get sector data
      let sectorData = await getSectorData(circuitId);
      
      // If no sector data, try loading from dynamic GeoJSON
      if (!sectorData || sectorData.length === 0) {
        
        const geoJsonData = await loadCircuitGeoJSON(circuitId);
        if (geoJsonData) {
          // Extract sector features from GeoJSON
          const sectorFeatures = geoJsonData.features.filter(feature => 
            feature.properties.sector !== undefined && 
            feature.properties.sector > 0 &&
            feature.geometry.type === 'LineString'
          );
          
          if (sectorFeatures.length > 0) {
            // Convert to SectorData format
            sectorData = sectorFeatures.map(feature => {
              const sectorNumber = feature.properties.sector as number;
              
              // Sector colors
              let sectorColor: string; // Default red
              switch (sectorNumber) {
                case 1:
                  sectorColor = '#FF0000'; // Red
                  break;
                case 2:
                  sectorColor = '#0000FF'; // Blue
                  break;
                case 3:
                  sectorColor = '#FFFF00'; // Yellow
                  break;
                default:
                  sectorColor = '#00FF00'; // Green (4+ sectors)
                  break;
              }
              
              return {
                id: feature.properties.id || `sector-${sectorNumber}`,
                name: feature.properties.name || feature.properties.Name || `Sector ${sectorNumber}`,
                description: feature.properties.description || '',
                color: sectorColor,
                coordinates: feature.geometry.coordinates as number[][],
                sector: sectorNumber
              };
            });
          }
        }
      }
      
      if (!sectorData || sectorData.length === 0) {
        return false;
      }

      // Hide original track layers
      if (map.getLayer(`${trackId}-main`)) {
        map.setLayoutProperty(`${trackId}-main`, 'visibility', 'none');
      }
      if (map.getLayer(`${trackId}-outline`)) {
        map.setLayoutProperty(`${trackId}-outline`, 'visibility', 'none');
      }

      // Create sector layers
      const sectorLayers: string[] = [];
      
      sectorData.forEach((sector) => {
        const sectorTrackId = `${trackId}-sector-${sector.sector}`;
        const color = sector.color; // Use the color from sector data

        // Create source for this sector with its specific coordinates
        if (!map.getSource(sectorTrackId)) {
          map.addSource(sectorTrackId, {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates: sector.coordinates
              }
            }
          });
        }

        // Create outline layer for this sector
        const outlineLayerId = `${sectorTrackId}-outline`;
        if (!map.getLayer(outlineLayerId)) {
          map.addLayer({
            id: outlineLayerId,
            type: 'line',
            source: sectorTrackId,
            minzoom: 10,
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
                10, 6,
                12, 8,
                16, 10
              ],
              'line-blur': 1,
              'line-opacity': [
                'interpolate',
                ['linear'],
                ['zoom'],
                10, 0.3,
                11, 0.7,
                12, 1
              ]
            }
          });
          sectorLayers.push(outlineLayerId);
        }

        // Create main sector layer
        const mainLayerId = `${sectorTrackId}-main`;
        if (!map.getLayer(mainLayerId)) {
          map.addLayer({
            id: mainLayerId,
            type: 'line',
            source: sectorTrackId,
            minzoom: 10,
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
                10, 3,
                12, 5,
                16, 7
              ],
              'line-opacity': [
                'interpolate',
                ['linear'],
                ['zoom'],
                10, 0.4,
                11, 0.8,
                12, 1
              ]
            }
          });
          sectorLayers.push(mainLayerId);
        }
        
        // Register layers with track manager
        trackManager.addTrackLayer(circuitId, outlineLayerId);
        trackManager.addTrackLayer(circuitId, mainLayerId);
      });

      // Save sector layers info
      if (sectorLayers.length > 0) {
        trackStateManager.addSectorLayer({
          trackId,
          sectorLayers,
          sectorData
        });
      }

      return true;
    } catch (error) {
      console.error('Error applying sector colors:', error);
      return false;
    }
  }

  /**
   * Toggle sector track colors visibility
   */
  static toggleSectorColors(trackId: string, enabled: boolean, map: mapboxgl.Map): void {
    const savedLayers = trackStateManager.findSectorLayer(trackId);
    
    if (savedLayers) {
      // Hide/show sector layers
      savedLayers.sectorLayers.forEach(layerId => {
        if (map.getLayer(layerId)) {
          map.setLayoutProperty(layerId, 'visibility', enabled ? 'visible' : 'none');
        }
      });

      // Toggle main track visibility inversely
      const mainLayerId = `${trackId}-main`;
      const outlineLayerId = `${trackId}-outline`;
      
      if (map.getLayer(mainLayerId)) {
        map.setLayoutProperty(mainLayerId, 'visibility', enabled ? 'none' : 'visible');
      }
      if (map.getLayer(outlineLayerId)) {
        map.setLayoutProperty(outlineLayerId, 'visibility', enabled ? 'none' : 'visible');
      }
    } else {
      // Try to find and restore original track
      const originalData = trackStateManager.findOriginalTrackData(trackId);
      if (originalData && map.getSource(trackId)) {
        (map.getSource(trackId) as mapboxgl.GeoJSONSource).setData(originalData.originalData);
      }
    }
  }

}