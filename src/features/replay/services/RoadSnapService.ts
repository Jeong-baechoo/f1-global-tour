import { DriverLocationSample } from '../types';
import { LocationCoordinateService } from './LocationCoordinateService';

/**
 * 런타임 진행률(progress) 기반 도로 스냅.
 *
 * 목적: 평행한 두 도로가 가까이 붙은 구간(예: monaco 출발선 — pit straight와 접근도로가 ~30m 평행)에서
 * 마커가 옆 도로로 새는(진행률이 4%↔77%로 튀는) 문제 해결. TPS(매끄러운 좌표 변환)는
 * "가까운 두 입력 → 멀리 떨어진 두 출력"을 못 만들어 원리적으로 이 분리가 불가능하다.
 *
 * 해법: location 시계열의 '시간 순서'를 이용해 **전진 제약 투영**으로 드라이버별 진행률을 1회 계산한다.
 * 진행률은 시간에 따라 단조 증가(랩 경계서 wrap)하므로 평행 도로(진행률이 멀리 떨어짐)로 절대 안 샌다.
 * 지정한 진행률 구간(zone)에서는 그 진행률 위치의 도로(feat0) 점에 마커를 올린다(경계는 블렌드).
 */

interface ProgressSample { t: number; arc: number } // arc: 트랙 시작부터 호 길이(m)
interface Zone { start: number; end: number }        // 진행률 0-1 (end<start면 S/F wrap 구간)

export class RoadSnapService {
  // 트랙별 스냅 구간(진행률 0-1). 평행 도로로 마커가 새는 구간만 지정.
  private static readonly ZONES: Record<string, Zone[]> = {
    // monaco: 마지막코너~pit straight (S/F 평행구간). end<start = S/F 횡단.
    monaco: [{ start: 0.95, end: 0.13 }],
  };
  private static readonly BLEND = 0.02;   // 구간 경계 블렌드 폭(진행률) ≈ 트랙길이의 2%
  private static readonly BACK_M = 35;    // 전진 제약: 뒤로 허용(노이즈)
  private static readonly FWD_M = 220;    // 전진 제약: 앞으로 허용(데이터 갭 대비, 평행도로보다는 작게)

  private circuitId = '';
  private zones: Zone[] = [];
  private tm: [number, number][] = [];    // feat0 좌표를 로컬 미터로 변환한 점들
  private cum: number[] = [];             // 각 점까지 누적 호 길이(m)
  private total = 0;
  private kx = 1;                          // 경도 미터 환산 계수 cos(lat)
  private progress = new Map<number, ProgressSample[]>();
  private ready = false;

  /** location 데이터 주입 시 호출. feat0 로드 + 드라이버별 진행률 사전계산(비동기). */
  async prepare(circuitId: string, locationByDriver: Map<number, DriverLocationSample[]>): Promise<void> {
    this.ready = false;
    this.circuitId = circuitId;
    this.zones = RoadSnapService.ZONES[circuitId] ?? [];
    this.progress = new Map();
    if (this.zones.length === 0) return; // 이 트랙은 런타임 스냅 불필요

    const track = await this.loadTrack(circuitId);
    if (!track || track.length < 2) return;

    const meanLat = track.reduce((s, p) => s + p[1], 0) / track.length;
    this.kx = Math.cos((meanLat * Math.PI) / 180);
    this.tm = track.map(([lng, lat]) => [lng * this.kx * 111320, lat * 111320]);
    this.cum = [0];
    for (let i = 1; i < this.tm.length; i++) {
      const dx = this.tm[i][0] - this.tm[i - 1][0];
      const dy = this.tm[i][1] - this.tm[i - 1][1];
      this.cum.push(this.cum[i - 1] + Math.hypot(dx, dy));
    }
    this.total = this.cum[this.cum.length - 1];

    // 드라이버별 진행률: 시간순 전진 제약 투영
    for (const [driverNumber, samples] of locationByDriver) {
      const arr: ProgressSample[] = [];
      let prev = -1;
      for (const s of samples) {
        const coords = LocationCoordinateService.toLngLat(circuitId, s.x, s.y);
        if (!coords) { arr.push({ t: s.t, arc: prev < 0 ? 0 : prev }); continue; }
        const arc = prev < 0 ? this.project(coords[0], coords[1]) : this.projectForward(coords[0], coords[1], prev);
        arr.push({ t: s.t, arc });
        prev = arc;
      }
      this.progress.set(driverNumber, arr);
    }
    this.ready = true;
  }

  clear(): void {
    this.ready = false;
    this.progress = new Map();
    this.zones = [];
    this.tm = [];
    this.cum = [];
  }

  /** 스냅 구간이면 진행률 위치의 도로 점(경계 블렌드), 아니면 fallback 그대로. */
  snap(driverNumber: number, currentTime: number, fallback: [number, number]): [number, number] {
    if (!this.ready) return fallback;
    const arr = this.progress.get(driverNumber);
    if (!arr || arr.length < 2) return fallback;

    const arc = this.interpArc(arr, currentTime);
    if (arc < 0) return fallback;
    const blend = this.zoneBlend(arc / this.total);
    if (blend <= 0) return fallback;

    const road = this.posAtArc(arc);
    if (blend >= 1) return road;
    return [
      fallback[0] + (road[0] - fallback[0]) * blend,
      fallback[1] + (road[1] - fallback[1]) * blend,
    ];
  }

  // currentTime 기준 진행률(호 길이) 보간. wrap 처리.
  private interpArc(arr: ProgressSample[], t: number): number {
    if (t <= arr[0].t) return arr[0].arc;
    if (t >= arr[arr.length - 1].t) return -1; // 데이터 종료 후
    let lo = 0, hi = arr.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (arr[mid].t < t) lo = mid + 1; else hi = mid;
    }
    const a0 = arr[hi - 1], a1 = arr[hi];
    const span = a1.t - a0.t;
    const r = span > 0 ? (t - a0.t) / span : 0;
    const p0 = a0.arc; let p1 = a1.arc;
    if (p1 - p0 > this.total / 2) p1 -= this.total;        // 역방향 wrap 보정
    else if (p0 - p1 > this.total / 2) p1 += this.total;   // S/F 횡단
    let p = p0 + (p1 - p0) * r;
    p = ((p % this.total) + this.total) % this.total;
    return p;
  }

  // 진행률 frac(0-1)이 스냅 구간 안이면 1, 경계 BLEND 폭에서 0~1, 밖이면 0
  private zoneBlend(frac: number): number {
    let best = 0;
    for (const z of this.zones) {
      const d = this.insideDepth(frac, z); // 구간 안쪽 깊이(진행률), 밖이면 음수
      if (d <= 0) continue;
      best = Math.max(best, Math.min(1, d / RoadSnapService.BLEND));
    }
    return best;
  }

  // frac이 구간[z.start,z.end](wrap 가능) 안이면 가장 가까운 경계까지 거리, 밖이면 -1
  private insideDepth(frac: number, z: Zone): number {
    const inside = z.end >= z.start
      ? (frac >= z.start && frac <= z.end)
      : (frac >= z.start || frac <= z.end);
    if (!inside) return -1;
    const distTo = (a: number, b: number) => { const d = Math.abs(a - b); return Math.min(d, 1 - d); };
    return Math.min(distTo(frac, z.start), distTo(frac, z.end));
  }

  // 호 길이 arc 위치의 feat0 좌표(원본 lng,lat). 미터→다시 lng,lat 변환.
  private posAtArc(arc: number): [number, number] {
    let lo = 0, hi = this.cum.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (this.cum[mid] < arc) lo = mid + 1; else hi = mid;
    }
    const i = Math.max(1, hi);
    const segLen = this.cum[i] - this.cum[i - 1];
    const r = segLen > 0 ? (arc - this.cum[i - 1]) / segLen : 0;
    const mx = this.tm[i - 1][0] + (this.tm[i][0] - this.tm[i - 1][0]) * r;
    const my = this.tm[i - 1][1] + (this.tm[i][1] - this.tm[i - 1][1]) * r;
    return [mx / (this.kx * 111320), my / 111320];
  }

  // 점(lng,lat)을 feat0에 투영한 호 길이(전역 최근접)
  private project(lng: number, lat: number): number {
    return this.projectImpl(lng, lat, null);
  }
  // 전진 제약(prevArc 기준 [-BACK, +FWD] 안)에서 최근접 호 길이
  private projectForward(lng: number, lat: number, prevArc: number): number {
    const arc = this.projectImpl(lng, lat, prevArc);
    return arc < 0 ? prevArc : arc;
  }

  private projectImpl(lng: number, lat: number, prevArc: number | null): number {
    const px = lng * this.kx * 111320, py = lat * 111320;
    let bestArc = -1, bestD = Infinity;
    for (let i = 0; i < this.tm.length - 1; i++) {
      const ax = this.tm[i][0], ay = this.tm[i][1];
      const bx = this.tm[i + 1][0], by = this.tm[i + 1][1];
      const abx = bx - ax, aby = by - ay;
      const ab2 = abx * abx + aby * aby || 1e-9;
      let t = ((px - ax) * abx + (py - ay) * aby) / ab2;
      t = t < 0 ? 0 : t > 1 ? 1 : t;
      const cx = ax + abx * t, cy = ay + aby * t;
      const d = (cx - px) * (cx - px) + (cy - py) * (cy - py);
      const arc = this.cum[i] + (this.cum[i + 1] - this.cum[i]) * t;
      if (prevArc !== null) {
        let fd = ((arc - prevArc) % this.total + this.total) % this.total; // 전진 거리(0..total)
        if (fd > this.total / 2) fd -= this.total;                          // [-total/2, total/2]
        if (fd < -RoadSnapService.BACK_M || fd > RoadSnapService.FWD_M) continue;
      }
      if (d < bestD) { bestD = d; bestArc = arc; }
    }
    return bestArc;
  }

  private async loadTrack(circuitId: string): Promise<[number, number][] | null> {
    try {
      const res = await fetch(`/data/circuits-geojson/${circuitId}.geojson`);
      const gj = await res.json();
      const coords = gj?.features?.[0]?.geometry?.coordinates;
      return Array.isArray(coords) ? (coords as [number, number][]) : null;
    } catch {
      return null;
    }
  }
}
