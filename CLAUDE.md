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

## Architecture Patterns & Development Patterns

### Component Architecture
- **Map Component**: Uses `forwardRef` + `useImperativeHandle` for ref-based API
- **Factory Pattern**: `TeamMarkerFactory.createMultiple()` for efficient marker creation
- **Service Layer**: MapService, TeamService, CircuitService for business logic
- **Feature Stores**: Domain-specific Zustand stores (useMapStore, useTeamStore, etc.)

### Performance Patterns
- **Ref-based state management** to prevent unnecessary re-renders
- **Dynamic imports** for code splitting (`Map` component SSR disabled)
- **Zoom-based visibility** control via `CircuitTrackManager`
- **GPU acceleration** with `translateZ(0)` transforms
- **Local asset optimization** - prefer local over external URLs

### Data Management
- **Static JSON data**: Teams (`data/teams.json`) and circuits (`data/circuits.json`)
- **GeoJSON tracks**: Individual circuit coordinates in `public/data/circuits-geojson/`
- **Asset organization**: Team logos, driver photos, F1 cars in structured directories
- **Internationalization**: `getText()` utility with language files in `locales/`

### Development Workflow Patterns
- **Feature-based architecture** with clear domain boundaries
- **Convention over configuration** for file organization
- **Shared constants** exported from `@/src/shared/constants` (UI_TIMING, ZOOM_THRESHOLDS, etc.)
- **Type-safe development** with comprehensive TypeScript definitions

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

## Version History & Branch Strategy

### Current Development Status
- **Production**: `master` branch (protected) 
- **Development**: `develop` branch (active development)
- **Current**: `feature/improve-logic` branch with UI improvements and track feature stabilization

### Recent Major Versions
- **v0.6.0**: Architecture consolidation & cleanup with feature-based structure
- **v0.5.0**: Team details with driver profiles, major restructuring, performance optimizations
- **v0.4.0**: Architecture refactoring, Map component improvements, critical marker bug fixes
- **v0.3.0**: Performance enhancements, TypeScript improvements, mobile UX refinements

### Project Maintenance

#### Code Quality Standards
- ESLint configuration with Next.js recommended rules
- TypeScript strict mode enforced with comprehensive type checking
- Conventional commit message format required (`feat:`, `fix:`, `docs:`, etc.)
- Development error logging with `process.env.NODE_ENV === 'development'` checks

#### Asset Management Strategy
- **Local assets strongly preferred** over external URLs for 5-10x performance improvement
- **Structured public directory**: `team-logos/`, `drivers/`, `cars/`, `data/circuits-geojson/`
- **Image optimization** with Next.js Image component and proper sizing

#### Development Workflow
- **Feature branches** from `develop`: `feature/*`, `fix/*`, `hotfix/*`
- **Pull request workflow** with code review to `develop`
- **Protected master branch** for production releases only

#### Debugging Complex Side Effects
When encountering complex bugs with unexpected behavior (especially in React useEffect chains or component interactions):

1. **Add Strategic Debug Logs First** - Instead of guessing and making multiple code changes
   - Add `console.log` with clear prefixes (🟢, 🔴, 🚀, 🎯) to track execution flow
   - Include timestamps, function parameters, and call stack traces where needed
   - Log both the expected and actual values/coordinates

2. **Use Stack Traces for Root Cause Analysis**
   ```javascript
   console.log('📍 [DEBUG] Function call stack:', new Error().stack);
   ```

3. **Key Areas to Debug in F1 Global Tour**
   - **Map flyTo functions**: Log coordinates, team/circuit IDs, and gentle mode
   - **useEffect chains**: Log dependency changes and execution order
   - **User interaction handlers**: Log event triggers and state changes
   - **Timer-based logic**: Log timer creation, execution, and cleanup

4. **Debugging Pattern Example** (from team marker → wrong circuit bug):
   - First attempt: Assumed timer issue, modified timer logic (failed)
   - Second approach: Added debug logs to track actual flyTo calls
   - Result: Discovered `MobileCircuitTimeline` auto-selection was the real culprit
   - **Lesson**: Debug logs revealed the issue in 1 attempt vs 3 failed code changes

**Remember**: When stuck on complex side effects, always add debug logs before modifying code. The console output often reveals the real issue immediately.
