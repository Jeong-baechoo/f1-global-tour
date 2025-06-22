# Changelog

모든 주요 변경사항이 이 파일에 문서화됩니다.

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

## [0.1.0] - 2025-06-22

### Initial Release
- F1 Global Tour 초기 버전
- Mapbox GL 기반 3D 지구본 구현
- F1 팀 본사 마커 (Red Bull Racing)
- F1 서킷 마커 (Austria, Nürburgring)
- 자동 회전 애니메이션
- 트랙 그리기 애니메이션
- 다크 테마 UI