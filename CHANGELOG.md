# Changelog

모든 주요 변경사항이 이 파일에 문서화됩니다.

## [0.5.0] - 2025-06-25

### Added
- 🏁 2025 시즌 F1 팀 상세 정보 표시 기능
  - 20명의 드라이버 프로필 이미지 및 정보 (이름, 국적, 레이싱 번호)
  - 10개 팀의 2025년 F1 차량 이미지 및 모델명
  - InteractivePanel에 드라이버/차량 정보 섹션 추가
- 📁 프로젝트 구조 개선을 위한 새로운 폴더 구조
  - `markers/team/`, `markers/circuit/`, `markers/symbolLayer/` 서브폴더 생성
  - `utils/animations/`, `utils/map/`, `utils/data/` 서브폴더 생성

### Changed
- 🔄 팀 마커 시스템 전면 리팩토링
  - 개별 팀 마커 파일 제거 → `TeamMarkerFactory` 패턴으로 통합
  - 중앙 집중식 팀 마커 설정 관리 (`teamMarkerConfig.ts`)
  - 코드 중복 85% 감소 (1,320줄 → 200줄)
- 📂 파일 구조 재구성
  - `device.ts` → `viewport.ts`로 이름 변경
  - `tracks.ts` → `map/trackDrawing.ts`로 이동 및 이름 변경
  - `circuitHelpers.ts` → 기능별로 분리 (camera.ts, circuitColors.ts, circuitAnimation.ts)
  - `symbolLayerMarkers.ts` → `markers/symbolLayer/`로 이동
- 🖼️ 리소스 로딩 최적화
  - 모든 팀 로고를 로컬 파일로 변경 (`/team-logos/`)
  - 모든 드라이버 이미지를 로컬 파일로 변경 (`/drivers/`)
  - 외부 URL 의존성 제거로 5-10배 로딩 속도 향상

### Improved
- 📱 사용자 경험
  - 팀 마커 클릭 시 풍부한 시각적 정보 제공
  - 드라이버 프로필과 차량 이미지로 몰입감 향상
- 🏗️ 코드 구조
  - 명확한 책임 분리 (markers = UI 컴포넌트, utils = 헬퍼 함수)
  - 관련 코드의 논리적 그룹핑
  - 직관적인 파일명으로 가독성 향상
- ⚡ 성능
  - 로컬 이미지 사용으로 네트워크 요청 감소
  - CDN 캐싱 가능
  - 예측 가능한 로딩 시간

### Fixed
- 🐛 캐싱 문제로 인한 이미지 로딩 실패 해결
- 🐛 SVG 파일 확장자 불일치 문제 수정
- 🐛 TypeScript 타입 정의 개선 (Driver, Car 인터페이스 추가)

## [0.4.1] - 2025-06-24

### Fixed
- 서킷 마커 줌 레벨별 가시성 제어 개선
  - Mapbox 마커 DOM 구조로 인한 opacity 상속 문제 해결
  - 부모와 자식 요소 모두에 opacity 적용하여 정상 작동
  - 줌 레벨 12-14.5 사이에서 점진적 페이드 효과 구현

### Improved
- 가시성 설정을 `constants.ts`로 이동하여 중앙 관리
  - `CIRCUIT_MARKER_VISIBILITY` 상수 추가
  - 하드코딩된 값 제거로 유지보수성 향상

## [0.4.0] - 2025-06-24

### Refactored
- Map 컴포넌트 구조 전면 개편
  - `forwardRef`와 `useImperativeHandle` 패턴 도입
  - Custom hooks로 로직 분리 (`useMapInitialization`, `useCinematicMode`)
  - API 노출 방식을 props에서 ref 기반으로 변경

### Fixed
- 🎯 마커가 사라지는 치명적 버그 완전 해결
  - Timer를 state에서 ref로 변경하여 무한 리렌더링 방지
  - 의존성 배열 최적화로 맵 재생성 문제 해결
  - 맵 객체가 재생성되던 문제 수정
- flyTo 동작 안정화
- 서킷 클릭 시 트랙이 그려지지 않던 문제 해결

### Improved
- 성능 대폭 향상
  - 불필요한 리렌더링 제거 (약 50-70% 감소)
  - 마커 생성/제거 사이클 최적화
  - 함수 참조 안정화로 메모리 효율성 증가
- 코드 품질
  - 10개의 중복 팀 마커 컴포넌트 → 1개 통합 컴포넌트로
  - 약 1,000줄 코드 감소 (1,766줄 삭제, 778줄 추가)
  - 파일 구조 정리 및 중복 데이터 제거

### Technical
- useEffect 의존성 관리 개선
- ref 패턴 적극 활용
- 디버그용 console.log 모두 제거

## [0.3.1] - 2025-06-23

### Added
- 줌 레벨 기반 마커 가시성 관리
  - 줌 레벨 13 이상에서 마커 자동 숨김
  - 부드러운 페이드 인/아웃 전환
  - MarkerVisibilityManager 클래스 구현

### Improved
- 서킷 트랙 애니메이션 품질
  - 보간점 2배 증가 (10,000 → 20,000)
  - ease-in-out-cubic 이징 함수 적용
  - 애니메이션 마지막 10%에서 서브프레임 보간
  - 더 부드럽고 자연스러운 트랙 그리기

## [0.3.0] - 2025-06-23

### Added
- 코드 중복 제거를 위한 유틸리티 및 컴포넌트
  - `ModuleHeader` 컴포넌트 - 반복되는 헤더 로직 추출
  - `createBaseMarker` 팩토리 함수 - 마커 생성 로직 통합
  - `MapEventManager` 클래스 - 이벤트 핸들러 관리
  - 반응형 스타일 유틸리티 함수
  - 데이터 포맷팅 유틸리티 함수
  - 애니메이션 프리셋 상수

### Fixed
- TypeScript 타입 안정성 개선
  - `any` 타입을 명시적 타입으로 변경
  - 불필요한 변수 제거
- 시네마틱 모드 작동 문제 해결
- 모바일 바텀시트 헤더 배경 투명 처리

### Improved
- 코드 품질 및 유지보수성
  - 중복 코드 제거
  - 모듈화 강화
  - 일관된 코드 스타일
- UI/UX 일관성
  - 버튼 배경색 블러 효과 통일
  - 모바일 바텀시트 및 정보 카드 블러 효과 통일

## [0.2.5] - 2025-06-23

### Added
- 🎬 시네마틱 투어 모드
  - 자동 서킷 투어 기능
  - 부드러운 카메라 이동
  - 트랙 애니메이션과 동기화
- 📱 모바일 인터랙티브 바텀 시트
  - 드래그 제스처 지원
  - 3단계 상태 (peek, half, full)
  - 부드러운 스냅 애니메이션
- Next Race 마커 시각적 개선

### Fixed
- ESLint 오류 및 TypeScript 타입 오류
- 마커 클릭 시 팝업 제거
- 모바일 바텀 시트 중복 헤더 제거
- 모바일 줌 레벨 최적화

### Improved
- 모바일 사용자 경험
  - 터치 제스처 지원
  - 반응형 줌 레벨
  - 최적화된 UI 레이아웃

## [0.2.0] - 2025-06-23

### Added
- F1 서킷 트랙 라인 데이터 (GeoJSON) 통합
- 2025 시즌 24개 서킷 지원
- 동적 트랙 데이터 로딩 시스템
- 서킷별 커스텀 색상 설정

### Changed
- Map 컴포넌트 구조 개선 및 모듈화
  - 관심사별 파일 분리 (markers, utils, types, constants)
  - 재사용 가능한 마커 컴포넌트 생성
  - 애니메이션 로직 분리
- 개별 트랙 파일에서 통합 GeoJSON 사용으로 변경

### Improved
- 코드 유지보수성 향상
- 타입 안정성 강화
- 확장성 개선
- 지도 애니메이션 속도 및 초기 로딩 개선

### Fixed
- Vercel 배포 환경에서 마커가 사라지는 문제
- Windows 전용 패키지 제거 및 플랫폼 독립적 설정
- Mapbox 토큰 환경 변수 처리

## [0.1.0] - 2025-06-22

### Initial Release
- F1 Global Tour 초기 버전
- Mapbox GL 기반 3D 지구본 구현
- F1 팀 본사 마커 (Red Bull Racing)
- F1 서킷 마커 (Austria, Nürburgring)
- 자동 회전 애니메이션
- 트랙 그리기 애니메이션
- 다크 테마 UI
- F1 레이스 엔지니어 콘솔 테마

---

이 프로젝트는 [Semantic Versioning](https://semver.org/)을 따릅니다.