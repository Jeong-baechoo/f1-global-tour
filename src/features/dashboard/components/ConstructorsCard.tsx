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
    <div className="bg-black/90 backdrop-blur-sm border-2 border-red-500/30 hover:border-red-500/50 rounded-3xl p-6 w-full h-full overflow-hidden flex flex-col shadow-2xl transition-all duration-300 hover:shadow-red-500/20">
      <div className="mb-4 pb-3 border-b border-red-500/20">
        <h2 className="text-white text-xl font-bold tracking-wide bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
          {getText({ en: 'Constructors Point', ko: '컨스트럭터 포인트' }, language)}
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
          constructorsData.map((constructor, index) => (
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
          ))
        )}
      </div>
    </div>
  );
}