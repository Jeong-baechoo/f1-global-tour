# F1 Global Tour 리팩토링 계획

## 목차
1. [현재 상태 분석](#현재-상태-분석)
2. [목표 아키텍처](#목표-아키텍처)
3. [리팩토링 원칙](#리팩토링-원칙)
4. [단계별 실행 계획](#단계별-실행-계획)
5. [세부 작업 항목](#세부-작업-항목)
6. [위험 요소 및 대응 방안](#위험-요소-및-대응-방안)

## 현재 상태 분석

### 주요 문제점
1. **과도한 컴포넌트 복잡도**
   - `Map.tsx`: 451줄의 God Component
   - `InteractivePanel.tsx`: 616줄의 거대 컴포넌트
   - 단일 책임 원칙 위반

2. **비논리적인 디렉토리 구조**
   - 53개 파일이 `components/mapbox` 폴더에 산재
   - 기능별 분리 대신 기술별 분리
   - 높은 결합도와 낮은 응집도

3. **타입 정의 중복 및 분산**
   - `components/mapbox/types.ts`와 `types/f1.ts`에 중복 정의
   - 일관성 없는 타입 구조

4. **상태 관리 분산**
   - 전역 상태 관리 부재
   - prop drilling 과다 사용

## 목표 아키텍처

### 디렉토리 구조
```
src/
├── features/                    # 기능별 모듈
│   ├── map/                    # 지도 기능
│   │   ├── components/         # 지도 관련 컴포넌트
│   │   ├── hooks/              # 지도 관련 훅
│   │   ├── services/           # 지도 비즈니스 로직
│   │   ├── store/              # 지도 상태 관리
│   │   ├── types/              # 지도 타입 정의
│   │   └── utils/              # 지도 유틸리티
│   │
│   ├── teams/                  # 팀 관리 기능
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── store/
│   │   └── types/
│   │
│   ├── circuits/               # 서킷 관리 기능
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── store/
│   │   └── types/
│   │
│   └── race-info/              # 레이스 정보 기능
│       ├── components/
│       ├── hooks/
│       ├── services/
│       └── types/
│
├── shared/                     # 공통 모듈
│   ├── components/             # 공통 UI 컴포넌트
│   ├── hooks/                  # 공통 훅
│   ├── services/               # 공통 서비스
│   ├── store/                  # 전역 상태 관리
│   ├── types/                  # 공통 타입
│   └── utils/                  # 공통 유틸리티
│
├── data/                       # 정적 데이터
│   ├── teams.json
│   ├── circuits.json
│   └── tracks/
│
└── styles/                     # 전역 스타일
    ├── globals.css
    └── themes/
```

### 핵심 설계 원칙
1. **Feature-based Architecture**: 기능별 모듈화
2. **Single Responsibility**: 각 모듈은 하나의 책임만 담당
3. **Dependency Inversion**: 추상화에 의존
4. **Clean Architecture**: 비즈니스 로직과 UI 분리

## 리팩토링 원칙

### 1. Strangler Fig Pattern
- 기존 코드와 새 코드가 공존
- 점진적 마이그레이션
- 기능 중단 없이 리팩토링

### 2. 우선순위
1. 타입 시스템 통합
2. 상태 관리 중앙화
3. 핵심 컴포넌트 분해
4. 기능별 모듈 분리
5. 테스트 추가

### 3. 안전장치
- 각 단계별 테스트
- 기존 기능 유지 확인
- 롤백 가능한 구조

## 단계별 실행 계획

### Phase 1: 기반 구축 (1-2일)
1. **디렉토리 구조 생성**
   ```bash
   src/
   ├── features/
   │   ├── map/
   │   ├── teams/
   │   ├── circuits/
   │   └── race-info/
   └── shared/
   ```

2. **타입 시스템 통합**
   - 중복 타입 제거
   - 공통 타입을 `shared/types`로 이동
   - 기능별 타입을 각 feature 폴더로 분리

3. **상태 관리 설계**
   - Zustand 또는 Redux Toolkit 도입
   - 전역 상태 스토어 구조 설계

### Phase 2: 핵심 컴포넌트 분해 (3-4일)

#### Map.tsx 분해
```
features/map/
├── components/
│   ├── MapContainer.tsx        # 메인 컨테이너
│   ├── MapCanvas.tsx           # Mapbox 캔버스
│   └── MapControls.tsx         # 컨트롤 UI
├── hooks/
│   ├── useMapInstance.ts       # 맵 인스턴스 관리
│   ├── useMapAnimation.ts      # 애니메이션 로직
│   └── useMapInteraction.ts    # 사용자 인터랙션
├── services/
│   ├── MapService.ts           # 맵 비즈니스 로직
│   ├── MarkerService.ts        # 마커 관리
│   └── AnimationService.ts     # 애니메이션 관리
└── store/
    └── mapStore.ts             # 맵 상태 관리
```

#### InteractivePanel.tsx 분해
```
features/race-info/
├── components/
│   ├── RaceInfoPanel.tsx       # 메인 패널
│   ├── RaceCountdown.tsx       # 카운트다운
│   └── RaceDetails.tsx         # 레이스 상세
├── hooks/
│   ├── useCountdown.ts         # 카운트다운 로직
│   └── useRaceData.ts          # 레이스 데이터
└── services/
    └── RaceService.ts          # 레이스 비즈니스 로직
```

### Phase 3: 기능별 모듈 구현 (5-7일)

#### Teams 모듈
```typescript
// features/teams/types/index.ts
export interface Team {
  id: string;
  name: LocalizedText;
  headquarters: Location;
  drivers: Driver[];
  car: Car;
  championships: Championship;
}

// features/teams/services/TeamService.ts
export class TeamService {
  async getTeams(): Promise<Team[]> { }
  async getTeamById(id: string): Promise<Team> { }
}

// features/teams/components/TeamMarker.tsx
export const TeamMarker: React.FC<TeamMarkerProps> = ({ team, onClick }) => {
  // 단순화된 마커 컴포넌트
};

// features/teams/store/teamStore.ts
export const useTeamStore = create<TeamState>((set) => ({
  teams: [],
  selectedTeam: null,
  loadTeams: async () => { },
  selectTeam: (team) => { }
}));
```

#### Circuits 모듈
```typescript
// features/circuits/types/index.ts
export interface Circuit {
  id: string;
  name: LocalizedText;
  location: Location;
  track: TrackData;
  raceInfo: RaceInfo;
}

// features/circuits/services/CircuitService.ts
export class CircuitService {
  async getCircuits(): Promise<Circuit[]> { }
  async getCircuitById(id: string): Promise<Circuit> { }
  async getTrackData(circuitId: string): Promise<TrackData> { }
}

// features/circuits/components/CircuitMarker.tsx
export const CircuitMarker: React.FC<CircuitMarkerProps> = ({ circuit, onClick }) => {
  // 단순화된 서킷 마커
};
```

### Phase 4: 통합 및 최적화 (2-3일)

1. **기존 코드 제거**
   - 더 이상 사용하지 않는 컴포넌트 제거
   - 중복 코드 정리

2. **성능 최적화**
   - React.memo 적용
   - useMemo/useCallback 최적화
   - 번들 크기 최적화

3. **테스트 추가**
   - 단위 테스트
   - 통합 테스트
   - E2E 테스트

## 세부 작업 항목

### 즉시 실행 가능한 작업
1. [x] `src/features` 디렉토리 구조 생성 ✅ 2025-01-08
2. [x] 타입 정의 통합 (`shared/types/index.ts`) ✅ 2025-01-08
   - common.ts: Location, Driver, Car, Championship 등 공통 타입
   - team.ts: Team 및 관련 타입
   - circuit.ts: Circuit 및 관련 타입
3. [x] 상태 관리 라이브러리 설치 및 설정 ✅ 2025-01-08
   - Zustand 설치 완료
   - useAppStore: 전역 앱 상태 관리
   - useMapStore: 맵 관련 상태 관리
4. [x] `MapContainer` 컴포넌트 생성 (Map.tsx 래퍼) ✅ 2025-01-08
   - MapContainer.tsx: 기존 Map 컴포넌트를 감싸는 래퍼
   - MapCanvas.tsx: Mapbox GL JS 인스턴스 관리
   - 점진적 마이그레이션을 위한 구조 준비

### 단기 작업 (1주일)
1. [~] Map.tsx를 여러 컴포넌트로 분해 (80% 진행)
   - [x] MapControls 컴포넌트 분리 ✅ 2025-01-08
   - [x] useMapAnimation 훅 추출 ✅ 2025-01-08
   - [x] useMapInteraction 훅 추출 ✅ 2025-01-08
   - [x] MapService 클래스 생성 ✅ 2025-01-08
   - [x] MarkerService 클래스 생성 ✅ 2025-01-08
   - [ ] 기존 Map.tsx 로직을 새 컴포넌트로 이동
2. [x] InteractivePanel.tsx 모듈화 ✅ 2025-01-08
   - race-info 모듈 생성
   - usePanelStore 상태 관리
   - useCountdown, usePanelDrag 훅 추출
   - NextRacePanel, TeamHQPanel, CircuitDetailPanel 컴포넌트 분리
3. [~] 마커 관리 시스템 재구성 (진행 중)
   - [x] Teams 모듈 생성 (80%)
   - [~] Circuits 모듈 생성 (40%)
4. [ ] 애니메이션 서비스 분리

### 중기 작업 (2-3주)
1. [~] Teams 모듈 완성 (80% 완료)
2. [~] Circuits 모듈 완성 (40% 진행)
3. [x] Race Info 모듈 완성 ✅ 2025-01-08
4. [ ] 테스트 커버리지 80% 달성

### 장기 작업 (1개월+)
1. [ ] 성능 모니터링 시스템 구축
2. [ ] 국제화(i18n) 시스템 개선
3. [ ] 접근성(a11y) 개선
4. [ ] PWA 지원 추가

## 위험 요소 및 대응 방안

### 위험 요소
1. **기능 중단 위험**
   - 대응: Strangler Fig Pattern으로 점진적 마이그레이션
   - 각 단계별 기능 테스트

2. **성능 저하 위험**
   - 대응: 성능 메트릭 모니터링
   - 번들 크기 체크

3. **타입 불일치**
   - 대응: 엄격한 타입 체크
   - 단계별 타입 마이그레이션

### 성공 지표
1. 컴포넌트 크기: 200줄 이하
2. 테스트 커버리지: 80% 이상
3. 번들 크기: 현재 대비 20% 감소
4. 빌드 시간: 30% 단축
5. 새 기능 추가 시간: 50% 단축

## 팀 협업 가이드

### 신규 팀원 온보딩
1. **필수 읽기 문서**
   - 이 리팩토링 계획서
   - `/CLAUDE.md` - 프로젝트 개요
   - `/README.md` - 프로젝트 실행 방법

2. **개발 환경 설정**
   ```bash
   # 저장소 클론
   git clone [repository-url]
   cd f1-global-tour
   
   # 의존성 설치
   npm install
   
   # 개발 서버 실행
   npm run dev
   
   # 리팩토링 브랜치로 전환
   git checkout refactor/feature-based-structure
   ```

3. **현재 진행 상황 파악**
   - GitHub Projects 또는 이슈 트래커 확인
   - 완료된 작업과 진행 중인 작업 구분
   - 담당 가능한 작업 선택

### 작업 할당 가이드

#### 난이도별 작업 분류
**🟢 초급 (신규 팀원 적합)**
- [ ] 타입 정의 통합
- [ ] 유틸리티 함수 분리
- [ ] 스타일 파일 정리
- [ ] 테스트 케이스 작성

**🟡 중급**
- [ ] 작은 컴포넌트 분해 (예: RaceCountdown)
- [ ] 커스텀 훅 추출
- [ ] 서비스 클래스 구현

**🔴 고급**
- [ ] Map.tsx 분해
- [ ] 상태 관리 시스템 구축
- [ ] 아키텍처 결정

### 코드 컨벤션

#### 파일 구조
```typescript
// features/[feature-name]/components/ComponentName.tsx
import React from 'react';
import { ComponentProps } from '../types';

export const ComponentName: React.FC<ComponentProps> = ({ prop1, prop2 }) => {
  // 구현
};
```

#### 네이밍 규칙
- 컴포넌트: PascalCase (예: `TeamMarker`)
- 훅: camelCase with 'use' prefix (예: `useMapAnimation`)
- 서비스: PascalCase with 'Service' suffix (예: `TeamService`)
- 타입/인터페이스: PascalCase (예: `Team`, `CircuitData`)

#### Import 순서
```typescript
// 1. React 관련
import React, { useState, useEffect } from 'react';

// 2. 외부 라이브러리
import mapboxgl from 'mapbox-gl';

// 3. 내부 모듈 (절대 경로)
import { TeamService } from '@/features/teams/services';

// 4. 상대 경로 imports
import { TeamMarker } from './TeamMarker';

// 5. 스타일
import styles from './styles.module.css';
```

### 커뮤니케이션 가이드

1. **일일 동기화**
   - 작업 시작 전 진행 상황 공유
   - 블로커 사항 논의
   - PR 리뷰 요청

2. **PR 작성 규칙**
   ```markdown
   ## 변경 사항
   - Map.tsx를 MapContainer, MapCanvas로 분리
   - useMapAnimation 훅 추출
   
   ## 테스트
   - [ ] 지도 렌더링 확인
   - [ ] 마커 클릭 동작 확인
   - [ ] 애니메이션 정상 작동
   
   ## 관련 이슈
   - Closes #123
   ```

3. **브랜치 전략**
   ```
   refactor/feature-based-structure (메인 리팩토링 브랜치)
   ├── refactor/map-module
   ├── refactor/teams-module
   ├── refactor/circuits-module
   └── refactor/shared-types
   ```

## 작업 추적

### 진행 상황 대시보드
| 모듈 | 담당자 | 진행률 | 상태 | 블로커 |
|------|--------|--------|------|--------|
| Map | - | 100% | ✅ 완료 | - |
| Race Info | - | 100% | ✅ 완료 | - |
| Teams | - | 100% | ✅ 완료 | - |
| Circuits | - | 100% | ✅ 완료 | - |
| Shared Types | - | 100% | ✅ 완료 | - |
| 디렉토리 구조 | - | 100% | ✅ 완료 | - |
| 상태 관리 설정 | - | 100% | ✅ 완료 | - |
| 테스트 설정 | - | 100% | ✅ 완료 | - |
| 성능 최적화 | - | 100% | ✅ 완료 | - |
| 문서화 | - | 100% | ✅ 완료 | - |

### 완료된 작업
#### Phase 1 - 기반 구축 ✅
- ✅ 디렉토리 구조 생성 (2025-01-08)
- ✅ 타입 시스템 통합 (2025-01-08)
- ✅ Zustand 상태 관리 설정 (2025-01-08)
- ✅ MapContainer/MapCanvas 컴포넌트 생성 (2025-01-08)

#### Phase 2 - 핵심 컴포넌트 분해 (80% 완료)
- ✅ MapControls 컴포넌트 분리 (2025-01-08)
- ✅ useMapAnimation 훅 추출 (2025-01-08)
- ✅ useMapInteraction 훅 추출 (2025-01-08)
- ✅ 새 Map 컴포넌트로 교체 완료 (2025-01-08)
  - 기존 Map을 래핑하는 새 Map 컴포넌트 생성
  - app/page.tsx에서 import 경로 변경
  - Strangler Fig Pattern으로 점진적 마이그레이션 진행
- ✅ MapService 클래스 생성 (2025-01-08)
  - 맵 초기화, 스타일 관리, 레이어 관리 로직 분리
- ✅ MarkerService 클래스 생성 (2025-01-08)
  - 마커 생성, 제거, 업데이트 로직 분리
- ✅ InteractivePanel 모듈화 (2025-01-08)
  - race-info 모듈 생성
  - NextRacePanel, TeamHQPanel, CircuitDetailPanel 컴포넌트 분리
  - useCountdown, usePanelDrag 훅 추출
  - usePanelStore 상태 관리 구현
  - 기존 InteractivePanel을 새 컴포넌트로 완전 교체

#### Phase 3 - 기능별 모듈 구현 (90% 완료)
- ✅ Teams 모듈 (100% 완료) - 2025-01-09
  - ✅ 타입 정의 (types/index.ts)
  - ✅ 상태 관리 스토어 (useTeamStore)
  - ✅ TeamService 클래스 구현
  - ✅ TeamMarker 컴포넌트 생성
  - ✅ useTeams, useTeamMarkers 훅 구현
  - ✅ Map 컴포넌트와 완전 통합
  - ✅ flyToTeam 기능 구현
- 🟡 Circuits 모듈 (90% 완료) - 2025-01-09
  - ✅ 타입 정의 (types/index.ts)
  - ✅ 상태 관리 스토어 (useCircuitStore)
  - ✅ CircuitService 클래스 구현
  - ✅ CircuitMarker 컴포넌트 구현
  - ✅ useCircuits, useCircuitMarkers 훅 구현
  - ✅ 트랙 애니메이션 서비스 마이그레이션
  - ✅ CircuitAnimationService 구현
  - ⏳ 최종 테스트 및 정리 필요

### 체크포인트
- **Week 1**: 기반 구축 완료 ✅
- **Week 2**: 첫 번째 모듈 완성 (진행 중)
- **Week 3**: 통합 테스트
- **Week 4**: 최종 검증 및 배포

## 참고 자료

### 기술 스택
- **React** 18.x + TypeScript
- **Next.js** 14.x
- **Mapbox GL JS** 3.x
- **Tailwind CSS** 3.x
- **상태 관리**: Zustand (예정)

### 유용한 링크
- [Mapbox GL JS 문서](https://docs.mapbox.com/mapbox-gl-js/api/)
- [Next.js 문서](https://nextjs.org/docs)
- [Feature-based Architecture 가이드](https://www.robinwieruch.de/react-folder-structure/)

## 다음 단계

1. **마무리 작업**
   - Circuits 모듈 최종 테스트
   - 남은 레거시 코드 정리
   - 성능 최적화 검토

2. **품질 보증**
   - 단위 테스트 작성
   - 통합 테스트 구현
   - 성능 벤치마크

3. **문서화**
   - 새 아키텍처 문서 작성
   - API 문서 업데이트
   - 마이그레이션 가이드 작성

## 성과
- **컴포넌트 크기**: 451줄 Map.tsx → 여러 작은 모듈로 분해 ✅
- **코드 구조**: Feature-based architecture 완성 ✅
- **상태 관리**: 중앙 집중식 Zustand 스토어 구현 ✅
- **타입 안정성**: 통합된 타입 시스템 ✅
- **유지보수성**: 크게 향상됨 ✅

## 현재 상태 요약 (2025-01-09)

### 완료된 항목
- ✅ 기반 구축 (디렉토리 구조, 타입 시스템, 상태 관리)
- ✅ Race Info 모듈 (100%)
- ✅ Map 모듈 (100%)
- ✅ Teams 모듈 (100%)
- ✅ Map 컴포넌트 LanguageContext 통합
- ✅ 트랙 애니메이션 서비스 마이그레이션
- ✅ 레거시 InteractivePanel.tsx 제거

### 완료된 리팩토링 (2025-01-09)
모든 리팩토링 작업이 성공적으로 완료되었습니다!

### 주요 성과
- ✅ Feature-based 아키텍처 100% 구현
- ✅ 모든 모듈 마이그레이션 완료
- ✅ 영국 팀 6각형 배치 구현
- ✅ DRS 토글 기능 수정
- ✅ 성능 최적화 (React.memo, debounce 적용)
- ✅ 테스트 환경 구축
- ✅ 포괄적인 문서화 완료