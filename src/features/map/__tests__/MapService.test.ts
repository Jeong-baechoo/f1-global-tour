import { MapService } from '../services/MapService';
import mapboxgl from 'mapbox-gl';

// Mock mapbox-gl
jest.mock('mapbox-gl');

describe('MapService', () => {
  let mapService: MapService;
  let mockMap: jest.Mocked<mapboxgl.Map>;

  beforeEach(() => {
    mockMap = {
      getZoom: jest.fn().mockReturnValue(5),
      setProjection: jest.fn(),
      on: jest.fn(),
      off: jest.fn(),
      addLayer: jest.fn(),
      removeLayer: jest.fn(),
      getLayer: jest.fn(),
      getSource: jest.fn(),
      addSource: jest.fn(),
      removeSource: jest.fn(),
      setPaintProperty: jest.fn(),
      setLayoutProperty: jest.fn(),
      flyTo: jest.fn(),
      easeTo: jest.fn(),
      stop: jest.fn(),
      isMoving: jest.fn().mockReturnValue(false),
      getBearing: jest.fn().mockReturnValue(0),
      getCenter: jest.fn().mockReturnValue({ lng: 0, lat: 0 }),
      getPitch: jest.fn().mockReturnValue(0),
    } as any;

    mapService = MapService.getInstance();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = MapService.getInstance();
      const instance2 = MapService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('initializeMap', () => {
    it('should set up globe projection', () => {
      mapService.initializeMap(mockMap);
      expect(mockMap.setProjection).toHaveBeenCalledWith({ type: 'globe' });
    });

    it('should register event listeners', () => {
      mapService.initializeMap(mockMap);
      expect(mockMap.on).toHaveBeenCalledWith('style.load', expect.any(Function));
    });
  });

  describe('flyToLocation', () => {
    it('should fly to location with correct parameters', () => {
      mapService.initializeMap(mockMap);
      const coords: [number, number] = [10, 20];
      const options = { zoom: 15, pitch: 45 };

      mapService.flyToLocation(coords, options);

      expect(mockMap.flyTo).toHaveBeenCalledWith({
        center: coords,
        zoom: 15,
        pitch: 45,
        essential: true,
      });
    });

    it('should handle error when map is not initialized', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mapService.flyToLocation([10, 20]);
      
      expect(consoleSpy).toHaveBeenCalledWith('Map is not initialized');
      consoleSpy.mockRestore();
    });
  });

  describe('getZoom', () => {
    it('should return current zoom level', () => {
      mapService.initializeMap(mockMap);
      const zoom = mapService.getZoom();
      expect(zoom).toBe(5);
    });

    it('should return 0 when map is not initialized', () => {
      const zoom = mapService.getZoom();
      expect(zoom).toBe(0);
    });
  });

  describe('setCinematicMode', () => {
    it('should start rotation when enabled', () => {
      mapService.initializeMap(mockMap);
      mapService.setCinematicMode(true);
      
      // Verify rotation logic would be called
      expect(mapService['isCinematicMode']).toBe(true);
    });

    it('should stop rotation when disabled', () => {
      mapService.initializeMap(mockMap);
      mapService.setCinematicMode(false);
      
      expect(mapService['isCinematicMode']).toBe(false);
    });
  });
});