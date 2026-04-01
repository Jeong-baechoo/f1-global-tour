'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { CalendarDays } from 'lucide-react';
// import { useLanguage } from '@/contexts/LanguageContext';
import RaceTimelinePanel from './RaceTimelinePanel';
import type { Circuit } from '@/src/shared/types';

interface MobileCircuitTimelineProps {
  circuits: Circuit[];
  onSelectCircuitAction: (circuit: Circuit) => void;
  selectedCircuitId?: string | null;
  panelState?: {
    isOpen: boolean;
    isMinimized: boolean;
  };
  hasUserInteracted?: boolean;
}

export const MobileCircuitTimeline: React.FC<MobileCircuitTimelineProps> = ({
  circuits,
  onSelectCircuitAction,
  selectedCircuitId,
  panelState,
  hasUserInteracted = false
}) => {
  // const { language } = useLanguage();
  const [isTimelineOpen, setIsTimelineOpen] = useState(false);
  const [selectedRaceId, setSelectedRaceId] = useState<string>();
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);

  // 현재 시즌 레이스 날짜 반환
  const getRaceDateForSeason = (circuit: Circuit): string | null => {
    const year = new Date().getFullYear();
    if (year >= 2026) return circuit.raceDate2026 ?? null;
    return circuit.raceDate2025 ?? null;
  };

  // 현재 시즌 취소 여부 반환
  const isCancelledInSeason = (circuit: Circuit): boolean => {
    const year = new Date().getFullYear();
    if (year >= 2026) return circuit.cancelled2026 === true;
    return false;
  };

  // circuits 데이터를 round 순서로 정렬 (null 값 제외)
  const raceSchedule = circuits
    .filter(circuit => {
      const raceDate = getRaceDateForSeason(circuit);
      const year = new Date().getFullYear();
      const round = year >= 2026 ? circuit.round2026 : circuit.round;
      return round !== null && (raceDate || isCancelledInSeason(circuit));
    })
    .sort((a, b) => {
      const year = new Date().getFullYear();
      const roundA = year >= 2026 ? (a.round2026 || 0) : (a.round || 0);
      const roundB = year >= 2026 ? (b.round2026 || 0) : (b.round || 0);
      return roundA - roundB;
    });

  // 다음 레이스 찾기 함수
  const findNextRaceCircuit = useCallback((): Circuit | null => {
    const today = new Date();

    const circuitsWithDates = circuits
      .filter(circuit => getRaceDateForSeason(circuit) && !isCancelledInSeason(circuit))
      .sort((a, b) => {
        const dateA = new Date(getRaceDateForSeason(a)!);
        const dateB = new Date(getRaceDateForSeason(b)!);
        return dateA.getTime() - dateB.getTime();
      });

    const nextRace = circuitsWithDates.find(circuit => {
      const raceDate = new Date(getRaceDateForSeason(circuit)!);
      return raceDate > today;
    });

    return nextRace || circuitsWithDates[0] || null;
  }, [circuits]);

  // 모바일 체크 및 초기 다음 레이스 선택
  useEffect(() => {
    setMounted(true);
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);

    // 초기 로딩 시 다음 레이스 자동 선택 (모바일에서만, 사용자 상호작용이 없을 때만)
    if (window.innerWidth < 640 && !selectedCircuitId && !hasUserInteracted) {
      const nextRaceCircuit = findNextRaceCircuit();
      if (nextRaceCircuit) {
        setSelectedRaceId(nextRaceCircuit.id);
        onSelectCircuitAction(nextRaceCircuit);
      }
    }

    return () => window.removeEventListener('resize', checkMobile);
  }, [circuits, selectedCircuitId, onSelectCircuitAction, findNextRaceCircuit, hasUserInteracted]);

  // 패널 상태에 따른 RaceTimelinePanel 높이 계산
  const getPanelMaxHeight = () => {
    if (!panelState?.isOpen) return '100vh';

    if (panelState.isMinimized) return '100vh';

    // 패널이 열려있을 때는 패널 높이만큼 뺀 높이 사용
    const windowHeight = window.innerHeight;
    const peekHeight = 80;

    // 패널 높이에 따라 사용 가능한 높이 계산
    const usableHeight = windowHeight - peekHeight - 20; // 20px는 여유 공간
    return `${Math.max(usableHeight, 300)}px`; // 최소 300px는 보장
  };

  // 레이스 선택 핸들러
  const handleRaceSelect = (circuit: Circuit) => {
    setSelectedRaceId(circuit.id);

    // 서킷을 지도에서 선택
    onSelectCircuitAction(circuit);

    // 패널 닫기
    setIsTimelineOpen(false);
  };

  // SSR 방지
  if (!mounted) return null;

  // 데스크톱에서는 렌더링하지 않음
  if (!isMobile) return null;

  return (
    <>
      {/* 타임라인 토글 버튼 - 왼쪽 상단 */}
      <button
        onClick={() => setIsTimelineOpen(true)}
        className="fixed top-20 left-4 z-50 w-12 h-12 flex items-center justify-center bg-[#1A1A1A]/80 backdrop-blur-sm rounded-lg border border-[#FF1801]/20 hover:border-[#FF1801]/40 shadow-2xl transition-all duration-300 sm:hidden"
      >
        {/* 캘린더 아이콘 */}
        <CalendarDays className="w-6 h-6 text-white" />
      </button>

      {/* 레이스 타임라인 패널 */}
      <RaceTimelinePanel
        isOpen={isTimelineOpen}
        onClose={() => setIsTimelineOpen(false)}
        raceSchedule={raceSchedule}
        selectedRaceId={selectedRaceId}
        onRaceSelect={handleRaceSelect}
        maxHeight={getPanelMaxHeight()}
      />
    </>
  );
};

MobileCircuitTimeline.displayName = 'MobileCircuitTimeline';
