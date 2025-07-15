# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

F1 Global Tour is a Next.js 15 web application that visualizes Formula 1 teams and circuits on an interactive 3D globe using Mapbox GL. The project showcases F1's global presence through immersive map interactions with comprehensive team and circuit data.

## Development Commands

```bash
npm run dev       # Start development server on http://localhost:3000
npm run build     # Build for production
npm run start     # Start production server
npm run lint      # Run ESLint
```

## Technology Stack

- **Next.js 15.3.4** with App Router and React 19
- **TypeScript 5** with strict mode enabled
- **Mapbox GL JS 3.13.0** for 3D map rendering  
- **Tailwind CSS 3.4.17** for styling
- **Zustand 5.0.6** for state management
- **Radix UI** components for accessible UI elements

## Architecture & Key Components

### Feature-Based Architecture (v0.5.0+)
The project uses a modular feature-based architecture with clear separation of concerns:

```
src/
├── features/           # Domain-specific features
│   ├── map/           # Core map functionality
│   ├── teams/         # Team-related features  
│   ├── circuits/      # Circuit-related features
│   └── race-info/     # Race information panels
└── shared/            # Shared utilities and components
    ├── components/    # Reusable UI components
    ├── constants/     # Application constants
    ├── types/         # TypeScript type definitions
    └── utils/         # Shared utility functions
```

#### Core Map Components (`src/features/map/`)
- `components/Map.tsx`: Main map orchestrator with ref-based API
- `components/MapCanvas.tsx`: Core Mapbox GL instance management
- `components/MapContainer.tsx`: Layout wrapper with responsive design
- `services/MapService.ts`: Centralized map operations
- `store/useMapStore.ts`: Zustand state management

#### Feature Modules
- **Teams** (`src/features/teams/`): Team markers, headquarters, driver profiles
- **Circuits** (`src/features/circuits/`): Circuit markers, track rendering, DRS zones  
- **Race Info** (`src/features/race-info/`): Interactive panels, countdown timers

#### Shared Architecture (`src/shared/`)
- **Components**: UI components with LocalizedText, sheet dialogs
- **Constants**: Zoom levels, colors, animation settings
- **Utils**: Animation helpers, map utilities, data converters
- **Types**: Comprehensive TypeScript definitions

### Data Structure & Content
- `data/teams.json`: 10 F1 teams (2025 season) with headquarters, colors, principals
- `data/circuits.json`: 24 official circuits + Nürburgring with detailed metadata  
- `public/data/circuits-geojson/`: Individual circuit track coordinates
- `public/drivers/`: Driver profile photos (2025 grid)
- `public/cars/`: F1 car images for each team
- `public/team-logos/`: High-resolution team logos

### Performance Optimizations
- **GPU acceleration** via `translateZ(0)` transforms
- **Reduced Mapbox tile cache** (size: 50) for memory efficiency
- **Zoom-based visibility** control for circuit tracks
- **Factory pattern** for marker creation (85% code reduction)
- **Local asset optimization** (5-10x faster than external URLs)
- **Ref-based state management** to prevent unnecessary re-renders

## Environment Setup

### Mapbox Configuration
Requires Mapbox access token for map rendering:
- Environment variable: `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` in `.env.local`
- Fallback hardcoded token available in Map.tsx
- Uses satellite-v9 style (minimal layers) for performance

### TypeScript Configuration
- **Strict mode enabled** with comprehensive type checking
- **Path mapping**: `@/*` points to project root for clean imports
- **ES2017 target** with modern module resolution

## Development Workflow

### Branch Strategy
- **`master`**: Production-ready code (protected)
- **`develop`**: Active development branch (default, current)
- **Feature branches**: `feature/*`, `fix/*`, `hotfix/*`

### Commit Message Format
Follow conventional commits:
- `feat:` New features
- `fix:` Bug fixes  
- `docs:` Documentation updates
- `style:` Code style changes
- `refactor:` Code refactoring
- `test:` Test additions/modifications
- `chore:` Build/config changes

## Common Development Tasks

### Adding Team Content
1. **Team data**: Update `data/teams.json` with new team information
2. **Markers**: Teams use `TeamMarkerFactory.createMultiple()` pattern
3. **Assets**: Add team logos to `public/team-logos/`
4. **Driver profiles**: Add photos to `public/drivers/` directory

### Adding Circuit Content  
1. **Circuit data**: Update `data/circuits.json` 
2. **Track coordinates**: Add GeoJSON files to `public/data/circuits-geojson/`
3. **Circuit markers**: Created via `useCircuitMarkers` hook
4. **Visibility**: Managed by `CircuitTrackManager` based on zoom level

### Internationalization
- **Text management**: Use `getText()` from `@/utils/i18n`
- **Localized content**: Components use `LocalizedText` for multi-language support
- **Language files**: Located in `locales/en/` and `locales/ko/`

### Map Customization
- **Globe rotation**: Modify `secondsPerRevolution` in animation constants
- **FlyTo behavior**: Adjust speed/curve parameters in camera configs
- **Performance**: All optimizations documented in performance section above

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

## Key Dependencies & Utilities

### UI Component Libraries
- **Radix UI**: Accessible components (`@radix-ui/react-dialog`, `@radix-ui/react-slot`)
- **Lucide React**: Icon library for consistent iconography
- **Heroicons**: Additional icon set for specific UI elements

### Styling & Utilities  
- **clsx & tailwind-merge**: Combined via `cn()` utility in `@/lib/utils`
- **class-variance-authority**: Component variant system
- **Tailwind CSS**: Utility-first styling framework

### State Management
- **Zustand**: Lightweight state management for map, teams, circuits, and panels
- **React Context**: LanguageContext for internationalization

### Map & Geospatial
- **Mapbox GL JS**: Core mapping library
- **@mapbox/mapbox-gl-geocoder**: Search functionality (if needed)
- **GeoJSON**: Circuit track coordinate data format

## Project Maintenance

### Code Quality
- ESLint configuration with Next.js recommended rules
- TypeScript strict mode enforced
- Conventional commit message format required

### Asset Management  
- **Local assets preferred** over external URLs for performance
- **Organized public directory** with clear folder structure
- **Optimized images** for web delivery

### Documentation
- Comprehensive README.md with feature overview
- CHANGELOG.md tracking version history  
- Architecture documentation in docs/ directory
