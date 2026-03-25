import mapboxgl from 'mapbox-gl';
import { ReplayDriverData } from '../types';

export class DriverMarkerManager {
  private map: mapboxgl.Map;
  private driverMarkers = new Map<number, mapboxgl.Marker>();

  constructor(map: mapboxgl.Map) {
    this.map = map;
  }

  createDriverMarkers(driversData: ReplayDriverData[]): void {
    
    // 기존 마커 제거
    this.clearMarkers();

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
    
    // 마커 스타일링 (Mapbox 최적화)
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
      user-select: none;
      pointer-events: auto;
      transition: border-width 0.2s ease;
      transform: translateZ(0);
    `;
    
    element.textContent = driver.driverNumber.toString();
    
    // 호버 효과 - border 변경으로 시각적 효과
    element.addEventListener('mouseenter', () => {
      element.style.borderWidth = '6px';
    });
    
    element.addEventListener('mouseleave', () => {
      element.style.borderWidth = '4px';
    });

    return element;
  }

  addMarkersToMap(startPositions: Map<number, [number, number]>): void {
    this.driverMarkers.forEach((marker, driverNumber) => {
      const startPosition = startPositions.get(driverNumber);

      if (startPosition && Array.isArray(startPosition) && startPosition.length === 2) {
        marker.setLngLat([startPosition[0], startPosition[1]]);
        marker.addTo(this.map);
      } else if (process.env.NODE_ENV === 'development') {
        console.warn(`[DriverMarkerManager] Invalid start position for driver ${driverNumber}:`, startPosition);
      }
    });
  }

  updateMarkerPosition(driverNumber: number, coordinates: [number, number]): void {
    const marker = this.driverMarkers.get(driverNumber);
    if (marker && Array.isArray(coordinates) && coordinates.length === 2) {
      marker.setLngLat([coordinates[0], coordinates[1]]);
    }
  }

  updateMarkerSizes(currentZoom: number): void {
    // 줌 레벨에 따른 마커 크기 계산
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

  clearMarkers(): void {
    this.driverMarkers.forEach(marker => marker.remove());
    this.driverMarkers.clear();
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