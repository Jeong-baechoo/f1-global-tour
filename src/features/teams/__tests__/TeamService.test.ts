import { TeamService } from '../services/TeamService';

// Mock the teams data
jest.mock('@/data/teams.json', () => [
  {
    id: 'mercedes',
    name: { en: 'Mercedes-AMG Petronas F1 Team', ko: '메르세데스-AMG 페트로나스 F1 팀' },
    headquarters: {
      lat: 52.0276,
      lng: -1.1397,
      city: { en: 'Brackley', ko: '브랙클리' },
      country: { en: 'United Kingdom', ko: '영국' }
    },
    teamPrincipal: 'Toto Wolff',
    colors: { primary: '#00D2BE', secondary: '#000000' },
    championships2025: { constructors: 8, drivers: 7 }
  },
  {
    id: 'red-bull',
    name: { en: 'Oracle Red Bull Racing', ko: '오라클 레드불 레이싱' },
    headquarters: {
      lat: 52.0058,
      lng: -0.6944,
      city: { en: 'Milton Keynes', ko: '밀턴 케인스' },
      country: { en: 'United Kingdom', ko: '영국' }
    },
    teamPrincipal: 'Christian Horner',
    colors: { primary: '#0600EF', secondary: '#FF0000' },
    championships2025: { constructors: 6, drivers: 7 }
  }
]);

describe('TeamService', () => {
  let teamService: TeamService;

  beforeEach(() => {
    teamService = new TeamService();
  });

  describe('getTeams', () => {
    it('should return all teams', async () => {
      const teams = await teamService.getTeams();
      expect(teams).toHaveLength(2);
      expect(teams[0].id).toBe('mercedes');
      expect(teams[1].id).toBe('red-bull');
    });

    it('should return teams with correct structure', async () => {
      const teams = await teamService.getTeams();
      const mercedes = teams[0];
      
      expect(mercedes).toHaveProperty('id');
      expect(mercedes).toHaveProperty('name');
      expect(mercedes).toHaveProperty('headquarters');
      expect(mercedes).toHaveProperty('teamPrincipal');
      expect(mercedes).toHaveProperty('colors');
      expect(mercedes).toHaveProperty('championships2025');
    });
  });

  describe('getTeamById', () => {
    it('should return team by id', async () => {
      const team = await teamService.getTeamById('mercedes');
      expect(team).toBeDefined();
      expect(team?.id).toBe('mercedes');
      expect((team?.name as any).en).toBe('Mercedes-AMG Petronas F1 Team');
    });

    it('should return undefined for non-existent team', async () => {
      const team = await teamService.getTeamById('non-existent');
      expect(team).toBeNull();
    });
  });

  describe('getUKTeams', () => {
    it('should return only UK-based teams', async () => {
      const ukTeams = await teamService.getUKTeams();
      expect(ukTeams).toHaveLength(2);
      expect(ukTeams.every(team => 
        (team.headquarters.country as any).en === 'United Kingdom'
      )).toBe(true);
    });
  });

  describe('getTeamsByCountry', () => {
    it('should filter teams by country', async () => {
      const ukTeams = await teamService.getTeamsByCountry('United Kingdom');
      expect(ukTeams).toHaveLength(2);
      
      const italianTeams = await teamService.getTeamsByCountry('Italy');
      expect(italianTeams).toHaveLength(0);
    });
  });
});