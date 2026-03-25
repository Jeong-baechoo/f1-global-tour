'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { DriverInfoPanelProps, SectorPerformance } from './types';
import { cn } from '@/lib/utils';
import { useReplayStore } from '@/src/features/replay';
import { DriverTimingService } from '@/src/features/replay';
import { glassPanelStyle } from '../styles';
import ReplayErrorHandler from '../../../services/ReplayErrorHandler';

const SECTOR_COLORS: Record<SectorPerformance, string> = {
  fastest: 'bg-purple-500',
  personal_best: 'bg-green-500',
  normal: 'bg-yellow-500',
  slow: 'bg-gray-600',
  none: 'bg-gray-300',
};

const SectorDisplay: React.FC<{ sector: { sector1: SectorPerformance; sector2: SectorPerformance; sector3: SectorPerformance } }> = ({ sector }) => (
  <div className="flex items-center gap-1">
    <div className={cn("w-4 h-3 rounded-sm", SECTOR_COLORS[sector.sector1])} />
    <div className={cn("w-4 h-3 rounded-sm", SECTOR_COLORS[sector.sector2])} />
    <div className={cn("w-4 h-3 rounded-sm", SECTOR_COLORS[sector.sector3])} />
  </div>
);

export const DriverInfoPanel: React.FC<DriverInfoPanelProps> = ({
  isReplayMode,
  drivers: propDrivers,
  selectedDrivers = [],
  onDriverSelect,
  className
}) => {
  const currentLap = useReplayStore(state => state.currentLap);
  const setCurrentLap = useReplayStore(state => state.actions.setCurrentLap);
  const currentSession = useReplayStore(state => state.currentSession);
  const currentTime = useReplayStore(state => state.currentTime);
  const [drivers, setDrivers] = useState(propDrivers || []);
  const [lastValidDrivers, setLastValidDrivers] = useState<typeof drivers>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  // 마지막 유효한 드라이버 데이터 관리
  useEffect(() => {
    if (drivers.length > 0) {
      if (lastValidDrivers.length > 0) {
        setIsUpdating(true);
        const updateTimeout = setTimeout(() => {
          setLastValidDrivers(drivers);
          setIsUpdating(false);
        }, 100);
        return () => clearTimeout(updateTimeout);
      } else {
        setLastValidDrivers(drivers);
        setIsInitialLoading(false);
      }
    }
  }, [drivers, lastValidDrivers.length]);

  const displayDrivers = drivers.length > 0 ? drivers : lastValidDrivers;
  const shouldShowLoading = isInitialLoading && displayDrivers.length === 0;

  // 드라이버 클릭 — 즉시 호출 (setTimeout 불필요, useEffect cleanup에 의해 취소되던 버그 수정)
  const stableOnDriverSelect = useCallback((driverCode: string) => {
    onDriverSelect?.(driverCode);
  }, [onDriverSelect]);

  // 드라이버 데이터 업데이트 — 백엔드 프레임을 currentTime으로 조회 (병합 없음)
  const updateDriverData = useCallback(() => {
    if (!isReplayMode || !currentSession) return;
    try {
      const driverTimingService = DriverTimingService.getInstance();
      const updatedDrivers = driverTimingService.getTimingsForDisplay(currentTime);
      if (updatedDrivers.length > 0) {
        setDrivers(updatedDrivers);
      }
      // 백엔드 프레임의 currentLap으로 스토어 동기화 (2초 주기)
      const frameLap = driverTimingService.getCurrentLapFromFrame(currentTime);
      if (frameLap !== null && frameLap !== currentLap) {
        setCurrentLap(frameLap);
      }
    } catch (error) {
      ReplayErrorHandler.handleDriverDataError(
        error instanceof Error ? error : new Error('Driver timing update failed'),
        {
          currentLap,
          currentSession: currentSession?.sessionKey,
          driverCount: 0,
          operation: 'updateDriverTimings',
        },
      );
    }
  }, [isReplayMode, currentSession, currentLap, currentTime, setCurrentLap]);

  // 랩 변경 시 즉시 갱신 (lapTime/sector 경계 업데이트)
  useEffect(() => {
    if (isReplayMode && currentSession) {
      updateDriverData();
    }
  }, [isReplayMode, currentSession?.sessionKey, currentLap, updateDriverData]);

  // 2초마다 position/interval 갱신 (백엔드 프레임 단위와 일치)
  useEffect(() => {
    if (!isReplayMode || !currentSession) return;
    const interval = setInterval(updateDriverData, 2000);
    return () => clearInterval(interval);
  }, [isReplayMode, currentSession?.sessionKey, updateDriverData]);

  // 세션이 변경될 때 초기 빈값 드라이버 데이터 로드
  useEffect(() => {
    if (currentSession) {
      const driverTimingService = DriverTimingService.getInstance();
      const initialDrivers = driverTimingService.getInitialDriverTimings();
      setDrivers(initialDrivers);
    }
  }, [currentSession?.sessionKey]);

  if (!isReplayMode) return null;

  return (
    <div className={cn(
      "fixed right-6 top-24 z-40 w-[26rem]",
      "flex flex-col",
      className
    )}
    style={{
      height: '66rem',
      maxHeight: 'calc(100vh - 13rem)',
    }}
    >
      <div className="relative rounded-3xl shadow-2xl p-1.5 transition-shadow duration-300 h-full flex flex-col"
           style={glassPanelStyle}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/10 rounded-t-2xl">
        <div className="grid grid-cols-12 gap-6 text-xs text-gray-400 font-medium uppercase tracking-wider">
          <div className="col-span-3 text-left">DRIVER</div>
          <div className="col-span-2 text-center pr-2">INTERVAL</div>
          <div className="col-span-3 text-center pl-2">LAP TIME</div>
          <div className="col-span-2 text-center">SECTOR</div>
          <div className="col-span-2 text-center">TIRE</div>
        </div>
      </div>

      {/* Driver List */}
      <div className={cn(
        "flex-1 overflow-y-auto rounded-b-2xl relative",
        isUpdating && "opacity-90"
      )}>
        {isUpdating && (
          <div className="absolute top-2 right-2 z-10">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          </div>
        )}

        {shouldShowLoading ? (
          <div className="flex flex-col items-center justify-center py-16 px-6">
            <div className="flex gap-2 mb-4">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce [animation-delay:0ms]"></div>
              <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce [animation-delay:150ms]"></div>
              <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce [animation-delay:300ms]"></div>
            </div>
            <div className="text-gray-400 text-sm font-medium">Loading Driver Data...</div>
          </div>
        ) : (
          displayDrivers.slice(0, 20).map((driver) => (
            <div
              key={driver.driverCode}
              className={cn(
                "px-6 py-3 border-b border-white/10 cursor-pointer",
                "hover:bg-white/[0.05] transition-all duration-200",
                selectedDrivers.includes(driver.driverCode) && "bg-white/[0.08]",
                isUpdating && "transform transition-transform duration-100"
              )}
              onClick={() => {
                try {
                  stableOnDriverSelect(driver.driverCode);
                } catch (error) {
                  ReplayErrorHandler.handleUserInteractionError(
                    error instanceof Error ? error : new Error('Driver selection failed'),
                    {
                      driverCode: driver.driverCode,
                      driverPosition: driver.position,
                      operation: 'driverSelect'
                    }
                  );
                }
              }}
            >
              <div className="grid grid-cols-12 gap-6 items-center">
                {/* Position & Driver */}
                <div className="col-span-3 flex items-center gap-2">
                  <span className="text-white font-bold text-sm w-4">{driver.position}</span>
                  <div className="w-1 h-6 rounded" style={{ backgroundColor: driver.teamColor }} />
                  <span className="text-white font-bold text-sm">{driver.driverCode}</span>
                </div>

                {/* Interval */}
                <div className="col-span-2 pr-2">
                  <div className="text-green-400 font-mono text-sm font-medium text-center">{driver.interval}</div>
                </div>

                {/* Lap Times */}
                <div className="col-span-3 pl-2">
                  <div className="text-white font-mono text-sm font-medium text-center">{driver.currentLapTime}</div>
                </div>

                {/* Sector */}
                <div className="col-span-2 flex items-center pr-4">
                  <SectorDisplay sector={driver.miniSector} />
                </div>

                {/* Tire Info */}
                <div className="col-span-2 pl-2">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gray-600 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full" />
                    </div>
                    <div className="text-white font-bold text-sm">
                      {driver.tireInfo.pitStops === -1 ? '-PIT' : `${driver.tireInfo.pitStops}PIT`}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      </div>
    </div>
  );
};
