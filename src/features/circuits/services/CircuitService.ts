import { Circuit, CircuitServiceOptions, TrackData } from '../types';
import circuitsData from '@/data/circuits.json';

export class CircuitService {
  private options: Required<CircuitServiceOptions>;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  
  constructor(options: CircuitServiceOptions = {}) {
    this.options = {
      dataPath: '/data/circuits.json',
      tracksPath: '/data',
      cacheEnabled: true,
      cacheDuration: 5 * 60 * 1000, // 5 minutes
      ...options,
    };
  }
  
  /**
   * Fetch all circuits data
   */
  async getCircuits(): Promise<Circuit[]> {
    if (this.options.cacheEnabled) {
      const cached = this.getFromCache('circuits');
      if (cached) return cached;
    }
    
    try {
      // 직접 import한 데이터 사용
      const circuits = circuitsData.circuits || circuitsData;
      
      if (this.options.cacheEnabled) {
        this.setCache('circuits', circuits);
      }
      
      return circuits as Circuit[];
    } catch (error) {
      console.error('Error fetching circuits:', error);
      throw error;
    }
  }
  
  /**
   * Get a specific circuit by ID
   */
  async getCircuitById(id: string): Promise<Circuit | null> {
    const circuits = await this.getCircuits();
    return circuits.find(circuit => circuit.id === id) || null;
  }
  
  /**
   * Get track data for a specific circuit
   */
  async getTrackData(circuitId: string): Promise<TrackData | null> {
    const cacheKey = `track-${circuitId}`;
    
    if (this.options.cacheEnabled) {
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached;
    }
    
    try {
      // 동적 import 사용
      const trackData = await import(`@/data/${circuitId}-track.json`)
        .then(module => module.default)
        .catch(() => null);
      
      if (!trackData) {
        console.warn(`No track data found for circuit: ${circuitId}`);
        return null;
      }
      
      if (this.options.cacheEnabled) {
        this.setCache(cacheKey, trackData);
      }
      
      return trackData;
    } catch (error) {
      console.error(`Error fetching track data for ${circuitId}:`, error);
      return null;
    }
  }
  
  /**
   * Get next race
   */
  async getNextRace(): Promise<Circuit | null> {
    return this.getNextRaceCircuit();
  }

  /**
   * Get next race circuit
   */
  async getNextRaceCircuit(): Promise<Circuit | null> {
    const circuits = await this.getCircuits();
    const today = new Date();
    
    // Filter circuits with race dates
    const circuitsWithDates = circuits.filter(circuit => circuit.raceDate2025);
    
    // Sort by date
    circuitsWithDates.sort((a, b) => {
      const dateA = new Date(a.raceDate2025!);
      const dateB = new Date(b.raceDate2025!);
      return dateA.getTime() - dateB.getTime();
    });
    
    // Find the next race
    const nextRace = circuitsWithDates.find(circuit => {
      const raceDate = new Date(circuit.raceDate2025!);
      return raceDate > today;
    });
    
    // If no future races, return the first race of the season
    return nextRace || circuitsWithDates[0] || null;
  }
  
  /**
   * Get circuits by month
   */
  async getCircuitsByMonth(month: number): Promise<Circuit[]> {
    const circuits = await this.getCircuits();
    
    return circuits.filter(circuit => {
      if (!circuit.raceDate2025) return false;
      const raceDate = new Date(circuit.raceDate2025);
      return raceDate.getMonth() === month - 1; // JS months are 0-indexed
    });
  }
  
  /**
   * Get circuit view configuration
   */
  getCircuitView(circuit: Circuit): { center: [number, number]; zoom: number; pitch?: number; bearing?: number } {
    // Default view settings for different circuit types
    const defaultView = {
      center: [circuit.location.lng, circuit.location.lat] as [number, number],
      zoom: 15,
      pitch: 0,
      bearing: 0,
    };
    
    // Custom views for specific circuits
    const customViews: Record<string, any> = {
      'monaco': { zoom: 16, pitch: 45, bearing: -20 },
      'spa': { zoom: 14.5, pitch: 30, bearing: 45 },
      'suzuka': { zoom: 15, pitch: 40, bearing: 0 },
      'interlagos': { zoom: 15.5, pitch: 35, bearing: -90 },
    };
    
    return { ...defaultView, ...(customViews[circuit.id] || {}) };
  }
  
  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }
  
  /**
   * Get data from cache if valid
   */
  private getFromCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    const isExpired = Date.now() - cached.timestamp > this.options.cacheDuration;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }
  
  /**
   * Set data in cache
   */
  private setCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }
}