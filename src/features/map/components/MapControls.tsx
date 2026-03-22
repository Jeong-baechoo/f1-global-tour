'use client';

import React, { useState, useEffect, useMemo } from 'react';
import mapboxgl from 'mapbox-gl';
import CircuitInfoPanel from '@/src/shared/components/ui/map/CircuitInfoPanel';
import { ReplayPanel, useReplayStore } from '@/src/features/replay';
import { ReplayProgressBar } from '@/src/features/replay/components/ReplayProgressBar';
import { DriverTelemetryPanel, FlagInfoPanel, TrackInfoTogglePanel, ErrorNotification } from '@/src/features/replay/components/ui';
import { BackendReplayApiService } from '@/src/features/replay/services/BackendReplayApiService';
import { DriverTimingService } from '@/src/features/replay/services/DriverTimingService';
import type { Circuit } from '@/src/features/circuits/types';
import type { TelemetryFrame } from '@/src/features/replay/services/BackendReplayApiService';

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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onDriverSelect: _,
  selectedDriverForTelemetry,
  // Accept but don't use these props to maintain compatibility
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  map: __,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  isCircuitView: ___
}) => {
  const [isReplayPanelOpen, setIsReplayPanelOpen] = useState(false);
  const [telemetryFrame, setTelemetryFrame] = useState<TelemetryFrame | null>(null);
  const [telemetryDriverCode, setTelemetryDriverCode] = useState<string | null>(null);
  const [telemetryTeamColor, setTelemetryTeamColor] = useState<string | null>(null);

  // 리플레이 스토어에서 선택된 드라이버 정보 가져오기
  const isPlaying = useReplayStore(state => state.isPlaying);
  const currentTime = useReplayStore(state => state.currentTime);
  const drivers = useReplayStore(state => state.drivers);

  // driverCode → driverNumber 매핑
  const driverNumberByCode = useMemo(() => {
    const map = new Map<string, number>();
    drivers.forEach(d => map.set(d.nameAcronym, d.driverNumber));
    return map;
  }, [drivers]);

  // 현재 표시할 드라이버 코드 결정 (선택 없으면 driver-timings 프레임의 1위 드라이버)
  const targetDriverCode = useMemo(() => {
    if (selectedDriverForTelemetry) {
      return selectedDriverForTelemetry;
    }
    // 선택 없으면 현재 프레임의 1위 드라이버 코드
    const backendApi = BackendReplayApiService.getInstance();
    const frame = backendApi.getFrameAtTime(currentTime);
    if (frame && frame.drivers.length > 0) {
      return frame.drivers[0].driverCode;
    }
    return null;
  }, [selectedDriverForTelemetry, currentTime]);

  // driverCode → driverNumber 변환
  const selectedDriverNumber = useMemo(() => {
    if (!targetDriverCode) return null;
    return driverNumberByCode.get(targetDriverCode) ?? null;
  }, [targetDriverCode, driverNumberByCode]);

  // 텔레메트리 데이터 로드 완료 여부 추적 (로드 완료 시 re-render 트리거)
  const [telemetryReady, setTelemetryReady] = useState(0);

  // 드라이버 선택 변경 시 — 드라이버 정보 + 텔레메트리 데이터 로드
  useEffect(() => {
    if (!isReplayMode || !targetDriverCode) {
      setTelemetryFrame(null);
      setTelemetryDriverCode(null);
      setTelemetryTeamColor(null);
      return;
    }

    // 드라이버 정보 설정 (스토어에서 찾거나 코드를 직접 사용)
    const driver = drivers.find(d => d.nameAcronym === targetDriverCode);
    if (driver) {
      setTelemetryDriverCode(driver.nameAcronym);
      setTelemetryTeamColor(`#${driver.teamColor}`);
    } else {
      // 스토어에 없으면 driver-timings 프레임에서 팀 컬러 가져오기
      const backendApi = BackendReplayApiService.getInstance();
      const frame = backendApi.getFrameAtTime(currentTime);
      const frameDriver = frame?.drivers.find(d => d.driverCode === targetDriverCode);
      setTelemetryDriverCode(targetDriverCode);
      setTelemetryTeamColor(frameDriver ? `#${frameDriver.teamColor}` : '#FFFFFF');
    }

    // driverNumber가 있으면 텔레메트리 로드
    if (selectedDriverNumber !== null) {
      const backendApi = BackendReplayApiService.getInstance();
      if (!backendApi.isTelemetryLoaded(selectedDriverNumber)) {
        backendApi.loadDriverTelemetry(selectedDriverNumber).then(() => {
          setTelemetryReady(prev => prev + 1);
        });
      }
    }
  }, [isReplayMode, targetDriverCode, selectedDriverNumber, drivers]);

  // currentTime 변경 또는 텔레메트리 로드 완료 시 프레임 업데이트
  useEffect(() => {
    if (!isReplayMode || selectedDriverNumber === null) return;

    const backendApi = BackendReplayApiService.getInstance();
    const frame = backendApi.getTelemetryAtTime(selectedDriverNumber, currentTime);
    setTelemetryFrame(frame);
  }, [isReplayMode, selectedDriverNumber, currentTime, telemetryReady]);

  const handleReplayToggle = () => {
    // 리플레이 패널을 열기 전에 다른 패널들을 닫기
    if (resetPanelStates) {
      resetPanelStates();
    }

    setIsReplayPanelOpen(!isReplayPanelOpen);
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

      {/* 리플레이 버튼 - F1 로고 오른쪽 - 모바일에서 숨김, 리플레이 모드에서 숨김 */}
      {!isReplayMode && (
      <div className="fixed left-56 top-10 z-40 hidden sm:block">
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
      )}

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
                const driverTimingService = DriverTimingService.getInstance();

                // 재생 중이 아닐 때는 정적 데이터 사용
                const displayTelemetry = isPlaying && telemetryFrame
                  ? telemetryFrame
                  : { speed: 0, gear: 0, throttle: 0, brake: 0, drsEnabled: false, drsAvailable: false };

                const raceStatus = driverTimingService.getRaceStatus(currentTime);

                return (
                  <>
                    {/* 텔레메트리 패널 */}
                    <div className="pointer-events-auto">
                      <DriverTelemetryPanel
                        speed={displayTelemetry.speed}
                        gear={displayTelemetry.gear}
                        throttle={displayTelemetry.throttle}
                        brake={displayTelemetry.brake}
                        drsEnabled={displayTelemetry.drsEnabled}
                        drsAvailable={displayTelemetry.drsAvailable}
                        driverCode={telemetryDriverCode || '---'}
                        teamColor={telemetryTeamColor || '#FFFFFF'}
                      />
                    </div>

                    {/* 플래그 정보 패널 */}
                    {raceStatus && (
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
                    )}

                    {/* 트랙 정보 토글 패널 */}
                    <div className="pointer-events-auto">
                      <TrackInfoTogglePanel
                        initialSectorEnabled={false}
                        initialDRSEnabled={false}
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

      {/* 에러 알림 - 전역으로 표시 */}
      <ErrorNotification />
    </>
  );
};
