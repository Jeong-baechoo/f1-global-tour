import mapboxgl from 'mapbox-gl';

// 현재 표시된 트랙과 DRS 정보를 관리
interface TrackState {
  circuitId: string;
  trackId: string;
  hasTrack: boolean;
  hasDRS: boolean;
  layers: string[];
  sources: string[];
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
      sources: []
    });
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

  // DRS 추가 시 기록
  addDRSElements(circuitId: string, drsIds: string[]) {
    const state = this.tracksState.get(circuitId);
    if (state) {
      state.hasDRS = true;
      // DRS 레이어와 소스 추가
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

  // 특정 서킷의 트랙 제거
  removeTrack(circuitId: string) {
    if (!this.map) return;
    
    const state = this.tracksState.get(circuitId);
    if (!state) return;

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