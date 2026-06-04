import mapboxgl from 'mapbox-gl';
import { trackPositionService } from '@/src/features/replay';
import { replayDataService } from './index';
import { DriverPosition, DriverLocationSample, ReplayDriverData, ReplayLapData, ReplaySessionData } from '../types';
import { DriverMarkerManager } from './DriverMarkerManager';
import { CircuitTrackManager } from './CircuitTrackManager';
import { PositionCalculator } from './PositionCalculator';
import { BackendReplayApiService } from './BackendReplayApiService';
import { TrackEventBus } from '@/src/features/circuits/services/track/events/TrackEventBus';


export class ReplayAnimationEngine {
  private map: mapboxgl.Map | null = null;
  private animationFrameId: number | null = null;
  
  private isPlaying = false;
  private startTime = 0;
  private currentTime = 0;
  private playbackSpeed = 1;
  
  private lastPositionUpdateTime = 0;
  private positionUpdateInterval = 50; // 50ms마다 위치 업데이트 (부드러운 애니메이션, CSS transition 없이)
  
  private driversData: ReplayDriverData[] = [];
  private lapsData: ReplayLapData[] = [];
  private circuitId = '';

  // location(x,y) 기반 PoC 모드
  private useLocationMode = false;
  private locationDuration = 0;

  // 백엔드 positions 모드 (프로덕션): {t,lng,lat} 시계열 최대 t
  private backendPositionsDuration = 0;
  
  // 관리자 클래스들
  private markerManager: DriverMarkerManager;
  private trackManager: CircuitTrackManager;
  private positionCalculator: PositionCalculator;
  private zoomListener: (() => void) | null = null;
  
  // 콜백 함수들
  private onTimeUpdate?: (time: number) => void;
  private onDriverPositionsUpdate?: (positions: DriverPosition[]) => void;

  constructor(map: mapboxgl.Map) {
    this.map = map;
    this.markerManager = new DriverMarkerManager(map);
    this.trackManager = new CircuitTrackManager(map);
    this.positionCalculator = new PositionCalculator();
  }

  async loadReplayData(session: ReplaySessionData): Promise<boolean> {
    try {
      // 기존 데이터가 있다면 먼저 정리
      this.cleanupPreviousData();

      // OpenF1 데이터 로드
      return await this.loadOpenF1Data(session);

    } catch (error) {
      console.error('Error loading replay data:', error);
      return false;
    }
  }


  /**
   * [PoC] OpenF1 location 시계열로 리플레이를 로드한다 (백엔드 비의존).
   * 랩 데이터 없이 실제 좌표 기반으로 마커를 움직여 변환 정확도를 검증하는 경로.
   */
  async loadReplayDataFromLocation(
    circuitId: string,
    drivers: ReplayDriverData[],
    locationByDriver: Map<number, DriverLocationSample[]>
  ): Promise<boolean> {
    this.cleanupPreviousData();

    this.useLocationMode = true;
    this.circuitId = circuitId;
    this.driversData = drivers;
    this.lapsData = [];

    // 총 재생 시간 = 모든 드라이버 샘플 중 최대 t
    let maxT = 0;
    locationByDriver.forEach(samples => {
      if (samples.length) maxT = Math.max(maxT, samples[samples.length - 1].t);
    });
    this.locationDuration = maxT;

    this.positionCalculator.setLocationData(circuitId, locationByDriver, drivers);

    await trackPositionService.loadCircuitData(circuitId);
    this.createDriverMarkers();

    try {
      await this.trackManager.drawCircuitTrack(circuitId);
    } catch (error) {
      console.error('Failed to draw circuit track:', error);
    }

    this.setupZoomListener();
    this.updateDriverPositions(0);
    return true;
  }

  private async loadOpenF1Data(session: ReplaySessionData): Promise<boolean> {
    const response = await replayDataService.getFullRaceData(session.sessionKey);
    
    if (!response.success) {
      console.error('Failed to load race data:', response.error);
      return false;
    }

    this.lapsData = response.data.laps;
    this.circuitId = this.mapCircuitName(session.circuitShortName);

    // 유효한 랩 데이터가 있는 드라이버만 포함 (DNF로 랩 데이터가 없는 드라이버 제외)
    const driversWithLaps = new Set(this.lapsData.map(lap => lap.driverNumber));
    this.driversData = response.data.drivers.filter(driver => driversWithLaps.has(driver.driverNumber));

    await this.initializeReplay();

    // 백엔드 positions 주입: 성공하면 랩 등속 추정 대신 실좌표 보간으로 전환 (실패 시 폴백 유지)
    await this.tryLoadBackendPositions(session.sessionKey);
    return true;
  }

  /**
   * 백엔드 {t,lng,lat} 시계열을 로드해 PositionCalculator에 주입한다.
   * 변환·도로스냅은 백엔드가 끝낸 상태 → 프론트는 시간 보간만. 실패하면 랩 기반 폴백 유지.
   */
  private async tryLoadBackendPositions(sessionKey: number): Promise<void> {
    try {
      const backend = BackendReplayApiService.getInstance();
      const { circuitId, byDriver } = await backend.loadPositions(sessionKey);
      if (byDriver.size === 0) return;

      this.positionCalculator.setBackendPositions(circuitId, byDriver, this.driversData);

      // 총 재생 시간 = positions 최대 t (lap 기반과 같은 0점이라 일관)
      let maxT = 0;
      byDriver.forEach(samples => {
        if (samples.length) maxT = Math.max(maxT, samples[samples.length - 1].t);
      });
      this.backendPositionsDuration = maxT;

      // 초기 위치를 백엔드 좌표로 즉시 갱신
      this.updateDriverPositions(this.currentTime);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[ReplayAnimationEngine] 백엔드 positions 미사용(랩 기반 폴백):', error);
      }
    }
  }

  private async initializeReplay(): Promise<void> {
    // 트랙 좌표 데이터 로드
    await trackPositionService.loadCircuitData(this.circuitId);

    // 위치 계산기에 데이터 설정
    this.positionCalculator.setData(
      this.driversData,
      this.lapsData,
      this.circuitId
    );

    // 드라이버 마커 생성
    this.createDriverMarkers();

    // 트랙 레이아웃 생성 (TrackEventBus 등록도 포함)
    try {
      await this.trackManager.drawCircuitTrack(this.circuitId);
    } catch (error) {
      console.error('Failed to draw circuit track:', error);
    }

    // 줌 레벨 변경 시 마커 크기 조절 리스너 추가
    this.setupZoomListener();
  }

  private mapCircuitName(circuitShortName: string): string {
    const mapping: Record<string, string> = {
      'Monte Carlo': 'monaco',
      'Monaco': 'monaco',
      'Silverstone': 'britain',
      'Monza': 'italy',
      'Suzuka': 'japan',
      'Spa-Francorchamps': 'belgium',
      'Interlagos': 'brazil',
      'Albert Park': 'australia',
      'Bahrain': 'bahrain',
      'Imola': 'imola',
      'Miami': 'miami',
      'Barcelona': 'spain',
      'Red Bull Ring': 'austria',
      'Hungaroring': 'hungary',
      'Zandvoort': 'netherlands',
      'Baku': 'azerbaijan',
      'Marina Bay': 'singapore',
      'Austin': 'usa',
      'Mexico City': 'mexico',
      'Las Vegas': 'las-vegas',
      'Losail': 'qatar',
      'Yas Marina': 'abu-dhabi',
      'Jeddah': 'saudi-arabia',
      'Shanghai': 'china',
      'Gilles Villeneuve': 'canada'
    };

    return mapping[circuitShortName] || circuitShortName.toLowerCase().replace(/\s+/g, '-');
  }

  private createDriverMarkers(): void {
    this.markerManager.createDriverMarkers(this.driversData);

    // 모든 드라이버를 출발선에서 시작하도록 위치 설정
    const startPositions = new Map<number, [number, number]>();
    const startPosition = trackPositionService.getPositionAtProgress(this.circuitId, 0);

    if (startPosition) {
      this.driversData.forEach(driver => {
        startPositions.set(driver.driverNumber, [startPosition[0], startPosition[1]]);
      });
    }

    this.markerManager.addMarkersToMap(startPositions);

    // 서킷으로 카메라 이동
    if (this.circuitId) {
      this.trackManager.flyToCircuit(this.circuitId);
    }
  }

  // 재생 제어 메서드들
  play(): void {
    if (!this.isPlaying) {
      this.isPlaying = true;
      this.startTime = performance.now() - (this.currentTime * 1000 / this.playbackSpeed);
      this.animate();
    }
  }

  pause(): void {
    this.isPlaying = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  stop(): void {
    this.pause();
    this.currentTime = 0;
    this.updateDriverPositions(0);
  }

  setPlaybackSpeed(speed: number): void {
    const wasPlaying = this.isPlaying;
    if (wasPlaying) {
      this.pause();
    }
    
    this.playbackSpeed = speed;
    
    if (wasPlaying) {
      this.play();
    }
  }

  seekTo(time: number): void {
    this.currentTime = Math.max(0, time);
    this.updateDriverPositions(this.currentTime);
    
    if (this.isPlaying) {
      this.startTime = performance.now() - (this.currentTime * 1000 / this.playbackSpeed);
    }
  }

  private animate = (): void => {
    if (!this.isPlaying) return;

    const now = performance.now();
    this.currentTime = (now - this.startTime) * this.playbackSpeed / 1000;

    // 위치 업데이트는 throttle 적용
    if (now - this.lastPositionUpdateTime >= this.positionUpdateInterval) {
      this.updateDriverPositions(this.currentTime);
      this.lastPositionUpdateTime = now;
    }
    
    this.onTimeUpdate?.(this.currentTime);

    this.animationFrameId = requestAnimationFrame(this.animate);
  };

  private updateDriverPositions(currentTime: number): void {
    const driverPositions = this.positionCalculator.calculateAllDriverPositions(currentTime);

    // 위치가 반환된 드라이버 Set
    const activeDrivers = new Set(driverPositions.map(p => p.driverNumber));

    driverPositions.forEach(position => {
      this.markerManager.updateMarkerPosition(position.driverNumber, position.coordinates);
      this.markerManager.showDriverMarker(position.driverNumber);
    });

    // 위치가 없는 드라이버 (DNF/리타이어) 마커 숨김
    this.driversData.forEach(driver => {
      if (!activeDrivers.has(driver.driverNumber)) {
        this.markerManager.hideDriverMarker(driver.driverNumber);
      }
    });

    this.onDriverPositionsUpdate?.(driverPositions);
  }

  // 콜백 설정
  setOnTimeUpdate(callback: (time: number) => void): void {
    this.onTimeUpdate = callback;
  }

  setOnDriverPositionsUpdate(callback: (positions: DriverPosition[]) => void): void {
    this.onDriverPositionsUpdate = callback;
  }

  // 마커 표시/숨기기
  showDriverMarker(driverNumber: number): void {
    this.markerManager.showDriverMarker(driverNumber);
  }

  hideDriverMarker(driverNumber: number): void {
    this.markerManager.hideDriverMarker(driverNumber);
  }

  // 줌 리스너 설정
  private setupZoomListener(): void {
    if (!this.map) return;
    
    this.zoomListener = () => {
      const currentZoom = this.map?.getZoom() || 10;
      this.markerManager.updateMarkerSizes(currentZoom);
      this.trackManager.ensureTrackVisibility();
    };
    
    this.map.on('zoom', this.zoomListener);
    
    // 초기 크기 설정
    const initialZoom = this.map.getZoom();
    this.markerManager.updateMarkerSizes(initialZoom);
    this.trackManager.ensureTrackVisibility();
  }

  // 상태 조회
  getLapsData(): typeof this.lapsData {
    return this.lapsData;
  }

  getTotalDuration(): number {
    if (this.useLocationMode) return this.locationDuration;
    // 백엔드 positions가 활성이면 그 구간을 기준으로 한다. lap 기반이 더 길면 데이터 끝
    // 이후 calcFromBackend가 null을 반환해 마커가 먼저 사라지므로, 재생 구간과 마커
    // 존재 구간을 일치시킨다.
    if (this.backendPositionsDuration > 0) return this.backendPositionsDuration;
    if (this.lapsData.length === 0) return 0;
    return Math.max(...this.lapsData.map(l => l.lapStartTime + l.lapDuration));
  }

  getCurrentTime(): number {
    return this.currentTime;
  }

  isCurrentlyPlaying(): boolean {
    return this.isPlaying;
  }

  getPlaybackSpeed(): number {
    return this.playbackSpeed;
  }

  // 정리 메서드들
  private cleanupPreviousData(): void {
    if (this.isPlaying) {
      this.stop();
    }
    
    this.markerManager.clearMarkers();
    this.trackManager.clearCircuitTrack();

    this.driversData = [];
    this.lapsData = [];
    this.currentTime = 0;
    this.startTime = 0;
    this.isPlaying = false;
    this.useLocationMode = false;
    this.locationDuration = 0;
    this.backendPositionsDuration = 0;

    // 세션 전환 시 이전 backendPositions/locationData 잔류 방지
    // (안 비우면 새 세션 초반에 이전 트랙 좌표로 마커가 렌더됨)
    this.positionCalculator.clear();
  }

  cleanup(): void {
    this.stop();
    
    // 맵 이벤트 리스너 제거
    if (this.map && this.zoomListener) {
      this.map.off('zoom', this.zoomListener);
      this.zoomListener = null;
    }
    
    // 콜백 함수 제거
    this.onTimeUpdate = undefined;
    this.onDriverPositionsUpdate = undefined;
    
    this.markerManager.clearMarkers();
    this.trackManager.clearCircuitTrack();
    
    // TrackEventBus cleanup은 CircuitTrackManager에서 처리하지 않으므로 여기서 정리
    TrackEventBus.cleanup();
    
    this.positionCalculator.clear();
    
    this.driversData = [];
    this.lapsData = [];
    this.circuitId = '';
    
    this.isPlaying = false;
    this.currentTime = 0;
    this.startTime = 0;
    this.playbackSpeed = 1;
    this.lastPositionUpdateTime = 0;
  }

  destroy(): void {
    this.cleanup();
    this.map = null;
  }
}