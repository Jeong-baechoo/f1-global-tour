import mapboxgl from 'mapbox-gl';
import { getTrackCoordinates } from '@/src/features/circuits/utils/data/trackDataLoader';
import { getCircuitCameraConfig } from '@/src/shared/utils/map/camera';
import { SectorTrackManager } from '@/src/features/circuits/services/track/sector/SectorTrackManager';
import { DRSZoneManager } from '@/src/features/circuits/services/track/drs/DRSZoneManager';
import { DRSAnimationController } from '@/src/features/circuits/services/track/animation/DRSAnimationController';
import { trackStateManager } from '@/src/features/circuits/services/track/state/TrackStateManager';
import circuitsData from '@/data/circuits.json';

export class CircuitTrackManager {
  private map: mapboxgl.Map;
  private trackLayerId = '';

  constructor(map: mapboxgl.Map) {
    this.map = map;
  }

  async drawCircuitTrack(circuitId: string): Promise<void> {
    if (!this.map || !circuitId) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Map or circuit ID not available for track drawing');
      }
      return;
    }

    // 맵이 완전히 로드될 때까지 대기
    await this.waitForMapReady();

    try {
      // 기존 트랙 제거 (있다면)
      this.clearCircuitTrack();

      // 트랙 ID 설정
      this.trackLayerId = `replay-${circuitId}-track`;

      // 트랙 데이터를 비동기로 로드하고 즉시 그리기
      const trackData = await getTrackCoordinates(circuitId);
      
      if (!trackData) {
        console.error(`❌ No track data found for circuit: ${circuitId}`);
        return;
      }
      
      // 트랙 데이터 유효성 검증
      if (!Array.isArray(trackData) || trackData.length < 2) {
        console.error(`❌ Invalid track data for ${circuitId}:`, trackData);
        return;
      }
      
      // 좌표 형식 검증
      const firstPoint = trackData[0];
      if (!Array.isArray(firstPoint) || firstPoint.length < 2) {
        console.error(`❌ Invalid coordinate format for ${circuitId}:`, firstPoint);
        return;
      }
      
      // Track data loaded
      
      // Track data validated

      // 맵 준비 후 트랙 추가
      await this.addTrackToMapWithRetry(trackData, 3);
      
      // 섹터와 DRS 기능 준비 (숨김 상태로)
      await this.prepareToggleFeatures(trackData, circuitId);
      // 트랙 추가 후 서킷으로 카메라 이동
      setTimeout(() => {
        this.flyToCircuit(circuitId);
      }, 200);

    } catch (error) {
      console.error(`❌ Error drawing track for ${circuitId}:`, error);
      const err = error as Error;
      console.error('Full error details:', {
        message: err.message || 'Unknown error',
        stack: err.stack || 'No stack trace',
        circuitId,
        trackLayerId: this.trackLayerId
      });
    }
  }


  private addTrackToMap(trackCoordinates: number[][]): void {
    
    if (!this.map) {
      console.error('❌ No map instance for adding track');
      return;
    }
    
    if (!this.trackLayerId) {
      console.error('❌ No track layer ID set');
      return;
    }

    try {
      // GeoJSON 형태로 트랙 데이터 생성
      const trackGeoJSON = {
        type: 'Feature' as const,
        properties: {},
        geometry: {
          type: 'LineString' as const,
          coordinates: trackCoordinates
        }
      };

      // 기존 레이어와 소스 제거 (있다면)
      if (this.map.getLayer(this.trackLayerId)) {
        this.map.removeLayer(this.trackLayerId);
      }
      if (this.map.getSource(this.trackLayerId)) {
        this.map.removeSource(this.trackLayerId);
      }

      // 소스 추가
      this.map.addSource(this.trackLayerId, {
        type: 'geojson',
        data: trackGeoJSON
      });

      // 레이어 추가 (즉시 표시) - 최상단에 배치
      
      // 가장 위 레이어 찾기 (라벨 레이어들 제외)
      const layers = this.map.getStyle().layers;
      let beforeLayerId: string | undefined;
      
      // 라벨이나 심볼 레이어 찾기 (트랙은 이런 레이어들 아래에 있어야 함)
      for (let i = layers.length - 1; i >= 0; i--) {
        const layer = layers[i];
        if (layer.type === 'symbol' || 
            layer.id.includes('label') || 
            layer.id.includes('text') ||
            layer.id.includes('poi') ||
            layer.id.includes('place')) {
          beforeLayerId = layer.id;
          break;
        }
      }
      
      // 모든 기존 레이어 위에 추가
      this.map.addLayer({
        id: this.trackLayerId,
        type: 'line',
        source: this.trackLayerId,
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
          'visibility': 'visible'
        },
        paint: {
          'line-color': '#FF0000', // 빨간색으로 고정하여 명확히 보이도록
          'line-width': [
            'interpolate',
            ['linear'],
            ['zoom'],
            8, 6,   // 줄 레벨에서도 보이도록 두께 증가
            12, 8,
            16, 10,
            20, 12
          ],
          'line-opacity': 1.0 // 완전 불투명
        }
      }, beforeLayerId);
      
      
      // 레이어가 실제로 존재하는지 확인
      setTimeout(() => {
        const layerExists = this.map.getLayer(this.trackLayerId);
        
        if (layerExists) {
          // Track layer exists - ready for use
        }
      }, 100);

    } catch (error) {
      console.error(`❌ Error adding track to map:`, error);
      const err = error as Error;
      console.error('Map add error details:', {
        message: err.message || 'Unknown error',
        stack: err.stack || 'No stack trace',
        trackLayerId: this.trackLayerId,
        hasMap: !!this.map,
        coordinatesLength: trackCoordinates.length
      });
    }
  }

  clearCircuitTrack(): void {
    if (!this.map) return;


    // 기존 트랙 레이어 제거
    if (this.trackLayerId && this.map.getLayer(this.trackLayerId)) {
      try {
        this.map.removeLayer(this.trackLayerId);
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.warn(`Failed to remove track layer ${this.trackLayerId}:`, error);
        }
      }
    }

    // 소스도 제거
    if (this.trackLayerId && this.map.getSource(this.trackLayerId)) {
      try {
        this.map.removeSource(this.trackLayerId);
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.warn(`Failed to remove track source ${this.trackLayerId}:`, error);
        }
      }
    }

    // replay 전용 트랙만 정리 (기존 circuits 트랙은 건드리지 않음)
    this.trackLayerId = '';
  }

  ensureTrackVisibility(): void {
    if (!this.map || !this.trackLayerId) {
      console.warn('🔍 Cannot ensure track visibility: missing map or trackLayerId');
      return;
    }

    const trackLayer = this.map.getLayer(this.trackLayerId);

    // Track visibility check (debug logs removed)

    // 리플레이 모드에서는 트랙을 항상 표시
    if (trackLayer) {
      this.map.setLayoutProperty(this.trackLayerId, 'visibility', 'visible');
      // Track visibility ensured
    } else {
      console.warn(`⚠️ Track layer ${this.trackLayerId} not found on map`);
    }
  }

  // 맵이 완전히 로드될 때까지 대기하는 함수
  private async waitForMapReady(): Promise<void> {
    if (!this.map) return;

    return new Promise((resolve) => {
      if (this.map!.loaded()) {
        resolve();
        return;
      }

      const checkLoad = () => {
        if (this.map!.loaded()) {
          resolve();
        } else {
          setTimeout(checkLoad, 100);
        }
      };

      this.map!.on('load', () => resolve());
      checkLoad(); // 즉시 체크도 해봄
    });
  }

  /**
   * 섹터와 DRS 기능을 미리 준비 (기본적으로 숨김 상태)
   */
  private async prepareToggleFeatures(trackCoordinates: number[][], circuitId: string): Promise<void> {
    if (!this.map || !this.trackLayerId) return;

    try {
      // 1. 섹터는 토글할 때만 적용 (초기에는 준비하지 않음)
      
      // 2. DRS 존 준비 (숨김 상태로)
      await DRSZoneManager.drawDRSZones(this.map, this.trackLayerId, trackCoordinates, circuitId);
      // DRS 존 즉시 숨기기
      DRSZoneManager.toggleDRSZoneLayers(this.trackLayerId, false, this.map);
      
      // 3. DRS 애니메이션 데이터 준비 (활성 상태로)
      trackStateManager.addDRSAnimation(this.trackLayerId, {
        animationId: Date.now(),
        isActive: false, // 초기에는 비활성으로 설정
        restartFunction: () => {
          // DRS 토글이 활성화될 때 호출될 함수
          if (this.map && this.trackLayerId) {
            DRSAnimationController.startAnimation(this.map, this.trackLayerId, true);
          }
        }
      });
      
    } catch (error) {
      console.error(`❌ Error preparing toggle features for ${circuitId}:`, error);
    }
  }


  // 재시도 로직이 포함된 트랙 추가 함수
  private async addTrackToMapWithRetry(trackCoordinates: number[][], maxRetries: number): Promise<void> {
    let attempts = 0;
    
    while (attempts < maxRetries) {
      try {
        this.addTrackToMap(trackCoordinates);
        
        // 레이어가 실제로 추가되었는지 확인
        await new Promise((resolve) => setTimeout(resolve, 100));
        
        if (this.map && this.map.getLayer(this.trackLayerId)) {
          // Track layer added successfully - register custom event handlers for replay
          this.registerReplayEventHandlers();
          return;
        } else {
          // noinspection ExceptionCaughtLocallyJS
            throw new Error('Layer not found after adding');
        }
      } catch (error) {
        attempts++;
        if (process.env.NODE_ENV === 'development') {
          console.warn(`⚠️ Track add attempt ${attempts} failed:`, error);
        }
        
        if (attempts < maxRetries) {
          // Retrying track add
          await new Promise((resolve) => setTimeout(resolve, attempts * 200));
        } else {
          console.error(`❌ All ${maxRetries} attempts failed to add track`);
          throw error;
        }
      }
    }
  }

  /**
   * 리플레이 전용 이벤트 핸들러 등록
   */
  private registerReplayEventHandlers(): void {
    if (typeof window === 'undefined') return;
    
    // Sector toggle handler
    const sectorHandler = (event: CustomEvent<{ enabled: boolean }>) => {
      const { enabled } = event.detail;
      this.handleSectorToggle(enabled);
    };
    
    // DRS toggle handlers  
    const drsZonesHandler = (event: CustomEvent<{ enabled: boolean }>) => {
      const { enabled } = event.detail;
      DRSZoneManager.toggleDRSZoneLayers(this.trackLayerId, enabled, this.map);
    };
    
    const drsAnimationsHandler = (event: CustomEvent<{ enabled: boolean }>) => {
      const { enabled } = event.detail;
      DRSAnimationController.toggleAnimation(this.trackLayerId, enabled);
    };

    // Register event listeners
    window.addEventListener('track:toggleSectorInfo', sectorHandler as EventListener);
    window.addEventListener('track:toggleDRSZones', drsZonesHandler as EventListener);
    window.addEventListener('track:toggleDRSAnimations', drsAnimationsHandler as EventListener);
  }

  /**
   * 리플레이용 섹터 토글 처리 (단일 레이어 기반)
   */
  private async handleSectorToggle(enabled: boolean): Promise<void> {
    if (!this.map || !this.trackLayerId) return;
    
    const circuitId = this.trackLayerId.replace('replay-', '').replace('-track', '');
    const savedLayers = trackStateManager.findSectorLayer(this.trackLayerId);
    
    if (enabled) {
      // 섹터 활성화
      if (savedLayers && savedLayers.sectorLayers.length > 0) {
        // 이미 섹터 레이어가 생성되어 있으면 visibility만 변경
        
        // 기본 트랙 숨기기
        if (this.map.getLayer(this.trackLayerId)) {
          this.map.setLayoutProperty(this.trackLayerId, 'visibility', 'none');
        }
        
        // 기존 섹터 레이어들 보이기
        savedLayers.sectorLayers.forEach(layerId => {
          if (this.map.getLayer(layerId)) {
            this.map.setLayoutProperty(layerId, 'visibility', 'visible');
          }
        });
        
        // DRS 레이어들을 섹터보다 위로 올리기
        this.moveDRSLayersToTop();
      } else {
        // 처음 섹터 활성화: 새로 생성
        
        // 기본 트랙 숨기기
        if (this.map.getLayer(this.trackLayerId)) {
          this.map.setLayoutProperty(this.trackLayerId, 'visibility', 'none');
        }
        
        try {
          await SectorTrackManager.applySectorColors(this.map, this.trackLayerId, circuitId, true);
          
          // 섹터 레이어가 DRS를 가리지 않도록 DRS 레이어들을 맨 위로 올리기
          this.moveDRSLayersToTop();
        } catch (error) {
          console.error('Failed to apply sector colors:', error);
          // 실패 시 기본 트랙 다시 표시
          if (this.map.getLayer(this.trackLayerId)) {
            this.map.setLayoutProperty(this.trackLayerId, 'visibility', 'visible');
          }
        }
      }
    } else {
      // 섹터 비활성화: 섹터 레이어 숨기고 기본 트랙 표시
      if (savedLayers) {
        savedLayers.sectorLayers.forEach(layerId => {
          if (this.map.getLayer(layerId)) {
            this.map.setLayoutProperty(layerId, 'visibility', 'none');
          }
        });
      }
      
      // 기본 트랙 다시 표시
      if (this.map.getLayer(this.trackLayerId)) {
        this.map.setLayoutProperty(this.trackLayerId, 'visibility', 'visible');
      }
    }
  }

  /**
   * DRS 레이어들을 맨 위로 이동시켜 섹터에 가려지지 않게 함
   */
  private moveDRSLayersToTop(): void {
    if (!this.map || !this.trackLayerId) return;
    
    const drsLayerInfo = trackStateManager.findDRSLayer(this.trackLayerId);
    
    if (drsLayerInfo && drsLayerInfo.drsLayers.length > 0) {
      
      drsLayerInfo.drsLayers.forEach(layerId => {
        try {
          if (this.map.getLayer(layerId)) {
            // 레이어를 맨 위로 이동 (beforeId 없이 호출하면 맨 위로 이동)
            this.map.moveLayer(layerId);
          }
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.warn(`Failed to move DRS layer ${layerId} to top:`, error);
          }
        }
      });
    }
  }


  flyToCircuit(circuitId: string): void {
    
    if (!this.map) {
      console.error('❌ No map for flyToCircuit');
      return;
    }
    
    if (!circuitId) {
      console.error('❌ No circuitId for flyToCircuit');
      return;
    }

    // 서킷 정보 찾기
    const circuit = circuitsData.circuits.find(c => c.id === circuitId);
    if (!circuit) {
      console.error(`❌ Circuit not found in circuits.json: ${circuitId}`);
      return;
    }

    // 카메라 설정 가져오기
    const cameraConfig = getCircuitCameraConfig(circuitId);
    
    this.map.flyTo({
      center: [circuit.location.lng, circuit.location.lat],
      zoom: cameraConfig.zoom,
      pitch: cameraConfig.pitch,
      bearing: cameraConfig.bearing,
      duration: 2000
    });
  }
}