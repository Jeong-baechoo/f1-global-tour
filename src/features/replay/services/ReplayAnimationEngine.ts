import mapboxgl from 'mapbox-gl';
import { trackPositionService } from './TrackPositionService';
import { replayDataService } from './ReplayDataService';
import { 
  ReplayLapData, 
  ReplayDriverData, 
  DriverPosition, 
  ReplaySessionData 
} from '../types';

export class ReplayAnimationEngine {
  private map: mapboxgl.Map | null = null;
  private driverMarkers = new Map<number, mapboxgl.Marker>();
  private animationFrameId: number | null = null;
  
  private isPlaying = false;
  private startTime: number = 0;
  private currentTime: number = 0;
  private playbackSpeed: number = 1;
  
  private driversData: ReplayDriverData[] = [];
  private lapsData: ReplayLapData[] = [];
  private telemetryData: any[] = [];
  private circuitId: string = '';
  
  // 콜백 함수들
  private onTimeUpdate?: (time: number) => void;
  private onDriverPositionsUpdate?: (positions: DriverPosition[]) => void;

  constructor(map: mapboxgl.Map) {
    this.map = map;
  }

  async loadReplayData(session: ReplaySessionData): Promise<boolean> {
    try {
      console.log('🏁 Loading replay data for session:', session.sessionName);
      
      // FastF1 텔레메트리 데이터 먼저 시도
      try {
        const fastF1Response = await replayDataService.getFastF1TelemetryData(2024, 1, 1);
        if (fastF1Response.success) {
          console.log('✅ Using FastF1 telemetry data');
          const convertedData = replayDataService.convertFastF1ToReplayData(fastF1Response.data);
          
          this.driversData = convertedData.drivers;
          this.lapsData = convertedData.laps;
          this.telemetryData = convertedData.telemetryPoints; // 텔레메트리 데이터 저장
          
          console.log(`📊 Loaded ${this.driversData.length} drivers, ${this.lapsData.length} laps, ${this.telemetryData.length} telemetry points`);
          
          // 서킷 ID 매핑
          this.circuitId = this.mapCircuitName(session.circuitShortName);
          
          // 트랙 좌표 데이터 로드
          await trackPositionService.loadCircuitData(this.circuitId);
          
          // 드라이버 마커 생성
          this.createDriverMarkers();
          
          return true;
        }
      } catch (fastF1Error) {
        console.warn('FastF1 data loading failed, falling back to standard method:', fastF1Error);
      }

      // 기존 방식으로 fallback
      const response = await replayDataService.getFullRaceData(session.sessionKey);
      
      if (!response.success) {
        console.error('Failed to load race data:', response.error);
        return false;
      }

      this.driversData = response.data.drivers;
      this.lapsData = response.data.laps;
      this.telemetryData = []; // 빈 배열로 초기화
      
      // 서킷 ID 매핑 (서킷 이름을 파일명으로 변환)
      this.circuitId = this.mapCircuitName(session.circuitShortName);
      
      // 트랙 좌표 데이터 로드
      await trackPositionService.loadCircuitData(this.circuitId);
      
      // 드라이버 마커 생성
      this.createDriverMarkers();
      
      return true;
    } catch (error) {
      console.error('Error loading replay data:', error);
      return false;
    }
  }

  private mapCircuitName(circuitShortName: string): string {
    // 서킷 이름을 GeoJSON 파일명으로 매핑 (OpenF1 API 실제 이름 기준)
    const mapping: Record<string, string> = {
      'Monte Carlo': 'monaco', // OpenF1 API에서 Monaco는 "Monte Carlo"로 표시
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
    console.log(`🏎️ Creating markers for ${this.driversData.length} drivers...`);
    
    // 기존 마커 제거
    this.clearMarkers();

    this.driversData.forEach((driver, index) => {
      // 드라이버 마커 엘리먼트 생성
      const markerElement = this.createDriverMarkerElement(driver);
      
      // Mapbox 마커 생성
      const marker = new mapboxgl.Marker(markerElement, {
        anchor: 'center'
      });

      // 모든 드라이버를 출발선(0%)에서 시작
      const startPosition = trackPositionService.getPositionAtProgress(this.circuitId, 0);
      
      if (startPosition) {
        marker.setLngLat(startPosition);
        if (this.map) {
          marker.addTo(this.map);
          console.log(`✅ Marker created for driver ${driver.driverNumber} (${driver.nameAcronym}) at START LINE [${startPosition[0].toFixed(6)}, ${startPosition[1].toFixed(6)}]`);
          
          // DOM에 실제로 추가되었는지 확인
          setTimeout(() => {
            const addedElement = document.getElementById(`driver-marker-${driver.driverNumber}`);
            if (addedElement) {
              console.log(`✅ Marker element found in DOM for driver ${driver.driverNumber}`);
            } else {
              console.error(`❌ Marker element NOT found in DOM for driver ${driver.driverNumber}`);
            }
          }, 100);
        }
      } else {
        console.error(`❌ Failed to get position for circuit ${this.circuitId} at progress ${driverProgress}`);
      }

      this.driverMarkers.set(driver.driverNumber, marker);
    });
    
    console.log(`🏎️ Total markers created: ${this.driverMarkers.size}`);
    
    // Monaco 트랙으로 카메라 이동
    if (this.map && this.circuitId === 'monaco') {
      const monacoCenter = [7.4255, 43.7384]; // Monaco 중심 좌표
      console.log('🎯 Moving camera to Monaco circuit...');
      this.map.flyTo({
        center: monacoCenter,
        zoom: 16, // 줌 레벨을 높여서 마커들이 더 잘 보이도록
        duration: 2000
      });
      
      // 카메라 이동 완료 후 마커 확인
      this.map.once('moveend', () => {
        console.log('🎯 Camera move completed. Current view:', {
          center: this.map?.getCenter(),
          zoom: this.map?.getZoom(),
          bounds: this.map?.getBounds()
        });
        
        // 모든 마커가 현재 뷰에 있는지 확인
        this.driverMarkers.forEach((marker, driverNumber) => {
          const lngLat = marker.getLngLat();
          console.log(`📍 Driver ${driverNumber} marker position:`, lngLat);
        });
      });
    }
  }

  private createDriverMarkerElement(driver: ReplayDriverData): HTMLElement {
    const element = document.createElement('div');
    element.className = 'driver-marker';
    element.id = `driver-marker-${driver.driverNumber}`;
    
    // 마커 스타일링 (더 눈에 띄게 크고 밝게)
    element.style.cssText = `
      width: 50px;
      height: 50px;
      background-color: #${driver.teamColor || 'FF0000'};
      border: 4px solid #FFFFFF;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      font-weight: bold;
      color: #FFFFFF;
      text-shadow: 0 0 4px rgba(0,0,0,1);
      cursor: pointer;
      position: relative;
      z-index: 10000 !important;
      box-shadow: 0 4px 12px rgba(0,0,0,0.5);
      user-select: none;
      pointer-events: auto;
    `;
    
    element.textContent = driver.driverNumber.toString();
    
    // 디버깅을 위한 콘솔 로그
    console.log(`🎨 Created marker element for driver ${driver.driverNumber} with color #${driver.teamColor}`);
    
    // 호버 효과
    element.addEventListener('mouseenter', () => {
      element.style.transform = 'scale(1.2)';
      console.log(`🎯 Hover on driver ${driver.driverNumber} marker`);
    });
    
    element.addEventListener('mouseleave', () => {
      element.style.transform = 'scale(1)';
    });

    // 클릭 이벤트 추가
    element.addEventListener('click', () => {
      console.log(`🖱️ Clicked driver ${driver.driverNumber} marker`);
    });

    return element;
  }

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
    const driverPositions: DriverPosition[] = [];

    this.driversData.forEach(driver => {
      // 현재 시간에서 해당 드라이버의 위치 계산
      const position = this.calculateDriverPosition(driver.driverNumber, currentTime);
      
      if (position) {
        driverPositions.push(position);
        
        // 마커 위치 업데이트
        const marker = this.driverMarkers.get(driver.driverNumber);
        if (marker) {
          marker.setLngLat(position.coordinates);
        }
      }
    });

    this.onDriverPositionsUpdate?.(driverPositions);
  }

  private calculateDriverPosition(driverNumber: number, currentTime: number): DriverPosition | null {
    // FastF1 텔레메트리 데이터가 있으면 그것을 사용
    if (this.telemetryData.length > 0) {
      return this.calculatePositionFromTelemetry(driverNumber, currentTime);
    }

    // 기존 랩 데이터 기반 계산
    const driverLaps = this.lapsData.filter(lap => lap.driverNumber === driverNumber);
    
    if (driverLaps.length === 0) {
      console.log(`🚫 No lap data for driver ${driverNumber} at time ${currentTime.toFixed(1)}s`);
      return null;
    }

    // 현재 시간에 해당하는 랩 찾기
    let currentLap: ReplayLapData | null = null;
    let lapProgress = 0;

    for (const lap of driverLaps) {
      const lapEndTime = lap.lapStartTime + lap.lapDuration;
      
      if (currentTime >= lap.lapStartTime && currentTime <= lapEndTime) {
        currentLap = lap;
        lapProgress = (currentTime - lap.lapStartTime) / lap.lapDuration;
        console.log(`🏁 Driver ${driverNumber}: Lap ${lap.lapNumber}, Progress ${(lapProgress * 100).toFixed(1)}%, Time ${currentTime.toFixed(1)}s`);
        break;
      }
    }

    // 현재 랩이 없으면 마지막 완주 랩 사용
    if (!currentLap && driverLaps.length > 0) {
      currentLap = driverLaps[driverLaps.length - 1];
      lapProgress = 1; // 100% 완주
      console.log(`🏁 Driver ${driverNumber}: Using last lap ${currentLap.lapNumber}, Progress 100%`);
    }

    if (!currentLap) {
      console.log(`❌ No valid lap data for driver ${driverNumber} at time ${currentTime.toFixed(1)}s`);
      return null;
    }

    // 트랙 상의 위치 계산
    const coordinates = trackPositionService.getPositionAtProgress(
      this.circuitId, 
      lapProgress
    );

    if (!coordinates) return null;

    return {
      driverNumber,
      coordinates,
      currentLap: currentLap.lapNumber,
      lapProgress,
      lapTime: currentLap.lapDuration,
      position: this.calculateRacePosition(driverNumber, currentTime)
    };
  }

  private calculateRacePosition(driverNumber: number, currentTime: number): number {
    // 모든 드라이버의 현재 진행률 계산하여 순위 결정
    const driverProgresses = this.driversData.map(driver => {
      const driverLaps = this.lapsData.filter(lap => lap.driverNumber === driver.driverNumber);
      let totalProgress = 0;

      for (const lap of driverLaps) {
        const lapEndTime = lap.lapStartTime + lap.lapDuration;
        
        if (currentTime >= lapEndTime) {
          totalProgress += 1; // 완주한 랩
        } else if (currentTime >= lap.lapStartTime) {
          totalProgress += (currentTime - lap.lapStartTime) / lap.lapDuration;
          break;
        }
      }

      return {
        driverNumber: driver.driverNumber,
        progress: totalProgress
      };
    });

    // 진행률로 정렬하여 순위 계산
    driverProgresses.sort((a, b) => b.progress - a.progress);
    
    const position = driverProgresses.findIndex(d => d.driverNumber === driverNumber) + 1;
    return position;
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
    const marker = this.driverMarkers.get(driverNumber);
    if (marker && this.map) {
      marker.addTo(this.map);
    }
  }

  hideDriverMarker(driverNumber: number): void {
    const marker = this.driverMarkers.get(driverNumber);
    if (marker) {
      marker.remove();
    }
  }

  // 정리
  clearMarkers(): void {
    this.driverMarkers.forEach(marker => marker.remove());
    this.driverMarkers.clear();
  }

  destroy(): void {
    this.pause();
    this.clearMarkers();
    this.map = null;
  }

  // 현재 상태 조회
  getCurrentTime(): number {
    return this.currentTime;
  }

  isCurrentlyPlaying(): boolean {
    return this.isPlaying;
  }

  getPlaybackSpeed(): number {
    return this.playbackSpeed;
  }

  // FastF1 텔레메트리 데이터에서 실제 위치 계산
  private calculatePositionFromTelemetry(driverNumber: number, currentTime: number): DriverPosition | null {
    if (!this.telemetryData.length) return null;

    // 현재 시간에 가장 가까운 텔레메트리 포인트 찾기
    const startTime = this.telemetryData[0].time;
    const adjustedTime = startTime + currentTime;

    // 이진 검색으로 가장 가까운 포인트 찾기
    let left = 0;
    let right = this.telemetryData.length - 1;
    let closestPoint = this.telemetryData[0];

    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      const point = this.telemetryData[mid];
      
      if (Math.abs(point.time - adjustedTime) < Math.abs(closestPoint.time - adjustedTime)) {
        closestPoint = point;
      }
      
      if (point.time < adjustedTime) {
        left = mid + 1;
      } else {
        right = mid - 1;
      }
    }

    // 실제 위도/경도 좌표 사용
    const coordinates: [number, number] = [closestPoint.longitude, closestPoint.latitude];
    
    // 트랙 진행률 계산 (distance 기반)
    const totalDistance = Math.max(...this.telemetryData.map(p => p.distance));
    const lapProgress = Math.min(1, closestPoint.distance / totalDistance);

    console.log(`🎯 Driver ${driverNumber}: FastF1 position [${coordinates[0].toFixed(6)}, ${coordinates[1].toFixed(6)}] at ${currentTime.toFixed(1)}s, progress ${(lapProgress * 100).toFixed(1)}%`);

    return {
      driverNumber,
      coordinates,
      currentLap: 1, // FastF1 데이터에서는 단일 랩
      lapProgress,
      lapTime: 90, // 평균 랩 타임
      position: 1 // 단일 드라이버이므로 1위
    };
  }
}