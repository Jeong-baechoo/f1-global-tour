import { ReplayStoreState } from './useReplayStore';

// 계산된 상태를 위한 선택자들
export const createReplaySelectors = () => ({
  // 재생 상태 정보
  getPlaybackStatus: (state: ReplayStoreState) => ({
    isPlaying: state.isPlaying,
    isPaused: state.isPaused,
    currentTime: state.currentTime,
    totalDuration: state.totalDuration,
    playbackSpeed: state.playbackSpeed,
    progress: state.totalDuration > 0 ? state.currentTime / state.totalDuration : 0
  }),

  // 현재 랩 정보
  getCurrentLapInfo: (state: ReplayStoreState) => {
    if (!state.currentSession || state.lapsData.length === 0) {
      return null;
    }

    return {
      currentLap: state.currentLap,
      totalLaps: Math.max(...state.lapsData.map((lap: { lapNumber: number }) => lap.lapNumber)),
      lapProgress: state.currentLap > 0 ? (state.currentLap - 1) / Math.max(...state.lapsData.map((lap: { lapNumber: number }) => lap.lapNumber)) : 0
    };
  },

  // 선택된 드라이버 정보
  getSelectedDriversInfo: (state: ReplayStoreState) => {
    const selectedDrivers = state.drivers.filter((driver: { driverNumber: number }) => 
      state.selectedDrivers.includes(driver.driverNumber)
    );

    return {
      count: selectedDrivers.length,
      drivers: selectedDrivers,
      isAllSelected: selectedDrivers.length === state.drivers.length,
      isNoneSelected: selectedDrivers.length === 0
    };
  },

  // 세션 상태
  getSessionStatus: (state: ReplayStoreState) => ({
    hasSession: !!state.currentSession,
    hasDrivers: state.drivers.length > 0,
    hasLapsData: state.lapsData.length > 0,
    isReady: !!(state.currentSession && state.drivers.length > 0 && state.lapsData.length > 0),
    isLoading: state.isLoading,
    error: state.error
  }),

  // 드라이버 위치 통계
  getDriverPositionStats: (state: ReplayStoreState) => {
    if (state.driverPositions.length === 0) {
      return null;
    }

    const positions = state.driverPositions;
    const currentLaps = positions.map((pos: { currentLap: number }) => pos.currentLap);
    const lapProgresses = positions.map((pos: { lapProgress: number }) => pos.lapProgress);

    return {
      totalDrivers: positions.length,
      averageLap: currentLaps.reduce((sum: number, lap: number) => sum + lap, 0) / currentLaps.length,
      averageProgress: lapProgresses.reduce((sum: number, progress: number) => sum + progress, 0) / lapProgresses.length,
      leadingDriver: positions.reduce((leader, current) => 
        current.position < leader.position ? current : leader
      )
    };
  },

  // UI 표시용 포맷된 데이터
  getFormattedPlaybackInfo: (state: ReplayStoreState) => {
    const formatTime = (seconds: number): string => {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = Math.floor(seconds % 60);
      return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    return {
      currentTimeFormatted: formatTime(state.currentTime),
      totalDurationFormatted: formatTime(state.totalDuration),
      speedDisplay: `${state.playbackSpeed}x`,
      progressPercentage: state.totalDuration > 0 
        ? Math.round((state.currentTime / state.totalDuration) * 100) 
        : 0
    };
  },

  // 성능 최적화를 위한 얕은 비교 선택자들
  getPlaybackSpeedOnly: (state: ReplayStoreState) => state.playbackSpeed,
  getCurrentTimeOnly: (state: ReplayStoreState) => state.currentTime,
  getIsPlayingOnly: (state: ReplayStoreState) => state.isPlaying,
  getSelectedDriversOnly: (state: ReplayStoreState) => state.selectedDrivers,
  getDriverPositionsOnly: (state: ReplayStoreState) => state.driverPositions
});

// 메모화된 선택자 생성
export const replaySelectors = createReplaySelectors();