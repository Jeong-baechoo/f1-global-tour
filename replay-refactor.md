# 리플레이 마커 위치 정확도 개선 계획 (OpenF1 location 기반)

> 임시 작업 문서. 작업 완료 후 정식 문서(`REPLAY_API_SPECIFICATION.md` 등)에 반영하고 삭제 예정.

## 0. 배경 / 문제

현재 리플레이의 드라이버 마커 위치는 **랩 소요시간 대비 경과시간 비율을 트랙 거리 비율로 가정**해서 찍는다. 즉 등속 주행 가정이라 실제 위치와 어긋난다 (직선에선 뒤처지고 코너에선 앞서 보임).

### 현재 로직 흐름 (As-Is)

```
currentTime (재생 시각)
   │
   ▼
PositionCalculator.calculatePositionFromLapData()      // src/features/replay/services/PositionCalculator.ts:37
   │  lapProgress = (currentTime - lap.lapStartTime) / lap.lapDuration   // ← 시간 비율
   ▼
TrackPositionService.getPositionAtProgress(circuitId, lapProgress)       // src/features/replay/services/TrackPositionService.ts:37
   │  targetDistance = lapProgress * totalDistance       // ← 거리 비율로 환산 (등속 가정)
   │  interpolateCoordinateAtDistance()                  // GeoJSON 트랙 라인 위 보간
   ▼
[lng, lat]
   │
   ▼
ReplayAnimationEngine.updateDriverPositions()           // src/features/replay/services/ReplayAnimationEngine.ts:218
   ▼
DriverMarkerManager.updateMarkerPosition()              // src/features/replay/services/DriverMarkerManager.ts:92
   ▼
Mapbox Marker.setLngLat()
```

핵심 한계: `lapProgress`(시간 비율) → `targetDistance`(거리 비율) 환산이 **선형(등속) 가정**이라 부정확.

## 1. 목표 (To-Be)

OpenF1 `/v1/location` 엔드포인트가 제공하는 **실제 차량 좌표(x, y, z)**를 사용해 정확한 위치를 표시한다.

- OpenF1 location 응답: `{ date, driver_number, x, y, z, session_key, meeting_key }`
- x, y, z 는 위경도가 아니라 **트랙별 로컬 직교 좌표계** (단위 ≈ 1/10 m), 약 3.7Hz(~0.27s 간격) 샘플링
- 따라서 핵심 작업 두 가지:
  1. **좌표 변환**: 로컬 (x, y) → 위경도 (lng, lat)  — 트랙별 2D 어파인 변환
  2. **시간 보간**: 재생 시각 기준으로 앞뒤 location 샘플 사이를 선형 보간

## 2. 진행 전략 (중요)

**프론트에서 먼저 정확하게 동작시킨 뒤, 검증된 로직을 그대로 백엔드로 이관한다.**

- 좌표 변환/정제는 최종적으로 **백엔드 책임** (변환 계수는 캘리브레이션 데이터이고, 원시 x,y를 프론트로 보낼 이유가 없음. 백엔드는 OpenF1↔프론트 intelligent proxy로 설계됨).
- 시간 보간/렌더링은 **프론트 책임** (재생 속도·일시정지·시킹과 묶여 매 프레임 일어남. 네트워크 왕복 불가).
- 단 지금은 백엔드가 설계 단계라, **프론트에서 변환식까지 임시 구현 → 한 트랙으로 정확도 검증 → 백엔드로 변환 로직 이관** 순서로 간다.
- `ReplayServiceSwitcher`(mock/backend 전환)와 `ReplayDataService` 추상화가 이미 있어 이관 경로가 자연스럽다.

### 최종 책임 경계

```
OpenF1 원시 x,y,z
      │
   [백엔드]  ── 어파인 변환 + 정제 + 다운샘플 + Redis 캐싱   (← 검증 후 이관)
      │
   드라이버별 { date(또는 t), lng, lat } 시계열  (가벼움)
      │
   [프론트]  ── 재생 시각 기준 시간 보간 → Mapbox 마커
```

## 3. 작업 단계

### Phase 0 — 캘리브레이션 PoC 결과 ✅ (완료, 2024 Bahrain)

실제 OpenF1 데이터로 어파인 변환 가능성을 검증함.

- **데이터**: `session_key=9472` = **2024 Bahrain GP Race** (circuit `Sakhir`, 목데이터 기본 세션). 1번 드라이버 1랩(~100초, 399 location 샘플).
- **방법**: OpenF1 `(x,y)` 점군 ↔ `bahrain.geojson` feature[0] 트랙 라인을 ICP로 정합 → 대응점으로 full affine 최소제곱.
- **결과**:
  - 변환 후 location → 트랙 거리: **평균 6.6m / 중앙값 5.4m**
  - 회전 ≈ 0 (OpenF1 x축 ≈ 경도, y축 ≈ 위도), 스케일 ≈ **0.1m/unit** (OpenF1 단위 10cm 통설과 일치 → 물리적으로 타당)
  - max 36m 오차는 **코너 apex의 실제 레이싱 라인 vs GeoJSON 중심선 차이** → 변환 오류 아님. location이 중심선보다 더 정밀.
- **변환식 (bahrain)**:
  ```
  lng = 9.4225452882e-07*x + 9.1162383737e-09*y + 50.510822
  lat = -9.8762608375e-09*x + 9.1274318597e-07*y + 26.029258
  ```
- **결론**: 어파인 변환으로 충분. 트랙별 계수만 캘리브레이션하면 됨. 캘리브레이션 스크립트(ICP+lstsq)는 트랙별 반복 가능 → 향후 오프라인/빌드타임 작업으로 자동화.
- 검증 산출물(임시): `/tmp/affine_fit.py`, `/tmp/bahrain_poc.png`.

#### 연도 무관성 검증 ✅ (중요)

OpenF1 location 좌표계가 세션/연도마다 바뀌는지 확인:
- **2025 Bahrain Race** (`session_key=10014`, `circuit_key=63`) location의 x,y 범위가 **2024와 동일** (x: -577..7497, y: -3500..~8346).
- **2024 계수를 2025 데이터에 그대로 적용** → 트랙 거리 평균 **7.33m** (2024 자체 검증 6.6m와 동등).
- **결론: OpenF1 좌표계는 `circuit_key`(트랙)마다 고정, 연도/세션 무관.**
  → **트랙당 1회만 캘리브레이션하면 모든 연도/세션 재사용 가능.** 계수 매핑 키는 `circuit_key`(또는 circuitId) 사용.

> 주의: 목데이터의 `mapCircuitName`은 `'Bahrain' → 'bahrain'` 매핑인데 OpenF1 `circuit_short_name`은 `'Sakhir'`임. 실데이터 연동 시 매핑 키 보정 필요.

### Phase 1 — 프론트 TS 통합 ✅ (구현 + 육안 검증 완료)

대상 트랙: **bahrain** / `sessionKey=9472` (Phase 0에서 캘리브레이션 완료).

> **검증 결과 (사용자 육안 확인)**: 마커가 트랙을 실제 좌표대로 잘 주행함. 코너에서 GeoJSON 트랙 라인을 살짝 벗어나지만 미미한 수준. 이 이탈은 location 변환 오류가 아니라 (1) 레이싱 라인(apex 주행) vs GeoJSON 중심선 차이, (2) GeoJSON 트랙 단순화(103점)에서 기인 — 즉 **location이 GeoJSON 중심선보다 더 정확**. → **location(x,y) 어파인 변환 방식으로 전환 확정.**

> **중요 발견**: 현재 리플레이 데이터 로딩은 전부 백엔드(`localhost:4000`) 의존이다 (`replayDataService` → 백엔드). mock 데이터는 export돼 있으나 로딩 흐름에서 안 쓰임. 따라서 PoC는 **백엔드 비의존 독립 경로**로 구현했다.

**구현 내용 (백엔드 비의존, 콘솔 트리거 방식):**
- `types/openF1Types.ts`: `OpenF1Location` 추가
- `types/index.ts`: `DriverLocationSample`, `AffineCoefficients` 추가
- `services/LocationCoordinateService.ts` (신규): x,y → lng,lat 어파인 변환 + bahrain 계수
- `services/PositionCalculator.ts`: `setLocationData()` + location 기반 **시간 보간(이진탐색)** 경로 추가. 기존 등속 경로는 폴백 유지.
- `services/ReplayAnimationEngine.ts`: `loadReplayDataFromLocation()` 추가 (랩 데이터 없이 location으로 마커 구동). `getTotalDuration`/cleanup에 location 모드 반영.
- `utils/ReplayPocController.ts` (신규): 개발 콘솔 도구 `window.replayPoc`. 정적 데이터 로드 → 엔진 구동.
- `public/data/replay-poc/bahrain-9472.json`: 실제 OpenF1 location (상위 5명, 5분 구간, 218KB).

**검증(눈으로 확인) 방법:**
1. `npm run dev` → 앱 접속 (맵이 로드되면 `MapControls`가 마운트되며 `replayPoc` 자동 등록)
2. 브라우저 콘솔에서:
   ```js
   await replayPoc.start()   // 바레인 트랙에 5명 마커가 실제 좌표대로 주행
   replayPoc.setSpeed(2)     // 2배속
   replayPoc.seekTo(120)     // 120초 지점
   replayPoc.pause() / replayPoc.play()
   replayPoc.stop()
   ```
3. 마커가 트랙(특히 코너)을 실제 레이싱 라인대로 따라가는지, 등속 방식 대비 정확도 확인.

- 빌드 상태: `tsc --noEmit` ✅, `eslint` ✅

#### (참고) 원래 Phase 1 세부 체크리스트

- [ ] **1-1. 타입 추가** — `src/features/replay/types/openF1Types.ts`
  ```ts
  export interface OpenF1Location {
    date: string;
    driver_number: number;
    x: number;
    y: number;
    z: number;
    session_key: number;
    meeting_key: number;
  }
  ```
  - 내부 처리용 타입도 추가: `DriverLocationSample { t: number; lng: number; lat: number }` (또는 변환 전 `{ t, x, y }`).

- [ ] **1-2. 좌표 변환 캘리브레이션 (가장 까다로움)**
  - OpenF1 (x, y) → (lng, lat) 2D 어파인 변환:
    ```
    lng = a*x + b*y + e
    lat = c*x + d*y + f
    ```
  - 계수(a~f) 구하는 법:
    - 한 트랙의 OpenF1 location 샘플 + 기존 GeoJSON 트랙(`public/data/circuits-geojson/{circuitId}.geojson`)을 대응시켜 최소제곱 피팅,
    - 또는 알려진 기준점 2~3개(메인 직선 시작/끝 등) 매칭.
  - 트랙별 계수를 상수로 저장: `{ [circuitId]: { a,b,c,d,e,f } }`.
  - 새 서비스로 분리 권장: `LocationCoordinateService` (변환 + 계수 보관).
  - **검증 방법**: 변환된 좌표가 GeoJSON 트랙 라인 위에 잘 얹히는지 시각 확인 (디버그 마커/라인).

- [ ] **1-3. 위치 소스 교체** — `PositionCalculator` 에 location 기반 경로 추가
  - 드라이버별 location 샘플 배열을 `date(→t)` 정렬해 보관.
  - 현재 재생 시각으로 **이진 탐색** → 앞뒤 샘플 t0, t1.
  - 시간 보간:
    ```ts
    const r = (currentTime - t0.t) / (t1.t - t0.t);
    const lng = t0.lng + (t1.lng - t0.lng) * r;
    const lat = t0.lat + (t1.lat - t0.lat) * r;
    ```
  - 기존 거리 기반 경로(`calculatePositionFromLapData`)는 **폴백으로 유지** (location 없는 트랙/세션 대비).
  - 출력은 기존 `DriverPosition` 형태를 그대로 유지 → 하위(`updateMarkerPosition`) 무수정 재사용.

- [ ] **1-4. 목데이터 / 로딩** — `OpenF1MockDataService`, `ReplayDataService`
  - location 샘플을 만들어주는 mock 메서드 추가 (실제 OpenF1 형식 준수).
  - `replayDataService.getFullRaceData()`(또는 별도 메서드)가 location 시계열도 반환하도록 확장.
  - 데이터량 주의: 레이스당 수십만 행 → mock도 적절히 다운샘플.

- [ ] **1-5. 검증**
  - 한 트랙에서 마커가 트랙을 정확히 따라가는지, 재생 속도/시킹/일시정지에서 깨지지 않는지 확인.
  - 기존 등속 방식과 시각 비교.

### Phase 2 — 백엔드 이관

- [ ] **2-1. API 응답 스펙 정의** — `REPLAY_API_SPECIFICATION.md` 에 location 시계열 엔드포인트 추가
  - 백엔드가 변환(어파인)·정제·다운샘플까지 끝낸 `{ driver_number, samples: [{ t, lng, lat }] }` 형태 반환.
- [ ] **2-2. 변환 로직 이관** — Phase 1에서 검증한 어파인 변환 + 계수를 백엔드로 이동.
- [ ] **2-3. Redis 캐싱** — 세션별 변환 결과 캐싱.
- [ ] **2-4. 프론트 정리** — `BackendReplayApiService`가 변환된 좌표를 받도록 하고, 프론트 임시 변환 코드 제거(또는 mock 전용으로 격리).

## 3.5 트랙 매핑 & 캘리브레이션 대상

**지원 연도: 2023, 2024, 2025** (`SessionSelector.availableYears`). Race 그랑프리 수: 2023=23, 2024=24, 2025=24.

좌표계가 트랙(`circuit_key`)마다 고정 → 세 시즌 **고유 트랙 24개**만 캘리브레이션하면 됨. 24개 모두 GeoJSON 보유.

| circuit_key | OpenF1 short_name | circuitId (geojson) | years | 비고 |
|---|---|---|---|---|
| 63 | Sakhir | bahrain | 2023,2024,2025 | ✅ 완료 |
| 9 | Austin | usa | 2023,2024,2025 | |
| 144 | Baku | azerbaijan | 2023,2024,2025 | |
| 15 | Catalunya | spain | 2023,2024,2025 | |
| 4 | Hungaroring | hungary | 2023,2024,2025 | |
| 6 | Imola | imola | 2023,2024,2025 | |
| 14 | Interlagos | brazil | 2023,2024,2025 | |
| 149 | Jeddah | saudi-arabia | 2023,2024,2025 | |
| 152 | Las Vegas | las-vegas | 2023,2024,2025 | |
| 150 | Lusail | qatar | 2023,2024,2025 | |
| 10 | Melbourne | australia | 2023,2024,2025 | |
| 65 | Mexico City | mexico | 2023,2024,2025 | |
| 151 | Miami | miami | 2023,2024,2025 | |
| 22 | Monte Carlo | monaco | 2023,2024,2025 | |
| 23 | Montreal | canada | 2023,2024,2025 | |
| 39 | Monza | italy | 2023,2024,2025 | |
| 49 | Shanghai | china | 2024,2025 | 2023 미개최 |
| 2 | Silverstone | britain | 2023,2024,2025 | |
| 61 | Singapore | singapore | 2023,2024,2025 | |
| 7 | Spa-Francorchamps | belgium | 2023,2024,2025 | |
| 19 | Spielberg | austria | 2023,2024,2025 | |
| 46 | Suzuka | japan | 2023,2024,2025 | |
| 70 | Yas Marina Circuit | abu-dhabi | 2023,2024,2025 | |
| 55 | Zandvoort | netherlands | 2023,2024,2025 | |

- **합계: 24개 트랙** (bahrain 완료 → 남은 23개)
- `madrid` GeoJSON은 보유하나 **2026 신규 서킷**이라 2023–2025 지원범위 밖 → 제외. 2026 지원 시 +1.

## 3.6 전체 트랙 캘리브레이션 결과 (24개 자동화 시도)

각 트랙의 2024 Race에서 driver 1의 **연속 4랩 location**을 받아(트랙 전체 커버), GeoJSON 메인 트랙(feature 중 최다 점 LineString)과 정합해 어파인 계수 산출.

### 핵심 교훈 — 측정 지표의 함정 (실패 원인 규명)

여러 정합 방법(ICP 16각, PCA 정렬, FFT 푸리에, 닫힌곡선 cyclic)을 시도하며 얻은 결론:

1. **데이터·형상·좌표계는 모두 정상**. raw location은 24개 트랙 전부 정확한 트랙 형상(`raw_xy.png`), GeoJSON도 정확, 좌표계 연도 무관.
2. **`similarity_fit`(스케일 자유)은 degenerate에 취약**. 까다로운 형상(britain 등)에서 ICP가 "모든 점을 트랙 위 한 점으로 축소"하는 해로 빠짐. 계수가 `a,b,c,d≈1e-9`.
3. **`mean`(GeoJSON까지 거리)은 degenerate에 속는다**. 한 점으로 축소되면 그 점이 트랙 위라 mean=0 → "완벽"으로 오판. ICP best를 median/mean으로 고르면 degenerate 선택.
4. **GeoJSON 해상도가 낮아 정상 정합도 mean이 과대**. italy는 mean 25m인데 **시각상 완벽 정합**(코너 직선근사 거리가 부풀려짐).
5. **결국 자동 단일 지표(mean/chamfer)로는 판정 불가 → 시각 검증이 유일하게 신뢰 가능** (`verify.png`, `verify2.png`).

### 시각 검증 최종 결과 (23/24 정합 성공)

| 상태 | 트랙 | 비고 |
|---|---|---|
| ✅ 정확 정합 (14) | singapore, brazil, saudi-arabia, japan, usa, mexico, miami, abu-dhabi, spain, monaco, bahrain, azerbaijan, qatar, italy | 마커가 트랙 위 정확. italy는 mean 크나 시각상 완벽 |
| 🔶 형상 정확·스케일 약간 작음 (9) | netherlands, hungary, austria, canada, las-vegas, imola, australia, belgium, china | 마커가 트랙보다 살짝 안쪽 |
| ❌ 자동 정합 실패 (1) | britain | ICP가 degenerate 못 벗어남. 형상 자체는 정확(`raw_xy.png`) |

- 계수: `/tmp/all_affine.json` (chamfer-best 선택), 캘리브 스크립트: `/tmp/calibrate_final.py`, 데이터: `/tmp/loc_cache/`

### ⭐ 핵심 교훈 추가 — 4랩 데이터의 피트인 왜곡 (belgium 사례)

belgium을 PoC로 실제 앱에서 보니 정적 이미지(verify)보다 훨씬 부정확(직선에서도 벗어남)했음. 원인 추적 결과:
- **캘리브에 쓴 "연속 4랩" 데이터에 피트인 랩이 섞이면 피트레인(트랙 밖 경로)이 형상을 왜곡** → 어파인 정합 실패.
- **GeoJSON 트랙은 정확했음** (mapbox 렌더링 기준). 처음 "GeoJSON 부정확" 추론은 틀렸고, 부정확한 계수로 변환한 결과를 오판한 것.
- belgium을 **피트 제외 깨끗한 1랩**으로 재정합 → 중앙값 38m → **17.5m**, 형상 정합 확인(`belgium-1lap.png`). **belgium 계수 확정(픽스), 허용 오차 내로 판단.**
- → **🔶 스케일-작음 9개 중 상당수가 같은 "4랩 피트인" 문제일 가능성. 전체를 깨끗한 1랩 기준으로 재캘리브하면 더 많이 해결될 전망.**
- 남은 17.5m(코너 레이싱라인 vs 중심선 차이 + 정합 오차)를 bahrain 수준(~7m)까지 줄이려면 ICP 미세조정 또는 수동 기준점 3개.

**확정 계수 (LocationCoordinateService 반영)**: bahrain(PoC), belgium(1랩 정합).
**britain 해결 방향**: ICP degenerate라 형상은 정확 → 수동 기준점 3개 또는 1랩 정밀 정합.

## 3.7 현재 캘리브레이션 현황 (PoC 육안 검증 기준)

24개 트랙을 PoC(`replayPoc.start('트랙명')`)로 하나씩 맵 위에서 확인하며 진행 중.

### LocationCoordinateService 변환 구조
트랙마다 변환 종류가 다를 수 있음:
- **`COEFFICIENTS`** (어파인): `lng = a*x+b*y+e`, `lat = c*x+d*y+f` — 대부분 트랙
- **`QUADRATIC`** (2차 다항식): `value = [x,y,x²,y²,xy,1]` 계수 — 어파인으로 비선형 왜곡이 안 잡히는 트랙(현재 italy). 어파인보다 우선 적용.

### ✅ 확정 픽스 (21개) — 앞으로 건드리지 않음

| 트랙 | 변환 | 정합 방법 | 비고 |
|---|---|---|---|
| bahrain | 어파인 | PoC 1랩 | 최초 PoC 검증 |
| singapore, brazil, saudi-arabia, japan, usa, mexico, miami, abu-dhabi, qatar | 어파인 | 4랩 chamfer-best | 육안 정확 |
| spain, azerbaijan | 어파인 | 1랩 + ICP 미세조정 | 중앙 ~2.5–2.8m |
| belgium | 어파인 | 1랩 + ICP 미세조정 | 중앙 3.1m (4랩 피트인 문제 해결) |
| hungary | 어파인 | 1랩 + ICP 미세조정 | 중앙 2.2m (4랩 27.9m → 개선) |
| austria | 어파인 | 1랩 + ICP 미세조정 | 중앙 3.1m |
| canada | 어파인 | 1랩 + ICP 미세조정 | 중앙 1.6m |
| las-vegas | 어파인 | 1랩 + ICP 미세조정 | 중앙 5.2m. **GeoJSON 사용자 수정본** 적용 |
| china | 어파인 | 1랩 + ICP 미세조정 | 중앙 2.6m |
| australia | 어파인 | 1랩 + ICP 미세조정 | 중앙 2.7m (PoC 1랩, 사고 많은 레이스) |
| imola | 어파인 | 1랩 + ICP 미세조정 | 중앙 2.5m |
| britain | 어파인 | 1랩 + ICP 미세조정 | 중앙 4.0m (4랩 degenerate → 1랩으로 해결) |

> **PoC 데이터 주의**: brazil(lap43–46)·japan(lap36–39)·monaco(lap3–7)는 레이스 초반 세이프티카/레드플래그로 마커가 안 움직여서, **정상 주행 구간으로 재수집**함. 다른 사고 레이스도 같은 보정이 필요할 수 있음.

### ✅ TPS 적용 완료 (3개) — italy·monaco·netherlands

세 트랙 모두 **"특정 코너 한 곳만 전역 변환(어파인/2차)으로 안 잡히는"** 동일 패턴이었다(트랙 끝단 far-corner 왜곡, 뱅킹). 검증된 **base 어파인 위에 '잔차'만 TPS(Thin-Plate Spline)로 국소 보정**하는 방식으로 처리.

**방식 (residual TPS, 임계값 게이트):**
- `최종(x,y) = base_affine(x,y) + TPS_residual( norm(x,y) )`, `U(r)=r²·ln r`.
- 깨끗한 1랩 location ↔ GeoJSON 중심선 정합(FFT+ICP) → 중심선 대비 오차가 **12m 넘는 코너에만** 잔차 타깃 부여, 그 외(직선·정상 코너 ~5-7m 레이싱 라인)는 **잔차 0으로 보존**(앵커).
- 제어점을 랩 호 길이로 균등 배치(70~80개) → 보정이 **문제 코너에만 국소 적용**, 직선부 진동/오버슈트 없음(시각 확인).
- λ=0.005 정규화 RBF. 런타임은 `affine + RBF합`(드라이버당 프레임당 1회, ~80 evals → 경량).

**결과 (base 어파인 → +TPS, 트랙 거리):**

| 트랙 | 문제 코너 | 중앙 | 90% | 비고 |
|---|---|---|---|---|
| italy | T1·Parabolica·중간코너 | 7.9→1.1m | 35→7m | Parabolica·중간코너 보정 + **T1은 진행률 도로스냅**(아래) |
| monaco | 유턴 헤어핀·S/F·여러 코너 | 3.9→1.3m | 20→6m | 헤어핀(43%)·28%·하단(88%)·S/F(마지막코너+pit straight) 도로스냅. Sainte Dévote 1곳 잔존 |
| netherlands | Tarzan·T3 헤어핀 | 5.0→2.3m | 31→8m | Tarzan 보정 + **T3 Hugenholtzbocht 진행률 도로스냅**(27→13m) |

- **quad base 무용 확인**: italy quad/affine 둘 다 Parabolica max ~92m 동일 → quad는 그 코너에 이점 없음. → italy/netherlands는 **2차(QUADRATIC) 제거하고 TPS로 이전**.
- **⭐ 마커가 도로 밖으로 빠지는 코너 = 진행률 도로스냅(중요)**: italy T1(Variante del Rettifilo)은 location→어파인 결과가 **렌더링 도로(feat0)를 ~25m 벗어나** 마커가 도로 밖으로 감(사용자가 실제 앱 화면으로 지적). GeoJSON은 정상(Mapbox 도로와 일치) — **마커가 틀린 것**.
  - nearest-point TPS 스냅으로는 ~27m까지밖에 못 당김(도로가 그 구간 직선이라 형상차 큼). 단순 투영은 도로엔 붙지만 마커 간격이 0.1~55m로 들쭉날쭉(정체→점프).
  - **해결 = 진행률(호길이) 도로스냅**: 구역 진입·이탈점을 feat0에 투영하고, 그 사이를 location 호길이 비율로 매핑 → 도로 위 + 매끄러운 타깃. 이 타깃을 TPS 잔차로 피팅(런타임은 기존 TPS 그대로). 결과 T1 도로까지 중앙 2.1m·max 10m, 간격 균일.
  - 캘리브 `snap_zones=[(lng,lat,radius_m)]` (italy T1 `(9.2820,45.6249,150m)`, netherlands T3 Hugenholtzbocht `(4.5417,52.3884,150m)`, 27→13m).
  - **⚠ 인필드서 트랙이 자기 자신과 가까운 경우(netherlands T3)**: 스냅존 반경 안에 그 코너 패스 외 다른 트랙 구간도 들어와 엉뚱하게 끌려감(인공물). 해결: `progress_snap_targets`는 **존 중심 에이펙스를 포함하는 연속 구간만** 진행률 매핑하고, 스냅 잔차는 **그 통과구간 제어점(랩 위치=nearest src idx가 구간 내)에만** 적용.
  - **교훈: GeoJSON 의심 금지(3번째로 틀림). 마커가 도로를 벗어나면 좌표워핑(nearest)보다 '진행률 도로스냅'이 정답 — 도로 위 + 타이밍 보존. 단 인필드 겹침은 패스구간 한정 필요.**
  - **monaco: 유턴 헤어핀(43%)·28%·하단 스위밍풀(88%)·S/F(마지막코너+pit straight) 도로스냅(90% 20→6m).**
  - **`progress_snap_targets` 견고화(중요)**: ① 랩경계(S/F) 횡단 위해 `at_s`에 `%total` wrap. ② **에이펙스 폴백**: 평행도로(monaco S/F)서 pit straight 출발경로가 ~30m 치우쳐 `proj_s(이탈점)`이 엉뚱한 반대편 도로(접근, 92%)를 집어 전부 붕괴 → 진입·이탈 투영이 에이펙스 기준 전진순서(`sA≤s_apex≤sB`)를 깨면 **에이펙스 호길이 매핑으로 폴백**. 헤어핀(레이싱라인<중심선 길이)은 투영이 정상이라 entry/exit 유지(폴백시 67m 점프 회피).
  - **✅ monaco S/F = 런타임 진행률 스냅으로 해결(RoadSnapService)**: pit straight↔접근도로가 ~30m 평행이라 **TPS(매끄러운 변환)로는 원리적으로 분리 불가**(가까운 두 입력→먼 두 출력 불가). 마커가 출발선 지나 진행률이 4%↔77%로 튐("후반부 갔다가 초반부"). → location **시간 순서**로 전진 제약 투영해 드라이버별 진행률을 1회 계산(평행도로는 진행률이 멀어 절대 안 샘), 지정 진행률 구간(monaco `[0.95,0.13]` wrap)에선 그 진행률 위치의 feat0 점에 마커 배치(경계 블렌드). 결과: S/F 오실레이션 제거, 도로까지 max 24→14m, Sainte Dévote도 같이 해결.
    - 구현: `services/RoadSnapService.ts`(신규) + `PositionCalculator`가 location 주입 시 `prepare`, 매 프레임 `snap`. monaco TPS는 다시 3존(헤어핀·28%·88%)으로.
    - 잔여: 데이터 시작 직후(t~5s) lock-on 1회. 정상 랩엔 영향 없음.
- **트레이드오프(문서 명시대로)**: 문제 코너에서 마커를 실제 레이싱 라인 → 중심선 쪽으로 당김. 단 임계값 게이트로 **정확한 구간은 보존**(naive 전체 스냅보다 우수).
- 산출물(임시): `/tmp/tps_calibrate.py`(캘리브), `/tmp/tps_*.png`(시각 검증), 계수 → `src/features/replay/data/tpsCoefficients.ts`.

**런타임 우선순위**: `LocationCoordinateService` → **TPS > 2차 > 어파인**.

> **참고 — las-vegas GeoJSON 수정 사례 (해결됨)**: 기존 `las-vegas.geojson`(71pt)이 실제 트랙(location)과 형상이 달랐음(2023 신규 스트리트 서킷이라 검증 덜 됨). 사용자가 GeoJSON을 직접 수정(Sector 1/2/3 좌표 보정)해 제공 → **Sector 1+2+3를 합쳐 메인 트랙(80pt)을 재생성**하고 length 6166m 재계산, 재캘리브(중앙 5.2m)해서 확정. **교훈: 트랙별 GeoJSON 정확도 편차가 있을 수 있고, 신규 서킷은 특히 확인 필요.**

### ✅ 미작업 없음 — 24개 트랙 1차 처리 완료

- **확정 21개**(어파인) + **TPS 3개**(italy·monaco·netherlands) = 24개 전부 PoC 육안 확인 + 계수 확정.
- TPS 3개는 특정 코너만 전역 변환 한계(뱅킹/far-corner 왜곡) → residual TPS 국소 보정으로 처리 완료(위 ✅ TPS 섹션).
- **핵심 교훈 재확인**: 깨끗한 1랩 + ICP 미세조정이면 4랩 degenerate(britain)·피트인 왜곡(belgium) 모두 해결. 사고 많은 레이스(brazil/japan/monaco/australia)는 정상 주행 구간으로 PoC 데이터 재수집.

- 대부분 4랩 데이터로는 "스케일 약간 작음"이었음. **belgium·hungary 사례(4랩 피트인 → 1랩으로 해결)로 보아, 1랩+ICP 재캘리브 시 대부분 해결됨이 확인되는 중** (hungary 27.9m→2.2m).
- britain은 ICP degenerate였으나 형상은 정확 → 1랩+ICP 또는 수동 기준점.
- 진행 방식: 1랩+ICP로 재캘리브 → 정상 주행 구간 PoC 데이터 수집 → 육안 확인 → 픽스(확정 트랙은 변경 없음).

## 4. 영향 받는 파일

| 파일 | 변경 내용 |
|---|---|
| `types/openF1Types.ts` | `OpenF1Location` 타입 추가 |
| `services/LocationCoordinateService.ts` (신규) | x,y → lng,lat 어파인 변환 + 트랙별 계수 |
| `services/PositionCalculator.ts` | location 기반 시간 보간 경로 추가, 기존 로직은 폴백 |
| `services/OpenF1MockDataService.ts` | location mock 생성 |
| `services/ReplayDataService.ts` / `BackendReplayApiService.ts` | location 페치 메서드 |
| `services/ReplayAnimationEngine.ts` | (가급적 무수정) 데이터 주입부만 조정 |
| `REPLAY_API_SPECIFICATION.md` | Phase 2에서 location API 스펙 추가 |

## 5. 리스크 / 미해결 질문

- **어파인 변환이 충분한가?** 대부분의 트랙은 평면 회전+스케일로 충분하지만, OpenF1 좌표계 기준점/축 방향이 트랙마다 다름 → 트랙별 캘리브레이션 필수. 정확도 부족 시 변환식 보강 필요.
- **고도(z) 처리**: 현재 2D 맵이므로 z는 사용 안 함 (필요 시 추후).
- **데이터량/성능**: location은 매우 큼. 다운샘플 레이트와 프론트 메모리 구조(드라이버별 정렬 배열 + 이진탐색) 확정 필요.
- **시간축 정합**: OpenF1 `date`(절대시각)를 리플레이 `currentTime`(0 기준 상대초)으로 매핑하는 기준점(레이스 시작 시각) 확정 필요.
- **location 결측 구간**: 피트인/사고 등으로 샘플이 비는 경우 폴백 처리.
```
