import mapboxgl from 'mapbox-gl';
import { Circuit } from '@/types/f1';
import { MarkerData } from '../types';
import { getText, type Language } from '@/utils/i18n';
import { 
  ZOOM_THRESHOLDS, 
  OCCLUSION_SETTINGS, 
  ANIMATION_TIMINGS,
  ZoomLevel,
  MarkerOcclusionState 
} from './constants';

interface CircuitMarkerData {
  element: HTMLElement;
  circuit: Circuit;
  marker: mapboxgl.Marker;
  labelContainer: HTMLElement;
  line: HTMLElement;
  dot: HTMLElement;
  isNextRace: boolean;
  cityLabel: HTMLElement;
  countryLabel: HTMLElement;
}

export class CircuitMarkerManager {
  private map: mapboxgl.Map | null = null;
  private markers = new Map<string, CircuitMarkerData>();
  private onMarkerClick?: (item: MarkerData) => void;
  private hoverTimeouts = new Map<string, NodeJS.Timeout>();
  private language: Language = 'en';
  
  // Event handlers stored for cleanup
  private zoomHandler?: () => void;
  private renderHandler?: () => void;
  private eventHandlersAttached = false;
  private mapContainer?: HTMLElement;

  constructor() {
    // 이벤트 위임을 위한 단일 리스너 설정
    this.setupEventDelegation();
  }

  setMap(map: mapboxgl.Map) {
    this.map = map;
    this.mapContainer = map.getContainer();
    this.setupZoomListener();
    this.attachEventHandlers();
  }

  setOnMarkerClick(handler: (item: MarkerData) => void) {
    this.onMarkerClick = handler;
  }
  
  setLanguage(language: Language) {
    this.language = language;
    // Update existing markers' labels
    this.markers.forEach((data) => {
      this.updateMarkerLanguage(data);
    });
  }
  
  private updateMarkerLanguage(data: CircuitMarkerData) {
    const { circuit, cityLabel, countryLabel, element } = data;
    
    // Update text content
    cityLabel.textContent = getText(circuit.location.city, this.language);
    countryLabel.textContent = getText(circuit.location.country, this.language).toUpperCase();
    
    // Update aria-label
    const cityText = getText(circuit.location.city, this.language);
    const countryText = getText(circuit.location.country, this.language);
    const nameText = getText(circuit.name, this.language);
    element.setAttribute('aria-label', `${cityText}, ${countryText} - ${nameText}`);
  }

  private setupEventDelegation() {
    // 이벤트 위임 설정은 map이 설정된 후로 연기
    this.eventHandlersAttached = false;
  }
  
  private attachEventHandlers() {
    if (this.eventHandlersAttached || !this.mapContainer) return;
    
    // Map container에 이벤트 위임
    this.mapContainer.addEventListener('mouseenter', this.handleMouseEnter, true);
    this.mapContainer.addEventListener('mouseleave', this.handleMouseLeave, true);
    this.mapContainer.addEventListener('click', this.handleClick, true);
    this.mapContainer.addEventListener('keydown', this.handleKeyDown, true);
    this.eventHandlersAttached = true;
  }

  private setupZoomListener() {
    if (!this.map) return;

    let rafId: number | null = null;

    // 단일 zoom 리스너로 모든 마커 관리
    this.zoomHandler = () => {
      // requestAnimationFrame을 사용하여 성능 최적화
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
      
      rafId = requestAnimationFrame(() => {
        const zoom = this.map!.getZoom();
        this.markers.forEach((data) => {
          this.updateMarkerVisibility(data, zoom);
        });
        rafId = null;
      });
    };
    this.map.on('zoom', this.zoomHandler);

    // 'render' 이벤트로 globe occlusion 체크 (throttled)
    let renderRafId: number | null = null;
    this.renderHandler = () => {
      if (!this.map || this.map.getZoom() > ZOOM_THRESHOLDS.GLOBE_TO_2D) return; // Globe view에서만 체크
      
      // Throttle render checks to every 3rd frame for performance
      if (renderRafId === null) {
        renderRafId = requestAnimationFrame(() => {
          this.markers.forEach((data) => {
            this.checkGlobeOcclusion(data);
          });
          
          // Skip next 2 frames
          setTimeout(() => {
            renderRafId = null;
          }, OCCLUSION_SETTINGS.RENDER_THROTTLE);
        });
      }
    };
    this.map.on('render', this.renderHandler);
  }


  private handleMouseEnter = (e: MouseEvent) => {
    const markerEl = (e.target as HTMLElement).closest('[data-circuit-id]');
    if (!markerEl) return;

    const circuitId = markerEl.getAttribute('data-circuit-id');
    if (!circuitId) return;

    const data = this.markers.get(circuitId);
    if (!data) return;

    // hidden 상태나 occluded 상태에서는 호버 효과 적용하지 않음
    const zoomLevel = data.element.getAttribute('data-zoom-level');
    const isOccluded = data.element.getAttribute('data-occluded') === 'true';
    if (zoomLevel === 'hidden' || isOccluded) return;

    // 호버 타임아웃 클리어
    const existingTimeout = this.hoverTimeouts.get(circuitId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
      this.hoverTimeouts.delete(circuitId);
    }

    // 호버 효과 적용
    this.applyHoverEffect(data, true);
  };

  private handleMouseLeave = (e: MouseEvent) => {
    const markerEl = (e.target as HTMLElement).closest('[data-circuit-id]');
    if (!markerEl) return;

    const circuitId = markerEl.getAttribute('data-circuit-id');
    if (!circuitId) return;

    const data = this.markers.get(circuitId);
    if (!data) return;

    // 지연 후 호버 효과 제거
    const timeout = setTimeout(() => {
      this.applyHoverEffect(data, false);
      this.hoverTimeouts.delete(circuitId);
    }, ANIMATION_TIMINGS.HOVER_DELAY);

    this.hoverTimeouts.set(circuitId, timeout);
  };

  private handleClick = (e: MouseEvent) => {
    const markerEl = (e.target as HTMLElement).closest('[data-circuit-id]');
    if (!markerEl) return;

    const circuitId = markerEl.getAttribute('data-circuit-id');
    if (!circuitId) return;

    this.triggerMarkerClick(circuitId);
  };
  
  private handleKeyDown = (e: KeyboardEvent) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    
    const markerEl = (e.target as HTMLElement).closest('[data-circuit-id]');
    if (!markerEl) return;

    const circuitId = markerEl.getAttribute('data-circuit-id');
    if (!circuitId) return;

    e.preventDefault();
    this.triggerMarkerClick(circuitId);
  };
  
  private triggerMarkerClick(circuitId: string) {
    const data = this.markers.get(circuitId);
    if (!data || !this.onMarkerClick) return;

    const markerData: MarkerData = {
      type: 'circuit',
      id: data.circuit.id,
      name: data.circuit.name, // LocalizedText object
      grandPrix: data.circuit.grandPrix, // LocalizedText object
      length: data.circuit.length,
      laps: data.circuit.laps,
      corners: data.circuit.corners || 10,
      totalDistance: data.circuit.laps && data.circuit.length 
        ? Math.round((data.circuit.laps * data.circuit.length) * 10) / 10 
        : 0,
      location: data.circuit.location, // LocalizedText object
      lapRecord: data.circuit.lapRecord ? {
        ...data.circuit.lapRecord,
        year: data.circuit.lapRecord.year.toString()
      } : undefined
    };

    this.onMarkerClick(markerData);
  }

  private applyHoverEffect(data: CircuitMarkerData, isHover: boolean) {
    const { element } = data;
    
    // data-hover 속성으로 호버 상태 관리 - CSS가 처리
    element.setAttribute('data-hover', isHover.toString());
  }

  private updateMarkerVisibility(data: CircuitMarkerData, zoom: number) {
    const { element } = data;

    if (zoom <= ZOOM_THRESHOLDS.GLOBE_TO_2D) {
      // 줌 5.5 이하: 도트만 표시 (3D globe에서)
      element.setAttribute('data-zoom-level', ZoomLevel.LOW);
    } else if (zoom > ZOOM_THRESHOLDS.GLOBE_TO_2D && zoom < ZOOM_THRESHOLDS.FADE_START) {
      // 줌 5.5 초과 ~ 12 미만: 정상 표시
      element.setAttribute('data-zoom-level', ZoomLevel.NORMAL);
    } else if (zoom >= ZOOM_THRESHOLDS.FADE_START && zoom < ZOOM_THRESHOLDS.FADE_MID) {
      // 줌 12-13: 첫 번째 페이드 단계
      element.setAttribute('data-zoom-level', ZoomLevel.FADE_1);
    } else if (zoom >= ZOOM_THRESHOLDS.FADE_MID && zoom < ZOOM_THRESHOLDS.HIDE) {
      // 줌 13-14: 두 번째 페이드 단계
      element.setAttribute('data-zoom-level', ZoomLevel.FADE_2);
    } else {
      // 줌 14 이상: 완전히 숨김
      element.setAttribute('data-zoom-level', ZoomLevel.HIDDEN);
    }
  }

  private checkGlobeOcclusion(data: CircuitMarkerData) {
    if (!this.map) return;

    const { element, circuit } = data;
    
    // 지도의 중심점과 뷰포트 정보
    const center = this.map.getCenter();
    const zoom = this.map.getZoom();
    const pitch = this.map.getPitch();
    
    // Globe view에서만 작동 (줌 레벨 5.5 이하)
    if (zoom > ZOOM_THRESHOLDS.GLOBE_TO_2D) {
      element.style.visibility = MarkerOcclusionState.VISIBLE;
      element.removeAttribute('data-occluded');
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
    let occlusionThreshold = OCCLUSION_SETTINGS.BASE_THRESHOLD;
    
    // 피치가 있으면 위쪽/아래쪽 마커의 가시성 조정
    if (pitch > 0) {
      // 북쪽 마커는 더 멀리까지 보이고, 남쪽 마커는 더 빨리 숨김
      if (latDiff > 0) {
        occlusionThreshold = OCCLUSION_SETTINGS.BASE_THRESHOLD + (pitch * OCCLUSION_SETTINGS.PITCH_FACTOR);
      } else {
        occlusionThreshold = OCCLUSION_SETTINGS.BASE_THRESHOLD - (pitch * OCCLUSION_SETTINGS.PITCH_FACTOR);
      }
    }
    
    // 경도 차이가 임계값 이상이면 마커는 globe 뒤쪽에 있음
    const isOccluded = Math.abs(lngDiff) > occlusionThreshold;
    
    // 가시성 설정
    element.style.visibility = isOccluded ? 'hidden' : MarkerOcclusionState.VISIBLE;
    
    // 디버깅을 위한 데이터 속성 추가
    element.setAttribute('data-occluded', isOccluded.toString());
  }

  addCircuitMarker(circuit: Circuit, isNextRace: boolean = false): mapboxgl.Marker | null {
    if (!this.map) return null;

    // DOM 요소 생성
    const { element, labelContainer, line, dot, cityLabel, countryLabel } = this.createMarkerElements(circuit, isNextRace);

    // 데이터 속성 추가 (이벤트 위임을 위한 식별자)
    element.setAttribute('data-circuit-id', circuit.id);

    // Mapbox 마커 생성 - anchor를 'left'로 설정하여 점이 정확한 위치에 오도록 함
    const marker = new mapboxgl.Marker(element, { anchor: 'left' })
      .setLngLat([circuit.location.lng, circuit.location.lat])
      .addTo(this.map);

    // 마커 데이터 저장
    this.markers.set(circuit.id, {
      element,
      circuit,
      marker,
      labelContainer,
      line,
      dot,
      isNextRace,
      cityLabel,
      countryLabel
    });

    // 초기 가시성 설정
    const zoom = this.map.getZoom();
    const markerData = this.markers.get(circuit.id)!;
    this.updateMarkerVisibility(markerData, zoom);
    
    // Globe view에서는 초기 occlusion 체크도 수행
    if (zoom <= ZOOM_THRESHOLDS.GLOBE_TO_2D) {
      this.checkGlobeOcclusion(markerData);
    }

    return marker;
  }

  private createMarkerElements(circuit: Circuit, isNextRace: boolean) {
    const mobile = window.innerWidth < 640;

    // 메인 컨테이너
    const element = document.createElement('div');
    element.className = 'circuit-marker';
    element.setAttribute('data-next-race', isNextRace.toString());
    element.setAttribute('data-zoom-level', ZoomLevel.NORMAL);
    
    // Accessibility attributes
    element.setAttribute('role', 'button');
    const cityText = getText(circuit.location.city, this.language);
    const countryText = getText(circuit.location.country, this.language);
    const nameText = getText(circuit.name, this.language);
    element.setAttribute('aria-label', `${cityText}, ${countryText} - ${nameText}`);
    element.setAttribute('tabindex', '0');

    // 점 컨테이너
    const dotContainer = document.createElement('div');
    dotContainer.className = 'circuit-marker__dot-container';
    dotContainer.setAttribute('aria-hidden', 'true'); // 장식적 요소

    // 점 요소
    const dot = document.createElement('div');
    dot.className = 'circuit-marker__dot';
    dotContainer.appendChild(dot);

    // 다음 레이스 표시 (펄스 효과)
    if (isNextRace) {
      const pulse = document.createElement('div');
      pulse.className = 'circuit-marker__pulse';
      dotContainer.appendChild(pulse);
    }

    // 연결선
    const line = document.createElement('div');
    line.className = `circuit-marker__line circuit-marker__line--${mobile ? 'mobile' : 'desktop'}`;

    // 라벨 컨테이너
    const labelContainer = document.createElement('div');
    labelContainer.className = `circuit-marker__label circuit-marker__label--${mobile ? 'mobile' : 'desktop'}`;
    labelContainer.setAttribute('data-next-race', isNextRace.toString());

    // 도시명
    const cityLabel = document.createElement('div');
    cityLabel.className = `circuit-marker__city circuit-marker__city--${mobile ? 'mobile' : 'desktop'}`;
    cityLabel.textContent = getText(circuit.location.city, this.language);

    // 국가명
    const countryLabel = document.createElement('div');
    countryLabel.className = `circuit-marker__country circuit-marker__country--${mobile ? 'mobile' : 'desktop'}`;
    countryLabel.textContent = getText(circuit.location.country, this.language).toUpperCase();
    
    labelContainer.appendChild(cityLabel);
    labelContainer.appendChild(countryLabel);

    // 요소 조립
    element.appendChild(dotContainer);
    element.appendChild(line);
    element.appendChild(labelContainer);

    return { element, labelContainer, line, dot, cityLabel, countryLabel };
  }

  removeCircuitMarker(circuitId: string) {
    const data = this.markers.get(circuitId);
    if (!data) return;

    // 호버 타임아웃 정리
    const timeout = this.hoverTimeouts.get(circuitId);
    if (timeout) {
      clearTimeout(timeout);
      this.hoverTimeouts.delete(circuitId);
    }

    // 마커 제거
    data.marker.remove();
    this.markers.delete(circuitId);
  }

  cleanup() {
    // 모든 호버 타임아웃 정리
    this.hoverTimeouts.forEach(timeout => clearTimeout(timeout));
    this.hoverTimeouts.clear();

    // 모든 마커 제거
    this.markers.forEach(data => data.marker.remove());
    this.markers.clear();

    // Map 이벤트 리스너 제거
    if (this.map) {
      if (this.zoomHandler) {
        this.map.off('zoom', this.zoomHandler);
        this.zoomHandler = undefined;
      }
      if (this.renderHandler) {
        this.map.off('render', this.renderHandler);
        this.renderHandler = undefined;
      }
    }

    // DOM 이벤트 리스너 제거
    if (this.mapContainer && this.eventHandlersAttached) {
      this.mapContainer.removeEventListener('mouseenter', this.handleMouseEnter, true);
      this.mapContainer.removeEventListener('mouseleave', this.handleMouseLeave, true);
      this.mapContainer.removeEventListener('click', this.handleClick, true);
      this.mapContainer.removeEventListener('keydown', this.handleKeyDown, true);
      this.eventHandlersAttached = false;
    }
    
    this.map = null;
    this.mapContainer = undefined;
  }
}