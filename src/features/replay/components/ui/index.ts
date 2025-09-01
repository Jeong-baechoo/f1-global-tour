/**
 * Replay Mode UI Components
 * 
 * 리플레이 모드에서만 표시되는 UI 컴포넌트들의 export 파일
 * 이 컴포넌트들은 isReplayMode가 true일 때만 렌더링됩니다.
 */

// 실제 구현된 컴포넌트들
export { DriverInfoPanel } from './DriverInfoPanel';
export type { DriverTiming, DriverInfoPanelProps } from './DriverInfoPanel';
export { mockDriverTimings } from './DriverInfoPanel';

// 향후 구현 예정인 컴포넌트들
// export { ReplayHUD } from './ReplayHUD/ReplayHUD';
// export { LapComparison } from './LapComparison/LapComparison';
// export { ReplayProgress } from './ReplayProgress/ReplayProgress';
// export { ReplaySettings } from './ReplaySettings/ReplaySettings';

// 임시 placeholder export (나중에 제거)
export const REPLAY_UI_COMPONENTS = {
  DriverInfoPanel: 'DriverInfoPanel',
  ReplayHUD: 'ReplayHUD',
  LapComparison: 'LapComparison',
  ReplayProgress: 'ReplayProgress',
  ReplaySettings: 'ReplaySettings'
} as const;

export type ReplayUIComponent = keyof typeof REPLAY_UI_COMPONENTS;