'use client';

import { Camera, CameraOff } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { ModuleHeader } from '../ui/ModuleHeader';
import type { PanelData } from '@/types/panel';

interface CircuitDetailContentProps {
  data: PanelData | null | undefined;
  isMobile: boolean;
  sheetState: 'closed' | 'peek' | 'half' | 'full';
  isCinematicMode?: boolean;
  onToggleCinematicMode?: () => void;
}

export default function CircuitDetailContent({
  data,
  isMobile,
  sheetState,
  isCinematicMode = false,
  onToggleCinematicMode
}: CircuitDetailContentProps) {
  const { language } = useLanguage();

  return (
    <div className={isMobile ? "space-y-4" : "space-y-6"}>
      <ModuleHeader 
        module="circuit-detail" 
        data={data} 
        isMobile={isMobile} 
        sheetState={sheetState} 
      />

      <div className="grid grid-cols-2 gap-3">
        <div className={isMobile ? "bg-[#1A1A1A]/60 backdrop-blur-sm p-3 rounded border border-[#FF1801]/20" : "bg-[#1A1A1A]/60 backdrop-blur-sm p-4 rounded border border-[#FF1801]/20"}>
          <div className="text-xs text-[#C0C0C0] uppercase tracking-wider">{language === 'ko' ? '코너' : 'Corners'}</div>
          <div className={isMobile ? "text-xl font-bold text-white mt-1" : "text-2xl font-bold text-white mt-1"}>{data?.corners || '10'}</div>
        </div>
        <div className={isMobile ? "bg-[#1A1A1A]/60 backdrop-blur-sm p-3 rounded border border-[#FF1801]/20" : "bg-[#1A1A1A]/60 backdrop-blur-sm p-4 rounded border border-[#FF1801]/20"}>
          <div className="text-xs text-[#C0C0C0] uppercase tracking-wider">{language === 'ko' ? '서킷 길이' : 'Circuit Length'}</div>
          <div className={isMobile ? "text-xl font-bold text-white mt-1" : "text-2xl font-bold text-white mt-1"}>{data?.length || '4.318'} <span className="text-sm text-[#C0C0C0]">km</span></div>
        </div>
        <div className={isMobile ? "bg-[#1A1A1A]/60 backdrop-blur-sm p-3 rounded border border-[#FF1801]/20" : "bg-[#1A1A1A]/60 backdrop-blur-sm p-4 rounded border border-[#FF1801]/20"}>
          <div className="text-xs text-[#C0C0C0] uppercase tracking-wider">{language === 'ko' ? '총 랩 수' : 'Total Laps'}</div>
          <div className={isMobile ? "text-xl font-bold text-white mt-1" : "text-2xl font-bold text-white mt-1"}>{data?.laps || '71'}</div>
        </div>
        <div className={isMobile ? "bg-[#1A1A1A]/60 backdrop-blur-sm p-3 rounded border border-[#FF1801]/20" : "bg-[#1A1A1A]/60 backdrop-blur-sm p-4 rounded border border-[#FF1801]/20"}>
          <div className="text-xs text-[#C0C0C0] uppercase tracking-wider">{language === 'ko' ? '레이스 거리' : 'Race Distance'}</div>
          <div className={isMobile ? "text-xl font-bold text-white mt-1" : "text-2xl font-bold text-white mt-1"}>{data?.totalDistance || '306.5'} <span className="text-sm text-[#C0C0C0]">km</span></div>
        </div>
      </div>

      {/* Lap Record Section */}
      {data?.lapRecord && (
        <div className="bg-[#1A1A1A]/60 backdrop-blur-sm p-4 rounded border border-[#FF1801]/20">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3">
            {language === 'ko' ? '랩 레코드' : 'Lap Record'}
          </h3>
          <div className="space-y-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-[#FF1801] mb-1">{data.lapRecord.time}</div>
              <div className="text-sm text-white font-medium">{data.lapRecord.driver}</div>
              <div className="text-xs text-[#C0C0C0]">{data.lapRecord.year}</div>
            </div>
          </div>
        </div>
      )}

      {/* Race Weekend Schedule */}
      <div className="bg-[#1A1A1A]/60 backdrop-blur-sm p-4 rounded border border-[#FF1801]/20">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3">
          {language === 'ko' ? '레이스 주말 일정 (KST)' : 'Race Weekend Schedule (KST)'}
        </h3>
        <div className="space-y-2">
          {data?.schedule ? (
            <>
              {data.schedule.practice1 && (
                <div className="flex justify-between items-center py-2 border-b border-[#1A1A1A]">
                  <span className="text-sm text-[#C0C0C0]">{language === 'ko' ? '연습주행 1' : 'Practice 1'}</span>
                  <span className="text-sm text-white font-medium">{data.schedule.practice1}</span>
                </div>
              )}
              {data.schedule.practice2 && (
                <div className="flex justify-between items-center py-2 border-b border-[#1A1A1A]">
                  <span className="text-sm text-[#C0C0C0]">{language === 'ko' ? '연습주행 2' : 'Practice 2'}</span>
                  <span className="text-sm text-white font-medium">{data.schedule.practice2}</span>
                </div>
              )}
              {data.schedule.practice3 && (
                <div className="flex justify-between items-center py-2 border-b border-[#1A1A1A]">
                  <span className="text-sm text-[#C0C0C0]">{language === 'ko' ? '연습주행 3' : 'Practice 3'}</span>
                  <span className="text-sm text-white font-medium">{data.schedule.practice3}</span>
                </div>
              )}
              {data.schedule.qualifying && (
                <div className="flex justify-between items-center py-2 border-b border-[#1A1A1A]">
                  <span className="text-sm text-[#C0C0C0]">{language === 'ko' ? '예선' : 'Qualifying'}</span>
                  <span className="text-sm text-white font-medium">{data.schedule.qualifying}</span>
                </div>
              )}
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-[#C0C0C0]">{language === 'ko' ? '레이스' : 'Race'}</span>
                <span className="text-sm text-white font-medium">{data.schedule.race}</span>
              </div>
            </>
          ) : (
            // 기본 스케줄 (데이터가 없을 때)
            <>
              <div className="flex justify-between items-center py-2 border-b border-[#1A1A1A]">
                <span className="text-sm text-[#C0C0C0]">{language === 'ko' ? '연습주행 1' : 'Practice 1'}</span>
                <span className="text-sm text-white font-medium">{language === 'ko' ? '6월 27일 (금) 20:30' : 'June 27 (Fri) 20:30'}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-[#1A1A1A]">
                <span className="text-sm text-[#C0C0C0]">{language === 'ko' ? '예선' : 'Qualifying'}</span>
                <span className="text-sm text-white font-medium">{language === 'ko' ? '6월 28일 (토) 23:00' : 'June 28 (Sat) 23:00'}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-[#C0C0C0]">{language === 'ko' ? '레이스' : 'Race'}</span>
                <span className="text-sm text-white font-medium">{language === 'ko' ? '6월 29일 (일) 22:00' : 'June 29 (Sun) 22:00'}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 시네마틱 모드 버튼 - 데스크탑 패널에만 표시 */}
      {!isMobile && onToggleCinematicMode && (
        <button
          onClick={onToggleCinematicMode}
          className={`w-full font-bold py-3 px-4 rounded transition-all duration-300 flex items-center justify-center gap-2 uppercase tracking-wider border ${
            isCinematicMode
              ? 'bg-[#FF1801] text-white border-[#FF1801] hover:bg-[#FF1801]/90'
              : 'bg-[#1A1A1A]/60 backdrop-blur-sm text-white border-[#FF1801]/20 hover:bg-[#1A1A1A]/80'
          }`}
        >
          {isCinematicMode ? (
            <>
              <CameraOff className="w-5 h-5" />
              {language === 'ko' ? '시네마틱 투어 정지' : 'Stop Cinematic Tour'}
            </>
          ) : (
            <>
              <Camera className="w-5 h-5" />
              {language === 'ko' ? '시네마틱 투어 시작' : 'Start Cinematic Tour'}
            </>
          )}
        </button>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button className="flex-1 bg-[#1A1A1A]/60 backdrop-blur-sm hover:bg-[#1A1A1A]/80 text-white font-medium py-2 px-4 rounded border border-[#FF1801]/20 transition-colors text-sm">
          {language === 'ko' ? '공식 티켓' : 'Official Tickets'}
        </button>
        <button className="flex-1 bg-[#1A1A1A]/60 backdrop-blur-sm hover:bg-[#1A1A1A]/80 text-white font-medium py-2 px-4 rounded border border-[#FF1801]/20 transition-colors text-sm">
          {language === 'ko' ? '현지 정보' : 'Local Info'}
        </button>
      </div>
    </div>
  );
}