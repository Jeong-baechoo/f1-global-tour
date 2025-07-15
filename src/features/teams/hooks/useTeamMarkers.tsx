import { useCallback, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import { Team, TeamMarkerOptions } from '../types';
import { useTeamStore } from '@/src/features/teams';
import { isMobile } from '@/src/shared/utils/viewport';
import { getTeamMarkerConfig } from '../components/markers/teamMarkerConfig';
import { ZOOM_THRESHOLDS, MARKER_DIMENSIONS } from '@/src/shared/constants';
import { getTeamDetails } from '../data/teamDetails';
import { getUKTeamAdjustedPosition } from '../components/markers/UKTeamLayout';
import type { PanelData } from '@/src/features/race-info/types';

export const useTeamMarkers = (map: mapboxgl.Map | null) => {
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const { setTeamMarkers } = useTeamStore();
  
  /**
   * Update markers in store
   */
  const updateStoreMarkers = useCallback(() => {
    // Skip if map is null or markers ref is empty
    if (!map || markersRef.current.size === 0) {
      return;
    }
    
    const teams = useTeamStore.getState().teams;
    const markers = Array.from(markersRef.current.entries()).map(([teamId, marker]) => {
      const team = teams.find(t => t.id === teamId);
      return {
        id: `team-marker-${teamId}`,
        teamId,
        location: team ? team.headquarters : {
          lat: marker.getLngLat().lat,
          lng: marker.getLngLat().lng,
          city: { en: '', ko: '' },
          country: { en: '', ko: '' }
        },
        marker,
      };
    });
    
    setTeamMarkers(markers);
  }, [map, setTeamMarkers]);
  
  /**
   * Remove a team marker
   */
  const removeTeamMarker = useCallback((teamId: string) => {
    const marker = markersRef.current.get(teamId);
    if (marker) {
      // Get element and cleanup zoom handler
      const el = marker.getElement();
      if (el && (el as HTMLElement & { _zoomHandler?: () => void })._zoomHandler && map) {
        map.off('zoom', (el as HTMLElement & { _zoomHandler: () => void })._zoomHandler);
      }
      
      marker.remove();
      markersRef.current.delete(teamId);
    }
  }, [map]);
  
  /**
   * Create a marker for a team
   */
  const createTeamMarker = useCallback((
    team: Team,
    options: TeamMarkerOptions = {},
    onMarkerClick?: (panelData: PanelData) => void
  ): mapboxgl.Marker | null => {
    if (!map) return null;
    
    // Remove existing marker if any
    removeTeamMarker(team.id);
    
    const mobile = isMobile();
    
    // Get adjusted position for UK teams based on zoom level
    const currentZoom = map.getZoom();
    const adjustedPosition = getUKTeamAdjustedPosition(
      team.id,
      team.headquarters.lat,
      team.headquarters.lng,
      currentZoom
    );
    
    // Get team marker config
    const config = getTeamMarkerConfig(team.id);
    if (!config) {
      console.warn(`No marker config found for team: ${team.id}`);
      return null;
    }
    
    // Create marker container (원본과 동일한 구조)
    const el = document.createElement('div');
    el.className = `marker ${config.style.className}`;
    el.style.position = 'absolute';
    el.style.width = mobile ? '60px' : '80px';
    el.style.height = mobile ? '71px' : '95px';
    el.style.cursor = 'pointer';
    
    // Main box (로고 이미지 사용)
    const box = document.createElement('div');
    box.style.width = mobile ? '60px' : '80px';
    box.style.height = mobile ? '60px' : '80px';
    box.style.borderRadius = '12px';
    box.style.backgroundImage = `url(${config.style.logoUrl})`;
    box.style.backgroundColor = config.style.backgroundColor;
    box.style.backgroundSize = config.style.backgroundSize || 'contain';
    box.style.backgroundPosition = config.style.backgroundPosition || 'center';
    box.style.backgroundRepeat = 'no-repeat';
    box.style.border = `2px solid ${config.style.borderColor}`;
    box.style.boxShadow = `0 2px 10px ${config.style.shadowColor}`;
    box.style.transition = 'all 0.3s ease';
    
    el.appendChild(box);
    
    // Hover effects (원본과 동일)
    el.addEventListener('mouseenter', () => {
      box.style.transform = 'scale(1.1) translateZ(0)';
      box.style.boxShadow = `0 4px 20px ${config.style.shadowColorHover}`;
    });
    
    el.addEventListener('mouseleave', () => {
      box.style.transform = 'scale(1) translateZ(0)';
      box.style.boxShadow = `0 2px 10px ${config.style.shadowColor}`;
    });
    
    // Click handler
    if (onMarkerClick) {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        console.log('Team marker clicked:', team.id);
        
        // 팀 상세 정보 가져오기
        const teamDetails = getTeamDetails(team.id);
        
        // PanelData 형식으로 변환
        const panelData = {
          type: 'team' as const,
          id: team.id,
          name: team.name,
          principal: team.teamPrincipal,
          headquarters: team.headquarters,
          location: team.headquarters,
          colors: team.colors,
          color: team.colors.primary,
          drivers2025: teamDetails?.drivers2025 || [],
          car2025: teamDetails?.car2025,
          championships2025: team.championships2025
        };
        
        console.log('Panel data created:', panelData);
        onMarkerClick(panelData);
      });
    }
    
    // Create Mapbox marker with adjusted position
    const marker = new mapboxgl.Marker(el, {
      anchor: 'center',
      offset: options.offset,
    })
      .setLngLat([adjustedPosition.lng, adjustedPosition.lat])
      .addTo(map);
    
    // Store marker reference
    markersRef.current.set(team.id, marker);
    
    // Setup zoom handler for simple/detailed display and UK team position updates
    const zoomHandler = () => {
      const zoom = map.getZoom();
      
      // Update UK team position based on zoom
      const newPosition = getUKTeamAdjustedPosition(
        team.id,
        team.headquarters.lat,
        team.headquarters.lng,
        zoom
      );
      marker.setLngLat([newPosition.lng, newPosition.lat]);
      
      if (zoom <= ZOOM_THRESHOLDS.TEAM_MARKER_SIMPLE) {
        // 줌 5 이하: 점으로 표시
        box.style.width = MARKER_DIMENSIONS.TEAM_MARKER.simpleSize;
        box.style.height = MARKER_DIMENSIONS.TEAM_MARKER.simpleSize;
        box.style.borderRadius = MARKER_DIMENSIONS.TEAM_MARKER.simpleBorderRadius;
        box.style.backgroundImage = 'none';
        box.style.backgroundColor = config.style.backgroundColor;
        box.style.border = `${MARKER_DIMENSIONS.TEAM_MARKER.simpleBorderWidth} solid ${config.style.borderColor}`;
        
        // 컨테이너 크기도 조정
        el.style.width = MARKER_DIMENSIONS.TEAM_MARKER.simpleSize;
        el.style.height = MARKER_DIMENSIONS.TEAM_MARKER.simpleSize;
      } else {
        // 줌 5 초과: 원래 로고 표시
        const mobile = isMobile();
        el.style.width = mobile ? '60px' : '80px';
        el.style.height = mobile ? '71px' : '95px';
        
        box.style.width = mobile ? '60px' : '80px';
        box.style.height = mobile ? '60px' : '80px';
        box.style.borderRadius = '12px';
        box.style.backgroundImage = `url(${config.style.logoUrl})`;
        box.style.backgroundColor = config.style.backgroundColor;
        box.style.border = `2px solid ${config.style.borderColor}`;
      }
    };
    
    // 초기 설정
    zoomHandler();
    
    // 줌 이벤트 리스너 등록
    map.on('zoom', zoomHandler);
    
    // Store zoom handler for cleanup
    (el as HTMLDivElement & { _zoomHandler: () => void })._zoomHandler = zoomHandler;
    
    return marker;
  }, [map, removeTeamMarker]);
  
  /**
   * Create markers for multiple teams
   */
  const createTeamMarkers = useCallback((
    teams: Team[],
    options: TeamMarkerOptions = {},
    onMarkerClick?: (panelData: PanelData) => void
  ) => {
    teams.forEach(team => {
      createTeamMarker(team, options, onMarkerClick);
    });
    
    // Update store after all markers are created (with delay to ensure markers are added to ref)
    setTimeout(() => {
      updateStoreMarkers();
    }, 0);
  }, [createTeamMarker, updateStoreMarkers]);
  
  /**
   * Remove all team markers
   */
  const removeAllTeamMarkers = useCallback(() => {
    markersRef.current.forEach((marker) => {
      // Get element and cleanup zoom handler
      const el = marker.getElement();
      if (el && (el as HTMLElement & { _zoomHandler?: () => void })._zoomHandler && map) {
        map.off('zoom', (el as HTMLElement & { _zoomHandler: () => void })._zoomHandler);
      }
      marker.remove();
    });
    markersRef.current.clear();
    updateStoreMarkers();
  }, [map, updateStoreMarkers]);
  
  /**
   * Update a team marker
   */
  const updateTeamMarker = useCallback((
    teamId: string,
    isSelected: boolean
  ) => {
    const marker = markersRef.current.get(teamId);
    if (!marker) return;
    
    // Get the marker element
    const element = marker.getElement();
    if (!element) return;
    
    // Update data attributes for CSS styling if needed
    element.setAttribute('data-selected', String(isSelected));
    
    // Update box scale for selection
    const box = element.querySelector('div') as HTMLDivElement;
    if (box && isSelected) {
      box.style.transform = 'scale(1.1) translateZ(0)';
      const config = getTeamMarkerConfig(teamId);
      if (config) {
        box.style.boxShadow = `0 6px 30px ${config.style.shadowColorHover}`;
      }
    } else if (box) {
      box.style.transform = 'scale(1) translateZ(0)';
      const config = getTeamMarkerConfig(teamId);
      if (config) {
        box.style.boxShadow = `0 2px 10px ${config.style.shadowColor}`;
      }
    }
  }, []);
  
  /**
   * Fly to a team's location
   */
  const flyToTeam = useCallback((teamId: string) => {
    if (!map) return;
    
    const teams = useTeamStore.getState().teams;
    const team = teams.find(t => t.id === teamId);
    if (!team) return;
    
    // Get adjusted position for UK teams
    const targetZoom = 16;
    const adjustedPosition = getUKTeamAdjustedPosition(
      team.id,
      team.headquarters.lat,
      team.headquarters.lng,
      targetZoom
    );
    
    map.flyTo({
      center: [adjustedPosition.lng, adjustedPosition.lat],
      zoom: targetZoom,
      pitch: 45,
      bearing: 0,
      speed: 0.8,
      curve: 1.2,
      essential: true,
    });
  }, [map]);
  
  return {
    createTeamMarker,
    createTeamMarkers,
    removeTeamMarker,
    removeAllTeamMarkers,
    updateTeamMarker,
    flyToTeam,
    markers: markersRef.current,
  };
};