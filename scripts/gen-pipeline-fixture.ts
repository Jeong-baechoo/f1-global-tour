/**
 * positions 파이프라인 게이트(2a)용 픽스처 생성기.
 *
 * PoC 의 **연속 주행** {t,x,y}(한 드라이버) + 프론트 변환 (lng,lat) 를 덤프한다.
 * (golden 픽스처는 여러 드라이버를 stride 표본해 연속 궤적이 아니므로 파이프라인 입력에 부적합.)
 *
 * 실행: npx tsx scripts/gen-pipeline-fixture.ts
 */
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { LocationCoordinateService } from '../src/features/replay/services/LocationCoordinateService';

const POC_DIR = join(__dirname, '..', 'public', 'data', 'replay-poc');
const OUT_DIR = join(
  __dirname,
  '..',
  '..',
  'f1-global-tour-backend',
  'test',
  'fixtures',
);

interface Sample {
  t: number;
  x: number;
  y: number;
}

function pocFile(name: string): string {
  return join(POC_DIR, name);
}

// 가장 표본이 많은 드라이버의 연속 시계열 반환
function pickLongestDriver(pocPath: string): { driver: number; samples: Sample[] } {
  const poc = JSON.parse(readFileSync(pocPath, 'utf8')) as {
    drivers: Record<string, Sample[]>;
  };
  let best = -1;
  let bestSamples: Sample[] = [];
  for (const [num, samples] of Object.entries(poc.drivers)) {
    if (samples.length > bestSamples.length) {
      best = Number(num);
      bestSamples = samples;
    }
  }
  return { driver: best, samples: bestSamples };
}

mkdirSync(OUT_DIR, { recursive: true });

// ── bahrain: 연속 궤적 + 기대 (lng,lat) (어파인, 스냅 없음) ──
{
  const { driver, samples } = pickLongestDriver(pocFile('bahrain-9472.json'));
  const rows = samples.map((s) => {
    const ll = LocationCoordinateService.toLngLat('bahrain', s.x, s.y)!;
    return { t: s.t, x: s.x, y: s.y, lng: ll[0], lat: ll[1] };
  });
  const out = join(OUT_DIR, 'pipeline-bahrain.json');
  writeFileSync(
    out,
    JSON.stringify({ sessionKey: 9472, circuitId: 'bahrain', driver, rows }),
  );
  console.log(`bahrain: driver=${driver} rows=${rows.length} → ${out}`);
}

// ── monaco: 연속 궤적 {t,x,y} (도로스냅 검증용; 기대값은 백엔드 테스트에서 계산) ──
{
  const { driver, samples } = pickLongestDriver(pocFile('monaco-9523.json'));
  const rows = samples.map((s) => ({ t: s.t, x: s.x, y: s.y }));
  const out = join(OUT_DIR, 'pipeline-monaco.json');
  writeFileSync(
    out,
    JSON.stringify({ sessionKey: 9523, circuitId: 'monaco', driver, rows }),
  );
  console.log(`monaco: driver=${driver} rows=${rows.length} → ${out}`);
}

void dirname;
