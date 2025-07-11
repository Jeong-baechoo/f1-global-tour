import type { Team } from '@/src/shared/types/team';
import type { Circuit } from '@/src/shared/types/circuit';
import type { TeamMarkerData, CircuitMarkerData } from '@/src/shared/types/marker';
import type { PanelData } from '@/src/features/race-info/types';
import { getText } from '@/utils/i18n';

/**
 * Convert Team to TeamMarkerData
 */
export function teamToMarkerData(team: Team): TeamMarkerData {
  return {
    type: 'team',
    id: team.id,
    name: team.name,
    principal: getText(team.teamPrincipal, 'en'), // Default to English, can be customized
    location: team.headquarters,
    headquarters: team.headquarters,
    color: team.colors.primary,
    colors: team.colors,
    drivers2025: team.drivers2025,
    car2025: team.car2025,
    championships2025: team.championships2025
  };
}

/**
 * Convert Circuit to CircuitMarkerData
 */
export function circuitToMarkerData(circuit: Circuit): CircuitMarkerData {
  return {
    type: 'circuit',
    id: circuit.id,
    name: circuit.name,
    location: circuit.location,
    grandPrix: circuit.grandPrix,
    length: circuit.length,
    corners: circuit.corners,
    laps: circuit.laps,
    totalDistance: circuit.totalDistance,
    lapRecord: circuit.lapRecord,
    raceDate: circuit.raceDate2025 || undefined
  };
}

/**
 * Convert TeamMarkerData to PanelData
 */
export function teamMarkerDataToPanelData(data: TeamMarkerData): PanelData {
  return {
    type: 'team',
    id: data.id,
    name: data.name,
    principal: data.principal,
    location: data.location,
    headquarters: data.headquarters,
    color: data.color,
    colors: data.colors,
    drivers2025: data.drivers2025,
    car2025: data.car2025,
    championships2025: data.championships2025
  };
}

/**
 * Convert CircuitMarkerData to PanelData
 */
export function circuitMarkerDataToPanelData(data: CircuitMarkerData): PanelData {
  return {
    type: 'circuit',
    id: data.id,
    name: data.name,
    location: data.location,
    grandPrix: data.grandPrix,
    length: data.length,
    corners: data.corners,
    laps: data.laps,
    totalDistance: data.totalDistance,
    lapRecord: data.lapRecord,
    raceDate: data.raceDate
  };
}

/**
 * Convert MarkerData to PanelData (universal converter)
 */
export function markerDataToPanelData(data: TeamMarkerData | CircuitMarkerData): PanelData {
  if (data.type === 'team') {
    return teamMarkerDataToPanelData(data);
  } else {
    return circuitMarkerDataToPanelData(data);
  }
}

/**
 * Convert legacy MarkerData to new format
 * @deprecated Use teamToMarkerData instead
 * This function is deprecated and will be removed in a future version
 */
export function legacyMarkerDataToMarkerData(legacyData: Record<string, unknown>): TeamMarkerData {
  // This is a legacy function that should not be used in new code
  // It's kept for backward compatibility only
  const id = typeof legacyData.id === 'string' ? legacyData.id : '';
  const name = typeof legacyData.name === 'string' ? { en: legacyData.name, ko: legacyData.name } : { en: '', ko: '' };
  const principal = typeof legacyData.principal === 'string' ? legacyData.principal : '';
  
  return {
    type: 'team',
    id,
    name,
    principal,
    location: {
      city: { en: '', ko: '' },
      country: { en: '', ko: '' },
      lat: 0,
      lng: 0
    },
    headquarters: {
      city: { en: '', ko: '' },
      country: { en: '', ko: '' },
      lat: 0,
      lng: 0
    },
    color: '#000000'
  };
}