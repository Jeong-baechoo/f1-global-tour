import { AffineCoefficients, QuadraticCoefficients } from '../types';

/**
 * OpenF1 location (x, y) 로컬 좌표를 위경도(lng, lat)로 변환한다.
 *
 * 트랙마다 변환 구조가 다를 수 있다:
 *   - 어파인 (대부분):   lng = a*x + b*y + e,  lat = c*x + d*y + f
 *   - 2차 다항식 (일부):  어파인으로 안 잡히는 비선형 왜곡이 있는 트랙(예: italy)
 *
 * 계수는 OpenF1 location 점군 ↔ GeoJSON 트랙 라인을 정합(FFT+ICP)한 뒤
 * 최소제곱으로 캘리브레이션한 값이다 (replay-refactor.md 참고).
 * 한 트랙이 QUADRATIC에 있으면 그 변환을 우선 사용한다.
 */
export class LocationCoordinateService {
  // 2차 다항식 트랙 (어파인으로 부족한 경우). 어파인보다 우선.
  private static readonly QUADRATIC: Record<string, QuadraticCoefficients> = {
    // italy(Monza): 어파인 중앙 7.7m → 2차 4.9m. value=[x,y,x²,y²,xy,1]
    italy: {
      lng: [1.3015010707e-6, 7.0992364428e-9, -2.7647351559e-12, -1.2362006213e-13, -7.5592596595e-15, 9.28272464],
      lat: [-9.3161579218e-8, 8.8030477663e-7, 3.7573011426e-12, 7.4049351553e-14, -2.5516968397e-13, 45.61783524],
    },
  };

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
    // italy는 2차 다항식(QUADRATIC) 사용
  };

  static hasCalibration(circuitId: string): boolean {
    return circuitId in LocationCoordinateService.QUADRATIC
      || circuitId in LocationCoordinateService.COEFFICIENTS;
  }

  static getCoefficients(circuitId: string): AffineCoefficients | null {
    return LocationCoordinateService.COEFFICIENTS[circuitId] ?? null;
  }

  /** OpenF1 (x, y) -> [lng, lat]. 2차 트랙이면 2차, 아니면 어파인. 계수 없으면 null. */
  static toLngLat(circuitId: string, x: number, y: number): [number, number] | null {
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
}
