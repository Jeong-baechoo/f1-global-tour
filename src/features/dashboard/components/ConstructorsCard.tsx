'use client';

import teamsData from '@/data/teams.json';
import { useLanguage, type Language } from '@/contexts/LanguageContext';
import { getText } from '@/utils/i18n';
import Image from 'next/image';

// 색상 가독성을 위한 조정 함수 - 컴포넌트 외부로 이동
const adjustColorForReadability = (hexColor: string): string => {
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

// 생성자 데이터 변환 함수
const transformConstructorsData = (language: Language) => {
  return teamsData.teams
    .map(team => ({
      name: getText(team.name, language),
      points: team.championships2025.totalPoints,
      color: adjustColorForReadability(team.colors.primary),
      logoPath: getTeamLogoPath(team.id),
      teamId: team.id
    }))
    .sort((a, b) => b.points - a.points)
    .map((team, index) => ({
      position: index + 1,
      ...team
    }));
};

export default function ConstructorsCard() {
  const { language } = useLanguage();
  const constructorsData = transformConstructorsData(language);

  return (
    <div className="bg-black/90 backdrop-blur-sm border-2 border-red-500/30 hover:border-red-500/50 rounded-3xl p-6 w-full h-full overflow-hidden flex flex-col shadow-2xl transition-all duration-300 hover:shadow-red-500/20">
      <div className="mb-4 pb-3 border-b border-red-500/20">
        <h2 className="text-white text-xl font-bold tracking-wide bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
          {getText({ en: 'Constructors Point', ko: '컨스트럭터 포인트' }, language)}
        </h2>
      </div>
      <div className="overflow-y-auto flex-1 scrollbar-hide">
        {constructorsData.map((constructor, index) => (
          <div key={constructor.position}>
            <div className="flex justify-between items-center py-2 px-2 rounded-lg hover:bg-white/5 transition-colors">
              <div className="text-white text-base flex items-center gap-2">
                <span className="text-red-400 font-semibold">{constructor.position}. </span>
                <span className="font-semibold text-white">
                  {constructor.name}
                </span>
                {constructor.logoPath && (
                  <Image 
                    src={`/team-logos/${constructor.logoPath}`}
                    alt={constructor.name}
                    width={20}
                    height={20}
                    className="ml-1"
                  />
                )}
              </div>
              <div className="text-red-400 text-base font-bold">
                {constructor.points}
              </div>
            </div>
            {index < constructorsData.length - 1 && (
              <div className="border-b-2 border-red-500/30 mx-2 my-1" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}