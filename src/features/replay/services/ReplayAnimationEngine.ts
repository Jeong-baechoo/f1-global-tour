import mapboxgl from 'mapbox-gl';
import { trackPositionService } from '@/src/features/replay';
import { replayDataService } from './index';
import { DriverPosition, ReplayDriverData, ReplayLapData, ReplaySessionData } from '../types';
import { DriverMarkerManager } from './DriverMarkerManager';
import { CircuitTrackManager } from './CircuitTrackManager';
import { PositionCalculator } from './PositionCalculator';
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
  private telemetryData: Array<{
    time: number;
    longitude?: number;
    latitude?: number;
    distance?: number;
  }> = [];
  private circuitId = '';
  
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
      
      // FastF1 텔레메트리 데이터 먼저 시도
      if (await this.tryLoadFastF1Data(session)) {
        return true;
      }

      // 기존 방식으로 fallback
      return await this.loadOpenF1Data(session);
      
    } catch (error) {
      console.error('Error loading replay data:', error);
      return false;
    }
  }

  private async tryLoadFastF1Data(session: ReplaySessionData): Promise<boolean> {
    try {
      const fastF1Response = await replayDataService.getFastF1TelemetryData(2024, 1, 1);
      if (!fastF1Response.success || !fastF1Response.data) {
        return false;
      }

      const convertedData = replayDataService.convertFastF1ToReplayData(fastF1Response.data);
      
      this.driversData = convertedData.drivers;
      this.lapsData = convertedData.laps;
      this.telemetryData = convertedData.telemetryPoints;
      this.circuitId = this.mapCircuitName(session.circuitShortName);
      
      await this.initializeReplay();
      return true;
      
    } catch (error) {
      console.warn('FastF1 data loading failed, falling back to standard method:', error);
      return false;
    }
  }

  private async loadOpenF1Data(session: ReplaySessionData): Promise<boolean> {
    const response = await replayDataService.getFullRaceData(session.sessionKey);
    
    if (!response.success) {
      console.error('Failed to load race data:', response.error);
      return false;
    }

    this.driversData = response.data.drivers;
    this.lapsData = response.data.laps;
    this.telemetryData = [];
    this.circuitId = this.mapCircuitName(session.circuitShortName);
    
    await this.initializeReplay();
    return true;
  }

  private async initializeReplay(): Promise<void> {
    // 트랙 좌표 데이터 로드
    await trackPositionService.loadCircuitData(this.circuitId);
    
    // 위치 계산기에 데이터 설정
    this.positionCalculator.setData(
      this.driversData, 
      this.lapsData, 
      this.telemetryData, 
      this.circuitId
    );
    
    // 드라이버 마커 생성
    this.createDriverMarkers();
    
    // 트랙 레이아웃 생성 (TrackEventBus 등록도 포함)
    try {
      await this.trackManager.drawCircuitTrack(this.circuitId);
      
    } catch (error) {
      console.error('❌ Failed to draw circuit track:', error);
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
    
    this.driversData.forEach(driver => {
      const startPosition = trackPositionService.getPositionAtProgress(this.circuitId, 0);
      if (startPosition && Array.isArray(startPosition) && startPosition.length === 2) {
        startPositions.set(driver.driverNumber, [startPosition[0], startPosition[1]]);
      }
    });

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

    driverPositions.forEach(position => {
      this.markerManager.updateMarkerPosition(position.driverNumber, position.coordinates);
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
    this.telemetryData = [];
    this.currentTime = 0;
    this.startTime = 0;
    this.isPlaying = false;
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
    this.telemetryData = [];
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