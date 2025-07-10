import { CircuitService } from '../services/CircuitService';

// Mock circuits data
jest.mock('@/data/circuits.json', () => [
  {
    id: 'monaco',
    name: { en: 'Circuit de Monaco', ko: '모나코 서킷' },
    location: {
      lat: 43.7347,
      lng: 7.4201,
      city: { en: 'Monte Carlo', ko: '몬테카를로' },
      country: { en: 'Monaco', ko: '모나코' }
    },
    raceInfo: {
      round: 6,
      raceName: { en: 'Monaco Grand Prix', ko: '모나코 그랑프리' },
      date: '2024-05-26'
    }
  },
  {
    id: 'silverstone',
    name: { en: 'Silverstone Circuit', ko: '실버스톤 서킷' },
    location: {
      lat: 52.0786,
      lng: -1.0169,
      city: { en: 'Silverstone', ko: '실버스톤' },
      country: { en: 'United Kingdom', ko: '영국' }
    },
    raceInfo: {
      round: 12,
      raceName: { en: 'British Grand Prix', ko: '영국 그랑프리' },
      date: '2024-07-07'
    }
  }
]);

describe('CircuitService', () => {
  let circuitService: CircuitService;

  beforeEach(() => {
    circuitService = new CircuitService();
  });

  describe('getCircuits', () => {
    it('should return all circuits', async () => {
      const circuits = await circuitService.getCircuits();
      expect(circuits).toHaveLength(2);
      expect(circuits[0].id).toBe('monaco');
      expect(circuits[1].id).toBe('silverstone');
    });
  });

  describe('getCircuitById', () => {
    it('should return circuit by id', async () => {
      const circuit = await circuitService.getCircuitById('monaco');
      expect(circuit).toBeDefined();
      expect(circuit?.id).toBe('monaco');
      expect((circuit?.name as any).en).toBe('Circuit de Monaco');
    });

    it('should return undefined for non-existent circuit', async () => {
      const circuit = await circuitService.getCircuitById('non-existent');
      expect(circuit).toBeUndefined();
    });
  });

  describe('getNextRace', () => {
    beforeEach(() => {
      // Mock current date
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should return the next upcoming race', async () => {
      // Set date before Monaco GP
      jest.setSystemTime(new Date('2024-05-01'));
      
      const nextRace = await circuitService.getNextRace();
      expect(nextRace).toBeDefined();
      expect(nextRace?.id).toBe('monaco');
    });

    it('should return null if no upcoming races', async () => {
      // Set date after all races
      jest.setSystemTime(new Date('2024-12-31'));
      
      const nextRace = await circuitService.getNextRace();
      expect(nextRace).toBeNull();
    });
  });

  describe('getTrackData', () => {
    it('should throw error if track data not found', async () => {
      // Mock the dynamic import to throw
      jest.mock('@/data/circuits/monaco/monaco-track.geojson', () => {
        throw new Error('File not found');
      });

      await expect(circuitService.getTrackData('monaco'))
        .rejects.toThrow('Track data not found for circuit: monaco');
    });
  });
});