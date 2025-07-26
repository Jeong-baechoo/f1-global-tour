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
  private map: mapboxgl.Map | null = null;
  private resizeHandler: (() => void) | null = null;
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
      // 모멘텀/관성 비활성화로 터치 해제 후 의도치 않은 움직임 방지
      dragPan: { linearity: 1, easing: (t: number) => t, maxSpeed: 0 },
      scrollZoom: { around: 'center' },
      touchZoomRotate: { around: 'center' }
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
    let touchEndTimer: NodeJS.Timeout | null = null;
    let activeTouchCount = 0;
    
    // 두 손가락 터치 거리 계산
    const getTouchDistance = (touches: TouchList) => {
      if (touches.length < 2) return 0;
      const dx = touches[1].clientX - touches[0].clientX;
      const dy = touches[1].clientY - touches[0].clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };
    
    // touchstart 이벤트 리스너
    const handleTouchStart = (e: TouchEvent) => {
      activeTouchCount = e.touches.length;
      
      if (touchEndTimer) {
        clearTimeout(touchEndTimer);
        touchEndTimer = null;
      }
      
      if (e.touches.length === 2) {
        // 두 손가락 제스처 중에는 Mapbox 드래그 완전 차단
        this.map!.dragPan.disable();
        
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
      activeTouchCount = e.touches.length;
      
      // 이전 타이머가 있다면 취소
      if (touchEndTimer) {
        clearTimeout(touchEndTimer);
      }
      
      // 모든 터치가 해제될 때까지 상태 초기화를 지연
      touchEndTimer = setTimeout(() => {
        if (activeTouchCount === 0) {
          // Mapbox 드래그 다시 활성화
          this.map!.dragPan.enable();
          
          touchStartTime = 0;
          isPinching = false;
          isRotating = false;
        }
        touchEndTimer = null;
      }, 100); // 100ms 지연으로 동시 터치 해제 안정성 확보
    };
    
    // 이벤트 리스너 등록
    const mapContainer = this.map.getContainer();
    mapContainer.addEventListener('touchstart', handleTouchStart, { passive: true });
    mapContainer.addEventListener('touchmove', handleTouchMove, { passive: true });
    mapContainer.addEventListener('touchend', handleTouchEnd, { passive: true });
    
    // Cleanup 함수에 이벤트 리스너 제거 추가
    this.map.on('remove', () => {
      if (touchEndTimer) {
        clearTimeout(touchEndTimer);
      }
      mapContainer.removeEventListener('touchstart', handleTouchStart);
      mapContainer.removeEventListener('touchmove', handleTouchMove);
      mapContainer.removeEventListener('touchend', handleTouchEnd);
    });
  }
}