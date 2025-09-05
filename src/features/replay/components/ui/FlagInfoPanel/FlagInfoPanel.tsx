'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export type FlagStatus = 'GREEN' | 'RED' | 'SC' | 'VSC';
export type LapFlagStatus = 'NONE' | 'RED' | 'SC' | 'VSC';
export type SessionType = 'RACE' | 'QUALIFYING' | 'PRACTICE';

interface FlagInfoPanelProps {
  className?: string;
  currentFlag: FlagStatus | null; // 현재 플래그 상태
  sessionType: SessionType; // 세션 타입
  // 레이스용 props
  totalLaps?: number; // 전체 랩 수 (레이스용)
  currentLap?: number; // 현재 랩 (레이스용)
  lapFlags?: LapFlagStatus[]; // 각 랩별 플래그 상태
  // 퀄리파잉/연습용 props
  totalMinutes?: number; // 전체 세션 시간 (분)
  currentMinute?: number; // 현재 경과 시간 (분)
  minuteFlags?: LapFlagStatus[]; // 각 분별 플래그 상태
}

export function FlagInfoPanel({
  className,
  currentFlag = null,
  sessionType,
  // 레이스용 props
  totalLaps = 50,
  currentLap = 1,
  lapFlags = [],
  // 퀄리파잉/연습용 props
  totalMinutes = 90, // Q1 기준 18분, 연습 90분 등
  currentMinute = 1,
  minuteFlags = []
}: FlagInfoPanelProps) {
  const getFlagColor = (flag: FlagStatus | null) => {
    switch (flag) {
      case 'RED': return 'text-red-500';
      case 'SC': return 'text-yellow-400';
      case 'VSC': return 'text-yellow-400';
      case 'GREEN':
      default:
        return 'text-gray-400';
    }
  };

  const getBarColor = (flagStatus: LapFlagStatus, index: number, isCurrent: boolean) => {
    const isRace = sessionType === 'RACE';
    const currentPosition = isRace ? currentLap : currentMinute;
    const itemNumber = index + 1;
    
    // 현재 위치보다 이후 항목들은 회색
    if (itemNumber > currentPosition) {
      return 'bg-gray-600';
    }
    
    // 완료된 항목들은 해당 플래그 상태에 맞는 색상
    switch (flagStatus) {
      case 'RED': return 'bg-red-500';
      case 'SC': return 'bg-yellow-400';
      case 'VSC': return 'bg-yellow-400';
      case 'NONE': return 'bg-blue-500';
      default: return 'bg-gray-600';
    }
  };

  // 세션 타입에 따른 데이터 결정
  const isRace = sessionType === 'RACE';
  const totalItems = isRace ? totalLaps : totalMinutes;
  const currentItem = isRace ? currentLap : currentMinute;
  const itemFlags = isRace ? lapFlags : minuteFlags;
  const itemLabel = isRace ? 'LAP' : 'MIN';

  return (
    <div className={cn(
      "rounded-3xl shadow-2xl p-1.5 transition-shadow duration-300 text-white font-mono",
      "min-w-[250px]",
      className
    )}
    style={{
      backgroundColor: 'rgba(18, 18, 20, 0.65)',
      backdropFilter: 'blur(20px) saturate(180%)',
      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,0.05)',
      filter: 'drop-shadow(0 30px 60px rgba(0,0,0,0.3)) drop-shadow(0 15px 30px rgba(0,0,0,0.2))'
    }}>
      <div className="relative rounded-3xl p-4">
        {/* Flag Status Header */}
        <div className="flex items-center justify-center gap-6 mb-4">
        <div className={cn(
          "text-3xl font-bold uppercase tracking-wider transition-all duration-200",
          getFlagColor(currentFlag === 'RED' ? 'RED' : null)
        )}>
          RED
        </div>
        <div className={cn(
          "text-3xl font-bold uppercase tracking-wider transition-all duration-200",
          getFlagColor(currentFlag === 'SC' ? 'SC' : null)
        )}>
          SC
        </div>
        <div className={cn(
          "text-3xl font-bold uppercase tracking-wider transition-all duration-200",
          getFlagColor(currentFlag === 'VSC' ? 'VSC' : null)
        )}>
          VSC
        </div>
      </div>

      {/* Current Progress Info */}
      <div className="text-sm text-gray-400 mb-3">
        {itemLabel} {currentItem} / {totalItems}
        {!isRace && (
          <div className="text-xs text-gray-500 mt-1">
            {sessionType === 'QUALIFYING' ? 'Qualifying Session' : 'Practice Session'}
            {sessionType === 'PRACTICE' && (
              <div className="text-xs text-gray-500 mt-1">Timeline shows 10-minute blocks</div>
            )}
          </div>
        )}
      </div>

      {/* Progress Bars */}
      {sessionType === 'PRACTICE' ? (
        // 연습 세션용 - 10분 단위로 그룹화
        <div className="grid grid-cols-10 gap-1.5">
          {Array.from({ length: 10 }, (_, index) => {
            const tenMinuteBlock = index + 1;
            const startMinute = tenMinuteBlock * 10 - 9;
            const endMinute = tenMinuteBlock * 10;
            const isCurrentBlock = currentMinute >= startMinute && currentMinute <= endMinute;
            
            // 해당 10분 구간에서 가장 심각한 플래그 찾기
            let blockFlag: LapFlagStatus = 'NONE';
            for (let i = startMinute - 1; i < endMinute; i++) {
              const flag = minuteFlags[i];
              if (flag === 'RED') blockFlag = 'RED';
              else if (flag === 'SC' && blockFlag !== 'RED') blockFlag = 'SC';
              else if (flag === 'VSC' && blockFlag !== 'RED' && blockFlag !== 'SC') blockFlag = 'VSC';
            }
            
            return (
              <div
                key={tenMinuteBlock}
                className={cn(
                  "h-4 w-full rounded-sm transition-all duration-300 relative overflow-hidden",
                  "shadow-sm border border-black/20",
                  getBarColor(blockFlag, index, isCurrentBlock),
                  isCurrentBlock && "ring-2 ring-white ring-opacity-80 scale-110 z-10"
                )}
                title={`Min ${startMinute}-${endMinute}: ${blockFlag === 'NONE' ? 'Green Flag' : blockFlag}`}
              >
                {/* 현재 위치에 펄스 효과 추가 */}
                {isCurrentBlock && (
                  <div className="absolute inset-0 bg-white/20 animate-pulse rounded-sm"></div>
                )}
                
                {/* 완료된 항목에 그라데이션 효과 */}
                {endMinute <= currentMinute && (
                  <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent rounded-sm"></div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        // 레이스/퀄리파잉용 - 기존 로직
        <div className={cn(
          "grid gap-1.5",
          totalItems <= 20 ? "grid-cols-10" : 
          "grid-cols-12"
        )}>
          {Array.from({ length: totalItems }, (_, index) => {
            const itemNumber = index + 1;
            const itemFlag = itemFlags[index] || 'NONE';
            const isCurrent = itemNumber === currentItem;
            
            return (
              <div
                key={itemNumber}
                className={cn(
                  "h-4 w-full rounded-sm transition-all duration-300 relative overflow-hidden",
                  "shadow-sm border border-black/20",
                  getBarColor(itemFlag, index, isCurrent),
                  isCurrent && "ring-2 ring-white ring-opacity-80 scale-110 z-10"
                )}
                title={`${itemLabel} ${itemNumber}: ${itemFlag === 'NONE' ? 'Green Flag' : itemFlag}`}
              >
                {/* 현재 위치에 펄스 효과 추가 */}
                {isCurrent && (
                  <div className="absolute inset-0 bg-white/20 animate-pulse rounded-sm"></div>
                )}
                
                {/* 완료된 항목에 그라데이션 효과 */}
                {itemNumber <= currentItem && (
                  <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent rounded-sm"></div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Legend */}
      <div className="mt-4 bg-gray-800/50 rounded-md p-3 border border-white/10">
        <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <div className="w-3 h-2 bg-blue-500 rounded-sm shadow-sm border border-black/20"></div>
            <span>Green</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-2 bg-red-500 rounded-sm shadow-sm border border-black/20"></div>
            <span>Red Flag</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-2 bg-yellow-400 rounded-sm shadow-sm border border-black/20"></div>
            <span>SC / VSC</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-2 bg-gray-600 rounded-sm shadow-sm border border-black/20"></div>
            <span>Pending</span>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}