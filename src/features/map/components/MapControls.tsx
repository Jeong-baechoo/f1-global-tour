'use client';

import React, { useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { Play } from 'lucide-react';
import CircuitInfoPanel from '@/src/shared/components/ui/map/CircuitInfoPanel';
import { ReplayPanel } from '@/src/features/replay';
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
}) => {
  const [isReplayPanelOpen, setIsReplayPanelOpen] = useState(false);

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

      {/* 리플레이 버튼 - 왼쪽 사이드로 이동 */}
      <div className="fixed left-6 top-1/2 -translate-y-1/2 z-40">
        <button
          onClick={handleReplayToggle}
          className="w-12 h-12 bg-black/80 backdrop-blur-sm rounded-full
                     border border-white/10 text-white
                     hover:bg-red-600/80 transition-colors
                     flex items-center justify-center shadow-lg"
          title="Open Race Replay"
        >
          <Play className="w-5 h-5" />
        </button>
      </div>

      {/* 리플레이 패널 */}
      <ReplayPanel
        isOpen={isReplayPanelOpen}
        onCloseAction={() => setIsReplayPanelOpen(false)}
        setIsReplayMode={setIsReplayMode}
      />
    </>
  );
};