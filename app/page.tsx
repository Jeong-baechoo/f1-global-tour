'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import InteractivePanel from '@/components/InteractivePanel';
import circuitsData from '@/data/circuits.json';
import { MapAPI } from '@/components/mapbox/types';

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
            <div className="w-2 h-2 bg-[#FF1801] rounded-full animate-bounce [animation-delay:0ms]"></div>
            <div className="w-2 h-2 bg-[#FF1801] rounded-full animate-bounce [animation-delay:150ms]"></div>
            <div className="w-2 h-2 bg-[#FF1801] rounded-full animate-bounce [animation-delay:300ms]"></div>
          </div>
        </div>
      </div>
    )
  }
);

export default function Home() {
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelModule, setPanelModule] = useState<'next-race' | 'circuit-detail' | 'team-hq' | null>(null);
  const [panelMinimized, setPanelMinimized] = useState(false);
  const [panelData, setPanelData] = useState<{
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
  } | null>(null);
  const mapRef = useRef<MapAPI | null>(null);
  const [isCinematicMode, setIsCinematicMode] = useState(false);
  const initialFocusTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);

  // 드래그 스크롤을 위한 상태
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [velocity, setVelocity] = useState(0);
  const animationRef = useRef<number | null>(null);
  const lastMoveTime = useRef<number>(0);
  const lastMoveX = useRef<number>(0);

  const handleMarkerClick = useCallback((item: {
    type: string;
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
  }) => {
    // 사용자가 마커를 클릭하면 초기 포커싱 중단
    if (initialFocusTimerRef.current && !hasUserInteracted) {
      clearTimeout(initialFocusTimerRef.current);
      initialFocusTimerRef.current = null;
      setHasUserInteracted(true);
    }
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

    // Show next race panel after 1 second to ensure map is loaded
    const timer = setTimeout(() => {
      if (!mapRef.current || hasUserInteracted) return;

      const nextRace = findNextRace();

      setPanelModule('next-race');
      setPanelData({
        grandPrix: nextRace.grandPrix.toUpperCase(),
        name: nextRace.name,
        location: `${nextRace.location.city}, ${nextRace.location.country}`,
        raceDate: nextRace.raceDate2025 + 'T13:00:00Z'
      });
      setPanelOpen(true);

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

      {/* 하단 서킷 타임라인 바 */}
      <div className="absolute bottom-0 left-0 right-0 h-24 z-50">
        {/* 그라데이션 배경 */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent pointer-events-none" />

        {/* 가운데 70% 영역 컨테이너 */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[70%] h-20">
          {/* 서킷 이름 스크롤 컨테이너 */}
          <div
            ref={scrollRef}
            className={`absolute inset-0 overflow-x-auto overflow-y-hidden scrollbar-hide fade-edges ${
              isDragging ? 'cursor-grabbing' : 'cursor-grab'
            }`}
            onMouseDown={handleMouseDown}
            onMouseLeave={handleMouseLeave}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div className="flex items-center gap-12 px-32 py-4 whitespace-nowrap">
              {circuitsData.circuits.map((circuit) => (
              <div
                key={circuit.id}
                className="flex flex-col items-center cursor-pointer select-none group"
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
                <span className="text-white/70 text-sm font-bold mb-1 group-hover:text-white/90 transition-colors">
                  {circuit.raceDate2025 ? (() => {
                    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
                    const date = new Date(circuit.raceDate2025 + 'T00:00:00Z');
                    return `${months[date.getUTCMonth()]} ${date.getUTCDate()}`;
                  })() : 'TBD'}
                </span>
                {/* Grand Prix 이름 */}
                <span className="text-white text-2xl font-black uppercase tracking-tight group-hover:text-white transition-colors pb-4 drop-shadow-lg" style={{ fontFamily: 'Oswald, sans-serif' }}>
                  {circuit.grandPrix}
                </span>
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
