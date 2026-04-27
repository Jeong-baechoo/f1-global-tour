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

  // 랩 데이터 관리
  setLapsData: (laps: ReplayLapData[]) => void;

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
  driverPositions: DriverPosition[];
  settings: ReplaySettings;
  isLoading: boolean;
  error: string | null;
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
  currentSession: null,
  drivers: [],
  lapsData: [],
  isPlaying: false,
  isPaused: false,
  currentTime: 0,
  totalDuration: 0,
  playbackSpeed: 1,
  currentLap: 1,
  selectedDrivers: [],
  showControls: true,
  showDriverInfo: true,
  driverPositions: [],
  settings: initialSettings,
  isLoading: false,
  error: null,
};

/**
 * lapsData에서 각 랩별 최소 시작 시각을 미리 계산 (선두 드라이버 기준)
 * setCurrentTime이 고빈도로 호출되므로, lapsData 변경 시에만 재계산하도록 캐시
 */
let cachedLapStartTimes: [number, number][] = [];
let cachedLapsDataRef: ReplayLapData[] = [];

function buildLapStartTimes(lapsData: ReplayLapData[]): [number, number][] {
  const map = new Map<number, number>();
  for (const l of lapsData) {
    const existing = map.get(l.lapNumber);
    if (existing === undefined || l.lapStartTime < existing) {
      map.set(l.lapNumber, l.lapStartTime);
    }
  }
  // 시작 시각 기준 내림차순 정렬 (큰 랩부터 비교하기 위해)
  return [...map.entries()].sort((a, b) => b[1] - a[1]);
}

function computeCurrentLap(time: number, lapsData: ReplayLapData[]): number {
  if (lapsData.length === 0) {
    return Math.max(1, Math.floor(time / 90) + 1);
  }

  // lapsData가 변경된 경우에만 재계산
  if (lapsData !== cachedLapsDataRef) {
    cachedLapsDataRef = lapsData;
    cachedLapStartTimes = buildLapStartTimes(lapsData);
  }

  // 내림차순 정렬이므로 첫 번째로 time 이하인 항목이 현재 랩
  for (const [lapNum, startTime] of cachedLapStartTimes) {
    if (startTime <= time) {
      return lapNum;
    }
  }
  return 1;
}

export const useReplayStore = create<ReplayStoreState>((set, get) => ({
  ...initialState,

  actions: {
    setCurrentSession: (session) => {
      if (get().currentSession?.sessionKey === session?.sessionKey) {
        return;
      }

      if (session) {
        try {
          DriverTimingService.getInstance().setCurrentSession(session);
        } catch (error) {
          console.error('Failed to set session in DriverTimingService:', error);
        }

        // 세션 설정과 함께 상태 초기화 (set 1회로 통합)
        set((state) => ({
          ...initialState,
          currentSession: session,
          settings: state.settings
        }));
      } else {
        set({ currentSession: null });
      }
    },

    setDrivers: (drivers) => set({ drivers }),

    setLapsData: (laps) => {
      const totalDuration = laps.length > 0
        ? Math.max(...laps.map(lap => lap.lapStartTime + lap.lapDuration))
        : get().totalDuration;
      set({ lapsData: laps, totalDuration });
    },

    // 재생 제어
    play: () => set({ isPlaying: true, isPaused: false }),
    pause: () => set({ isPlaying: false, isPaused: true }),
    stop: () => set({ isPlaying: false, isPaused: false, currentTime: 0, currentLap: 1 }),

    setCurrentTime: (time) => {
      const { totalDuration, lapsData } = get();
      const clampedTime = totalDuration > 0
        ? Math.max(0, Math.min(time, totalDuration))
        : Math.max(0, time);

      set({
        currentTime: clampedTime,
        currentLap: computeCurrentLap(clampedTime, lapsData)
      });
    },

    setTotalDuration: (duration) => set({ totalDuration: duration }),

    setPlaybackSpeed: (speed) => {
      set({ playbackSpeed: Math.max(0.1, Math.min(10, speed)) });
    },

    seekTo: (time) => {
      get().actions.setCurrentTime(time);
    },

    // 랩 관리
    setCurrentLap: (lap) => set({ currentLap: lap }),

    jumpToLap: (lap) => {
      const state = get();
      const targetLap = Math.max(1, lap);
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
      set({ selectedDrivers: get().drivers.map(d => d.driverNumber) });
    },

    deselectAllDrivers: () => set({ selectedDrivers: [] }),

    // UI 상태
    setShowControls: (show) => set({ showControls: show }),
    setShowDriverInfo: (show) => set({ showDriverInfo: show }),

    // 드라이버 위치 업데이트 (성능 최적화)
    updateDriverPositions: (positions) => {
      set((state) => {
        if (!state.driverPositions || state.driverPositions.length !== positions.length) {
          return { driverPositions: positions };
        }

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

        return state;
      });
    },

    // 초기화
    reset: () => {
      const { currentSession, settings } = get();
      set({ ...initialState, currentSession, settings });
    },

    // 완전한 정리 (엔진 cleanup 포함)
    cleanup: () => {
      set({ isPlaying: false, isPaused: false });

      window.dispatchEvent(new CustomEvent('replayEngineCleanup'));

      // 스토어 완전 초기화 (비동기로 처리하여 이벤트 처리 시간 확보)
      setTimeout(() => {
        set({ ...initialState, currentSession: null });
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

// 기본 셀렉터
export const useReplaySession = () => useReplayStore(state => state.currentSession);
export const useReplayDrivers = () => useReplayStore(state => state.drivers);
export const useReplayActions = () => useReplayStore(state => state.actions);

// 성능 최적화된 원자 셀렉터 (primitive 값만 반환하여 불필요한 리렌더 방지)
export const useReplayIsPlaying = () => useReplayStore(state => state.isPlaying);
export const useReplayCurrentTime = () => useReplayStore(state => state.currentTime);
export const useReplayTotalDuration = () => useReplayStore(state => state.totalDuration);
export const useReplayPlaybackSpeed = () => useReplayStore(state => state.playbackSpeed);
export const useReplayCurrentLap = () => useReplayStore(state => state.currentLap);
export const useReplayDriverPositions = () => useReplayStore(state => state.driverPositions);
