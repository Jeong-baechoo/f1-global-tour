import mapboxgl from 'mapbox-gl';
import { getDRSZones } from '@/src/shared/utils/data/trackDataLoader';
import { interpolateCoordinates } from '@/src/shared/utils/animations/globeAnimation';
import { trackStateManager } from '../state/TrackStateManager';
import { circuitTrackManager } from '@/src/features/circuits/services/CircuitTrackManager';
import { DRS_COLORS, OPACITY } from '@/src/shared/constants';
// noinspection ES6PreferShortImport
import { DRSAnimationController } from '../animation/DRSAnimationController';

// DRS zone index definitions
const DRS_ZONES: { [key: string]: Array<{ start: number; end: number; wrapAround?: boolean }> | 'dynamic' } = {
  'nurburgring': 'dynamic',  // First 10% of track as DRS zone
};

// Create chevron SVG
const createChevronSVG = (color: string = DRS_COLORS.ZONE_ACTIVE, opacity: number = 1): string => {
  return `<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M6 15L12 9L18 15" stroke="${color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" stroke-opacity="${opacity}" style="fill:none"/>
  </svg>`;
};

export class DRSZoneManager {
  private static chevronStates = [
    { color: DRS_COLORS.ZONE_INACTIVE, opacity: OPACITY.LOW, name: 'chevron-dim' },
    { color: DRS_COLORS.ZONE_LOW, opacity: OPACITY.MEDIUM, name: 'chevron-mid' },
    { color: DRS_COLORS.ZONE_ACTIVE, opacity: OPACITY.HIGH, name: 'chevron-bright' },
    { color: DRS_COLORS.ZONE_MAX, opacity: OPACITY.FULL, name: 'chevron-max' }
  ];

  /**
   * Load chevron images into the map
   */
  static loadChevronImages(map: mapboxgl.Map): void {
    this.chevronStates.forEach((state) => {
      if (!map.hasImage(state.name)) {
        const svg = createChevronSVG(state.color, state.opacity);
        const blob = new Blob([svg], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);

        const img = new Image();
        img.onload = () => {
          // 이미지 추가 직전에 한 번 더 확인
          if (!map.hasImage(state.name)) {
            try {
              map.addImage(state.name, img);
            } catch {
            }
          }
          URL.revokeObjectURL(url);
        };
        img.src = url;
      }
    });
  }

  /**
   * Draw DRS zones on the track
   */
  static async drawDRSZones(
    map: mapboxgl.Map,
    trackId: string,
    trackCoordinates: number[][],
    circuitId: string
  ): Promise<void> {
    // Try to get GeoJSON DRS zones first
    const geoJsonDrsZones = await getDRSZones(circuitId);
    
    if (geoJsonDrsZones && geoJsonDrsZones.length > 0) {
      await this.drawGeoJSONDRSZones(map, trackId, geoJsonDrsZones);
    } else {
      // Fallback to index-based DRS zones
      this.drawIndexBasedDRSZones(map, trackId, trackCoordinates, circuitId);
    }
  }

  /**
   * Draw GeoJSON-based DRS zones
   */
  private static async drawGeoJSONDRSZones(
    map: mapboxgl.Map,
    trackId: string,
    drsZones: Array<{ id: string; name: string; coordinates: number[][]; color: string }>
  ): Promise<void> {
    // Load chevron images
    this.loadChevronImages(map);

    const currentDrsLayers: string[] = [];

    // Wait for images to load
    await new Promise(resolve => setTimeout(resolve, 100));

    drsZones.forEach((zone, zoneIndex) => {
      const drsId = `${trackId}-drs-${zoneIndex}`;
      const smoothCoordinates = interpolateCoordinates(zone.coordinates);

      // Create GeoJSON for chevron points
      const features = [];
      const pointInterval = 5; // 5포인트 간격으로 더 촘촘하게
      
      for (let i = 0; i < smoothCoordinates.length - 1; i += pointInterval) {
        const coordIndex = Math.floor(i);
        const coord = smoothCoordinates[coordIndex];
        const nextCoord = smoothCoordinates[Math.min(coordIndex + 1, smoothCoordinates.length - 1)];
        
        // 방향 계산 (도 단위) - 트랙 진행 방향
        const dx = nextCoord[0] - coord[0];
        const dy = nextCoord[1] - coord[1];
        // Mapbox는 북쪽을 0도로 하고 시계방향으로 증가
        const bearing = Math.atan2(dx, dy) * 180 / Math.PI;
        
        features.push({
          type: 'Feature' as const,
          geometry: {
            type: 'Point' as const,
            coordinates: coord
          },
          properties: {
            bearing: bearing, // 트랙 진행 방향으로 회전
            index: Math.floor(i / pointInterval),
            name: zone.name
          }
        });
      }
      
      const chevronGeoJson = {
        type: 'FeatureCollection' as const,
        features: features
      };

      // Add source
      if (!map.getSource(`${drsId}-symbols`)) {
        map.addSource(`${drsId}-symbols`, {
          type: 'geojson',
          data: chevronGeoJson
        });
      }

      // Add symbol layer
      const layerId = `${drsId}-symbols`;
      if (!map.getLayer(layerId)) {
        map.addLayer({
          id: layerId,
          type: 'symbol',
          source: `${drsId}-symbols`,
          minzoom: 14,
          layout: {
            'icon-image': 'chevron-mid',
            'icon-size': 0.8,
            'icon-rotate': ['get', 'bearing'],
            'icon-rotation-alignment': 'map',
            'icon-pitch-alignment': 'map',
            'icon-allow-overlap': true,
            'icon-ignore-placement': true
          },
          paint: {
            'icon-opacity': 0.8
          }
        });
        
        const circuitId = trackId.replace('-track', '');
        circuitTrackManager.addTrackLayer(circuitId, layerId);
        circuitTrackManager.addTrackSource(circuitId, `${drsId}-symbols`);
        currentDrsLayers.push(layerId);
      }
    });

    // Save DRS layers info
    if (currentDrsLayers.length > 0) {
      trackStateManager.addDRSLayer({
        trackId,
        drsLayers: currentDrsLayers
      });
      
      // Register DRS elements with CircuitTrackManager
      const circuitId = trackId.replace('-track', '');
      const drsIds = drsZones.map((_, index) => `${trackId}-drs-${index}`);
      circuitTrackManager.addDRSElements(circuitId, drsIds);
    }
  }

  /**
   * Draw index-based DRS zones (fallback)
   */
  private static drawIndexBasedDRSZones(
    map: mapboxgl.Map,
    trackId: string,
    trackCoordinates: number[][],
    circuitId: string
  ): void {
    const drsConfig = DRS_ZONES[circuitId];
    if (!drsConfig) return;

    let drsZones: Array<{ start: number; end: number }>;

    if (drsConfig === 'dynamic') {
      const totalPoints = trackCoordinates.length;
      drsZones = [{ start: 0, end: Math.floor(totalPoints * 0.1) }];
    } else {
      drsZones = drsConfig;
    }

    // Convert to GeoJSON format and draw
    const geoJsonZones = drsZones.map((zone, index) => ({
      id: `drs-${index}`,
      name: `DRS Zone ${index + 1}`,
      coordinates: trackCoordinates.slice(zone.start, zone.end + 1),
      color: '#00FF00'
    }));

    this.drawGeoJSONDRSZones(map, trackId, geoJsonZones);
  }

  /**
   * Toggle DRS zone visibility
   */
  static toggleDRSZoneLayers(trackId: string, enabled: boolean, map: mapboxgl.Map): void {
    const savedLayers = trackStateManager.findDRSLayer(trackId);
    
    if (savedLayers) {
      savedLayers.drsLayers.forEach(layerId => {
        if (map.getLayer(layerId)) {
          map.setLayoutProperty(layerId, 'visibility', enabled ? 'visible' : 'none');
        }
      });
    } else if (enabled) {
      // DRS 레이어가 없지만 켜려고 할 때, 다시 그려줌
      const circuitId = trackId.replace('-track', '');
      const originalTrackData = trackStateManager.findOriginalTrackData(trackId);
      
      if (originalTrackData && 
          originalTrackData.originalData && 
          originalTrackData.originalData.geometry && 
          originalTrackData.originalData.geometry.coordinates &&
          Array.isArray(originalTrackData.originalData.geometry.coordinates) &&
          originalTrackData.originalData.geometry.coordinates.length > 0) {
        this.drawDRSZones(map, trackId, originalTrackData.originalData.geometry.coordinates, circuitId)
          .then(() => {
            // DRS 존이 다시 그려진 후 애니메이션 시작
            setTimeout(() => {
              DRSAnimationController.startAnimation(map, trackId);
            }, 100);
          })
          .catch(console.error);
      }
    }
  }
}