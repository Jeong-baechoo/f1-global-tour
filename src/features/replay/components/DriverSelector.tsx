'use client';

import React, { useCallback, useMemo } from 'react';
import { Eye, EyeOff, Users, UserCheck } from 'lucide-react';
import { useReplayDrivers, useReplayStore, useReplayActions } from '@/src/features/replay';
import { cn } from '@/lib/utils';

interface DriverSelectorProps {
  className?: string;
}

export const DriverSelector: React.FC<DriverSelectorProps> = ({ className }) => {
  const drivers = useReplayDrivers();
  const selectedDrivers = useReplayStore(state => state.selectedDrivers);
  const currentSession = useReplayStore(state => state.currentSession);
  const { 
    selectDriver, 
    deselectDriver, 
    selectAllDrivers, 
    deselectAllDrivers 
  } = useReplayActions();

  // 팀 컬러의 밝기에 따른 최적 텍스트 색상 결정
  const getOptimalTextColor = useCallback((hexColor: string): string => {
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#000000' : '#FFFFFF';
  }, []);

  const handleDriverToggle = useCallback((driverNumber: number) => {
    if (selectedDrivers.includes(driverNumber)) {
      deselectDriver(driverNumber);
    } else {
      selectDriver(driverNumber);
    }
  }, [selectedDrivers, selectDriver, deselectDriver]);

  const handleSelectAll = useCallback(() => {
    if (selectedDrivers.length === drivers.length) {
      deselectAllDrivers();
    } else {
      selectAllDrivers();
    }
  }, [selectedDrivers.length, drivers.length, selectAllDrivers, deselectAllDrivers]);

  const isDriverSelected = useCallback((driverNumber: number) => {
    return selectedDrivers.includes(driverNumber);
  }, [selectedDrivers]);

  const allSelected = useMemo(() => 
    selectedDrivers.length === drivers.length, 
    [selectedDrivers.length, drivers.length]
  );

  return (
    <div className={cn(
      "bg-black/80 backdrop-blur-sm rounded-lg p-4 text-white",
      "border border-white/10",
      className
    )}>
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center">
          <Users className="w-5 h-5 mr-2" />
          Drivers
        </h3>
        
        <button
          onClick={handleSelectAll}
          className="flex items-center space-x-1 px-3 py-1 text-sm
                     hover:bg-white/10 rounded transition-colors"
        >
          {allSelected ? (
            <>
              <EyeOff className="w-4 h-4" />
              <span>Hide All</span>
            </>
          ) : (
            <>
              <UserCheck className="w-4 h-4" />
              <span>Show All</span>
            </>
          )}
        </button>
      </div>

      {/* 드라이버 목록 */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {!currentSession ? (
          <div className="text-center py-8 text-gray-400">
            <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Please select a session first</p>
          </div>
        ) : drivers.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <div className="animate-spin w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full mx-auto mb-2"></div>
            <p>Loading drivers...</p>
          </div>
        ) : (
          drivers.map(driver => {
          const isSelected = isDriverSelected(driver.driverNumber);
          
          return (
            <div
              key={driver.driverNumber}
              className={cn(
                "flex items-center space-x-3 p-2 rounded cursor-pointer transition-colors",
                isSelected 
                  ? "bg-white/10 border border-white/20" 
                  : "hover:bg-white/5"
              )}
              onClick={() => handleDriverToggle(driver.driverNumber)}
            >
              {/* 선택 표시 */}
              <div className="flex-shrink-0">
                {isSelected ? (
                  <Eye className="w-4 h-4 text-green-500" />
                ) : (
                  <EyeOff className="w-4 h-4 text-gray-500" />
                )}
              </div>

              {/* 드라이버 번호 */}
              <div 
                className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold"
                style={{ 
                  backgroundColor: `#${driver.teamColor}`,
                  color: getOptimalTextColor(driver.teamColor),
                  textShadow: getOptimalTextColor(driver.teamColor) === '#FFFFFF' 
                    ? '0 0 2px rgba(0,0,0,0.8)' 
                    : '0 0 2px rgba(255,255,255,0.8)'
                }}
              >
                {driver.driverNumber}
              </div>

              {/* 드라이버 정보 */}
              <div className="flex-grow min-w-0">
                <div className="font-medium truncate">
                  {driver.nameAcronym}
                </div>
                <div className="text-sm text-gray-400 truncate">
                  {driver.teamName}
                </div>
              </div>

              {/* 국가 코드 */}
              <div className="text-xs text-gray-500">
                {driver.countryCode}
              </div>
            </div>
          );
        }))}
      </div>

      {/* 하단 정보 */}
      <div className="mt-4 pt-4 border-t border-white/10">
        <div className="text-sm text-gray-400">
          {selectedDrivers.length} of {drivers.length} drivers selected
        </div>
      </div>
    </div>
  );
};