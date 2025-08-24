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
│   ├── SessionSelector.tsx # 세션 선택
│   └── ExitReplayButton.tsx # 리플레이 종료 버튼
├── services/           # 비즈니스 로직
│   ├── ReplayDataService.ts        # 데이터 관리 (API 통합)
│   ├── ReplayAnimationEngine.ts    # 애니메이션 엔진
│   ├── CircuitTrackManager.ts      # 서킷 트랙 렌더링
│   ├── DriverMarkerManager.ts      # 드라이버 마커 관리
│   ├── TrackPositionService.ts     # 트랙 위치 계산
│   ├── PositionCalculator.ts       # 위치 보간 계산
│   ├── MockDataProvider.ts         # 개발용 데이터 제공
│   └── DataCacheManager.ts         # 데이터 캐싱
├── store/             # 상태 관리
│   ├── useReplayStore.ts    # 메인 Zustand 스토어
│   └── replaySelectors.ts   # 스토어 셀렉터
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

### 서비스 레이어

#### ReplayDataService
데이터 소스와의 통신을 담당하는 메인 서비스 클래스입니다.

**주요 기능:**
- OpenF1 API 및 FastF1 API 통합
- 자동 fallback 시스템 (API → Mock 데이터)
- 응답 캐싱 및 최적화
- 에러 핸들링 및 재시도 로직

**주요 메서드:**
- `getSessions(year, countryName)`: 세션 목록 조회 (다중 API 지원)
- `getDrivers(sessionKey)`: 드라이버 정보 조회
- `getLaps(sessionKey, driverNumber, lapNumber)`: 랩 데이터 조회
- `getFullRaceData(sessionKey)`: 전체 레이스 데이터 조회
- `getFastF1TelemetryData(year, round, driver)`: FastF1 텔레메트리 조회

#### CircuitTrackManager
서킷 트랙 렌더링 및 관리를 담당하는 서비스입니다.

**주요 기능:**
- 서킷별 트랙 좌표 로딩 및 렌더링
- 트랙 시각화 스타일 관리
- 카메라 자동 이동 (flyToCircuit)
- 트랙 가시성 제어

#### DriverMarkerManager  
드라이버 마커의 생성, 업데이트, 제거를 관리합니다.

**주요 기능:**
- 드라이버별 마커 생성 및 스타일링
- 실시간 위치 업데이트
- 팀 컬러 기반 마커 디자인
- 마커 애니메이션 및 최적화

#### TrackPositionService
트랙 좌표와 드라이버 위치 간의 매핑을 처리합니다.

**주요 기능:**
- 랩 진행률 기반 위치 계산
- 트랙 좌표 보간 (interpolation)
- 서킷별 좌표 시스템 지원

#### PositionCalculator
드라이버 위치의 부드러운 애니메이션을 위한 계산을 담당합니다.

**주요 기능:**
- 위치 보간 알고리즘 (선형, 베지어 곡선)
- 애니메이션 프레임 최적화
- 속도 기반 위치 예측

### ReplayAnimationEngine
전체 애니메이션 시스템을 조율하는 메인 엔진입니다.

**핵심 기능:**
- 애니메이션 루프 관리 (RequestAnimationFrame)
- 재생 상태 제어 (재생/일시정지/속도 조절)
- 드라이버 마커 및 트랙 동기화
- 메모리 관리 및 성능 최적화

**주요 메서드:**
- `startReplay()`: 리플레이 시작
- `pauseReplay()`: 일시정지
- `setPlaybackSpeed(speed)`: 재생 속도 조절
- `seekTo(time)`: 특정 시점으로 이동

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

## 📈 현재 개발 현황 (2025년 8월 기준)

### ✅ 완료된 기능
1. **핵심 아키텍처**
   - 모듈식 서비스 레이어 구조 완성
   - TypeScript 타입 시스템 구축
   - Zustand 기반 상태 관리 구현

2. **데이터 처리**
   - OpenF1 API 통합 완료
   - FastF1 API 기본 지원
   - Mock 데이터 시스템 구축
   - 자동 fallback 메커니즘 구현

3. **UI 컴포넌트**
   - ReplayPanel 탭 기반 인터페이스
   - SessionSelector, DriverSelector 구현
   - ReplayControls 기본 컨트롤러
   - ExitReplayButton 종료 기능

4. **렌더링 시스템**
   - CircuitTrackManager 트랙 렌더링
   - DriverMarkerManager 드라이버 마커
   - 서킷별 카메라 자동 이동
   - 트랙 가시성 제어

### 🚧 진행 중인 작업
1. **애니메이션 엔진**
   - ReplayAnimationEngine 기본 구조 완성
   - 위치 계산 알고리즘 개발 중
   - 부드러운 애니메이션 최적화

2. **성능 최적화**
   - 메모리 관리 개선
   - 애니메이션 프레임 최적화
   - 데이터 캐싱 시스템 강화

3. **사용자 경험**
   - 리플레이 컨트롤 UX 개선
   - 로딩 상태 관리
   - 에러 핸들링 개선

### 📋 다음 단계 계획
1. **애니메이션 완성** (우선순위: 높음)
   - 드라이버 위치 실시간 업데이트
   - 재생 속도 제어 구현
   - 시점 이동 (seek) 기능

2. **데이터 확장** (우선순위: 중간)
   - 더 많은 시즌 데이터 지원
   - 텔레메트리 데이터 시각화
   - 섹터 타임 표시

3. **고급 기능** (우선순위: 낮음)
   - 드라이버 궤적 표시
   - 피트 스톱 애니메이션
   - 랩 타임 비교 차트

### 🔧 최근 기술적 개선사항
- **2025.08.24**: 
  - TypeScript 타입 에러 수정 (replayDataService 중복 선언)
  - 로컬 예외 처리 최적화 (MockDataProvider, ReplayDataService)
  - CircuitTrackManager의 불필요한 파라미터 제거
  - 서비스 레이어 의존성 정리

### 🐛 알려진 이슈 및 제한사항

#### 현재 제한사항
1. **애니메이션**: 드라이버 위치 애니메이션이 아직 완전히 구현되지 않음
2. **서킷 매핑**: 일부 서킷의 정확한 좌표 매핑 필요
3. **성능**: 대량 데이터 처리 시 최적화 여지 존재
4. **실시간 데이터**: API 응답 지연 시 사용자 경험 개선 필요

#### 기술 부채
1. **코드 정리**: 일부 서비스 클래스의 책임 분리 필요
2. **테스트**: 단위 테스트 및 통합 테스트 추가 필요
3. **문서화**: 내부 API 문서화 보완 필요

### 🎯 향후 개발 로드맵
#### Phase 1: 기본 리플레이 완성 (2025.09)
- 드라이버 애니메이션 완전 구현
- 재생 컨트롤 모든 기능 완성
- 성능 최적화 1차 완료

#### Phase 2: 데이터 확장 (2025.10)
- 더 많은 시즌 및 세션 지원
- 텔레메트리 데이터 시각화
- 고급 분석 기능 추가

#### Phase 3: 사용자 경험 향상 (2025.11)
- 실시간 라이브 타이밍
- VR/AR 지원 검토
- 모바일 최적화

## 📄 라이선스 및 크레딧

- **OpenF1 API**: MIT License
- **FastF1**: GNU GPL v3.0
- **Mapbox GL**: 상용 라이선스 필요

---

**개발자**: F1 Global Tour Team  
**마지막 업데이트**: 2025년 8월 24일  
**버전**: v1.2.0 (Replay System)

