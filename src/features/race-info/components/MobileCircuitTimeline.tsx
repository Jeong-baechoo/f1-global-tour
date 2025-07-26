'use client';

import React, { useRef, useCallback, useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getText } from '@/utils/i18n';
import type { Circuit } from '@/src/shared/types';

interface MobileCircuitTimelineProps {
  circuits: Circuit[];
  onSelectCircuit: (circuit: Circuit) => void;
  selectedCircuitId?: string | null;
  panelState: {
    isOpen: boolean;
    isMinimized: boolean;
  };
}

export const MobileCircuitTimeline: React.FC<MobileCircuitTimelineProps> = ({
  circuits,
  onSelectCircuit,
  selectedCircuitId,
  panelState
}) => {
  const { language } = useLanguage();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [velocity, setVelocity] = useState(0);
  const animationRef = useRef<number | null>(null);
  const lastMoveTime = useRef<number>(0);
  const lastMoveX = useRef<number>(0);
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);

  // 모바일 체크
  useEffect(() => {
    setMounted(true);
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 날짜 포맷팅
  const formatRaceDate = (dateString: string) => {
    const date = new Date(dateString);
    const month = date.toLocaleDateString(language === 'ko' ? 'ko-KR' : 'en-US', { month: 'short' });
    const day = date.getDate();
    return `${month.toUpperCase()} ${day}`;
  };

  // 모멘텀 스크롤 애니메이션
  const momentumScroll = useCallback(() => {
    if (!scrollRef.current) return;

    if (Math.abs(velocity) > 0.1) {
      const newScrollLeft = scrollRef.current.scrollLeft + velocity;
      const maxScrollLeft = scrollRef.current.scrollWidth - scrollRef.current.clientWidth;
      
      // 경계 체크: 0보다 작거나 최대값보다 크면 정지
      if (newScrollLeft < 0 || newScrollLeft > maxScrollLeft) {
        setVelocity(0);
        return;
      }
      
      scrollRef.current.scrollLeft = newScrollLeft;
      setVelocity(velocity * 0.92);
      animationRef.current = requestAnimationFrame(momentumScroll);
    }
  }, [velocity]);

  // 드래그 핸들러들
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!scrollRef.current) return;

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
    setVelocity(0);
    lastMoveTime.current = Date.now();
    lastMoveX.current = e.pageX;
    lastDragTime.current = Date.now(); // 드래그 시작 시간 기록
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;

    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    scrollRef.current.scrollLeft = scrollLeft - walk;

    const now = Date.now();
    const timeDelta = now - lastMoveTime.current;
    const moveDelta = e.pageX - lastMoveX.current;
    
    if (timeDelta > 0) {
      setVelocity(moveDelta / timeDelta * 16);
    }
    
    lastMoveTime.current = now;
    lastMoveX.current = e.pageX;
  }, [isDragging, startX, scrollLeft]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    lastDragTime.current = Date.now(); // 드래그 완료 시간 기록
    setVelocity(0); // velocity 리셋
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!scrollRef.current) return;

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    const touch = e.touches[0];
    setIsDragging(true);
    setStartX(touch.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
    setVelocity(0);
    lastMoveTime.current = Date.now();
    lastMoveX.current = touch.pageX;
    lastDragTime.current = Date.now(); // 드래그 시작 시간 기록
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging || !scrollRef.current) return;

    const touch = e.touches[0];
    const x = touch.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    scrollRef.current.scrollLeft = scrollLeft - walk;

    const now = Date.now();
    const timeDelta = now - lastMoveTime.current;
    const moveDelta = touch.pageX - lastMoveX.current;
    
    if (timeDelta > 0) {
      setVelocity(moveDelta / timeDelta * 16);
    }
    
    lastMoveTime.current = now;
    lastMoveX.current = touch.pageX;
  }, [isDragging, startX, scrollLeft]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    lastDragTime.current = Date.now(); // 드래그 완료 시간 기록
    setVelocity(0); // velocity 리셋
  }, []);

  // 서킷 선택 핸들러
  const handleCircuitClick = useCallback((circuit: Circuit, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isDragging) {
      onSelectCircuit(circuit);
    }
  }, [isDragging, onSelectCircuit]);

  // 선택된 서킷을 중앙으로 스크롤
  const scrollToSelectedCircuit = useCallback((circuitId: string) => {
    if (!scrollRef.current) return;

    const container = scrollRef.current;
    const circuitElement = container.querySelector(`[data-circuit-id="${circuitId}"]`) as HTMLElement;
    
    if (circuitElement) {
      const containerRect = container.getBoundingClientRect();
      const elementRect = circuitElement.getBoundingClientRect();
      
      // 요소의 중앙을 컨테이너의 중앙으로 이동
      const elementCenter = elementRect.left + elementRect.width / 2;
      const containerCenter = containerRect.left + containerRect.width / 2;
      const scrollOffset = elementCenter - containerCenter;
      
      const newScrollLeft = container.scrollLeft + scrollOffset;
      const maxScrollLeft = container.scrollWidth - container.clientWidth;
      
      // 경계 체크
      const targetScrollLeft = Math.max(0, Math.min(newScrollLeft, maxScrollLeft));
      
      // 부드러운 스크롤
      container.scrollTo({
        left: targetScrollLeft,
        behavior: 'smooth'
      });
    }
  }, []);

  // 마지막 드래그 시간 추적
  const lastDragTime = useRef<number>(0);
  
  // selectedCircuitId가 변경될 때 자동 스크롤
  useEffect(() => {
    if (selectedCircuitId && mounted) {
      // 약간의 지연을 두어 렌더링 완료 후 스크롤
      const timeoutId = setTimeout(() => {
        scrollToSelectedCircuit(selectedCircuitId);
      }, 200);
      
      return () => clearTimeout(timeoutId);
    }
  }, [selectedCircuitId, mounted, scrollToSelectedCircuit]);


  // 패널 상태에 따른 위치 계산
  const getBottomPosition = () => {
    if (!panelState.isOpen) return '24px';
    if (panelState.isMinimized) return '118px'; // 102px (minimized panel) + 16px (margin)
    return '96px'; // 패널이 열려있을 때는 peek 상태 위에 배치 (80px + 16px)
  };

  // SSR 방지
  if (!mounted) return null;

  // 데스크톱에서는 렌더링하지 않음
  if (!isMobile) return null;

  return (
    <div
      className="fixed left-4 right-4 transition-all duration-300 z-[9998]"
      style={{
        bottom: getBottomPosition()
      }}
    >
      <div 
        className="rounded-2xl overflow-hidden border shadow-xl"
        style={{
          backgroundColor: 'rgba(18, 18, 20, 0.95)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          borderColor: 'rgba(255, 255, 255, 0.08)',
          boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,0.05), 0 10px 30px rgba(0,0,0,0.4)'
        }}
      >
        {/* 상단 그라디언트 라벨 */}
        <div className="px-4 pt-2 pb-1">
          <div className="flex items-center gap-2">
            <div className="w-1 h-3 rounded-full bg-[#FF1801]" />
            <span className="text-[10px] text-[#C0C0C0] uppercase tracking-widest font-medium">
              {language === 'ko' ? '서킷 타임라인' : 'Circuit Timeline'}
            </span>
          </div>
        </div>

        {/* 스크롤 컨테이너 */}
        <div
          ref={scrollRef}
          className="overflow-x-auto scrollbar-hide pb-3 px-2"
          style={{ 
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          <div className="flex gap-2 px-2" style={{ width: 'max-content' }}>
            {circuits.map((circuit) => {
              const isSelected = selectedCircuitId === circuit.id;
              return (
                <div
                  key={circuit.id}
                  data-circuit-id={circuit.id}
                  onClick={(e) => handleCircuitClick(circuit, e)}
                  className={`
                    flex-shrink-0 px-3 py-2 rounded-xl border transition-all duration-300 cursor-pointer
                    select-none min-w-[120px]
                    ${isSelected 
                      ? 'bg-[#FF1801]/15 border-[#FF1801]/40 shadow-md' 
                      : 'bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.12]'
                    }
                  `}
                  style={{
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                  }}
                >
                  <div className="flex flex-col items-center gap-1">
                    {/* 날짜 */}
                    <div className={`text-[10px] uppercase tracking-wider font-semibold ${
                      isSelected ? 'text-[#FF1801]' : 'text-white/50'
                    }`}>
                      {circuit.raceDate2025 ? formatRaceDate(circuit.raceDate2025) : 'TBD'}
                    </div>
                    
                    {/* 그랑프리 이름 */}
                    <div className={`text-xs font-medium text-center leading-tight ${
                      isSelected ? 'text-white' : 'text-white/80'
                    }`} style={{ fontFamily: 'Inter, sans-serif' }}>
                      {getText(circuit.grandPrix, language)}
                    </div>
                    
                    {/* 선택 표시 */}
                    {isSelected && (
                      <div className="w-1 h-1 bg-[#FF1801] rounded-full mt-0.5" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 좌우 그라디언트 마스크 */}
        <div 
          className="absolute top-0 left-0 w-8 h-full pointer-events-none"
          style={{
            background: 'linear-gradient(to right, rgba(18,18,20,0.85), transparent)'
          }}
        />
        <div 
          className="absolute top-0 right-0 w-8 h-full pointer-events-none"
          style={{
            background: 'linear-gradient(to left, rgba(18,18,20,0.85), transparent)'
          }}
        />
      </div>
    </div>
  );
};

MobileCircuitTimeline.displayName = 'MobileCircuitTimeline';