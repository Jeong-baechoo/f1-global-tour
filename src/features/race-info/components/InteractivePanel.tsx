'use client';

import React, { useEffect } from 'react';
import { NextRacePanel } from './NextRacePanel';
import { TeamHQPanel } from './TeamHQPanel';
import { CircuitDetailPanel } from './CircuitDetailPanel';
import { CircuitDetailData, NextRaceData, TeamHQData } from '../types';
import { usePanelDrag, SHEET_HEIGHTS } from '../hooks/usePanelDrag';
import { Minus, X, Building2, Route, Calendar, Flag, Maximize2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getText } from '@/utils/i18n';
import type { PanelData } from '../types';

interface InteractivePanelProps {
  isOpen: boolean;
  onCloseAction: () => void;
  onMinimize?: () => void;
  isMinimized?: boolean;
  module: 'next-race' | 'circuit-detail' | 'team-hq' | null;
  data?: PanelData | null;
  onExploreCircuit?: () => void;
}

// Header configuration based on module type
const getHeaderConfig = (module: string | null, data: PanelData | null, language: 'en' | 'ko') => {
  switch (module) {
    case 'team-hq':
      return {
        title: language === 'ko' ? '팀 본부' : 'TEAM HQ',
        icon: Building2,
        accentColor: data?.color || '#FF1801',
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
  onExploreCircuit
}) => {
  const { language } = useLanguage();
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
  const headerConfig = getHeaderConfig(module, data || null, language);
  const HeaderIcon = headerConfig.icon;

  // Early return if not mounted to prevent SSR issues
  if (!mounted) return null;

  return (
    <>
      {/* Desktop Panel - Slide from right with enhanced design */}
      {!isMobile && isOpen && (
        <div
          className="fixed transform transition-all duration-300 ease-out translate-x-0 opacity-100 visible"
          style={{
            width: isMinimized ? '320px' : '420px',
            height: isMinimized ? '102px' : undefined,
            zIndex: 9999,
            pointerEvents: 'auto',
            right: '20px',
            top: isMinimized ? 'auto' : '60px',
            bottom: isMinimized ? '24px' : '24px',
            filter: 'drop-shadow(0 30px 60px rgba(0,0,0,0.3)) drop-shadow(0 15px 30px rgba(0,0,0,0.2))'
          }}
        >
          <div 
            className={`h-full rounded-3xl overflow-hidden relative border shadow-2xl ${isMinimized ? 'cursor-pointer' : ''}`}
            style={{
              backgroundColor: 'rgba(18, 18, 20, 0.65)',
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              borderColor: 'rgba(255, 255, 255, 0.08)',
              boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,0.05)'
            }}
            onClick={isMinimized ? onMinimize : undefined}
          >
            {/* Inner container */}
            <div className="relative h-full rounded-3xl overflow-hidden">
              {/* Inner padding wrapper */}
              <div className={`h-full ${isMinimized ? 'px-6 py-0 flex items-center justify-between' : 'p-4 flex flex-col'}`}>
                {isMinimized ? (
                  <>
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0">
                        <HeaderIcon
                          className="text-white/60 transition-all duration-300 w-5 h-5"
                          strokeWidth={1.5}
                          style={{ color: headerConfig.accentColor }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-white/90 uppercase tracking-wider text-xs leading-tight mb-1">
                          {headerConfig.title}
                        </h3>
                        {headerConfig.subtitle && (
                          <p className="font-medium text-white/70 truncate text-lg leading-tight">
                            {headerConfig.subtitle}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5">
                      <button
                        onClick={onMinimize}
                        className="p-1.5 rounded-xl hover:bg-white/[0.05] transition-all duration-300 group"
                      >
                        <Maximize2
                          className="text-white/30 group-hover:text-white/60 transition-colors w-4 h-4"
                          strokeWidth={1.5}
                        />
                      </button>
                      <button
                        onClick={onCloseAction}
                        className="p-1.5 rounded-xl hover:bg-white/[0.05] transition-all duration-300 group"
                      >
                        <X
                          className="text-white/30 group-hover:text-[#FF1801] transition-colors w-4 h-4"
                          strokeWidth={1.5}
                        />
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="relative px-6 pt-3 pb-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="mt-1">
                            <HeaderIcon
                              className="text-white/60 transition-all duration-300 w-5 h-5"
                              strokeWidth={1.5}
                              style={{ color: headerConfig.accentColor }}
                            />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-white/90 uppercase tracking-wider text-sm mb-1">
                              {headerConfig.title}
                            </h3>
                            {headerConfig.subtitle && (
                              <p className="font-medium text-white/70 text-lg">
                                {headerConfig.subtitle}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={onMinimize}
                            className="p-2 rounded-xl hover:bg-white/[0.05] transition-all duration-300 group"
                          >
                            <Minus
                              className="text-white/30 group-hover:text-white/60 transition-colors w-3.5 h-3.5"
                              strokeWidth={1.5}
                            />
                          </button>
                          <button
                            onClick={onCloseAction}
                            className="p-2 rounded-xl hover:bg-white/[0.05] transition-all duration-300 group"
                          >
                            <X
                              className="text-white/30 group-hover:text-[#FF1801] transition-colors w-3.5 h-3.5"
                              strokeWidth={1.5}
                            />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Content with inner padding */}
                    <div className="flex-1 overflow-y-auto overflow-x-hidden rounded-2xl bg-black/10">
                      <div className="p-6">
                        {module ? renderContent() : null}
                      </div>
                    </div>
                  </>
                )}
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