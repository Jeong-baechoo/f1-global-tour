# 🏎️ F1 Global Tour

<div align="center">
  <img src="https://img.shields.io/badge/Next.js-15.5.14-black?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Mapbox-GL-4169E1?style=for-the-badge&logo=mapbox&logoColor=white" alt="Mapbox" />
  <img src="https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
</div>

<div align="center">
  <h3>🌍 Experience the Global Presence of Formula 1 in 3D</h3>
  <p>An interactive web application that visualizes F1 teams and circuits on a stunning 3D globe</p>
</div>

---

## ✨ Features

### 🗺️ Interactive 3D Globe
- **Auto-rotating Earth** with smooth animations
- **Satellite imagery** for realistic visualization
- **GPU-accelerated** rendering for optimal performance

### 🏁 F1 Data Visualization
- **10 F1 Teams** with headquarters markers
- **24 Official Circuits** from the 2025 season
- **Real-time race countdown** for upcoming events
- **Detailed information panels** for teams and circuits
- **2025 Driver profiles** with photos and information
- **F1 Car images** for each team

### 🎬 Race Replay System
- **Real-time race replay** with driver position tracking on circuit maps
- **Driver telemetry** visualization with backend API integration
- **Interactive playback controls** (play/pause, speed 0.5x~4x)
- **Timing panels** with sector performance, intervals, and pit stop data
- **Track info toggles** for sector and DRS zone visualization
- **DNF handling** with realistic driver retirement scenarios

### 📱 Responsive Design
- **Mobile-optimized** interactive bottom sheet
- **Desktop-friendly** side panels
- **Touch gestures** support on mobile devices
- **Adaptive UI** based on screen size


## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Mapbox account for API token

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/f1-global-tour.git
   cd f1-global-tour
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   Add your Mapbox access token:
   ```
   NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=your_mapbox_token_here
   ```

4. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🏗️ Project Structure

```
f1-global-tour/
├── src/
│   ├── app/                # Next.js App Router directory
│   ├── features/           # Domain-specific features
│   │   ├── map/           # Core map functionality
│   │   ├── teams/         # Team-related features
│   │   ├── circuits/      # Circuit-related features
│   │   ├── race-info/     # Race information panels
│   │   └── replay/        # F1 race replay system
│   │       ├── components/ # Replay UI controls and panels
│   │       ├── services/   # Animation engine, track managers
│   │       ├── store/      # Replay state management
│   │       ├── hooks/      # Custom replay hooks
│   │       ├── types/      # Replay type definitions
│   │       ├── data/       # Mock data for development
│   │       └── utils/      # Replay utilities
│   └── shared/            # Shared utilities and components
│       ├── components/    # Reusable UI components
│       ├── constants/     # Application constants
│       ├── types/         # TypeScript type definitions
│       └── utils/         # Shared utility functions
├── data/                  # F1 teams & circuits data
│   ├── teams.json
│   ├── circuits.json
│   └── circuits-geojson/  # Circuit track coordinates
└── public/               # Static assets
    ├── team-logos/       # Team logo images
    ├── drivers/          # Driver profile photos
    ├── cars/            # F1 car images
    └── data/circuits-geojson/  # Circuit track GeoJSON files
```

## 🎮 Usage

### Navigation Controls
- **🖱️ Click & Drag** - Rotate the globe
- **📍 Click Markers** - View team/circuit details
- **🔍 Scroll** - Zoom in/out
- **📱 Touch** - Mobile gesture support

### Features
- **Next Race Countdown** - See time until the next Grand Prix
- **Circuit Details** - Track layout, corners, and race schedule
- **Team Information** - Headquarters, drivers, and team colors
- **Driver Profiles** - Photos, nationality, and racing numbers
- **F1 Cars Gallery** - 2025 season car images for each team

## 🛠️ Technology Stack

- **[Next.js 15.5](https://nextjs.org/)** - React 19 framework with App Router
- **[TypeScript 5](https://www.typescriptlang.org/)** - Strict mode type safety
- **[Mapbox GL JS 3.13](https://www.mapbox.com/mapbox-gljs)** - 3D map rendering
- **[Tailwind CSS 3.4](https://tailwindcss.com/)** - Utility-first styling
- **[Zustand 5](https://zustand.docs.pmnd.rs/)** - Lightweight state management
- **[Radix UI](https://www.radix-ui.com/)** - Accessible UI components
- **[Axios](https://axios-http.com/)** - HTTP client for backend API
- **[Lucide Icons](https://lucide.dev/)** - Beautiful icons

### Backend
- **[f1-global-tour-backend](https://github.com/hh-0704/f1-global-tour-backend)** - NestJS + TypeScript + Redis backend server
  - OpenF1 API proxy and data transformation
  - Driver telemetry, flag info, and race data provider

## 🎨 Key Components

### Map Component (v0.4.0+)
Enhanced with modern React patterns:
```typescript
// Using forwardRef and useImperativeHandle
const mapRef = useRef<MapAPI>(null);
<Map ref={mapRef} />

// Clean separation of concerns
- MapService: Centralized map operations
- MarkerService: Marker management
- Efficient ref-based state management
```

### Team Marker System (v0.5.0+)
Streamlined team marker management:
```typescript
// Unified team marker configuration
teamMarkerConfig: Team markers with colors and logos

// Features
- Team colors and logos
- Driver profiles with images
- Car models and photos
- Efficient marker rendering
```

### Interactive Panel
Enhanced with rich content:
- Desktop: Slide-in side panel
- Mobile: Draggable bottom sheet with snap points
- Driver profiles grid with photos
- F1 car showcase section

### Marker System
Efficient marker creation and management:
- Team marker configuration system
- Circuit marker management
- Custom designs with hover effects
- Performance-optimized rendering

## 🔧 Performance Optimizations

- **Dynamic imports** for code splitting
- **GPU acceleration** with `translateZ(0)`
- **Optimized map style** (satellite-v9)
- **Ref-based state management** to prevent re-renders
- **Memoization** of components and callbacks
- **Streamlined marker system** - Improved code organization
- **Local image assets** - 5-10x faster than external URLs
- **Efficient file structure** - Clear separation of concerns

## 📝 Development Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

## 📈 Development History

### Recent Updates
```
🏎️ v0.8.0 - Replay System Refinement & Maintenance
├─ eslint-config-next v16 migration and lint error fixes
├─ Next.js 15.3.4 → 15.5.14 security vulnerability update
├─ Full code review and refactoring of replay module
└─ Driver telemetry backend integration and driver selection bug fix

🏎️ v0.7.0 - Race Replay System & Track Info
├─ F1 race replay system (real-time driver tracking)
├─ Track info toggle system (sector, DRS zone visualization)
├─ Flag info panel backend integration
├─ 2026 season calendar added
├─ Replay track rendering stability improvements
└─ Backend API design and OpenF1 integration spec

🏎️ v0.6.0 - Architecture Consolidation & Cleanup
├─ Feature-based architecture fully implemented
├─ Removed unused animation presets and utilities
└─ Improved code organization and maintainability

🏎️ v0.5.0 - Team Details & Project Restructuring
├─ Team detail features with driver profiles and car images
├─ Major project structure reorganization
└─ 🚀 Streamlined marker system implementation

🏎️ v0.4.0 - Major Architecture Refactoring
├─ Map component restructuring and performance optimization
├─ Circuit marker visibility controls
└─ 🎯 Fixed critical marker disappearing bug!

🏎️ v0.3.0 - Performance & Code Quality
├─ TypeScript strict mode improvements
├─ Mobile UX refinements (bottom sheet, blur effects)
└─ Performance optimizations

🗺️ v0.2.0 - Circuit Integration
├─ F1 circuits GeoJSON data integration
└─ Map component modularization

🚀 v0.1.0 - Initial Release
└─ 3D globe with F1 team headquarters
```

### Version Milestones
- **v0.8.0** - Replay refinement, Next.js 15.5.14 update, ESLint v16 migration
- **v0.7.0** - Race replay system, track info toggles, backend API design
- **v0.6.0** - Architecture consolidation, cleanup, feature-based structure
- **v0.5.0** - Team details with drivers/cars, project restructuring, local assets
- **v0.4.0** - Architecture refactoring, performance optimization, marker bug fix
- **v0.3.0** - Enhanced performance, TypeScript improvements, mobile UX refinements
- **v0.2.0** - Full circuit data integration, component modularization
- **v0.1.0** - Basic 3D globe with team headquarters

## 🌳 Branch Strategy

We follow a structured Git flow for development:

### Main Branches
- **`master`** - Production-ready code (protected)
- **`develop`** - Active development branch
- **`replay`** - Replay system development (current)

### Branch Types
- **`feature/*`** - New features (`feature/team-stats`)
- **`fix/*`** - Bug fixes (`fix/marker-drag-issue`)
- **`hotfix/*`** - Urgent production fixes (`hotfix/critical-bug`)

### Workflow
1. All development work happens on `develop` branch
2. Create feature branches from `develop`
3. Submit PR to merge back into `develop`
4. When ready for release, merge `develop` into `master`
5. Hotfixes branch from `master` and merge to both `master` and `develop`

### Development Guide for Team
```bash
# 1. Pull latest develop branch
git checkout develop
git pull origin develop

# 2. Create feature branch
git checkout -b feature/your-feature

# 3. Commit your changes
git commit -m "feat: add new feature"

# 4. Push and create PR to develop
git push origin feature/your-feature
```

### Commit Message Format
- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation updates
- `style:` Code style changes
- `refactor:` Code refactoring
- `test:` Test additions/modifications
- `chore:` Build/config changes

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Formula 1® for the inspiring sport
- [Mapbox](https://www.mapbox.com/) for the amazing mapping platform
- [Next.js](https://nextjs.org/) team for the fantastic framework
- All F1 teams and circuits featured in this project

---

<div align="center">
  <p>Made with ❤️ by F1 enthusiasts</p>
  <p>
    <a href="https://github.com/yourusername/f1-global-tour">GitHub</a> •
    <a href="https://twitter.com/yourusername">Twitter</a> •
    <a href="https://f1-global-tour.vercel.app">Live Demo</a>
  </p>
</div>
