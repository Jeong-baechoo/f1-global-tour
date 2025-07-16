import { create } from 'zustand';
import mapboxgl from 'mapbox-gl';

interface MapState {
  // 맵 인스턴스
  map: mapboxgl.Map | null;
  isMapLoaded: boolean;
  
  // 맵 상태
  center: [number, number];
  zoom: number;
  bearing: number;
  pitch: number;
  
  // 사용자 인터랙션
  isUserInteracting: boolean;
  
  // 액션
  setMap: (map: mapboxgl.Map | null) => void;
  setMapLoaded: (loaded: boolean) => void;
  setCenter: (center: [number, number]) => void;
  setZoom: (zoom: number) => void;
  setBearing: (bearing: number) => void;
  setPitch: (pitch: number) => void;
  setUserInteracting: (interacting: boolean) => void;
}

// devtools 없이 store 생성 (Mapbox GL 객체 직렬화 문제 방지)
export const useMapStore = create<MapState>((set) => ({
  // 초기 상태
  map: null,
  isMapLoaded: false,
  center: [0, 20] as [number, number],
  zoom: 1.5,
  bearing: 0,
  pitch: 0,
  isUserInteracting: false,
  
  // 액션 구현
  setMap: (map) => {
    set({ map });
  },
  setMapLoaded: (loaded) => {
    set({ isMapLoaded: loaded });
  },
  setCenter: (center) => set({ center }),
  setZoom: (zoom) => set({ zoom }),
  setBearing: (bearing) => set({ bearing }),
  setPitch: (pitch) => set({ pitch }),
  setUserInteracting: (interacting) => set({ isUserInteracting: interacting }),
}));