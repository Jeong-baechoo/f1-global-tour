# FlyTo Configuration System

이 디렉토리는 F1 Global Tour 애플리케이션의 FlyTo 애니메이션 설정을 중앙 관리합니다.

## 구조

```
config/
├── teamFlyToConfig.ts      # 팀별 FlyTo 설정
├── circuitCameraConfig.ts  # 서킷별 카메라 설정
└── README.md              # 이 파일
```

## 특징

### 반응형 설정
- **데스크톱**: 기본 설정
- **모바일**: 선택적 오버라이드 설정

### 타입 안전성
- TypeScript 인터페이스로 모든 설정 검증
- 컴파일 타임에 오류 감지

### 확장성
- 새로운 팀/서킷 설정을 쉽게 추가 가능
- 런타임 설정 추가 지원

## 사용법

### 새로운 팀 설정 추가

```typescript
// teamFlyToConfig.ts
export const TEAM_FLYTO_CONFIGS: TeamFlyToConfigs = {
  'new-team': {
    desktop: {
      center: [lng, lat],
      zoom: 15.5,
      pitch: 45,
      bearing: 0,
      speed: 0.4,
      curve: 0.8,
      duration: 6000
    },
    mobile: {
      center: [lng, lat], // 모바일 전용 좌표
      zoom: 14.2,         // 모바일 전용 줌
      pitch: 50           // 모바일 전용 각도
    }
  }
};
```

### 새로운 서킷 설정 추가

```typescript
// circuitCameraConfig.ts
export const CIRCUIT_CAMERA_CONFIGS: Record<string, ResponsiveFlyToConfig> = {
  'new-circuit': {
    desktop: {
      zoom: 15.0,
      pitch: 60,
      bearing: 0,
      speed: 1.2,
      curve: 1
    },
    mobile: {
      zoom: 13.5,     // 모바일에서 더 넓은 뷰
      bearing: -30    // 모바일 전용 각도
    }
  }
};
```

## 설정 우선순위

1. **모바일 전용 설정** (있는 경우)
2. **데스크톱 설정** (기본값)
3. **전역 기본값** (fallback)

## 모범 사례

### 모바일 최적화
- 모바일에서는 일반적으로 줌을 낮춰서 더 넓은 시야 제공
- 화면 크기에 맞는 적절한 pitch 각도 설정
- 터치 인터랙션을 고려한 bearing 조정

### 성능 고려사항
- `speed`와 `curve` 값을 적절히 조정하여 부드러운 애니메이션
- `duration`을 너무 길게 설정하지 않도록 주의
- 모바일에서는 애니메이션을 더 간소하게

### 일관성 유지
- 비슷한 유형의 위치는 비슷한 설정 사용
- 팀 본부와 서킷의 설정 패턴을 일관되게 유지
- 브랜드 컬러나 특성을 반영한 카메라 앵글 고려