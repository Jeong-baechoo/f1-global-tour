# 리플레이 위치 정확도 — 설계 개요 & 배경

> 리플레이 드라이버 마커 위치를 OpenF1 `location(x,y)` 기반으로 정확히 표시하기 위한 **설계/배경 문서**.
> *왜 이렇게 설계했는지*와 *무엇이 검증됐는지*를 남긴다 (구현 단계별 체크리스트는 완료되어 제거).
>
> **구현 현황 (2026-06)**
> - ✅ **백엔드 구현 완료** (별도 레포 `f1-global-tour-backend`): 좌표 변환/도로스냅/다운샘플 이관 +
>   `GET /sessions/:sk/positions` 엔드포인트 + race-time 단일 기준 + laps `driverNumber` 필터 + start-replay 프리워밍.
> - ✅ **프론트 통합 완료**: positions 소비(`loadPositions`/`calcFromBackend`) 구현 — 아래 §6. **시각(브라우저) 검증만 남음.**
> - 🗄️ **RDB+Redis 캐싱**: 백엔드 레포 `plan.md`(§6.6)로 이관. 현재 백엔드는 인메모리 캐시 + single-flight로 동작.

---

## 1. 문제와 해법 (개요)

**As-Is**: 현재 마커는 "랩 경과시간 비율 = 트랙 거리 비율"(등속 가정)로 위치를 찍어 부정확하다(직선에서 뒤처지고 코너에서 앞선다).

**To-Be**: OpenF1 `/location`의 실제 차량 좌표 `(x,y)`를 쓴다. x,y는 위경도가 아니라 **트랙별 로컬 직교좌표계**(단위 ≈ 0.1m, ~3.7Hz). 작업을 둘로 분리한다:
- **좌표 변환 `(x,y)→(lng,lat)`** — 트랙별 어파인(+비선형 보정). **백엔드 책임**(계수는 캘리브 산출물·민감, 세션당 1회, 원시 x,y 비노출).
- **시간 보간** — 재생 시각 기준 앞뒤 샘플 선형보간. **프론트 책임**(재생속도·일시정지·시킹과 묶여 매 프레임).

## 2. 책임 분리 & 경계

- **세션당 1회 결정론적 처리 = 백엔드**: 좌표 변환·정제·도로스냅·다운샘플·캐싱.
- **매 프레임/재생상태에 묶인 처리 = 프론트**: 시간 보간·재생 제어(play/pause/seek/speed)·렌더.
- **경계점 = 드라이버별 `{ t, lng, lat }` 시계열** (가볍고 변환 지식 불필요 → 프론트가 범용 플레이어).
- **왜 이 경계인가**: ① 변환/스냅은 캘리브 산출물이라 정적·민감 → 서버 보관, 세션당 1회만 계산(서버 캐시 효율), 원시 x,y 비노출. ② 보간/재생은 60fps라 네트워크 왕복 불가.

## 3. 데이터 흐름

```
OpenF1 /location, /intervals, /laps, /stints, /position, /drivers, /race_control, /car_data
        │
   ┌─── [백엔드 NestJS] (세션당 1회, 캐시) ─────────────────────────────────┐
   │ 1) 수집/프록시   OpenF1 호출, rate-limit·CORS 흡수, 원시 응답 캐시        │
   │ 2) 레이스 기준   raceStartTime(절대시각) 1회 계산 → 모든 t 정렬 기준      │
   │ 3) 좌표 변환     affine + quad + TPS  (x,y → lng,lat)  [캘리브 산출물]    │
   │ 4) 정제          x,y≈0(피트/결측)·속도 이상치 제거                        │
   │ 5) 도로 스냅     진행률 전진제약 투영 + zone 스냅(feat0 geojson)          │
   │ 6) 다운샘플      ~4Hz / 코너 적응형                                       │
   │ 7) 직렬화/캐시   드라이버별 {t,lng,lat} + 타이밍/플래그/텔레             │
   └────────────────────────────────────────────────────────────────────────┘
        │  (가벼운 좌표 시계열 + 타이밍/랩/플래그/텔레메트리)
   ┌─── [프론트 Next.js] (매 프레임) ─────────────────────────────────────────┐
   │ A) 페치 → B) 시간 보간(이진탐색) → C) 재생 제어(60fps) → D) Mapbox 마커   │
   └──────────────────────────────────────────────────────────────────────────┘
```

## 4. 시간축 정합 (★ 정확성 핵심)

모든 시계열의 `t`(또는 `timeOffset`)는 **동일한 `raceStartTime`(레이스 시작 절대시각)을 0으로 하는 상대 초**여야 한다.
- positions의 `t`, driver-timings의 `timeOffset`, laps의 `lapStartTime`이 **같은 0점**을 공유해야 마커·타이밍·랩이 동기화된다.
- 백엔드 `RaceTimeService`가 단일 소스로 계산: 드라이버별 첫 랩 `date_start`을 10초 클러스터로 묶어 **가장 큰 클러스터의 최솟값**(레드플래그로 일부가 lap1 재시작해도 다수결로 실제 출발 확보). 프론트 `sortAndProcessLaps`/`findMostCommonTimestamp` 규칙을 이관한 것.

---

## 5. 캘리브레이션 배경 & 검증 (Phase 0·1 PoC)

> *왜* location 기반으로 가는지와 *무엇이 검증됐는지*의 압축 기록.

### 5.1 검증 완료 요약
- **Phase 0 PoC (2024 Bahrain)**: OpenF1 `(x,y)` ↔ `bahrain.geojson`을 ICP+어파인 정합 → 트랙거리 평균 6.6m. 스케일 ≈ 0.1m/unit, 회전 ≈ 0. **어파인 변환으로 충분**.
- **⭐ 연도 무관성**: 좌표계는 `circuit_key`(트랙)마다 고정·**연도/세션 무관**(2024 계수를 2025에 그대로 적용해도 7.3m). → **트랙당 1회만 캘리브, 모든 연도 재사용. 계수 키 = circuit_key/circuitId.**
- **Phase 1 프론트 PoC**: 24개 트랙 모두 콘솔 PoC(`replayPoc`)로 **육안 검증 완료**. 마커가 실좌표대로 주행, GeoJSON 라인 미세 이탈은 레이싱라인/단순화 탓(location이 더 정확).
- **⚠ 매핑 주의**: 목데이터 `'Bahrain'→'bahrain'`이지만 OpenF1 `circuit_short_name`은 `'Sakhir'` → circuit_key 우선 매핑.

### 5.2 캘리브 교훈 (재캘리브 시 참고)
- **GeoJSON·좌표계·raw location은 전부 정상.** "GeoJSON 부정확" 추론은 3번 틀렸다 — 의심 금지.
- **자동 단일 지표(mean/chamfer) 신뢰 불가** → degenerate 해(한 점 축소)에 속거나 GeoJSON 저해상도로 과대평가. **시각 검증이 유일하게 신뢰 가능.**
- **⭐ 4랩 데이터에 피트인 랩이 섞이면 피트레인이 형상을 왜곡** → 어파인 정합 실패. **피트 제외 깨끗한 1랩**으로 재정합하면 해결(belgium 38→17.5m, hungary 27.9→2.2m).

### 5.3 변환 구조 (런타임 우선순위: TPS > 2차 > 어파인)
- **어파인** (대부분): `lng = a*x+b*y+e`, `lat = c*x+d*y+f`.
- **2차(QUADRATIC)**: 어파인으로 비선형 왜곡이 안 잡히는 트랙. (현재 모두 TPS로 이전, 비어있음.)
- **TPS**: 특정 코너(뱅킹·far-corner 왜곡)가 전역 변환으로 안 잡히는 트랙. base 어파인 + 국소 RBF 잔차(`U(r)=r²·ln r`).

**✅ 확정 픽스 (21개, 어파인)**: bahrain, singapore, brazil, saudi-arabia, japan, usa, mexico, miami, abu-dhabi, qatar, spain, azerbaijan, belgium, hungary, austria, canada, las-vegas, china, australia, imola, britain.
> las-vegas는 **사용자 수정 GeoJSON**(Sector 합성 메인트랙) 적용. brazil·japan·monaco는 레이스 초반 세이프티카/레드플래그로 정상 주행 구간 재수집.

**✅ TPS 적용 (3개)** — italy · monaco · netherlands: 모두 "특정 코너 한 곳만 전역 변환으로 안 잡히는" 패턴(far-corner 왜곡, 뱅킹). base 어파인 위에 '잔차'만 TPS로 국소 보정(중심선 대비 12m 초과 코너에만 잔차 타깃, λ=0.005).

| 트랙 | 문제 코너 | 중앙 | 90% | 비고 |
|---|---|---|---|---|
| italy | T1·Parabolica·중간코너 | 7.9→1.1m | 35→7m | Parabolica·중간 TPS + **T1 진행률 도로스냅** |
| monaco | 헤어핀·S/F 등 | 3.9→1.3m | 20→6m | 헤어핀·28%·하단 도로스냅 + **S/F 런타임 진행률 스냅** |
| netherlands | Tarzan·T3 헤어핀 | 5.0→2.3m | 31→8m | Tarzan TPS + **T3 진행률 도로스냅**(27→13m) |

- **⭐ 마커가 도로 밖으로 빠지는 코너 = 진행률(호길이) 도로스냅**: 구역 진입·이탈점을 feat0에 투영하고 그 사이를 location 호길이 비율로 매핑 → 도로 위 + 매끄러운 타깃. (italy T1, netherlands T3은 캘리브 시점에 TPS로 baked, 런타임은 순수 TPS.)
- **✅ monaco S/F = 런타임 진행률 스냅(`RoadSnapService`)**: pit straight↔접근도로가 ~30m 평행이라 **TPS로는 원리적으로 분리 불가**(가까운 두 입력→먼 두 출력 불가). location **시간 순서**로 전진 제약 투영해 드라이버별 진행률을 1회 계산(평행도로는 진행률이 멀어 안 샘), 지정 구간(`[0.95,0.13]` wrap)에선 그 진행률 위치의 feat0 점에 마커 배치(경계 블렌드).
- **⚠ 인필드 겹침(netherlands T3)**: 스냅존 반경 안에 다른 트랙 구간이 들어와 엉뚱하게 끌림 → 진행률 스냅 타깃은 **존 중심 에이펙스를 포함하는 연속 통과구간만** 매핑.

### 5.4 트랙 매핑 & 캘리브 대상 (24개)

**지원 연도: 2023, 2024, 2025.** 좌표계가 `circuit_key`마다 고정 → 세 시즌 **고유 트랙 24개**만 캘리브.

| circuit_key | OpenF1 short_name | circuitId (geojson) | years |
|---|---|---|---|
| 63 | Sakhir | bahrain | 2023,2024,2025 |
| 9 | Austin | usa | 2023,2024,2025 |
| 144 | Baku | azerbaijan | 2023,2024,2025 |
| 15 | Catalunya | spain | 2023,2024,2025 |
| 4 | Hungaroring | hungary | 2023,2024,2025 |
| 6 | Imola | imola | 2023,2024,2025 |
| 14 | Interlagos | brazil | 2023,2024,2025 |
| 149 | Jeddah | saudi-arabia | 2023,2024,2025 |
| 152 | Las Vegas | las-vegas | 2023,2024,2025 |
| 150 | Lusail | qatar | 2023,2024,2025 |
| 10 | Melbourne | australia | 2023,2024,2025 |
| 65 | Mexico City | mexico | 2023,2024,2025 |
| 151 | Miami | miami | 2023,2024,2025 |
| 22 | Monte Carlo | monaco | 2023,2024,2025 |
| 23 | Montreal | canada | 2023,2024,2025 |
| 39 | Monza | italy | 2023,2024,2025 |
| 49 | Shanghai | china | 2024,2025 (2023 미개최) |
| 2 | Silverstone | britain | 2023,2024,2025 |
| 61 | Singapore | singapore | 2023,2024,2025 |
| 7 | Spa-Francorchamps | belgium | 2023,2024,2025 |
| 19 | Spielberg | austria | 2023,2024,2025 |
| 46 | Suzuka | japan | 2023,2024,2025 |
| 70 | Yas Marina Circuit | abu-dhabi | 2023,2024,2025 |
| 55 | Zandvoort | netherlands | 2023,2024,2025 |

> `madrid` GeoJSON은 보유하나 2026 신규라 범위 밖(2026 지원 시 +1).

### 5.5 캘리브 산출물 (백엔드 이관됨)
프론트 PoC 산출물은 모두 백엔드 `modules/calibration/`로 복사 이관됨:
`LocationCoordinateService`(어파인 계수)·`data/tpsCoefficients.ts`·`RoadSnapService.ZONES`·`public/data/circuits-geojson`(24개). 프론트 원본은 **mock/PoC 전용으로 격리 유지**. 변환 동일성은 백엔드 테스트(`coordinate.service.spec.ts`, 프론트 `toLngLat`와 `<1e-9` 일치)로 보장.

---

## 6. 프론트 통합 (✅ 구현 완료)

> 백엔드 positions를 **그대로 시간 보간**만 하는 경로를 추가했다(변환/스냅 호출 제거). 기존 lap 기반은 폴백 유지, 변환/스냅 코드(`LocationCoordinateService`/`RoadSnapService`/`tpsCoefficients`)는 mock/PoC 전용으로 격리.

| 파일 | 변경 | 상태 |
|---|---|---|
| `types/index.ts` | `DriverPositionSample { t, lng, lat }` 추가 | ✅ |
| `services/BackendReplayApiService.ts` | `loadPositions(sessionKey)` / `hasPositions()` 추가 (`GET /sessions/:sk/positions`) | ✅ |
| `services/PositionCalculator.ts` | `setBackendPositions` / `calcFromBackend`(이진탐색+선형보간, 변환 없음), 우선순위 분기(backend > location(PoC) > lap), `clear` 갱신 | ✅ |
| `services/ReplayAnimationEngine.ts` | `loadOpenF1Data` → `tryLoadBackendPositions` 주입 + `getTotalDuration` 반영 + cleanup 리셋 | ✅ |
| (격리) coordinate/roadsnap/tps/poc | 변경 없음, mock/PoC 전용 유지 | ✅ |

**동작/안전성**
- `tryLoadBackendPositions`는 **lap/drivers 로드 성공(=실 백엔드 사용) 이후에만** 호출되고, 실패 시 try/catch로 **lap 등속 추정 폴백**. `NEXT_PUBLIC_FORCE_MOCK_DATA=true`(강제 mock)면 `getFullRaceData`가 먼저 실패해 이 경로에 도달하지 않음 → mock/real 혼합 없음.
- 우선순위: **backend positions > location(PoC) > lap 등속**. backend가 있으면 `calcFromBackend`(변환/스냅 호출 없음).
- 검증: 프론트 `tsc --noEmit` 0 에러, ESLint 0.

핵심 보간 로직(변환·스냅 호출 없음 — 백엔드가 이미 처리):
```ts
// {t,lng,lat} 이진탐색 + 선형보간
private calcFromBackend(driverNumber, currentTime): DriverPosition | null {
  const s = this.backendPositions.get(driverNumber);
  if (!s || !s.length) return null;
  if (currentTime <= s[0].t) return makePos(s[0]);
  if (currentTime >= s[s.length-1].t) return null;            // 데이터 종료 → 마커 숨김
  let lo=0, hi=s.length-1; while(lo<hi){const m=(lo+hi)>>1; if(s[m].t<currentTime) lo=m+1; else hi=m;}
  const a=s[hi-1], b=s[hi], r=(currentTime-a.t)/(b.t-a.t||1);
  return makePos({ lng:a.lng+(b.lng-a.lng)*r, lat:a.lat+(b.lat-a.lat)*r });
}
```

**남은 검증 (시각·수동)**: 백엔드(:4000) + 프론트(:3000) 기동 후 bahrain/monaco/italy/netherlands 재생 → PoC와 동일 주행, monaco S/F·italy T1·netherlands T3 도로 이탈 없음 확인(§5.3 기준).

---

## 7. API 계약 (경계 명세 — 프론트 실제 호출 기준)

> 모든 응답 공통 래퍼 `{ success, data, timestamp }`(`ApiResponseDto`, `timestamp`는 무시 가능). 아래 `data` 스키마만 표기. **프론트 코드 기준이 진실.** 7개 계약은 백엔드 구현·정합 확인 완료, `positions`만 프론트 소비 대기.

| 메서드·경로 | data 스키마 | 프론트 소비처 | 상태 |
|---|---|---|---|
| `GET /sessions?year=&country=` | `BackendSession[]` (snake_case) | `ReplayDataService.transformBackendSessions` | ✅ |
| `GET /sessions/:sk/drivers` | `BackendDriver[]` (`teamColor`=bare hex) | `transformBackendDrivers` | ✅ |
| `GET /laps/session/:sk?driverNumber=&lapNumber=` | `BackendLap[]` | `transformBackendLaps` | ✅ |
| `GET /sessions/:sk/positions` | `PositionsResponse` | `BackendReplayApiService.loadPositions`(§6) | ✅ (시각검증 남음) |
| `GET /sessions/:sk/driver-timings` | `{ frames: DriverDisplayFrame[] }` | `loadAllDriverTimings`(`data.data.frames`) | ✅ |
| `GET /sessions/:sk/race-flags` | `RaceFlagsResponse` | `loadRaceFlags` | ✅ |
| `GET /sessions/:sk/telemetry/:driver` | `DriverTelemetryResponse` | `loadDriverTelemetry` | ✅ |
| `POST /sessions/:sk/start-replay` | `{ success: true, ... }` | `startReplaySession` | ✅ |

**계약 주의점**
- `driver-timings`만 `data` 안에 `frames` 한 겹 더(프론트 `response.data.data.frames`). 나머지는 `data`가 곧 배열/객체.
- sessions/drivers/laps는 **snake_case 또는 매핑 전 필드명**을 프론트가 그대로 읽음 → 컨트롤러 출력 키를 표와 정확히 일치시킬 것.
- **`teamColor` 규약 차이(정상)**: `/drivers`는 **bare hex**(`3671C6`, 소비처 `DriverSelector`가 `#` 부착), `/driver-timings`의 `DriverDisplayRow.teamColor`는 **`#`+hex**(소비처 `DriverInfoPanel`이 그대로 사용). 엔드포인트마다 소비처가 올바르게 처리하므로 문제 없음 — 혼동 주의.

### 경계 타입 (프론트 ↔ 백엔드 동형)
```ts
interface PositionSample { t: number; lng: number; lat: number; }
interface PositionsResponse {
  sessionKey: number; circuitId: string;
  drivers: Record<string, { samples: PositionSample[] }>;   // key = driver_number
}
// timing/flags/telemetry 인터페이스는 프론트 BackendReplayApiService 와 1:1.
```

---

## 8. 열린 질문 → 확정된 결론

- **시간축 0점**: `RaceTimeService.getRaceStartMs`(§4)로 통일. ⚠ 현재 positions만 이를 사용하고 `SessionsService`(driver-timings)는 `min(lap1)` 자체 계산 → 레드플래그 레이스에서 어긋날 수 있어 후속 통일 권장.
- **location 결측**(피트인/사고): 갭 큰 구간은 프론트 선형보간 유지. 데이터 종료 후 마커 숨김.
- **데이터량/성능**: 다운샘플(코너 적응형) + 드라이버별 정렬배열·이진탐색. 풀레이스 응답 크기(gzip 수 MB 가능)는 다운샘플 Hz·레이스 윈도우로 조정(백엔드 `plan.md` §6.6).
- **고도(z)**: 2D 맵이라 미사용.
