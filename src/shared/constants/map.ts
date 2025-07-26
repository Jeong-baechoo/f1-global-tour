// Map configuration constants

// Map pitch angles - camera tilt settings
export const PITCH_ANGLES = {
  default: 0,   // Default (flat)
  circuit: 30,  // Circuit view
  teamHQ: 45    // Team headquarters view
} as const;

// Fog configuration
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const FOG_CONFIG: any = {
  range: [0.5, 10] as [number, number],
  color: 'white',
  'high-color': '#245cdf',
  'space-color': 'black',
  'star-intensity': 0.5
};

// Sky layer configuration
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

// Layers to remove from base map
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

