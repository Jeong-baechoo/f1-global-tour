# F1 Global Tour - Migration Guide

This guide helps developers understand the changes from the old component-based architecture to the new feature-based architecture.

## Overview of Changes

The project has been refactored from a traditional component-based structure to a feature-based architecture, improving maintainability, scalability, and developer experience.

### Old Structure
```
components/
├── mapbox/
│   ├── Map.tsx (451 lines)
│   ├── InteractivePanel.tsx (616 lines)
│   ├── markers/
│   ├── utils/
│   └── ... (53+ files)
```

### New Structure
```
src/features/
├── map/
├── teams/
├── circuits/
└── race-info/
```

## Breaking Changes

### 1. Import Paths

**Old:**
```typescript
import Map from '@/components/mapbox/Map';
import { InteractivePanel } from '@/components/InteractivePanel';
import { teamMarkerConfig } from '@/components/mapbox/markers/team/teamMarkerConfig';
```

**New:**
```typescript
import Map from '@/src/features/map/components/Map';
import { InteractivePanel } from '@/src/features/race-info/components/InteractivePanel';
import { getTeamMarkerConfig } from '@/components/mapbox/markers/team/teamMarkerConfig';
```

### 2. State Management

**Old:** Props drilling and local state
```typescript
const [teams, setTeams] = useState([]);
const [selectedTeam, setSelectedTeam] = useState(null);
// Pass through multiple component layers
<Map teams={teams} selectedTeam={selectedTeam} />
```

**New:** Zustand stores
```typescript
import { useTeamStore } from '@/src/features/teams/store';

const { teams, selectedTeam, setSelectedTeam } = useTeamStore();
// Direct access, no prop drilling
```

### 3. Map API Changes

**Old:**
```typescript
// Direct method calls on map component
map.flyToCircuit(circuitId);
```

**New:**
```typescript
// Through ref API
mapRef.current?.flyToCircuit(circuitId);
```

## Step-by-Step Migration

### Step 1: Update Imports

1. Replace old component imports with new paths
2. Update utility imports to use new locations
3. Update type imports from centralized type definitions

### Step 2: Replace State Management

1. Remove prop drilling code
2. Import appropriate store hooks
3. Replace useState with store selectors

**Example:**
```typescript
// Old
const [circuits, setCircuits] = useState([]);
useEffect(() => {
  loadCircuits().then(setCircuits);
}, []);

// New
import { useCircuits } from '@/src/features/circuits/hooks/useCircuits';
const { circuits, isLoading } = useCircuits();
```

### Step 3: Update Component Usage

1. Replace large components with feature modules
2. Update event handlers to use new patterns
3. Use new hooks for common functionality

### Step 4: Clean Up Legacy Code

1. Remove old component files (they now re-export from new locations)
2. Remove unused utilities
3. Update test files to use new imports

## Common Patterns

### Using Feature Hooks

```typescript
// Team markers
import { useTeamMarkers } from '@/src/features/teams/hooks/useTeamMarkers';
const { createTeamMarkers, flyToTeam } = useTeamMarkers(map);

// Circuit markers
import { useCircuitMarkers } from '@/src/features/circuits/hooks/useCircuitMarkers';
const { createCircuitMarkers, flyToCircuit } = useCircuitMarkers(map);
```

### Accessing Services

```typescript
// Map operations
import { MapService } from '@/src/features/map/services/MapService';
const mapService = MapService.getInstance();

// Team data
import { TeamService } from '@/src/features/teams/services/TeamService';
const teamService = new TeamService();
```

### State Management

```typescript
// Global state
import { useMapStore } from '@/src/features/map/store';
const { map, isMapLoaded, isCinematicMode } = useMapStore();

// Feature state
import { useCircuitStore } from '@/src/features/circuits/store';
const { circuits, currentCircuit } = useCircuitStore();
```

## Backward Compatibility

To ease migration, old component files have been converted to re-export from new locations:

```typescript
// components/mapbox/Map.tsx
export { default } from '@/src/features/map/components/Map';
export * from '@/src/features/map/components/Map';
```

This allows existing code to continue working while you migrate gradually.

## Performance Improvements

The new architecture includes several performance optimizations:

1. **Code Splitting**: Features are dynamically imported
2. **Memoization**: Components use React.memo
3. **Optimized Re-renders**: Zustand stores prevent unnecessary updates
4. **Debounced Handlers**: Resize and scroll handlers are optimized

## Testing

Update your tests to use the new structure:

```typescript
// Old
import { render } from '@testing-library/react';
import Map from '@/components/mapbox/Map';

// New
import { render } from '@testing-library/react';
import Map from '@/src/features/map/components/Map';
import { MapService } from '@/src/features/map/services/MapService';

// Mock the service
jest.mock('@/src/features/map/services/MapService');
```

## Troubleshooting

### Issue: Import not found
**Solution:** Check the new path in the feature module or use the re-exported legacy path temporarily.

### Issue: State not updating
**Solution:** Ensure you're using the correct store and that components are subscribed to store updates.

### Issue: Map methods not working
**Solution:** Use the ref API pattern: `mapRef.current?.methodName()`

### Issue: TypeScript errors
**Solution:** Import types from the feature's types directory: `@/src/features/[feature]/types`

## Resources

- [Architecture Documentation](./ARCHITECTURE.md)
- [API Documentation](./API.md)
- [Original Refactoring Plan](../REFACTORING_PLAN.md)

## Getting Help

If you encounter issues during migration:

1. Check the re-exported paths for backward compatibility
2. Review the new architecture documentation
3. Look for examples in the migrated code
4. Create an issue with the migration label