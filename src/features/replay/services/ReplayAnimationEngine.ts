import mapboxgl from 'mapbox-gl';
import { trackPositionService } from '@/src/features/replay';
import { replayDataService } from './index';
import { DriverPosition, ReplayDriverData, ReplayLapData, ReplaySessionData, FastF1TelemetryPoint } from '../types';
import { DriverMarkerManager } from './DriverMarkerManager';
import { CircuitTrackManager } from './CircuitTrackManager';
import { PositionCalculator } from './PositionCalculator';

export class ReplayAnimationEngine {
  private map: mapboxgl.Map | null = null;
  private animationFrameId: number | null = null;
  
  private isPlaying = false;
  private startTime = 0;
  private currentTime = 0;
  private playbackSpeed = 1;
  
  private driversData: ReplayDriverData[] = [];
  private lapsData: ReplayLapData[] = [];
  private telemetryData: { [driverNumber: number]: FastF1TelemetryPoint[] } = {};
  private circuitId = '';
  
  // 관리자 클래스들
  private markerManager: DriverMarkerManager;
  private trackManager: CircuitTrackManager;
  private positionCalculator: PositionCalculator;
  
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
      
      // FastF1 백엔드 서버에서만 텔레메트리 데이터 로드
      return await this.tryLoadFastF1Data(session);
      
    } catch (error) {
      console.error('Error loading FastF1 replay data:', error);
      return false;
    }
  }

  private async tryLoadFastF1Data(session: ReplaySessionData): Promise<boolean> {
    try {
      console.log('🔍 Attempting FastF1 progressive loading for session:', session);
      // 점진적 로딩을 사용해서 빠른 드라이버부터 표시
      return await this.tryLoadFastF1DataProgressively(session);
      
    } catch (error) {
      console.error('❌ FastF1 progressive loading failed, falling back to standard method:', error);
      return false;
    }
  }

  private async tryLoadFastF1DataProgressively(session: ReplaySessionData): Promise<boolean> {
    try {
      // 세션에서 올바른 연도와 라운드 추출
      const year = session.year;
      const round = this.getCircuitRoundNumber(session.circuitShortName, year);
      
      // 2024 F1 시즌 정확한 드라이버 번호들 사용
      const allDriverNumbers = replayDataService.getF1DriverNumbers();
      
      // 기본 설정
      this.circuitId = this.mapCircuitName(session.circuitShortName);
      this.driversData = [];
      this.lapsData = [];
      this.telemetryData = {};
      
      // 트랙 좌표 데이터 로드 및 기본 UI 설정
      console.log(`🛤️ Loading circuit data for: ${this.circuitId}`);
      await trackPositionService.loadCircuitData(this.circuitId);
      
      let hasAnyData = false;
      let loadedDriverCount = 0;
      
      // 각 드라이버를 개별적으로 로드하되 30초 타임아웃 적용 (FastF1 처리 시간 고려)
      const loadDriverWithTimeout = async (driverNumber: number): Promise<void> => {
        console.log(`🔄 Starting to load driver ${driverNumber}...`);
        try {
          const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error(`Driver ${driverNumber} loading timeout`)), 30000);
          });
          
          const loadPromise = replayDataService.getFastF1FullRaceData(year, round, driverNumber);
          
          const response = await Promise.race([loadPromise, timeoutPromise]);
          
          if (response.success && response.data) {
            console.log(`✅ Successfully loaded driver ${driverNumber}`);
            // 성공적으로 로드된 드라이버 데이터 처리
            const singleDriverArray = [response.data];
            const convertedData = replayDataService.convertMultipleFastF1ToReplayData(singleDriverArray);
            
            // 기존 데이터에 추가
            this.driversData.push(...convertedData.drivers);
            this.lapsData.push(...convertedData.laps);
            Object.assign(this.telemetryData, convertedData.telemetryPoints);
            
            loadedDriverCount++;
            hasAnyData = true;
            
            console.log(`📊 Total drivers loaded so far: ${loadedDriverCount}`);
            
            // 첫 번째 드라이버가 로드되면 즉시 리플레이 초기화
            if (loadedDriverCount === 1) {
              console.log('🎬 Initializing replay with first driver');
              await this.initializeReplayProgressive();
            } else {
              // 추가 드라이버는 점진적으로 추가
              console.log(`➕ Adding progressive driver ${driverNumber}`);
              await this.addProgressiveDriver(convertedData.drivers[0]);
            }
          } else {
            console.warn(`⚠️ Driver ${driverNumber} data load failed or empty`);
          }
        } catch (error) {
          console.warn(`❌ Driver ${driverNumber} loading failed:`, error instanceof Error ? error.message : error);
        }
      };

      // 모든 드라이버를 병렬로 로드 시작 (각각 30초 타임아웃)
      const loadPromises = allDriverNumbers.map(loadDriverWithTimeout);
      
      // 처음 몇 개라도 로드될 때까지 최대 30초 대기 (더 많은 드라이버를 위해)
      await new Promise<void>((resolve) => {
        const checkInterval = setInterval(() => {
          // 최소 3개 드라이버가 로드되었거나 충분한 시간이 지났으면 시작
          if (hasAnyData && loadedDriverCount >= 3) {
            console.log(`🚀 Starting replay with ${loadedDriverCount} drivers loaded initially`);
            clearInterval(checkInterval);
            resolve();
          }
        }, 500);
        
        // 최대 30초 대기 후 시작 (더 긴 대기 시간으로 더 많은 드라이버 로드)
        setTimeout(() => {
          console.log(`⏰ Timeout reached. Starting replay with ${loadedDriverCount} drivers`);
          clearInterval(checkInterval);
          resolve();
        }, 30000);
      });
      
      // 백그라운드에서 나머지 드라이버들 계속 로드
      Promise.allSettled(loadPromises).then((results) => {
        const successCount = results.filter(r => r.status === 'fulfilled').length;
        const failureCount = results.filter(r => r.status === 'rejected').length;
        
        console.log(`🏁 Background loading completed. Successful: ${successCount}, Failed: ${failureCount}`);
        console.log(`📝 Loading results:`, results.map((result, index) => ({
          driver: allDriverNumbers[index],
          status: result.status,
          reason: result.status === 'rejected' ? result.reason?.message : 'success'
        })));
        
        if (this.driversData.length > 0) {
          // 최종적으로 위치 계산기 데이터 업데이트 
          console.log(`🔄 Final position calculator update with ${this.driversData.length} drivers`);
          this.positionCalculator.setData(
            this.driversData, 
            this.lapsData, 
            this.telemetryData, 
            this.circuitId
          );
          
          // 모든 마커가 맵에 있는지 확인하고 필요하면 추가
          console.log(`✅ Background loading completed. Total drivers available: ${this.driversData.length}`);
          console.log(`🎯 Available driver numbers: [${this.driversData.map(d => d.driverNumber).join(', ')}]`);
        }
      });
      
      return hasAnyData;
      
    } catch (error) {
      console.warn('Progressive loading failed:', error);
      return false;
    }
  }

  private async initializeReplayProgressive(): Promise<void> {
    // 위치 계산기에 초기 데이터 설정
    this.positionCalculator.setData(
      this.driversData, 
      this.lapsData, 
      this.telemetryData, 
      this.circuitId
    );
    
    // 드라이버 마커 생성
    this.createDriverMarkers();
    
    // 트랙 레이아웃 생성 - 타이밍 개선
    this.trackManager.drawCircuitTrack(this.circuitId).catch(error => {
      console.error('❌ Failed to draw circuit track:', error);
    });
    
    // 줌 레벨 변경 시 마커 크기 조절 리스너 추가
    this.setupZoomListener();
  }

  private async addProgressiveDriver(driver: ReplayDriverData): Promise<void> {
    // 개별 드라이버 마커 추가 (기존 마커는 유지)
    this.markerManager.addSingleDriverMarker(driver);
    
    // 트랙 데이터가 로드되었는지 확인하고, 없으면 로드 완료 대기
    try {
      // 트랙 데이터가 없으면 먼저 로드
      await trackPositionService.loadCircuitData(this.circuitId);
      
      // 프로그레시브 로딩 시에는 드라이버 인덱스 기반으로 위치 분산
      const driverIndex = this.driversData.findIndex(d => d.driverNumber === driver.driverNumber);
      const gridOffset = (driverIndex * 0.005) % 0.1;
      const startPosition = trackPositionService.getPositionAtProgress(this.circuitId, gridOffset);
      if (startPosition && Array.isArray(startPosition) && startPosition.length === 2) {
        const startPositions = new Map<number, [number, number]>();
        startPositions.set(driver.driverNumber, [startPosition[0], startPosition[1]]);
        this.markerManager.addMarkersToMap(startPositions);
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.warn(`⚠️ Could not get start position for driver ${driver.driverNumber}, circuit: ${this.circuitId}`);
        }
      }
    } catch (error) {
      console.error(`❌ Error loading track data or getting start position for driver ${driver.driverNumber}:`, error);
    }
    
    // 위치 계산기 데이터 업데이트
    this.positionCalculator.setData(
      this.driversData, 
      this.lapsData, 
      this.telemetryData, 
      this.circuitId
    );
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
    
    // 트랙 레이아웃 생성 - 타이밍 개선
    this.trackManager.drawCircuitTrack(this.circuitId).catch(error => {
      console.error('❌ Failed to draw circuit track:', error);
    });
    
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

  private getCircuitRoundNumber(circuitShortName: string, year: number): number {
    // 2024 시즌 라운드 매핑
    const roundMapping2024: Record<string, number> = {
      'Bahrain': 1,
      'Jeddah': 2,
      'Albert Park': 3,
      'Suzuka': 4,
      'Shanghai': 5,
      'Miami': 6,
      'Imola': 7,
      'Monaco': 8,
      'Gilles Villeneuve': 9,
      'Barcelona': 10,
      'Red Bull Ring': 11,
      'Silverstone': 12,
      'Hungaroring': 13,
      'Spa-Francorchamps': 14,
      'Zandvoort': 15,
      'Monza': 16,
      'Baku': 17,
      'Marina Bay': 18,
      'Austin': 19,
      'Mexico City': 20,
      'Interlagos': 21,
      'Las Vegas': 22,
      'Losail': 23,
      'Yas Marina': 24
    };

    if (year === 2024) {
      return roundMapping2024[circuitShortName] || 1;
    }

    // 다른 연도는 기본값 1 반환 (나중에 확장 가능)
    console.warn(`라운드 매핑이 없는 연도/서킷: ${year}/${circuitShortName}, 기본값 1 사용`);
    return 1;
  }

  private createDriverMarkers(): void {
    this.markerManager.createDriverMarkers(this.driversData);
    
    // 그리드 순서로 드라이버들을 분산 배치
    const startPositions = new Map<number, [number, number]>();
    
    this.driversData.forEach((driver, index) => {
      // 각 드라이버를 트랙의 조금씩 다른 위치에 배치 (그리드 순서 시뮬레이션)
      const gridOffset = (index * 0.005) % 0.1; // 트랙의 10% 범위 내에서 분산
      const startPosition = trackPositionService.getPositionAtProgress(this.circuitId, gridOffset);
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

    this.updateDriverPositions(this.currentTime);
    this.onTimeUpdate?.(this.currentTime);

    this.animationFrameId = requestAnimationFrame(this.animate);
  };

  private updateDriverPositions(currentTime: number): void {
    const driverPositions = this.positionCalculator.calculateAllDriverPositions(currentTime);

    // 디버깅: 첫 번째 프레임에서만 로그 출력
    if (currentTime <= 0.1) {
      console.log(`🎯 Position Update - Available drivers: ${this.driversData.length}, Calculated positions: ${driverPositions.length}`);
      console.log(`📍 Calculated positions for drivers: [${driverPositions.map(p => p.driverNumber).join(', ')}]`);
      console.log(`🗂️ Available telemetry data for drivers: [${Object.keys(this.telemetryData).join(', ')}]`);
      
      // 위치 계산에 실패한 드라이버들 로그
      const failedDrivers = this.driversData
        .filter(driver => !driverPositions.some(pos => pos.driverNumber === driver.driverNumber))
        .map(driver => driver.driverNumber);
      if (failedDrivers.length > 0) {
        console.log(`❌ Position calculation failed for drivers: [${failedDrivers.join(', ')}]`);
      }
    }

    // 활성 드라이버 위치 업데이트 (현재 비활성화됨)
    // const activeDriverNumbers = new Set(driverPositions.map(pos => pos.driverNumber));
    
    // 첫 번째 프레임에서 실제 updateMarkerPosition 호출 현황 로그
    if (currentTime <= 0.1) {
      console.log(`🔄 Updating positions for ${driverPositions.length} drivers`);
    }
    
    driverPositions.forEach(position => {
      if (currentTime <= 0.1) {
        console.log(`📍 Updating position for driver ${position.driverNumber}: [${position.coordinates[0].toFixed(6)}, ${position.coordinates[1].toFixed(6)}]`);
      }
      this.markerManager.updateMarkerPosition(position.driverNumber, position.coordinates);
    });

    // 임시: DNF 로직을 비활성화하여 모든 마커가 보이도록 함
    // TODO: 나중에 적절한 DNF 처리 로직으로 교체
    /*
    this.driversData.forEach(driver => {
      if (!activeDriverNumbers.has(driver.driverNumber)) {
        this.markerManager.hideDriverMarker(driver.driverNumber);
      } else {
        this.markerManager.showDriverMarker(driver.driverNumber);
      }
    });
    */

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
    
    this.map.on('zoom', () => {
      const currentZoom = this.map?.getZoom() || 10;
      this.markerManager.updateMarkerSizes(currentZoom);
      this.trackManager.ensureTrackVisibility();
    });
    
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

  getTotalRaceDuration(): number {
    // 모든 드라이버의 텔레메트리 데이터 중 가장 긴 시간을 찾음
    let maxDuration = 0;
    
    Object.values(this.telemetryData).forEach(driverTelemetry => {
      if (driverTelemetry && driverTelemetry.length > 0) {
        const driverMaxTime = Math.max(...driverTelemetry.map(p => p.time));
        maxDuration = Math.max(maxDuration, driverMaxTime);
      }
    });

    // 기본값 5400초(90분)를 유지하되, 실제 데이터가 있으면 그것을 사용
    return maxDuration > 0 ? maxDuration : 5400;
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
    this.markerManager.clearMarkers();
    this.trackManager.clearCircuitTrack();
    this.positionCalculator.clear();
    
    this.driversData = [];
    this.lapsData = [];
    this.telemetryData = [];
    this.circuitId = '';
    
    this.isPlaying = false;
    this.currentTime = 0;
    this.startTime = 0;
    this.playbackSpeed = 1;
  }

  destroy(): void {
    this.cleanup();
    this.map = null;
  }
}