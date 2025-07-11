'use client';

import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getText } from '@/utils/i18n';
import { CircuitDetailData } from '../types';

interface CircuitDetailPanelProps {
  data: CircuitDetailData;
  isMobile: boolean;
  sheetState?: 'closed' | 'peek' | 'half' | 'full';
}

export const CircuitDetailPanel: React.FC<CircuitDetailPanelProps> = ({
  data,
  isMobile
}) => {
  const { language } = useLanguage();

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
            className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide scroll-smooth mx-8"
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
                <div className="text-2xl font-black text-white mb-1">2</div>
                <div className="text-[10px] uppercase text-white/50 font-medium tracking-wider">
                  DRS ZONES
                </div>
              </div>
            </div>

            {/* 최고 속도 */}
            <div className="bg-gradient-to-br from-[#1A1A1A]/60 to-[#0A0A0A]/80 backdrop-blur-xl rounded-xl p-4 border border-white/10 hover:border-[#FF1801]/30 transition-all duration-300 hover:transform hover:-translate-y-0.5 flex-shrink-0 min-w-[120px]">
              <div className="text-center">
                <div className="text-2xl font-black text-white mb-1">
                  320<span className="text-xs font-medium text-white/70">km/h</span>
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
                  {Math.round(parseFloat(data.totalDistance))}<span className="text-xs font-medium text-white/70">km</span>
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
                  {Math.round(parseFloat(data.length) * 10) / 10}<span className="text-xs font-medium text-white/70">km</span>
                </div>
                <div className="text-[10px] uppercase text-white/50 font-medium tracking-wider">
                  {language === 'ko' ? '랩 길이' : 'LAP LENGTH'}
                </div>
              </div>
            </div>

            {/* 피트 손실 */}
            <div className="bg-gradient-to-br from-[#1A1A1A]/60 to-[#0A0A0A]/80 backdrop-blur-xl rounded-xl p-4 border border-white/10 hover:border-[#FF1801]/30 transition-all duration-300 hover:transform hover:-translate-y-0.5 flex-shrink-0 min-w-[120px] group relative">
              <div className="text-center">
                <div className="text-2xl font-black text-white mb-1">
                  23<span className="text-xs font-medium text-white/70">s</span>
                </div>
                <div className="flex items-center justify-center gap-1">
                  <div className="text-[10px] uppercase text-white/50 font-medium tracking-wider">
                    {language === 'ko' ? '피트 손실' : 'PIT LOSS'}
                  </div>
                  <div className="w-2 h-2 rounded-full bg-white/20 flex items-center justify-center text-[7px] text-white/60">
                    ?
                  </div>
                </div>
              </div>
              {/* 툴팁 */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1.5 bg-black/80 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                {language === 'ko' ? '피트스탑 시 평균 시간 손실' : 'Average time lost during pit stop'}
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
            className="absolute left-0 top-6 text-white/60 hover:text-[#FF1801] transition-all duration-300 hover:-translate-x-1 z-10"
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
            className="absolute right-0 top-6 text-white/60 hover:text-[#FF1801] transition-all duration-300 hover:translate-x-1 z-10"
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
          
          {/* 통합 스케줄 - 날씨 정보와 함께 */}
          <div className="space-y-3">
            {/* Practice 1 - 금요일 */}
            <div className="flex justify-between items-center py-3 px-4 rounded-lg bg-white/5">
              <div className="flex items-center gap-3">
                <div className="text-lg">☀️</div>
                <div>
                  <div className="text-sm text-white/60 font-medium">{language === 'ko' ? '연습주행 1' : 'Practice 1'}</div>
                  <div className="text-xs text-white/40">28°C • {language === 'ko' ? '맑음' : 'Clear'}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-white">금 20:30</div>
                <div className="text-xs text-white/40">KST</div>
              </div>
            </div>

            {/* Qualifying - 토요일 새벽 */}
            <div className="flex justify-between items-center py-3 px-4 rounded-lg bg-white/5">
              <div className="flex items-center gap-3">
                <div className="text-lg">⛅</div>
                <div>
                  <div className="text-sm text-white/60 font-medium">{language === 'ko' ? '예선' : 'Qualifying'}</div>
                  <div className="text-xs text-white/40">26°C • {language === 'ko' ? '구름' : 'Cloudy'}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-white">토 00:00</div>
                <div className="text-xs text-white/40">KST</div>
              </div>
            </div>

            {/* Practice 2 - 토요일 저녁 */}
            <div className="flex justify-between items-center py-3 px-4 rounded-lg bg-white/5">
              <div className="flex items-center gap-3">
                <div className="text-lg">⛅</div>
                <div>
                  <div className="text-sm text-white/60 font-medium">{language === 'ko' ? '연습주행 2' : 'Practice 2'}</div>
                  <div className="text-xs text-white/40">26°C • {language === 'ko' ? '구름' : 'Cloudy'}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-white">토 19:30</div>
                <div className="text-xs text-white/40">KST</div>
              </div>
            </div>
            
            {/* Grand Prix - 위 스케줄과 동일한 레이아웃 */}
            <div className="flex justify-between items-center py-3 px-4 rounded-lg bg-white/5">
              <div className="flex items-center gap-3">
                <div className="text-lg">🌧️</div>
                <div>
                  <div className="text-sm text-white/60 font-medium">{language === 'ko' ? '그랑프리' : 'Grand Prix'}</div>
                  <div className="text-xs text-white/40">24°C • {language === 'ko' ? '구름' : 'Rain'}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-white">일 22:00</div>
                <div className="text-xs text-white/40">KST</div>
              </div>
            </div>
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