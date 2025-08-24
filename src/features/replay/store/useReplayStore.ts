import { create } from 'zustand';
import { 
  ReplayState, 
  ReplaySessionData, 
  ReplayDriverData, 
  ReplayLapData, 
  DriverPosition,
  ReplaySettings 
} from '../types';

interface ReplayActions {
  // 세션 관리
  setCurrentSession: (session: ReplaySessionData | null) => void;
  
  // 드라이버 데이터 관리
  setDrivers: (drivers: ReplayDriverData[]) => void;
  addDriver: (driver: ReplayDriverData) => void;
  removeDriver: (driverNumber: number) => void;
  
  // 랩 데이터 관리
  setLapsData: (laps: ReplayLapData[]) => void;
  addLapData: (lap: ReplayLapData) => void;
  
  // 재생 제어
  play: () => void;
  pause: () => void;
  stop: () => void;
  setCurrentTime: (time: number) => void;
  setTotalDuration: (duration: number) => void;
  setPlaybackSpeed: (speed: number) => void;
  seekTo: (time: number) => void;
  
  // 랩 관리
  setCurrentLap: (lap: number) => void;
  jumpToLap: (lap: number) => void;
  
  // 드라이버 선택
  selectDriver: (driverNumber: number) => void;
  deselectDriver: (driverNumber: number) => void;
  selectAllDrivers: () => void;
  deselectAllDrivers: () => void;
  
  // UI 상태
  setShowControls: (show: boolean) => void;
  setShowDriverInfo: (show: boolean) => void;
  
  // 드라이버 위치 업데이트
  updateDriverPositions: (positions: DriverPosition[]) => void;
  
  // 초기화
  reset: () => void;
  
  // 완전한 정리 (엔진 cleanup 포함)
  cleanup: () => void;
  
  // 설정
  updateSettings: (settings: Partial<ReplaySettings>) => void;
}

interface ReplayStoreState extends ReplayState {
  // 추가 상태
  driverPositions: DriverPosition[];
  settings: ReplaySettings;
  
  // 계산된 상태
  isLoading: boolean;
  error: string | null;
  
  // 액션
  actions: ReplayActions;
}

const initialSettings: ReplaySettings = {
  autoPlay: false,
  defaultSpeed: 1,
  showTrajectory: false,
  trajectoryLength: 30,
  cameraFollow: false,
  selectedCamera: 'overview'
};

const initialState: Omit<ReplayStoreState, 'actions'> = {
  // 세션 정보
  currentSession: null,
  
  // 드라이버 정보
  drivers: [],
  
  // 랩 데이터
  lapsData: [],
  
  // 재생 상태
  isPlaying: false,
  isPaused: false,
  currentTime: 0,
  totalDuration: 0,
  playbackSpeed: 1,
  
  // 트랙 정보
  currentLap: 1,
  selectedDrivers: [],
  
  // UI 상태
  showControls: true,
  showDriverInfo: true,
  
  // 추가 상태
  driverPositions: [],
  settings: initialSettings,
  
  // 상태
  isLoading: false,
  error: null,
};

export const useReplayStore = create<ReplayStoreState>((set, get) => ({
  ...initialState,
  
  actions: {
    // 세션 관리
    setCurrentSession: (session) => {
      set({ currentSession: session });
      if (session) {
        // 세션이 변경되면 초기화
        get().actions.reset();
      }
    },
    
    // 드라이버 데이터 관리
    setDrivers: (drivers) => set({ drivers }),
    
    addDriver: (driver) => {
      set((state) => ({
        drivers: [...state.drivers, driver]
      }));
    },
    
    removeDriver: (driverNumber) => {
      set((state) => ({
        drivers: state.drivers.filter(d => d.driverNumber !== driverNumber),
        selectedDrivers: state.selectedDrivers.filter(d => d !== driverNumber)
      }));
    },
    
    // 랩 데이터 관리
    setLapsData: (laps) => {
      set({ lapsData: laps });
      
      // 총 지속 시간 계산
      if (laps.length > 0) {
        const maxTime = Math.max(...laps.map(lap => lap.lapStartTime + lap.lapDuration));
        set({ totalDuration: maxTime });
      }
    },
    
    addLapData: (lap) => {
      set((state) => ({
        lapsData: [...state.lapsData, lap]
      }));
    },
    
    // 재생 제어
    play: () => {
      set({ isPlaying: true, isPaused: false });
    },
    
    pause: () => {
      set({ isPlaying: false, isPaused: true });
    },
    
    stop: () => {
      set({ 
        isPlaying: false, 
        isPaused: false, 
        currentTime: 0,
        currentLap: 1 
      });
    },
    
    setCurrentTime: (time) => {
      const state = get();
      const clampedTime = Math.max(0, Math.min(time, state.totalDuration));
      
      // 현재 랩 계산
      const currentLap = state.lapsData.length > 0 
        ? Math.max(1, Math.floor(clampedTime / 90) + 1) // 평균 90초/랩 가정
        : 1;
      
      set({ 
        currentTime: clampedTime,
        currentLap 
      });
    },
    
    setTotalDuration: (duration) => set({ totalDuration: duration }),
    
    setPlaybackSpeed: (speed) => {
      const clampedSpeed = Math.max(0.1, Math.min(10, speed));
      set({ playbackSpeed: clampedSpeed });
    },
    
    seekTo: (time) => {
      get().actions.setCurrentTime(time);
    },
    
    // 랩 관리
    setCurrentLap: (lap) => set({ currentLap: lap }),
    
    jumpToLap: (lap) => {
      const state = get();
      const targetLap = Math.max(1, lap);
      
      // 해당 랩의 시작 시간으로 이동
      const lapData = state.lapsData.find(l => l.lapNumber === targetLap);
      if (lapData) {
        get().actions.setCurrentTime(lapData.lapStartTime);
      }
      
      set({ currentLap: targetLap });
    },
    
    // 드라이버 선택
    selectDriver: (driverNumber) => {
      set((state) => ({
        selectedDrivers: state.selectedDrivers.includes(driverNumber)
          ? state.selectedDrivers
          : [...state.selectedDrivers, driverNumber]
      }));
    },
    
    deselectDriver: (driverNumber) => {
      set((state) => ({
        selectedDrivers: state.selectedDrivers.filter(d => d !== driverNumber)
      }));
    },
    
    selectAllDrivers: () => {
      const state = get();
      set({ 
        selectedDrivers: state.drivers.map(d => d.driverNumber) 
      });
    },
    
    deselectAllDrivers: () => {
      set({ selectedDrivers: [] });
    },
    
    // UI 상태
    setShowControls: (show) => set({ showControls: show }),
    setShowDriverInfo: (show) => set({ showDriverInfo: show }),
    
    // 드라이버 위치 업데이트
    updateDriverPositions: (positions) => {
      set({ driverPositions: positions });
    },
    
    // 초기화
    reset: () => {
      set({
        ...initialState,
        currentSession: get().currentSession, // 세션은 유지
        settings: get().settings // 설정은 유지
      });
    },
    
    // 완전한 정리 (엔진 cleanup 포함)
    cleanup: () => {
      // 전역 cleanup 이벤트 발송하여 엔진 정리 요청
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('replayEngineCleanup'));
      }
      
      // 스토어 완전 초기화
      set({
        ...initialState,
        currentSession: null // 세션도 초기화
      });
    },
    
    // 설정
    updateSettings: (newSettings) => {
      set((state) => ({
        settings: { ...state.settings, ...newSettings }
      }));
    }
  }
}));

// 편의를 위한 선택자들
export const useReplaySession = () => useReplayStore(state => state.currentSession);
export const useReplayDrivers = () => useReplayStore(state => state.drivers);
export const useReplayLaps = () => useReplayStore(state => state.lapsData);

// 개별 playback 선택자들 (새로운 객체 생성을 피하기 위해)
export const useReplayIsPlaying = () => useReplayStore(state => state.isPlaying);
export const useReplayIsPaused = () => useReplayStore(state => state.isPaused);
export const useReplayCurrentTime = () => useReplayStore(state => state.currentTime);
export const useReplayTotalDuration = () => useReplayStore(state => state.totalDuration);
export const useReplayPlaybackSpeed = () => useReplayStore(state => state.playbackSpeed);
export const useReplayCurrentLap = () => useReplayStore(state => state.currentLap);
export const useReplayDriverPositions = () => useReplayStore(state => state.driverPositions);
export const useReplaySettings = () => useReplayStore(state => state.settings);
export const useReplayActions = () => useReplayStore(state => state.actions);