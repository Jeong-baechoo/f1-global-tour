'use client';

import { useEffect, useState, useRef } from 'react';
import { X, ChevronRight, MapPin, Calendar } from 'lucide-react';
// import Image from 'next/image'; // Uncomment when images are available

interface InteractivePanelProps {
  isOpen: boolean;
  onClose: () => void;
  module: 'next-race' | 'circuit-detail' | 'team-hq' | null;
  data?: {
    type?: string;
    id?: string;
    name?: string;
    principal?: string;
    location?: string | { city: string; country: string };
    headquarters?: { city: string; country: string; lat: number; lng: number };
    color?: string;
    drivers?: string[];
    grandPrix?: string;
    length?: number;
    laps?: number;
    corners?: number;
    raceDate?: string;
  } | null;
  onExploreCircuit?: () => void;
}

export default function InteractivePanel({
  isOpen,
  onClose,
  module,
  data,
  onExploreCircuit
}: InteractivePanelProps) {
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const [sheetState, setSheetState] = useState<'closed' | 'peek' | 'half' | 'full'>('peek'); // 시트 상태
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const sheetRef = useRef<HTMLDivElement>(null);

  // 각 상태별 높이 정의
  const SHEET_HEIGHTS = {
    closed: 0,
    peek: 80, // 80px - 핸들과 제목만 보임
    half: 45, // 45vh - 중간 상태
    full: 85  // 85vh - 전체 상태
  };

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 시트 상태 업데이트 시 높이 조정
  useEffect(() => {
    if (isOpen && isMobile) {
      setSheetState('peek');
    }
  }, [isOpen, isMobile]);

  // Touch/Mouse handlers for dragging
  const handleDragStart = (e: React.TouchEvent | React.MouseEvent) => {
    setIsDragging(true);
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setStartY(clientY);
  };

  const handleDragMove = (e: React.TouchEvent | React.MouseEvent) => {
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
  };

  const handleDragEnd = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDragging || !sheetRef.current) return;
    setIsDragging(false);

    const clientY = 'touches' in e ? e.changedTouches[0].clientY : e.clientY;
    const deltaY = startY - clientY;
    const windowHeight = window.innerHeight;
    const currentHeightPx = sheetRef.current.offsetHeight;
    const currentHeightVh = (currentHeightPx / windowHeight) * 100;

    // 드래그 방향과 현재 높이에 따라 상태 결정
    if (deltaY > 50) { // 위로 드래그
      if (sheetState === 'peek') setSheetState('half');
      else if (sheetState === 'half') setSheetState('full');
    } else if (deltaY < -50) { // 아래로 드래그
      if (sheetState === 'full') setSheetState('half');
      else if (sheetState === 'half') setSheetState('peek');
      else if (sheetState === 'peek' && deltaY < -100) {
        onClose();
        return;
      }
    } else {
      // 가장 가까운 snap point로 이동
      if (currentHeightVh < 20) setSheetState('peek');
      else if (currentHeightVh < 65) setSheetState('half');
      else setSheetState('full');
    }
  };

  // 클릭으로 상태 전환
  const handleHeaderClick = () => {
    if (sheetState === 'peek') setSheetState('half');
    else if (sheetState === 'half') setSheetState('full');
  };

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
            {/* 모바일에서 half/full 상태일 때는 헤더에 이미 NEXT RACE가 표시되므로 생략 */}
            {(!isMobile || sheetState === 'peek') && (
              <div className="border-b border-[#FF1801]/20 pb-4">
                <h2 className="text-xs text-[#C0C0C0] tracking-widest mb-2">NEXT RACE</h2>
                <h1 className="text-2xl font-bold text-white tracking-wide">
                  {data?.grandPrix || 'AUSTRIAN GRAND PRIX'}
                </h1>
              </div>
            )}
            {/* 모바일 half/full 상태에서는 그랑프리 이름만 표시 */}
            {isMobile && (sheetState === 'half' || sheetState === 'full') && (
              <div className="border-b border-[#FF1801]/20 pb-4">
                <h1 className="text-2xl font-bold text-white tracking-wide">
                  {data?.grandPrix || 'AUSTRIAN GRAND PRIX'}
                </h1>
              </div>
            )}

            <div className="bg-[#1A1A1A]/70 rounded border border-[#FF1801]/20 p-4 sm:p-6">
              <div className="text-center mb-4">
                <div className="text-[#C0C0C0] text-xs tracking-widest mb-2">RACE STARTS IN</div>
                <div className="flex justify-center gap-2 sm:gap-4">
                  <div className="text-center">
                    <div className="text-2xl sm:text-3xl font-bold text-[#FF1801]">{countdown.days}</div>
                    <div className="text-[10px] sm:text-xs text-[#C0C0C0] uppercase">Days</div>
                  </div>
                  <div className="text-2xl sm:text-3xl text-[#FF1801]">:</div>
                  <div className="text-center">
                    <div className="text-2xl sm:text-3xl font-bold text-[#FF1801]">{String(countdown.hours).padStart(2, '0')}</div>
                    <div className="text-[10px] sm:text-xs text-[#C0C0C0] uppercase">Hours</div>
                  </div>
                  <div className="text-2xl sm:text-3xl text-[#FF1801]">:</div>
                  <div className="text-center">
                    <div className="text-2xl sm:text-3xl font-bold text-[#FF1801]">{String(countdown.minutes).padStart(2, '0')}</div>
                    <div className="text-[10px] sm:text-xs text-[#C0C0C0] uppercase">Minutes</div>
                  </div>
                </div>
              </div>

              <div className="space-y-3 mt-6">
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-[#C0C0C0]" />
                  <div>
                    <div className="text-white font-medium">{data?.name || 'Red Bull Ring'}</div>
                    <div className="text-xs text-[#C0C0C0]">{typeof data?.location === 'string' ? data.location : `${data?.location?.city || 'Spielberg'}, ${data?.location?.country || 'Austria'}`}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-[#C0C0C0]" />
                  <div className="text-sm text-white">
                    {data?.raceDate ? new Date(data.raceDate).toLocaleDateString('en-US', {
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
              Explore Circuit
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        );

      case 'circuit-detail':
        return (
          <div className={isMobile ? "space-y-4" : "space-y-6"}>
            {/* 모바일에서 half/full 상태일 때는 헤더에 이미 CIRCUIT DETAIL이 표시되므로 생략 */}
            {(!isMobile || sheetState === 'peek') && (
              <div className={isMobile ? "border-b border-[#FF1801]/20 pb-3" : "border-b border-[#FF1801]/20 pb-4"}>
                <h2 className="text-xs text-[#C0C0C0] tracking-widest mb-2">CIRCUIT DETAIL</h2>
                <h1 className={isMobile ? "text-xl font-bold text-white tracking-wide" : "text-2xl font-bold text-white tracking-wide"}>
                  {data?.name || 'Red Bull Ring'}
                </h1>
                <p className="text-sm text-[#C0C0C0] mt-1">{typeof data?.location === 'string' ? data.location : `${data?.location?.city || 'Spielberg'}, ${data?.location?.country || 'Austria'}`}</p>
              </div>
            )}
            {/* 모바일 half/full 상태에서는 서킷 이름만 표시 */}
            {isMobile && (sheetState === 'half' || sheetState === 'full') && (
              <div className="border-b border-[#FF1801]/20 pb-3">
                <h1 className="text-xl font-bold text-white tracking-wide">
                  {data?.name || 'Red Bull Ring'}
                </h1>
                <p className="text-sm text-[#C0C0C0] mt-1">{typeof data?.location === 'string' ? data.location : `${data?.location?.city || 'Spielberg'}, ${data?.location?.country || 'Austria'}`}</p>
              </div>
            )}

            {/* Circuit image placeholder - uncomment when images are available
            {data?.image && (
              <div className="relative h-48 bg-[#0F0F0F] rounded overflow-hidden border border-[#FF1801]/20">
                <Image
                  src={data.image}
                  alt={data.name || ''}
                  width={400}
                  height={192}
                  className="w-full h-full object-cover"
                />
              </div>
            )} */}

            <div className="grid grid-cols-2 gap-3">
              <div className={isMobile ? "bg-[#0F0F0F] p-3 rounded border border-[#FF1801]/20" : "bg-[#0F0F0F] p-4 rounded border border-[#FF1801]/20"}>
                <div className="text-xs text-[#C0C0C0] uppercase tracking-wider">Corners</div>
                <div className={isMobile ? "text-xl font-bold text-white mt-1" : "text-2xl font-bold text-white mt-1"}>{data?.corners || '10'}</div>
              </div>
              <div className={isMobile ? "bg-[#0F0F0F] p-3 rounded border border-[#FF1801]/20" : "bg-[#0F0F0F] p-4 rounded border border-[#FF1801]/20"}>
                <div className="text-xs text-[#C0C0C0] uppercase tracking-wider">Circuit Length</div>
                <div className={isMobile ? "text-xl font-bold text-white mt-1" : "text-2xl font-bold text-white mt-1"}>{data?.length || '4.318'} <span className="text-sm text-[#C0C0C0]">km</span></div>
              </div>
            </div>

            <div className="bg-[#0F0F0F] p-4 rounded border border-[#FF1801]/20">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3">Race Weekend Schedule (KST)</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center py-2 border-b border-[#1A1A1A]">
                  <span className="text-sm text-[#C0C0C0]">Practice 1</span>
                  <span className="text-sm text-white font-medium">June 27 (Fri) 20:30</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-[#1A1A1A]">
                  <span className="text-sm text-[#C0C0C0]">Qualifying</span>
                  <span className="text-sm text-white font-medium">June 28 (Sat) 23:00</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-[#C0C0C0]">Race</span>
                  <span className="text-sm text-white font-medium">June 29 (Sun) 22:00</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button className="flex-1 bg-[#1A1A1A] hover:bg-[#2A2A2A] text-white font-medium py-2 px-4 rounded border border-[#FF1801]/20 transition-colors text-sm">
                Official Tickets
              </button>
              <button className="flex-1 bg-[#1A1A1A] hover:bg-[#2A2A2A] text-white font-medium py-2 px-4 rounded border border-[#FF1801]/20 transition-colors text-sm">
                Local Info
              </button>
            </div>
          </div>
        );

      case 'team-hq':
        return (
          <div className="space-y-6">
            {/* 모바일에서 half/full 상태일 때는 헤더에 이미 TEAM HQ가 표시되므로 생략 */}
            {(!isMobile || sheetState === 'peek') && (
              <div className="border-b border-[#FF1801]/20 pb-4">
                <h2 className="text-xs text-[#C0C0C0] tracking-widest mb-2">TEAM HQ</h2>
                <h1 className="text-2xl font-bold tracking-wide" style={{ color: data?.color || '#FFFFFF' }}>
                  {data?.name || 'Mercedes-AMG Petronas F1 Team'}
                </h1>
              </div>
            )}
            {/* 모바일 half/full 상태에서는 팀 이름만 표시 */}
            {isMobile && (sheetState === 'half' || sheetState === 'full') && (
              <div className="border-b border-[#FF1801]/20 pb-4">
                <h1 className="text-xl font-bold tracking-wide" style={{ color: data?.color || '#FFFFFF' }}>
                  {data?.name || 'Mercedes-AMG Petronas F1 Team'}
                </h1>
              </div>
            )}

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
                <h3 className="text-xs text-[#C0C0C0] uppercase tracking-wider mb-2">Headquarters</h3>
                <p className="text-white">
                  {(typeof data?.location === 'object' ? data.location.city : null) || data?.headquarters?.city || 'Brackley'},
                  {' '}
                  {(typeof data?.location === 'object' ? data.location.country : null) || data?.headquarters?.country || 'United Kingdom'}
                </p>
              </div>

              <div>
                <h3 className="text-xs text-[#C0C0C0] uppercase tracking-wider mb-2">Team Principal</h3>
                <p className="text-white font-medium">{data?.principal || 'Toto Wolff'}</p>
              </div>

              {data?.drivers && (
                <div>
                  <h3 className="text-xs text-[#C0C0C0] uppercase tracking-wider mb-2">2025 Drivers</h3>
                  <div className="space-y-1">
                    {data.drivers.map((driver: string, index: number) => (
                      <p key={index} className="text-white">{driver}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-[#0F0F0F] p-4 rounded border border-[#FF1801]/20">
              <h3 className="text-xs text-[#C0C0C0] uppercase tracking-wider mb-3">Latest Team News</h3>
              <div className="space-y-2">
                <div className="text-sm text-white hover:text-[#FF1801] cursor-pointer transition-colors">
                  • New aerodynamic package tested in wind tunnel
                </div>
                <div className="text-sm text-white hover:text-[#FF1801] cursor-pointer transition-colors">
                  • Driver contract extension announced
                </div>
                <div className="text-sm text-white hover:text-[#FF1801] cursor-pointer transition-colors">
                  • Technical partnership renewal confirmed
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
              Official Team Store
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
        className={`hidden sm:block fixed right-0 top-0 h-full w-[400px] bg-[#1A1A1A]/60 backdrop-blur-sm border-l border-[#FF1801]/20 transform transition-transform duration-300 ease-in-out z-50 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="relative h-full w-full flex flex-col">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-[#C0C0C0] hover:text-[#FF1801] transition-colors z-10"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="flex-1 overflow-y-auto p-6 pt-16">
            {renderContent()}
          </div>
        </div>
      </div>

      {/* Mobile Panel - Interactive Bottom Sheet */}
      <div
        ref={sheetRef}
        className={`sm:hidden fixed inset-x-0 bottom-0 bg-[#1A1A1A]/98 backdrop-blur border-t border-[#FF1801]/20 z-50 rounded-t-2xl shadow-2xl transition-all ${
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
        <div
          className="sticky top-0 z-10 bg-[#1A1A1A]/98 backdrop-blur-xl rounded-t-2xl cursor-grab active:cursor-grabbing"
          onTouchStart={handleDragStart}
          onTouchMove={handleDragMove}
          onTouchEnd={handleDragEnd}
          onMouseDown={handleDragStart}
          onMouseMove={isDragging ? handleDragMove : undefined}
          onMouseUp={handleDragEnd}
          onMouseLeave={handleDragEnd}
          onClick={handleHeaderClick}
        >
          {/* Handle Bar */}
          <div className="flex justify-center pt-2 pb-1">
            <div className="w-12 h-1 bg-[#FF1801]/30 rounded-full" />
          </div>

          {/* Peek State - 제목만 표시 */}
          {sheetState === 'peek' && (
            <div className="px-4 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-semibold text-base">
                    {module === 'circuit-detail' ? (data?.name || 'Circuit') :
                     module === 'team-hq' ? (data?.name || 'Team HQ') :
                     'Next Race'}
                  </h3>
                  {module === 'circuit-detail' && (
                    <p className="text-xs text-[#C0C0C0] mt-0.5">
                      {typeof data?.location === 'string' ? data.location :
                       `${data?.location?.city || ''}, ${data?.location?.country || ''}`}
                    </p>
                  )}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                  }}
                  className="text-[#C0C0C0] hover:text-[#FF1801] transition-colors p-2 -mr-2"
                >
                  <X className="w-5 h-5" />
                </button>
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
                    {module === 'circuit-detail' ? 'CIRCUIT DETAIL' :
                     module === 'team-hq' ? 'TEAM HQ' :
                     'NEXT RACE'}
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                  }}
                  className="text-[#C0C0C0] hover:text-[#FF1801] transition-colors p-2 -mr-2"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Content Area - 스크롤 가능 */}
        {(sheetState === 'half' || sheetState === 'full') && (
          <div className="flex-1 overflow-y-auto px-4 pb-safe">
            <div className="py-4">
              {renderContent()}
            </div>
          </div>
        )}

        {/* Footer - Half/Full 상태에서만 표시 */}
        {(sheetState === 'half' || sheetState === 'full') && (
          <div className="sticky bottom-0 bg-[#1A1A1A]/98 backdrop-blur border-t border-[#FF1801]/20 p-3">
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
