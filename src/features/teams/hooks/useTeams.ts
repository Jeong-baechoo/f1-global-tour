import { useEffect, useCallback } from 'react';
// noinspection ES6PreferShortImport
import { useTeamStore } from '../store/useTeamStore';
// noinspection ES6PreferShortImport
import { TeamService } from '../services/TeamService';

const teamService = new TeamService();

export const useTeams = () => {
  const {
    teams,
    selectedTeam,
    isLoading,
    error,
    setTeams,
    selectTeam,
    setLoading,
    setError,
  } = useTeamStore();
  
  const loadTeams = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const teamsData = await teamService.getTeams();
      setTeams(teamsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load teams');
      console.error('Error loading teams:', err);
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, setTeams]);
  
  // Load teams on mount
  useEffect(() => {
    loadTeams();
  }, [loadTeams]);
  
  const selectTeamById = async (teamId: string) => {
    try {
      const team = await teamService.getTeamById(teamId);
      selectTeam(team);
    } catch {
      // Error handled silently
    }
  };
  
  const getTeamColor = (teamId: string) => {
    return teamService.getTeamColors(teamId);
  };
  
  return {
    teams,
    selectedTeam,
    isLoading,
    error,
    loadTeams,
    selectTeam,
    selectTeamById,
    getTeamColor,
  };
};