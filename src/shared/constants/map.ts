// Map configuration constants

// Main map configuration
export const MAP_CONFIG = {
  style: 'mapbox://styles/mapbox/dark-v11',
  center: [0, 20] as [number, number],
  zoom: 1.5,
  projection: { name: 'globe' as const }
} as const;

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

// Terrain exaggeration - height exaggeration settings
export const TERRAIN_EXAGGERATION = {
  far: 2.0,        // zoom < 5 (globe view)
  medium: 1.5,     // zoom >= 10 (detail view)
  transition: 0.1  // transition step between zoom 5-10
} as const;

// Marker occlusion states
export enum MarkerOcclusionState {
  VISIBLE = 'visible',
  OCCLUDED = 'occluded'
}