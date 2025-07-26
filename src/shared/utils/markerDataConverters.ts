import type { Team } from '@/src/shared/types/team';
import type { TeamMarkerData } from '@/src/shared/types/marker';
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

