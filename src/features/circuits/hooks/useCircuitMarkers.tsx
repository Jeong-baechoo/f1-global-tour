import { useCallback, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import { Circuit, CircuitMarkerOptions } from '../types';
import { useCircuitStore } from '@/src/features/circuits';
import { getText, type Language } from '@/utils/i18n';
import { isMobile } from '@/src/shared/utils/viewport';
import { ZOOM_THRESHOLDS, ZoomLevel } from '@/src/shared/constants';

export const useCircuitMarkers = (map: mapboxgl.Map | null) => {
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const { setCircuitMarkers } = useCircuitStore();
  
  /**
   * Update markers in store
   */
  const updateStoreMarkers = useCallback(() => {
    const circuits = useCircuitStore.getState().circuits;
    const markers = Array.from(markersRef.current.entries()).map(([circuitId, marker]) => {
      const circuit = circuits.find(c => c.id === circuitId);
      return {
        id: `circuit-marker-${circuitId}`,
        circuitId,
        location: circuit ? circuit.location : {
          lat: marker.getLngLat().lat,
          lng: marker.getLngLat().lng,
          city: { en: '', ko: '' },
          country: { en: '', ko: '' }
        },
        marker,
      };
    });
    
    setCircuitMarkers(markers);
  }, [setCircuitMarkers]);
  
  /**
   * Remove a circuit marker
   */
  const removeCircuitMarker = useCallback((circuitId: string) => {
    const marker = markersRef.current.get(circuitId);
    if (marker) {
      // Get element and cleanup event handlers
      const el = marker.getElement();
      if (el && map) {
        const zoomHandler = (el as unknown as { _zoomHandler?: () => void })._zoomHandler;
        const renderHandler = (el as unknown as { _renderHandler?: () => void })._renderHandler;
        
        if (zoomHandler) {
          map.off('zoom', zoomHandler);
        }
        if (renderHandler) {
          map.off('render', renderHandler);
        }
      }
      
      marker.remove();
      markersRef.current.delete(circuitId);
      updateStoreMarkers();
    }
  }, [map, updateStoreMarkers]);
  
  /**
   * Create a marker for a circuit
   */
  const createCircuitMarker = useCallback((
    circuit: Circuit,
    options: CircuitMarkerOptions = {},
    onMarkerClick?: (circuit: Circuit) => void,
    isNextRace?: boolean,
    language: Language = 'en'
  ): mapboxgl.Marker | null => {
    if (!map) return null;
    
    // Remove existing marker if any
    removeCircuitMarker(circuit.id);
    
    const mobile = isMobile();
    
    // Create marker DOM element (원본 스타일 구조)
    const el = document.createElement('div');
    el.className = 'circuit-marker';
    el.setAttribute('data-next-race', String(isNextRace));
    
    // Dot container
    const dotContainer = document.createElement('div');
    dotContainer.className = 'circuit-marker__dot-container';
    
    const dot = document.createElement('div');
    dot.className = 'circuit-marker__dot';
    dotContainer.appendChild(dot);
    
    // Pulse animation for next race
    if (isNextRace) {
      const pulse = document.createElement('div');
      pulse.className = 'circuit-marker__pulse';
      dotContainer.appendChild(pulse);
    }
    
    // Connection line
    const line = document.createElement('div');
    line.className = `circuit-marker__line ${mobile ? 'circuit-marker__line--mobile' : 'circuit-marker__line--desktop'}`;
    dotContainer.appendChild(line);
    
    // Label
    const label = document.createElement('div');
    label.className = `circuit-marker__label ${mobile ? 'circuit-marker__label--mobile' : 'circuit-marker__label--desktop'}`;
    label.setAttribute('data-next-race', String(isNextRace));
    
    // City name
    const cityName = document.createElement('div');
    cityName.className = `circuit-marker__city ${mobile ? 'circuit-marker__city--mobile' : 'circuit-marker__city--desktop'}`;
    cityName.textContent = getText(circuit.location.city, language);
    label.appendChild(cityName);
    
    // Country name
    const countryName = document.createElement('div');
    countryName.className = `circuit-marker__country ${mobile ? 'circuit-marker__country--mobile' : 'circuit-marker__country--desktop'}`;
    countryName.textContent = getText(circuit.location.country, language).toUpperCase();
    label.appendChild(countryName);
    
    // Next race label
    if (isNextRace) {
      const nextRaceLabel = document.createElement('div');
      nextRaceLabel.style.position = 'absolute';
      nextRaceLabel.style.top = '-20px';
      nextRaceLabel.style.left = '50%';
      nextRaceLabel.style.transform = 'translateX(-50%)';
      nextRaceLabel.style.backgroundColor = '#FF1801';
      nextRaceLabel.style.color = '#FFFFFF';
      nextRaceLabel.style.fontSize = mobile ? '9px' : '10px';
      nextRaceLabel.style.fontWeight = '700';
      nextRaceLabel.style.padding = '2px 6px';
      nextRaceLabel.style.borderRadius = '2px';
      nextRaceLabel.style.whiteSpace = 'nowrap';
      nextRaceLabel.textContent = 'NEXT RACE';
      label.appendChild(nextRaceLabel);
    }
    
    // Assemble elements
    el.appendChild(dotContainer);
    el.appendChild(label);
    
    // Add hover effects
    el.addEventListener('mouseenter', () => {
      el.setAttribute('data-hover', 'true');
    });
    
    el.addEventListener('mouseleave', () => {
      el.setAttribute('data-hover', 'false');
    });
    
    // Click handler
    if (onMarkerClick) {
      el.style.cursor = 'pointer';
      el.addEventListener('click', () => {
        onMarkerClick(circuit);
      });
    }
    
    // Create Mapbox marker with anchor 'left' like original
    const marker = new mapboxgl.Marker(el, {
      anchor: 'left',
      offset: options.offset,
    })
      .setLngLat([circuit.location.lng, circuit.location.lat])
      .addTo(map);
    
    // Store marker reference
    markersRef.current.set(circuit.id, marker);
    
    // Setup zoom visibility handler
    const updateVisibility = () => {
      const zoom = map.getZoom();
      const isMobileDevice = isMobile();
      
      // Get appropriate thresholds based on device type
      const fadeStart = isMobileDevice ? ZOOM_THRESHOLDS.FADE_START_MOBILE : ZOOM_THRESHOLDS.FADE_START_DESKTOP;
      const fadeMid = isMobileDevice ? ZOOM_THRESHOLDS.FADE_MID_MOBILE : ZOOM_THRESHOLDS.FADE_MID_DESKTOP;
      const hide = isMobileDevice ? ZOOM_THRESHOLDS.HIDE_MOBILE : ZOOM_THRESHOLDS.HIDE_DESKTOP;
      
      if (zoom <= ZOOM_THRESHOLDS.GLOBE_TO_2D) {
        // 줌 5.5 이하: 도트만 표시 (3D globe에서)
        el.setAttribute('data-zoom-level', ZoomLevel.LOW);
      } else if (zoom > ZOOM_THRESHOLDS.GLOBE_TO_2D && zoom < fadeStart) {
        // 5.5 초과 ~ 페이드 시작 미만: 정상 표시 (모바일: 9, 데스크톱: 11.5)
        el.setAttribute('data-zoom-level', ZoomLevel.NORMAL);
      } else if (zoom >= fadeStart && zoom < fadeMid) {
        // 첫 번째 페이드 단계 (모바일: 9-10, 데스크톱: 11.5-12)
        el.setAttribute('data-zoom-level', ZoomLevel.FADE_1);
      } else if (zoom >= fadeMid && zoom < hide) {
        // 두 번째 페이드 단계 (모바일: 10-11, 데스크톱: 12-13.5)
        el.setAttribute('data-zoom-level', ZoomLevel.FADE_2);
      } else {
        // 완전히 숨김 (모바일: 11 이상, 데스크톱: 13.5 이상)
        el.setAttribute('data-zoom-level', ZoomLevel.HIDDEN);
      }
    };
    
    // Globe occlusion handler
    const checkGlobeOcclusion = () => {
      const center = map.getCenter();
      const zoom = map.getZoom();
      const pitch = map.getPitch();
      
      // Globe view에서만 작동 (줌 레벨 5.5 이하)
      if (zoom > ZOOM_THRESHOLDS.GLOBE_TO_2D) {
        el.style.visibility = 'visible';
        el.removeAttribute('data-occluded');
        return;
      }
      
      // 마커와 지도 중심 사이의 경도 차이 계산
      let lngDiff = circuit.location.lng - center.lng;
      
      // 경도 차이를 -180 ~ 180 범위로 정규화
      while (lngDiff > 180) lngDiff -= 360;
      while (lngDiff < -180) lngDiff += 360;
      
      // 위도 차이도 고려
      const latDiff = circuit.location.lat - center.lat;
      
      // 피치가 있을 때는 위도 차이도 고려하여 occlusion 계산
      let occlusionThreshold = 90; // BASE_THRESHOLD
      
      // 피치가 있으면 위쪽/아래쪽 마커의 가시성 조정
      if (pitch > 0) {
        if (latDiff > 0) {
          occlusionThreshold = 90 + (pitch * 0.3); // PITCH_FACTOR
        } else {
          occlusionThreshold = 90 - (pitch * 0.3);
        }
      }
      
      // 경도 차이가 임계값 이상이면 마커는 globe 뒤쪽에 있음
      const isOccluded = Math.abs(lngDiff) > occlusionThreshold;
      
      // 가시성 설정
      el.style.visibility = isOccluded ? 'hidden' : 'visible';
      el.setAttribute('data-occluded', isOccluded.toString());
    };
    
    // 초기 설정
    el.setAttribute('data-zoom-level', ZoomLevel.NORMAL);
    updateVisibility();
    
    // 줌 이벤트 리스너 with RAF for performance
    let rafId: number | null = null;
    const zoomHandler = () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
      rafId = requestAnimationFrame(() => {
        updateVisibility();
        rafId = null;
      });
    };
    
    // Render 이벤트 리스너 for globe occlusion (throttled)
    let renderRafId: number | null = null;
    const renderHandler = () => {
      if (map.getZoom() > ZOOM_THRESHOLDS.GLOBE_TO_2D) return;
      
      if (renderRafId === null) {
        renderRafId = requestAnimationFrame(() => {
          checkGlobeOcclusion();
          // Throttle to every 3rd frame
          setTimeout(() => {
            renderRafId = null;
          }, 50); // ~3 frames at 60fps
        });
      }
    };
    
    // 이벤트 리스너 등록
    map.on('zoom', zoomHandler);
    map.on('render', renderHandler);
    
    // Store handlers for cleanup
    (el as unknown as { _zoomHandler?: () => void; _renderHandler?: () => void })._zoomHandler = zoomHandler;
    (el as unknown as { _zoomHandler?: () => void; _renderHandler?: () => void })._renderHandler = renderHandler;
    
    // Update store
    updateStoreMarkers();
    
    return marker;
  }, [map, updateStoreMarkers, removeCircuitMarker]);
  
  /**
   * Create markers for multiple circuits
   */
  const createCircuitMarkers = useCallback(async (
    circuits: Circuit[],
    options: CircuitMarkerOptions = {},
    onMarkerClick?: (circuit: Circuit) => void,
    language: Language = 'en'
  ) => {
    // Find next race circuit
    const today = new Date();
    const nextRaceCircuit = circuits
      .filter(c => c.raceDate2025)
      .find(c => new Date(c.raceDate2025!) > today) || circuits[0];
    
    circuits.forEach(circuit => {
      const isNextRace = circuit.id === nextRaceCircuit?.id;
      createCircuitMarker(circuit, options, onMarkerClick, isNextRace, language);
    });
  }, [createCircuitMarker]);
  
  /**
   * Remove all circuit markers
   */
  const removeAllCircuitMarkers = useCallback(() => {
    markersRef.current.forEach((marker) => {
      // Get element and cleanup event handlers
      const el = marker.getElement();
      if (el && map) {
        const zoomHandler = (el as unknown as { _zoomHandler?: () => void })._zoomHandler;
        const renderHandler = (el as unknown as { _renderHandler?: () => void })._renderHandler;
        
        if (zoomHandler) {
          map.off('zoom', zoomHandler);
        }
        if (renderHandler) {
          map.off('render', renderHandler);
        }
      }
      
      marker.remove();
    });
    markersRef.current.clear();
    updateStoreMarkers();
  }, [map, updateStoreMarkers]);
  
  /**
   * Update a circuit marker
   */
  const updateCircuitMarker = useCallback((
    circuitId: string,
    isSelected: boolean
  ) => {
    const marker = markersRef.current.get(circuitId);
    if (!marker) return;
    
    // Get the marker element
    const element = marker.getElement();
    if (!element) return;
    
    // Update data attributes for CSS styling
    element.setAttribute('data-selected', String(isSelected));
  }, []);
  
  return {
    createCircuitMarker,
    createCircuitMarkers,
    removeCircuitMarker,
    removeAllCircuitMarkers,
    updateCircuitMarker,
    markers: markersRef.current,
  };
};