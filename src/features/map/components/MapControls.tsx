'use client';

import React, { useState, useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import CircuitInfoPanel from '@/src/shared/components/ui/map/CircuitInfoPanel';
import { ReplayPanel, useReplayStore } from '@/src/features/replay';
import { ReplayProgressBar } from '@/src/features/replay/components/ReplayProgressBar';
import { DriverTelemetryPanel, FlagInfoPanel, ErrorNotification } from '@/src/features/replay/components/ui';
import { OpenF1MockDataService } from '@/src/features/replay/services/OpenF1MockDataService';
import ReplayErrorHandler from '@/src/features/replay/services/ReplayErrorHandler';
import type { Circuit } from '@/src/features/circuits/types';

interface MapControlsProps {
  map: mapboxgl.Map | null;
  isCircuitView: boolean;
  
  // Circuit Info Panel props
  sectorInfoEnabled: boolean;
  drsInfoEnabled: boolean;
  elevationEnabled: boolean;
  currentCircuit: Circuit | null;
  drsZoneCount: number;
  drsDetectionCount: number;
  onToggleSectorInfoAction: (enabled: boolean) => void;
  onToggleDRSInfoAction: (enabled: boolean) => void;
  onToggleElevationAction: (enabled: boolean) => void;
  resetPanelStates?: () => void;
  
  // 리플레이 모드 관련 props
  isReplayMode?: boolean;
  setIsReplayMode?: (isReplayMode: boolean) => void;
  onDriverSelect?: (driverCode: string) => void;
  selectedDriverForTelemetry?: string | null;
}

/**
 * MapControls - 맵 컨트롤 UI 요소들을 관리하는 컴포넌트
 * CircuitInfoPanel, ZoomScrollbar를 포함
 */
export const MapControls: React.FC<MapControlsProps> = ({
  // map,
  // isCircuitView,
  sectorInfoEnabled,
  drsInfoEnabled,
  elevationEnabled,
  currentCircuit,
  drsZoneCount,
  drsDetectionCount,
  onToggleSectorInfoAction,
  onToggleDRSInfoAction,
  onToggleElevationAction,
  resetPanelStates,
  isReplayMode = false,
  setIsReplayMode,
  onDriverSelect,
  selectedDriverForTelemetry,
}) => {
  const [isReplayPanelOpen, setIsReplayPanelOpen] = useState(false);
  const [selectedDriverTelemetry, setSelectedDriverTelemetry] = useState<any>(null);
  
  // 사용자 선택 보호를 위한 락 메커니즘
  const userSelectionLockRef = useRef<NodeJS.Timeout | null>(null);
  const isUserSelectionActiveRef = useRef(false);
  
  // 리플레이 스토어에서 선택된 드라이버 정보 가져오기
  const selectedDrivers = useReplayStore(state => state.selectedDrivers);
  const isPlaying = useReplayStore(state => state.isPlaying);
  
  // 텔레메트리 데이터 업데이트 - 선택된 드라이버 우선, 없으면 1등 드라이버 표시
  useEffect(() => {
    if (!isReplayMode) {
      setSelectedDriverTelemetry(null);
      return;
    }

    const openF1Service = OpenF1MockDataService.getInstance();
    
    const updateTelemetry = () => {
      try {
        // 🔒 사용자 선택이 활성화되어 있으면 자동 업데이트 중단
        if (isUserSelectionActiveRef.current) {
          return;
        }

        const realtimeData = openF1Service.generateRealtimeDriverData();
        
        if (realtimeData.length === 0) {
          setSelectedDriverTelemetry(null);
          return;
        }

        // 선택된 드라이버가 있으면 해당 드라이버를 우선적으로 찾기
        let targetDriver;
        if (selectedDriverForTelemetry) {
          targetDriver = realtimeData.find(driver => driver.name_acronym === selectedDriverForTelemetry);
          
          // 선택된 드라이버를 찾았다면 즉시 설정하고 리턴
          if (targetDriver) {
            setSelectedDriverTelemetry(targetDriver);
            return;
          }
        }
        
        // 선택된 드라이버가 없거나 찾을 수 없을 때만 1위 드라이버 사용
        const leaderData = realtimeData.find(driver => driver.position === 1);
        targetDriver = leaderData || realtimeData[0];
        setSelectedDriverTelemetry(targetDriver);
        
      } catch (error) {
        ReplayErrorHandler.handleTelemetryError(
          error instanceof Error ? error : new Error('Telemetry update failed'),
          {
            selectedDriver: selectedDriverForTelemetry,
            isUserSelectionActive: isUserSelectionActiveRef.current,
            operation: 'updateTelemetry'
          }
        );
        setSelectedDriverTelemetry(null);
      }
    };
    
    // 초기 데이터 로드
    updateTelemetry();

    // 실시간 업데이트 - 사용자 선택을 방해하지 않도록 더 느린 주기 사용
    const interval = setInterval(updateTelemetry, 2000);

    return () => {
      clearInterval(interval);
      // 사용자 선택 락 타이머도 정리
      if (userSelectionLockRef.current) {
        clearTimeout(userSelectionLockRef.current);
      }
    };
  }, [isReplayMode, selectedDriverForTelemetry]);

  const handleReplayToggle = () => {
    // 리플레이 패널을 열기 전에 다른 패널들을 닫기
    if (resetPanelStates) {
      resetPanelStates();
    }
    
    setIsReplayPanelOpen(!isReplayPanelOpen);
  };

  const handleDriverSelect = (driverCode: string) => {
    // 🔒 사용자 선택 락 활성화 (5초간 자동 업데이트 차단)
    isUserSelectionActiveRef.current = true;
    
    // 기존 타이머가 있으면 클리어
    if (userSelectionLockRef.current) {
      clearTimeout(userSelectionLockRef.current);
    }
    
    // 즉시 텔레메트리 업데이트 (클릭 응답성 향상)
    try {
      const openF1Service = OpenF1MockDataService.getInstance();
      const realtimeData = openF1Service.generateRealtimeDriverData();
      const targetDriver = realtimeData.find(driver => driver.name_acronym === driverCode);
      
      if (targetDriver) {
        setSelectedDriverTelemetry(targetDriver);
        console.log(`🎯 User selected driver: ${driverCode} - Lock activated for 5 seconds`);
      }
    } catch (error) {
      ReplayErrorHandler.handleUserInteractionError(
        error instanceof Error ? error : new Error('Driver selection failed'),
        {
          driverCode,
          operation: 'immediateDriverSelection',
          lockState: isUserSelectionActiveRef.current
        }
      );
    }
    
    // 상위 컴포넌트에 알림
    onDriverSelect?.(driverCode);
    
    // 5초 후 락 해제 (자동 업데이트 재개)
    userSelectionLockRef.current = setTimeout(() => {
      isUserSelectionActiveRef.current = false;
      console.log(`🔓 User selection lock released for: ${driverCode}`);
    }, 5000);
  };

  return (
    <>
      {/* Circuit Info Panel - 리플레이 모드에서 숨김 */}
      {!isReplayMode && (
      <CircuitInfoPanel
        isVisible={true}
        onToggleSectorInfoAction={onToggleSectorInfoAction}
        onToggleDRSInfoAction={onToggleDRSInfoAction}
        onToggleElevationAction={onToggleElevationAction}
        sectorInfoEnabled={sectorInfoEnabled}
        drsInfoEnabled={drsInfoEnabled}
        elevationEnabled={elevationEnabled}
        currentCircuit={currentCircuit || undefined}
        drsZoneCount={drsZoneCount}
        drsDetectionCount={drsDetectionCount}
      />
      )}

      {/* 리플레이 버튼 - F1 로고 오른쪽 */}
      <div className="fixed left-56 top-10 z-40">
        <button
          onClick={handleReplayToggle}
          className="px-4 py-2 bg-black/40 backdrop-blur-sm rounded-lg
                     border border-white/20 text-white
                     hover:bg-red-600/60 transition-colors
                     flex items-center justify-center shadow-lg
                     font-medium text-sm uppercase tracking-wider"
          title="Open Race Replay"
        >
          REPLAY
        </button>
      </div>

      {/* 재생바 - 페이지 중앙 하단 */}
      {isReplayMode && (
        <div className="fixed bottom-8 left-0 right-0 flex justify-center z-[9999] overflow-visible">
          <ReplayProgressBar className="w-[600px]" />
        </div>
      )}

      {/* 리플레이 패널들 스크롤 컨테이너 (리플레이 모드에서만) */}
      {isReplayMode && (
        <div className="fixed left-4 top-40 bottom-16 w-80 z-50 pointer-events-none">
          <div className="h-full overflow-y-auto 
                          scrollbar-thin scrollbar-thumb-gray-600/50 scrollbar-track-transparent 
                          hover:scrollbar-thumb-gray-500/70
                          [&::-webkit-scrollbar]:w-2
                          [&::-webkit-scrollbar-track]:bg-transparent
                          [&::-webkit-scrollbar-thumb]:bg-gray-600/50
                          [&::-webkit-scrollbar-thumb]:rounded-full
                          [&::-webkit-scrollbar-thumb:hover]:bg-gray-500/70">
            <div className="space-y-4 p-2">
              {(() => {
                const openF1Service = OpenF1MockDataService.getInstance();
                
                // selectedDriverTelemetry가 있으면 사용, 없으면 1위 드라이버 사용
                const displayDriver = selectedDriverTelemetry;
                
                if (!displayDriver) return null;
                
                // 재생 중이 아닐 때는 정적 데이터 사용
                const staticTelemetry = {
                  speed: 0,
                  gear: 0,
                  throttle: 0,
                  brake: 0,
                  drs_enabled: false,
                  drs_available: false
                };
                
                const displayTelemetry = isPlaying ? displayDriver.telemetry : staticTelemetry;
                const raceStatus = openF1Service.getRaceStatus();
                
                return (
                  <>
                    {/* 텔레메트리 패널 */}
                    <div className="pointer-events-auto">
                      <DriverTelemetryPanel
                        speed={displayTelemetry?.speed || 0}
                        gear={displayTelemetry?.gear || 0}
                        throttle={displayTelemetry?.throttle || 0}
                        brake={displayTelemetry?.brake || 0}
                        drsEnabled={displayTelemetry?.drs_enabled || false}
                        drsAvailable={displayTelemetry?.drs_available || false}
                        driverCode={displayDriver.name_acronym}
                        teamColor={`#${displayDriver.team_colour}`}
                      />
                    </div>

                    {/* 플래그 정보 패널 */}
                    <div className="pointer-events-auto">
                      <FlagInfoPanel
                        currentFlag={raceStatus.currentFlag}
                        sessionType={raceStatus.sessionType}
                        // 레이스용 props
                        totalLaps={raceStatus.totalLaps}
                        currentLap={raceStatus.currentLap}
                        lapFlags={raceStatus.lapFlags}
                        // 퀄리파잉/연습용 props
                        totalMinutes={raceStatus.totalMinutes}
                        currentMinute={raceStatus.currentMinute}
                        minuteFlags={raceStatus.minuteFlags}
                      />
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* 리플레이 패널 */}
      <ReplayPanel
        isOpen={isReplayPanelOpen}
        onCloseAction={() => setIsReplayPanelOpen(false)}
        setIsReplayMode={setIsReplayMode}
      />

      {/* 텔레메트리 패널 - 리플레이 모드에서 표시 */}
      {isReplayMode && (() => {
        const openF1Service = OpenF1MockDataService.getInstance();
        const realtimeData = openF1Service.generateRealtimeDriverData();
        const leaderData = realtimeData.find(driver => driver.position === 1) || realtimeData[0];
        
        
        if (!leaderData) return null;
        
        // 재생 중이 아닐 때는 정적 데이터 사용
        const staticTelemetry = {
          speed: 0,
          gear: 0,
          throttle: 0,
          brake: 0,
          drs_enabled: false,
          drs_available: false
        };
        
        const displayTelemetry = isPlaying ? leaderData.telemetry : staticTelemetry;
        
        return null; // 패널들은 이제 스크롤 컨테이너에서 관리됨
      })()}
      
      {/* 에러 알림 - 전역으로 표시 */}
      <ErrorNotification />
    </>
  );
};