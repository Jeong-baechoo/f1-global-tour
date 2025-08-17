'use client';

import React, { useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { Play } from 'lucide-react';
import ZoomScrollbar from '@/src/shared/components/ui/map/ZoomScrollbar';
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
}

/**
 * MapControls - 맵 컨트롤 UI 요소들을 관리하는 컴포넌트
 * CircuitInfoPanel, ZoomScrollbar를 포함
 */
export const MapControls: React.FC<MapControlsProps> = ({
  map,
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
}) => {
  const [isReplayPanelOpen, setIsReplayPanelOpen] = useState(false);

  const handleReplayToggle = () => {
    setIsReplayPanelOpen(!isReplayPanelOpen);
  };

  return (
    <>
      {/* Circuit Info Panel - 항상 표시 (원본과 동일) */}
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
      
      {/* 모바일 줌 스크롤바 */}
      <ZoomScrollbar map={map} className="sm:hidden" />

      {/* 리플레이 패널 */}
      <ReplayPanel 
        isOpen={isReplayPanelOpen}
        onClose={() => setIsReplayPanelOpen(false)}
      />
    </>
  );
};