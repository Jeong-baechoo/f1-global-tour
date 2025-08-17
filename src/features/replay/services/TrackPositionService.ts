import { CircuitCoordinates, TrackProgress } from '../types';

export class TrackPositionService {
  private circuitCoordinates: Map<string, CircuitCoordinates> = new Map();

  async loadCircuitData(circuitId: string): Promise<CircuitCoordinates> {
    if (this.circuitCoordinates.has(circuitId)) {
      return this.circuitCoordinates.get(circuitId)!;
    }

    try {
      const response = await fetch(`/data/circuits-geojson/${circuitId}.geojson`);
      const geoJsonData = await response.json();
      
      // GeoJSON에서 첫 번째 Feature의 LineString 좌표 추출
      const coordinates = geoJsonData.features[0].geometry.coordinates as [number, number][];
      
      // 총 트랙 거리 계산
      const totalDistance = this.calculateTotalDistance(coordinates);
      
      const circuitCoords: CircuitCoordinates = {
        circuitId,
        trackCoordinates: coordinates,
        totalDistance
      };

      this.circuitCoordinates.set(circuitId, circuitCoords);
      return circuitCoords;
    } catch (error) {
      console.error(`Failed to load circuit data for ${circuitId}:`, error);
      throw new Error(`Could not load circuit data for ${circuitId}`);
    }
  }

  getPositionAtProgress(
    circuitId: string,
    lapProgress: number
  ): [number, number] | null {
    const circuitData = this.circuitCoordinates.get(circuitId);
    if (!circuitData) {
      console.warn(`Circuit data not loaded for ${circuitId}`);
      return null;
    }

    // 진행률을 0-1 범위로 제한
    const clampedProgress = Math.max(0, Math.min(1, lapProgress));
    
    // 타겟 거리 계산
    const targetDistance = clampedProgress * circuitData.totalDistance;
    
    return this.interpolateCoordinateAtDistance(
      circuitData.trackCoordinates,
      targetDistance
    );
  }

  private calculateTotalDistance(coordinates: [number, number][]): number {
    let totalDistance = 0;
    
    for (let i = 0; i < coordinates.length - 1; i++) {
      const distance = this.calculateDistance(
        coordinates[i],
        coordinates[i + 1]
      );
      totalDistance += distance;
    }
    
    return totalDistance;
  }

  private interpolateCoordinateAtDistance(
    coordinates: [number, number][],
    targetDistance: number
  ): [number, number] {
    let accumulatedDistance = 0;
    
    for (let i = 0; i < coordinates.length - 1; i++) {
      const segmentLength = this.calculateDistance(
        coordinates[i],
        coordinates[i + 1]
      );
      
      if (accumulatedDistance + segmentLength >= targetDistance) {
        // 이 구간에서 보간
        const segmentProgress = (targetDistance - accumulatedDistance) / segmentLength;
        return this.interpolateBetweenPoints(
          coordinates[i],
          coordinates[i + 1],
          segmentProgress
        );
      }
      
      accumulatedDistance += segmentLength;
    }
    
    // 마지막 점 반환 (100% 진행)
    return coordinates[coordinates.length - 1];
  }

  private interpolateBetweenPoints(
    point1: [number, number],
    point2: [number, number],
    progress: number
  ): [number, number] {
    const lng = point1[0] + (point2[0] - point1[0]) * progress;
    const lat = point1[1] + (point2[1] - point1[1]) * progress;
    return [lng, lat];
  }

  private calculateDistance(
    point1: [number, number],
    point2: [number, number]
  ): number {
    // Haversine 공식을 사용한 지구상 두 점 간의 거리 계산 (미터)
    const R = 6371000; // 지구 반지름 (미터)
    const φ1 = point1[1] * Math.PI / 180;
    const φ2 = point2[1] * Math.PI / 180;
    const Δφ = (point2[1] - point1[1]) * Math.PI / 180;
    const Δλ = (point2[0] - point1[0]) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  getTrackProgress(
    circuitId: string,
    lapNumber: number,
    lapElapsedTime: number,
    totalLapTime: number
  ): TrackProgress | null {
    if (totalLapTime <= 0) {
      return null;
    }

    // 현재 랩에서의 진행률 (0-1)
    const lapProgress = Math.min(lapElapsedTime / totalLapTime, 1);
    
    // 현재 위치 좌표 계산
    const coordinates = this.getPositionAtProgress(circuitId, lapProgress);
    
    if (!coordinates) {
      return null;
    }

    return {
      lapNumber,
      progress: lapProgress,
      totalProgress: lapProgress, // 단일 랩 기준
      coordinates
    };
  }

  calculateLapElapsedTime(
    raceStartTime: number,
    currentTime: number,
    lapStartTime: number
  ): number {
    // 현재 시간에서 랩 시작 시간을 뺀 경과 시간
    return Math.max(0, currentTime - lapStartTime);
  }

  async preloadCircuitData(circuitIds: string[]): Promise<void> {
    const loadPromises = circuitIds.map(id => 
      this.loadCircuitData(id).catch(error => {
        console.warn(`Failed to preload circuit ${id}:`, error);
        return null;
      })
    );
    
    await Promise.all(loadPromises);
  }

  clearCache(): void {
    this.circuitCoordinates.clear();
  }

  getCachedCircuits(): string[] {
    return Array.from(this.circuitCoordinates.keys());
  }
}

// 싱글톤 인스턴스
export const trackPositionService = new TrackPositionService();