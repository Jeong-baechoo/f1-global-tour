import mapboxgl from 'mapbox-gl';
import { clearAllTrackState } from '@/src/features/circuits/services/track';
import { getTrackCoordinates } from '@/src/features/circuits/utils/data/trackDataLoader';
import { getCircuitCameraConfig } from '@/src/shared/utils/map/camera';
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
      console.log(`📋 Loading track data for ${circuitId}...`);
      const trackData = await getTrackCoordinates(circuitId);
      
      if (!trackData) {
        console.error(`❌ No track data found for circuit: ${circuitId}`);
        return;
      }
      
      console.log(`✅ Track data loaded for ${circuitId}, coordinates:`, trackData.length, 'points');
      
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
      
      console.log(`📊 Track data sample:`, {
        firstPoint: trackData[0],
        lastPoint: trackData[trackData.length - 1],
        totalPoints: trackData.length
      });

      // 맵 준비 후 트랙 추가
      console.log(`🎨 Adding track to map...`);
      await this.addTrackToMapWithRetry(trackData, 3);
      
      // 트랙 추가 후 서킷으로 카메라 이동
      setTimeout(() => {
        console.log(`📷 Flying to circuit ${circuitId}`);
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
    console.log(`🗺️ Adding track layer ${this.trackLayerId} to map`);
    
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
      console.log(`➕ Adding layer ${this.trackLayerId} to map at top`);
      
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
      
      console.log(`✅ Successfully added track layer ${this.trackLayerId} to map`);
      
      // 레이어가 실제로 존재하는지 확인
      setTimeout(() => {
        const layerExists = this.map.getLayer(this.trackLayerId);
        const sourceExists = this.map.getSource(this.trackLayerId);
        console.log(`🔎 Layer check - exists: ${!!layerExists}, source exists: ${!!sourceExists}`);
        
        if (layerExists) {
          const visibility = this.map.getLayoutProperty(this.trackLayerId, 'visibility');
          console.log(`👁️ Layer visibility: ${visibility}`);
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

    console.log(`🧹 Clearing replay track: ${this.trackLayerId}`);

    // 기존 트랙 레이어 제거
    if (this.trackLayerId && this.map.getLayer(this.trackLayerId)) {
      try {
        this.map.removeLayer(this.trackLayerId);
        console.log(`✅ Removed track layer: ${this.trackLayerId}`);
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
        console.log(`✅ Removed track source: ${this.trackLayerId}`);
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
    const trackSource = this.map.getSource(this.trackLayerId);

    console.log(`🔍 Track visibility check:`, {
      trackLayerId: this.trackLayerId,
      hasLayer: !!trackLayer,
      hasSource: !!trackSource,
      currentVisibility: trackLayer ? this.map.getLayoutProperty(this.trackLayerId, 'visibility') : 'N/A'
    });

    // 리플레이 모드에서는 트랙을 항상 표시
    if (trackLayer) {
      this.map.setLayoutProperty(this.trackLayerId, 'visibility', 'visible');
      console.log(`✅ Track visibility ensured for ${this.trackLayerId}`);
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

      this.map!.on('load', resolve);
      checkLoad(); // 즉시 체크도 해봄
    });
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
          console.log(`✅ Track layer added successfully on attempt ${attempts + 1}`);
          return;
        } else {
          throw new Error('Layer not found after adding');
        }
      } catch (error) {
        attempts++;
        console.warn(`⚠️ Track add attempt ${attempts} failed:`, error);
        
        if (attempts < maxRetries) {
          console.log(`🔄 Retrying in ${attempts * 200}ms...`);
          await new Promise((resolve) => setTimeout(resolve, attempts * 200));
        } else {
          console.error(`❌ All ${maxRetries} attempts failed to add track`);
          throw error;
        }
      }
    }
  }

  flyToCircuit(circuitId: string): void {
    console.log(`📷 Flying to circuit: ${circuitId}`);
    
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
    
    console.log(`🎥 Camera config for ${circuitId}:`, {
      center: [circuit.location.lng, circuit.location.lat],
      zoom: cameraConfig.zoom,
      pitch: cameraConfig.pitch,
      bearing: cameraConfig.bearing
    });
    
    this.map.flyTo({
      center: [circuit.location.lng, circuit.location.lat],
      zoom: cameraConfig.zoom,
      pitch: cameraConfig.pitch,
      bearing: cameraConfig.bearing,
      duration: 2000
    });
  }
}