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
            <div className="w-2 h-2 bg-[#FF1801] rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
            <div className="w-2 h-2 bg-[#FF1801] rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
            <div className="w-2 h-2 bg-[#FF1801] rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
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

      {/* 하단 타임라인 바 */}
      <div className="absolute bottom-0 left-0 right-0 h-16 sm:h-20 bg-gradient-to-t from-[#0F0F0F] to-transparent pointer-events-none">
        <div className="absolute bottom-2 sm:bottom-4 left-2 right-2 sm:left-4 sm:right-4 h-10 sm:h-12 bg-[#1A1A1A]/90 backdrop-blur-md rounded border border-[#FF1801]/20 pointer-events-auto flex items-center px-3 sm:px-4">
          <div className="flex items-center gap-2">
            <div className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-[#FF1801] animate-pulse"></div>
            <span className="text-[#C0C0C0] text-[10px] sm:text-xs uppercase tracking-wider">Live Telemetry</span>
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
