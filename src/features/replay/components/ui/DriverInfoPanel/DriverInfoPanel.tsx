'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { DriverInfoPanelProps } from './types';
import { cn } from '@/lib/utils';
import { useReplayStore } from '@/src/features/replay';
import { DriverTimingService } from '@/src/features/replay';
import { RealtimeUpdateService } from '@/src/features/replay';
import ReplayErrorHandler from '../../../services/ReplayErrorHandler';

const getSectorColor = (performance: 'fastest' | 'personal_best' | 'normal' | 'slow' | 'none') => {
  switch (performance) {
    case 'fastest': return 'bg-purple-500'; // Purple for fastest overall
    case 'personal_best': return 'bg-green-500'; // Green for personal best
    case 'normal': return 'bg-yellow-500'; // Yellow for normal
    case 'slow': return 'bg-gray-600'; // Gray for slow
    case 'none': return 'bg-gray-300'; // Light gray for no data
    default: return 'bg-gray-300';
  }
};

interface SectorData {
  sector1: 'fastest' | 'personal_best' | 'normal' | 'slow' | 'none';
  sector2: 'fastest' | 'personal_best' | 'normal' | 'slow' | 'none';
  sector3: 'fastest' | 'personal_best' | 'normal' | 'slow' | 'none';
}

const SectorDisplay: React.FC<{ sector: SectorData }> = ({ sector }) => (
  <div className="flex items-center gap-1">
    {/* Sector 1 */}
    <div className={cn("w-4 h-3 rounded-sm", getSectorColor(sector.sector1))} />
    {/* Sector 2 */}
    <div className={cn("w-4 h-3 rounded-sm", getSectorColor(sector.sector2))} />
    {/* Sector 3 */}
    <div className={cn("w-4 h-3 rounded-sm", getSectorColor(sector.sector3))} />
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
  const currentSession = useReplayStore(state => state.currentSession);
  const isPlaying = useReplayStore(state => state.isPlaying);
  const driverPositions = useReplayStore(state => state.driverPositions);
  const [drivers, setDrivers] = useState(propDrivers || []);
  const [lastValidDrivers, setLastValidDrivers] = useState<typeof drivers>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // 마지막 유효한 드라이버 데이터 관리
  useEffect(() => {
    if (drivers.length > 0) {
      // 새로운 데이터가 들어오면 갱신 상태 표시
      if (lastValidDrivers.length > 0) {
        setIsUpdating(true);
        // 부드러운 갱신을 위한 짧은 지연
        const updateTimeout = setTimeout(() => {
          setLastValidDrivers(drivers);
          setIsUpdating(false);
        }, 100);
        return () => clearTimeout(updateTimeout);
      } else {
        // 첫 번째 데이터
        setLastValidDrivers(drivers);
        setIsInitialLoading(false);
      }
    }
  }, [drivers, lastValidDrivers.length]);

  // 표시할 드라이버 결정
  const displayDrivers = drivers.length > 0 ? drivers : lastValidDrivers;
  const shouldShowLoading = isInitialLoading && displayDrivers.length === 0;

  // 드라이버 클릭 이벤트 디바운싱 및 안정화
  const stableOnDriverSelect = useCallback((driverCode: string) => {
    // 이전 클릭 타이머 취소
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
    }

    // 짧은 지연으로 클릭 이벤트 안정화
    clickTimeoutRef.current = setTimeout(() => {
      onDriverSelect?.(driverCode);
    }, 10);
  }, [onDriverSelect]);

  // 드라이버 데이터 업데이트 함수 (의존성 최적화)
  const updateDriverData = useCallback(async () => {
    if (isReplayMode && currentSession) {
      try {
        const driverTimingService = DriverTimingService.getInstance();
        driverTimingService.setCurrentLap(currentLap);

        // 실제 드라이버 위치를 DriverTimingService에 전달
        if (driverPositions.length > 0) {
          driverTimingService.updateDriverPositions(driverPositions);
        }

        const updatedDrivers = await driverTimingService.generateCurrentDriverTimings();
        setDrivers(updatedDrivers);
      } catch (error) {
        ReplayErrorHandler.handleDriverDataError(
          error instanceof Error ? error : new Error('Driver timing update failed'),
          {
            currentLap,
            currentSession: currentSession?.sessionKey,
            driverCount: driverPositions.length,
            operation: 'updateDriverTimings'
          }
        );

        // 폴백으로 원본 드라이버 데이터 사용
        if (propDrivers) {
          setDrivers(propDrivers);
        }
      }
    } else if (propDrivers) {
      setDrivers(propDrivers);
    }
  }, [isReplayMode, currentSession?.sessionKey, currentLap, driverPositions.length, propDrivers]); // 안정적인 값만 의존성에 포함

  // async 업데이트를 위한 래퍼 함수
  const asyncUpdateWrapper = useCallback(() => {
    updateDriverData().catch(error => {
      console.error('Realtime update failed:', error);
    });
  }, [updateDriverData]);

  // 실시간 업데이트 서비스 관리
  useEffect(() => {
    const realtimeService = RealtimeUpdateService.getInstance();

    if (isReplayMode && isPlaying) {
      // 리플레이 재생 중일 때 실시간 업데이트 시작
      realtimeService.onUpdate(asyncUpdateWrapper);
      realtimeService.startRealtimeUpdates();
    } else {
      // 리플레이 일시정지 또는 비활성화 시 실시간 업데이트 중지
      realtimeService.offUpdate(asyncUpdateWrapper);
      realtimeService.stopRealtimeUpdates();
    }

    return () => {
      // 컴포넌트 언마운트 시 콜백 해제
      realtimeService.offUpdate(asyncUpdateWrapper);
      realtimeService.stopRealtimeUpdates();

      // 클릭 타이머 정리
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }
    };
  }, [isReplayMode, isPlaying, asyncUpdateWrapper]);

  // 세션이 변경될 때만 즉시 업데이트 (랩 변경은 RealtimeUpdateService가 처리)
  useEffect(() => {
    if (currentSession) {
      updateDriverData().catch(error => {
        console.error('Failed to update driver data:', error);
      });
    }
  }, [currentSession?.sessionKey]); // 세션 변경 시에만 실행

  if (!isReplayMode) return null;

  return (
    <div className={cn(
      "fixed right-6 top-24 z-40 w-[26rem]",
      "flex flex-col",
      className
    )}
    style={{ 
      height: '66rem', // 기본 높이 (20명 드라이버용)
      maxHeight: 'calc(100vh - 13rem)', // 화면 높이에서 top-24(6rem) + 하단 마진(6rem) 제외
    }}
    >
      <div className="relative rounded-3xl shadow-2xl p-1.5 transition-shadow duration-300 h-full flex flex-col"
           style={{
             backgroundColor: 'rgba(18, 18, 20, 0.65)',
             backdropFilter: 'blur(20px) saturate(180%)',
             WebkitBackdropFilter: 'blur(20px) saturate(180%)',
             border: '1px solid rgba(255, 255, 255, 0.08)',
             boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,0.05)',
             filter: 'drop-shadow(0 30px 60px rgba(0,0,0,0.3)) drop-shadow(0 15px 30px rgba(0,0,0,0.2))'
           }}>
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
        isUpdating && "opacity-90" // 갱신 중일 때 약간 투명하게
      )}>
        {/* 갱신 인디케이터 */}
        {isUpdating && (
          <div className="absolute top-2 right-2 z-10">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          </div>
        )}

        {shouldShowLoading ? (
          // 초기 로딩 상태 표시
          <div className="flex flex-col items-center justify-center py-16 px-6">
            <div className="flex gap-2 mb-4">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce [animation-delay:0ms]"></div>
              <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce [animation-delay:150ms]"></div>
              <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce [animation-delay:300ms]"></div>
            </div>
            <div className="text-gray-400 text-sm font-medium">Loading Driver Data...</div>
          </div>
        ) : (
          // 드라이버 리스트 (현재 데이터 또는 마지막 유효한 데이터)
          displayDrivers.slice(0, 20).map((driver) => (
            <div
              key={driver.driverCode} // 단순한 키 사용
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