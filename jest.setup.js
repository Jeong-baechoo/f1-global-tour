// Optional: configure or set up a testing framework before each test.
// If you delete this file, remove `setupFilesAfterEnv` from `jest.config.js`

// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock mapbox-gl
jest.mock('mapbox-gl', () => ({
  Map: jest.fn(() => ({
    on: jest.fn(),
    off: jest.fn(),
    remove: jest.fn(),
    getZoom: jest.fn().mockReturnValue(5),
    setProjection: jest.fn(),
    flyTo: jest.fn(),
    easeTo: jest.fn(),
    stop: jest.fn(),
    isMoving: jest.fn().mockReturnValue(false),
    getBearing: jest.fn().mockReturnValue(0),
    getCenter: jest.fn().mockReturnValue({ lng: 0, lat: 0 }),
    getPitch: jest.fn().mockReturnValue(0),
    addLayer: jest.fn(),
    removeLayer: jest.fn(),
    getLayer: jest.fn(),
    getSource: jest.fn(),
    addSource: jest.fn(),
    removeSource: jest.fn(),
    setPaintProperty: jest.fn(),
    setLayoutProperty: jest.fn(),
  })),
  Marker: jest.fn(() => ({
    setLngLat: jest.fn().mockReturnThis(),
    addTo: jest.fn().mockReturnThis(),
    remove: jest.fn(),
    getElement: jest.fn().mockReturnValue(document.createElement('div')),
    getLngLat: jest.fn().mockReturnValue({ lng: 0, lat: 0 }),
  })),
  NavigationControl: jest.fn(),
  supported: jest.fn().mockReturnValue(true),
}));

// Mock custom events
global.CustomEvent = jest.fn((event, params) => {
  return new Event(event, params);
});