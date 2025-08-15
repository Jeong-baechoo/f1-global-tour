'use client';

import { useLanguage, type Language } from '@/contexts/LanguageContext';
import { getText } from '@/utils/i18n';
import { useConstructorsChampionship, type ConstructorStanding } from '../hooks/useConstructorsChampionship';
import { getTeamFromApi, adjustColorForReadability } from '../utils/teamUtils';
import { LoadingState, ErrorState, EmptyState } from './LoadingStates';
import Image from 'next/image';

interface TransformedConstructor {
  position: number;
  name: string;
  points: number;
  wins: number;
  color: string;
  logoPath: string | null;
  teamId: string;
}

// API 데이터를 로컬 팀 데이터와 결합하는 함수
const combineApiWithLocalData = (apiData: ConstructorStanding[], language: Language): TransformedConstructor[] => {
  return apiData.map(standing => {
    const localTeam = getTeamFromApi(standing.teamId);
    
    return {
      position: standing.position,
      name: localTeam ? getText(localTeam.name, language) : standing.team.teamName,
      points: standing.points,
      wins: standing.wins || 0,
      color: localTeam ? adjustColorForReadability(localTeam.colors.primary) : '#888888',
      logoPath: localTeam?.logoPath || null,
      teamId: standing.teamId
    };
  }).sort((a, b) => a.position - b.position);
};

export default function ConstructorsCard() {
  const { language } = useLanguage();
  const { data: apiData, loading, error } = useConstructorsChampionship();
  
  const constructorsData = apiData.length > 0 
    ? combineApiWithLocalData(apiData, language)
    : [];

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 w-full h-full overflow-hidden flex flex-col shadow-lg">
      <div className="mb-4 pb-3 border-b border-[#ff1801]/30">
        <h2 className="text-white text-lg font-semibold tracking-wide bg-gradient-to-r from-[#ff1801] to-[#ff1801]/80 bg-clip-text text-transparent">
          {getText({ en: 'Constructors Championship', ko: '컨스트럭터 챔피언십' }, language)}
        </h2>
      </div>
      <div className="overflow-y-auto flex-1 scrollbar-hide">
        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState />
        ) : constructorsData.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-2">
            {constructorsData.map((constructor) => (
              <div key={constructor.position} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-3 hover:bg-[#ff1801]/10 hover:border-[#ff1801]/40 transition-all duration-200">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <span className="text-[#ff1801] text-base font-bold min-w-[1.5rem]">
                      {constructor.position}.
                    </span>
                    <div className="flex items-center gap-2">
                      {constructor.logoPath && (
                        <Image 
                          src={`/team-logos/${constructor.logoPath}`}
                          alt={constructor.name}
                          width={16}
                          height={16}
                          className="rounded-sm"
                        />
                      )}
                      <span className="text-white text-sm font-medium">
                        {constructor.name}
                      </span>
                    </div>
                  </div>
                  <div className="text-white text-sm font-bold bg-gradient-to-r from-[#ff1801]/20 to-[#ff1801]/30 border border-[#ff1801]/40 px-3 py-1 rounded-lg">
                    {constructor.points}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}