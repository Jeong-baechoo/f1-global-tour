'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { glassPanelStyle } from '../styles';
import type { FlagStatus, LapFlagStatus, SessionType } from '../../../types';

export type { FlagStatus, LapFlagStatus, SessionType };

const FLAG_TEXT_COLORS: Record<FlagStatus, string> = {
  RED: 'text-red-500',
  SC: 'text-yellow-400',
  VSC: 'text-yellow-400',
  YELLOW: 'text-yellow-500',
  GREEN: 'text-gray-400',
};

const BAR_COLORS: Record<LapFlagStatus, string> = {
  RED: 'bg-red-500',
  SC: 'bg-yellow-400',
  VSC: 'bg-yellow-400',
  YELLOW: 'bg-yellow-500',
  NONE: 'bg-green-500',
};

const FLAG_HEADER_ITEMS: FlagStatus[] = ['RED', 'SC', 'VSC'];

const FLAG_LEGEND = [
  { color: 'bg-green-500', label: 'Green' },
  { color: 'bg-red-500', label: 'Red Flag' },
  { color: 'bg-yellow-400', label: 'SC / VSC' },
  { color: 'bg-gray-600', label: 'Pending' },
] as const;

// 플래그 심각도 우선순위 (높을수록 심각)
const FLAG_SEVERITY: Record<string, number> = { RED: 3, SC: 2, VSC: 1 };

interface FlagInfoPanelProps {
  className?: string;
  loading?: boolean;
  currentFlag: FlagStatus | null;
  sessionType: SessionType;
  totalLaps?: number;
  currentLap?: number;
  lapFlags?: LapFlagStatus[];
  totalMinutes?: number;
  currentMinute?: number;
  minuteFlags?: LapFlagStatus[];
}

export function FlagInfoPanel({
  className,
  loading = false,
  currentFlag = null,
  sessionType,
  totalLaps = 50,
  currentLap = 1,
  lapFlags = [],
  totalMinutes = 90,
  currentMinute = 1,
  minuteFlags = []
}: FlagInfoPanelProps) {
  const getBarColor = (flagStatus: LapFlagStatus, index: number) => {
    const isRace = sessionType === 'RACE';
    const currentPosition = isRace ? currentLap : currentMinute;
    if (index + 1 > currentPosition) return 'bg-gray-600';
    return BAR_COLORS[flagStatus] ?? 'bg-gray-600';
  };

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
    style={glassPanelStyle}>
      <div className="relative rounded-3xl p-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-6 gap-3">
            <div className="w-6 h-6 border-2 border-gray-500 border-t-white rounded-full animate-spin" />
            <span className="text-sm text-gray-400">Loading...</span>
          </div>
        ) : (
          <>
            {/* Flag Status Header */}
            <div className="flex items-center justify-center gap-6 mb-4">
              {FLAG_HEADER_ITEMS.map((flag) => (
                <div
                  key={flag}
                  className={cn(
                    "text-3xl font-bold uppercase tracking-wider transition-all duration-200",
                    currentFlag === flag ? FLAG_TEXT_COLORS[flag] : 'text-gray-400'
                  )}
                >
                  {flag}
                </div>
              ))}
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
              <PracticeProgressBars
                currentMinute={currentMinute}
                minuteFlags={minuteFlags}
                getBarColor={getBarColor}
              />
            ) : (
              <div className={cn(
                "grid gap-1.5",
                totalItems <= 20 ? "grid-cols-10" : "grid-cols-12"
              )}>
                {Array.from({ length: totalItems }, (_, index) => {
                  const itemNumber = index + 1;
                  const itemFlag = itemFlags[index] || 'NONE';
                  const isCurrent = itemNumber === currentItem;
                  return (
                    <ProgressBarItem
                      key={itemNumber}
                      barColor={getBarColor(itemFlag, index)}
                      isCurrent={isCurrent}
                      isCompleted={itemNumber <= currentItem}
                      title={`${itemLabel} ${itemNumber}: ${itemFlag === 'NONE' ? 'Green Flag' : itemFlag}`}
                    />
                  );
                })}
              </div>
            )}

            {/* Legend */}
            <div className="mt-4 bg-gray-800/50 rounded-md p-3 border border-white/10">
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
                {FLAG_LEGEND.map(({ color, label }) => (
                  <div key={label} className="flex items-center gap-2">
                    <div className={cn("w-3 h-2 rounded-sm shadow-sm border border-black/20", color)} />
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// 프로그레스 바 아이템 컴포넌트
const ProgressBarItem: React.FC<{
  barColor: string;
  isCurrent: boolean;
  isCompleted: boolean;
  title: string;
}> = ({ barColor, isCurrent, isCompleted, title }) => (
  <div
    className={cn(
      "h-4 w-full rounded-sm transition-all duration-300 relative overflow-hidden",
      "shadow-sm border border-black/20",
      barColor,
      isCurrent && "ring-2 ring-white ring-opacity-80 scale-110 z-10"
    )}
    title={title}
  >
    {isCurrent && (
      <div className="absolute inset-0 bg-white/20 animate-pulse rounded-sm" />
    )}
    {isCompleted && (
      <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent rounded-sm" />
    )}
  </div>
);

// 연습 세션 프로그레스 바 컴포넌트
const PracticeProgressBars: React.FC<{
  currentMinute: number;
  minuteFlags: LapFlagStatus[];
  getBarColor: (flag: LapFlagStatus, index: number) => string;
}> = ({ currentMinute, minuteFlags, getBarColor }) => (
  <div className="grid grid-cols-10 gap-1.5">
    {Array.from({ length: 10 }, (_, index) => {
      const startMinute = index * 10 + 1;
      const endMinute = (index + 1) * 10;
      const isCurrentBlock = currentMinute >= startMinute && currentMinute <= endMinute;

      // 해당 10분 구간에서 가장 심각한 플래그 찾기
      let blockFlag: LapFlagStatus = 'NONE';
      for (let i = startMinute - 1; i < endMinute; i++) {
        const flag = minuteFlags[i];
        if (flag && (FLAG_SEVERITY[flag] ?? 0) > (FLAG_SEVERITY[blockFlag] ?? 0)) {
          blockFlag = flag;
        }
      }

      return (
        <ProgressBarItem
          key={index}
          barColor={getBarColor(blockFlag, index)}
          isCurrent={isCurrentBlock}
          isCompleted={endMinute <= currentMinute}
          title={`Min ${startMinute}-${endMinute}: ${blockFlag === 'NONE' ? 'Green Flag' : blockFlag}`}
        />
      );
    })}
  </div>
);
