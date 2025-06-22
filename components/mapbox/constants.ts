// Map configuration constants
export const MAP_CONFIG = {
  style: 'mapbox://styles/mapbox/dark-v11',
  center: [0, 20] as [number, number],
  zoom: 1.5,
  projection: { name: 'globe' as const }
};

export const ANIMATION_CONFIG = {
  spinEnabled: true,
  secondsPerRevolution: 240,
  maxSpinZoom: 5,
  slowSpinZoom: 3,
  trackAnimationDuration: 3000,
  rotationSpeed: 0.07
};

export const FOG_CONFIG = {
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

// Marker styles
export const MARKER_STYLES = {
  redBullMarker: {
    width: '80px',
    height: '95px',
    boxWidth: '80px',
    boxHeight: '80px',
    borderRadius: '4px',
    border: '3px solid #1e3a8a',
    backgroundColor: 'white'
  },
  nextRaceMarker: {
    width: '60px',
    height: '60px',
    backgroundColor: '#FF1801',
    borderRadius: '50%',
    border: '3px solid #FFFFFF'
  },
  circuitMarker: {
    width: '60px',
    height: '60px',
    backgroundColor: '#1e293b',
    borderRadius: '50%',
    border: '3px solid #dc2626'
  }
};
