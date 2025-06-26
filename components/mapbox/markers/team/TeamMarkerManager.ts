import mapboxgl from 'mapbox-gl';
import teamsData from '@/data/teams.json';
import { TeamMarkerFactory } from './TeamMarkerFactory';
import { MarkerData } from '../../types';

interface AddAllTeamsOptions {
  map: mapboxgl.Map;
  onMarkerClick?: (item: MarkerData) => void;
  markers: mapboxgl.Marker[];
}

export const addAllTeams = ({ map, onMarkerClick, markers }: AddAllTeamsOptions) => {
  teamsData.teams.forEach(team => {
    const marker = TeamMarkerFactory.create({
      map,
      team,
      onMarkerClick
    });
    
    if (marker) {
      markers.push(marker);
    }
  });
};