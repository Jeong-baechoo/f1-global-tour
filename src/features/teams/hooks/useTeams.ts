import { useEffect, useCallback } from 'react';
import { useTeamStore } from '../store/useTeamStore';
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
      console.log('Loaded teams:', teamsData.length, 'teams');
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
    } catch (err) {
      console.error('Error selecting team:', err);
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