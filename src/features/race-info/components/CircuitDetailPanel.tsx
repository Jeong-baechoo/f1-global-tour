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
    <div className={isMobile ? "space-y-4" : "space-y-6"}>
      {/* Circuit Header - Enhanced Visual Hierarchy */}
      <div className="relative">
        {/* Grand Prix name as hero */}
        <div className="text-xs uppercase tracking-[0.2em] text-[#FF1801]/60 font-medium mb-1">
          {language === 'ko' ? '그랑프리' : 'GRAND PRIX'}
        </div>
        <h2 className="text-3xl font-black tracking-tight text-white mb-2">
          {getText(data.grandPrix, language)}
        </h2>
        <div className="flex items-center gap-3 text-sm text-white/60">
          <div className="w-1 h-1 rounded-full bg-white/40" />
          <span>{getText(data.name, language)}</span>
          <div className="w-1 h-1 rounded-full bg-white/40" />
          <span>{getText(data.location.city, language)}, {getText(data.location.country, language)}</span>
        </div>
      </div>

      {/* Circuit Stats - Visual Hierarchy with Hero Stats */}
      <div className="space-y-4">
        {/* Hero Stat - Race Distance */}
        <div className="relative bg-gradient-to-br from-[#1A1A1A]/40 to-[#0A0A0A]/60 backdrop-blur-xl rounded-2xl p-6 overflow-hidden border border-white/5">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF1801]/10 rounded-full blur-3xl" />
          
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-[#FF1801]/60 mb-2">
                {language === 'ko' ? '레이스 정보' : 'RACE INFO'}
              </div>
              <div className="flex items-baseline gap-3">
                <div className="text-5xl font-black text-white">
                  {data.laps}
                </div>
                <div className="text-lg font-medium text-white/40">
                  {language === 'ko' ? '랩' : 'LAPS'}
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2 text-sm text-white/60">
                <span>{data.totalDistance} km</span>
                <div className="w-1 h-1 rounded-full bg-white/40" />
                <span>{data.length} km {language === 'ko' ? '랩 당' : 'per lap'}</span>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-4xl font-black text-[#FF1801]">
                {data.corners}
              </div>
              <div className="text-xs uppercase text-white/40 mt-1">
                {language === 'ko' ? '코너' : 'CORNERS'}
              </div>
            </div>
          </div>
        </div>
        
        {/* Secondary Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-gradient-to-br from-[#0A0A0A]/30 to-[#0A0A0A]/40 backdrop-blur-sm rounded-xl p-3 border border-white/5 text-center">
            <div className="text-2xl font-bold text-white mb-1">2</div>
            <div className="text-[10px] uppercase text-white/40">DRS Zones</div>
          </div>
          <div className="bg-gradient-to-br from-[#0A0A0A]/30 to-[#0A0A0A]/40 backdrop-blur-sm rounded-xl p-3 border border-white/5 text-center">
            <div className="text-2xl font-bold text-white mb-1">23s</div>
            <div className="text-[10px] uppercase text-white/40">{language === 'ko' ? '피트 손실' : 'Pit Loss'}</div>
          </div>
          <div className="bg-gradient-to-br from-[#0A0A0A]/30 to-[#0A0A0A]/40 backdrop-blur-sm rounded-xl p-3 border border-white/5 text-center">
            <div className="text-2xl font-bold text-white mb-1">320</div>
            <div className="text-[10px] uppercase text-white/40">km/h Top</div>
          </div>
        </div>
      </div>

      {/* Lap Record - Hero Card */}
      {data.lapRecord && (
        <div className="relative bg-gradient-to-r from-[#FF1801]/10 to-[#FF1801]/5 backdrop-blur-sm rounded-2xl p-6 overflow-hidden border border-[#FF1801]/20">
          <div className="absolute -top-8 -right-8 text-[120px] font-black text-[#FF1801]/10 leading-none">
            1
          </div>
          
          <div className="relative z-10">
            <div className="text-xs uppercase tracking-[0.2em] text-[#FF1801] mb-3">
              {language === 'ko' ? '🏁 랩 레코드' : '🏁 LAP RECORD'}
            </div>
            
            <div className="flex items-end justify-between">
              <div>
                <div className="text-4xl font-black text-white mb-2">
                  {data.lapRecord.time}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-medium text-white">{data.lapRecord.driver}</span>
                  <span className="text-sm text-white/40">• {data.lapRecord.year}</span>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-sm text-white/60">
                  {language === 'ko' ? '평균 속도' : 'AVG SPEED'}
                </div>
                <div className="text-2xl font-bold text-[#FF1801]">
                  ~230 <span className="text-sm">km/h</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Race Weekend Schedule - 임시로 하드코딩 */}
      <div className="bg-[#1A1A1A]/60 backdrop-blur-sm p-4 rounded border border-[#FF1801]/20">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3">
          {language === 'ko' ? '레이스 주말 일정 (KST)' : 'Race Weekend Schedule (KST)'}
        </h3>
        <div className="space-y-2">
          <div className="flex justify-between items-center py-2 border-b border-[#1A1A1A]">
            <span className="text-sm text-[#C0C0C0]">{language === 'ko' ? '연습주행 1' : 'Practice 1'}</span>
            <span className="text-sm text-white font-medium">금 20:30</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-[#1A1A1A]">
            <span className="text-sm text-[#C0C0C0]">{language === 'ko' ? '예선' : 'Qualifying'}</span>
            <span className="text-sm text-white font-medium">토 00:00</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-[#1A1A1A]">
            <span className="text-sm text-[#C0C0C0]">{language === 'ko' ? '연습주행 2' : 'Practice 2'}</span>
            <span className="text-sm text-white font-medium">토 19:30</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-sm text-[#FF1801] font-bold">{language === 'ko' ? '그랑프리' : 'Grand Prix'}</span>
            <span className="text-sm text-[#FF1801] font-bold">일 22:00</span>
          </div>
        </div>
      </div>

      {/* Weather & Race Weekend Combined Card */}
      <div className="relative bg-gradient-to-br from-[#1A1A1A]/40 to-[#0A0A0A]/60 backdrop-blur-xl rounded-2xl overflow-hidden border border-white/5">
        <div className="p-6">
          <div className="text-xs uppercase tracking-[0.2em] text-[#FF1801]/60 mb-4">
            {language === 'ko' ? '레이스 주말' : 'RACE WEEKEND'}
          </div>
          
          {/* Weather Row */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-3xl mb-1">☀️</div>
                <div className="text-sm font-medium text-white">28°C</div>
                <div className="text-[10px] text-white/40">FRI</div>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-1">⛅</div>
                <div className="text-sm font-medium text-white">26°C</div>
                <div className="text-[10px] text-white/40">SAT</div>
              </div>
              <div className="text-center relative">
                <div className="text-3xl mb-1">🌧️</div>
                <div className="text-sm font-medium text-white">24°C</div>
                <div className="text-[10px] text-[#FF1801] font-bold">RACE DAY</div>
                <div className="absolute -top-2 -right-2 bg-[#FF1801] text-white text-[9px] px-1 rounded">70%</div>
              </div>
            </div>
          </div>
          
          {/* Schedule */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-white/60">Practice 1</span>
              <span className="text-sm font-medium text-white">금 20:30</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-white/60">Qualifying</span>
              <span className="text-sm font-medium text-white">토 00:00</span>
            </div>
            <div className="flex justify-between items-center py-3 px-4 -mx-4 bg-[#FF1801]/10 rounded-xl border border-[#FF1801]/20">
              <span className="text-sm font-bold text-[#FF1801]">
                {language === 'ko' ? '그랑프리' : 'GRAND PRIX'}
              </span>
              <span className="text-sm font-bold text-[#FF1801]">일 22:00 KST</span>
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

      {/* Circuit History */}
      <div className="bg-[#1A1A1A]/60 backdrop-blur-sm p-4 rounded border border-[#FF1801]/20">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3">
          {language === 'ko' ? '서킷 하이라이트' : 'Circuit Highlights'}
        </h3>
        <div className="space-y-2 text-sm text-[#C0C0C0]">
          <p>• {language === 'ko' ? '가장 인기 있는 추월 구간: Turn 1 & Turn 4' : 'Most popular overtaking zones: Turn 1 & Turn 4'}</p>
          <p>• {language === 'ko' ? 'DRS 구간: 2개 (메인 직선구간 & 백 스트레이트)' : 'DRS Zones: 2 (Main straight & Back straight)'}</p>
          <p>• {language === 'ko' ? '평균 피트스톱 시간 손실: 23초' : 'Average pit stop time loss: 23 seconds'}</p>
        </div>
      </div>
    </div>
  );
};