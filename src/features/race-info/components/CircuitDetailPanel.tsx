'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getText } from '@/utils/i18n';
import { CircuitDetailData } from '../types';
import { f1ApiService, F1RaceData } from '@/src/shared/services/F1ApiService';

interface CircuitDetailPanelProps {
  data: CircuitDetailData;
  isMobile: boolean;
  sheetState?: 'closed' | 'peek' | 'half' | 'full';
}

// 서킷별 성능 데이터 (2024/2025 F1 공식 데이터 기반)
const getCircuitPerformanceData = (circuitId: string) => {
  const performanceData: Record<string, { drsZones: number; topSpeed: number; pitLoss: number }> = {
    'australia': { drsZones: 4, topSpeed: 320, pitLoss: 23 },        // Albert Park
    'china': { drsZones: 2, topSpeed: 318, pitLoss: 21 },           // Shanghai
    'japan': { drsZones: 1, topSpeed: 324, pitLoss: 19 },           // Suzuka
    'bahrain': { drsZones: 3, topSpeed: 330, pitLoss: 20 },         // Sakhir
    'saudi-arabia': { drsZones: 3, topSpeed: 335, pitLoss: 18 },    // Jeddah
    'miami': { drsZones: 3, topSpeed: 320, pitLoss: 19 },           // Miami
    'italy-emilia': { drsZones: 1, topSpeed: 315, pitLoss: 20 },    // Imola
    'monaco': { drsZones: 1, topSpeed: 260, pitLoss: 23 },          // Monaco
    'spain': { drsZones: 2, topSpeed: 315, pitLoss: 21 },           // Barcelona-Catalunya
    'canada': { drsZones: 3, topSpeed: 330, pitLoss: 17 },          // Gilles Villeneuve
    'austria': { drsZones: 3, topSpeed: 320, pitLoss: 18 },         // Red Bull Ring
    'great-britain': { drsZones: 2, topSpeed: 330, pitLoss: 22 },   // Silverstone
    'belgium': { drsZones: 2, topSpeed: 340, pitLoss: 16 },         // Spa-Francorchamps
    'hungary': { drsZones: 1, topSpeed: 315, pitLoss: 24 },         // Hungaroring
    'netherlands': { drsZones: 2, topSpeed: 315, pitLoss: 20 },     // Zandvoort
    'italy': { drsZones: 2, topSpeed: 345, pitLoss: 19 },           // Monza
    'azerbaijan': { drsZones: 2, topSpeed: 350, pitLoss: 21 },      // Baku
    'singapore': { drsZones: 4, topSpeed: 315, pitLoss: 25 },       // Marina Bay
    'united-states': { drsZones: 2, topSpeed: 325, pitLoss: 20 },   // COTA
    'mexico': { drsZones: 2, topSpeed: 330, pitLoss: 18 },          // Mexico City
    'brazil': { drsZones: 2, topSpeed: 320, pitLoss: 22 },          // Interlagos
    'las-vegas': { drsZones: 3, topSpeed: 342, pitLoss: 16 },       // Las Vegas
    'qatar': { drsZones: 3, topSpeed: 335, pitLoss: 18 },           // Lusail
    'abu-dhabi': { drsZones: 2, topSpeed: 325, pitLoss: 21 },       // Yas Marina
    'nurburgring': { drsZones: 1, topSpeed: 310, pitLoss: 24 }      // Nürburgring
  };
  
  return performanceData[circuitId] || { drsZones: 2, topSpeed: 320, pitLoss: 20 };
};

export const CircuitDetailPanel: React.FC<CircuitDetailPanelProps> = ({
  data,
  isMobile
}) => {
  const { language } = useLanguage();
  const performanceData = getCircuitPerformanceData(data.id);
  const [raceData, setRaceData] = useState<F1RaceData | null>(null);
  const [isLoadingSchedule, setIsLoadingSchedule] = useState(true);

  // F1 API에서 레이스 스케줄 데이터 가져오기
  useEffect(() => {
    const fetchRaceSchedule = async () => {
      setIsLoadingSchedule(true);
      try {
        const searchTerm = getText(data.name, 'en') || getText(data.name, 'ko');
        console.log('서킷 검색어:', searchTerm, 'from data.name:', data.name);
        const raceInfo = await f1ApiService.getRaceByCircuitName(searchTerm);
        setRaceData(raceInfo);
      } catch (error) {
        console.error('Failed to fetch race schedule:', error);
      } finally {
        setIsLoadingSchedule(false);
      }
    };

    fetchRaceSchedule();
  }, [data.name]);

  return (
    <div className={isMobile ? "space-y-8" : "space-y-12"}>
      {/* Hero Section - 과감한 그랑프리 헤드라인 */}
      <div className="relative mb-8">
        {/* 배경 장식 요소 */}
        <div className="absolute -top-4 -right-4 w-20 h-20 bg-[#FF1801]/10 rounded-full blur-2xl" />
        
        {/* 메인 헤드라인 */}
        <div className="relative z-10">
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            {getText(data.grandPrix, language).replace(/ Grand Prix$|그랑프리$/, '')}
          </h1>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white mb-4 leading-tight">
            {language === 'ko' ? '그랑프리' : 'Grand Prix'}
          </h1>
          
          {/* 부가 정보 - 더 절제된 스타일 */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-white/50">
            <span className="font-medium">{getText(data.name, language)}</span>
            <div className="hidden sm:block w-1 h-1 rounded-full bg-white/30" />
            <span>{getText(data.location.city, language)}, {getText(data.location.country, language)}</span>
          </div>
        </div>
      </div>

      {/* Race Info Cards - 컨테이너 사이즈 최적화 디자인 */}
      <div className="space-y-5">
        {/* 섹션 헤더 - 컴팩트 버전 */}
        <div className="flex items-center gap-2">
          <div className="w-1 h-4 bg-gradient-to-b from-[#FF1801] to-[#FF1801]/60 rounded-full"></div>
          <h3 className="text-base font-black text-white uppercase tracking-wide">
            {language === 'ko' ? '레이스 정보' : 'RACE INFO'}
          </h3>
        </div>

        {/* 통합 스탯 캐러셀 - 네비게이션 버튼 포함 */}
        <div className="relative">
          {/* 캐러셀 컨테이너 */}
          <div 
            className="flex gap-3 overflow-x-auto pb-2 pt-3 scrollbar-hide scroll-smooth mx-8"
            id="stats-carousel"
          >
            {/* 랩 수 */}
            <div className="bg-gradient-to-br from-[#1A1A1A]/60 to-[#0A0A0A]/80 backdrop-blur-xl rounded-xl p-4 border border-white/10 hover:border-[#FF1801]/30 transition-all duration-300 hover:transform hover:-translate-y-0.5 flex-shrink-0 min-w-[120px]">
              <div className="text-center">
                <div className="text-2xl font-black text-white mb-1">
                  {data.laps}
                </div>
                <div className="text-[10px] uppercase text-white/50 font-medium tracking-wider">
                  {language === 'ko' ? '랩' : 'LAPS'}
                </div>
              </div>
            </div>

            {/* 코너 */}
            <div className="bg-gradient-to-br from-[#FF1801]/15 to-[#FF1801]/8 backdrop-blur-xl rounded-xl p-4 border border-[#FF1801]/25 hover:border-[#FF1801]/50 transition-all duration-300 hover:transform hover:-translate-y-0.5 flex-shrink-0 min-w-[120px]">
              <div className="text-center">
                <div className="text-2xl font-black text-[#FF1801] mb-1">
                  {data.corners}
                </div>
                <div className="text-[10px] uppercase text-white/50 font-medium tracking-wider">
                  {language === 'ko' ? '코너' : 'CORNERS'}
                </div>
              </div>
            </div>

            {/* DRS 존 */}
            <div className="bg-gradient-to-br from-[#1A1A1A]/60 to-[#0A0A0A]/80 backdrop-blur-xl rounded-xl p-4 border border-white/10 hover:border-[#FF1801]/30 transition-all duration-300 hover:transform hover:-translate-y-0.5 flex-shrink-0 min-w-[120px]">
              <div className="text-center">
                <div className="text-2xl font-black text-white mb-1">{performanceData.drsZones}</div>
                <div className="text-[10px] uppercase text-white/50 font-medium tracking-wider">
                  DRS ZONES
                </div>
              </div>
            </div>

            {/* 최고 속도 */}
            <div className="bg-gradient-to-br from-[#1A1A1A]/60 to-[#0A0A0A]/80 backdrop-blur-xl rounded-xl p-4 border border-white/10 hover:border-[#FF1801]/30 transition-all duration-300 hover:transform hover:-translate-y-0.5 flex-shrink-0 min-w-[120px]">
              <div className="text-center">
                <div className="text-2xl font-black text-white mb-1">
                  {performanceData.topSpeed}<span className="text-xs font-medium text-white/70">km/h</span>
                </div>
                <div className="text-[10px] uppercase text-white/50 font-medium tracking-wider">
                  TOP SPEED
                </div>
              </div>
            </div>

            {/* 총 거리 */}
            <div className="bg-gradient-to-br from-[#1A1A1A]/60 to-[#0A0A0A]/80 backdrop-blur-xl rounded-xl p-4 border border-white/10 hover:border-[#FF1801]/30 transition-all duration-300 hover:transform hover:-translate-y-0.5 flex-shrink-0 min-w-[120px]">
              <div className="text-center">
                <div className="text-2xl font-black text-white mb-1">
                  {Math.round(parseFloat(String(data.totalDistance)))}<span className="text-xs font-medium text-white/70">km</span>
                </div>
                <div className="text-[10px] uppercase text-white/50 font-medium tracking-wider">
                  {language === 'ko' ? '총 거리' : 'TOTAL DIST'}
                </div>
              </div>
            </div>

            {/* 랩 길이 */}
            <div className="bg-gradient-to-br from-[#1A1A1A]/60 to-[#0A0A0A]/80 backdrop-blur-xl rounded-xl p-4 border border-white/10 hover:border-[#FF1801]/30 transition-all duration-300 hover:transform hover:-translate-y-0.5 flex-shrink-0 min-w-[120px]">
              <div className="text-center">
                <div className="text-2xl font-black text-white mb-1">
                  {Math.round(parseFloat(String(data.length)) * 10) / 10}<span className="text-xs font-medium text-white/70">km</span>
                </div>
                <div className="text-[10px] uppercase text-white/50 font-medium tracking-wider">
                  {language === 'ko' ? '랩 길이' : 'LAP LENGTH'}
                </div>
              </div>
            </div>

            {/* 피트 손실 */}
            <div className="bg-gradient-to-br from-[#1A1A1A]/60 to-[#0A0A0A]/80 backdrop-blur-xl rounded-xl p-4 border border-white/10 hover:border-[#FF1801]/30 transition-all duration-300 hover:transform hover:-translate-y-0.5 flex-shrink-0 min-w-[120px]">
              <div className="text-center">
                <div className="text-2xl font-black text-white mb-1">
                  {performanceData.pitLoss}<span className="text-xs font-medium text-white/70">s</span>
                </div>
                <div className="text-[10px] uppercase text-white/50 font-medium tracking-wider">
                  {language === 'ko' ? '피트 손실' : 'PIT LOSS'}
                </div>
              </div>
            </div>
          </div>

          {/* 네비게이션 버튼 - 카드 중간 높이에 위치 */}
          <button
            onClick={() => {
              const carousel = document.getElementById('stats-carousel');
              if (carousel) {
                carousel.scrollBy({ left: -150, behavior: 'smooth' });
              }
            }}
            className="absolute left-0 top-10 text-white/60 hover:text-[#FF1801] transition-all duration-300 hover:-translate-x-1 z-10"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            onClick={() => {
              const carousel = document.getElementById('stats-carousel');
              if (carousel) {
                carousel.scrollBy({ left: 150, behavior: 'smooth' });
              }
            }}
            className="absolute right-0 top-10 text-white/60 hover:text-[#FF1801] transition-all duration-300 hover:translate-x-1 z-10"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* 인디케이터 도트 */}
          <div className="flex justify-center gap-2 mt-4">
            {[0, 1, 2, 3, 4, 5, 6].map((index) => (
              <button
                key={index}
                onClick={() => {
                  const carousel = document.getElementById('stats-carousel');
                  if (carousel) {
                    carousel.scrollTo({ left: index * 150, behavior: 'smooth' });
                  }
                }}
                className="w-2 h-2 rounded-full bg-white/20 hover:bg-[#FF1801]/50 transition-all duration-300"
              />
            ))}
          </div>
        </div>

      </div>

      {/* Lap Record - 모던한 디자인 */}
      {data.lapRecord && (
        <div className="relative bg-gradient-to-br from-[#1A1A1A]/60 to-[#0A0A0A]/80 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-[#FF1801]/30 transition-all duration-300">
          {/* 배경 장식 - 미니멀 */}
          <div className="absolute -top-2 -right-2 w-16 h-16 bg-[#FF1801]/5 rounded-full blur-xl"></div>
          
          <div className="relative z-10">
            {/* 헤더 - 심플하게 */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-1 h-6 bg-gradient-to-b from-[#FF1801] to-[#FF1801]/60 rounded-full"></div>
                <h3 className="text-base font-black text-white uppercase tracking-wide">
                  {language === 'ko' ? '랩 레코드' : 'LAP RECORD'}
                </h3>
              </div>
              <div className="text-xs uppercase text-[#FF1801]/60 font-semibold tracking-wider">
                FASTEST
              </div>
            </div>
            
            {/* 메인 콘텐츠 - 시간 정보만 */}
            <div className="space-y-4">
              <div className="text-5xl font-black text-white tracking-tight">
                {data.lapRecord.time}
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-white/50 font-medium">
                    {language === 'ko' ? '드라이버' : 'Driver'}
                  </span>
                  <span className="text-xl font-bold text-white">{data.lapRecord.driver}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-white/50 font-medium">
                    {language === 'ko' ? '연도' : 'Year'}
                  </span>
                  <span className="text-lg text-white/80 font-medium">{data.lapRecord.year}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 구분선 */}
      <div className="flex items-center gap-4 my-8">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
        <div className="text-xs uppercase text-white/40 font-semibold tracking-[0.2em]">
          {language === 'ko' ? '스케줄' : 'SCHEDULE'}
        </div>
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
      </div>

      {/* Race Weekend - 마스터 스케줄 카드 */}
      <div className="relative bg-gradient-to-br from-[#1A1A1A]/40 to-[#0A0A0A]/60 backdrop-blur-xl rounded-2xl overflow-hidden border border-white/5">
        <div className="p-6">
          <div className="text-xs uppercase tracking-[0.2em] text-[#FF1801]/60 mb-6">
            {language === 'ko' ? '레이스 주말' : 'RACE WEEKEND'}
          </div>
          
          {/* 통합 스케줄 */}
          <div className="space-y-3">
            {isLoadingSchedule ? (
              // 로딩 상태
              <div className="flex justify-center py-8">
                <div className="text-sm text-white/40">{language === 'ko' ? '스케줄 로딩 중...' : 'Loading schedule...'}</div>
              </div>
            ) : raceData?.schedule ? (
              // API 데이터로 렌더링
              <>
                {/* Practice 1 */}
                {raceData.schedule.fp1 && raceData.schedule.fp1.date && (
                  <div className="flex justify-between items-center py-3 px-4 rounded-lg bg-white/5">
                    <div>
                      <div className="text-sm text-white/60 font-medium">
                        {f1ApiService.getSessionName('fp1', language)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-white">
                        {f1ApiService.formatSessionDate(raceData.schedule.fp1, language)}
                      </div>
                    </div>
                  </div>
                )}

                {/* Practice 2 */}
                {raceData.schedule.fp2 && raceData.schedule.fp2.date && (
                  <div className="flex justify-between items-center py-3 px-4 rounded-lg bg-white/5">
                    <div>
                      <div className="text-sm text-white/60 font-medium">
                        {f1ApiService.getSessionName('fp2', language)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-white">
                        {f1ApiService.formatSessionDate(raceData.schedule.fp2, language)}
                      </div>
                    </div>
                  </div>
                )}

                {/* Practice 3 */}
                {raceData.schedule.fp3 && raceData.schedule.fp3.date && (
                  <div className="flex justify-between items-center py-3 px-4 rounded-lg bg-white/5">
                    <div>
                      <div className="text-sm text-white/60 font-medium">
                        {f1ApiService.getSessionName('fp3', language)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-white">
                        {f1ApiService.formatSessionDate(raceData.schedule.fp3, language)}
                      </div>
                    </div>
                  </div>
                )}

                {/* Sprint Qualifying */}
                {raceData.schedule.sprintQualy && raceData.schedule.sprintQualy.date && (
                  <div className="flex justify-between items-center py-3 px-4 rounded-lg bg-white/5">
                    <div>
                      <div className="text-sm text-white/60 font-medium">
                        {f1ApiService.getSessionName('sprintQualy', language)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-white">
                        {f1ApiService.formatSessionDate(raceData.schedule.sprintQualy, language)}
                      </div>
                    </div>
                  </div>
                )}

                {/* Qualifying */}
                {raceData.schedule.qualy && raceData.schedule.qualy.date && (
                  <div className="flex justify-between items-center py-3 px-4 rounded-lg bg-white/5">
                    <div>
                      <div className="text-sm text-white/60 font-medium">
                        {f1ApiService.getSessionName('qualy', language)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-white">
                        {f1ApiService.formatSessionDate(raceData.schedule.qualy, language)}
                      </div>
                    </div>
                  </div>
                )}

                {/* Sprint */}
                {raceData.schedule.sprintRace && raceData.schedule.sprintRace.date && (
                  <div className="flex justify-between items-center py-3 px-4 rounded-lg bg-white/5">
                    <div>
                      <div className="text-sm text-white/60 font-medium">
                        {f1ApiService.getSessionName('sprintRace', language)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-white">
                        {f1ApiService.formatSessionDate(raceData.schedule.sprintRace, language)}
                      </div>
                    </div>
                  </div>
                )}

                {/* Grand Prix */}
                {raceData.schedule.race && raceData.schedule.race.date && (
                  <div className="flex justify-between items-center py-3 px-4 rounded-lg bg-white/5">
                    <div>
                      <div className="text-sm text-white/60 font-medium">
                        {f1ApiService.getSessionName('race', language)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-white">
                        {f1ApiService.formatSessionDate(raceData.schedule.race, language)}
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              // 데이터가 없을 경우
              <div className="flex justify-center py-8">
                <div className="text-sm text-white/40">
                  {language === 'ko' ? '스케줄 정보를 찾을 수 없습니다' : 'Schedule information not available'}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>


      <div className="flex gap-3">
        <button className="flex-1 bg-[#1A1A1A] hover:bg-[#2A2A2A] text-white font-medium py-2 px-4 rounded border border-[#FF1801]/20 transition-colors text-sm">
          {language === 'ko' ? '공식 티켓' : 'Official Tickets'}
        </button>
        <button className="flex-1 bg-[#1A1A1A] hover:bg-[#2A2A2A] text-white font-medium py-2 px-4 rounded border border-[#FF1801]/20 transition-colors text-sm">
          {language === 'ko' ? '현지 정보' : 'Local Info'}
        </button>
      </div>

    </div>
  );
};