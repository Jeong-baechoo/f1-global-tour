'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import InteractivePanel from '@/components/InteractivePanel';
import circuitsData from '@/data/circuits.json';

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
  const [mapRef, setMapRef] = useState<{
    flyToCircuit: (circuitId: string, gentle?: boolean) => void;
    flyToTeam: (teamId: string) => void;
    toggleCinematicMode?: () => boolean;
  } | null>(null);
  const [isCinematicMode, setIsCinematicMode] = useState(false);

  const handleMarkerClick = (item: {
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
    if (item.type === 'team') {
      setPanelModule('team-hq');
      setPanelData({
        ...item
      });
    } else if (item.type === 'circuit') {
      setPanelModule('circuit-detail');
      setPanelData(item);
    }
    setPanelOpen(true);
  };

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

    if (mapRef) {
      mapRef.flyToCircuit('austria');
    }
  };

  useEffect(() => {
    if (!mapRef) return;

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
      setTimeout(() => {
        if (nextRace.id === 'austria') {
          mapRef.flyToCircuit('austria', true);
        }
      }, 200);
    }, 1000);

    return () => clearTimeout(timer);
  }, [mapRef]);

  return (
    <main className="relative w-full h-screen overflow-hidden">
      {/* 전체 화면 지도 */}
      <Map 
        onMarkerClick={handleMarkerClick} 
        onMapReady={setMapRef} 
        onCinematicModeChange={setIsCinematicMode}
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
        onClose={() => setPanelOpen(false)}
        module={panelModule}
        data={panelData}
        onExploreCircuit={handleExploreCircuit}
        isCinematicMode={isCinematicMode}
        onToggleCinematicMode={() => {
          // 시네마틱 모드 토글
          if (mapRef?.toggleCinematicMode) {
            const isEnabled = mapRef.toggleCinematicMode();
            setIsCinematicMode(isEnabled);
          }
        }}
      />
    </main>
  );
}
