import { AffineCoefficients, QuadraticCoefficients, TpsCoefficients } from '../types';
import { TPS_COEFFICIENTS } from '../data/tpsCoefficients';

/**
 * OpenF1 location (x, y) 로컬 좌표를 위경도(lng, lat)로 변환한다.
 *
 * 트랙마다 변환 구조가 다를 수 있다 (우선순위: TPS > 2차 > 어파인):
 *   - 어파인 (대부분):   lng = a*x + b*y + e,  lat = c*x + d*y + f
 *   - 2차 다항식 (일부):  어파인으로 안 잡히는 전역 비선형 왜곡
 *   - TPS (일부):        특정 코너(뱅킹·far-corner 왜곡)가 전역 변환으로 안 잡히는 트랙.
 *                        base 어파인 + 국소 RBF 잔차 보정 (italy/monaco/netherlands)
 *
 * 계수는 OpenF1 location 점군 ↔ GeoJSON 트랙 라인을 정합(FFT+ICP)한 뒤
 * 최소제곱으로 캘리브레이션한 값이다 (replay-refactor.md 참고).
 */
export class LocationCoordinateService {
  // TPS 트랙 (특정 코너 국소 보정). 모든 변환보다 우선.
  private static readonly TPS: Record<string, TpsCoefficients> = TPS_COEFFICIENTS;

  // 2차 다항식 트랙 (어파인으로 부족한 경우). 어파인보다 우선.
  // 확장 예비: 현재 등록된 트랙 없음(italy/netherlands는 TPS로 이전됨). 어파인으로는 안 잡히지만
  // TPS까지는 불필요한 트랙이 나오면 여기에 추가한다. toLngLat의 2차 분기/applyQuad는 그대로 유지.
  private static readonly QUADRATIC: Record<string, QuadraticCoefficients> = {};

  // 트랙별 어파인 계수
  private static readonly COEFFICIENTS: Record<string, AffineCoefficients> = {
    bahrain: {
      a: 9.422545288190283e-7,
      b: 9.116238373717799e-9,
      e: 50.51082234031239,
      c: -9.876260837491282e-9,
      d: 9.127431859719696e-7,
      f: 26.02925814797611,
    },
    // 깨끗한 1랩 + ICP 미세조정으로 정합 (중앙값 ~3m).
    belgium: {
      a: 1.4146120846e-6, b: 6.9674517578e-8, e: 5.966556,
      c: -3.7650307919e-8, d: 8.9437036713e-7, f: 50.441959,
    },
    // 아래 13개는 자동 정합(4랩) 계수 — PoC로 육안 확인 후 픽스 진행 중.
    singapore: {
      a: 8.9502326107e-7, b: -9.7458027316e-9, e: 103.863401,
      c: 8.4077045365e-9, d: 9.0272703035e-7, f: 1.291113,
    },
    brazil: {
      a: 9.5056804140e-7, b: 6.5931807100e-9, e: -46.696453,
      c: -1.4575104102e-8, d: 9.1551874568e-7, f: -23.698719,
    },
    'saudi-arabia': {
      a: 9.5836147196e-7, b: -9.5621232927e-10, e: 39.106465,
      c: 1.3563367246e-8, d: 9.0695859450e-7, f: 21.630462,
    },
    japan: {
      a: 1.0321608650e-6, b: -6.7631930195e-8, e: 136.536662,
      c: 2.4081602921e-8, d: 9.6856472975e-7, f: 34.845869,
    },
    usa: {
      a: 9.8371618484e-7, b: 3.2557318505e-8, e: -97.640497,
      c: -3.0108391694e-8, d: 9.4315572664e-7, f: 30.133725,
    },
    mexico: {
      a: 9.3988221403e-7, b: -7.6819037734e-9, e: -99.094465,
      c: 5.1117144095e-9, d: 9.1656562414e-7, f: 19.405232,
    },
    miami: {
      a: 9.5939080980e-7, b: 1.0333587427e-8, e: -80.240197,
      c: -9.1578826576e-9, d: 9.1277846667e-7, f: 25.959628,
    },
    'abu-dhabi': {
      a: 9.4475499136e-7, b: -1.5131257973e-8, e: 54.603850,
      c: 2.3158213819e-8, d: 9.2107996844e-7, f: 24.467946,
    },
    // 아래 4개(spain·monaco·azerbaijan·italy)는 1랩+ICP 미세조정 재정합 (중앙값 ~3-8m).
    spain: {
      a: 1.1625466946e-6, b: 1.2848606147e-8, e: 2.260102,
      c: -3.8045293714e-8, d: 9.2744259687e-7, f: 41.570895,
    },
    monaco: {
      a: 1.0564962176e-6, b: 1.2394615321e-7, e: 7.430636,
      c: -1.4640109517e-8, d: 9.1095227201e-7, f: 43.741203,
    },
    azerbaijan: {
      a: 1.1758147503e-6, b: -3.1105640316e-8, e: 49.850633,
      c: 1.4978353756e-8, d: 8.9266434393e-7, f: 40.372744,
    },
    qatar: {
      a: 9.4676600170e-7, b: -2.7301365560e-9, e: 51.452034,
      c: 1.5202016987e-8, d: 9.2169890552e-7, f: 25.487869,
    },
    // 1랩 + ICP 미세조정 재캘리브 (중앙 ~2.2m)
    hungary: {
      a: 1.3390797063e-6, b: -2.5571105289e-8, e: 19.250515,
      c: 1.2239741700e-8, d: 8.9817238328e-7, f: 47.578946,
    },
    // 1랩 + ICP 재캘리브 (중앙 3.1m)
    austria: {
      a: 1.3295726510e-6, b: 2.8810302591e-8, e: 14.764911,
      c: -1.1068930278e-8, d: 8.6756071335e-7, f: 47.221378,
    },
    // 1랩 + ICP 재캘리브 (중앙 1.6m)
    canada: {
      a: 1.2763408932e-6, b: 2.5507802480e-8, e: -73.526978,
      c: -2.5951089134e-8, d: 8.9886589490e-7, f: 45.499220,
    },
    // 사용자 수정 GeoJSON(Sector 합성 메인트랙)으로 재캘리브 (중앙 5.2m)
    'las-vegas': {
      a: 1.0871664105e-6, b: 2.8115775316e-8, e: -115.164641,
      c: -6.1400768426e-8, d: 9.0360398053e-7, f: 36.109508,
    },
    // 1랩 + ICP 재캘리브 (중앙 2.6m)
    china: {
      a: 1.0530589012e-6, b: -1.8655657438e-8, e: 121.222077,
      c: 1.2972749742e-8, d: 9.0581618187e-7, f: 31.339009,
    },
    // 1랩 + ICP 재캘리브 (중앙 2.7m)
    australia: {
      a: 1.1402750545e-6, b: 2.7977735011e-8, e: 144.970176,
      c: -2.7460811574e-8, d: 8.9723806334e-7, f: -37.848729,
    },
    // 1랩 + ICP 재캘리브 (중앙 2.5m)
    imola: {
      a: 1.2451476161e-6, b: 2.8969150380e-8, e: 11.721026,
      c: -3.3259160178e-8, d: 8.9922836671e-7, f: 44.345376,
    },
    // 1랩 + ICP 재캘리브 (중앙 4.0m, 4랩 degenerate를 1랩으로 해결)
    britain: {
      a: 1.4456725582e-6, b: 1.8736109902e-8, e: -1.020663,
      c: -2.2207749409e-8, d: 8.8321790690e-7, f: 52.067431,
    },
    // italy, netherlands는 2차 다항식(QUADRATIC) 사용
  };

  static hasCalibration(circuitId: string): boolean {
    return circuitId in LocationCoordinateService.TPS
      || circuitId in LocationCoordinateService.QUADRATIC
      || circuitId in LocationCoordinateService.COEFFICIENTS;
  }

  static getCoefficients(circuitId: string): AffineCoefficients | null {
    return LocationCoordinateService.COEFFICIENTS[circuitId] ?? null;
  }

  /** OpenF1 (x, y) -> [lng, lat]. 우선순위 TPS > 2차 > 어파인. 계수 없으면 null. */
  static toLngLat(circuitId: string, x: number, y: number): [number, number] | null {
    // 손상된 좌표(NaN/Infinity) 방어 — 어파인/TPS 결과가 NaN이 되어 Mapbox 마커가 오동작함
    if (!Number.isFinite(x) || !Number.isFinite(y)) return null;

    const tps = LocationCoordinateService.TPS[circuitId];
    if (tps) return LocationCoordinateService.applyTps(tps, x, y);

    const q = LocationCoordinateService.QUADRATIC[circuitId];
    if (q) {
      return [
        LocationCoordinateService.applyQuad(q.lng, x, y),
        LocationCoordinateService.applyQuad(q.lat, x, y),
      ];
    }
    const c = LocationCoordinateService.COEFFICIENTS[circuitId];
    if (!c) return null;
    const lng = c.a * x + c.b * y + c.e;
    const lat = c.c * x + c.d * y + c.f;
    return [lng, lat];
  }

  // value = [x, y, x², y², xy, 1] 계수
  private static applyQuad(k: QuadraticCoefficients['lng'], x: number, y: number): number {
    return k[0] * x + k[1] * y + k[2] * x * x + k[3] * y * y + k[4] * x * y + k[5];
  }

  // base 어파인 + 국소 RBF 잔차. U(r)=r²·ln r (r은 정규화 좌표계 거리).
  private static applyTps(t: TpsCoefficients, x: number, y: number): [number, number] {
    const { affine: af, norm, controls, lng, lat } = t;
    const xn = (x - norm.cx) / norm.s;
    const yn = (y - norm.cy) / norm.s;

    let resLng = lng.a[0] + lng.a[1] * xn + lng.a[2] * yn;
    let resLat = lat.a[0] + lat.a[1] * xn + lat.a[2] * yn;
    for (let i = 0; i < controls.length; i++) {
      const dx = xn - controls[i][0];
      const dy = yn - controls[i][1];
      const r2 = dx * dx + dy * dy;
      const u = r2 > 1e-12 ? 0.5 * r2 * Math.log(r2) : 0; // r²·ln r = ½·r²·ln(r²)
      resLng += lng.w[i] * u;
      resLat += lat.w[i] * u;
    }

    const baseLng = af.a * x + af.b * y + af.e;
    const baseLat = af.c * x + af.d * y + af.f;
    return [baseLng + resLng, baseLat + resLat];
  }
}
