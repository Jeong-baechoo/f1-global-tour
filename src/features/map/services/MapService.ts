import mapboxgl from 'mapbox-gl';
import { FOG_CONFIG, SKY_LAYER_CONFIG, LAYERS_TO_REMOVE } from '@/src/shared/constants';
import { debounce } from '@/src/shared/utils/performance';

export interface MapConfig {
  container: HTMLElement;
  style?: string;
  center?: [number, number];
  zoom?: number;
  bearing?: number;
  pitch?: number;
  projection?: string;
  antialias?: boolean;
  preserveDrawingBuffer?: boolean;
  failIfMajorPerformanceCaveat?: boolean;
  refreshExpiredTiles?: boolean;
  maxTileCacheSize?: number;
  crossSourceCollisions?: boolean;
}

export class MapService {
  private static instance: MapService | null = null;
  private map: mapboxgl.Map | null = null;
  private resizeHandler: (() => void) | null = null;
  private isCinematicMode: boolean = false;
  private defaultConfig: Partial<MapConfig> = {
    style: 'mapbox://styles/mapbox/dark-v11',
    center: [0, 20],
    zoom: 1.5,
    bearing: 0,
    pitch: 0,
    projection: 'globe',
    antialias: true,
    preserveDrawingBuffer: false,
    failIfMajorPerformanceCaveat: false,
    refreshExpiredTiles: false,
    maxTileCacheSize: 50,
    crossSourceCollisions: false,
  };

  /**
   * Get singleton instance
   */
  public static getInstance(): MapService {
    if (!MapService.instance) {
      MapService.instance = new MapService();
    }
    return MapService.instance;
  }

  /**
   * Initialize Mapbox map instance
   */
  public initializeMap(config: MapConfig): mapboxgl.Map {
    if (this.map) {
      console.warn('Map already initialized. Destroying existing instance.');
      this.destroy();
    }

    // Merge with default config
    const finalConfig = { ...this.defaultConfig, ...config };

    // Create map instance
    const isMobile = window.innerWidth < 640;
    this.map = new mapboxgl.Map({
      ...(finalConfig as mapboxgl.MapboxOptions),
      // 모바일 제스처 설정
      touchPitch: false, // 터치로 피치(기울기) 변경 비활성화
      dragRotate: true, // 드래그 회전은 활성화 (두 손가락 회전 제스처용)
      touchZoomRotate: true // 핀치 줌과 회전 모두 활성화
    });

    // Optimize map on load
    this.map.on('load', () => {
      this.optimizeMapPerformance();
      this.setupAtmosphere();
      this.setupDEMSource();
      this.removeUnnecessaryLayers();
      if (isMobile) {
        this.setupMobileGestures();
      }
    });

    // Setup optimized resize handler
    this.resizeHandler = debounce(() => {
      if (this.map) {
        this.map.resize();
      }
    }, 300);
    
    window.addEventListener('resize', this.resizeHandler);

    return this.map;
  }

  /**
   * Get current map instance
   */
  public getMap(): mapboxgl.Map | null {
    return this.map;
  }

  /**
   * Optimize map performance by removing unnecessary layers
   */
  private optimizeMapPerformance(): void {
    if (!this.map) return;

    // Remove unnecessary layers for better performance
    const layers = this.map.getStyle().layers;
    layers?.forEach((layer) => {
      // Remove text labels for cleaner look
      if (layer.type === 'symbol' && layer.layout?.['text-field']) {
        this.map?.setLayoutProperty(layer.id, 'visibility', 'none');
      }
    });
  }

  /**
   * Add navigation controls to map
   */
  public addNavigationControls(position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'): void {
    if (!this.map) return;
    
    const isMobile = window.innerWidth < 640;
    const nav = new mapboxgl.NavigationControl({
      showCompass: !isMobile,
      showZoom: true,
      visualizePitch: !isMobile
    });
    
    this.map.addControl(nav, position || 'top-right');
  }

  /**
   * Update map style
   */
  public setStyle(style: string): void {
    if (!this.map) return;
    this.map.setStyle(style);
  }

  /**
   * Set map viewport
   */
  public setViewport(options: {
    center?: [number, number];
    zoom?: number;
    bearing?: number;
    pitch?: number;
  }): void {
    if (!this.map) return;

    if (options.center) this.map.setCenter(options.center);
    if (options.zoom !== undefined) this.map.setZoom(options.zoom);
    if (options.bearing !== undefined) this.map.setBearing(options.bearing);
    if (options.pitch !== undefined) this.map.setPitch(options.pitch);
  }

  /**
   * Get current viewport
   */
  public getViewport() {
    if (!this.map) return null;

    return {
      center: this.map.getCenter().toArray() as [number, number],
      zoom: this.map.getZoom(),
      bearing: this.map.getBearing(),
      pitch: this.map.getPitch(),
      bounds: this.map.getBounds()
    };
  }

  /**
   * Add a source to the map
   */
  public addSource(id: string, source: mapboxgl.AnySourceData): void {
    if (!this.map || this.map.getSource(id)) return;
    this.map.addSource(id, source);
  }

  /**
   * Remove a source from the map
   */
  public removeSource(id: string): void {
    if (!this.map || !this.map.getSource(id)) return;
    
    // Remove all layers using this source first
    const layers = this.map.getStyle().layers;
    layers?.forEach((layer) => {
      if ('source' in layer && layer.source === id) {
        this.map?.removeLayer(layer.id);
      }
    });
    
    this.map.removeSource(id);
  }

  /**
   * Add a layer to the map
   */
  public addLayer(layer: mapboxgl.AnyLayer, beforeId?: string): void {
    if (!this.map || this.map.getLayer(layer.id)) return;
    
    if (beforeId) {
      this.map.addLayer(layer, beforeId);
    } else {
      this.map.addLayer(layer);
    }
  }

  /**
   * Remove a layer from the map
   */
  public removeLayer(id: string): void {
    if (!this.map || !this.map.getLayer(id)) return;
    this.map.removeLayer(id);
  }

  /**
   * Check if a layer exists
   */
  public hasLayer(id: string): boolean {
    if (!this.map) return false;
    return !!this.map.getLayer(id);
  }

  /**
   * Check if a source exists
   */
  public hasSource(id: string): boolean {
    if (!this.map) return false;
    return !!this.map.getSource(id);
  }

  /**
   * Reset map view to default
   */
  public resetView(animate: boolean = true): void {
    if (!this.map) return;

    const isPortrait = window.innerHeight > window.innerWidth;
    const options = {
      center: [0, isPortrait ? 10 : 20] as [number, number],
      zoom: isPortrait ? 1.2 : 1.5,
      pitch: 0,
      bearing: 0,
      essential: true
    };

    if (animate) {
      this.map.flyTo(options);
    } else {
      this.setViewport(options);
    }
  }

  /**
   * Fit map to bounds
   */
  public fitBounds(bounds: mapboxgl.LngLatBoundsLike, options?: mapboxgl.FitBoundsOptions): void {
    if (!this.map) return;
    this.map.fitBounds(bounds, options);
  }

  /**
   * Fly to location
   */
  public flyToLocation(coords: [number, number], options?: Record<string, unknown>): void {
    if (!this.map) {
      console.error('Map is not initialized');
      return;
    }
    
    this.map.flyTo({
      center: coords,
      ...options,
      essential: true,
    });
  }

  /**
   * Get current zoom level
   */
  public getZoom(): number {
    return this.map?.getZoom() ?? 0;
  }

  /**
   * Set cinematic mode
   */
  public setCinematicMode(enabled: boolean): void {
    this.isCinematicMode = enabled;
    // Cinematic mode logic would go here
  }

  /**
   * Clean up map instance
   */
  public destroy(): void {
    // Remove resize event listener
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
      this.resizeHandler = null;
    }
    
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }

  /**
   * Check if map is loaded
   */
  public isLoaded(): boolean {
    return this.map?.loaded() ?? false;
  }

  /**
   * Wait for map to load
   */
  public async waitForLoad(): Promise<void> {
    if (!this.map) throw new Error('Map not initialized');
    
    if (this.map.loaded()) return;
    
    return new Promise((resolve) => {
      this.map!.once('load', () => resolve());
    });
  }

  /**
   * Get map container element
   */
  public getContainer(): HTMLElement | null {
    return this.map?.getContainer() ?? null;
  }

  /**
   * Get map canvas element
   */
  public getCanvas(): HTMLCanvasElement | null {
    return this.map?.getCanvas() ?? null;
  }

  /**
   * Setup atmosphere and fog effects
   */
  private setupAtmosphere(): void {
    if (!this.map) return;

    // Add fog for atmospheric effect
    if (this.map.setFog) {
      this.map.setFog(FOG_CONFIG);
    }

    // Add sky layer
    if (!this.map.getLayer('sky')) {
      this.map.addLayer(SKY_LAYER_CONFIG);
    }

    // Globe projection atmosphere is set automatically in v3
    // No need to set globe paint properties as they don't exist
  }
  
  /**
   * Setup DEM source for elevation data
   */
  private setupDEMSource(): void {
    if (!this.map) return;
    
    // DEM 소스 추가 (고도 데이터용)
    if (!this.map.getSource('mapbox-dem')) {
      this.map.addSource('mapbox-dem', {
        type: 'raster-dem',
        url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
        tileSize: 512,
        maxzoom: 14
      });
      
      // Terrain을 매우 작은 exaggeration으로 설정 - 시각적으로 평평하면서 고도 데이터 접근 가능
      this.map.setTerrain({
        source: 'mapbox-dem',
        exaggeration: 0.001
      });
    }
  }
  
  /**
   * Remove unnecessary layers for better performance
   */
  private removeUnnecessaryLayers(): void {
    if (!this.map) return;
    
    const style = this.map.getStyle();
    if (style && style.layers) {
      style.layers.forEach(layer => {
        if (LAYERS_TO_REMOVE.some(pattern => layer.id.includes(pattern))) {
          try {
            this.map!.removeLayer(layer.id);
          } catch {
            // 레이어가 이미 제거된 경우 무시
          }
        }
      });
    }
  }
  
  /**
   * Setup mobile gesture handling
   */
  private setupMobileGestures(): void {
    if (!this.map) return;
    
    let touchStartTime = 0;
    let touchStartDistance = 0;
    let touchStartBearing = 0;
    let isPinching = false;
    let isRotating = false;
    
    // 두 손가락 터치 거리 계산
    const getTouchDistance = (touches: TouchList) => {
      if (touches.length < 2) return 0;
      const dx = touches[1].clientX - touches[0].clientX;
      const dy = touches[1].clientY - touches[0].clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };
    
    // touchstart 이벤트 리스너
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        touchStartTime = Date.now();
        touchStartDistance = getTouchDistance(e.touches);
        touchStartBearing = this.map!.getBearing();
        isPinching = false;
        isRotating = false;
      }
    };
    
    // touchmove 이벤트 리스너
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && touchStartTime > 0) {
        const currentDistance = getTouchDistance(e.touches);
        const distanceChange = Math.abs(currentDistance - touchStartDistance);
        const currentBearing = this.map!.getBearing();
        const bearingChange = Math.abs(currentBearing - touchStartBearing);
        
        // 거리 변화가 더 크면 핀치 줌으로 판단
        if (distanceChange > 20 && !isRotating) {
          isPinching = true;
          // 핀치 줌 중에는 회전 막기
          if (bearingChange > 0.5) {
            this.map!.setBearing(touchStartBearing);
          }
        }
        // 회전 변화가 더 크면 회전으로 판단
        else if (bearingChange > 5 && !isPinching) {
          isRotating = true;
        }
      }
    };
    
    // touchend 이벤트 리스너
    const handleTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) {
        touchStartTime = 0;
        isPinching = false;
        isRotating = false;
      }
    };
    
    // 이벤트 리스너 등록
    const mapContainer = this.map.getContainer();
    mapContainer.addEventListener('touchstart', handleTouchStart, { passive: true });
    mapContainer.addEventListener('touchmove', handleTouchMove, { passive: true });
    mapContainer.addEventListener('touchend', handleTouchEnd, { passive: true });
    
    // Cleanup 함수에 이벤트 리스너 제거 추가
    this.map.on('remove', () => {
      mapContainer.removeEventListener('touchstart', handleTouchStart);
      mapContainer.removeEventListener('touchmove', handleTouchMove);
      mapContainer.removeEventListener('touchend', handleTouchEnd);
    });
  }
}