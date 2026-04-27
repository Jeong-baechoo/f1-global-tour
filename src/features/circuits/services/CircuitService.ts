import { Circuit, CircuitServiceOptions } from '../types';
import circuitsData from '@/data/circuits.json';

export class CircuitService {
  private options: Required<CircuitServiceOptions>;
  private cache: Map<string, { data: unknown; timestamp: number }> = new Map();
  
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
      if (cached) return cached as Circuit[];
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
      return [];
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
   * Get the race date for the current season
   */
  getRaceDateForSeason(circuit: Circuit): string | null {
    const year = new Date().getFullYear();
    if (year >= 2026) return circuit.raceDate2026;
    return circuit.raceDate2025;
  }

  /**
   * Get the round number for the current season
   */
  getRoundForSeason(circuit: Circuit): number | null {
    const year = new Date().getFullYear();
    if (year >= 2026) return circuit.round2026;
    return circuit.round;
  }

  /**
   * Get next race circuit
   */
  async getNextRaceCircuit(): Promise<Circuit | null> {
    const circuits = await this.getCircuits();
    const today = new Date();

    // Helper function to check if race is completed
    const isRaceCompleted = (circuit: Circuit): boolean => {
      const raceDate = this.getRaceDateForSeason(circuit);
      if (!raceDate) return false;
      const raceDateObj = new Date(raceDate);
      const raceEndTime = new Date(raceDateObj.getTime() + (2 * 60 * 60 * 1000));
      const switchTime = new Date(raceEndTime.getTime() + (12 * 60 * 60 * 1000));
      return today >= switchTime;
    };

    // Filter circuits with race dates for current season
    const circuitsWithDates = circuits.filter(circuit => this.getRaceDateForSeason(circuit));

    // Sort by date
    circuitsWithDates.sort((a, b) => {
      const dateA = new Date(this.getRaceDateForSeason(a)!);
      const dateB = new Date(this.getRaceDateForSeason(b)!);
      return dateA.getTime() - dateB.getTime();
    });

    // Find the next race (excluding completed ones)
    const nextRace = circuitsWithDates.find(circuit => !isRaceCompleted(circuit));

    // If no future races, return the first race of the season
    return nextRace || circuitsWithDates[0] || null;
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
    const customViews: Record<string, { zoom?: number; pitch?: number; bearing?: number }> = {
      'monaco': { zoom: 16, pitch: 45, bearing: -20 },
      'spa': { zoom: 14.5, pitch: 30, bearing: 45 },
      'suzuka': { zoom: 15, pitch: 40, bearing: 0 },
      'interlagos': { zoom: 15.5, pitch: 35, bearing: -90 },
    };
    
    return { ...defaultView, ...(customViews[circuit.id] || {}) };
  }
  
  
  /**
   * Get data from cache if valid
   */
  private getFromCache(key: string): unknown | null {
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
  private setCache(key: string, data: unknown): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }
}