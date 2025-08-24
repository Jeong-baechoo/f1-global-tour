import mapboxgl from 'mapbox-gl';
import {trackPositionService} from '@/src/features/replay';
import {replayDataService} from './ReplayDataService';
import {DriverPosition, ReplayDriverData, ReplayLapData, ReplaySessionData} from '../types';
import { clearAllTrackState } from '@/src/shared/utils/map/trackDrawing';
import { getTrackCoordinates } from '@/src/shared/utils/data/trackDataLoader';
import { getCircuitColor } from '@/src/shared/utils/map/circuitColors';
import { getCircuitCameraConfig } from '@/src/shared/utils/map/camera';
import circuitsData from '@/data/circuits.json';

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
  private telemetryData: Array<{
    time: number;
    longitude?: number;
    latitude?: number;
    distance?: number;
  }> = [];
  private circuitId: string = '';
  private trackLayerId: string = '';
  
  // 콜백 함수들
  private onTimeUpdate?: (time: number) => void;
  private onDriverPositionsUpdate?: (positions: DriverPosition[]) => void;

  constructor(map: mapboxgl.Map) {
    this.map = map;
  }

  async loadReplayData(session: ReplaySessionData): Promise<boolean> {
    try {
      // 기존 데이터가 있다면 먼저 정리
      this.cleanupPreviousData();
      
      
      // FastF1 텔레메트리 데이터 먼저 시도
      try {
        const fastF1Response = await replayDataService.getFastF1TelemetryData(2024, 1, 1);
        if (fastF1Response.success && fastF1Response.data) {
          const convertedData = replayDataService.convertFastF1ToReplayData(fastF1Response.data);
          
          this.driversData = convertedData.drivers;
          this.lapsData = convertedData.laps;
          this.telemetryData = convertedData.telemetryPoints; // 텔레메트리 데이터 저장
          
          // 서킷 ID 매핑
          this.circuitId = this.mapCircuitName(session.circuitShortName);
          
          // 트랙 좌표 데이터 로드
          await trackPositionService.loadCircuitData(this.circuitId);
          
          // 드라이버 마커 생성
          this.createDriverMarkers();
          
          // 트랙 레이아웃을 즉시 생성 (약간의 딜레이 후)
          setTimeout(() => {
            this.drawCircuitTrackImmediately();
          }, 100);
          
          // 줌 레벨 변경 시 마커 크기 조절 리스너 추가
          this.setupZoomListener();
          
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
      
      // 트랙 레이아웃을 즉시 생성 (약간의 딜레이 후)
      setTimeout(() => {
        this.drawCircuitTrackImmediately();
      }, 100);
      
      // 줌 레벨 변경 시 마커 크기 조절 리스너 추가
      this.setupZoomListener();
      
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

  private drawCircuitTrackImmediately(): void {
    if (!this.map || !this.circuitId) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Map or circuit ID not available for track drawing');
      }
      return;
    }


    try {
      // 기존 트랙 제거 (있다면)
      this.clearCircuitTrack();

      // 트랙 ID 설정
      this.trackLayerId = `replay-${this.circuitId}-track`;

      // 트랙 데이터를 비동기로 로드하고 즉시 그리기
      getTrackCoordinates(this.circuitId).then(trackData => {
        if (!trackData || !this.map) {
          if (process.env.NODE_ENV === 'development') {
            console.warn(`No track data found for circuit: ${this.circuitId}`);
          }
          return;
        }


        // 줌 레벨에 관계없이 트랙을 항상 그리기 (리플레이 모드에서는 항상 표시)
        this.addTrackToMap(trackData);

      }).catch(error => {
        if (process.env.NODE_ENV === 'development') {
          console.error(`❌ Error loading track data for ${this.circuitId}:`, error);
        }
      });

    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error(`❌ Error drawing track for ${this.circuitId}:`, error);
      }
    }
  }

  private addTrackToMap(trackCoordinates: number[][]): void {
    if (!this.map || !this.trackLayerId) return;

    try {
      // GeoJSON 형태로 트랙 데이터 생성
      const trackGeoJSON = {
        type: 'Feature' as const,
        properties: {},
        geometry: {
          type: 'LineString' as const,
          coordinates: trackCoordinates
        }
      };

      // 기존 레이어와 소스 제거 (있다면)
      if (this.map.getLayer(this.trackLayerId)) {
        this.map.removeLayer(this.trackLayerId);
      }
      if (this.map.getSource(this.trackLayerId)) {
        this.map.removeSource(this.trackLayerId);
      }

      // 소스 추가
      this.map.addSource(this.trackLayerId, {
        type: 'geojson',
        data: trackGeoJSON
      });

      // 레이어 추가 (즉시 표시)
      this.map.addLayer({
        id: this.trackLayerId,
        type: 'line',
        source: this.trackLayerId,
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
          'visibility': 'visible'
        },
        paint: {
          'line-color': getCircuitColor(this.circuitId),
          'line-width': [
            'interpolate',
            ['linear'],
            ['zoom'],
            10, 2,
            14, 4,
            18, 6
          ],
          'line-opacity': 0.9
        }
      });


    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error(`❌ Error adding track to map:`, error);
      }
    }
  }

  private clearCircuitTrack(): void {
    if (!this.map) return;

    // 기존 트랙 레이어 제거
    if (this.trackLayerId && this.map.getLayer(this.trackLayerId)) {
      try {
        this.map.removeLayer(this.trackLayerId);
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.warn(`Failed to remove track layer ${this.trackLayerId}:`, error);
        }
      }
    }

    // 소스도 제거
    if (this.trackLayerId && this.map.getSource(this.trackLayerId)) {
      try {
        this.map.removeSource(this.trackLayerId);
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.warn(`Failed to remove track source ${this.trackLayerId}:`, error);
        }
      }
    }

    // 전체 트랙 상태 정리
    clearAllTrackState();
  }

  private createDriverMarkers(): void {
    console.log(`🏎️ Creating markers for ${this.driversData.length} drivers...`);
    
    // 기존 마커 제거
    this.clearMarkers();

    this.driversData.forEach((driver) => {
      // 드라이버 마커 엘리먼트 생성
      const markerElement = this.createDriverMarkerElement(driver);
      
      // Mapbox 마커 생성 - 항상 화면에 수직으로 표시
      const marker = new mapboxgl.Marker(markerElement, {
        anchor: 'center',
        pitchAlignment: 'viewport',      // 화면에 수직으로 고정
        rotationAlignment: 'viewport'    // 화면 방향 고정
      });

      // 모든 드라이버를 출발선(0%)에서 시작
      const startPosition = trackPositionService.getPositionAtProgress(this.circuitId, 0);
      
      if (startPosition && Array.isArray(startPosition) && startPosition.length === 2) {
        marker.setLngLat([startPosition[0], startPosition[1]]);
        if (this.map) {
          marker.addTo(this.map);
          
          // DOM에 실제로 추가되었는지 확인
          setTimeout(() => {
            const addedElement = document.getElementById(`driver-marker-${driver.driverNumber}`);
            if (addedElement) {
            } else if (process.env.NODE_ENV === 'development') {
              console.error(`❌ Marker element NOT found in DOM for driver ${driver.driverNumber}`);
            }
          }, 100);
        }
      } else if (process.env.NODE_ENV === 'development') {
        console.error(`❌ Failed to get position for circuit ${this.circuitId} at start line`);
      }

      this.driverMarkers.set(driver.driverNumber, marker);
    });
    
    
    // 서킷으로 카메라 이동
    if (this.map && this.circuitId) {
      this.flyToCircuit();
    }
  }

  private createDriverMarkerElement(driver: ReplayDriverData): HTMLElement {
    const element = document.createElement('div');
    element.className = 'driver-marker';
    element.id = `driver-marker-${driver.driverNumber}`;
    
    // 팀 컬러의 밝기에 따른 텍스트 색상 자동 결정
    const teamColor = driver.teamColor || 'FF0000';
    const textColor = this.getOptimalTextColor(teamColor);
    const textShadow = textColor === '#FFFFFF' 
      ? '0 0 4px rgba(0,0,0,1)' 
      : '0 0 4px rgba(255,255,255,0.8)';
    
    // 마커 스타일링 (더 눈에 띄게 크고 밝게)
    element.style.cssText = `
      width: 50px;
      height: 50px;
      background-color: #${teamColor};
      border: 4px solid #FFFFFF;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      font-weight: bold;
      color: ${textColor};
      text-shadow: ${textShadow};
      cursor: pointer;
      position: absolute;
      z-index: 1000;
      user-select: none;
      pointer-events: auto;
      transition: border-width 0.2s ease;
    `;
    
    element.textContent = driver.driverNumber.toString();
    
    
    // 호버 효과 - border 변경으로 시각적 효과
    element.addEventListener('mouseenter', () => {
      element.style.borderWidth = '6px';
    });
    
    element.addEventListener('mouseleave', () => {
      element.style.borderWidth = '4px';
    });

    // 클릭 이벤트 추가
    element.addEventListener('click', () => {
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
    
    // 일시정지 시 현재 위치에서 드라이버 마커들을 안정화
    this.stabilizeDriverMarkers();
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
        if (marker && Array.isArray(position.coordinates) && position.coordinates.length === 2) {
          marker.setLngLat([position.coordinates[0], position.coordinates[1]]);
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

  return driverProgresses.findIndex(d => d.driverNumber === driverNumber) + 1;
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
    this.clearCircuitTrack();
    this.map = null;
  }

  // 일시정지 시 마커 안정화
  private stabilizeDriverMarkers(): void {
    
    this.driverMarkers.forEach((marker, driverNumber) => {
      // 현재 위치를 다시 설정하여 마커를 안정화
      const currentPosition = this.calculateDriverPosition(driverNumber, this.currentTime);
      if (currentPosition && currentPosition.coordinates && Array.isArray(currentPosition.coordinates) && currentPosition.coordinates.length === 2) {
        const [lng, lat] = currentPosition.coordinates;
        // 유효한 좌표인 경우에만 위치 재설정
        if (!isNaN(lng) && !isNaN(lat)) {
          marker.setLngLat([lng, lat]);
        } else if (process.env.NODE_ENV === 'development') {
          console.warn(`⚠️ Invalid coordinates for driver ${driverNumber}: [${lng}, ${lat}]`);
        }
      } else if (process.env.NODE_ENV === 'development') {
        console.warn(`⚠️ Could not calculate position for driver ${driverNumber}`);
      }
    });
  }

  // 줌 레벨에 따른 마커 크기 조절 및 트랙 표시/숨기기 리스너 설정
  private setupZoomListener(): void {
    if (!this.map) return;
    
    this.map.on('zoom', () => {
      this.updateMarkerSizes();
      this.handleTrackVisibility();
    });
    
    // 초기 크기 설정
    this.updateMarkerSizes();
    this.handleTrackVisibility();
  }

  // 줌 레벨에 따른 트랙 표시/숨기기 처리 (리플레이 모드에서는 항상 표시)
  private handleTrackVisibility(): void {
    if (!this.map || !this.trackLayerId) return;

    const trackLayer = this.map.getLayer(this.trackLayerId);

    // 리플레이 모드에서는 트랙을 항상 표시
    if (trackLayer) {
      this.map.setLayoutProperty(this.trackLayerId, 'visibility', 'visible');
    } else if (this.circuitId) {
      // 트랙이 없으면 새로 생성
      this.drawCircuitTrackImmediately();
    }
  }

  // 현재 줌 레벨에 따라 모든 마커 크기 업데이트
  private updateMarkerSizes(): void {
    if (!this.map) return;
    
    const currentZoom = this.map.getZoom();
    
    // 줌 레벨에 따른 마커 크기 계산
    // 줌 10: 20px, 줌 14: 30px, 줌 18: 40px (선형 보간)
    const minZoom = 10;
    const maxZoom = 18;
    const minSize = 20;
    const maxSize = 40;
    
    const normalizedZoom = Math.max(0, Math.min(1, (currentZoom - minZoom) / (maxZoom - minZoom)));
    const markerSize = Math.round(minSize + (maxSize - minSize) * normalizedZoom);
    
    // 모든 드라이버 마커 크기 업데이트
    this.driverMarkers.forEach((marker, driverNumber) => {
      const markerElement = document.getElementById(`driver-marker-${driverNumber}`);
      if (markerElement) {
        markerElement.style.width = `${markerSize}px`;
        markerElement.style.height = `${markerSize}px`;
        
        // 폰트 크기도 비례적으로 조정
        const fontSize = Math.round(markerSize * 0.32); // 마커 크기의 32%
        markerElement.style.fontSize = `${fontSize}px`;
        
        // 테두리 두께도 조정
        const borderWidth = Math.max(2, Math.round(markerSize * 0.08)); // 마커 크기의 8%
        markerElement.style.borderWidth = `${borderWidth}px`;
      }
    });
    
  }

  // 팀 컬러의 밝기에 따른 최적 텍스트 색상 결정
  private getOptimalTextColor(hexColor: string): string {
    // hex 색상을 RGB로 변환
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    // 밝기 계산 (Luminance 공식 사용)
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    // 밝기가 0.5 이상이면 어두운 텍스트, 미만이면 밝은 텍스트
    return luminance > 0.5 ? '#000000' : '#FFFFFF';
  }

  // 서킷으로 카메라 이동
  private flyToCircuit(): void {
    if (!this.map || !this.circuitId) return;

    // 서킷 정보 찾기
    const circuit = circuitsData.circuits.find(c => c.id === this.circuitId);
    if (!circuit) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`Circuit not found: ${this.circuitId}`);
      }
      return;
    }

    // 카메라 설정 가져오기
    const cameraConfig = getCircuitCameraConfig(this.circuitId);
    
    
    this.map.flyTo({
      center: [circuit.location.lng, circuit.location.lat],
      zoom: cameraConfig.zoom,
      pitch: cameraConfig.pitch,
      bearing: cameraConfig.bearing,
      duration: 2000
    });
    
    // 카메라 이동 완료 후 마커 확인
    this.map.once('moveend', () => {
      
      // 모든 마커가 현재 뷰에 있는지 확인
      this.driverMarkers.forEach((marker) => {
        // 마커 위치 확인 (현재는 로깅하지 않음)
        marker.getLngLat();
      });
    });
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
    const startTime: number = this.telemetryData[0].time;
    const adjustedTime: number = startTime + currentTime;

    // 이진 검색으로 가장 가까운 포인트 찾기
    let left: number = 0;
    let right: number = this.telemetryData.length - 1;
    let closestPoint = this.telemetryData[0];

    while (left <= right) {
      const mid: number = Math.floor((left + right) / 2);
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

    // 실제 위도/경도 좌표 사용 (안전성 체크)
    const longitude: number = closestPoint.longitude ?? 0;
    const latitude: number = closestPoint.latitude ?? 0;
    const coordinates: [number, number] = [longitude, latitude];
    
    // 트랙 진행률 계산 (distance 기반)
    const totalDistance: number = Math.max(...this.telemetryData.map(p => p.distance || 0));
    const lapProgress: number = Math.min(1, (closestPoint.distance || 0) / totalDistance);

    // 좌표가 유효하지 않은 경우 경고 (개발 중에만)
    if (longitude === 0 && latitude === 0 && process.env.NODE_ENV === 'development') {
      console.warn(`⚠️ Driver ${driverNumber}: Invalid coordinates at ${currentTime.toFixed(1)}s`);
    }

    return {
      driverNumber,
      coordinates,
      currentLap: 1, // FastF1 데이터에서는 단일 랩
      lapProgress,
      lapTime: 90, // 평균 랩 타임
      position: 1 // 단일 드라이버이므로 1위
    };
  }

  /**
   * 이전 리플레이 데이터 정리 (새 세션 로드 시 사용)
   */
  private cleanupPreviousData(): void {
    // 1. 애니메이션 정지
    if (this.isPlaying) {
      this.stop();
    }
    
    // 2. 기존 드라이버 마커들 제거
    this.driverMarkers.forEach((marker) => {
      marker.remove();
    });
    this.driverMarkers.clear();
    
    // 3. 기존 트랙 레이어 제거 (있다면)
    if (this.map && this.trackLayerId) {
      try {
        if (this.map.getLayer(this.trackLayerId)) {
          this.map.removeLayer(this.trackLayerId);
        }
        if (this.map.getSource(this.trackLayerId)) {
          this.map.removeSource(this.trackLayerId);
        }
      } catch {
        // 레이어나 소스가 없을 수 있으므로 무시
      }
    }
    
    // 4. 데이터 초기화
    this.driversData = [];
    this.lapsData = [];
    this.telemetryData = [];
    this.currentTime = 0;
    this.startTime = 0;
    this.isPlaying = false;
  }

  /**
   * 리플레이 엔진 완전 정리 (Exit 시 사용)
   */
  cleanup(): void {
    // 1. 애니메이션 정지
    this.stop();
    
    // 2. 모든 드라이버 마커 제거
    this.driverMarkers.forEach((marker) => {
      marker.remove();
    });
    this.driverMarkers.clear();
    
    // 3. 트랙 레이어 제거 (만약 있다면)
    if (this.map && this.trackLayerId) {
      try {
        const map = this.map;
        if (map.getLayer(this.trackLayerId)) {
          map.removeLayer(this.trackLayerId);
        }
        if (map.getSource(this.trackLayerId)) {
          map.removeSource(this.trackLayerId);
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('트랙 레이어 제거 중 오류:', error);
        }
      }
    }
    
    // 4. 데이터 초기화
    this.driversData = [];
    this.lapsData = [];
    this.telemetryData = [];
    this.circuitId = '';
    this.trackLayerId = '';
    
    // 5. 상태 초기화
    this.isPlaying = false;
    this.currentTime = 0;
    this.startTime = 0;
    this.playbackSpeed = 1;
    
    // 6. 콜백 함수는 유지 (재사용을 위해 초기화하지 않음)
    // this.onTimeUpdate = undefined;
    // this.onDriverPositionsUpdate = undefined;
  }
}