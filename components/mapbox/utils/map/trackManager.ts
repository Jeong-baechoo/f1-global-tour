import mapboxgl from 'mapbox-gl';

// 현재 표시된 트랙과 DRS 정보를 관리
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

class TrackManager {
  private tracksState: Map<string, TrackState> = new Map();
  private map: mapboxgl.Map | null = null;

  setMap(map: mapboxgl.Map) {
    this.map = map;
    this.setupZoomListener();
  }

  private setupZoomListener() {
    if (!this.map) return;

    this.map.on('zoom', () => {
      const zoom = this.map!.getZoom();
      
      // 줌 레벨이 10 미만이면 모든 트랙 제거
      if (zoom < 10) {
        this.removeAllTracks();
      }
    });
  }

  // 트랙 정보 등록
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

  // 트랙 레이어 추가 시 기록
  addTrackLayer(circuitId: string, layerId: string) {
    const state = this.tracksState.get(circuitId);
    if (state && !state.layers.includes(layerId)) {
      state.layers.push(layerId);
    }
  }

  // 트랙 소스 추가 시 기록
  addTrackSource(circuitId: string, sourceId: string) {
    const state = this.tracksState.get(circuitId);
    if (state && !state.sources.includes(sourceId)) {
      state.sources.push(sourceId);
    }
  }


  // 섹터 마커 추가 시 기록
  addSectorMarkers(circuitId: string, markers: mapboxgl.Marker[]) {
    const state = this.tracksState.get(circuitId);
    if (state) {
      state.sectorMarkers.push(...markers);
      console.log(`✅ Added ${markers.length} sector markers for ${circuitId}`);
    } else {
      console.warn(`⚠️ No track state found for ${circuitId} when adding sector markers`);
    }
  }

  // DRS Detection 마커 추가 시 기록
  addDRSDetectionMarkers(circuitId: string, markers: mapboxgl.Marker[]) {
    const state = this.tracksState.get(circuitId);
    if (state) {
      state.drsDetectionMarkers.push(...markers);
    }
  }

  // Speed Trap 마커 추가 시 기록
  addSpeedTrapMarkers(circuitId: string, markers: mapboxgl.Marker[]) {
    const state = this.tracksState.get(circuitId);
    if (state) {
      state.speedTrapMarkers.push(...markers);
    }
  }

  // 특정 서킷의 트랙 제거
  removeTrack(circuitId: string) {
    if (!this.map) return;
    
    const state = this.tracksState.get(circuitId);
    if (!state) return;

    console.log(`🗑️ Removing track for ${circuitId}: ${state.sectorMarkers.length} sector, ${state.drsDetectionMarkers.length} DRS, ${state.speedTrapMarkers.length} speed trap markers`);

    // 섹터 마커 제거
    state.sectorMarkers.forEach(marker => marker.remove());
    
    // DRS Detection 마커 제거
    state.drsDetectionMarkers.forEach(marker => marker.remove());
    
    // Speed Trap 마커 제거
    state.speedTrapMarkers.forEach(marker => marker.remove());

    // 레이어 제거
    state.layers.forEach(layerId => {
      if (this.map!.getLayer(layerId)) {
        this.map!.removeLayer(layerId);
      }
    });

    // 소스 제거
    state.sources.forEach(sourceId => {
      if (this.map!.getSource(sourceId)) {
        this.map!.removeSource(sourceId);
      }
    });

    // 상태 초기화
    this.tracksState.delete(circuitId);
  }

  // 모든 트랙 제거
  removeAllTracks() {
    this.tracksState.forEach((_, circuitId) => {
      this.removeTrack(circuitId);
    });
    
    // 추가로 알려지지 않은 트랙 관련 레이어들도 제거
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
      
      // 소스도 정리
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

  // 트랙이 표시되어 있는지 확인
  hasTrack(circuitId: string): boolean {
    return this.tracksState.has(circuitId);
  }

  // 현재 줌 레벨에서 트랙 표시 가능한지 확인
  canShowTrack(): boolean {
    return this.map ? this.map.getZoom() >= 10 : false;
  }
}

// 싱글톤 인스턴스
export const trackManager = new TrackManager();