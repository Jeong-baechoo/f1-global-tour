'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import InteractivePanel from '@/components/InteractivePanel';
import circuitsData from '@/data/circuits.json';
import { MapAPI } from '@/components/mapbox/types';
import LanguageSelector from '@/components/ui/LanguageSelector';
import { useLanguage } from '@/contexts/LanguageContext';
import type { PanelData } from '@/types/panel';

// Dynamic import to avoid SSR issues with Mapbox
const Map = dynamic(
  () => import('@/components/mapbox/Map'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-screen flex items-center justify-center bg-[#1A1A1A]">
        <div className="flex flex-col items-center gap-4">
          <div className="text-[#FF1801] text-3xl font-bold tracking-wider animate-pulse">F1 GLOBAL TOUR</div>
          <div className="text-[#C0C0C0] text-sm uppercase tracking-widest">Initializing Race Engineer Console</div>
          <div className="flex gap-1 mt-2">
            <div className="w-2 h-2 bg-[#FF1801] rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
            <div className="w-2 h-2 bg-[#FF1801] rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
            <div className="w-2 h-2 bg-[#FF1801] rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
          </div>
        </div>
      </div>
    )
  }
);

// 상수 정의
const MOBILE_BREAKPOINT = 640;
const DRAG_THRESHOLD = 5;
const SCROLL_DAMPING = 0.8;
const VELOCITY_MULTIPLIER = 8;
const MOMENTUM_DECAY = 0.92;

export default function Home() {
  const { language, setLanguage } = useLanguage();
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelModule, setPanelModule] = useState<'next-race' | 'circuit-detail' | 'team-hq' | null>(null);
  const [panelMinimized, setPanelMinimized] = useState(false);
  const [panelData, setPanelData] = useState<PanelData | null>(null);
  const mapRef = useRef<MapAPI | null>(null);
  const [isCinematicMode, setIsCinematicMode] = useState(false);
  const initialFocusTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [timelineOpen, setTimelineOpen] = useState(false);


  // 드래그 스크롤을 위한 상태
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [velocity, setVelocity] = useState(0);
  const animationRef = useRef<number | null>(null);
  const lastMoveTime = useRef<number>(0);
  const lastMoveX = useRef<number>(0);
  const [hasMoved, setHasMoved] = useState(false); // 드래그 중 실제 이동 여부 추적
  const timelineRef = useRef<HTMLDivElement>(null); // 타임라인 패널 참조

  const handleMarkerClick = useCallback((item: PanelData) => {
    // 사용자가 마커를 클릭하면 초기 포커싱 중단
    if (initialFocusTimerRef.current && !hasUserInteracted) {
      clearTimeout(initialFocusTimerRef.current);
      initialFocusTimerRef.current = null;
      setHasUserInteracted(true);
    }
    if (!item.type) return; // type이 없으면 처리하지 않음
    
    if (item.type === 'team') {
      setPanelModule('team-hq');
      setPanelData({
        ...item
      });
    } else if (item.type === 'circuit') {
      setPanelModule('circuit-detail');
      setPanelData(item);

      // 서킷 클릭 시 지도 줌인 및 트랙 그리기
      if (item.id && mapRef.current) {
        mapRef.current.flyToCircuit(item.id);
      }
    }

    // 패널이 이미 열려있고 같은 모듈인 경우 토글
    if (panelOpen && panelModule === (item.type === 'team' ? 'team-hq' : 'circuit-detail')) {
      // 최소화 상태라면 펼치기, 펼쳐진 상태라면 닫기
      if (panelMinimized) {
        setPanelMinimized(false);
      } else {
        setPanelOpen(false);
      }
    } else {
      setPanelOpen(true);
      setPanelMinimized(false);
    }
  }, [hasUserInteracted, panelOpen, panelModule, panelMinimized]);

  const handleUserInteraction = useCallback(() => {
    if (initialFocusTimerRef.current && !hasUserInteracted) {
      clearTimeout(initialFocusTimerRef.current);
      initialFocusTimerRef.current = null;
      setHasUserInteracted(true);
    }
  }, [hasUserInteracted]);

  const handleExploreCircuit = () => {
    setPanelModule('circuit-detail');
    setPanelData({
      name: 'Red Bull Ring',
      location: 'Spielberg, Austria',
      grandPrix: 'Austrian Grand Prix',
      length: 4.318,
      corners: 10,
      laps: 71
    });

    if (mapRef.current) {
      mapRef.current.flyToCircuit('austria');
    }
  };

  // 공통 드래그 로직
  const updateDragMovement = useCallback((currentX: number, startX: number, scrollLeft: number) => {
    if (!scrollRef.current) return;
    
    const walk = (currentX - startX) * SCROLL_DAMPING;
    if (Math.abs(walk) > DRAG_THRESHOLD) {
      setHasMoved(true);
    }
    scrollRef.current.scrollLeft = scrollLeft - walk;
  }, []);

  const updateVelocity = useCallback((currentX: number, currentTime: number) => {
    const deltaTime = currentTime - lastMoveTime.current;
    const deltaX = currentX - lastMoveX.current;

    if (deltaTime > 0) {
      const newVelocity = -deltaX / deltaTime * VELOCITY_MULTIPLIER;
      setVelocity(newVelocity);
    }

    lastMoveTime.current = currentTime;
    lastMoveX.current = currentX;
  }, []);

  // 모멘텀 애니메이션
  const momentumScroll = useCallback(() => {
    if (!scrollRef.current) return;

    if (Math.abs(velocity) > 0.1) {
      scrollRef.current.scrollLeft += velocity;
      setVelocity(velocity * MOMENTUM_DECAY);
      animationRef.current = requestAnimationFrame(momentumScroll);
    }
  }, [velocity]);

  // 드래그 스크롤 핸들러
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!scrollRef.current) return;

    // 진행 중인 모멘텀 애니메이션 취소
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    setIsDragging(true);
    setHasMoved(false); // 이동 추적 초기화
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
    setVelocity(0);
    lastMoveTime.current = Date.now();
    lastMoveX.current = e.pageX;
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      animationRef.current = requestAnimationFrame(momentumScroll);
    }
  }, [isDragging, momentumScroll]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    animationRef.current = requestAnimationFrame(momentumScroll);
  }, [momentumScroll]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();

    const currentTime = Date.now();
    const currentX = e.pageX;
    const x = currentX - scrollRef.current.offsetLeft;

    updateDragMovement(x, startX, scrollLeft);
    updateVelocity(currentX, currentTime);
  }, [isDragging, startX, scrollLeft, updateDragMovement, updateVelocity]);

  // 터치 스크롤 핸들러
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!scrollRef.current) return;

    // 진행 중인 모멘텀 애니메이션 취소
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    setIsDragging(true);
    setHasMoved(false); // 이동 추적 초기화
    setStartX(e.touches[0].pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
    setVelocity(0);
    lastMoveTime.current = Date.now();
    lastMoveX.current = e.touches[0].pageX;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging || !scrollRef.current) return;

    const currentTime = Date.now();
    const currentX = e.touches[0].pageX;
    const x = currentX - scrollRef.current.offsetLeft;

    updateDragMovement(x, startX, scrollLeft);
    updateVelocity(currentX, currentTime);
  }, [isDragging, startX, scrollLeft, updateDragMovement, updateVelocity]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    animationRef.current = requestAnimationFrame(momentumScroll);
  }, [momentumScroll]);

  // 모바일에서 타임라인 패널 외부 터치 시 패널 닫기
  const handleOutsideTouch = useCallback((e: TouchEvent) => {
    if (!timelineOpen || window.innerWidth >= MOBILE_BREAKPOINT) return;
    
    if (timelineRef.current && !timelineRef.current.contains(e.target as Node)) {
      const toggleButton = document.querySelector('button[data-timeline-toggle]');
      if (toggleButton && toggleButton.contains(e.target as Node)) return;
      
      setTimelineOpen(false);
    }
  }, [timelineOpen]);

  // 터치 이벤트 리스너 등록/해제
  useEffect(() => {
    if (timelineOpen && window.innerWidth < MOBILE_BREAKPOINT) {
      document.addEventListener('touchstart', handleOutsideTouch);
      return () => document.removeEventListener('touchstart', handleOutsideTouch);
    }
  }, [timelineOpen, handleOutsideTouch]);

  useEffect(() => {
    // Find the next race based on current date
    const findNextRace = () => {
      const today = new Date();

      // Sort circuits by race date
      const sortedCircuits = circuitsData.circuits
        .filter((circuit) => circuit.raceDate2025 !== null)
        .sort((a, b) => {
          // We know these are not null because of the filter above
          const dateA = new Date(a.raceDate2025!).getTime();
          const dateB = new Date(b.raceDate2025!).getTime();
          return dateA - dateB;
        });

      // Find the next race
      const nextRace = sortedCircuits.find((circuit) => {
        if (!circuit.raceDate2025) return false;
        return new Date(circuit.raceDate2025) > today;
      });

      return nextRace || sortedCircuits[0]; // If no future races, show first race of next season
    };

    // Show next race panel after 1 second to ensure map is loaded
    const timer = setTimeout(() => {
      if (!mapRef.current || hasUserInteracted) return;

      const nextRace = findNextRace();

      setPanelModule('next-race');
      setPanelData({
        grandPrix: nextRace.grandPrix,
        name: nextRace.name,
        location: nextRace.location,
        raceDate: nextRace.raceDate2025 + 'T13:00:00Z'
      });
      setPanelOpen(true);

      // Add a small delay for flyTo to ensure map is ready
      initialFocusTimerRef.current = setTimeout(() => {
        if (nextRace.id && mapRef.current && !hasUserInteracted) {
          mapRef.current.flyToCircuit(nextRace.id, true);
        }
      }, 500);
    }, 2000);

    return () => {
      clearTimeout(timer);
      if (initialFocusTimerRef.current) {
        clearTimeout(initialFocusTimerRef.current);
        initialFocusTimerRef.current = null;
      }
    };
  }, [hasUserInteracted]);

  return (
    <main className="relative w-full h-screen overflow-hidden">
      {/* 전체 화면 지도 */}
      <Map
        ref={mapRef}
        onMarkerClick={handleMarkerClick}
        onCinematicModeChange={setIsCinematicMode}
        onUserInteraction={handleUserInteraction}
      />

      {/* F1 로고 - 모바일 */}
      <div className="absolute top-2 left-4 z-10 sm:hidden">
        <Image
          src="/f1_logo.png"
          alt="F1 Logo"
          width={80}
          height={20}
          className="drop-shadow-lg"
          priority
        />
      </div>

      {/* 언어 선택 버튼 - 모바일 */}
      <div className="absolute top-7 right-14 z-10 sm:hidden">
        <LanguageSelector
          currentLanguage={language}
          onLanguageChangeAction={setLanguage}
        />
      </div>

      {/* F1 로고 - 데스크탑 */}
      <div className="hidden sm:block absolute top-0.5 left-14 z-10">
        <Image
          src="/f1_logo.png"
          alt="F1 Logo"
          width={120}
          height={30}
          className="drop-shadow-lg"
          priority
        />
      </div>

      {/* 언어 선택 버튼 - 데스크탑 */}
      <div className="hidden sm:block absolute bottom-32 left-6 z-10">
        <LanguageSelector
          currentLanguage={language}
          onLanguageChangeAction={setLanguage}
        />
      </div>

      {/* 모바일 타임라인 토글 버튼 */}
      <button
        data-timeline-toggle
        onClick={() => setTimelineOpen(!timelineOpen)}
        className="fixed top-1/2 -translate-y-1/2 left-0 z-50 bg-gradient-to-r from-gray-900/95 to-gray-800/95 text-red-600 p-3 rounded-r-lg border-r-2 border-t-2 border-b-2 border-red-600 backdrop-blur-lg sm:hidden transition-all duration-300 hover:bg-gradient-to-r hover:from-red-600/20 hover:to-gray-800/95 hover:text-white hover:border-red-600 shadow-lg shadow-red-600/20"
      >
        <svg 
          className={`w-4 h-4 transition-transform duration-300 ${timelineOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* 서킷 타임라인 바 - 데스크톱: 하단, 모바일: 왼쪽 패널 */}
      <div 
        ref={timelineRef}
        className={`absolute z-40 transition-all duration-300 sm:bottom-0 sm:left-0 sm:right-0 sm:h-24 max-sm:top-0 max-sm:bottom-0 max-sm:w-80 max-sm:bg-black/80 max-sm:backdrop-blur-lg max-sm:border-r-2 max-sm:border-red-600 max-sm:shadow-xl max-sm:shadow-red-600/20 ${
        timelineOpen ? 'max-sm:left-0' : 'max-sm:-left-80'
      }`}>
        {/* 그라데이션 배경 - 데스크톱만 */}
        <div className="absolute inset-0 pointer-events-none sm:bg-gradient-to-t sm:from-black/60 sm:via-black/20 sm:to-transparent" />

        {/* 모바일 패널 헤더 */}
        <div className="sm:hidden p-4 border-b-2 border-red-600">
          <h2 className="text-white text-xl font-black tracking-wide" style={{ fontFamily: 'Oswald, sans-serif' }}>2025 F1 CALENDAR</h2>
          <div className="w-8 h-1 bg-red-600 mt-2 rounded-full"></div>
        </div>

        {/* 데스크톱: 가운데 70% 영역, 모바일: 전체 패널 */}
        <div className="absolute sm:bottom-0 sm:left-1/2 sm:-translate-x-1/2 sm:w-[70%] sm:h-20 max-sm:top-20 max-sm:left-0 max-sm:right-0 max-sm:bottom-0">
          {/* 서킷 이름 스크롤 컨테이너 */}
          <div
            ref={scrollRef}
            className={`absolute inset-0 scrollbar-hide ${
              isDragging ? 'cursor-grabbing' : 'cursor-grab'
            } sm:overflow-x-auto sm:overflow-y-hidden sm:fade-edges max-sm:overflow-y-auto max-sm:overflow-x-hidden`}
            onMouseDown={handleMouseDown}
            onMouseLeave={handleMouseLeave}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div className="sm:flex sm:items-center sm:gap-12 sm:px-32 sm:py-4 sm:whitespace-nowrap sm:flex-row max-sm:flex max-sm:flex-col max-sm:gap-8 max-sm:px-6 max-sm:py-6 max-sm:h-auto max-sm:w-full max-sm:overflow-y-auto">
              {circuitsData.circuits
                .filter(circuit => circuit.raceDate2025) // 2025년 레이스만 필터링
                .sort((a, b) => new Date(a.raceDate2025!).getTime() - new Date(b.raceDate2025!).getTime()) // 날짜순 정렬
                .map((circuit) => (
              <div
                key={circuit.id}
                className="flex flex-col items-center cursor-pointer select-none group sm:min-w-fit max-sm:w-full max-sm:items-center max-sm:p-4 max-sm:rounded-lg max-sm:border max-sm:border-white max-sm:bg-black/30 max-sm:hover:border-white max-sm:hover:shadow-lg max-sm:hover:shadow-white/20 max-sm:transition-all max-sm:duration-300"
                onClick={(e) => {
                  // 드래그 중이거나 실제 드래그가 발생했을 때 클릭 이벤트 차단
                  if (isDragging || hasMoved) {
                    e.preventDefault();
                    return;
                  }

                  // 서킷을 중앙으로 스크롤하는 함수
                  const scrollToCenter = () => {
                    if (!scrollRef.current) return;

                    const container = scrollRef.current;
                    const circuitElement = e.currentTarget as HTMLElement;
                    const containerWidth = container.clientWidth;
                    const circuitOffsetLeft = circuitElement.offsetLeft;
                    const circuitWidth = circuitElement.offsetWidth;
                    
                    // 서킷을 중앙에 위치시키기 위한 스크롤 위치 계산
                    const scrollPosition = circuitOffsetLeft - (containerWidth / 2) + (circuitWidth / 2);
                    
                    // 부드러운 스크롤
                    container.scrollTo({
                      left: scrollPosition,
                      behavior: 'smooth'
                    });
                  };

                  // 데스크톱에서만 중앙 정렬 스크롤 실행
                  if (window.innerWidth >= MOBILE_BREAKPOINT) {
                    scrollToCenter();
                  }

                  // 서킷 클릭 시 해당 서킷으로 이동
                  if (mapRef.current) {
                    mapRef.current.flyToCircuit(circuit.id);
                  }
                  // 모바일에서 타임라인 패널 닫기
                  if (window.innerWidth < MOBILE_BREAKPOINT) {
                    setTimelineOpen(false);
                  }
                  // 서킷 상세 패널 열기
                  setPanelModule('circuit-detail');
                  setPanelData({
                    type: 'circuit',
                    id: circuit.id,
                    name: circuit.name,
                    location: circuit.location,
                    grandPrix: circuit.grandPrix,
                    length: circuit.length,
                    corners: circuit.corners,
                    laps: circuit.laps
                  });
                  setPanelOpen(true);
                  setPanelMinimized(false);
                }}
              >
                {/* 날짜 표시 */}
                <span className="font-bold mb-2 group-hover:text-red-600 transition-colors text-gray-400 sm:text-sm max-sm:text-white max-sm:text-sm max-sm:tracking-wider" style={{ fontFamily: 'Oswald, sans-serif' }}>
                  {circuit.raceDate2025 ? (() => {
                    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
                    const date = new Date(circuit.raceDate2025 + 'T00:00:00Z');
                    return `${months[date.getUTCMonth()]} ${date.getUTCDate()}`;
                  })() : 'TBD'}
                </span>
                {/* Grand Prix 이름 */}
                <span className="font-black uppercase tracking-tight group-hover:text-red-600 transition-colors pb-2 drop-shadow-lg text-white sm:text-2xl max-sm:text-red-600 max-sm:text-lg max-sm:text-center max-sm:leading-tight max-sm:font-extrabold" style={{ fontFamily: 'Oswald, sans-serif' }}>
                  {typeof circuit.grandPrix === 'string' ? circuit.grandPrix : circuit.grandPrix.en}
                </span>
                {/* 모바일 장식선 */}
                <div className="sm:hidden w-12 h-0.5 bg-red-600/60 group-hover:bg-red-600 transition-colors"></div>
              </div>
            ))}
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Panel */}
      <InteractivePanel
        isOpen={panelOpen}
        onCloseAction={() => setPanelOpen(false)}
        onMinimize={() => setPanelMinimized(!panelMinimized)}
        isMinimized={panelMinimized}
        module={panelModule}
        data={panelData}
        onExploreCircuit={handleExploreCircuit}
        isCinematicMode={isCinematicMode}
        onToggleCinematicMode={() => {
          // 시네마틱 모드 토글
          if (mapRef.current?.toggleCinematicMode) {
            const isEnabled = mapRef.current.toggleCinematicMode();
            setIsCinematicMode(isEnabled);
          }
        }}
      />
    </main>
  );
}
