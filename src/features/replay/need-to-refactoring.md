# Need to Refactoring - Replay System

리플레이 시스템에서 리팩토링이 필요한 문제점들과 해결 방안을 정리한 문서입니다.

## 🚨 Critical Issues

### 1. 드라이버 클릭 이벤트 씹힘 현상 (High Priority)

**문제점:**
- DriverInfoPanel에서 드라이버를 클릭했을 때 텔레메트리 패널 업데이트가 자주 무시됨
- 여러 실시간 업데이트 서비스 간의 경합 상태(Race Condition) 발생

**관련 컴포넌트:**
- `DriverInfoPanel.tsx` - 4초마다 실시간 업데이트 (RealtimeUpdateService)
- `MapControls.tsx` - 2초마다 텔레메트리 업데이트
- `ReplayAnimationEngine` - 애니메이션 루프와 상태 업데이트

**현재 시도된 해결책:**
```typescript
// 락 메커니즘 구현 (부분적 효과)
const userSelectionLockRef = useRef<NodeJS.Timeout | null>(null);
const isUserSelectionActiveRef = useRef(false);

// 5초간 자동 업데이트 차단
isUserSelectionActiveRef.current = true;
setTimeout(() => {
  isUserSelectionActiveRef.current = false;
}, 5000);
```

**근본적 해결 방안:**
1. **중앙 집중식 상태 관리**: Zustand store로 모든 드라이버 관련 상태 통합
2. **이벤트 기반 아키텍처**: 클릭 이벤트를 독립적인 이벤트 버스로 분리
3. **단일 업데이트 소스**: 하나의 서비스에서만 UI 업데이트 담당

## 🔄 Architecture Issues

### 2. 중복된 상태 관리

**문제점:**
```typescript
// page.tsx
const [selectedDriverForTelemetry, setSelectedDriverForTelemetry] = useState<string | null>(null);

// MapControls.tsx  
const [selectedDriverTelemetry, setSelectedDriverTelemetry] = useState<any>(null);

// useReplayStore
selectedDrivers: string[];
```

**해결 방안:**
- 모든 드라이버 선택 상태를 useReplayStore로 통합
- Props drilling 제거하고 전역 상태 사용

### 3. 서비스 간 결합도 높음

**문제점:**
- `DriverInfoPanel` → `RealtimeUpdateService` → `DriverTimingService` 
- `MapControls` → `OpenF1MockDataService`
- 각 서비스가 독립적으로 데이터를 생성하여 일관성 부족

**해결 방안:**
```typescript
// 중앙 집중식 데이터 관리
class ReplayDataManager {
  private static instance: ReplayDataManager;
  
  // 모든 실시간 데이터를 여기서 관리
  getCurrentDriverData(): DriverData[]
  getSelectedDriverTelemetry(driverCode: string): TelemetryData
  
  // 이벤트 기반 업데이트
  onDriverSelect(callback: (driverCode: string) => void)
  onDataUpdate(callback: (data: ReplayData) => void)
}
```

## ⚡ Performance Issues

### 4. 과도한 리렌더링

**문제점:**
- DriverInfoPanel: `updateKey` 상태로 인한 강제 리렌더링
- 4초마다 전체 드라이버 리스트 재생성
- 실시간 업데이트와 사용자 인터랙션이 동시 발생 시 성능 저하

**현재 코드:**
```typescript
const [updateKey, setUpdateKey] = useState(0);
setUpdateKey(prev => prev + 1); // 강제 리렌더링
```

**해결 방안:**
- React.memo와 useMemo 활용한 선택적 리렌더링
- 변경된 드라이버만 업데이트하는 differential update
- Virtual scrolling으로 대량 데이터 최적화

### 5. 타이머 중복 실행

**문제점:**
```typescript
// 여러 컴포넌트에서 독립적인 타이머 실행
setInterval(updateTelemetry, 2000);     // MapControls
setInterval(updateDriverData, 4000);    // RealtimeUpdateService  
requestAnimationFrame(animationLoop);   // ReplayAnimationEngine
```

**해결 방안:**
- 단일 마스터 타이머로 통합
- Observer 패턴으로 구독 기반 업데이트

## 🧩 Code Quality Issues

### 6. 타입 안정성 부족

**문제점:**
```typescript
const [selectedDriverTelemetry, setSelectedDriverTelemetry] = useState<any>(null);
```

**해결 방안:**
```typescript
interface SelectedDriverTelemetry {
  driverCode: string;
  
  telemetry: TelemetryData;
  timestamp: number;
}
```

### ~~7. 에러 처리 부족~~ ✅ **COMPLETED**

**~~문제점~~**:
- ~~네트워크 오류, 데이터 파싱 오류에 대한 일관된 처리 부재~~
- ~~사용자에게 명확한 에러 메시지 부족~~

**✅ 해결 완료:**
```typescript
// ✅ 구현된 중앙 집중식 에러 처리 시스템
class ReplayErrorHandler {
  static handleDataFetchError(error: Error, context?: Record<string, any>): ReplayError
  static handleUserInteractionError(error: Error, context?: Record<string, any>): ReplayError
  static handleSessionLoadError(error: Error, sessionInfo?: Record<string, any>): ReplayError
  static handleDriverDataError(error: Error, driverInfo?: Record<string, any>): ReplayError
  static handleTelemetryError(error: Error, context?: Record<string, any>): ReplayError
  static showUserFriendlyMessage(message: string, type?: 'error' | 'warning' | 'info'): void
}
```

**구현된 기능:**
- ✅ **ReplayErrorHandler 클래스**: 전체 replay 시스템의 중앙 집중식 에러 처리
- ✅ **타입 안전한 에러 분류**: 각 에러 타입별 전용 핸들러 메소드
- ✅ **사용자 친화적 메시지**: 기술적 오류를 읽기 쉬운 한국어 메시지로 변환
- ✅ **에러 히스토리 추적**: 디버깅을 위한 에러 로그 및 컨텍스트 저장
- ✅ **ErrorNotification 컴포넌트**: Toast 스타일 에러 알림 UI
- ✅ **전체 컴포넌트 적용**: SessionSelector, DriverInfoPanel, MapControls, ReplayPanel에 적용 완료
- ✅ **개발/프로덕션 분리**: 개발 환경에서는 상세 로그, 프로덕션에서는 사용자 친화적 메시지만 표시

## 📋 Refactoring Plan

### Phase 1: 상태 관리 통합 (2-3 days)
1. 모든 드라이버 선택 상태를 useReplayStore로 이동
2. Props drilling 제거
3. 중복 상태 정리

### Phase 2: 이벤트 시스템 구축 (3-4 days)
1. 중앙 집중식 이벤트 버스 구현
2. 드라이버 클릭 이벤트를 독립적으로 처리
3. 실시간 업데이트와 사용자 인터랙션 분리

### Phase 3: 성능 최적화 (2-3 days)
1. 불필요한 리렌더링 제거
2. 타이머 통합 및 최적화
3. 메모리 누수 방지

### ~~Phase 4: 타입 안정성 개선~~ ✅ **PARTIALLY COMPLETED**
1. any 타입 제거
2. 엄격한 TypeScript 설정 적용
3. ✅ **에러 처리 강화** - ReplayErrorHandler 시스템 구현 완료

## 🔧 Quick Fixes (임시 해결책)

현재 사용 중인 임시 해결책들:

### 드라이버 클릭 응답성 향상
```typescript
// 클릭 시 즉시 반영
onClick={(e) => {
  e.preventDefault();
  e.stopPropagation();
  console.log(`🖱️ Driver clicked: ${driver.driverCode}`);
  onDriverSelect?.(driver.driverCode);
}}
```

### 사용자 선택 보호
```typescript
// 5초간 자동 업데이트 차단
isUserSelectionActiveRef.current = true;
setTimeout(() => {
  isUserSelectionActiveRef.current = false;
}, 5000);
```

## 📚 References

- [React Performance Optimization](https://react.dev/learn/render-and-commit)
- [State Management Best Practices](https://github.com/pmndrs/zustand)
- [TypeScript Strict Mode](https://www.typescriptlang.org/docs/handbook/2/basic-types.html)

## ⚠️ Known Workarounds

현재 코드베이스에서 사용 중인 임시 해결책들:

1. **강제 리렌더링**: `updateKey` 상태 사용
2. **락 메커니즘**: 사용자 선택 보호를 위한 타이머 기반 락
3. **이벤트 버블링 방지**: `preventDefault()` 및 `stopPropagation()` 과다 사용
4. **디버그 로그**: 콘솔 로그로 이벤트 추적 (프로덕션에서 제거 필요)

## 🎯 Recent Updates & Fixes

### 2024-09-05 Updates:

#### ✅ **중앙 집중식 에러 처리 시스템 구현 완료**
- **ReplayErrorHandler 클래스**: 타입 안전하고 포괄적인 에러 처리 시스템
- **ErrorNotification 컴포넌트**: 사용자 친화적 Toast 알림
- **전체 적용 범위**: 모든 주요 replay 컴포넌트에 에러 처리 적용
  - `SessionSelector.tsx`: 세션 로딩 및 드라이버 데이터 에러 처리
  - `DriverInfoPanel.tsx`: 드라이버 타이밍 업데이트 및 클릭 이벤트 에러 처리  
  - `MapControls.tsx`: 텔레메트리 업데이트 및 사용자 인터랙션 에러 처리
  - `ReplayPanel.tsx`: 리플레이 시작 프로세스 에러 처리

#### ✅ **FlagInfoPanel 디스플레이 이슈 수정**
- **문제**: Practice 세션에서 90개 타임라인 박스가 malformed grid로 표시
- **원인**: `grid-cols-15` CSS 클래스가 존재하지 않아 레이아웃 깨짐
- **해결책**: Practice 세션용 10분 단위 블록 그룹화 시스템 구현
  - 90분 → 10개 블록 (1-10분, 11-20분, ..., 81-90분)
  - 각 블록은 해당 구간의 가장 심각한 플래그 상태 표시
  - Race/Qualifying 세션은 기존 로직 유지

---

**⏰ Last Updated:** 2024-09-05  
**👤 Author:** Claude Code Assistant  
**🔖 Status:** 🟡 Progress Made - Error Handling ✅, UI Fixes ✅, Core Issues Remain