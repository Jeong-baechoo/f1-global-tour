/**
 * 백엔드 좌표 변환 동일성 테스트(게이트)용 golden 픽스처 생성기.
 *
 * 프론트 LocationCoordinateService.toLngLat 를 진실값으로 삼아, PoC location(x,y) 입력에 대한
 * (lng,lat) 결과를 backend test 픽스처로 덤프한다. 백엔드 coordinate.service 가 이 값을
 * < 1e-9 로 재현하지 못하면(계수 복사 오타 등) 백엔드 테스트가 실패한다.
 *
 * 실행: npx tsx scripts/gen-coordinate-golden.ts
 */
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { LocationCoordinateService } from '../src/features/replay/services/LocationCoordinateService';

const POC_DIR = join(__dirname, '..', 'public', 'data', 'replay-poc');
const OUT = join(
  __dirname,
  '..',
  '..',
  'f1-global-tour-backend',
  'test',
  'fixtures',
  'coordinate-golden.json',
);

// 트랙당 표본 점 수(공간 커버리지 — TPS RBF 가 공간적으로 변하므로 랩 전체에 고르게 분포시킴).
const SAMPLES_PER_TRACK = 200;

interface GoldenRow {
  circuitId: string;
  x: number;
  y: number;
  lng: number;
  lat: number;
}

const rows: GoldenRow[] = [];
const summary: Record<string, number> = {};

for (const file of readdirSync(POC_DIR).filter((f) => f.endsWith('.json'))) {
  const poc = JSON.parse(readFileSync(join(POC_DIR, file), 'utf8')) as {
    circuitId: string;
    drivers: Record<string, { x: number; y: number }[]>;
  };
  const circuitId = poc.circuitId;
  if (!LocationCoordinateService.hasCalibration(circuitId)) {
    console.warn(`skip ${circuitId}: no calibration`);
    continue;
  }

  // 모든 드라이버의 (x,y) 를 모아 일정 간격으로 표본 추출(랩 전체 커버).
  const pts: { x: number; y: number }[] = [];
  for (const samples of Object.values(poc.drivers)) {
    for (const s of samples) pts.push({ x: s.x, y: s.y });
  }
  const stride = Math.max(1, Math.floor(pts.length / SAMPLES_PER_TRACK));
  let count = 0;
  for (let i = 0; i < pts.length; i += stride) {
    const { x, y } = pts[i];
    const ll = LocationCoordinateService.toLngLat(circuitId, x, y);
    if (!ll) continue;
    rows.push({ circuitId, x, y, lng: ll[0], lat: ll[1] });
    count++;
  }
  summary[circuitId] = count;
}

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(rows));
console.log(`golden rows: ${rows.length} → ${OUT}`);
console.log('per-track:', summary);
