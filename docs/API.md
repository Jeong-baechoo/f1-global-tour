# F1 Global Tour - API Documentation

## Map API

The Map component exposes methods through a ref interface.

### Methods

#### `flyToLocation(coords: [number, number], options?: FlyToOptions): void`
Fly to a specific location on the map.

```typescript
mapRef.current?.flyToLocation([7.4201, 43.7347], {
  zoom: 15,
  pitch: 60,
  bearing: -45
});
```

#### `flyToCircuit(circuitId: string): void`
Fly to a specific circuit and optionally draw its track.

```typescript
mapRef.current?.flyToCircuit('monaco');
```

#### `flyToTeam(teamId: string): void`
Fly to a team's headquarters location.

```typescript
mapRef.current?.flyToTeam('mercedes');
```

#### `resetView(): void`
Reset the map to the initial global view.

```typescript
mapRef.current?.resetView();
```

## Services

### MapService

Singleton service for map operations.

```typescript
const mapService = MapService.getInstance();

// Initialize map
const map = mapService.initializeMap({
  container: containerElement,
  center: [0, 20],
  zoom: 1.5
});

// Fly to location
mapService.flyToLocation([lng, lat], { zoom: 15 });

// Get current zoom
const zoom = mapService.getZoom();

// Set cinematic mode
mapService.setCinematicMode(true);
```

### TeamService

Service for managing F1 team data.

```typescript
const teamService = new TeamService();

// Get all teams
const teams = await teamService.getTeams();

// Get team by ID
const mercedes = await teamService.getTeamById('mercedes');

// Get UK-based teams
const ukTeams = await teamService.getUKTeams();

// Get teams by country
const italianTeams = await teamService.getTeamsByCountry('Italy');
```

### CircuitService

Service for managing circuit data.

```typescript
const circuitService = new CircuitService();

// Get all circuits
const circuits = await circuitService.getCircuits();

// Get circuit by ID
const monaco = await circuitService.getCircuitById('monaco');

// Get next race
const nextRace = await circuitService.getNextRace();

// Get track data
const trackData = await circuitService.getTrackData('silverstone');
```

## Hooks

### useMapAnimation

Hook for map animations and transitions.

```typescript
const { flyToLocation, flyToCircuit, flyToTeam, resetView } = useMapAnimation({
  map: mapRef,
  globeSpinner: spinnerRef,
  onCircuitSelect,
  setIsTrackAnimating
});
```

### useTeamMarkers

Hook for managing team markers on the map.

```typescript
const {
  createTeamMarker,
  createTeamMarkers,
  removeTeamMarker,
  removeAllTeamMarkers,
  updateTeamMarker,
  flyToTeam
} = useTeamMarkers(map);

// Create markers for all teams
createTeamMarkers(teams, {}, handleMarkerClick, language);
```

### useCircuitMarkers

Hook for managing circuit markers.

```typescript
const {
  createCircuitMarker,
  createCircuitMarkers,
  removeCircuitMarker,
  removeAllCircuitMarkers,
  updateCircuitMarker,
  flyToCircuit
} = useCircuitMarkers(map);

// Create circuit markers
createCircuitMarkers(circuits, {}, handleMarkerClick, language);
```

### useCountdown

Hook for race countdown timer.

```typescript
const { days, hours, minutes, seconds } = useCountdown(raceDate);
```

## State Stores

### useMapStore

Global map state management.

```typescript
const {
  map,
  isMapLoaded,
  center,
  zoom,
  bearing,
  pitch,
  isCinematicMode,
  isUserInteracting,
  setMap,
  setMapLoaded,
  setViewport,
  setIsCinematicMode,
  setUserInteracting
} = useMapStore();
```

### useTeamStore

Team data state management.

```typescript
const {
  teams,
  selectedTeam,
  teamMarkers,
  setTeams,
  setSelectedTeam,
  setTeamMarkers,
  getTeamById
} = useTeamStore();
```

### useCircuitStore

Circuit data state management.

```typescript
const {
  circuits,
  currentCircuit,
  circuitMarkers,
  isTrackVisible,
  setCircuits,
  setCurrentCircuit,
  setCircuitMarkers,
  setTrackVisible,
  getCircuitById
} = useCircuitStore();
```

### usePanelStore

Interactive panel state management.

```typescript
const {
  isOpen,
  isMinimized,
  panelModule,
  panelData,
  setOpen,
  setMinimized,
  setPanelModule,
  setPanelData,
  closePanel,
  openPanel
} = usePanelStore();
```

## Types

### Team Types

```typescript
interface Team {
  id: string;
  name: LocalizedText;
  headquarters: Location;
  teamPrincipal: string;
  colors: TeamColors;
  championships2025: Championships;
}

interface TeamColors {
  primary: string;
  secondary: string;
}
```

### Circuit Types

```typescript
interface Circuit {
  id: string;
  name: LocalizedText;
  location: Location;
  raceInfo: RaceInfo;
}

interface RaceInfo {
  round: number;
  raceName: LocalizedText;
  date: string;
  time?: string;
  sprint?: boolean;
}
```

### Common Types

```typescript
interface LocalizedText {
  en: string;
  ko: string;
}

interface Location {
  lat: number;
  lng: number;
  city: LocalizedText;
  country: LocalizedText;
}
```

## Events

### Custom Events

The application dispatches custom events for feature toggling:

```typescript
// Toggle sector information display
window.dispatchEvent(new CustomEvent('toggleSectorInfo', { 
  detail: { enabled: true } 
}));

// Toggle DRS zones display
window.dispatchEvent(new CustomEvent('toggleDRSZones', { 
  detail: { enabled: true } 
}));

// Toggle elevation display
window.dispatchEvent(new CustomEvent('toggleElevation', { 
  detail: { enabled: true } 
}));
```

## Utils

### i18n

Text localization utilities.

```typescript
import { getText } from '@/utils/i18n';

// Get localized text
const text = getText('next_race', language);
const teamName = getText(team.name, language);
```

### Performance

Performance optimization utilities.

```typescript
import { debounce, throttle } from '@/src/shared/utils/performance';

// Debounce function calls
const debouncedResize = debounce(() => {
  map.resize();
}, 300);

// Throttle function calls
const throttledScroll = throttle(() => {
  updateScrollPosition();
}, 100);
```