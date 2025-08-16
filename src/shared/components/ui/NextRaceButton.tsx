'use client';

import React from 'react';
import { CalendarDays } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface NextRaceButtonProps {
  onClickAction: () => void;
  isActive?: boolean;
}

export default function NextRaceButton({ onClickAction, isActive = false }: NextRaceButtonProps) {
  const { language } = useLanguage();

  return (
    <button
      onClick={onClickAction}
      className={`
        group relative w-12 h-12 rounded-full transition-all duration-300 ease-out
        backdrop-blur-md border border-white/10 shadow-lg hover:shadow-xl z-30
        ${isActive 
          ? 'bg-[#FF1801]/20 border-[#FF1801]/40 shadow-[#FF1801]/20' 
          : 'bg-black/40 hover:bg-black/60 hover:border-white/20'
        }
      `}
      title={language === 'ko' ? '다음 레이스' : 'Next Race'}
    >
      {/* 버튼 내부 아이콘 */}
      <div className={`
        flex items-center justify-center w-full h-full transition-all duration-300
        ${isActive ? 'text-[#FF1801]' : 'text-white/70 group-hover:text-white'}
      `}>
        <CalendarDays 
          size={18} 
          className="transition-transform duration-300 group-hover:scale-110"
        />
      </div>

      {/* 호버 시 툴팁 */}
      <div className={`
        absolute left-14 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg
        bg-black/80 backdrop-blur-md border border-white/10 text-white text-sm
        opacity-0 group-hover:opacity-100 transition-all duration-300
        pointer-events-none whitespace-nowrap z-20
        transform translate-x-2 group-hover:translate-x-0
      `}>
        {language === 'ko' ? '다음 레이스' : 'Next Race'}
        
        {/* 툴팁 화살표 */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-0 h-0 border-t-[4px] border-b-[4px] border-r-[4px] border-transparent border-r-black/80" />
      </div>

      {/* 활성 상태 표시 */}
      {isActive && (
        <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-[#FF1801] rounded-full border-2 border-black animate-pulse" />
      )}
    </button>
  );
}

NextRaceButton.displayName = 'NextRaceButton';