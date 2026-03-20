import { DriverTimingService } from '../services/DriverTimingService';

/**
 * 개발자용 리플레이 서비스 전환 유틸리티
 * 브라우저 콘솔에서 사용할 수 있는 디버깅 도구
 */
export class ReplayServiceSwitcher {
  private static instance: ReplayServiceSwitcher;
  private driverTimingService: DriverTimingService;

  static getInstance(): ReplayServiceSwitcher {
    if (!ReplayServiceSwitcher.instance) {
      ReplayServiceSwitcher.instance = new ReplayServiceSwitcher();
    }
    return ReplayServiceSwitcher.instance;
  }

  constructor() {
    this.driverTimingService = DriverTimingService.getInstance();
  }

  /**
   * 현재 서비스 상태 출력
   */
  status(): void {
    const status = this.driverTimingService.getServiceStatus();
    console.table(status);
    console.log('📊 Service Status:', status);
  }

  /**
   * 백엔드 서비스로 전환
   */
  async useBackend(): Promise<void> {
    console.log('🔄 Switching to backend service...');
    
    const success = await this.driverTimingService.tryBackendService();
    if (success) {
      this.driverTimingService.switchToService('backend');
      console.log('✅ Successfully switched to backend service');
    } else {
      console.log('❌ Failed to switch to backend service');
    }
    
    this.status();
  }

  /**
   * Mock 서비스로 전환
   */
  useMock(): void {
    console.log('🔄 Switching to mock service...');
    this.driverTimingService.switchToService('mock');
    console.log('✅ Switched to mock service');
    this.status();
  }

  /**
   * 백엔드 API 헬스 체크
   */
  async healthCheck(): Promise<void> {
    const isAvailable = this.driverTimingService.isBackendAvailable();
    console.log(`🏥 Backend API Health: ${isAvailable ? '🟢 Healthy' : '🔴 Unavailable'}`);
    
    if (!isAvailable) {
      console.log('💡 Tip: Make sure backend server is running on http://localhost:4000');
    }
  }

  /**
   * 테스트용 드라이버 타이밍 데이터 가져오기
   */
  testTimings(): void {
    console.log('🧪 Testing driver timings (currentTime=0)...');
    try {
      const timings = this.driverTimingService.getTimingsForDisplay(0);
      console.log('✅ Driver timings:', timings);
      console.table(timings.slice(0, 5));
    } catch (error) {
      console.error('❌ Failed to get driver timings:', error);
    }
  }

  /**
   * 리플레이 세션 시작 테스트
   */
  async startReplay(sessionKey: number = 9472): Promise<void> {
    console.log(`🎬 Starting replay session: ${sessionKey}`);
    
    try {
      await this.driverTimingService.startReplaySession(sessionKey);
      console.log('✅ Replay session started successfully');
    } catch (error) {
      console.error('❌ Failed to start replay session:', error);
    }
  }

  /**
   * 도움말 출력
   */
  help(): void {
    console.log(`
🎯 F1 Replay Service Switcher Commands:

📊 Status & Info:
  switcher.status()           - Show current service status
  switcher.healthCheck()      - Check backend API health

🔄 Service Switching:
  switcher.useBackend()       - Switch to backend API service
  switcher.useMock()          - Switch to mock data service

🧪 Testing:
  switcher.testTimings()      - Test driver timings generation
  switcher.startReplay(9472)  - Start replay session with sessionKey

❓ Help:
  switcher.help()             - Show this help message

💡 Usage Example:
  const switcher = ReplayServiceSwitcher.getInstance();
  switcher.status();
  await switcher.useBackend();
`);
  }
}

// 브라우저 글로벌 객체에 등록 (개발 환경에서만)
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as unknown as { replaySwitcher: ReplayServiceSwitcher }).replaySwitcher = ReplayServiceSwitcher.getInstance();
  console.log(`
🎮 F1 Replay Service Switcher Available!

Usage: replaySwitcher.help()

Quick Start:
- replaySwitcher.status()         # Check current status
- await replaySwitcher.useBackend()  # Switch to backend
- replaySwitcher.useMock()        # Switch to mock
`);
}

export const createReplaySwitcher = () => ReplayServiceSwitcher.getInstance();