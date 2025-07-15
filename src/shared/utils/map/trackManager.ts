import mapboxgl from 'mapbox-gl';

// 현재 표시된 트랙 정보를 관리
interface TrackState {
  circuitId: string;
  trackId: string;
  hasTrack: boolean;
  hasDRS: boolean;
  layers: string[];
  sources: string[];
  sectorMarkers: mapboxgl.Marker[];
}

class TrackManager {
  private tracksState: Map<string, TrackState> = new Map();

  // 트랙 레이어 추가 시 기록
  addTrackLayer(circuitId: string, layerId: string) {
    const state = this.tracksState.get(circuitId);
    if (state && !state.layers.includes(layerId)) {
      state.layers.push(layerId);
    }
  }
}

// 싱글톤 인스턴스
export const trackManager = new TrackManager();