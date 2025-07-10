'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { InteractivePanel } from '@/src/features/race-info/components/InteractivePanel';
import circuitsData from '@/data/circuits.json';
import { MapAPI } from '@/components/mapbox/types';
import LanguageSelector from '@/components/ui/LanguageSelector';
import { useLanguage } from '@/contexts/LanguageContext';
import { getText } from '@/utils/i18n';
import type { PanelData } from '@/types/panel';
import type { Circuit } from '@/src/features/circuits/types';

// Dynamic imports for better code splitting
const Map = dynamic(
  () => import('@/src/features/map/components/Map'),
  {
    ssr: false,
    loading: () => (
      <div className="fixed inset-0 bg-[#1A1A1A]">
        <div className="w-full h-full flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="text-[#FF1801] text-3xl font-bold tracking-wider">F1 GLOBAL TOUR</div>
            <div className="text-[#C0C0C0] text-sm uppercase tracking-widest">Initializing Race Engineer Console</div>
            <div className="flex gap-1 mt-2">
              <div className="w-2 h-2 bg-[#FF1801] rounded-full animate-bounce [animation-delay:0ms]"></div>
              <div className="w-2 h-2 bg-[#FF1801] rounded-full animate-bounce [animation-delay:150ms]"></div>
              <div className="w-2 h-2 bg-[#FF1801] rounded-full animate-bounce [animation-delay:300ms]"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }
);

export default function Home() {
  const { language, setLanguage } = useLanguage();
  const [panelOpen, setPanelOpen] = useState(true); // 초기값을 true로 변경하여 패널이 처음부터 열리도록 함
  const [panelModule, setPanelModule] = useState<'next-race' | 'circuit-detail' | 'team-hq' | null>(null);
  const [panelMinimized, setPanelMinimized] = useState(false);
  const [panelData, setPanelData] = useState<PanelData | null>(null);
  const mapRef = useRef<MapAPI | null>(null);
  const [isCinematicMode, setIsCinematicMode] = useState(false);
  const initialFocusTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [languageChangedFlag, setLanguageChangedFlag] = useState(false);
  const [nextRaceCircuitId, setNextRaceCircuitId] = useState<string | null>(null);
  
  // Circuit 관련 상태
  const [isCircuitView, setIsCircuitView] = useState(false);
  const [currentCircuit, setCurrentCircuit] = useState<Circuit | null>(null);
  const [drsZoneCount, setDrsZoneCount] = useState(0);
  const [drsDetectionCount, setDrsDetectionCount] = useState(0);
  const [, setIsTrackAnimating] = useState(false);

  // 드래그 스크롤을 위한 상태
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [velocity, setVelocity] = useState(0);
  const animationRef = useRef<number | null>(null);
  const lastMoveTime = useRef<number>(0);
  const lastMoveX = useRef<number>(0);

  // 스크롤바에서 특정 서킷을 중앙으로 이동
  const scrollToCircuit = useCallback((circuitId: string) => {
    if (!scrollRef.current) return;

    const container = scrollRef.current;
    const circuitElements = container.querySelectorAll('[data-circuit-id]');
    
    circuitElements.forEach((element) => {
      if (element.getAttribute('data-circuit-id') === circuitId) {
        const elementRect = element.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        
        // 요소의 중앙을 컨테이너의 중앙으로 이동
        const elementCenter = elementRect.left + elementRect.width / 2;
        const containerCenter = containerRect.left + containerRect.width / 2;
        const scrollOffset = elementCenter - containerCenter;
        
        // 부드러운 스크롤
        container.scrollTo({
          left: container.scrollLeft + scrollOffset,
          behavior: 'smooth'
        });
      }
    });
  }, []);

  const handleMarkerClick = useCallback((item: PanelData) => {
    console.log('🎯 handleMarkerClick called with:', item);
    console.log('Current panel state:', { panelOpen, panelModule, panelData });
    if (!item.type) return;
    
    // 초기 포커싱 중단
    if (initialFocusTimerRef.current && !hasUserInteracted) {
      clearTimeout(initialFocusTimerRef.current);
      initialFocusTimerRef.current = null;
      setHasUserInteracted(true);
    }
    
    const currentModule = item.type === 'team' ? 'team-hq' : 'circuit-detail';
    const isSameMarker = panelData?.id === item.id && panelModule === currentModule;
    const shouldToggle = panelOpen && isSameMarker && !languageChangedFlag;
    
    console.log('Panel state:', { panelOpen, currentModule, shouldToggle });
    
    // 언어 변경 플래그 리셋
    if (languageChangedFlag) {
      setLanguageChangedFlag(false);
    }
    
    // 패널 데이터 및 모듈 설정
    setPanelModule(currentModule);
    setPanelData(item);
    
    // 서킷 클릭 시 지도 줌인 및 트랙 그리기
    if (item.type === 'circuit' && item.id && mapRef.current) {
      mapRef.current.flyToCircuit(item.id);
      // 스크롤바에서 해당 서킷을 중앙으로
      scrollToCircuit(item.id);
    }

    // 팀 클릭 시 팀 본부로 이동
    if (item.type === 'team' && item.id && mapRef.current) {
      mapRef.current.flyToTeam(item.id);
    }


    // 토글 로직
    if (shouldToggle) {
      if (panelMinimized) {
        // 최소화 상태에서 같은 마커 클릭 시 확대
        setPanelMinimized(false);
      } else {
        // 일반 상태에서 같은 마커 클릭 시 닫기
        setPanelOpen(false);
      }
    } else {
      console.log('Opening panel with module:', currentModule);
      setPanelOpen(true);
      // 다른 마커 클릭 시에도 최소화 상태 유지
      // setPanelMinimized(false); <- 이 줄을 제거하여 최소화 상태 유지
    }
  }, [hasUserInteracted, panelOpen, panelModule, panelMinimized, panelData, languageChangedFlag, scrollToCircuit]);

  const handleUserInteraction = useCallback(() => {
    if (initialFocusTimerRef.current && !hasUserInteracted) {
      clearTimeout(initialFocusTimerRef.current);
      initialFocusTimerRef.current = null;
      setHasUserInteracted(true);
    }
  }, [hasUserInteracted]);

  // 언어 변경 감지
  useEffect(() => {
    setLanguageChangedFlag(true);
  }, [language]);

  // 패널 상태 디버깅
  useEffect(() => {
    console.log('🔴 Panel state changed:', { 
      panelOpen, 
      panelModule, 
      panelData: panelData ? { type: panelData.type, id: panelData.id } : null,
      timestamp: new Date().toISOString()
    });
  }, [panelOpen, panelModule, panelData]);

  const handleExploreCircuit = () => {
    if (!nextRaceCircuitId) return;

    // Find the circuit data
    const circuit = circuitsData.circuits.find(c => c.id === nextRaceCircuitId);
    if (!circuit) return;

    setPanelModule('circuit-detail');
    setPanelData({
      type: 'circuit',
      id: circuit.id,
      name: circuit.name,
      location: circuit.location,
      grandPrix: circuit.grandPrix,
      length: circuit.length,
      corners: circuit.corners,
      laps: circuit.laps,
      lapRecord: circuit.lapRecord ? {
        time: circuit.lapRecord.time,
        driver: circuit.lapRecord.driver,
        year: circuit.lapRecord.year.toString()
      } : undefined
    });

    if (mapRef.current) {
      mapRef.current.flyToCircuit(nextRaceCircuitId);
    }
    // 스크롤바에서 해당 서킷을 중앙으로
    scrollToCircuit(nextRaceCircuitId);
  };

  // 모멘텀 애니메이션
  const momentumScroll = useCallback(() => {
    if (!scrollRef.current) return;

    if (Math.abs(velocity) > 0.1) {
      scrollRef.current.scrollLeft += velocity;
      setVelocity(velocity * 0.92); // 더 빠른 감속
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
    const deltaTime = currentTime - lastMoveTime.current;
    const deltaX = currentX - lastMoveX.current;

    // 속도 계산
    if (deltaTime > 0) {
      const newVelocity = -deltaX / deltaTime * 8; // 속도 감소
      setVelocity(newVelocity);
    }

    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 0.8; // 스크롤 속도 감소
    scrollRef.current.scrollLeft = scrollLeft - walk;

    lastMoveTime.current = currentTime;
    lastMoveX.current = currentX;
  }, [isDragging, startX, scrollLeft]);

  // 터치 스크롤 핸들러
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!scrollRef.current) return;

    // 진행 중인 모멘텀 애니메이션 취소
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    setIsDragging(true);
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
    const deltaTime = currentTime - lastMoveTime.current;
    const deltaX = currentX - lastMoveX.current;

    // 속도 계산
    if (deltaTime > 0) {
      const newVelocity = -deltaX / deltaTime * 8; // 속도 감소
      setVelocity(newVelocity);
    }

    const x = e.touches[0].pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 0.8; // 스크롤 속도 감소
    scrollRef.current.scrollLeft = scrollLeft - walk;

    lastMoveTime.current = currentTime;
    lastMoveX.current = currentX;
  }, [isDragging, startX, scrollLeft]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    animationRef.current = requestAnimationFrame(momentumScroll);
  }, [momentumScroll]);

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

    // 처음 로드 시 즉시 next race 패널 설정
    const nextRace = findNextRace();
    console.log('Next race found:', nextRace);

    setNextRaceCircuitId(nextRace.id); // 다음 레이스 서킷 ID 저장

    console.log('Setting panel for next race');
    setPanelModule('next-race');
    setPanelData({
      grandPrix: nextRace.grandPrix,
      name: nextRace.name,
      location: nextRace.location,
      raceDate: nextRace.raceDate2025 + 'T13:00:00Z'
    });
    
    // Show next race panel after 1 second to ensure map is loaded
    const timer = setTimeout(() => {
      console.log('Next race timer fired', { 
        hasMapRef: !!mapRef.current, 
        hasUserInteracted 
      });
      
      if (!mapRef.current || hasUserInteracted) return;

      // Add a small delay for flyTo to ensure map is ready
      const flyToTimer = setTimeout(() => {
        if (nextRace.id && mapRef.current && !hasUserInteracted) {
          mapRef.current.flyToCircuit(nextRace.id, true);
        }
      }, 500);

      // flyToTimer를 정리할 수 있도록 저장
      initialFocusTimerRef.current = flyToTimer;
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
    <>
      <main className="relative w-full h-screen overflow-hidden">
        {/* 전체 화면 지도 */}
        <Map
        ref={mapRef}
        onMarkerClick={handleMarkerClick}
        onCinematicModeChange={setIsCinematicMode}
        onUserInteraction={handleUserInteraction}
        // Circuit 관련 props
        isCircuitView={isCircuitView}
        currentCircuit={currentCircuit}
        drsZoneCount={drsZoneCount}
        drsDetectionCount={drsDetectionCount}
        onCircuitSelect={(circuit) => {
          setCurrentCircuit(circuit);
          scrollToCircuit(circuit.id);
        }}
        setIsCircuitView={setIsCircuitView}
        setCurrentCircuit={setCurrentCircuit}
        setDrsZoneCount={setDrsZoneCount}
        setDrsDetectionCount={setDrsDetectionCount}
        resetPanelStates={() => {
          setPanelOpen(false);
          // 사용자가 명시적으로 닫을 때만 최소화 상태 리셋
          // setPanelMinimized(false);
        }}
        setIsTrackAnimating={setIsTrackAnimating}
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

      {/* 하단 서킷 타임라인 바 - 플로팅 디자인 */}
      <div 
        className="fixed bottom-6 z-50 transition-all duration-300 ease-out hidden sm:block"
        style={{
          left: '50%',
          transform: panelOpen 
            ? `translateX(calc(-50% - ${(panelMinimized ? 320 : 420) / 2 + 22}px))` 
            : 'translateX(-50%)',
          width: panelOpen 
            ? `calc(100vw - ${(panelMinimized ? 320 : 420) + 68}px)` 
            : 'min(80%, 1280px)'
        }}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative rounded-3xl shadow-2xl p-1.5 transition-shadow duration-300"
             style={{
               backgroundColor: 'rgba(18, 18, 20, 0.65)',
               backdropFilter: 'blur(20px) saturate(180%)',
               WebkitBackdropFilter: 'blur(20px) saturate(180%)',
               border: '1px solid rgba(255, 255, 255, 0.08)',
               boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,0.05)',
               filter: 'drop-shadow(0 30px 60px rgba(0,0,0,0.3)) drop-shadow(0 15px 30px rgba(0,0,0,0.2))'
             }}>
          {/* 서킷 이름 스크롤 컨테이너 */}
          <div
            ref={scrollRef}
            className={`overflow-x-auto overflow-y-hidden scrollbar-hide rounded-2xl ${
              isDragging ? 'cursor-grabbing' : 'cursor-grab'
            }`}
            style={{
              maskImage: 'linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)'
            }}
            onMouseDown={handleMouseDown}
            onMouseLeave={handleMouseLeave}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
            onTouchStart={(e) => {
              e.stopPropagation();
              handleTouchStart(e);
            }}
            onTouchMove={(e) => {
              e.stopPropagation();
              handleTouchMove(e);
            }}
            onTouchEnd={(e) => {
              e.stopPropagation();
              handleTouchEnd();
            }}
          >
            <div className="flex items-center gap-8 px-12 py-3 whitespace-nowrap">
              {circuitsData.circuits.map((circuit) => (
              <div
                key={circuit.id}
                data-circuit-id={circuit.id}
                className="flex flex-col items-center cursor-pointer select-none group px-4 py-2 rounded-lg hover:bg-white/[0.05] transition-all duration-300"
                onClick={(e) => {
                  // 드래그 중이 아닐 때만 클릭 이벤트 처리
                  if (isDragging) {
                    e.preventDefault();
                    return;
                  }
                  // 서킷 클릭 시 해당 서킷으로 이동
                  if (mapRef.current) {
                    mapRef.current.flyToCircuit(circuit.id);
                  }
                  // 스크롤바에서 클릭한 서킷을 중앙으로
                  scrollToCircuit(circuit.id);
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
                    laps: circuit.laps,
                    totalDistance: circuit.totalDistance,
                    lapRecord: circuit.lapRecord ? {
                      time: circuit.lapRecord.time,
                      driver: circuit.lapRecord.driver,
                      year: circuit.lapRecord.year.toString()
                    } : undefined
                  });
                  setPanelOpen(true);
                  // 최소화 상태 유지 - setPanelMinimized(false) 제거
                }}
              >
                {/* 날짜 표시 */}
                <span className="text-[#C0C0C0]/80 text-xs font-medium mb-1 group-hover:text-white/90 transition-colors">
                  {circuit.raceDate2025 ? (() => {
                    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
                    const date = new Date(circuit.raceDate2025 + 'T00:00:00Z');
                    return `${months[date.getUTCMonth()]} ${date.getUTCDate()}`;
                  })() : 'TBD'}
                </span>
                {/* Grand Prix 이름 */}
                <span className="text-white/90 text-lg font-bold uppercase tracking-tight group-hover:text-white transition-colors" style={{ fontFamily: 'Inter, sans-serif' }}>
                  {getText(circuit.grandPrix, language)}
                </span>
              </div>
            ))}
            </div>
          </div>
        </div>
      </div>

      </main>


      {/* Interactive Panel - Outside of main to avoid overflow clipping */}
      <InteractivePanel
        isOpen={panelOpen}
        onCloseAction={() => {
          console.log('Panel close action');
          setPanelOpen(false);
        }}
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
    </>
  );
}
