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
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 w-full h-full overflow-hidden flex flex-col shadow-lg">
      <div className="mb-4 pb-3 border-b border-[#ff1801]/30">
        <h2 className="text-white text-lg font-semibold tracking-wide bg-gradient-to-r from-[#ff1801] to-[#ff1801]/80 bg-clip-text text-transparent">
          {getText({ en: 'Drivers Championship', ko: '드라이버 챔피언십' }, language)}
        </h2>
      </div>
      <div className="overflow-y-auto flex-1 scrollbar-hide">
        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState />
        ) : driversData.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-2">
            {driversData.map((driver) => (
              <div key={driver.position} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-3 hover:bg-[#ff1801]/10 hover:border-[#ff1801]/40 transition-all duration-200">
                <div className="flex justify-between items-center gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="text-[#ff1801] text-base font-bold flex-shrink-0">
                      {driver.position}.
                    </span>
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="text-white text-sm font-medium truncate">
                        {driver.name}
                      </span>
                      {driver.team && driver.team.logoPath && (
                        <Image
                          src={`/team-logos/${driver.team.logoPath}`}
                          alt={driver.team.name.en}
                          width={16}
                          height={16}
                          className="rounded-sm object-contain flex-shrink-0"
                          onError={() => {
                            if (process.env.NODE_ENV === 'development') {
                              console.log(`Failed to load logo for team: ${driver.team?.id}`);
                            }
                          }}
                        />
                      )}
                    </div>
                  </div>
                  <div className="text-white text-sm font-bold bg-gradient-to-r from-[#ff1801]/20 to-[#ff1801]/30 border border-[#ff1801]/40 px-3 py-1 rounded-lg flex-shrink-0">
                    {driver.points}
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