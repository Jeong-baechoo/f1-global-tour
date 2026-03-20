import { create } from 'zustand';
import { 
  ReplayState, 
  ReplaySessionData, 
  ReplayDriverData, 
  ReplayLapData, 
  DriverPosition,
  ReplaySettings 
} from '../types';
import { DriverTimingService } from '@/src/features/replay';

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

export interface ReplayStoreState extends ReplayState {
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
  selectedCamera: 'overview',
  showLapTimes: true,
  showPositions: true,
  enableSmoothAnimation: true
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
    // 세션 관리 (순환 의존성 방지)
    setCurrentSession: (session) => {
      // 현재 세션과 동일하면 무시
      if (get().currentSession?.sessionKey === session?.sessionKey) {
        return;
      }
      
      // 먼저 세션 설정
      set({ currentSession: session });
      
      if (session) {
        // DriverTimingService에 세션 정보 전달
        try {
          const driverTimingService = DriverTimingService.getInstance();
          driverTimingService.setCurrentSession(session);
        } catch (error) {
          console.error('Failed to set session in DriverTimingService:', error);
        }
        
        // 직접 초기화 (순환 호출 방지)
        set((state) => ({
          ...initialState,
          currentSession: session,
          settings: state.settings
        }));
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
      // totalDuration이 0이면 아직 로드 전이므로 clamp하지 않음 (엔진이 보내는 시간 그대로 사용)
      const clampedTime = state.totalDuration > 0
        ? Math.max(0, Math.min(time, state.totalDuration))
        : Math.max(0, time);

      // 현재 랩 계산: lapsData가 있으면 실제 랩 시작 시각 기준, 없으면 평균 90초 fallback
      let currentLap = 1;
      if (state.lapsData.length > 0) {
        // 각 lapNumber별 최소 lapStartTime (선두 드라이버 기준 근사값)
        const lapStartTimes = new Map<number, number>();
        state.lapsData.forEach(l => {
          const existing = lapStartTimes.get(l.lapNumber);
          if (existing === undefined || l.lapStartTime < existing) {
            lapStartTimes.set(l.lapNumber, l.lapStartTime);
          }
        });
        lapStartTimes.forEach((startTime, lapNum) => {
          if (startTime <= clampedTime && lapNum > currentLap) {
            currentLap = lapNum;
          }
        });
      } else {
        currentLap = Math.max(1, Math.floor(clampedTime / 90) + 1);
      }

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
    
    // 드라이버 위치 업데이트 (성능 최적화)
    updateDriverPositions: (positions) => {
      set((state) => {
        // 길이가 다르거나 배열이 없으면 즉시 업데이트
        if (!state.driverPositions || state.driverPositions.length !== positions.length) {
          return { driverPositions: positions };
        }
        
        // 핵심 좌표만 빠르게 비교 (빈번한 업데이트를 위한 매우 민감한 임계값)
        for (let i = 0; i < positions.length; i++) {
          const current = state.driverPositions[i];
          const newPos = positions[i];
          
          if (!current || 
              current.driverNumber !== newPos.driverNumber ||
              Math.abs(current.longitude - newPos.longitude) > 0.000001 ||
              Math.abs(current.latitude - newPos.latitude) > 0.000001) {
            return { driverPositions: positions };
          }
        }
        
        // 변경사항 없으면 현재 상태 유지
        return state;
      });
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
      // 재생 중지
      set({ isPlaying: false, isPaused: false });
      
      // 전역 cleanup 이벤트 발송하여 엔진 정리 요청
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('replayEngineCleanup'));
      }
      
      // 스토어 완전 초기화 (비동기로 처리하여 이벤트 처리 시간 확보)
      setTimeout(() => {
        set({
          ...initialState,
          currentSession: null
        });
      }, 0);
    },
    
    // 설정
    updateSettings: (newSettings) => {
      set((state) => ({
        settings: { ...state.settings, ...newSettings }
      }));
    }
  }
}));

// 편의를 위한 선택자들 - 기본 데이터
export const useReplaySession = () => useReplayStore(state => state.currentSession);
export const useReplayDrivers = () => useReplayStore(state => state.drivers);
export const useReplayLaps = () => useReplayStore(state => state.lapsData);
export const useReplaySettings = () => useReplayStore(state => state.settings);
export const useReplayActions = () => useReplayStore(state => state.actions);

// 성능 최적화된 선택자들 - 역시 새로운 객체 생성 방지
export const useReplayIsPlaying = () => useReplayStore(state => state.isPlaying);
export const useReplayIsPaused = () => useReplayStore(state => state.isPaused);
export const useReplayCurrentTime = () => useReplayStore(state => state.currentTime);
export const useReplayTotalDuration = () => useReplayStore(state => state.totalDuration);
export const useReplayPlaybackSpeed = () => useReplayStore(state => state.playbackSpeed);
export const useReplayCurrentLap = () => useReplayStore(state => state.currentLap);
export const useReplayDriverPositions = () => useReplayStore(state => state.driverPositions);

// 계산된 상태 선택자들
export const useReplayPlaybackStatus = () => useReplayStore(state => ({
  isPlaying: state.isPlaying,
  isPaused: state.isPaused,
  currentTime: state.currentTime,
  totalDuration: state.totalDuration,
  progress: state.totalDuration > 0 ? state.currentTime / state.totalDuration : 0
}));

export const useReplaySelectedDriversInfo = () => useReplayStore(state => {
  const selectedDrivers = state.drivers.filter(driver => 
    state.selectedDrivers.includes(driver.driverNumber)
  );
  return {
    count: selectedDrivers.length,
    drivers: selectedDrivers,
    isAllSelected: selectedDrivers.length === state.drivers.length,
    isNoneSelected: selectedDrivers.length === 0
  };
});

export const useReplaySessionStatus = () => useReplayStore(state => ({
  hasSession: !!state.currentSession,
  hasDrivers: state.drivers.length > 0,
  hasLapsData: state.lapsData.length > 0,
  isReady: !!(state.currentSession && state.drivers.length > 0 && state.lapsData.length > 0),
  isLoading: state.isLoading,
  error: state.error
}));