'use client';

import teamsData from '@/data/teams.json';
import { useLanguage, type Language } from '@/contexts/LanguageContext';
import { getText } from '@/utils/i18n';

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

// 생성자 데이터 변환 함수
const transformConstructorsData = (language: Language) => {
  return teamsData.teams
    .map(team => ({
      name: getText(team.name, language),
      points: team.championships2025.totalPoints,
      color: adjustColorForReadability(team.colors.primary)
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
      <div className="space-y-1 overflow-y-auto flex-1 scrollbar-hide">
        {constructorsData.map((constructor) => (
          <div key={constructor.position} className="flex justify-between items-center py-1 px-2 rounded-lg hover:bg-white/5 transition-colors">
            <div className="text-white text-base">
              <span className="text-red-400 font-semibold">{constructor.position}. </span>
              <span 
                className="font-semibold transition-colors hover:brightness-125"
                style={{ color: constructor.color }}
              >
                {constructor.name}
              </span>
            </div>
            <div className="text-red-400 text-base font-bold bg-red-500/10 px-2 py-1 rounded">
              {constructor.points}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}