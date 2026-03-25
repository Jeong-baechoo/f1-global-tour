# F1 Race Replay System

F1 Global Tour의 실시간 레이스 리플레이 기능입니다. 백엔드 API(NestJS)를 통해 OpenF1 데이터를 가져와 3D 지도 위에서 드라이버들의 움직임을 애니메이션으로 재현합니다.

## 📋 목차

- [기능 개요](#기능-개요)
- [시스템 아키텍처](#시스템-아키텍처)
- [주요 컴포넌트](#주요-컴포넌트)
- [데이터 흐름](#데이터-흐름)
- [사용법](#사용법)
- [개발 가이드](#개발-가이드)
- [API 참조](#api-참조)
- [엣지 케이스 처리](#엣지-케이스-처리)

## 🏁 기능 개요

### 핵심 기능
- **세션 선택**: 연도/국가별 F1 레이스, 퀄리파잉, 연습 세션 선택
- **드라이버 추적**: Mapbox GL 위 실시간 드라이버 마커 위치 추적
- **재생 컨트롤**: 재생/일시정지/정지/속도 조절(0.5x~4x)/시점 이동/랩 점프
- **드라이버 선택**: 개별 드라이버 표시/숨김 토글 (전체 선택/해제)
- **드라이버 타이밍 패널**: 백엔드 사전 계산 프레임 기반 순위/인터벌/랩타임/섹터/타이어 표시
- **드라이버 텔레메트리 패널**: 선택 드라이버의 속도/기어/스로틀/브레이크/DRS 실시간 표시
- **플래그 인포 패널**: 백엔드 `race-flags` API 기반 실시간 플래그 상태 표시 (RED/SC/VSC/GREEN)
- **에러 알림**: 데이터 로드/세션/텔레메트리 등 에러 발생 시 토스트 알림 자동 표시
- **DNF 처리**: 리타이어 드라이버 마커 자동 숨김 및 패널 DNF 표시
- **레드플래그 대응**: 비정상 랩타임 필터링 및 타임라인 gap 압축

### 데이터 소스
- **백엔드 API** (`localhost:4000/api/v1`): NestJS 서버가 OpenF1 API를 프록시하며 사전 계산된 `DriverDisplayFrame[]` 제공
- **Mock 데이터**: `checkShouldForceMockData()` 플래그로 활성화 가능 (기본 비활성)

## 🏗️ 시스템 아키텍처

```
src/features/replay/
├── index.ts                 # 배럴 export (컴포넌트/스토어/서비스/훅/타입)
├── components/              # UI 컴포넌트
│   ├── index.ts               # 컴포넌트 배럴 export
│   ├── ReplayPanel.tsx         # 메인 패널 UI (탭 네비게이션)
│   ├── ReplayControls.tsx      # 재생 컨트롤 (재생/정지/속도/랩 점프/타임라인)
│   ├── ReplayProgressBar.tsx   # 재생 진행바 (시간/랩 표시)
│   ├── SessionSelector.tsx     # 세션 선택 (연도/국가 필터)
│   ├── DriverSelector.tsx      # 드라이버 표시/숨김 토글 (전체 선택/해제)
│   ├── ExitReplayButton.tsx    # 리플레이 종료
│   └── ui/
│       ├── index.ts              # UI 컴포넌트 배럴 export
│       ├── styles.ts             # 공유 스타일 상수 (glassPanelStyle)
│       ├── DriverInfoPanel/      # 드라이버 정보 패널
│       ├── DriverTelemetryPanel/ # 드라이버 텔레메트리 (속도/기어/스로틀/브레이크/DRS)
│       ├── FlagInfoPanel/        # 레이스 플래그 상태 패널 (RED/SC/VSC/GREEN)
│       ├── ErrorNotification/    # 에러/경고/안내 토스트 알림
│       └── TrackInfoTogglePanel/ # 섹터/DRS존 토글
├── services/                # 비즈니스 로직
│   ├── index.ts                    # 서비스 배럴 export
│   ├── ReplayDataService.ts          # 백엔드 API 통신 + 랩 데이터 전처리
│   ├── ReplayAnimationEngine.ts      # 메인 애니메이션 엔진 (RAF 루프)
│   ├── BackendReplayApiService.ts    # 사전 계산 프레임 로드 (이진탐색)
│   ├── DriverTimingService.ts        # 타이밍 패널 데이터 조율
│   ├── CircuitTrackManager.ts        # 서킷 트랙 렌더링
│   ├── DriverMarkerManager.ts        # 드라이버 마커 관리
│   ├── TrackPositionService.ts       # 트랙 좌표 보간
│   ├── PositionCalculator.ts         # 드라이버 위치/순위 계산
│   ├── ReplayErrorHandler.ts         # 중앙 에러 처리 + 사용자 알림 시스템
│   └── OpenF1MockDataService.ts      # Mock 데이터 서비스 (개발용)
├── store/                   # 상태 관리
│   └── useReplayStore.ts      # Zustand 스토어 (상태 + 액션 + 원자 셀렉터)
├── hooks/                   # 커스텀 훅
│   ├── index.ts               # 훅 배럴 export
│   └── useReplayEngine.ts     # 엔진-스토어 연결 훅
├── types/                   # TypeScript 타입
│   ├── index.ts               # 주요 타입 정의 (FlagStatus, LapFlagStatus, SessionType 등)
│   └── openF1Types.ts         # OpenF1 API 타입 (SectorPerformance, RealtimeDriverData 등)
├── data/                    # 데이터
│   └── mockData.ts            # Mock 데이터 (모나코/스파)
└── utils/
    ├── format.ts              # 공유 포맷 유틸 (formatReplayTime, PLAYBACK_SPEED_OPTIONS)
    └── ReplayServiceSwitcher.ts # 서비스 전환 유틸 (개발자 디버깅 도구)
```

## 🔧 주요 컴포넌트

### 데이터 레이어

#### ReplayDataService
백엔드 API와 통신하고 랩 데이터를 전처리하는 핵심 서비스입니다.

**주요 역할:**
- 백엔드 API에서 세션/드라이버/랩 데이터 fetch
- 랩 데이터 변환: 백엔드 형식 → 프런트 `ReplayLapData` 형식
- **레드플래그 랩 필터링**: `lapDuration > 300초` 인 비정상 랩 자동 제거
- **타임라인 전처리** (`sortAndProcessLaps`):
  - 타임스탬프 기준 정렬 (레드플래그로 랩 번호/시간순 불일치 대응)
  - 클러스터 기반 `raceStartTime` 결정 (레드플래그 전 랩의 이른 timestamp 무시)
  - 드라이버별 누적 시간 + 실제 오프셋으로 gap 없는 연속 타임라인 생성
  - 드라이버 간 상대적 시간차 보존

#### BackendReplayApiService
백엔드의 `GET /sessions/:key/driver-timings` 및 `GET /sessions/:key/race-flags` 엔드포인트에서 데이터를 로드합니다.

**핵심 동작:**
- 세션 변경 시 전체 프레임 + 플래그 데이터 일괄 로드
- `getFrameAtTime(timeOffset)`: 이진탐색으로 현재 시점 프레임 반환
- `getRaceFlags()`: 세션의 플래그 데이터 반환 (`RaceFlagsResponse`)
- 프레임에는 position, interval, lapTime, sector, tireInfo 등 타이밍 패널에 필요한 모든 정보 포함

#### DriverTimingService
타이밍 패널 및 플래그 데이터를 조율하는 싱글턴 서비스입니다.

**핵심 동작:**
- `getTimingsForDisplay(currentTime)`: 백엔드 프레임을 `DriverTiming[]`으로 변환
- `getCurrentLapFromFrame(currentTime)`: 프레임의 currentLap 반환 (스토어 동기화용)
- `getRaceStatus(currentTime)`: 백엔드 플래그 데이터 + 현재 프레임의 currentLap으로 `RaceStatus` 객체 생성 → `FlagInfoPanel`에 전달

#### ReplayErrorHandler
리플레이 전체의 에러를 중앙 집중 처리하는 서비스입니다.

**핵심 동작:**
- 에러 타입별 정적 메서드: `DataFetchError`, `SessionLoadError`, `DriverDataError`, `TelemetryError`, `AnimationError` 등
- 에러 히스토리 추적 (최대 50건)
- 사용자 친화적 메시지 변환
- 알림 콜백 구독 시스템 → `ErrorNotification` 컴포넌트와 연동
- 네트워크/타임아웃 에러 자동 감지
- 복구 가능 에러 판별

### 애니메이션 레이어

#### ReplayAnimationEngine
전체 리플레이 애니메이션을 조율하는 메인 엔진입니다.

**핵심 동작:**
- `loadReplayData(session)`: 데이터 로드 → 트랙/마커 초기화
- `play()/pause()/stop()`: 재생 제어
- `animate()`: `requestAnimationFrame` 기반 60fps 루프
  - 50ms 간격으로 위치 업데이트 (throttle)
  - `onTimeUpdate` 콜백으로 스토어에 시간 전달
  - `onDriverPositionsUpdate` 콜백으로 드라이버 위치 전달
- **DNF 마커 처리**: 매 프레임 활성/비활성 드라이버를 구분하여 마커 표시/숨김
- `getLapsData()` / `getTotalDuration()`: 로드된 데이터 조회 (스토어 동기화용)

#### PositionCalculator
현재 시간 기준 드라이버의 트랙 위치를 계산합니다.

**핵심 동작:**
- `setData(driversData, lapsData, circuitId)`: 계산에 필요한 데이터 설정
- `calculateAllDriverPositions(currentTime)`: 전체 드라이버 위치 계산
- 랩 데이터의 `lapStartTime`과 `lapDuration`으로 현재 랩/진행률 결정
- `trackPositionService.getPositionAtProgress(circuitId, progress)` → 실제 좌표
- **DNF 감지**: 마지막 랩 종료 이후 `currentTime` → `null` 반환 (마커 숨김)
- `calculateRacePosition()`: 전체 드라이버 누적 진행률로 순위 계산

### 훅 / 스토어 레이어

#### useReplayEngine
엔진과 Zustand 스토어를 연결하는 React 훅입니다.

**핵심 동작:**
- 맵 인스턴스에서 `ReplayAnimationEngine` 생성/관리
- 콜백 설정: `setOnTimeUpdate(setCurrentTime)`, `setOnDriverPositionsUpdate(updateDriverPositions)`
- `loadSession` 성공 시: **콜백 재등록** + `lapsData`/`totalDuration` 스토어 동기화
- `isPlaying`/`playbackSpeed` 상태 변경 → 엔진 동기화

#### useReplayStore
Zustand 기반 전역 상태 관리입니다.

**주요 상태:**
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
}
```

**주요 액션:**
- `setCurrentTime(time)`: 시간 업데이트 + 현재 랩 자동 계산 (캐시된 랩 시작시간 기반, 60fps에서도 효율적)
  - `totalDuration`이 0일 때 (로드 전) clamp하지 않음
- `setCurrentSession(session)`: 세션 전환 시 스토어를 `initialState`로 리셋
- `setLapsData(laps)`: 랩 데이터 설정 + `totalDuration` 자동 계산
- `cleanup()`: 엔진 정리 이벤트(`replayEngineCleanup`) 발송 + 스토어 완전 초기화

**성능 최적화:**
- `setCurrentTime`에서 현재 랩 계산을 위해 `buildLapStartTimes()`로 랩 시작시간을 사전 캐시 (lapsData 변경 시에만 재계산)
- primitive 값만 반환하는 원자 셀렉터 제공 (`useReplayIsPlaying`, `useReplayCurrentTime` 등)으로 불필요한 리렌더 방지

## 📡 데이터 흐름

### 리플레이 시작 흐름
```
SessionSelector
  → setCurrentSession(session)        [store reset]
  → useEffect([currentSession])
    → loadSession(session)
      → engine.loadReplayData(session)
        → cleanupPreviousData()        [이전 데이터 정리]
        → replayDataService.getFullRaceData(sessionKey)
          → getDrivers() + getLaps()   [백엔드 API 호출]
          → transformBackendLaps()     [null/레드플래그 랩 필터]
          → sortAndProcessLaps()       [타임라인 전처리]
        → positionCalculator.setData() [위치 계산기 초기화]
        → createDriverMarkers()        [마커 생성]
        → drawCircuitTrack()           [트랙 렌더링]
      → 콜백 재등록 (onTimeUpdate, onDriverPositionsUpdate)
      → setLapsData(laps)             [스토어 동기화]
      → setTotalDuration(duration)    [스토어 동기화]
```

### 재생 중 데이터 흐름
```
animate() [매 프레임, RAF]
  ├→ currentTime 계산 (performance.now 기반)
  ├→ positionCalculator.calculateAllDriverPositions(currentTime)
  │   ├→ 각 드라이버: 현재 랩 찾기 → progress 계산 → 트랙 좌표 변환
  │   └→ 마지막 랩 이후 → null (DNF)
  ├→ markerManager.updateMarkerPosition()   [활성 드라이버]
  ├→ markerManager.hideDriverMarker()       [DNF 드라이버]
  ├→ onTimeUpdate(currentTime) → store.setCurrentTime()
  │   → currentLap 자동 계산 (lapsData 기반)
  │   → ReplayProgressBar 업데이트
  └→ onDriverPositionsUpdate(positions) → store.updateDriverPositions()

DriverTelemetryPanel [별도 렌더 사이클]
  → driverTimingService.getTimingsForDisplay(currentTime)
    → backendReplayApiService.getFrameAtTime(currentTime)
      → 이진탐색으로 프레임 조회 (2초 윈도우)
    → DriverDisplayRow[] → DriverTiming[] 변환

FlagInfoPanel [별도 렌더 사이클]
  → driverTimingService.getRaceStatus(currentTime)
    → backendReplayApiService.getRaceFlags()    [세션 플래그 데이터]
    → backendReplayApiService.getFrameAtTime()  [현재 랩 결정]
    → RaceStatus 객체 생성 (currentFlag, lapFlags[], minuteFlags[])
```

### 세션 전환 흐름
```
Exit Replay
  → store.cleanup()
    → replayEngineCleanup 이벤트 발송
    → engine.cleanup()              [콜백 undefined로 설정!]

새 세션 선택
  → setCurrentSession(newSession)   [store initialState로 reset]
  → loadSession(newSession)
    → engine.loadReplayData()       [데이터 로드]
    → 콜백 재등록 ★                  [cleanup에서 제거된 콜백 복구]
    → lapsData/totalDuration 동기화
```

## 🎮 사용법

### 1. 리플레이 시작
지도 UI에서 리플레이 모드 진입 → Session 탭에서 연도/국가 선택 → 세션 클릭

### 2. 재생 컨트롤
- **재생/일시정지**: 하단 프로그레스바의 Play/Pause 버튼
- **재생 속도**: 0.5x, 1x, 1.5x, 2x, 4x 선택
- **시점 이동**: 프로그레스바 드래그 또는 랩 점프 버튼

### 3. 타이밍 정보
- 우측 패널: 순위, 인터벌, 랩타임, 섹터 퍼포먼스, 타이어 정보
- 좌측 패널: 선택된 드라이버의 텔레메트리 (속도, 기어, 스로틀, 브레이크, DRS)

### 4. 리플레이 종료
좌상단 "Exit Replay" 버튼 → 엔진 정리 + 스토어 초기화 + 메인 지도 복귀

## 🔧 엣지 케이스 처리

### 레드플래그 (예: 2024 일본 GP)
OpenF1 데이터에서 레드플래그 발생 시 비정상적인 랩 데이터가 포함됩니다.

**문제**: 레드플래그 중단 시간이 랩 duration에 포함 (~1711초), 랩 번호와 timestamp 순서 불일치

**처리 방식:**
1. `transformBackendLaps`: `lapDuration > 300초` 인 랩 자동 필터링
2. `sortAndProcessLaps`:
   - 타임스탬프 기준 정렬 (랩 번호 아닌 실제 시간순)
   - `findMostCommonTimestamp`로 대다수 드라이버가 공유하는 레이스 시작 시점 결정
   - 레드플래그 전 랩 (raceStartTime - 60초 이전) 자동 제외
   - 드라이버별 누적 시간으로 gap 없는 타임라인 생성

**특수 케이스**: 일부 드라이버(예: TSU)의 레드플래그 랩이 300초 미만일 수 있음 → timestamp 기반 필터로 처리

### DNF (Did Not Finish)
**마커 처리**: `PositionCalculator`에서 마지막 유효 랩 종료 이후 `null` 반환 → `ReplayAnimationEngine`이 해당 마커를 `hideDriverMarker()`로 숨김

**타이밍 패널 처리**: 백엔드에서 DNF 감지 후 `currentLapTime = 'DNF'`, `interval = 'DNF'`로 표시, 순위 맨 뒤로 정렬

**DNF 감지 로직 (백엔드)**:
- Case 1: `lap_duration === null && !is_pit_out_lap && lapNum > 1` (명시적 DNF)
- Case 2: 해당 랩 데이터 자체가 없고 `driverMaxLap < lapNum` (완전 리타이어)
- 레드플래그 방어: `hasLaterValidLaps` 체크로 일시적 null과 진짜 DNF 구분

### 데이터 누락
일부 드라이버의 특정 랩 데이터가 `null`일 수 있습니다 (예: TSU의 lap 3).

**현재 동작**: 해당 구간에서 마커가 마지막 유효 랩 끝 지점에 머무름. 이는 OpenF1 원본 데이터의 한계로, 해당 구간의 정확한 위치 계산이 불가능합니다.

### 백엔드 timeOffset 이슈
일부 세션에서 `date_start`가 `null`인 랩이 존재하면 `raceStartMs`가 0이 되어 `timeOffset`이 Unix timestamp 그 자체가 됩니다.

**수정**: 백엔드에서 `lap1Rows`의 `date_start`가 `null`이거나 비정상인 값을 필터링 후 `raceStartMs` 계산

## 📚 API 참조

### 백엔드 API 엔드포인트

```
GET  /api/v1/sessions                                          # 세션 목록 (?country, ?year)
GET  /api/v1/sessions/:sessionKey/drivers                      # 세션 드라이버
GET  /api/v1/sessions/:sessionKey/driver-timings               # 사전 계산 프레임 (타이밍 패널용)
GET  /api/v1/sessions/:sessionKey/race-flags                   # 랩/분별 플래그 상태 (플래그 인포 패널용)
GET  /api/v1/sessions/:sessionKey/telemetry/:driverNumber      # 드라이버 텔레메트리 (속도/기어/스로틀/브레이크/DRS)
POST /api/v1/sessions/:sessionKey/start-replay                 # 데이터 프리로드
GET  /api/v1/laps/session/:sessionKey                          # 랩 데이터 (?lapNumber)
```

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
  lapDuration: number;      // 초 단위
  lapStartTime: number;     // 레이스 시작 기준 상대 초
  sectorTimes: [number | null, number | null, number | null];
  isPitOutLap: boolean;
}
```

#### DriverDisplayFrame (백엔드)
```typescript
interface DriverDisplayFrame {
  timeOffset: number;       // 레이스 시작 기준 경과 초
  currentLap: number;
  drivers: DriverDisplayRow[];
}

interface DriverDisplayRow {
  position: number;
  driverCode: string;
  teamColor: string;
  interval: string;
  intervalToAhead: string;
  currentLapTime: string;
  bestLapTime: string;
  miniSector: { sector1, sector2, sector3 };  // 'fastest' | 'personal_best' | 'normal' | 'none'
  tireInfo: { compound, lapCount, pitStops };
}
```

#### RaceFlagsResponse (백엔드)
```typescript
interface RaceFlagsResponse {
  sessionType: 'RACE' | 'QUALIFYING' | 'PRACTICE';
  totalLaps: number;
  lapFlags: ('NONE' | 'RED' | 'SC' | 'VSC' | 'YELLOW')[];     // 랩별 플래그 상태
  totalMinutes: number;
  minuteFlags: ('NONE' | 'RED' | 'SC' | 'VSC' | 'YELLOW')[];  // 분별 플래그 상태 (퀄리/연습)
}
```

#### RaceStatus (프론트엔드)
```typescript
interface RaceStatus {
  sessionType: 'RACE' | 'QUALIFYING' | 'PRACTICE';
  currentFlag: 'GREEN' | 'RED' | 'SC' | 'VSC' | 'YELLOW';
  currentLap: number;
  totalLaps: number;
  lapFlags: ('NONE' | 'RED' | 'SC' | 'VSC' | 'YELLOW')[];
  currentMinute: number;
  totalMinutes: number;
  minuteFlags: ('NONE' | 'RED' | 'SC' | 'VSC' | 'YELLOW')[];
}
```

## 📈 현재 개발 현황

### 완료된 기능
1. **백엔드 연동**: NestJS 백엔드를 통한 OpenF1 데이터 프록시 및 사전 계산
2. **애니메이션 엔진**: RAF 기반 60fps 드라이버 위치 애니메이션
3. **타이밍 패널**: 백엔드 프레임 기반 실시간 순위/인터벌/랩타임/섹터/타이어
4. **드라이버 텔레메트리 패널**: 속도/기어/스로틀/브레이크/DRS 실시간 표시 (DRS 글로우 효과 포함)
5. **플래그 인포 패널**: 백엔드 `race-flags` API 기반 랩별 플래그 상태 표시 (RED/SC/VSC/GREEN)
6. **로딩 상태**: 텔레메트리/플래그 패널이 백엔드 데이터 수신 전 로딩 스피너 표시
7. **레드플래그 대응**: 비정상 랩 필터링 + 타임라인 gap 압축
8. **DNF 처리**: 마커 자동 숨김 + 패널 DNF 표시 + 순위 맨 뒤 정렬
9. **세션 전환**: 콜백 재등록 + 스토어 동기화로 안정적 세션 전환
10. **드라이버 선택**: 개별 드라이버 표시/숨김 토글 (전체 선택/해제)
11. **에러 처리 시스템**: 중앙 에러 핸들러 + 토스트 알림 UI
12. **공유 UI 패턴**: glassPanelStyle 상수로 4개 패널 글래스모피즘 스타일 통일

### 알려진 제한사항
1. **데이터 누락**: 일부 드라이버의 특정 랩 `lap_duration`이 null인 경우 해당 구간 위치 추정 불가
2. **Lap 1 인플레이션**: 레이스 첫 랩에 formation lap 시간이 포함되어 초기 드라이버 간 gap이 실제보다 약간 큼
3. **서킷 매핑**: `circuitShortName` → `circuitId` 매핑이 하드코딩 (새 서킷 추가 시 수동 등록 필요)

---

**마지막 업데이트**: 2026년 3월 25일
