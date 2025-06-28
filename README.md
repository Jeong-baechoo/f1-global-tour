# 🏎️ F1 Global Tour

<div align="center">
  <img src="https://img.shields.io/badge/Next.js-15.3.4-black?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js" />
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

### 📱 Responsive Design
- **Mobile-optimized** interactive bottom sheet
- **Desktop-friendly** side panels
- **Touch gestures** support on mobile devices
- **Adaptive UI** based on screen size

### 🎬 Cinematic Mode
- **Automated circuit tours** with smooth camera movements
- **Dynamic track drawing** animations
- **Immersive viewing experience**

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
├── app/                    # Next.js app directory
├── components/            
│   ├── mapbox/            # Map-related components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── markers/       # Marker components
│   │   │   ├── team/      # Team marker factory & config
│   │   │   ├── circuit/   # Circuit markers & manager
│   │   │   └── symbolLayer/ # Symbol layer markers
│   │   └── utils/         # Map utilities
│   │       ├── animations/ # Animation functions
│   │       ├── map/       # Map helpers
│   │       └── data/      # Data loaders
│   ├── ui/                # Reusable UI components
│   └── InteractivePanel.tsx
├── data/                  # F1 teams & circuits data
│   ├── teams.json
│   ├── circuits.json
│   └── tracks/           # Circuit track coordinates
├── lib/                   # Utility functions
│   ├── mapbox/           # Map-specific utilities
│   ├── styles/           # Style utilities
│   └── utils/            # General utilities
└── public/               # Static assets
    ├── team-logos/       # Team logo images
    ├── drivers/          # Driver profile photos
    └── cars/            # F1 car images
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
- **Cinematic Tours** - Automated circuit exploration

## 🛠️ Technology Stack

- **[Next.js 15](https://nextjs.org/)** - React framework with App Router
- **[TypeScript](https://www.typescriptlang.org/)** - Type safety
- **[Mapbox GL JS](https://www.mapbox.com/mapbox-gljs)** - 3D map rendering
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first styling
- **[Lucide Icons](https://lucide.dev/)** - Beautiful icons

## 🎨 Key Components

### Map Component (v0.4.0+)
Enhanced with modern React patterns:
```typescript
// Using forwardRef and useImperativeHandle
const mapRef = useRef<MapAPI>(null);
<Map ref={mapRef} />

// Clean separation of concerns
- useMapInitialization: Map setup and lifecycle
- useCinematicMode: Tour mode management
- Efficient ref-based state management
```

### Team Marker Factory (v0.5.0+)
Unified team marker system:
```typescript
// Single factory for all teams
TeamMarkerFactory.createMultiple(map, teams, onMarkerClick)

// Centralized configuration
- Team colors and logos
- Driver profiles with images
- Car models and photos
```

### Interactive Panel
Enhanced with rich content:
- Desktop: Slide-in side panel
- Mobile: Draggable bottom sheet with snap points
- Driver profiles grid with photos
- F1 car showcase section

### Marker System
Efficient marker creation with factory pattern:
- Unified TeamMarkerFactory for all teams
- CircuitMarkerManager for circuit markers
- Custom designs with hover effects
- Performance-optimized rendering

## 🔧 Performance Optimizations

- **Dynamic imports** for code splitting
- **GPU acceleration** with `translateZ(0)`
- **Optimized map style** (satellite-v9)
- **Ref-based state management** to prevent re-renders
- **Memoization** of components and callbacks
- **Unified marker factory** - 85% code reduction (1,320→200 lines)
- **Local image assets** - 5-10x faster than external URLs
- **Efficient file structure** - Clear separation of concerns

## 📝 Development Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript compiler
```

## 📈 Development History

### Recent Updates
```
🏎️ v0.5.0 - Team Details & Project Restructuring
├─ Team detail features with driver profiles and car images
├─ Major project structure reorganization
├─ Performance optimizations with local assets
└─ 🚀 85% code reduction with factory pattern!

🏎️ v0.4.1 - Circuit Marker Visibility
├─ f54d566 fix: TypeScript any 타입 에러 수정
├─ e8a9fa0 fix: Symbol Layer 타입 에러 수정
├─ e2c3542 fix: 서킷 마커 드래그 후 점프 문제 해결
└─ 83398de fix: 서킷 마커 줌 레벨별 가시성 제어 개선

🏎️ v0.4.0 - Major Architecture Refactoring
├─ c8569b5 refactor: Map 컴포넌트 구조 개선 및 성능 최적화
├─ d018da2 chore: v0.4.0 버전 업데이트
└─ 🎯 Fixed critical marker disappearing bug!

🏎️ v0.3.0 - Performance & Code Quality
├─ ec04f5b fix: 명시적 타입으로 변경 및 불필요한 변수 제거
├─ b282cf0 fix: 시네마틱 모드 작동 문제 해결
├─ 308ae77 fix: 모바일 바텀시트 헤더 배경 투명 처리
├─ a2f322f style: 버튼 배경색 블러 효과 통일
└─ 74ccbd5 fix: any 타입을 명시적 타입으로 변경

🎬 v0.2.5 - Cinematic Mode & UI Enhancements
├─ 02c3987 feat: 시네마틱 투어 모드 구현
├─ 344dace feat: next race 마커 이미지 추가 및 ui 개선
├─ baae682 feat: 모바일 인터랙티브 바텀 시트 구현
└─ 86b1cf0 feat: 모바일 지원 추가

🗺️ v0.2.0 - Circuit Integration
├─ 94b0f47 feat: f1-circuits geojson 데이터 통합
├─ 4b7c1bd refactor: map 컴포넌트 구조 개선 및 모듈화
└─ c4240be feat: f1 2024 시즌 데이터 및 서킷 마커 추가

🚀 v0.1.0 - Initial Release
├─ f36582d feat: f1 월드 투어 지도 ui 구현
├─ c2b7ec1 chore: 프로젝트 설정 및 의존성 업데이트
└─ 286d107 Initial commit from Create Next App
```

### Version Milestones
- **v0.5.0** - Team details with drivers/cars, project restructuring, local assets
- **v0.4.1** - Circuit marker visibility controls, bug fixes
- **v0.4.0** - Architecture refactoring, performance optimization, marker bug fix
- **v0.3.0** - Enhanced performance, TypeScript improvements, mobile UX refinements
- **v0.2.5** - Cinematic mode, responsive bottom sheet, mobile optimization
- **v0.2.0** - Full circuit data integration, component modularization
- **v0.1.0** - Basic 3D globe with team headquarters

## 🌳 Branch Strategy

We follow a structured Git flow for development:

### Main Branches
- **`master`** - Production-ready code (protected)
- **`develop`** - Active development branch (default)

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
# 1. 최신 develop 브랜치 가져오기
git checkout develop
git pull origin develop

# 2. 기능 브랜치 생성
git checkout -b feature/your-feature

# 3. 작업 후 커밋 (아래 형식 참고)
git commit -m "feat: 새로운 기능 추가"

# 4. develop에 PR 생성
git push origin feature/your-feature
```

### Commit Message Format
- `feat:` 새로운 기능
- `fix:` 버그 수정
- `docs:` 문서 수정
- `style:` 코드 스타일 변경
- `refactor:` 코드 리팩토링
- `test:` 테스트 추가/수정
- `chore:` 빌드, 설정 변경

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
