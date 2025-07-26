import teamsData from '@/data/teams.json';
import { mapApiTeamIdToLocal } from '../constants/teamMapping';

// 팀 로고 매핑 설정
export const TEAM_LOGO_CONFIG = {
  smallLogoTeams: ['red-bull', 'mercedes', 'mclaren', 'aston-martin', 'alpine', 'williams', 'racing-bulls', 'sauber', 'haas'] as const,
  fileNameMap: {
    'haas': 'hass.png'
  } as const,
  fallbackLogos: {
    'ferrari': 'ferrari.png'
  } as const
} as const;

export const getTeamLogoPath = (teamId: string): string | null => {
  // 타입 가드를 사용하여 안전하게 체크
  if ((TEAM_LOGO_CONFIG.smallLogoTeams as readonly string[]).includes(teamId)) {
    const fileName = (TEAM_LOGO_CONFIG.fileNameMap as Record<string, string>)[teamId] || `${teamId}.png`;
    return `small/${fileName}`;
  }
  
  return (TEAM_LOGO_CONFIG.fallbackLogos as Record<string, string>)[teamId] || null;
};

// 색상 가독성을 위한 조정 함수
export const adjustColorForReadability = (hexColor: string): string => {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // 명도 계산 (0-255)
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  
  let newR = r, newG = g, newB = b;
  
  if (brightness < 100) {
    // 너무 어두운 색상 - 밝게 조정
    const factor = 1.8;
    newR = Math.min(255, Math.floor(r * factor + 50));
    newG = Math.min(255, Math.floor(g * factor + 50));
    newB = Math.min(255, Math.floor(b * factor + 50));
  } else if (brightness > 200) {
    // 너무 밝은 색상 - 어둡게 조정
    const factor = 0.7;
    newR = Math.floor(r * factor);
    newG = Math.floor(g * factor);
    newB = Math.floor(b * factor);
  }
  
  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toHex(newR)}${toHex(newG)}${toHex(newB)}`;
};

// API 데이터를 기반으로 팀 정보를 가져오는 함수
export const getTeamFromApi = (apiTeamId: string) => {
  const localTeamId = mapApiTeamIdToLocal(apiTeamId);
  const teamInfo = teamsData.teams.find(team => team.id === localTeamId);
  const logoPath = teamInfo ? getTeamLogoPath(teamInfo.id) : null;
  return teamInfo ? { ...teamInfo, logoPath } : null;
};