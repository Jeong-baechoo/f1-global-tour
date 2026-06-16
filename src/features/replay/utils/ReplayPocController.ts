import { ReplayAnimationEngine } from '../services/ReplayAnimationEngine';
import { useMapStore } from '@/src/features/map/store/useMapStore';
import { mockDrivers } from '../data/mockData';
import { DriverLocationSample, ReplayDriverData } from '../types';

/**
 * [PoC] OpenF1 location(x,y) 기반 마커 위치 검증용 개발 도구.
 *
 * 백엔드/타이밍 흐름과 독립적으로, 미리 받아둔 실제 OpenF1 location 데이터를
 * 로드해 맵 위에서 마커를 실제 좌표대로 움직인다. 등속 추정 방식과의 정확도
 * 차이를 눈으로 확인하기 위한 것.
 *
 * 브라우저 콘솔 사용:
 *   await replayPoc.start()            // 바레인 2024 (기본)
 *   await replayPoc.start('belgium')   // 벨기에(Spa) 2024 — 코너 정합 비교용
 *   replayPoc.pause() / replayPoc.play()
 *   replayPoc.seekTo(120)     // 120초 지점으로 이동
 *   replayPoc.setSpeed(2)     // 2배속
 *   replayPoc.stop()
 */
class ReplayPocController {
  private engine: ReplayAnimationEngine | null = null;

  // 트랙별 PoC 데이터 단축키
  private static readonly DATA_URLS: Record<string, string> = {
    bahrain: '/data/replay-poc/bahrain-9472.json',
    belgium: '/data/replay-poc/belgium-9574.json',
    singapore: '/data/replay-poc/singapore-9606.json',
    brazil: '/data/replay-poc/brazil-9636.json',
    'saudi-arabia': '/data/replay-poc/saudi-arabia-9480.json',
    japan: '/data/replay-poc/japan-9496.json',
    usa: '/data/replay-poc/usa-9617.json',
    mexico: '/data/replay-poc/mexico-9625.json',
    miami: '/data/replay-poc/miami-9507.json',
    'abu-dhabi': '/data/replay-poc/abu-dhabi-9662.json',
    spain: '/data/replay-poc/spain-9539.json',
    monaco: '/data/replay-poc/monaco-9523.json',
    azerbaijan: '/data/replay-poc/azerbaijan-9598.json',
    qatar: '/data/replay-poc/qatar-9655.json',
    italy: '/data/replay-poc/italy-9590.json',
    hungary: '/data/replay-poc/hungary-9566.json',
    netherlands: '/data/replay-poc/netherlands-9582.json',
    austria: '/data/replay-poc/austria-9550.json',
    canada: '/data/replay-poc/canada-9531.json',
    'las-vegas': '/data/replay-poc/las-vegas-9644.json',
    china: '/data/replay-poc/china-9673.json',
    australia: '/data/replay-poc/australia-9488.json',
    imola: '/data/replay-poc/imola-9515.json',
    britain: '/data/replay-poc/britain-9558.json',
  };

  /** 사용 가능한 PoC 트랙 목록 출력 */
  list(): void {
    console.log('🏁 [PoC] 사용 가능한 트랙:', Object.keys(ReplayPocController.DATA_URLS).join(', '));
  }

  async start(track = 'bahrain'): Promise<void> {
    const dataUrl = ReplayPocController.DATA_URLS[track] ?? track;
    const map = useMapStore.getState().map;
    if (!map) {
      console.error('🔴 [PoC] 맵이 준비되지 않았습니다. 지도가 로드된 후 다시 시도하세요.');
      return;
    }

    console.log('🔄 [PoC] location 데이터 로드 중...', dataUrl);
    const res = await fetch(dataUrl);
    if (!res.ok) {
      console.error('🔴 [PoC] 데이터 로드 실패:', res.status);
      return;
    }
    const data = await res.json() as {
      circuitId: string;
      drivers: Record<string, DriverLocationSample[]>;
    };

    const locationByDriver = new Map<number, DriverLocationSample[]>();
    const drivers: ReplayDriverData[] = [];
    for (const [numStr, samples] of Object.entries(data.drivers)) {
      const num = parseInt(numStr, 10);
      locationByDriver.set(num, samples);
      const meta = mockDrivers.find(d => d.driverNumber === num);
      if (meta) drivers.push(meta);
    }

    this.engine?.destroy();
    this.engine = new ReplayAnimationEngine(map);
    await this.engine.loadReplayDataFromLocation(data.circuitId, drivers, locationByDriver);
    this.engine.play();

    console.log(
      `▶️ [PoC] 재생 시작 — circuit=${data.circuitId}, drivers=${drivers.length}, ` +
      `duration=${this.engine.getTotalDuration().toFixed(1)}s`
    );
  }

  play(): void { this.engine?.play(); }
  pause(): void { this.engine?.pause(); }
  seekTo(t: number): void { this.engine?.seekTo(t); }
  setSpeed(s: number): void { this.engine?.setPlaybackSpeed(s); }

  stop(): void {
    this.engine?.destroy();
    this.engine = null;
    console.log('⏹️ [PoC] 정지 및 정리 완료');
  }
}

// 개발 환경에서 브라우저 전역에 등록
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as unknown as { replayPoc: ReplayPocController }).replayPoc = new ReplayPocController();
  console.log('🧪 [PoC] location 검증 도구 준비됨 — 콘솔에서 `await replayPoc.start()` 실행');
}

export { ReplayPocController };
