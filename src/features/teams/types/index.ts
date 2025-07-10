import { Team as SharedTeam } from '@/src/shared/types/team';
import { Location } from '@/src/shared/types/common';

// Re-export shared types
export type { Team } from '@/src/shared/types/team';

// Teams module specific types
export interface TeamMarker {
  id: string;
  teamId: string;
  location: Location;
  marker?: mapboxgl.Marker;
}

export interface TeamHQView {
  center: [number, number];
  zoom: number;
  pitch?: number;
  bearing?: number;
}

export interface TeamsState {
  teams: SharedTeam[];
  selectedTeam: SharedTeam | null;
  teamMarkers: TeamMarker[];
  isLoading: boolean;
  error: string | null;
  setTeams: (teams: SharedTeam[]) => void;
  selectTeam: (team: SharedTeam | null) => void;
  setTeamMarkers: (markers: TeamMarker[]) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export interface TeamServiceOptions {
  dataPath?: string;
  cacheEnabled?: boolean;
  cacheDuration?: number;
}

export interface TeamMarkerOptions {
  interactive?: boolean;
  className?: string;
  offset?: [number, number];
  anchor?: 'center' | 'top' | 'bottom' | 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}