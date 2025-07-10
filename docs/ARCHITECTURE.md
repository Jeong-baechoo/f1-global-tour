# F1 Global Tour - Architecture Documentation

## Overview

F1 Global Tour is a Next.js web application showcasing Formula 1 teams and circuits on an interactive 3D globe using Mapbox GL. The project has been refactored to use a feature-based architecture for better maintainability and scalability.

## Architecture Principles

### 1. Feature-Based Structure
The application is organized by features rather than technical layers, promoting high cohesion and low coupling.

### 2. Single Responsibility
Each module handles one specific domain concern, making the codebase easier to understand and maintain.

### 3. Dependency Inversion
Components depend on abstractions (interfaces/types) rather than concrete implementations.

### 4. Progressive Enhancement
The application uses progressive enhancement techniques like dynamic imports and lazy loading for optimal performance.

## Directory Structure

```
src/
├── features/               # Feature modules
│   ├── map/               # Map functionality
│   │   ├── components/    # Map-related components
│   │   ├── hooks/         # Custom hooks for map
│   │   ├── services/      # Business logic services
│   │   ├── store/         # State management (Zustand)
│   │   └── types/         # TypeScript definitions
│   │
│   ├── teams/             # F1 teams management
│   │   ├── components/    # Team markers and UI
│   │   ├── data/          # Team details data
│   │   ├── hooks/         # Team-related hooks
│   │   ├── services/      # Team data services
│   │   ├── store/         # Team state management
│   │   └── types/         # Team type definitions
│   │
│   ├── circuits/          # Circuit management
│   │   ├── components/    # Circuit markers and UI
│   │   ├── config/        # Circuit configurations
│   │   ├── hooks/         # Circuit-related hooks
│   │   ├── services/      # Circuit services and managers
│   │   ├── store/         # Circuit state management
│   │   ├── types/         # Circuit type definitions
│   │   └── utils/         # Circuit utilities
│   │
│   └── race-info/         # Race information panels
│       ├── components/    # Panel components
│       ├── hooks/         # Panel-specific hooks
│       ├── store/         # Panel state management
│       └── types/         # Panel type definitions
│
├── shared/                # Shared modules
│   ├── components/        # Common UI components
│   ├── hooks/             # Common hooks
│   ├── services/          # Common services
│   ├── store/             # Global state management
│   ├── types/             # Common type definitions
│   └── utils/             # Common utilities
│
├── data/                  # Static data
│   ├── teams.json         # F1 teams data
│   ├── circuits.json      # Circuits data
│   └── circuits/          # Circuit-specific data
│       └── [circuit-id]/  # Track geometry, sectors, etc.
│
└── contexts/              # React contexts
    └── LanguageContext.tsx # i18n context
```

## Core Modules

### Map Module (`src/features/map/`)

The map module handles the core Mapbox GL functionality.

**Key Components:**
- `Map.tsx`: Main map component that orchestrates all features
- `MapCanvas.tsx`: Manages the Mapbox GL instance
- `MapContainer.tsx`: Layout wrapper with controls

**Services:**
- `MapService`: Centralized map operations (zoom, fly-to, style management)
- `MarkerService`: Generic marker management

**State Management:**
- `useMapStore`: Zustand store for map state (viewport, loading, user interaction)

### Teams Module (`src/features/teams/`)

Manages F1 team data and visualization.

**Features:**
- Team headquarters markers with custom styling
- UK teams hexagonal layout at low zoom levels
- Team details panel integration

**Key Services:**
- `TeamService`: Team data fetching and filtering
- UK team position calculations with geodesic formulas

### Circuits Module (`src/features/circuits/`)

Handles circuit visualization and track rendering.

**Features:**
- Circuit markers with race information
- Animated track drawing
- DRS zones and sector visualization
- Elevation data rendering
- Zoom-based visibility management

**Key Services:**
- `CircuitService`: Circuit data management
- `CircuitAnimationService`: Track animation orchestration
- `CircuitTrackManager`: Performance-optimized track visibility

### Race Info Module (`src/features/race-info/`)

Interactive panels for displaying race information.

**Components:**
- `NextRacePanel`: Countdown to next race
- `TeamHQPanel`: Team headquarters information
- `CircuitDetailPanel`: Circuit details and controls

**Features:**
- Mobile bottom sheet / desktop slide panel
- Drag gestures for mobile
- Real-time countdown timer

## State Management

The application uses Zustand for state management with a modular approach:

```typescript
// Global app state
useAppStore
├── language
├── theme
└── user preferences

// Feature-specific stores
useMapStore      // Map viewport, loading states
useTeamStore     // Teams data, selected team
useCircuitStore  // Circuits data, current circuit
usePanelStore    // Panel visibility, content
```

## Performance Optimizations

### 1. Code Splitting
- Dynamic imports for heavy components
- Route-based code splitting with Next.js

### 2. Rendering Optimizations
- React.memo for expensive components
- useMemo/useCallback for computed values
- Debounced resize handlers

### 3. Map Performance
- GPU acceleration with `translateZ(0)`
- Reduced tile cache size (50)
- Zoom-based feature visibility
- Removed unnecessary map layers

### 4. Asset Optimization
- Next.js Image component for optimized loading
- Lazy loading for off-screen content

## Data Flow

```
User Interaction
    ↓
Component (UI Layer)
    ↓
Hook (Logic Layer)
    ↓
Service (Business Logic)
    ↓
Store (State Management)
    ↓
Map/Marker Updates
```

## Testing Strategy

### Unit Tests
- Services: Business logic validation
- Hooks: Custom hook behavior
- Utils: Utility function correctness

### Integration Tests
- Feature modules: End-to-end feature testing
- State management: Store interactions

### E2E Tests
- User flows: Complete user journeys
- Cross-browser compatibility

## Build and Deployment

### Development
```bash
npm run dev     # Start development server
npm run lint    # Run ESLint
npm run test    # Run tests
```

### Production
```bash
npm run build   # Build for production
npm run start   # Start production server
```

### Environment Variables
```env
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=your_token_here
```

## Migration Notes

The project was migrated from a component-based to feature-based architecture using the Strangler Fig Pattern:

1. **Phase 1**: Set up new directory structure
2. **Phase 2**: Create feature modules with new implementations
3. **Phase 3**: Gradually migrate functionality
4. **Phase 4**: Remove legacy code

## Future Enhancements

1. **Performance Monitoring**: Implement real-time performance metrics
2. **PWA Support**: Add offline capabilities
3. **Advanced Analytics**: Track user interactions
4. **Additional Features**: Weather data, live timing integration

## Contributing

When adding new features:

1. Create a new feature module under `src/features/`
2. Follow the established structure (components, hooks, services, store, types)
3. Use TypeScript for type safety
4. Add tests for new functionality
5. Update this documentation

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Mapbox GL JS API](https://docs.mapbox.com/mapbox-gl-js/api/)
- [Zustand Documentation](https://github.com/pmndrs/zustand)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)