'use client';

import React, { forwardRef, useImperativeHandle, useEffect } from 'react';
import { MapContainer } from './MapContainer';
import { MapCanvas } from './MapCanvas';
import { MapAPI } from '@/components/mapbox/types';
import { useMapStore } from '../store';
import { useMapAnimation } from '../hooks/useMapAnimation';
import { useMapInteraction } from '../hooks/useMapInteraction';
import { useTeamMarkers } from '@/src/features/teams/hooks/useTeamMarkers';
import { useTeams } from '@/src/features/teams/hooks/useTeams';
import { useCircuitMarkers } from '@/src/features/circuits/hooks/useCircuitMarkers';
import { useCircuits } from '@/src/features/circuits/hooks/useCircuits';
import { MarkerService } from '../services/MarkerService';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Circuit } from '@/src/features/circuits/types';
import type { PanelData } from '@/types/panel';

interface MapProps {
  onMarkerClick?: (item: PanelData) => void;
  onCinematicModeChange?: (enabled: boolean) => void;
  onUserInteraction?: () => void;
  // Circuit 관련 props
  isCircuitView?: boolean;
  currentCircuit?: Circuit | null;
  drsZoneCount?: number;
  drsDetectionCount?: number;
  onCircuitSelect?: (circuit: Circuit) => void;
  setIsCircuitView?: (isCircuitView: boolean) => void;
  setCurrentCircuit?: (circuit: Circuit | null) => void;
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
  
  // Get language from context
  const { language } = useLanguage();
  
  
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
    getCurrentCenter,
    toggleCinematicMode 
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
    console.log('Team markers effect:', { map: !!map, isMapLoaded, teamsLength: teams.length });
    if (!map || !isMapLoaded) {
      console.log('Skipping team markers creation - conditions not met');
      return;
    }
    
    // MarkerService 인스턴스 생성
    if (!markerServiceRef.current) {
      markerServiceRef.current = new MarkerService();
      markerServiceRef.current.setMap(map);
    }
    
    // 팀 마커 생성
    if (teams.length > 0) {
      console.log('Creating team markers for', teams.length, 'teams');
      createTeamMarkers(teams, {}, (panelData) => {
        console.log('Map received panel data:', panelData);
        props.onMarkerClick?.(panelData);
      }, language);
    }
  }, [map, isMapLoaded, teams, createTeamMarkers, props.onMarkerClick, language]);
  
  // Map 로드 시 서킷 마커 생성
  useEffect(() => {
    console.log('Circuit markers effect:', { map: !!map, isMapLoaded, circuitsLength: circuits.length });
    if (!map || !isMapLoaded) {
      console.log('Skipping circuit markers creation - conditions not met');
      return;
    }
    
    // 서킷 마커 생성
    if (circuits.length > 0) {
      console.log('Creating circuit markers for', circuits.length, 'circuits');
      createCircuitMarkers(circuits, {}, (circuit) => {
        props.onMarkerClick?.({
          type: 'circuit',
          id: circuit.id,
          name: circuit.name,
          location: circuit.location,
          grandPrix: circuit.grandPrix,
          length: circuit.length,
          corners: circuit.corners,
          laps: circuit.laps,
          totalDistance: circuit.totalDistance,
          lapRecord: circuit.lapRecord
        });
      }, language);
    }
  }, [map, isMapLoaded, circuits, createCircuitMarkers, props.onMarkerClick, language]);

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
      return map ? getCurrentCenter() : null;
    },
    resetView: () => {
      if (map) {
        resetView();
      }
    },
    toggleCinematicMode: () => {
      if (map) {
        return toggleCinematicMode();
      }
      return false;
    }
  }), [map, flyToLocation, flyToCircuit, flyToTeam, getCurrentBounds, getCurrentZoom, getCurrentCenter, resetView, toggleCinematicMode]);

  return (
    <MapContainer
      onMarkerClick={props.onMarkerClick}
      onCinematicModeChange={props.onCinematicModeChange}
      onUserInteraction={props.onUserInteraction}
      isCircuitView={props.isCircuitView}
      currentCircuit={props.currentCircuit}
      drsZoneCount={props.drsZoneCount}
      drsDetectionCount={props.drsDetectionCount}
    >
      <MapCanvas 
        onLoad={(_mapInstance) => {
          console.log('Map loaded with MapCanvas');
        }}
        onGlobeSpinnerReady={(spinner) => {
          globeSpinnerRef.current = spinner;
        }}
      />
    </MapContainer>
  );
}));

Map.displayName = 'Map';

export default Map;