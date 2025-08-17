# F1 Race Replay System

F1 Global Tour의 실시간 레이스 리플레이 기능입니다. 과거 F1 레이스 데이터를 3D 지도 위에서 시각화하여 드라이버들의 움직임을 애니메이션으로 재현합니다.

## 📋 목차

- [기능 개요](#기능-개요)
- [시스템 아키텍처](#시스템-아키텍처)
- [주요 컴포넌트](#주요-컴포넌트)
- [데이터 소스](#데이터-소스)
- [사용법](#사용법)
- [개발 가이드](#개발-가이드)
- [API 참조](#api-참조)

## 🏁 기능 개요

### 핵심 기능
- **📅 세션 선택**: 과거 F1 레이스, 퀄리파잉, 연습 세션 선택
- **🏎️ 드라이버 추적**: 특정 드라이버들의 실시간 위치 추적
- **⏯️ 재생 컨트롤**: 재생/일시정지/속도 조절/특정 시점 이동
- **🗺️ 3D 시각화**: Mapbox를 활용한 실제 서킷에서의 드라이버 애니메이션
- **📊 텔레메트리**: 랩 타임, 섹터 타임, 피트 스톱 등 상세 데이터

### 지원 데이터
- **2024 시즌 데이터**: OpenF1 API를 통한 실제 레이스 데이터
- **FastF1 텔레메트리**: 상세한 차량 텔레메트리 데이터
- **Mock 데이터**: 개발 및 테스트용 샘플 데이터 (모나코 2024)

## 🏗️ 시스템 아키텍처

```
src/features/replay/
├── components/          # UI 컴포넌트
│   ├── ReplayPanel.tsx     # 메인 패널 UI
│   ├── ReplayControls.tsx  # 재생 컨트롤
│   ├── DriverSelector.tsx  # 드라이버 선택
│   └── SessionSelector.tsx # 세션 선택
├── services/           # 비즈니스 로직
│   ├── ReplayDataService.ts      # 데이터 관리
│   └── ReplayAnimationEngine.ts  # 애니메이션 엔진
├── store/             # 상태 관리
│   └── useReplayStore.ts  # Zustand 스토어
├── hooks/             # 커스텀 훅
│   └── useReplayEngine.ts # 리플레이 엔진 훅
├── types/             # TypeScript 타입
│   └── index.ts       # 모든 타입 정의
└── data/              # 데이터
    └── mockData.ts    # 개발용 Mock 데이터
```

## 🔧 주요 컴포넌트

### ReplayPanel
메인 리플레이 인터페이스로, 탭 기반 네비게이션을 제공합니다.

**주요 탭:**
- **Session**: 레이스 세션 선택
- **Drivers**: 추적할 드라이버 선택  
- **Controls**: 재생 컨트롤 및 옵션

### ReplayDataService
데이터 소스와의 통신을 담당하는 서비스 클래스입니다.

**주요 메서드:**
- `getCachedSessions(year, country)`: 세션 목록 조회
- `getDrivers(sessionKey)`: 드라이버 정보 조회
- `getFullRaceData(sessionKey)`: 전체 레이스 데이터 조회
- `getFastF1TelemetryData()`: FastF1 텔레메트리 데이터 조회

### ReplayAnimationEngine
드라이버 위치 계산 및 애니메이션을 처리하는 엔진입니다.

**기능:**
- 랩 데이터를 기반으로 드라이버 위치 계산
- 서킷 트랙 좌표 매핑
- 부드러운 애니메이션 처리
- 재생 속도 제어

### useReplayStore
Zustand를 사용한 전역 상태 관리입니다.

**상태 항목:**
```typescript
interface ReplayState {
  currentSession: ReplaySessionData | null;
  drivers: ReplayDriverData[];
  lapsData: ReplayLapData[];
  isPlaying: boolean;
  isPaused: boolean;
  currentTime: number;
  totalDuration: number;
  playbackSpeed: number;
  currentLap: number;
  selectedDrivers: number[];
  showControls: boolean;
  showDriverInfo: boolean;
}
```

## 📡 데이터 소스

### OpenF1 API
공식 F1 데이터를 제공하는 무료 API입니다.

**지원 데이터:**
- 세션 정보 (레이스, 퀄리파잉, 연습)
- 드라이버 정보 (이름, 팀, 국가)
- 랩 데이터 (랩 타임, 섹터 타임)

**API 엔드포인트:**
- `https://api.openf1.org/v1/sessions`
- `https://api.openf1.org/v1/drivers`
- `https://api.openf1.org/v1/laps`

### FastF1 API
더 상세한 텔레메트리 데이터를 제공합니다.

**지원 데이터:**
- 차량 위치 데이터
- 속도, RPM, 기어 정보
- 타이어 데이터
- 피트 스톱 정보

### Mock 데이터
개발 및 테스트용 샘플 데이터입니다.

**포함 내용:**
- 모나코 2024 레이스 세션
- 8명 드라이버 정보 (VER, PER, LEC, SAI, HAM, RUS, NOR, PIA)
- 각 드라이버별 3랩 데이터

## 🎮 사용법

### 1. 리플레이 패널 열기
지도 우측 상단의 컨트롤 버튼에서 리플레이 버튼을 클릭합니다.

### 2. 세션 선택
**Session 탭**에서 원하는 레이스 세션을 선택합니다:
- 연도별 필터링
- 국가별 필터링
- 세션 타입별 필터링 (레이스/퀄리파잉/연습)

### 3. 드라이버 선택
**Drivers 탭**에서 추적할 드라이버들을 선택합니다:
- 개별 드라이버 선택/해제
- 팀별 일괄 선택
- 드라이버 정보 확인

### 4. 재생 시작
**Controls 탭**에서 리플레이를 제어합니다:
- ▶️ 재생/일시정지
- ⏩ 재생 속도 조절 (0.5x ~ 10x)
- 🔍 특정 시점으로 이동
- 🏁 랩 단위 점프

### 5. 추가 옵션
- **Show driver trajectories**: 드라이버 궤적 표시
- **Follow selected driver**: 선택된 드라이버 자동 추적
- **Show lap information**: 랩 정보 표시

## 👨‍💻 개발 가이드

### 환경 설정
```bash
# 개발 서버 실행
npm run dev

# Mock 데이터 강제 사용 (선택사항)
NEXT_PUBLIC_FORCE_MOCK_DATA=true npm run dev
```

### 새 데이터 소스 추가
1. `ReplayDataService.ts`에 새 메서드 추가
2. `types/index.ts`에 타입 정의 추가
3. `ReplayAnimationEngine.ts`에서 데이터 처리 로직 구현

### 새 UI 컴포넌트 추가
1. `components/` 폴더에 컴포넌트 생성
2. `components/index.ts`에 export 추가
3. `ReplayPanel.tsx`에서 통합

### 상태 관리 확장
1. `useReplayStore.ts`에 새 상태 추가
2. 액션 메서드 구현
3. 컴포넌트에서 상태 사용

## 📚 API 참조

### ReplayDataService

#### `getCachedSessions(year?: number, country?: string)`
지정된 조건의 세션 목록을 조회합니다.

**Parameters:**
- `year` (optional): 연도 필터
- `country` (optional): 국가 필터

**Returns:** `Promise<ApiResponse<ReplaySessionData[]>>`

#### `getDrivers(sessionKey: number)`
특정 세션의 드라이버 정보를 조회합니다.

**Parameters:**
- `sessionKey`: 세션 키

**Returns:** `Promise<ApiResponse<ReplayDriverData[]>>`

#### `getFullRaceData(sessionKey: number)`
전체 레이스 데이터를 조회합니다.

**Parameters:**
- `sessionKey`: 세션 키

**Returns:** `Promise<ApiResponse<ReplayLapData[]>>`

### useReplayStore

#### Actions
- `setCurrentSession(session: ReplaySessionData)`: 현재 세션 설정
- `setDrivers(drivers: ReplayDriverData[])`: 드라이버 목록 설정
- `setLapsData(laps: ReplayLapData[])`: 랩 데이터 설정
- `togglePlayback()`: 재생/일시정지 토글
- `setPlaybackSpeed(speed: number)`: 재생 속도 설정
- `seekTo(time: number)`: 특정 시점으로 이동
- `toggleDriverSelection(driverNumber: number)`: 드라이버 선택 토글

### 타입 정의

#### ReplaySessionData
```typescript
interface ReplaySessionData {
  sessionKey: number;
  sessionName: string;
  sessionType: string;
  circuitShortName: string;
  countryName: string;
  year: number;
  dateStart: string;
  dateEnd: string;
}
```

#### ReplayDriverData
```typescript
interface ReplayDriverData {
  driverNumber: number;
  name: string;
  nameAcronym: string;
  teamName: string;
  teamColor: string;
  broadcastName: string;
  countryCode: string;
}
```

#### ReplayLapData
```typescript
interface ReplayLapData {
  driverNumber: number;
  lapNumber: number;
  lapDuration: number;
  lapStartTime: number;
  sectorTimes: [number | null, number | null, number | null];
  isPitOutLap: boolean;
}
```

## 🐛 알려진 이슈 및 제한사항

### 현재 제한사항
1. **서킷 매핑**: 모든 서킷의 정확한 좌표 매핑이 완료되지 않음
2. **실시간 데이터**: 현재 시즌의 실시간 데이터는 지연될 수 있음
3. **성능**: 대량의 텔레메트리 데이터 처리 시 성능 이슈 가능

### 향후 개선 계획
1. **더 많은 시즌 데이터** 지원
2. **실시간 라이브 타이밍** 기능 추가
3. **고급 분석 기능** (타이어 전략, 연료 소모 등)
4. **VR/AR 지원** 고려

## 📄 라이선스 및 크레딧

- **OpenF1 API**: MIT License
- **FastF1**: GNU GPL v3.0
- **Mapbox GL**: 상용 라이선스 필요

---

**개발자**: F1 Global Tour Team  
**마지막 업데이트**: 2024년 8월  
**버전**: v1.0.0

