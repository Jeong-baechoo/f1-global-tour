'use client';

import React from 'react';
import { ChevronRight, MapPin, Calendar } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getText } from '@/utils/i18n';
import { useCountdown } from '../hooks/useCountdown';
import { NextRaceData } from '../types';
import { WeatherWidget } from './WeatherWidget';

interface NextRacePanelProps {
  data: NextRaceData;
  isMobile: boolean;
  sheetState?: 'closed' | 'peek' | 'half' | 'full';
  onExploreCircuit?: () => void;
}

export const NextRacePanel: React.FC<NextRacePanelProps> = ({
  data,
  onExploreCircuit
}) => {
  const { language } = useLanguage();
  const countdown = useCountdown(data.raceDate);

  const formatScheduleDateTime = (dateTimeString: string | undefined) => {
    if (!dateTimeString) return null;
    
    const date = new Date(dateTimeString);
    const day = date.toLocaleDateString(language === 'ko' ? 'ko-KR' : 'en-US', {
      month: 'short',
      day: 'numeric'
    });
    const time = date.toLocaleTimeString(language === 'ko' ? 'ko-KR' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    
    return { day, time };
  };

  const getSessionName = (sessionKey: string): string => {
    const sessionNames = {
      ko: {
        practice1: '연습주행 1',
        practice2: '연습주행 2', 
        practice3: '연습주행 3',
        qualifying: '예선',
        sprintRace: '스프린트',
        sprintQualy: '스프린트 예선'
      },
      en: {
        practice1: 'Practice 1',
        practice2: 'Practice 2',
        practice3: 'Practice 3',
        qualifying: 'Qualifying',
        sprintRace: 'Sprint',
        sprintQualy: 'Sprint Qualifying'
      }
    };
    
    return sessionNames[language][sessionKey as keyof typeof sessionNames.en] || sessionKey;
  };

  // 스케줄 세션들을 정렬된 순서로 렌더링
  const renderScheduleSession = (sessionKey: string, sessionDateTime: string | undefined) => {
    if (!sessionDateTime) return null;
    
    const formatted = formatScheduleDateTime(sessionDateTime);
    if (!formatted) return null;

    return (
      <div key={sessionKey} className="flex justify-between items-center py-2 border-b border-[#FF1801]/10">
        <span className="text-[#C0C0C0] text-sm">{getSessionName(sessionKey)}</span>
        <div className="text-right">
          <div className="text-white text-sm font-medium">
            {formatted.day}
          </div>
          <div className="text-[#C0C0C0] text-sm">
            {formatted.time}
          </div>
        </div>
      </div>
    );
  };

  // 표시할 세션들을 정의된 순서대로 정렬
  const getOrderedSessions = () => {
    if (!data.schedule) return [];
    
    const sessionOrder = ['practice1', 'sprintQualy', 'sprintRace', 'qualifying'];
    return sessionOrder
      .filter(sessionKey => data.schedule![sessionKey as keyof typeof data.schedule])
      .map(sessionKey => ({
        key: sessionKey,
        dateTime: data.schedule![sessionKey as keyof typeof data.schedule]
      }));
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-[#FF1801]/20 pb-4">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-6 bg-[#FF1801] rounded-full" />
          <span className="text-xs text-[#C0C0C0] uppercase tracking-widest">
            {language === 'ko' ? '다음 레이스' : 'NEXT RACE'}
          </span>
        </div>
        <h2 className="text-xl font-bold text-white mt-2">
          {getText(data.grandPrix, language)}
        </h2>
      </div>

      <div className="bg-[#1A1A1A]/60 backdrop-blur-sm rounded border border-[#FF1801]/20 p-4 sm:p-6">
        <div className="text-center mb-4">
          <div className="text-[#C0C0C0] text-xs tracking-widest mb-2">
            {language === 'ko' ? '레이스 시작까지' : 'RACE STARTS IN'}
          </div>
          <div className="flex justify-center gap-2 sm:gap-4">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-[#FF1801]">{countdown.days}</div>
              <div className="text-[10px] sm:text-xs text-[#C0C0C0] uppercase">
                {language === 'ko' ? '일' : 'Days'}
              </div>
            </div>
            <div className="text-2xl sm:text-3xl text-[#FF1801]">:</div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-[#FF1801]">{String(countdown.hours).padStart(2, '0')}</div>
              <div className="text-[10px] sm:text-xs text-[#C0C0C0] uppercase">
                {language === 'ko' ? '시간' : 'Hours'}
              </div>
            </div>
            <div className="text-2xl sm:text-3xl text-[#FF1801]">:</div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-[#FF1801]">{String(countdown.minutes).padStart(2, '0')}</div>
              <div className="text-[10px] sm:text-xs text-[#C0C0C0] uppercase">
                {language === 'ko' ? '분' : 'Minutes'}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3 mt-6 pt-4 border-t border-[#FF1801]/10">
          <div className="flex items-center gap-3">
            <MapPin className="w-4 h-4 text-[#C0C0C0]" />
            <div>
              <div className="text-white font-medium">{getText(data.name, language)}</div>
              <div className="text-xs text-[#C0C0C0]">
                {`${getText(data.location.city, language)}, ${getText(data.location.country, language)}`}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Calendar className="w-4 h-4 text-[#C0C0C0]" />
            <div className="text-sm text-white">
              {new Date(data.raceDate).toLocaleDateString(language === 'ko' ? 'ko-KR' : 'en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 레이스 스케줄 */}
      {data.schedule && (
        <div className="bg-[#1A1A1A]/40 backdrop-blur-sm rounded border border-[#FF1801]/10 p-4">
          <div className="text-center mb-4">
            <div className="text-[#C0C0C0] text-xs tracking-widest mb-3">
              {language === 'ko' ? '레이스 스케줄' : 'RACE SCHEDULE'}
            </div>
          </div>
          
          <div className="space-y-2">
            {getOrderedSessions().map(session => 
              renderScheduleSession(session.key, session.dateTime)
            )}
          </div>
        </div>
      )}

      {/* 날씨 정보 */}
      <WeatherWidget raceData={data} className="w-full" />

      <button
        onClick={onExploreCircuit}
        className="w-full bg-[#FF1801] hover:bg-[#FF1801]/90 text-white font-bold py-3 px-4 rounded transition-colors flex items-center justify-center gap-2 uppercase tracking-wider"
      >
        {language === 'ko' ? '서킷 탐험' : 'Explore Circuit'}
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
};