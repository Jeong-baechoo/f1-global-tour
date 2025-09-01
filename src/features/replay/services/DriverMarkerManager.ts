import mapboxgl from 'mapbox-gl';
import { ReplayDriverData } from '../types';

export class DriverMarkerManager {
  private map: mapboxgl.Map;
  private driverMarkers = new Map<number, mapboxgl.Marker>();
  
  // 🛤️ 드라이버 1번(막스 베르스타펜) 경로 시각화
  private driver1Path: [number, number][] = [];
  private showDriver1Path = true; // 개발/디버그 모드

  constructor(map: mapboxgl.Map) {
    this.map = map;
  }

  createDriverMarkers(driversData: ReplayDriverData[]): void {
    console.log(`🏎️ Creating markers for ${driversData.length} drivers: [${driversData.map(d => d.driverNumber).join(', ')}]`);
    
    // 기존 마커 및 경로 제거
    this.clearMarkers();
    this.clearDriver1Path();

    driversData.forEach((driver) => {
      // 드라이버 마커 엘리먼트 생성
      const markerElement = this.createDriverMarkerElement(driver);
      
      // Mapbox 마커 생성 - 항상 화면에 수직으로 표시
      const marker = new mapboxgl.Marker(markerElement, {
        anchor: 'center',
        pitchAlignment: 'viewport',      // 화면에 수직으로 고정
        rotationAlignment: 'viewport'    // 화면 방향 고정
      });

      this.driverMarkers.set(driver.driverNumber, marker);
    });
    
    // 🛤️ 드라이버 1번 경로 초기화
    this.driver1Path = [];
    
    console.log(`✅ Created ${this.driverMarkers.size} markers in memory`);
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
    
    // 기본 마커 스타일링 (Mapbox 위치 동기화 최적화)
    element.style.cssText = `
      width: 30px;
      height: 30px;
      background-color: #${teamColor};
      border: 3px solid #FFFFFF;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      font-weight: bold;
      color: ${textColor};
      text-shadow: ${textShadow};
      cursor: pointer;
      z-index: 1000;
      user-select: none;
      pointer-events: auto;
      transition: border-width 0.2s ease;
    `;
    
    element.textContent = driver.driverNumber.toString();
    
    // 호버 효과 - border 변경으로 시각적 효과
    element.addEventListener('mouseenter', () => {
      const currentBorderWidth = parseInt(element.style.borderWidth) || 3;
      element.style.borderWidth = `${Math.min(currentBorderWidth + 2, 8)}px`;
    });
    
    element.addEventListener('mouseleave', () => {
      // updateMarkerSizes에서 설정한 원래 border로 되돌림
      const currentWidth = parseInt(element.style.width) || 30;
      const normalBorderWidth = Math.max(2, Math.round(currentWidth * 0.08));
      element.style.borderWidth = `${normalBorderWidth}px`;
    });

    return element;
  }

  addMarkersToMap(startPositions: Map<number, [number, number]>): void {
    console.log(`🗺️ Adding ${startPositions.size} markers to map. Available markers: ${this.driverMarkers.size}`);
    
    let addedToMapCount = 0;
    const markersWithoutPosition: number[] = [];
    
    this.driverMarkers.forEach((marker, driverNumber) => {
      const startPosition = startPositions.get(driverNumber);
      
      if (startPosition && Array.isArray(startPosition) && startPosition.length === 2) {
        marker.setLngLat([startPosition[0], startPosition[1]]);
        marker.addTo(this.map);
        addedToMapCount++;
        
        // DOM에 실제로 추가되었는지 확인
        setTimeout(() => {
          const addedElement = document.getElementById(`driver-marker-${driverNumber}`);
          if (!addedElement && process.env.NODE_ENV === 'development') {
            console.error(`❌ Marker element NOT found in DOM for driver ${driverNumber}`);
          } else {
            console.log(`✅ Marker ${driverNumber} successfully added to DOM`);
          }
        }, 50);
      } else {
        markersWithoutPosition.push(driverNumber);
      }
    });
    
    console.log(`📍 Successfully added ${addedToMapCount} markers to map`);
    if (markersWithoutPosition.length > 0) {
      console.log(`⚠️ Markers without start position: [${markersWithoutPosition.join(', ')}]`);
    }
  }

  addSingleDriverMarker(driver: ReplayDriverData): void {
    // 이미 존재하는 마커는 건너뛰기
    if (this.driverMarkers.has(driver.driverNumber)) {
      return;
    }

    // 드라이버 마커 엘리먼트 생성
    const markerElement = this.createDriverMarkerElement(driver);
    
    // Mapbox 마커 생성 - 항상 화면에 수직으로 표시
    const marker = new mapboxgl.Marker(markerElement, {
      anchor: 'center',
      pitchAlignment: 'viewport',      // 화면에 수직으로 고정
      rotationAlignment: 'viewport'    // 화면 방향 고정
    });

    this.driverMarkers.set(driver.driverNumber, marker);
  }

  updateMarkerSizes(currentZoom: number): void {
    // 줌 레벨에 따른 마커 크기 계산
    const minZoom = 10;
    const maxZoom = 18;
    const minSize = 20;
    const maxSize = 40;
    
    const normalizedZoom = Math.max(0, Math.min(1, (currentZoom - minZoom) / (maxZoom - minZoom)));
    const markerSize = Math.round(minSize + (maxSize - minSize) * normalizedZoom);
    
    console.log(`🔍 updateMarkerSizes called: zoom=${currentZoom.toFixed(2)}, normalized=${normalizedZoom.toFixed(3)}, size=${markerSize}px`);
    
    let updatedCount = 0;
    // 모든 드라이버 마커 크기 업데이트
    this.driverMarkers.forEach((marker, driverNumber) => {
      const markerElement = document.getElementById(`driver-marker-${driverNumber}`);
      if (markerElement) {
        const oldSize = markerElement.style.width;
        
        // 위치 동기화를 위해 transition을 명시적으로 설정
        markerElement.style.transition = 'width 0.2s ease, height 0.2s ease, font-size 0.2s ease, border-width 0.2s ease';
        
        markerElement.style.width = `${markerSize}px`;
        markerElement.style.height = `${markerSize}px`;
        
        // 폰트 크기도 비례적으로 조정
        const fontSize = Math.round(markerSize * 0.32); // 마커 크기의 32%
        markerElement.style.fontSize = `${fontSize}px`;
        
        // 테두리 두께도 조정
        const borderWidth = Math.max(2, Math.round(markerSize * 0.08)); // 마커 크기의 8%
        markerElement.style.borderWidth = `${borderWidth}px`;
        
        updatedCount++;
        if (updatedCount <= 3) { // 첫 3개만 로그
          console.log(`📏 Marker ${driverNumber}: ${oldSize} → ${markerSize}px`);
        }
      }
    });
    
    console.log(`✅ Updated ${updatedCount} marker sizes`);
  }

  showDriverMarker(driverNumber: number): void {
    const marker = this.driverMarkers.get(driverNumber);
    if (marker) {
      marker.addTo(this.map);
    }
  }

  hideDriverMarker(driverNumber: number): void {
    const marker = this.driverMarkers.get(driverNumber);
    if (marker) {
      marker.remove();
    }
  }

  updateMarkerPosition(driverNumber: number, coordinates: [number, number]): void {
    const marker = this.driverMarkers.get(driverNumber);
    
    if (marker && coordinates && Array.isArray(coordinates) && coordinates.length === 2) {
      // 좌표 유효성 검증 (벨기에 스파 서킷 근처 범위)
      const [lng, lat] = coordinates;
      const isValidCoordinate = lng >= 5.5 && lng <= 6.5 && lat >= 50.2 && lat <= 50.5;
      
      if (!isValidCoordinate && performance.now() < 10000) {
        console.error(`❌ Invalid coordinates for driver ${driverNumber}: [${lng.toFixed(6)}, ${lat.toFixed(6)}] - outside Belgium circuit area`);
        return;
      }
      
      const wasConnected = marker.getElement().isConnected;
      const oldPosition = marker.getLngLat();
      
      marker.setLngLat(coordinates);
      
      // 🛤️ 드라이버 1번 경로 업데이트 (디버그 시각화)
      if (driverNumber === 1) {
        this.updateDriver1Path(coordinates);
      }
      
      // 리플레이 시작 직후 마커 상태 추적 (첫 10초)
      if (performance.now() < 10000) {
        console.log(`📍 Driver ${driverNumber}: [${oldPosition.lng.toFixed(6)}, ${oldPosition.lat.toFixed(6)}] → [${lng.toFixed(6)}, ${lat.toFixed(6)}]`);
        
        // 마커가 지도에 연결되어 있지 않으면 다시 추가
        if (!wasConnected) {
          console.log(`🔄 Re-adding disconnected marker for driver ${driverNumber}`);
          marker.addTo(this.map);
        }
        
        // DOM 요소 확인
        setTimeout(() => {
          const element = document.getElementById(`driver-marker-${driverNumber}`);
          if (!element) {
            console.error(`❌ DOM element missing for driver ${driverNumber} after position update`);
          } else if (!element.isConnected) {
            console.error(`❌ DOM element not connected for driver ${driverNumber}`);
          }
        }, 50);
      }
    } else {
      if (!marker) {
        console.error(`❌ No marker found for driver ${driverNumber}`);
      } else if (!coordinates || !Array.isArray(coordinates) || coordinates.length !== 2) {
        console.error(`❌ Invalid coordinates for driver ${driverNumber}:`, coordinates);
      }
    }
  }

  clearMarkers(): void {
    this.driverMarkers.forEach(marker => marker.remove());
    this.driverMarkers.clear();
    this.clearDriver1Path(); // 경로도 함께 정리
  }

  // 🛤️ 드라이버 1번 경로 시각화 메서드들
  clearDriver1Path(): void {
    // 드라이버 1번 경로 데이터 정리
    this.driver1Path = [];
    
    // 맵에서 드라이버 1번 경로 레이어 제거
    const sourceId = `driver-path-1`;
    const layerId = `driver-path-layer-1`;
    
    if (this.map.getLayer(layerId)) {
      this.map.removeLayer(layerId);
    }
    if (this.map.getSource(sourceId)) {
      this.map.removeSource(sourceId);
    }
  }

  updateDriver1Path(coordinates: [number, number]): void {
    if (!this.showDriver1Path) return;
    
    this.driver1Path.push(coordinates);
    
    // 맵에 경로 렌더링 (3개 이상 포인트가 있을 때만)
    if (this.driver1Path.length >= 3) {
      this.renderDriver1Path();
    }
  }

  private renderDriver1Path(): void {
    const sourceId = `driver-path-1`;
    const layerId = `driver-path-layer-1`;
    
    const geojson = {
      type: 'Feature' as const,
      properties: {
        driver: 'Max Verstappen',
        driverNumber: 1
      },
      geometry: {
        type: 'LineString' as const,
        coordinates: this.driver1Path
      }
    };
    
    try {
      // 소스 업데이트 또는 생성
      if (this.map.getSource(sourceId)) {
        (this.map.getSource(sourceId) as mapboxgl.GeoJSONSource).setData(geojson);
      } else {
        this.map.addSource(sourceId, {
          type: 'geojson',
          data: geojson
        });
        
        // 레이어 추가 (파란색 선으로 표시)
        this.map.addLayer({
          id: layerId,
          type: 'line',
          source: sourceId,
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': '#0080FF', // 파란색
            'line-width': 3, // 더 굵게
            'line-opacity': 0.9
          }
        });
        
        console.log(`🛤️ Created path visualization for driver 1 (Max Verstappen)`);
      }
    } catch (error) {
      console.error(`❌ Failed to render path for driver 1:`, error);
    }
  }

  // 디버그 모드 토글
  toggleDriver1Path(show: boolean): void {
    this.showDriver1Path = show;
    if (!show) {
      this.clearDriver1Path();
    }
  }

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
}