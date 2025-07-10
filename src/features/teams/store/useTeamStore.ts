import { create } from 'zustand';
import { TeamsState, Team } from '../types';

const initialState = {
  teams: [],
  selectedTeam: null,
  teamMarkers: [],
  isLoading: false,
  error: null,
};

export const useTeamStore = create<TeamsState>((set) => ({
      ...initialState,
      
      setTeams: (teams) => set({ teams }),
      
      selectTeam: (team) => set({ selectedTeam: team }),
      
      setTeamMarkers: (markers) => set({ teamMarkers: markers }),
      
      setLoading: (isLoading) => set({ isLoading }),
      
      setError: (error) => set({ error }),
      
      reset: () => set(initialState),
}));