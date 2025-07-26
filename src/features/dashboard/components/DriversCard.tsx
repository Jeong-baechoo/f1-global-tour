'use client';

import { useDriversChampionship, type DriverStanding } from '../hooks/useDriversChampionship';
import { getTeamFromApi } from '../utils/teamUtils';
import { LoadingState, ErrorState, EmptyState } from './LoadingStates';
import Image from 'next/image';
import { useLanguage } from '@/contexts/LanguageContext';
import { getText } from '@/utils/i18n';

interface TransformedDriver {
  position: number;
  name: string;
  points: number;
  wins: number;
  team: ReturnType<typeof getTeamFromApi>;
  nationality: string;
  driverNumber: number;
}

// API 데이터를 변환하는 함수
const transformApiDriversData = (apiData: DriverStanding[]): TransformedDriver[] => {
  return apiData.map(standing => ({
    position: standing.position,
    name: `${standing.driver.name} ${standing.driver.surname}`,
    points: standing.points,
    wins: standing.wins || 0,
    team: getTeamFromApi(standing.teamId),
    nationality: standing.driver.nationality,
    driverNumber: standing.driver.number
  })).sort((a, b) => a.position - b.position);
};

export default function DriversCard() {
  const { language } = useLanguage();
  const { data: apiData, loading, error } = useDriversChampionship();
  
  const driversData = apiData.length > 0 
    ? transformApiDriversData(apiData)
    : [];

  return (
    <div className="bg-black/90 backdrop-blur-sm border-2 border-blue-500/30 hover:border-blue-500/50 rounded-3xl p-6 w-full h-full overflow-hidden flex flex-col shadow-2xl transition-all duration-300 hover:shadow-blue-500/20">
      <div className="mb-4 pb-3 border-b border-blue-500/20">
        <h2 className="text-white text-xl font-bold tracking-wide bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
          {getText({ en: 'Drivers Point', ko: '드라이버 포인트' }, language)}
        </h2>
      </div>
      <div className="overflow-y-auto flex-1 scrollbar-hide">
        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState textColor="text-blue-400" />
        ) : driversData.length === 0 ? (
          <EmptyState />
        ) : (
          driversData.map((driver, index) => (
            <div key={driver.position}>
              <div className="flex justify-between items-center py-2 px-2 rounded-lg hover:bg-white/5 transition-colors">
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
                          if (process.env.NODE_ENV === 'development') {
                            console.log(`Failed to load logo for team: ${driver.team?.id}`);
                          }
                        }}
                      />
                    </div>
                  )}
                </div>
                <div className="text-blue-400 text-base font-bold">
                  {driver.points}
                </div>
              </div>
              {index < driversData.length - 1 && (
                <div className="border-b-2 border-blue-500/30 mx-2 my-1" />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}