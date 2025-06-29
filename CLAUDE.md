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

### Map Implementation (components/Map.tsx)
The core visualization component that:
- Initializes Mapbox GL with satellite-v9 style for optimal performance
- Implements auto-rotating globe animation when idle
- Handles marker interactions with flyTo animations
- Currently displays Red Bull Racing HQ and Nürburgring circuit
- Uses cleanup functions to prevent memory leaks

Performance optimizations include:
- GPU acceleration via `translateZ(0)` 
- Reduced tile cache size (50)
- Disabled anti-aliasing and fade animations
- Single track layer instead of multiple layers
- Event listener cleanup on unmount

### Data Structure
- `data/teams.json`: 10 F1 teams with headquarters locations, colors, principals
- `data/circuits.json`: 24 official 2024 circuits + Nürburgring
- `data/nurburgring-track.json`: Track coordinates for animation

### Current Implementation Status
- ✅ Red Bull Racing marker with custom styling
- ✅ Nürburgring with animated track drawing
- ⚠️ Other teams/circuits data exists but not rendered
- ⚠️ MapContainer component exists but unused

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
1. Team data already exists in `data/teams.json`
2. Follow Red Bull marker pattern in Map.tsx (lines 126-248)
3. Create custom marker element with team branding
4. Add to markers ref array for cleanup

### Adding Circuit Markers
1. Circuit data in `data/circuits.json` 
2. Currently only Nürburgring is implemented (lines 251-519)
3. For track animations, create GeoJSON coordinate arrays like `nurburgring-track.json`

### Modifying Map Behavior
- Globe rotation: Adjust `secondsPerRevolution` (currently 180)
- FlyTo animations: Modify speed, curve, duration parameters
- Marker styles: Update DOM element styles in marker creation

## Git Workflow

Current git status shows:
- Modified: `app/globals.css`, `components/Map.tsx`
- Branch: master
- Use commit format: `<type>: <description>` (feat, fix, docs, style, refactor, test, chore)
