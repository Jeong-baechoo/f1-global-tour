# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

F1 Global Tour is a Next.js web application that visualizes Formula 1 teams and circuits on an interactive 3D globe using Mapbox GL. The project showcases F1's global presence through immersive map interactions.

## Development Commands

```bash
npm run dev       # Start development server on http://localhost:3000
npm run build     # Build for production
npm run start     # Start production server
npm run lint      # Run ESLint
```

## Architecture & Key Components

### Map Implementation (Feature-based Architecture)
The project has been refactored to use a feature-based architecture:

#### Core Map Components (src/features/map/)
- `components/Map.tsx`: Main map component that orchestrates all features
- `components/MapCanvas.tsx`: Core Mapbox GL instance management
- `components/MapContainer.tsx`: Layout wrapper for map and controls
- `services/MapService.ts`: Centralized map operations service
- `store/`: Zustand store for map state management

#### Feature Modules
- `src/features/teams/`: Team markers and related functionality
- `src/features/circuits/`: Circuit markers and track rendering
- `src/features/race-info/`: Interactive panels and race information

#### Shared Map Utilities (components/mapbox/)
- Track rendering and animations
- Marker management utilities
- Map constants and configurations

Performance optimizations:
- GPU acceleration via `translateZ(0)` 
- Reduced tile cache size (50)
- CircuitTrackManager for zoom-based visibility control
- Event delegation and cleanup patterns

### Data Structure
- `data/teams.json`: 10 F1 teams with headquarters locations, colors, principals
- `data/circuits.json`: 24 official 2024 circuits + Nürburgring
- `data/nurburgring-track.json`: Track coordinates for animation

### Current Implementation Status
- ✅ All 10 F1 teams with custom markers and styling
- ✅ All 24 circuits with animated track drawing
- ✅ Dynamic sector markers, DRS zones, and elevation
- ✅ Zoom-based visibility management
- ✅ Feature-based architecture fully implemented

## Performance Considerations

The map has been optimized for performance:
- Removed 3D terrain (setTerrain) for better GPU performance
- Using satellite-v9 style (minimal layers)
- Removed all label layers on load
- FlyTo animations use reduced speed (0.6) and curve (1)
- Track rendering uses single layer instead of 3

## Environment Setup

Requires Mapbox access token:
- Currently hardcoded in Map.tsx: `pk.eyJ1IjoiYmFlY2hvb2tpbmciLCJhIjoiY21iajAwaTd1MGJrZjJqb2g3M3RsZ2hhaiJ9.B1BuVoKpl3Xt1HSZq6ugeA`
- Also available in `.env.local` as `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`

## Common Tasks

### Adding New Team Markers
1. Team data exists in `data/teams.json`
2. Markers are created via `src/features/teams/hooks/useTeamMarkers.tsx`
3. Styling configuration in `components/mapbox/markers/team/teamMarkerConfig.ts`
4. Automatic cleanup handled by MarkerService

### Adding Circuit Markers
1. Circuit data in `data/circuits.json`
2. Markers created via `src/features/circuits/hooks/useCircuitMarkers.tsx`
3. Track data in `data/circuits/[circuit-id]/[circuit-id]-track.geojson`
4. CircuitTrackManager handles zoom-based visibility

### Modifying Map Behavior
- Globe rotation: Adjust `secondsPerRevolution` (currently 180)
- FlyTo animations: Modify speed, curve, duration parameters
- Marker styles: Update DOM element styles in marker creation

## Critical Guidelines to Prevent Known Issues

### Mapbox Marker Positioning (Issue #15)
**Problem**: Markers moving/drifting when dragging the map in production environment.

**Root Cause**: Conflict between CSS transforms and Mapbox anchor properties.

**DO NOT**:
- Never use CSS `transform: translate()` on Mapbox marker elements
- Never mix CSS positioning with Mapbox anchor properties
- Avoid `willChange: 'transform'` on marker elements

**DO**:
- Use only Mapbox's `anchor` option for positioning (e.g., `anchor: 'center'`)
- Let Mapbox handle all positioning calculations
- Trust Mapbox's internal positioning system

**Example of correct marker creation**:
```javascript
const marker = new mapboxgl.Marker(markerElement, {
  anchor: 'center' // Use Mapbox anchor, not CSS transforms
})
.setLngLat([longitude, latitude])
.addTo(map);
```

## Git Workflow

Current git status shows:
- Modified: `app/globals.css`, `components/Map.tsx`
- Branch: master
- Use commit format: `<type>: <description>` (feat, fix, docs, style, refactor, test, chore)
