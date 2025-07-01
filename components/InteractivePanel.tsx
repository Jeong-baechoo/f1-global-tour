'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { ChevronRight, MapPin, Calendar, Minus } from 'lucide-react';
import { ModuleHeader } from './ui/ModuleHeader';
import Image from 'next/image';
import { useLanguage } from '@/contexts/LanguageContext';
import { getText } from '@/utils/i18n';
import CircuitDetailContent from './InteractivePanel/CircuitDetailContent';
import type { PanelData } from '@/types/panel';
import type { Driver } from './mapbox/types';

// 스타일 상수들을 컴포넌트 외부로 분리
const MOBILE_CONTENT_STYLE = {
  touchAction: 'pan-y' as const,
  WebkitOverflowScrolling: 'touch' as const,
  overscrollBehavior: 'contain' as const,
  height: '100%',
  maxHeight: '100%',
  paddingBottom: 'max(20px, env(safe-area-inset-bottom))'
};

const SHEET_HEIGHTS = {
  closed: 0,
  peek: 80, // 80px - 핸들과 제목만 보임
  half: 45, // 45vh - 중간 상태
  full: 85  // 85vh - 전체 상태
} as const;

// 드래그 동작 임계값
const DRAG_THRESHOLDS = {
  minDrag: 50,        // 최소 드래그 거리
  closeDistance: 100, // 패널 닫기 임계값
  snapThreshold: {
    peek: 20,         // peek 상태 스냅 임계값 (vh)
    half: 65          // half 상태 스냅 임계값 (vh)
  }
} as const;

// 콘텐츠 최소 높이
const MIN_CONTENT_HEIGHT = 'calc(100vh - 200px)';

// 콘텐츠 하단 패딩
const CONTENT_BOTTOM_PADDING = '80px'; // pb-20 equivalent

interface InteractivePanelProps {
  isOpen: boolean;
  onCloseAction: () => void;
  onMinimize?: () => void;
  isMinimized?: boolean;
  module: 'next-race' | 'circuit-detail' | 'team-hq' | null;
  data?: PanelData | null | undefined;
  onExploreCircuit?: () => void;
  isCinematicMode?: boolean;
  onToggleCinematicMode?: () => void;
}

export default function InteractivePanel({
  isOpen,
  onCloseAction,
  onMinimize,
  isMinimized = false,
  module,
  data,
  onExploreCircuit,
  isCinematicMode = false,
  onToggleCinematicMode
}: InteractivePanelProps) {
  const { language } = useLanguage();
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const [sheetState, setSheetState] = useState<'closed' | 'peek' | 'half' | 'full'>('peek');
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (isOpen && isMobile) {
      setSheetState('peek');
    }
  }, [isOpen, isMobile]);

  // 드래그 핸들러들을 useCallback으로 최적화
  const handleDragStart = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    setIsDragging(true);
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setStartY(clientY);
  }, []);

  const handleDragMove = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (!isDragging || !sheetRef.current) return;

    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const deltaY = startY - clientY;

    // 현재 높이 계산
    const windowHeight = window.innerHeight;
    let currentHeight = 0;

    if (sheetState === 'peek') currentHeight = SHEET_HEIGHTS.peek;
    else if (sheetState === 'half') currentHeight = (SHEET_HEIGHTS.half / 100) * windowHeight;
    else if (sheetState === 'full') currentHeight = (SHEET_HEIGHTS.full / 100) * windowHeight;

    const newHeight = currentHeight + deltaY;
    const heightPercent = (newHeight / windowHeight) * 100;

    // 높이 제한
    if (newHeight >= SHEET_HEIGHTS.peek && heightPercent <= SHEET_HEIGHTS.full) {
      sheetRef.current.style.height = `${newHeight}px`;
    }
  }, [isDragging, startY, sheetState]);

  const handleDragEnd = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (!isDragging || !sheetRef.current) return;
    setIsDragging(false);

    const clientY = 'touches' in e ? e.changedTouches[0].clientY : e.clientY;
    const deltaY = startY - clientY;
    const windowHeight = window.innerHeight;
    const currentHeightPx = sheetRef.current.offsetHeight;
    const currentHeightVh = (currentHeightPx / windowHeight) * 100;

    // 드래그 방향과 현재 높이에 따라 상태 결정
    if (deltaY > DRAG_THRESHOLDS.minDrag) { // 위로 드래그
      if (sheetState === 'peek') setSheetState('half');
      else if (sheetState === 'half') setSheetState('full');
    } else if (deltaY < -DRAG_THRESHOLDS.minDrag) { // 아래로 드래그
      if (sheetState === 'full') setSheetState('half');
      else if (sheetState === 'half') setSheetState('peek');
      else if (sheetState === 'peek' && deltaY < -DRAG_THRESHOLDS.closeDistance) {
        onCloseAction();
        return;
      }
    } else {
      // 가장 가까운 snap point로 이동
      if (currentHeightVh < DRAG_THRESHOLDS.snapThreshold.peek) setSheetState('peek');
      else if (currentHeightVh < DRAG_THRESHOLDS.snapThreshold.half) setSheetState('half');
      else setSheetState('full');
    }
  }, [isDragging, startY, sheetState, onCloseAction]);

  // 클릭으로 상태 전환
  const handleHeaderClick = useCallback(() => {
    if (sheetState === 'peek') setSheetState('half');
    else if (sheetState === 'half') setSheetState('full');
  }, [sheetState]);


  useEffect(() => {
    if (module === 'next-race' && data?.raceDate) {
      const raceDate = data.raceDate; // Capture the value for TypeScript
      const interval = setInterval(() => {
        const now = new Date().getTime();
        const raceTime = new Date(raceDate).getTime();
        const distance = raceTime - now;

        if (distance > 0) {
          setCountdown({
            days: Math.floor(distance / (1000 * 60 * 60 * 24)),
            hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
            minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
            seconds: Math.floor((distance % (1000 * 60)) / 1000)
          });
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [module, data]);

  const renderContent = () => {
    switch (module) {
      case 'next-race':
        return (
          <div className="space-y-6">
            <ModuleHeader 
              module={module} 
              data={data} 
              isMobile={isMobile} 
              sheetState={sheetState} 
            />

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

              <div className="space-y-3 mt-6">
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-[#C0C0C0]" />
                  <div>
                    <div className="text-white font-medium">{data?.name ? getText(data.name, language) : 'Red Bull Ring'}</div>
                    <div className="text-xs text-[#C0C0C0]">
                      {typeof data?.location === 'string' ? data.location : 
                       typeof data?.location === 'object' && 'city' in data.location ?
                       `${getText(data.location.city, language)}, ${getText(data.location.country, language)}` :
                       'Spielberg, Austria'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-[#C0C0C0]" />
                  <div className="text-sm text-white">
                    {data?.raceDate ? new Date(data.raceDate).toLocaleDateString(language === 'ko' ? 'ko-KR' : 'en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    }) : 'June 29, 2025'}
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={onExploreCircuit}
              className="w-full bg-[#FF1801] hover:bg-[#FF1801]/90 text-white font-bold py-3 px-4 rounded transition-colors flex items-center justify-center gap-2 uppercase tracking-wider"
            >
              {language === 'ko' ? '서킷 탐험' : 'Explore Circuit'}
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        );

      case 'circuit-detail':
        return (
          <CircuitDetailContent
            data={data}
            isMobile={isMobile}
            sheetState={sheetState}
            isCinematicMode={isCinematicMode}
            onToggleCinematicMode={onToggleCinematicMode}
          />
        );

      case 'team-hq':
        return (
          <div className="space-y-6">
            <ModuleHeader 
              module={module} 
              data={data} 
              isMobile={isMobile} 
              sheetState={sheetState} 
            />

            {/* Team HQ image placeholder - uncomment when images are available
            {data?.hqImage && (
              <div className="relative h-48 bg-[#0F0F0F] rounded overflow-hidden border border-[#FF1801]/20">
                <Image
                  src={data.hqImage}
                  alt={`${data.name || ''} HQ`}
                  width={400}
                  height={192}
                  className="w-full h-full object-cover"
                />
              </div>
            )} */}

            <div className="space-y-4">
              <div>
                <h3 className="text-xs text-[#C0C0C0] uppercase tracking-wider mb-2">
                  {language === 'ko' ? '본부' : 'Headquarters'}
                </h3>
                <p className="text-white">
                  {data?.headquarters?.city ? getText(data.headquarters.city, language) : 
                   (typeof data?.location === 'object' && 'city' in data.location ? getText(data.location.city, language) : 'Brackley')},
                  {' '}
                  {data?.headquarters?.country ? getText(data.headquarters.country, language) : 
                   (typeof data?.location === 'object' && 'country' in data.location ? getText(data.location.country, language) : 'United Kingdom')}
                </p>
              </div>

              <div>
                <h3 className="text-xs text-[#C0C0C0] uppercase tracking-wider mb-2">
                  {language === 'ko' ? '팀 대표' : 'Team Principal'}
                </h3>
                <p className="text-white font-medium">
                  {data?.principal ? getText(data.principal, language) : 'Toto Wolff'}
                </p>
              </div>

              {data?.drivers2025 && (
                <div>
                  <h3 className="text-xs text-[#C0C0C0] uppercase tracking-wider mb-3">
                    {language === 'ko' ? '2025 드라이버' : '2025 Drivers'}
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {data.drivers2025.map((driver: Driver, index: number) => (
                      <div key={index} className="text-center bg-[#0F0F0F]/60 rounded-lg p-3 border border-[#FF1801]/10">
                        <div className="w-16 h-16 mx-auto mb-2 rounded-full overflow-hidden bg-[#1A1A1A] border border-[#FF1801]/20">
                          <Image 
                            src={driver.image} 
                            alt={driver.name}
                            width={64}
                            height={64}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const fallback = target.nextElementSibling as HTMLElement;
                              if (fallback) fallback.style.display = 'flex';
                            }}
                          />
                          <div className="w-full h-full hidden items-center justify-center text-xs text-[#C0C0C0]">
                            #{driver.number}
                          </div>
                        </div>
                        <p className="text-white text-sm font-medium mb-1">{driver.name}</p>
                        <p className="text-xs text-[#C0C0C0]">{driver.nationality}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {data?.car2025 && (
                <div>
                  <h3 className="text-xs text-[#C0C0C0] uppercase tracking-wider mb-3">
                    {language === 'ko' ? '2025 머신' : '2025 Car'}
                  </h3>
                  <div className="bg-[#0F0F0F]/60 rounded-lg p-4 border border-[#FF1801]/10">
                    <div className="text-center mb-3">
                      <h4 className="text-white font-bold text-lg mb-2">{data.car2025.name}</h4>
                    </div>
                    <div className="relative h-24 bg-[#1A1A1A] rounded overflow-hidden border border-[#FF1801]/20">
                      <Image
                        src={data.car2025.image}
                        alt={data.car2025.name}
                        width={300}
                        height={96}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const fallback = target.nextElementSibling as HTMLElement;
                          if (fallback) fallback.style.display = 'flex';
                        }}
                      />
                      <div className="w-full h-full hidden items-center justify-center text-sm text-[#C0C0C0]">
                        {data.car2025.name} Image
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {data?.championships2025 && (
                <div>
                  <h3 className="text-xs text-[#C0C0C0] uppercase tracking-wider mb-3">
                    {language === 'ko' ? '2025 챔피언십' : '2025 Championship'}
                  </h3>
                  <div className="space-y-4">
                    <div className="bg-[#0F0F0F]/60 rounded-lg p-4 border border-[#FF1801]/10">
                      <div className="text-center mb-3">
                        <div className="text-2xl font-bold text-white mb-1">{data.championships2025.totalPoints}</div>
                        <div className="text-xs text-[#C0C0C0] uppercase tracking-wider">
                          {language === 'ko' ? '총 포인트' : 'Total Points'}
                        </div>
                      </div>
                    </div>
                    <div className="bg-[#0F0F0F]/60 rounded-lg p-4 border border-[#FF1801]/10">
                      <h4 className="text-xs text-[#C0C0C0] uppercase tracking-wider mb-3">
                        {language === 'ko' ? '모든 레이스 결과' : 'All Race Results'}
                      </h4>
                      <div className="space-y-2 max-h-24 overflow-y-auto scrollbar-transparent">
                        {data.championships2025.raceResults.slice().reverse().map((result, index) => (
                          <div key={index} className="flex justify-between items-center py-1">
                            <span className="text-sm text-white">{result.race}</span>
                            <span className="text-sm font-medium text-[#FF8700]">
                              {result.points} {language === 'ko' ? '점' : 'pts'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-[#1A1A1A]/60 backdrop-blur-sm p-4 rounded border border-[#FF1801]/20">
              <h3 className="text-xs text-[#C0C0C0] uppercase tracking-wider mb-3">
                {language === 'ko' ? '최신 팀 뉴스' : 'Latest Team News'}
              </h3>
              <div className="space-y-2">
                <div className="text-sm text-white hover:text-[#FF1801] cursor-pointer transition-colors">
                  • {language === 'ko' ? 
                      '새로운 공력 패키지 풍동 테스트 완료' : 
                      'New aerodynamic package tested in wind tunnel'}
                </div>
                <div className="text-sm text-white hover:text-[#FF1801] cursor-pointer transition-colors">
                  • {language === 'ko' ? 
                      '드라이버 계약 연장 발표' : 
                      'Driver contract extension announced'}
                </div>
                <div className="text-sm text-white hover:text-[#FF1801] cursor-pointer transition-colors">
                  • {language === 'ko' ? 
                      '기술 파트너십 갱신 확정' : 
                      'Technical partnership renewal confirmed'}
                </div>
              </div>
            </div>

            <button
              className="w-full text-white font-bold py-3 px-4 rounded transition-colors flex items-center justify-center gap-2 uppercase tracking-wider border"
              style={{
                backgroundColor: data?.color ? `${data.color}20` : '#FF180120',
                borderColor: data?.color || '#FF1801'
              }}
            >
              {language === 'ko' ? '공식 팀 스토어' : 'Official Team Store'}
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      {/* Desktop Panel - Slide from right */}
      <div
        className={`hidden sm:block fixed right-0 bg-[#1A1A1A]/60 backdrop-blur-sm border-l border-[#FF1801]/20 transform transition-all duration-300 ease-in-out z-50 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        } ${isMinimized ? 'w-[60px] h-[60px] top-32 rounded-l-lg' : 'w-[400px] h-full top-0'}`}
      >
        <div className="relative h-full w-full flex flex-col">
          {/* Minimized state - 최소화된 상태 */}
          {isMinimized ? (
            <div className="w-full h-full flex items-center justify-center">
              <button
                onClick={onMinimize}
                className="text-[#C0C0C0] hover:text-[#FF1801] transition-colors p-2"
                title="패널 열기"
              >
                <ChevronRight className="w-6 h-6 transform rotate-180" />
              </button>
            </div>
          ) : (
            <>
              {/* Header with controls */}
              <div className="flex items-center justify-between p-4 border-b border-[#FF1801]/20">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-6 bg-[#FF1801] rounded-full" />
                  <span className="text-xs text-[#C0C0C0] uppercase tracking-widest">
                    {module === 'circuit-detail' ? 'CIRCUIT DETAIL' :
                     module === 'team-hq' ? 'TEAM HQ' :
                     'NEXT RACE'}
                  </span>
                </div>
                <div className="flex gap-2">
                  {onMinimize && (
                    <button
                      onClick={onMinimize}
                      className="text-[#C0C0C0] hover:text-[#FF1801] transition-colors"
                      title="패널 최소화"
                    >
                      <Minus className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {renderContent()}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Mobile Panel - Interactive Bottom Sheet */}
      <div
        ref={sheetRef}
        className={`sm:hidden fixed inset-x-0 bottom-0 bg-[#1A1A1A]/60 backdrop-blur-sm border-t border-[#FF1801]/20 z-50 rounded-t-2xl shadow-2xl transition-all ${
          isOpen ? '' : 'translate-y-full'
        } ${isDragging ? '' : 'transition-all duration-300 ease-out'}`}
        style={{
          height: isOpen ? (
            sheetState === 'peek' ? `${SHEET_HEIGHTS.peek}px` :
            sheetState === 'half' ? `${SHEET_HEIGHTS.half}vh` :
            sheetState === 'full' ? `${SHEET_HEIGHTS.full}vh` : '0'
          ) : '0',
          transform: isOpen ? 'translateY(0)' : 'translateY(100%)'
        }}
      >
        {/* Drag Handle Area */}
        <div className="sticky top-0 z-10 bg-transparent rounded-t-2xl">
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

          {/* Peek State - 제목만 표시 */}
          {sheetState === 'peek' && (
            <div className="px-4 pb-3" onClick={handleHeaderClick}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-semibold text-base">
                    {module === 'circuit-detail' ? (getText(data?.name || 'Circuit', language)) :
                     module === 'team-hq' ? (getText(data?.name || 'Team HQ', language)) :
                     (language === 'ko' ? '다음 레이스' : 'Next Race')}
                  </h3>
                  {module === 'circuit-detail' && (
                    <p className="text-xs text-[#C0C0C0] mt-0.5">
                      {typeof data?.location === 'string' ? data.location :
                       typeof data?.location === 'object' && 'city' in data.location ?
                       `${getText(data.location.city, language)}, ${getText(data.location.country, language)}` :
                       ''}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Half/Full State - 헤더 */}
          {(sheetState === 'half' || sheetState === 'full') && (
            <div className="px-4 pb-3 border-b border-[#FF1801]/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-6 bg-[#FF1801] rounded-full" />
                  <span className="text-xs text-[#C0C0C0] uppercase tracking-widest">
                    {module === 'circuit-detail' ? (language === 'ko' ? '서킷 세부사항' : 'CIRCUIT DETAIL') :
                     module === 'team-hq' ? (language === 'ko' ? '팀 본부' : 'TEAM HQ') :
                     (language === 'ko' ? '다음 레이스' : 'NEXT RACE')}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Content Area - 스크롤 가능 */}
        {(sheetState === 'half' || sheetState === 'full') && (
          <div 
            className="flex-1 overflow-y-scroll overflow-x-hidden px-4"
            style={MOBILE_CONTENT_STYLE}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
          >
            <div className="pt-4" style={{ 
              minHeight: MIN_CONTENT_HEIGHT,
              paddingBottom: CONTENT_BOTTOM_PADDING 
            }}>
              {renderContent()}
            </div>
          </div>
        )}

        {/* Footer - Half/Full 상태에서만 표시 */}
        {(sheetState === 'half' || sheetState === 'full') && (
          <div className="sticky bottom-0 bg-[#1A1A1A]/60 backdrop-blur-sm border-t border-[#FF1801]/20 p-3">
            <div className="flex items-center gap-2 justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-[#FF1801] animate-pulse"></div>
              <span className="text-[10px] text-[#C0C0C0] uppercase tracking-widest">Live Telemetry</span>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
