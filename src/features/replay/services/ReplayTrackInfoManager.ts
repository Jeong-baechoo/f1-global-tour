import mapboxgl from 'mapbox-gl';
import { SectorTrackManager } from '@/src/features/circuits/services/track/sector/SectorTrackManager';
import { DRSZoneManager } from '@/src/features/circuits/services/track/drs/DRSZoneManager';
import { DRSAnimationController } from '@/src/features/circuits/services/track/animation/DRSAnimationController';
import { trackStateManager } from '@/src/features/circuits/services/track/state/TrackStateManager';

// 상수 정의
const CONSTANTS = {
  SOURCE_PREFIX: 'circuit-track',
  SECTOR_SUFFIX: '-sector',
  DRS_ANIMATION_DELAY: 100
} as const;

type TrackSourceInfo = {
  trackId: string;
  circuitId: string;
};

export class ReplayTrackInfoManager {
  private static instance: ReplayTrackInfoManager;
  private map: mapboxgl.Map | null = null;
  private currentCircuitId: string | null = null;
  private sectorEnabled: boolean = false;
  private drsEnabled: boolean = false;

  static getInstance(): ReplayTrackInfoManager {
    if (!ReplayTrackInfoManager.instance) {
      ReplayTrackInfoManager.instance = new ReplayTrackInfoManager();
    }
    return ReplayTrackInfoManager.instance;
  }

  /**
   * 맵과 서킷 ID 설정
   */
  setMapAndCircuit(map: mapboxgl.Map, circuitId: string): void {
    this.map = map;
    this.currentCircuitId = circuitId;
    
    // 초기에는 토글이 꺼져있으므로 트랙 정보를 그리지 않음
  }

  /**
   * 섹터 정보 토글
   */
  toggleSectorInfo(enabled: boolean): void {
    this.sectorEnabled = enabled;
    this.updateSectorDisplay();
  }

  /**
   * DRS 정보 토글
   */
  toggleDRSInfo(enabled: boolean): void {
    this.drsEnabled = enabled;
    this.updateDRSDisplay();
  }

  /**
   * 사용 가능한 트랙 소스 찾기
   */
  private findAvailableTrackSource(): TrackSourceInfo | null {
    if (!this.map) return null;

    const mapSources = Object.keys(this.map.getStyle().sources || {});
    const circuitSources = mapSources.filter(source => 
      source.startsWith(CONSTANTS.SOURCE_PREFIX) && 
      !source.includes(CONSTANTS.SECTOR_SUFFIX)
    );
    
    if (circuitSources.length === 0) {
      console.warn('[ReplayTrackInfoManager] No circuit-track sources available.');
      return null;
    }

    const trackId = circuitSources[0];
    const circuitId = trackId.replace(`${CONSTANTS.SOURCE_PREFIX}-`, '');
    
    return { trackId, circuitId };
  }

  /**
   * 섹터 표시 업데이트
   */
  private async updateSectorDisplay(): Promise<void> {
    const sourceInfo = this.findAvailableTrackSource();
    if (!sourceInfo) return;

    const { trackId, circuitId } = sourceInfo;

    try {
      if (this.sectorEnabled) {
        // 기존 섹터 레이어 제거 후 새로 적용
        SectorTrackManager.toggleSectorColors(trackId, false, this.map!);
        await SectorTrackManager.applySectorColors(this.map!, trackId, circuitId, true);
      } else {
        // 섹터 색상 제거
        SectorTrackManager.toggleSectorColors(trackId, false, this.map!);
      }
    } catch (error) {
      console.error('[ReplayTrackInfoManager] Failed to update sector display:', error);
    }
  }

  /**
   * DRS 표시 업데이트
   */
  private async updateDRSDisplay(): Promise<void> {
    const sourceInfo = this.findAvailableTrackSource();
    if (!sourceInfo) return;

    const { trackId, circuitId } = sourceInfo;

    try {
      if (this.drsEnabled) {
        await this.enableDRSDisplay(trackId, circuitId);
      } else {
        this.disableDRSDisplay(trackId);
      }
    } catch (error) {
      console.error('[ReplayTrackInfoManager] Failed to update DRS display:', error);
    }
  }

  /**
   * DRS 표시 활성화
   */
  private async enableDRSDisplay(trackId: string, circuitId: string): Promise<void> {
    // 기존 DRS 정리
    DRSZoneManager.toggleDRSZoneLayers(trackId, false, this.map!);
    this.updateDRSAnimationState(trackId, false);
    
    // DRS 이미지 로드
    DRSZoneManager.loadChevronImages(this.map!);
    
    // 트랙 좌표 가져오기 및 DRS 존 그리기
    const trackCoordinates = this.getTrackCoordinates(trackId);
    if (trackCoordinates.length > 0) {
      await DRSZoneManager.drawDRSZones(this.map!, trackId, trackCoordinates, circuitId);
      
      // DRS 애니메이션 설정 및 시작
      this.setupDRSAnimation(trackId);
    }
  }

  /**
   * DRS 표시 비활성화
   */
  private disableDRSDisplay(trackId: string): void {
    DRSZoneManager.toggleDRSZoneLayers(trackId, false, this.map!);
    this.updateDRSAnimationState(trackId, false);
  }

  /**
   * 트랙 좌표 가져오기
   */
  private getTrackCoordinates(trackId: string): number[][] {
    const trackSource = this.map!.getSource(trackId) as mapboxgl.GeoJSONSource;
    if (!trackSource) return [];

    const sourceData = trackSource._data;
    if (sourceData && typeof sourceData === 'object' && 'geometry' in sourceData) {
      const geometry = sourceData.geometry as any;
      if (geometry?.coordinates && Array.isArray(geometry.coordinates)) {
        return geometry.coordinates;
      }
    }
    return [];
  }

  /**
   * DRS 애니메이션 상태 업데이트
   */
  private updateDRSAnimationState(trackId: string, isActive: boolean): void {
    const existingInfo = trackStateManager.getDRSAnimation(trackId);
    trackStateManager.addDRSAnimation(trackId, {
      animationId: existingInfo?.animationId || Date.now(),
      isActive,
      ...(isActive && {
        restartFunction: () => DRSAnimationController.startAnimation(this.map!, trackId, true)
      })
    });
  }

  /**
   * DRS 애니메이션 설정 및 시작
   */
  private setupDRSAnimation(trackId: string): void {
    this.updateDRSAnimationState(trackId, true);
    
    // 약간의 지연 후 애니메이션 시작
    setTimeout(() => {
      DRSAnimationController.startAnimation(this.map!, trackId, true);
    }, CONSTANTS.DRS_ANIMATION_DELAY);
  }

  /**
   * 트랙 색상을 기본값으로 재설정
   */
  private async resetTrackColors(trackId: string): Promise<void> {
    if (!this.map) return;

    try {
      // 기존 섹터 레이어 제거
      const sectorLayers = [`${trackId}-sector-1`, `${trackId}-sector-2`, `${trackId}-sector-3`];
      sectorLayers.forEach(layerId => {
        if (this.map!.getLayer(layerId)) {
          this.map!.removeLayer(layerId);
        }
      });

      // 기본 트랙 색상 복원
      if (this.map.getLayer(trackId)) {
        this.map.setPaintProperty(trackId, 'line-color', '#FFFFFF');
        this.map.setPaintProperty(trackId, 'line-opacity', 0.8);
      }
    } catch (error) {
      console.error('[ReplayTrackInfoManager] Failed to reset track colors:', error);
    }
  }

  /**
   * 현재 상태 조회
   */
  getState(): { sectorEnabled: boolean; drsEnabled: boolean } {
    return {
      sectorEnabled: this.sectorEnabled,
      drsEnabled: this.drsEnabled
    };
  }

  /**
   * 정리
   */
  cleanup(): void {
    if (this.map && this.currentCircuitId) {
      const trackId = `${CONSTANTS.SOURCE_PREFIX}-${this.currentCircuitId}`;
      
      try {
        // DRS 존 숨기기
        DRSZoneManager.toggleDRSZoneLayers(trackId, false, this.map);
        // 트랙 색상 초기화
        this.resetTrackColors(trackId).catch(console.error);
      } catch (error) {
        console.error('[ReplayTrackInfoManager] Cleanup failed:', error);
      }
    }

    // 상태 초기화
    this.map = null;
    this.currentCircuitId = null;
    this.sectorEnabled = false;
    this.drsEnabled = false;
  }
}