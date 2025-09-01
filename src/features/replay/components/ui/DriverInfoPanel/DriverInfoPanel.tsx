'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { DriverInfoPanelProps } from './types';
import { cn } from '@/lib/utils';
import { useReplayStore } from '@/src/features/replay';
import { getDriverTimings } from './mockData';
import { RealtimeUpdateService } from '../../../services/RealtimeUpdateService';

const getSectorColor = (performance: 'fastest' | 'personal_best' | 'normal' | 'slow') => {
  switch (performance) {
    case 'fastest': return 'bg-purple-500'; // Purple for fastest overall
    case 'personal_best': return 'bg-green-500'; // Green for personal best
    case 'normal': return 'bg-yellow-500'; // Yellow for normal
    case 'slow': return 'bg-gray-600'; // Gray for slow
    default: return 'bg-gray-600';
  }
};

const SectorDisplay: React.FC<{ sector: any }> = ({ sector }) => (
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
  const [drivers, setDrivers] = useState(propDrivers || []);
  const [updateKey, setUpdateKey] = useState(0);

  // 드라이버 데이터 업데이트 함수
  const updateDriverData = useCallback(() => {
    if (isReplayMode && currentSession) {
      try {
        const updatedDrivers = getDriverTimings(currentLap);
        setDrivers(updatedDrivers);
        setUpdateKey(prev => prev + 1); // 강제 리렌더링을 위한 키 업데이트
      } catch (error) {
        console.warn('Failed to update driver timings:', error);
        if (propDrivers) {
          setDrivers(propDrivers);
        }
      }
    } else if (propDrivers) {
      setDrivers(propDrivers);
    }
  }, [isReplayMode, currentSession, currentLap, propDrivers]);

  // 실시간 업데이트 서비스 관리
  useEffect(() => {
    const realtimeService = RealtimeUpdateService.getInstance();

    if (isReplayMode && isPlaying) {
      // 리플레이 재생 중일 때 실시간 업데이트 시작
      realtimeService.onUpdate(updateDriverData);
      realtimeService.startRealtimeUpdates();
      console.log('🏎️ Started realtime driver updates for replay mode');
    } else {
      // 리플레이 일시정지 또는 비활성화 시 실시간 업데이트 중지
      realtimeService.offUpdate(updateDriverData);
      realtimeService.stopRealtimeUpdates();
    }

    return () => {
      // 컴포넌트 언마운트 시 콜백 해제
      realtimeService.offUpdate(updateDriverData);
      realtimeService.stopRealtimeUpdates();
    };
  }, [isReplayMode, isPlaying, updateDriverData]);

  // 리플레이 현재 랩이나 세션이 변경될 때마다 즉시 드라이버 데이터 업데이트
  useEffect(() => {
    updateDriverData();
  }, [updateDriverData]);

  if (!isReplayMode || !drivers.length) return null;

  return (
    <div className={cn(
      "fixed right-6 top-24 z-40 w-[28rem]",
      "flex flex-col",
      className
    )}
    style={{ 
      height: '66rem', // 기본 높이 (20명 드라이버용)
      maxHeight: 'calc(100vh - 8rem)', // 화면 높이에서 top-24(6rem) + 여백(2rem) 제외
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
      <div className="flex-1 overflow-y-auto rounded-b-2xl">
        {drivers.map((driver) => (
          <div
            key={`${driver.driverCode}-${updateKey}`} // 강제 리렌더링을 위한 키
            className={cn(
              "px-6 py-3 border-b border-white/10 cursor-pointer",
              "hover:bg-white/[0.05] transition-colors",
              selectedDrivers.includes(driver.driverCode) && "bg-white/[0.08]"
            )}
            onClick={() => onDriverSelect?.(driver.driverCode)}
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
        ))}
      </div>
      </div>
    </div>
  );
};