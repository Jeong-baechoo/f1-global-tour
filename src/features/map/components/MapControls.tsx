'use client';

import React from 'react';
import mapboxgl from 'mapbox-gl';
import ZoomScrollbar from '@/src/shared/components/ui/map/ZoomScrollbar';
import CircuitInfoPanel from '@/src/shared/components/ui/map/CircuitInfoPanel';
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
  onToggleSectorInfo: (enabled: boolean) => void;
  onToggleDRSInfo: (enabled: boolean) => void;
  onToggleElevation: (enabled: boolean) => void;
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
  onToggleSectorInfo,
  onToggleDRSInfo,
  onToggleElevation,
}) => {
  return (
    <>
      {/* Circuit Info Panel - 항상 표시 (원본과 동일) */}
      <CircuitInfoPanel
        isVisible={true}
        onToggleSectorInfo={onToggleSectorInfo}
        onToggleDRSInfo={onToggleDRSInfo}
        onToggleElevation={onToggleElevation}
        sectorInfoEnabled={sectorInfoEnabled}
        drsInfoEnabled={drsInfoEnabled}
        elevationEnabled={elevationEnabled}
        currentCircuit={currentCircuit || undefined}
        drsZoneCount={drsZoneCount}
        drsDetectionCount={drsDetectionCount}
      />

      
      {/* 모바일 줌 스크롤바 */}
      <ZoomScrollbar map={map} className="sm:hidden" />
    </>
  );
};