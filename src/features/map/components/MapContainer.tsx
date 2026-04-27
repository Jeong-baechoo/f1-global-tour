'use client';

import React, { useRef, useEffect } from 'react';
import { useMapStore } from '../store';
import { MapControls } from './MapControls';
import type { PanelData } from '@/src/features/race-info/types';
import type { Circuit } from '@/src/features/circuits/types';

interface MapContainerProps {
  children?: React.ReactNode;
  onMarkerClick?: (item: PanelData) => void;
  onUserInteraction?: () => void;
  // Circuit 관련 props
  isCircuitView?: boolean;
  currentCircuit?: Circuit | null;
  drsZoneCount?: number;
  drsDetectionCount?: number;
  resetPanelStates?: () => void;
  // 리플레이 모드 관련 props
  isReplayMode?: boolean;
  setIsReplayMode?: (isReplayMode: boolean) => void;
  onDriverSelect?: (driverCode: string) => void;
  selectedDriverForTelemetry?: string | null;
}

/**
 * MapContainer - 기존 Map.tsx를 감싸는 래퍼 컴포넌트
 * 점진적 마이그레이션을 위해 기존 Map 컴포넌트를 재사용
 */
export const MapContainer: React.FC<MapContainerProps> = ({
  children,
  onUserInteraction,
  isCircuitView = false,
  currentCircuit = null,
  drsZoneCount = 0,
  drsDetectionCount = 0,
  resetPanelStates,
  isReplayMode = false,
  setIsReplayMode,
  onDriverSelect,
  selectedDriverForTelemetry,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { setUserInteracting, map, isMapLoaded, sectorInfoEnabled, drsInfoEnabled, elevationEnabled, setSectorInfoEnabled, setDrsInfoEnabled, setElevationEnabled } = useMapStore();
  
  // Track event dispatchers
  const handleToggleSectorInfo = (enabled: boolean) => {
    setSectorInfoEnabled(enabled);
    // Dispatch event to toggle sector colors on track (using proper namespace)
    window.dispatchEvent(new CustomEvent('track:toggleSectorInfo', { 
      detail: { enabled } 
    }));
  };
  
  const handleToggleDRSInfo = (enabled: boolean) => {
    setDrsInfoEnabled(enabled);
    // Dispatch events to toggle DRS animations and markers (using proper namespace)
    window.dispatchEvent(new CustomEvent('track:toggleDRSAnimations', { 
      detail: { enabled } 
    }));
    window.dispatchEvent(new CustomEvent('track:toggleDRSZones', { 
      detail: { enabled } 
    }));
    // Toggle DRS Detection markers and Speed Trap markers
    window.dispatchEvent(new CustomEvent('toggleDRSDetectionMarkers', { 
      detail: { enabled } 
    }));
    window.dispatchEvent(new CustomEvent('toggleSpeedTrapMarkers', { 
      detail: { enabled } 
    }));
  };
  
  const handleToggleElevation = (enabled: boolean) => {
    setElevationEnabled(enabled);
    // Dispatch event to toggle 3D elevation (using proper namespace)
    window.dispatchEvent(new CustomEvent('track:toggleElevation', { 
      detail: { enabled } 
    }));
  };

  // 사용자 인터랙션 감지
  useEffect(() => {
    const handleInteraction = () => {
      setUserInteracting(true);
      onUserInteraction?.();
      
      // 3초 후 인터랙션 상태 해제
      setTimeout(() => {
        setUserInteracting(false);
      }, 3000);
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('mousedown', handleInteraction);
      container.addEventListener('touchstart', handleInteraction, { passive: true });
      container.addEventListener('wheel', handleInteraction, { passive: true });

      return () => {
        container.removeEventListener('mousedown', handleInteraction);
        container.removeEventListener('touchstart', handleInteraction);
        container.removeEventListener('wheel', handleInteraction);
      };
    }
  }, [setUserInteracting, onUserInteraction]);


  // 초기화 시 모든 토글 상태 이벤트 발생 (네임스페이스 적용)
  useEffect(() => {
    // 모든 정보가 기본적으로 켜져 있음을 알림
    window.dispatchEvent(new CustomEvent('track:toggleSectorInfo', { 
      detail: { enabled: true } 
    }));
    window.dispatchEvent(new CustomEvent('track:toggleDRSZones', { 
      detail: { enabled: true } 
    }));
    window.dispatchEvent(new CustomEvent('track:toggleDRSAnimations', { 
      detail: { enabled: true } 
    }));
    window.dispatchEvent(new CustomEvent('toggleDRSDetectionMarkers', { 
      detail: { enabled: true } 
    }));
    window.dispatchEvent(new CustomEvent('toggleSpeedTrapMarkers', { 
      detail: { enabled: true } 
    }));
    window.dispatchEvent(new CustomEvent('track:toggleElevation', { 
      detail: { enabled: true } 
    }));
  }, []);


  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full"
      style={{ background: '#0a0a0a' }}
    >
      {children}
      
      {/* Map Controls */}
      {isMapLoaded && (
        <MapControls
          map={map}
          isCircuitView={isCircuitView}
          sectorInfoEnabled={sectorInfoEnabled}
          drsInfoEnabled={drsInfoEnabled}
          elevationEnabled={elevationEnabled}
          currentCircuit={currentCircuit}
          drsZoneCount={drsZoneCount}
          drsDetectionCount={drsDetectionCount}
          onToggleSectorInfoAction={handleToggleSectorInfo}
          onToggleDRSInfoAction={handleToggleDRSInfo}
          onToggleElevationAction={handleToggleElevation}
          resetPanelStates={resetPanelStates}
          isReplayMode={isReplayMode}
          setIsReplayMode={setIsReplayMode}
          onDriverSelect={onDriverSelect}
          selectedDriverForTelemetry={selectedDriverForTelemetry}
        />
      )}
    </div>
  );
};