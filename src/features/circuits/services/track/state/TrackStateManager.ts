import { TrackLayerInfo, DRSLayerInfo, OriginalTrackData, DRSAnimationInfo } from '@/src/shared/types/circuit';

/**
 * Centralized state management for track-related data
 */
export class TrackStateManager {
  private static instance: TrackStateManager;
  
  // Track state
  private sectorLayers: TrackLayerInfo[] = [];
  private drsLayers: DRSLayerInfo[] = [];
  private originalTrackData: OriginalTrackData[] = [];
  private activeDRSAnimations: Map<string, DRSAnimationInfo> = new Map();
  
  private constructor() {}
  
  static getInstance(): TrackStateManager {
    if (!TrackStateManager.instance) {
      TrackStateManager.instance = new TrackStateManager();
    }
    return TrackStateManager.instance;
  }
  
  // Sector layers management
  addSectorLayer(layer: TrackLayerInfo): void {
    this.sectorLayers.push(layer);
  }
  
  
  findSectorLayer(trackId: string): TrackLayerInfo | undefined {
    return this.sectorLayers.find(layer => layer.trackId === trackId);
  }
  
  // DRS layers management
  addDRSLayer(layer: DRSLayerInfo): void {
    this.drsLayers.push(layer);
  }
  
  
  findDRSLayer(trackId: string): DRSLayerInfo | undefined {
    return this.drsLayers.find(layer => layer.trackId === trackId);
  }
  
  // Original track data management
  addOriginalTrackData(data: OriginalTrackData): void {
    this.originalTrackData.push(data);
  }
  
  
  findOriginalTrackData(trackId: string): OriginalTrackData | undefined {
    return this.originalTrackData.find(data => data.trackId === trackId);
  }
  
  // DRS animation management
  addDRSAnimation(trackId: string, animationInfo: DRSAnimationInfo): void {
    this.activeDRSAnimations.set(trackId, animationInfo);
  }
  
  getDRSAnimation(trackId: string): DRSAnimationInfo | undefined {
    return this.activeDRSAnimations.get(trackId);
  }
  
  
  // Clear all animations
  clearAllDRSAnimations(): void {
    this.activeDRSAnimations.forEach((animationInfo) => {
      animationInfo.isActive = false;
      if (animationInfo.animationId) {
        cancelAnimationFrame(animationInfo.animationId);
      }
    });
    this.activeDRSAnimations.clear();
  }
  
  // Clear all state
  clearAll(): void {
    this.sectorLayers.length = 0;
    this.drsLayers.length = 0;
    this.originalTrackData.length = 0;
    this.clearAllDRSAnimations();
  }
}

export const trackStateManager = TrackStateManager.getInstance();