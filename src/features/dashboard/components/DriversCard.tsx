'use client';

import { TEAM_DETAILS } from '@/src/features/teams/data/teamDetails';
import teamsData from '@/data/teams.json';
import Image from 'next/image';
import { useLanguage } from '@/contexts/LanguageContext';
import { getText } from '@/utils/i18n';

// 현재 시즌 전체 드라이버 순위 (가상 포인트) - 컴포넌트 외부로 이동
const driversRawData = [
  { name: 'Lando Norris', points: 195 },
  { name: 'Max Verstappen', points: 181 },
  { name: 'Oscar Piastri', points: 179 },
  { name: 'George Russell', points: 108 },
  { name: 'Charles Leclerc', points: 98 },
  { name: 'Lewis Hamilton', points: 91 },
  { name: 'Carlos Sainz Jr.', points: 85 },
  { name: 'Franco Colapinto', points: 43 },
  { name: 'Gabriel Bortoleto', points: 31 },
  { name: 'Yuki Tsunoda', points: 22 },
  { name: 'Lance Stroll', points: 22 },
  { name: 'Nico Hulkenberg', points: 14 },
  { name: 'Oliver Bearman', points: 14 },
  { name: 'Alex Albon', points: 12 },
  { name: 'Pierre Gasly', points: 8 },
  { name: 'Liam Lawson', points: 6 },
  { name: 'Isack Hadjar', points: 4 },
  { name: 'Esteban Ocon', points: 3 },
  { name: 'Kimi Antonelli', points: 0 },
  { name: 'Fernando Alonso', points: 0 },
];

// 팀 로고 매핑 설정
const TEAM_LOGO_CONFIG = {
  smallLogoTeams: ['red-bull', 'mercedes', 'mclaren', 'aston-martin', 'alpine', 'williams', 'racing-bulls', 'sauber', 'haas'] as const,
  fileNameMap: {
    'haas': 'hass.png'
  } as const,
  fallbackLogos: {
    'ferrari': 'ferrari.png'
  } as const
};

const getTeamLogoPath = (teamId: string): string | null => {
  // 타입 가드를 사용하여 안전하게 체크
  if ((TEAM_LOGO_CONFIG.smallLogoTeams as readonly string[]).includes(teamId)) {
    const fileName = (TEAM_LOGO_CONFIG.fileNameMap as Record<string, string>)[teamId] || `${teamId}.png`;
    return `small/${fileName}`;
  }
  
  return (TEAM_LOGO_CONFIG.fallbackLogos as Record<string, string>)[teamId] || null;
};

// 드라이버의 팀 정보를 찾는 함수
const getDriverTeam = (driverName: string) => {
  for (const [teamId, teamDetails] of Object.entries(TEAM_DETAILS)) {
    const foundDriver = teamDetails.drivers2025.find(driver => driver.name === driverName);
    if (foundDriver) {
      const teamInfo = teamsData.teams.find(team => team.id === teamId);
      const logoPath = getTeamLogoPath(teamId);
      return teamInfo ? { ...teamInfo, logoPath } : null;
    }
  }
  return null;
};

// 드라이버 데이터 변환 함수
const transformDriversData = () => {
  return driversRawData
    .sort((a, b) => b.points - a.points)
    .map((driver, index) => ({
      position: index + 1,
      name: driver.name,
      points: driver.points,
      team: getDriverTeam(driver.name)
    }));
};

export default function DriversCard() {
  const { language } = useLanguage();
  const driversData = transformDriversData();

  return (
    <div className="bg-black/90 backdrop-blur-sm border-2 border-blue-500/30 hover:border-blue-500/50 rounded-3xl p-6 w-full h-full overflow-hidden flex flex-col shadow-2xl transition-all duration-300 hover:shadow-blue-500/20">
      <div className="mb-4 pb-3 border-b border-blue-500/20">
        <h2 className="text-white text-xl font-bold tracking-wide bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
          {getText({ en: 'Drivers Point', ko: '드라이버 포인트' }, language)}
        </h2>
      </div>
      <div className="space-y-1 overflow-y-auto flex-1 scrollbar-hide">
        {driversData.map((driver) => (
          <div key={driver.position} className="flex justify-between items-center py-1 px-2 rounded-lg hover:bg-white/5 transition-colors">
            <div className="text-white text-base flex items-center">
              <span className="text-blue-400 font-semibold">{driver.position}. </span>
              <span className="text-sm hover:text-blue-200 transition-colors mr-2">{driver.name}</span>
              {driver.team && driver.team.logoPath && (
                <div className="flex-shrink-0 ml-1">
                  <Image
                    src={`/team-logos/${driver.team.logoPath}`}
                    alt={driver.team.name.en}
                    width={20}
                    height={20}
                    className="rounded-sm object-contain"
                    onError={() => {
                      console.log(`Failed to load logo for team: ${driver.team?.id}`);
                    }}
                  />
                </div>
              )}
            </div>
            <div className="text-blue-400 text-base font-bold bg-blue-500/10 px-2 py-1 rounded">
              {driver.points}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}