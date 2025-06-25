// Map configuration constants
export const MAP_CONFIG = {
  style: 'mapbox://styles/mapbox/dark-v11',
  center: [0, 20] as [number, number],
  zoom: 1.5,
  projection: { name: 'globe' as const }
} as const;

export const ANIMATION_CONFIG = {
  spinEnabled: true,
  secondsPerRevolution: 240,
  maxSpinZoom: 5,
  slowSpinZoom: 3,
  trackAnimationDuration: 11000,
  rotationSpeed: 0.07
} as const;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const FOG_CONFIG: any = {
  range: [0.5, 10] as [number, number],
  color: 'white',
  'high-color': '#245cdf',
  'space-color': 'black',
  'star-intensity': 0.5
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const SKY_LAYER_CONFIG: any = {
  id: 'sky',
  type: 'sky',
  paint: {
    'sky-type': 'gradient',
    'sky-gradient': [
      'interpolate',
      ['linear'],
      ['sky-radial-progress'],
      0.8,
      'rgba(135, 206, 235, 1)',
      1,
      'rgba(0, 0, 0, 0.1)'
    ]
  }
};

export const LAYERS_TO_REMOVE = [
  'country-label',
  'state-label',
  'settlement-label',
  'settlement-subdivision-label',
  'airport-label',
  'poi-label',
  'water-label',
  'place-label',
  'road-label',
  'transit-label'
];

// Zoom levels
export const ZOOM_LEVELS = {
  globe: 1.5,
  country: 5,
  region: 10,
  circuit: 14,
  teamHQ: {
    mobile: 15,
    desktop: 18
  },
  circuitView: {
    mobile: 2,
    desktop: 6
  }
};

// Circuit marker visibility settings
export const CIRCUIT_MARKER_VISIBILITY = {
  startFade: 11.5,      // 줌 레벨 11.5부터 페이드 시작 (지역 레벨)
  completelyHidden: 13.5, // 줌 레벨 13.5에서 완전히 숨김 (도시 레벨)
  minOpacityForClick: 0.3 // opacity가 0.3 이하일 때 클릭 비활성화
} as const;

// Animation speeds - 카메라 이동 속도 설정
export const ANIMATION_SPEEDS = {
  flyTo: 0.6,        // 일반 flyTo 속도
  flyToGentle: 0.8,  // 부드러운 flyTo 속도
  flyToReset: 0.8,   // 리셋 시 flyTo 속도
  curve: 1           // 곡선 정도
} as const;

// Terrain exaggeration - 지형 높이 과장 설정
export const TERRAIN_EXAGGERATION = {
  far: 2.0,        // zoom < 5 (글로브 뷰)
  medium: 1.5,     // zoom >= 10 (상세 뷰)
  transition: 0.1  // 줌 레벨 5-10 사이의 전환 단계
} as const;

// Map pitch angles - 카메라 기울기 설정
export const PITCH_ANGLES = {
  default: 0,   // 기본 (평면)
  circuit: 30,  // 서킷 뷰
  teamHQ: 45    // 팀 본부 뷰
} as const;

// Marker styles
export const MARKER_STYLES = {
  redBullMarker: {
    width: '80px',
    height: '95px',
    boxWidth: '80px',
    boxHeight: '80px',
    borderRadius: '4px',
    border: '3px solid #1e3a8a',
    backgroundColor: 'white',
    // Mobile sizes
    mobileWidth: '60px',
    mobileHeight: '71px',
    mobileBoxWidth: '60px',
    mobileBoxHeight: '60px'
  },
  nextRaceMarker: {
    width: '60px',
    height: '60px',
    backgroundColor: '#FF1801',
    borderRadius: '50%',
    border: '3px solid #FFFFFF',
    // Mobile sizes
    mobileWidth: '45px',
    mobileHeight: '45px'
  },
  circuitMarker: {
    width: '60px',
    height: '60px',
    backgroundColor: '#1e293b',
    borderRadius: '50%',
    border: '3px solid #dc2626',
    // Mobile sizes
    mobileWidth: '45px',
    mobileHeight: '45px'
  }
};

// Special coordinates
export const SPECIAL_COORDINATES = {
  redBull: [-0.689, 52.0092] as [number, number]
};

// Timeouts
export const TIMEOUTS = {
  markerDelay: 100
};

// Terrain configuration
export const TERRAIN_CONFIG = {
  source: 'mapbox-dem',
  sourceConfig: {
    type: 'raster-dem' as const,
    url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
    tileSize: 512,
    maxzoom: 14
  },
  initialExaggeration: 1.8
};
