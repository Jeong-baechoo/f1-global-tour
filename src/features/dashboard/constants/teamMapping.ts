// API teamId를 로컬 팀 ID로 매핑하는 상수
export const API_TO_LOCAL_TEAM_MAPPING: Record<string, string> = {
  'rb': 'racing-bulls',
  'red_bull': 'red-bull',
  'aston_martin': 'aston-martin',
  'mclaren': 'mclaren',
  'ferrari': 'ferrari',
  'mercedes': 'mercedes',
  'alpine': 'alpine',
  'williams': 'williams',
  'sauber': 'sauber',
  'haas': 'haas'
} as const;

// API teamId를 로컬 팀 ID로 매핑하는 유틸리티 함수
export const mapApiTeamIdToLocal = (apiTeamId: string): string => {
  return API_TO_LOCAL_TEAM_MAPPING[apiTeamId] || apiTeamId;
};