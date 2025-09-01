import { OpenF1MockDataService } from './OpenF1MockDataService';
import { DriverTimingService } from './DriverTimingService';

export class RealtimeUpdateService {
  private static instance: RealtimeUpdateService;
  private updateInterval: NodeJS.Timeout | null = null;
  private isActive: boolean = false;
  private updateFrequency: number = 4000; // OpenF1 API와 동일한 4초 간격
  private callbacks: Array<() => void> = [];

  static getInstance(): RealtimeUpdateService {
    if (!RealtimeUpdateService.instance) {
      RealtimeUpdateService.instance = new RealtimeUpdateService();
    }
    return RealtimeUpdateService.instance;
  }

  // 실시간 업데이트 시작
  startRealtimeUpdates(): void {
    if (this.isActive) {
      console.log('⏱️ Realtime updates already active');
      return;
    }

    console.log('🚦 Starting realtime driver timing updates');
    this.isActive = true;

    // 즉시 첫 업데이트 실행
    this.triggerUpdate();

    // 정기적 업데이트 시작
    this.updateInterval = setInterval(() => {
      this.triggerUpdate();
    }, this.updateFrequency);
  }

  // 실시간 업데이트 중지
  stopRealtimeUpdates(): void {
    if (!this.isActive) {
      console.log('⏱️ Realtime updates already inactive');
      return;
    }

    console.log('🏁 Stopping realtime driver timing updates');
    this.isActive = false;

    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  // 업데이트 콜백 등록
  onUpdate(callback: () => void): void {
    this.callbacks.push(callback);
  }

  // 업데이트 콜백 해제
  offUpdate(callback: () => void): void {
    const index = this.callbacks.indexOf(callback);
    if (index > -1) {
      this.callbacks.splice(index, 1);
    }
  }

  // 모든 콜백 해제
  clearCallbacks(): void {
    this.callbacks = [];
  }

  // 수동 업데이트 트리거
  triggerUpdate(): void {
    // OpenF1 서비스에 미세한 변동 적용 (실시간 느낌을 위해)
    this.applyRealtimeVariations();

    // 등록된 모든 콜백 실행
    this.callbacks.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.warn('Update callback error:', error);
      }
    });
  }

  // 실시간 데이터 변동 시뮬레이션
  private applyRealtimeVariations(): void {
    const openF1Service = OpenF1MockDataService.getInstance();
    const currentLap = openF1Service.getCurrentLap();
    
    // 10% 확률로 랩 자동 진행 (리플레이가 재생중일 때)
    if (Math.random() < 0.1 && this.isActive) {
      const driverTimingService = DriverTimingService.getInstance();
      const maxLap = 58; // 일반적인 레이스 랩 수
      
      if (currentLap < maxLap) {
        const nextLap = currentLap + 1;
        driverTimingService.setCurrentLap(nextLap);
        console.log(`🏎️ Auto-advanced to lap ${nextLap}`);
      }
    }
  }

  // 현재 상태 확인
  isRealtimeActive(): boolean {
    return this.isActive;
  }

  // 업데이트 빈도 설정
  setUpdateFrequency(milliseconds: number): void {
    this.updateFrequency = Math.max(1000, milliseconds); // 최소 1초
    
    // 이미 실행중이면 재시작
    if (this.isActive) {
      this.stopRealtimeUpdates();
      this.startRealtimeUpdates();
    }
  }

  // 현재 업데이트 빈도 반환
  getUpdateFrequency(): number {
    return this.updateFrequency;
  }

  // 완전 정리 (컴포넌트 언마운트 시)
  cleanup(): void {
    this.stopRealtimeUpdates();
    this.clearCallbacks();
  }
}