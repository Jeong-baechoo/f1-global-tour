# Track Drawing Refactoring Plan

## Current Issues
- God file with 1208 lines handling multiple responsibilities
- Duplicate `animateDRSSequentialSignal` function code (lines 1030 and 1139)
- Mixed concerns: DRS zones, sectors, track drawing, animations, state management
- Global state management scattered throughout the file

## Proposed Module Structure

### 1. `drs/DRSZoneManager.ts`
**Responsibilities:**
- DRS zone drawing functions (`drawDRSZones`, `drawGeoJSONDRSZones`)
- DRS zone configuration (`DRS_ZONES`)
- DRS layer management
- DRS visibility toggling

**Key functions to move:**
- `createChevronSVG` (lines 18-22)
- `drawGeoJSONDRSZones` (lines 25-131)
- `drawDRSZones` (lines 134-295)
- `toggleDRSZoneLayers` (lines 990-1027)

### 2. `drs/DRSAnimationController.ts`
**Responsibilities:**
- DRS animation logic
- Animation state management
- Animation lifecycle control

**Key functions to move:**
- `animateDRSSequentialSignal` (lines 1030-1208, remove duplicate)
- `toggleDRSAnimations` (lines 968-987)
- `clearAllDRSAnimations` (lines 946-954)
- `activeDRSAnimations` Map

### 3. `sectors/SectorTrackManager.ts`
**Responsibilities:**
- Sector-based track coloring
- Sector data processing
- Sector layer management

**Key functions to move:**
- `drawSectorColoredTrack` (lines 372-524)
- `findSectorIndexInTrack` (lines 299-326)
- `enrichSectorDataWithTrackIndex` (lines 338-369)
- `toggleSectorTrackColors` (lines 640-673)
- `HARDCODED_SECTOR3_POSITIONS` constant

### 4. `track/TrackRenderer.ts`
**Responsibilities:**
- Core track drawing functionality
- Track animation
- Track source and layer creation

**Key functions to move:**
- `drawTrack` (lines 676-936) - main track drawing function
- Track layer creation logic
- Animation logic

### 5. `track/TrackStateManager.ts`
**Responsibilities:**
- Global state management
- Track restoration
- Layer ordering

**Key functions to move:**
- State arrays: `sectorLayers`, `drsLayers`, `originalTrackData`
- `restoreOriginalTrack` (lines 569-637)
- `moveDRSLayersToTop` (lines 532-566)
- `clearAllTrackState` (lines 957-965)

### 6. `track/TrackEventBus.ts`
**Responsibilities:**
- Event handling for track-related events
- Custom event dispatching
- Event listener management

## Benefits of Refactoring

1. **Single Responsibility Principle**: Each module has one clear purpose
2. **Easier Testing**: Smaller, focused modules are easier to unit test
3. **Better Maintainability**: Changes to DRS logic won't affect sector logic
4. **Reduced Coupling**: Clear interfaces between modules
5. **Easier to Debug**: Issues can be isolated to specific modules
6. **Parallel Development**: Multiple developers can work on different modules

## Implementation Steps

1. Create new directory structure:
   ```
   components/mapbox/utils/map/
   ├── drs/
   │   ├── DRSZoneManager.ts
   │   └── DRSAnimationController.ts
   ├── sectors/
   │   └── SectorTrackManager.ts
   ├── track/
   │   ├── TrackRenderer.ts
   │   ├── TrackStateManager.ts
   │   └── TrackEventBus.ts
   └── trackDrawing.ts (temporary, will be removed after refactoring)
   ```

2. Extract interfaces and types to a shared types file
3. Move functions to appropriate modules
4. Update imports in consuming files
5. Add proper exports from each module
6. Create an index file to re-export main functions
7. Remove the original trackDrawing.ts file

## Example Module Structure

```typescript
// drs/DRSZoneManager.ts
export class DRSZoneManager {
  private drsLayers: Map<string, string[]> = new Map();
  
  async drawDRSZones(map: mapboxgl.Map, trackId: string, coordinates: number[][], circuitId: string) {
    // Implementation
  }
  
  toggleVisibility(trackId: string, visible: boolean, map: mapboxgl.Map) {
    // Implementation
  }
}

// track/TrackRenderer.ts
export class TrackRenderer {
  constructor(
    private drsManager: DRSZoneManager,
    private sectorManager: SectorTrackManager,
    private stateManager: TrackStateManager
  ) {}
  
  async drawTrack(map: mapboxgl.Map, options: TrackDrawOptions) {
    // Implementation
  }
}
```

This refactoring will make the codebase much more maintainable and scalable.