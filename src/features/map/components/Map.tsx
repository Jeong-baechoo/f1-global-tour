'use client';

import React, { forwardRef, useImperativeHandle, useEffect, useCallback } from 'react';
import { MapContainer } from './MapContainer';
import { MapCanvas } from './MapCanvas';
import { MapAPI } from '@/src/shared/types';
import { useMapStore } from '../store';
import { useMapAnimation } from '../hooks/useMapAnimation';
import { useMapInteraction } from '@/src/features/map/hooks';
import { useTeamMarkers } from '@/src/features/teams/hooks/useTeamMarkers';
import { useTeams } from '@/src/features/teams/hooks/useTeams';
import { useCircuitMarkers } from '@/src/features/circuits/hooks/useCircuitMarkers';
import { useCircuits } from '@/src/features/circuits/hooks/useCircuits';
import { MarkerService } from '../services/MarkerService';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Circuit } from '@/src/features/circuits/types';
import type { PanelData } from '@/src/features/race-info/types';

interface MapProps {
  onMarkerClick?: (item: PanelData) => void;
  onUserInteraction?: () => void;
  // Circuit 관련 props
  isCircuitView?: boolean;
  currentCircuit?: Circuit | null;
  drsZoneCount?: number;
  drsDetectionCount?: number;
  onCircuitSelect?: (circuit: unknown) => void;
  setIsCircuitView?: (isCircuitView: boolean) => void;
  setCurrentCircuit?: (circuit: unknown) => void;
  setDrsZoneCount?: (count: number) => void;
  setDrsDetectionCount?: (count: number) => void;
  resetPanelStates?: () => void;
  setIsTrackAnimating?: (isAnimating: boolean) => void;
}

/**
 * Map 컴포넌트 - Feature-based 아키텍처로 리팩토링됨
 */
const Map = React.memo(forwardRef<MapAPI, MapProps>((props, ref) => {
  const { map, isMapLoaded } = useMapStore();
  const markerServiceRef = React.useRef<MarkerService | null>(null);
  const globeSpinnerRef = React.useRef<unknown>(null);

  // Destructure props to avoid exhaustive deps warnings
  const { onMarkerClick } = props;

  // Get language from context
  const { language } = useLanguage();

  // Memoized callbacks to prevent useEffect re-runs
  const handleMapLoad = useCallback(() => {
    // Map loaded
  }, []);

  const handleGlobeSpinnerReady = useCallback((spinner: unknown) => {
    globeSpinnerRef.current = spinner;
  }, []);

  // 새로운 훅들 사용
  const { flyToLocation, flyToCircuit, flyToTeam, resetView } = useMapAnimation({
    map: { current: map },
    globeSpinner: globeSpinnerRef,
    onCircuitSelect: props.onCircuitSelect,
    setIsCircuitView: props.setIsCircuitView,
    setCurrentCircuit: props.setCurrentCircuit,
    setDrsZoneCount: props.setDrsZoneCount,
    setDrsDetectionCount: props.setDrsDetectionCount,
    resetPanelStates: props.resetPanelStates,
    setIsTrackAnimating: props.setIsTrackAnimating
  });

  const {
    getCurrentBounds,
    getCurrentZoom,
    getCurrentCenter
  } = useMapInteraction({
    map: { current: map }
  });

  // Teams 모듈 훅
  const { teams } = useTeams();
  const { createTeamMarkers } = useTeamMarkers(map);

  // Circuits 모듈 훅
  const { circuits } = useCircuits();
  const { createCircuitMarkers } = useCircuitMarkers(map);

  // Map 로드 시 팀 마커 생성
  useEffect(() => {
    if (!map || !isMapLoaded) {
      return;
    }

    // MarkerService 인스턴스 생성
    if (!markerServiceRef.current) {
      markerServiceRef.current = new MarkerService();
      markerServiceRef.current.setMap(map);
    }

    // 팀 마커 생성
    if (teams.length > 0) {
      createTeamMarkers(teams, {}, (panelData) => {
        onMarkerClick?.(panelData);
      });
    }
  }, [map, isMapLoaded, teams, createTeamMarkers, onMarkerClick]);

  // Map 로드 시 서킷 마커 생성
  useEffect(() => {
    if (!map || !isMapLoaded) {
      return;
    }

    // 서킷 마커 생성
    if (circuits.length > 0) {
      createCircuitMarkers(circuits, {}, (circuit) => {
        onMarkerClick?.({
          type: 'circuit',
          id: circuit.id,
          name: circuit.name,
          location: circuit.location,
          grandPrix: circuit.grandPrix,
          length: circuit.length,
          corners: circuit.corners,
          laps: circuit.laps,
          totalDistance: circuit.totalDistance,
          lapRecord: circuit.lapRecord ? {
            time: circuit.lapRecord.time,
            driver: circuit.lapRecord.driver,
            year: circuit.lapRecord.year.toString()
          } : undefined
        });
      }, language);
    }
  }, [map, isMapLoaded, circuits, createCircuitMarkers, onMarkerClick, language]);

  // 기존 Map API를 새로운 훅으로 연결
  useImperativeHandle(ref, () => ({
    flyToLocation: (coordinates: [number, number], zoom?: number) => {
      if (map) {
        flyToLocation(coordinates, zoom);
      }
    },
    flyToCircuit: (circuitId: string, gentle?: boolean) => {
      if (map) {
        flyToCircuit(circuitId, gentle);
      }
    },
    flyToTeam: (teamId: string) => {
      if (map) {
        flyToTeam(teamId);
      }
    },
    getCurrentBounds: () => {
      return map ? getCurrentBounds() : null;
    },
    getCurrentZoom: () => {
      return map ? getCurrentZoom() : 0;
    },
    getCurrentCenter: () => {
      if (map) {
        const center = getCurrentCenter();
        return center ? [center[0], center[1]] : null;
      }
      return null;
    },
    resetView: () => {
      if (map) {
        resetView();
      }
    },
    getMapboxMap: () => {
      return map || null;
    },
  }), [map, flyToLocation, flyToCircuit, flyToTeam, getCurrentBounds, getCurrentZoom, getCurrentCenter, resetView]);

  return (
    <MapContainer
      onMarkerClick={props.onMarkerClick}
      onUserInteraction={props.onUserInteraction}
      isCircuitView={props.isCircuitView}
      currentCircuit={props.currentCircuit}
      drsZoneCount={props.drsZoneCount}
      drsDetectionCount={props.drsDetectionCount}
    >
      <MapCanvas
        onLoad={handleMapLoad}
        onGlobeSpinnerReady={handleGlobeSpinnerReady}
      />
    </MapContainer>
  );
}));

Map.displayName = 'Map';

export default Map;
