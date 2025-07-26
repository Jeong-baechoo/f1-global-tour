import { Team, TeamServiceOptions } from '../types';
import teamsData from '@/data/teams.json';

export class TeamService {
  private options: Required<TeamServiceOptions>;
  private cache: Map<string, { data: Team[]; timestamp: number }> = new Map();
  
  constructor(options: TeamServiceOptions = {}) {
    this.options = {
      dataPath: '/teams.json',  // public 폴더의 파일
      cacheEnabled: true,
      cacheDuration: 5 * 60 * 1000, // 5 minutes
      ...options,
    };
  }
  
  /**
   * Fetch all teams data
   */
  async getTeams(): Promise<Team[]> {
    if (this.options.cacheEnabled) {
      const cached = this.getFromCache('teams');
      if (cached) return cached;
    }
    
    try {
      // 직접 import한 데이터 사용
      const teams = teamsData.teams || teamsData;
      
      if (this.options.cacheEnabled) {
        this.setCache('teams', teams);
      }
      
      return teams as Team[];
    } catch (error) {
      console.error('Error fetching teams:', error);
      throw error;
    }
  }
  
  /**
   * Get a specific team by ID
   */
  async getTeamById(id: string): Promise<Team | null> {
    const teams = await this.getTeams();
    return teams.find(team => team.id === id) || null;
  }


  
  
  /**
   * Get team colors for map styling
   */
  getTeamColors(teamId: string): { primary: string; secondary?: string } {
    // This could be expanded to return actual team colors from data
    const colorMap: Record<string, { primary: string; secondary?: string }> = {
      'red-bull': { primary: '#1E41FF', secondary: '#FF1801' },
      'mercedes': { primary: '#00D2BE', secondary: '#000000' },
      'ferrari': { primary: '#DC0000', secondary: '#FFEB00' },
      'mclaren': { primary: '#FF8700', secondary: '#000000' },
      'aston-martin': { primary: '#006F62', secondary: '#000000' },
      'alpine': { primary: '#0090FF', secondary: '#FF87BC' },
      'williams': { primary: '#005AFF', secondary: '#000000' },
      'alphatauri': { primary: '#2B4562', secondary: '#FFFFFF' },
      'sauber': { primary: '#52E252', secondary: '#000000' },
      'haas': { primary: '#FFFFFF', secondary: '#FF0000' },
    };
    
    return colorMap[teamId] || { primary: '#666666' };
  }
  
  
  /**
   * Get data from cache if valid
   */
  private getFromCache(key: string): Team[] | null {
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
  private setCache(key: string, data: Team[]): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }
}