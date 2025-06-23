interface AnimationPreset {
  zoom: number;
  pitch: number;
  speed: number;
  curve: number;
  essential: boolean;
  bearing?: number;
  duration?: number;
  center?: [number, number];
}

type PresetFunction = (isMobile: boolean) => AnimationPreset;

export const ANIMATION_PRESETS: Record<string, PresetFunction> = {
  // 팀 본사 보기
  teamHQ: (isMobile: boolean) => ({
    zoom: isMobile ? 15 : 18,
    pitch: 45,
    speed: 0.6,
    curve: 1,
    essential: true,
    bearing: 0
  }),
  
  // 서킷 전체 보기
  circuit: (isMobile: boolean) => ({
    zoom: isMobile ? 13 : 15,
    pitch: 60,  // 70에서 60으로 감소
    speed: 1.2,
    curve: 1.2,
    essential: true,
    bearing: 0
  }),
  
  // 시네마틱 서킷 뷰
  cinematicCircuit: (isMobile: boolean) => ({
    zoom: isMobile ? 14 : 16,
    pitch: 65,  // 75에서 65로 감소
    speed: 0.3,
    curve: 1,
    essential: true,
    duration: 12000
  }),
  
  // 부드러운 이동
  gentle: (isMobile: boolean) => ({
    zoom: isMobile ? 2 : 6,
    pitch: 30,
    speed: 0.8,
    curve: 1,
    essential: true
  }),
  
  // 빠른 이동
  quick: (isMobile: boolean) => ({
    zoom: isMobile ? 10 : 12,
    pitch: 0,
    speed: 2,
    curve: 1.5,
    essential: true
  }),
  
  // 글로벌 뷰
  global: (isMobile: boolean) => ({
    zoom: isMobile ? 1 : 2,
    pitch: 0,
    speed: 0.5,
    curve: 1.2,
    essential: true,
    bearing: 0
  }),
  
  // 지역 뷰
  regional: (isMobile: boolean) => ({
    zoom: isMobile ? 4 : 5,
    pitch: 15,
    speed: 1,
    curve: 1,
    essential: true
  }),
  
  // 상세 뷰 (건물/트랙 세부사항)
  detailed: (isMobile: boolean) => ({
    zoom: isMobile ? 17 : 19,
    pitch: 60,
    speed: 0.4,
    curve: 0.8,
    essential: true
  })
};

// 프리셋 조합 헬퍼 함수
export const combinePresets = (
  basePreset: PresetFunction,
  overrides: Partial<AnimationPreset>
): PresetFunction => {
  return (isMobile: boolean) => ({
    ...basePreset(isMobile),
    ...overrides
  });
};

// 커스텀 애니메이션 생성 헬퍼
export const createCustomAnimation = (
  center: [number, number],
  preset: PresetFunction | string,
  isMobile: boolean,
  additionalOptions?: Partial<AnimationPreset>
): AnimationPreset & { center: [number, number] } => {
  const presetOptions = typeof preset === 'string' 
    ? ANIMATION_PRESETS[preset](isMobile)
    : preset(isMobile);
    
  return {
    center,
    ...presetOptions,
    ...additionalOptions
  };
};