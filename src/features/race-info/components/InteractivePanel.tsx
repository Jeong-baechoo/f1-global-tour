'use client';

import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import { usePanelStore } from '../store';
import { NextRacePanel } from './NextRacePanel';
import { TeamHQPanel } from './TeamHQPanel';
import { CircuitDetailPanel } from './CircuitDetailPanel';
import { CircuitDetailData, NextRaceData, TeamHQData } from '../types';
import { usePanelDrag, SHEET_HEIGHTS } from '../hooks/usePanelDrag';
import { Minus, X, Building2, Route, Calendar, Clock3, Flag, Factory } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getText } from '@/utils/i18n';

interface InteractivePanelProps {
  isOpen: boolean;
  onCloseAction: () => void;
  onMinimize?: () => void;
  isMinimized?: boolean;
  module: 'next-race' | 'circuit-detail' | 'team-hq' | null;
  data?: any | null;
  onExploreCircuit?: () => void;
  isCinematicMode?: boolean;
  onToggleCinematicMode?: () => void;
}

// Header configuration based on module type
const getHeaderConfig = (module: string | null, data: any, language: 'en' | 'ko') => {
  switch (module) {
    case 'team-hq':
      return {
        title: language === 'ko' ? '팀 본부' : 'TEAM HQ',
        icon: Building2,
        accentColor: data?.colors?.primary || '#FF1801',
        subtitle: data?.name ? getText(data.name, language) : ''
      };
    case 'circuit-detail':
      return {
        title: language === 'ko' ? '서킷 정보' : 'CIRCUIT INFO',
        icon: Route,
        accentColor: '#FF1801',
        subtitle: data?.name ? getText(data.name, language) : ''
      };
    case 'next-race':
      return {
        title: language === 'ko' ? '다음 레이스' : 'NEXT RACE',
        icon: Calendar,
        accentColor: '#FF1801',
        subtitle: data?.grandPrix ? getText(data.grandPrix, language) : ''
      };
    default:
      return {
        title: language === 'ko' ? '정보' : 'INFO',
        icon: Flag,
        accentColor: '#FF1801',
        subtitle: ''
      };
  }
};

export const InteractivePanel: React.FC<InteractivePanelProps> = ({
  isOpen,
  onCloseAction,
  onMinimize,
  isMinimized = false,
  module,
  data,
  onExploreCircuit,
  isCinematicMode = false,
  onToggleCinematicMode
}) => {
  const { language } = useLanguage();
  const { setPanelModule, setPanelData } = usePanelStore();
  const [isMobile, setIsMobile] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);


  const {
    sheetRef,
    sheetState,
    isDragging,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
    handleHeaderClick
  } = usePanelDrag(onCloseAction);

  // 모바일 체크 및 마운트 상태
  useEffect(() => {
    setMounted(true);
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);


  // Zustand 스토어와 동기화
  useEffect(() => {
    setPanelModule(module);
    setPanelData(data);
  }, [module, data, setPanelModule, setPanelData]);

  // 드래그 중일 때 글로벌 이벤트 리스너 추가
  useEffect(() => {
    if (isDragging) {
      const handleGlobalTouchMove = (e: TouchEvent) => {
        handleDragMove(e as React.TouchEvent | React.MouseEvent | TouchEvent);
      };

      document.addEventListener('touchmove', handleGlobalTouchMove, { passive: false });

      return () => {
        document.removeEventListener('touchmove', handleGlobalTouchMove);
      };
    }
  }, [isDragging, handleDragMove]);

  const renderContent = () => {
    switch (module) {
      case 'next-race':
        return <NextRacePanel
          data={data as NextRaceData}
          isMobile={isMobile}
          sheetState={isMobile ? sheetState : undefined}
          onExploreCircuit={onExploreCircuit}
        />;
      case 'circuit-detail':
        return <CircuitDetailPanel
          data={data as CircuitDetailData}
          isMobile={isMobile}
          sheetState={isMobile ? sheetState : undefined}
          isCinematicMode={isCinematicMode}
          onToggleCinematicMode={onToggleCinematicMode}
        />;
      case 'team-hq':
        return <TeamHQPanel
          data={data as TeamHQData}
          isMobile={isMobile}
          sheetState={isMobile ? sheetState : undefined}
        />;
      default:
        return null;
    }
  };


  // Get header configuration
  const headerConfig = getHeaderConfig(module, data, language);
  const HeaderIcon = headerConfig.icon;

  // Early return if not mounted to prevent SSR issues
  if (!mounted) return null;

  return (
    <>
      {/* Desktop Panel - Slide from right with enhanced design */}
      {!isMobile && (
        <div
          className={`fixed transform transition-all duration-300 ease-out ${
            isOpen ? 'translate-x-0 opacity-100 visible' : 'translate-x-full opacity-0 invisible'
          }`}
          style={{
            width: '420px',
            zIndex: 9999,
            pointerEvents: isOpen ? 'auto' : 'none',
            right: '60px',
            top: '60px',
            bottom: '60px',
            filter: isOpen ? 'drop-shadow(0 30px 60px rgba(0,0,0,0.3)) drop-shadow(0 15px 30px rgba(0,0,0,0.2))' : 'none'
          }}
        >
        <div className="h-full rounded-3xl overflow-hidden relative border shadow-2xl"
             style={{
               backgroundColor: 'rgba(18, 18, 20, 0.65)',
               backdropFilter: 'blur(20px) saturate(180%)',
               WebkitBackdropFilter: 'blur(20px) saturate(180%)',
               borderColor: 'rgba(255, 255, 255, 0.08)',
               boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,0.05)'
             }}>
          {/* Inner container */}
          <div className="relative h-full rounded-3xl overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF1801]/10 rounded-full blur-3xl transform translate-x-32 -translate-y-32" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#FF1801]/5 rounded-full blur-2xl transform -translate-x-24 translate-y-24" />

            {/* Dynamic Header with smooth gradient */}
            <div className="relative px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Dynamic accent indicator */}
                  <div 
                    className="w-1 h-5 rounded-full transition-all duration-300" 
                    style={{ backgroundColor: headerConfig.accentColor }}
                  />
                  <div className="flex items-center gap-2.5">
                    {/* Dynamic icon */}
                    <HeaderIcon 
                      className="w-4 h-4 text-white/50 transition-all duration-300" 
                      strokeWidth={1.5}
                    />
                    <div>
                      <h3 className="text-xs font-medium text-white/70 uppercase tracking-[0.2em] transition-all duration-300">
                        {headerConfig.title}
                      </h3>
                      {headerConfig.subtitle && (
                        <p className="text-[10px] text-white/40 mt-0.5 truncate max-w-[200px]">
                          {headerConfig.subtitle}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-0.5">
                  <button
                    onClick={onMinimize}
                    className="p-1.5 rounded-lg hover:bg-white/[0.05] transition-all duration-300 group"
                  >
                    <Minus 
                      className="w-3 h-3 text-white/30 group-hover:text-white/60 transition-colors" 
                      strokeWidth={1.5}
                    />
                  </button>
                  <button
                    onClick={onCloseAction}
                    className="p-1.5 rounded-lg hover:bg-white/[0.05] transition-all duration-300 group"
                  >
                    <X 
                      className="w-3 h-3 text-white/30 group-hover:text-[#FF1801] transition-colors" 
                      strokeWidth={1.5}
                    />
                  </button>
                </div>
              </div>
              {/* Subtle gradient separator instead of hard border */}
              <div 
                className="absolute bottom-0 left-0 right-0 h-px"
                style={{
                  background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.1) 20%, rgba(255,255,255,0.1) 80%, transparent)'
                }}
              />
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden">
              <div className="p-6">
                {module ? renderContent() : null}
              </div>
            </div>

            {/* Footer gradient fade */}
            <div className="absolute bottom-0 left-0 right-0">
              <div className="h-16 bg-gradient-to-t from-[rgba(20,20,22,0.9)] to-transparent pointer-events-none" />
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Mobile Panel - Interactive Bottom Sheet */}
      {isMobile && isOpen && (
        <div
          ref={sheetRef}
          className="fixed inset-x-0 bottom-0 bg-[#0A0A0A]/80 backdrop-blur-xl border-t border-[#FF1801]/20 rounded-t-2xl shadow-2xl flex flex-col"
          style={{
            zIndex: 9999,
            height: sheetState === 'peek' ? `${SHEET_HEIGHTS.peek}px` :
                    sheetState === 'half' ? `${SHEET_HEIGHTS.half}vh` :
                    sheetState === 'full' ? `${SHEET_HEIGHTS.full}vh` : '0',
          }}
        >
        {/* Drag Handle Area */}
        <div className="sticky top-0 z-10 bg-[#1A1A1A]/60 backdrop-blur-sm rounded-t-2xl">
          {/* Handle Bar - 드래그 영역을 핸들 바로만 제한 */}
          <div
            className="handle-bar flex justify-center pt-2 pb-1 cursor-grab active:cursor-grabbing"
            style={{ touchAction: 'none' }}
            onTouchStart={handleDragStart}
            onTouchEnd={handleDragEnd}
            onMouseDown={handleDragStart}
            onMouseMove={isDragging ? handleDragMove : undefined}
            onMouseUp={handleDragEnd}
            onMouseLeave={handleDragEnd}
          >
            <div className="w-12 h-1 bg-[#FF1801]/30 rounded-full" />
          </div>

          {/* Peek State - Dynamic title */}
          {sheetState === 'peek' && (
            <div className="px-4 pb-3" onClick={handleHeaderClick}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-1 h-5 rounded-full" 
                    style={{ backgroundColor: headerConfig.accentColor }}
                  />
                  <div className="flex items-center gap-2">
                    <HeaderIcon className="w-4 h-4 text-white/50" strokeWidth={1.5} />
                    <div>
                      <h3 className="text-white font-semibold text-base">
                        {headerConfig.subtitle || headerConfig.title}
                      </h3>
                      {module === 'circuit-detail' && data?.location && (
                        <p className="text-xs text-[#C0C0C0] mt-0.5">
                          {typeof data.location === 'string' ? data.location :
                           typeof data.location === 'object' && 'city' in data.location ?
                           `${getText(data.location.city, language)}, ${getText(data.location.country, language)}` :
                           ''}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCloseAction();
                  }}
                  className="text-[#C0C0C0] hover:text-[#FF1801] transition-colors p-1.5 -mr-1.5"
                >
                  <X className="w-4 h-4" strokeWidth={1.5} />
                </button>
              </div>
            </div>
          )}

          {/* Half/Full State - Dynamic header */}
          {(sheetState === 'half' || sheetState === 'full') && (
            <div className="px-4 pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div 
                    className="w-1 h-5 rounded-full transition-all duration-300" 
                    style={{ backgroundColor: headerConfig.accentColor }}
                  />
                  <HeaderIcon 
                    className="w-4 h-4 text-white/50" 
                    strokeWidth={1.5}
                  />
                  <span className="text-xs text-[#C0C0C0] uppercase tracking-widest">
                    {headerConfig.title}
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCloseAction();
                  }}
                  className="text-[#C0C0C0] hover:text-[#FF1801] transition-colors p-1.5 -mr-1.5"
                >
                  <X className="w-4 h-4" strokeWidth={1.5} />
                </button>
              </div>
              {/* Gradient separator */}
              <div 
                className="absolute bottom-0 left-4 right-4 h-px"
                style={{
                  background: 'linear-gradient(to right, transparent, rgba(255,26,1,0.2) 20%, rgba(255,26,1,0.2) 80%, transparent)'
                }}
              />
            </div>
          )}
        </div>

        {/* Content Area */}
        {(sheetState === 'half' || sheetState === 'full') && (
          <div
            className="flex-1 overflow-y-auto overflow-x-hidden px-4 scrollbar-hide"
            style={{
              WebkitOverflowScrolling: 'touch',
              overscrollBehavior: 'contain'
            }}
          >
            <div className="pt-4" style={{ paddingBottom: '60px' }}>
              {renderContent()}
            </div>
          </div>
        )}

        </div>
      )}
    </>
  );
};

InteractivePanel.displayName = 'InteractivePanel';
