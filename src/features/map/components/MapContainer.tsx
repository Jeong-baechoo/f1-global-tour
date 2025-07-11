'use client';

import React, { useRef, useEffect, useState } from 'react';
import { useMapStore } from '../store';
import { MapControls } from './MapControls';
import type { PanelData } from '@/src/features/race-info/types';
import type { Circuit } from '@/src/features/circuits/types';

interface MapContainerProps {
  children?: React.ReactNode;
  onMarkerClick?: (item: PanelData) => void;
  onCinematicModeChange?: (enabled: boolean) => void;
  onUserInteraction?: () => void;
  // Circuit 관련 props
  isCircuitView?: boolean;
  currentCircuit?: Circuit | null;
  drsZoneCount?: number;
  drsDetectionCount?: number;
}

/**
 * MapContainer - 기존 Map.tsx를 감싸는 래퍼 컴포넌트
 * 점진적 마이그레이션을 위해 기존 Map 컴포넌트를 재사용
 */
export const MapContainer: React.FC<MapContainerProps> = ({
  children,
  onCinematicModeChange,
  onUserInteraction,
  isCircuitView = false,
  currentCircuit = null,
  drsZoneCount = 0,
  drsDetectionCount = 0,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { setUserInteracting, isCinematicMode, setIsCinematicMode, map, isMapLoaded } = useMapStore();
  
  // Circuit Info Panel states
  const [sectorInfoEnabled, setSectorInfoEnabled] = useState(false);
  const [drsInfoEnabled, setDrsInfoEnabled] = useState(true);  // DRS 정보 기본적으로 켜짐
  const [elevationEnabled, setElevationEnabled] = useState(false);
  
  // Track event dispatchers
  const handleToggleSectorInfo = (enabled: boolean) => {
    setSectorInfoEnabled(enabled);
    // Dispatch event to toggle sector colors on track
    window.dispatchEvent(new CustomEvent('toggleSectorInfo', { 
      detail: { enabled } 
    }));
  };
  
  const handleToggleDRSInfo = (enabled: boolean) => {
    setDrsInfoEnabled(enabled);
    // Dispatch events to toggle DRS animations and markers
    window.dispatchEvent(new CustomEvent('toggleDRSAnimations', { 
      detail: { enabled } 
    }));
    window.dispatchEvent(new CustomEvent('toggleDRSZones', { 
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
    // Dispatch event to toggle 3D elevation
    window.dispatchEvent(new CustomEvent('toggleElevation', { 
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
      container.addEventListener('touchstart', handleInteraction);
      container.addEventListener('wheel', handleInteraction);

      return () => {
        container.removeEventListener('mousedown', handleInteraction);
        container.removeEventListener('touchstart', handleInteraction);
        container.removeEventListener('wheel', handleInteraction);
      };
    }
  }, [setUserInteracting, onUserInteraction]);

  // 시네마틱 모드 변경 알림
  useEffect(() => {
    onCinematicModeChange?.(isCinematicMode);
  }, [isCinematicMode, onCinematicModeChange]);

  // 초기화 시 DRS 토글 상태 이벤트 발생
  useEffect(() => {
    // DRS 정보가 기본적으로 켜져 있음을 알림
    window.dispatchEvent(new CustomEvent('toggleDRSZones', { 
      detail: { enabled: true } 
    }));
    window.dispatchEvent(new CustomEvent('toggleDRSAnimations', { 
      detail: { enabled: true } 
    }));
  }, []);

  // Debug log
  useEffect(() => {
    console.log('🔍 MapContainer Debug:', {
      isMapLoaded,
      isCircuitView,
      currentCircuit: currentCircuit?.name
    });
  }, [isMapLoaded, isCircuitView, currentCircuit]);

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
          onCinematicModeToggle={() => {
            const newMode = !isCinematicMode;
            setIsCinematicMode(newMode);
            onCinematicModeChange?.(newMode);
          }}
          sectorInfoEnabled={sectorInfoEnabled}
          drsInfoEnabled={drsInfoEnabled}
          elevationEnabled={elevationEnabled}
          currentCircuit={currentCircuit}
          drsZoneCount={drsZoneCount}
          drsDetectionCount={drsDetectionCount}
          onToggleSectorInfo={handleToggleSectorInfo}
          onToggleDRSInfo={handleToggleDRSInfo}
          onToggleElevation={handleToggleElevation}
        />
      )}
    </div>
  );
};