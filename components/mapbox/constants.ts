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

export const FOG_CONFIG = {
  range: [0.5, 10] as [number, number],
  color: 'white',
  'high-color': '#245cdf',
  'space-color': 'black',
  'star-intensity': 0.5
} as const;

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


// Animation speeds - 카메라 이동 속도 설정
export const ANIMATION_SPEEDS = {
  flyTo: 0.6,        // 일반 flyTo 속도
  flyToGentle: 0.8,  // 부드러운 flyTo 속도
  flyToReset: 0.8,   // 리셋 시 flyTo 속도
  curve: 1           // 곡선 정도
} as const;


// Map pitch angles - 카메라 기울기 설정
export const PITCH_ANGLES = {
  default: 0,   // 기본 (평면)
  circuit: 30,  // 서킷 뷰
  teamHQ: 45    // 팀 본부 뷰
} as const;



// Timeouts
export const TIMEOUTS = {
  markerDelay: 100
};

