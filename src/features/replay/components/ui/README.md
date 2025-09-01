# Replay Mode UI Components

이 디렉토리는 F1 Global Tour 애플리케이션의 **리플레이 모드 전용 UI 컴포넌트**들을 포함합니다.

## 🎯 리플레이 모드 UI 로직

### 기본 원칙
리플레이 모드 UI 컴포넌트들은 **일반 모드 UI와 정반대의 동작**을 합니다:

```javascript
// 일반 모드 UI (기존)
{!isReplayMode && <NormalModeComponent />}

// 리플레이 모드 UI (새로운)
{isReplayMode && <ReplayModeComponent />}
```

### 상태 전환 흐름

#### 1. Start Replay 버튼 클릭
```
일반 모드 → 리플레이 모드
├── 숨겨지는 UI:
│   ├── 서킷 타임라인 패널 (하단 스크롤바)
│   ├── 트랙상세정보패널 (InteractivePanel) 
│   ├── 모바일 타임라인
│   └── 트랙상세토글 박스 (CircuitInfoPanel)
│
└── 나타나는 UI:
    ├── 리플레이 전용 HUD
    ├── 드라이버 추적 UI
    ├── 랩타임 비교 패널
    ├── 리플레이 진행 상황 표시
    └── 리플레이 설정 오버레이
```

#### 2. Exit Replay 버튼 클릭
```
리플레이 모드 → 일반 모드
├── 사라지는 UI:
│   └── 모든 리플레이 모드 전용 UI
│
└── 복원되는 UI:
    └── 모든 일반 모드 UI
```

## 📁 컴포넌트 구조

### 권장 파일 구조
```
src/features/replay/components/ui/
├── README.md                    # 이 파일
├── index.ts                     # UI 컴포넌트들의 export
├── ReplayHUD/                   # 리플레이 정보 표시 HUD
│   ├── ReplayHUD.tsx
│   ├── components/
│   │   ├── LapTimeDisplay.tsx
│   │   ├── SpeedDisplay.tsx
│   │   └── PositionDisplay.tsx
│   └── styles.module.css
├── DriverTracker/               # 드라이버 추적 UI
│   ├── DriverTracker.tsx
│   ├── components/
│   │   ├── DriverCard.tsx
│   │   ├── TrackingControls.tsx
│   │   └── DriverComparison.tsx
│   └── styles.module.css
├── LapComparison/               # 랩타임 비교 패널
│   ├── LapComparison.tsx
│   ├── components/
│   │   ├── LapTimeChart.tsx
│   │   ├── SectorAnalysis.tsx
│   │   └── TelemetryData.tsx
│   └── styles.module.css
├── ReplayProgress/              # 리플레이 진행 상황 표시
│   ├── ReplayProgress.tsx
│   ├── components/
│   │   ├── TimelineBar.tsx
│   │   ├── LapIndicator.tsx
│   │   └── PlaybackControls.tsx
│   └── styles.module.css
└── ReplaySettings/              # 리플레이 설정 오버레이
    ├── ReplaySettings.tsx
    ├── components/
    │   ├── ViewModeSelector.tsx
    │   ├── SpeedControls.tsx
    │   └── CameraSettings.tsx
    └── styles.module.css
```

## 🎨 UI 컴포넌트 설계 가이드

### 1. ReplayHUD (추천 위치: 화면 상단)
**목적**: 현재 리플레이 상태의 핵심 정보 실시간 표시

**포함할 요소**:
- 현재 랩 번호 / 총 랩 수
- 현재 시간 (레이스 타임)
- 선택된 드라이버의 속도
- 현재 위치 (순위)
- DRS 상태 표시

**예시 레이아웃**:
```
┌─────────────────────────────────────────────────────┐
│  LAP 15/58  │  12:34.567  │  VER  │  312 KPH  │  P1  │
└─────────────────────────────────────────────────────┘
```

### 2. DriverTracker (추천 위치: 화면 좌측)
**목적**: 드라이버 선택 및 추적 기능

**포함할 요소**:
- 드라이버 리스트 (팀 색상으로 구분)
- 현재 추적 중인 드라이버 강조
- 드라이버별 실시간 데이터 (위치, 속도, 랩타임)
- 여러 드라이버 동시 추적 옵션

### 3. LapComparison (추천 위치: 화면 우측 또는 하단)
**목적**: 랩타임 및 섹터 분석

**포함할 요소**:
- 섹터별 시간 비교
- 최적 랩타임 vs 현재 랩타임
- 드라이버 간 비교 차트
- 타이어 전략 정보

### 4. ReplayProgress (추천 위치: 화면 하단 중앙)
**목적**: 리플레이 진행 상황 및 제어

**포함할 요소**:
- 전체 레이스 진행 타임라인
- 현재 위치 표시
- 재생/일시정지/빨리감기 컨트롤
- 특정 시점으로 점프 기능

### 5. ReplaySettings (추천 위치: 팝업 또는 사이드 패널)
**목적**: 리플레이 시청 옵션 설정

**포함할 요소**:
- 카메라 각도 설정
- 재생 속도 조절
- 표시할 정보 선택
- 화질/성능 설정

## 🔧 구현 시 주의사항

### 1. 상태 관리
```typescript
// isReplayMode 상태를 props로 받아서 조건부 렌더링
interface ReplayUIProps {
  isReplayMode: boolean;
  // 기타 리플레이 관련 데이터
}

export const ReplayUI: React.FC<ReplayUIProps> = ({ isReplayMode, ...props }) => {
  if (!isReplayMode) return null;
  
  return (
    <div className="replay-ui-container">
      {/* 리플레이 모드 UI 내용 */}
    </div>
  );
};
```

### 2. 성능 최적화
- 리플레이 모드가 아닐 때는 컴포넌트를 완전히 언마운트
- 무거운 데이터는 lazy loading 적용
- 리플레이 데이터 업데이트는 throttling 사용

### 3. 스타일링
- 리플레이 모드 UI는 기존 UI와 겹치지 않도록 z-index 관리
- 반투명 배경과 blur 효과로 몰입감 향상
- F1 테마와 일치하는 색상 팔레트 사용

### 4. 사용자 경험
- 리플레이 모드 진입/종료 시 부드러운 애니메이션
- 키보드 단축키 지원
- 터치 디바이스에서의 제스처 지원

## 🚀 개발 시작 가이드

### 1. 기본 컴포넌트 생성
```typescript
// src/features/replay/components/ui/ReplayHUD/ReplayHUD.tsx
import React from 'react';

interface ReplayHUDProps {
  isReplayMode: boolean;
  currentLap: number;
  totalLaps: number;
  raceTime: string;
  selectedDriver?: string;
  // 기타 필요한 props
}

export const ReplayHUD: React.FC<ReplayHUDProps> = ({
  isReplayMode,
  currentLap,
  totalLaps,
  raceTime,
  selectedDriver
}) => {
  if (!isReplayMode) return null;

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-black/80 backdrop-blur-sm text-white px-6 py-3 rounded-lg">
        <div className="flex items-center gap-4">
          <span>LAP {currentLap}/{totalLaps}</span>
          <span>{raceTime}</span>
          {selectedDriver && <span>{selectedDriver}</span>}
        </div>
      </div>
    </div>
  );
};
```

### 2. 메인 컴포넌트에서 사용
```typescript
// app/page.tsx 또는 적절한 부모 컴포넌트에서
import { ReplayHUD } from '@/src/features/replay/components/ui';

// JSX 내에서
{isReplayMode && (
  <>
    <ReplayHUD 
      isReplayMode={isReplayMode}
      currentLap={currentLap}
      totalLaps={totalLaps}
      raceTime={raceTime}
      selectedDriver={selectedDriver}
    />
    {/* 기타 리플레이 모드 UI 컴포넌트들 */}
  </>
)}
```

---

이 가이드를 따라 리플레이 모드 전용 UI를 개발하면, 사용자에게 몰입감 있는 F1 리플레이 시청 경험을 제공할 수 있습니다.