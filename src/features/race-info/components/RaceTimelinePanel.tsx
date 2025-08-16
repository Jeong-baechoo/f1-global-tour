'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Circuit } from '@/src/shared/types';
import { getText } from '@/utils/i18n';

interface RaceTimelinePanelProps {
  isOpen: boolean;
  onClose: () => void;
  raceSchedule: Circuit[];
  selectedRaceId?: string;
  onRaceSelect: (circuit: Circuit) => void;
  maxHeight?: string;
}

const RaceTimelinePanel: React.FC<RaceTimelinePanelProps> = ({
  isOpen,
  onClose,
  raceSchedule,
  selectedRaceId,
  onRaceSelect,
  maxHeight = '100vh'
}) => {
  const { language } = useLanguage();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // 날짜 포맷팅 함수
  const formatRaceDate = (dateString: string) => {
    const date = new Date(dateString);
    const month = date.toLocaleDateString(language === 'ko' ? 'ko-KR' : 'en-US', { month: 'short' });
    const day = date.getDate();
    return `${month.toUpperCase()} ${day}`;
  };

  // 선택된 레이스로 스크롤하는 함수
  const scrollToSelectedRace = useCallback((raceId: string) => {
    if (!scrollContainerRef.current || !isOpen) return;

    const container = scrollContainerRef.current;
    const raceElement = container.querySelector(`[data-race-id="${raceId}"]`) as HTMLElement;
    
    if (raceElement) {
      const containerRect = container.getBoundingClientRect();
      const elementRect = raceElement.getBoundingClientRect();
      
      // 요소의 중앙을 컨테이너의 중앙으로 이동
      const elementCenter = elementRect.top + elementRect.height / 2;
      const containerCenter = containerRect.top + containerRect.height / 2;
      const scrollOffset = elementCenter - containerCenter;
      
      const newScrollTop = container.scrollTop + scrollOffset;
      const maxScrollTop = container.scrollHeight - container.clientHeight;
      
      // 경계 체크
      const targetScrollTop = Math.max(0, Math.min(newScrollTop, maxScrollTop));
      
      // 부드러운 스크롤
      container.scrollTo({
        top: targetScrollTop,
        behavior: 'smooth'
      });
    }
  }, [isOpen]);

  // selectedRaceId가 변경될 때 자동 스크롤
  useEffect(() => {
    if (selectedRaceId && isOpen) {
      // 패널이 완전히 열린 후 스크롤하도록 약간의 지연
      const timeoutId = setTimeout(() => {
        scrollToSelectedRace(selectedRaceId);
      }, 350); // 슬라이드 애니메이션(300ms) 후
      
      return () => clearTimeout(timeoutId);
    }
  }, [selectedRaceId, isOpen, scrollToSelectedRace]);

  return (
    <>
      {/* 배경 오버레이 */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 sm:hidden"
          onClick={onClose}
        />
      )}

      {/* 슬라이드 패널 */}
      <div className={`fixed top-0 left-0 z-50 transform transition-transform duration-300 ease-out sm:hidden ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
      style={{ height: maxHeight }}
      >
        <div className="w-80 bg-[#1A1A1A] shadow-2xl" style={{ height: maxHeight }}>
          {/* 헤더 */}
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              {/* F1 빨간색 세로 바 */}
              <div className="w-1 h-6 bg-[#FF1801] rounded-full"></div>
              <h2 className="text-white font-semibold text-lg tracking-wide">
                {language === 'ko' ? '2025 시즌 일정' : '2025 RACE CALENDAR'}
              </h2>
            </div>
            
            {/* 닫기 버튼 */}
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center text-white/70 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* 레이스 리스트 스크롤 영역 */}
          <div 
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto p-4 space-y-2" 
            style={{ height: `calc(${maxHeight} - 80px)` }}
          >
            {raceSchedule.map((circuit) => (
              <div
                key={circuit.id}
                data-race-id={circuit.id}
                onClick={() => onRaceSelect(circuit)}
                className={`p-4 rounded-lg cursor-pointer transition-all duration-200 border ${
                  selectedRaceId === circuit.id
                    ? 'bg-[#FF1801]/10 border-[#FF1801]/50'
                    : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                }`}
              >
                {/* 레이스 아이템 내용 */}
                <div className="flex items-start gap-3">
                  {/* 빨간 점 */}
                  <div className="w-2 h-2 bg-[#FF1801] rounded-full mt-2 flex-shrink-0"></div>
                  
                  {/* 레이스 정보 */}
                  <div className="flex-1 min-w-0">
                    <div className="text-white/60 text-xs font-medium uppercase tracking-wider mb-1">
                      {circuit.raceDate2025 ? formatRaceDate(circuit.raceDate2025) : 'TBD'}
                    </div>
                    <div className="text-white text-sm font-semibold leading-tight">
                      {getText(circuit.grandPrix, language)}
                    </div>
                    <div className="text-white/40 text-xs mt-1">
                      {language === 'ko' ? `${circuit.round}라운드` : `Round ${circuit.round}`} • {getText(circuit.location.country, language)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default RaceTimelinePanel;