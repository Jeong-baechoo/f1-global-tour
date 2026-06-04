// Core services - order matters to avoid circular dependencies
export { OpenF1MockDataService } from './OpenF1MockDataService';
export { BackendReplayApiService } from './BackendReplayApiService';
export { DriverTimingService } from './DriverTimingService';

// Legacy services
import { ReplayDataService } from './ReplayDataService';
export { ReplayDataService };
export const replayDataService = new ReplayDataService();

// Map and animation services
export { TrackPositionService, trackPositionService } from './TrackPositionService';
export { ReplayAnimationEngine } from './ReplayAnimationEngine';
export { DriverMarkerManager } from './DriverMarkerManager';
export { CircuitTrackManager } from './CircuitTrackManager';
export { PositionCalculator } from './PositionCalculator';

// 유틸리티 및 디버깅 도구
export { ReplayServiceSwitcher } from '../utils/ReplayServiceSwitcher';

// PoC 위치 검증 도구(window.replayPoc)는 개발 환경에서만 동적 로드한다.
// 프로덕션 빌드에서는 이 블록이 제거되어 PoC 코드가 메인 번들에 포함되지 않는다.
if (process.env.NODE_ENV === 'development') {
  void import('../utils/ReplayPocController');
}
