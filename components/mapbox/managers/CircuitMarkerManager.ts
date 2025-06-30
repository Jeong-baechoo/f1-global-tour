import mapboxgl from 'mapbox-gl';
import { Circuit } from '@/types/f1';
import { MarkerData } from '../types';
import { CIRCUIT_CORNERS } from '../utils/data/circuitCorners';

interface CircuitMarkerData {
  element: HTMLElement;
  circuit: Circuit;
  marker: mapboxgl.Marker;
  labelContainer: HTMLElement;
  line: HTMLElement;
  dot: HTMLElement;
  isNextRace: boolean;
}

export class CircuitMarkerManager {
  private map: mapboxgl.Map | null = null;
  private markers = new Map<string, CircuitMarkerData>();
  private onMarkerClick?: (item: MarkerData) => void;
  private hoverTimeouts = new Map<string, NodeJS.Timeout>();

  constructor() {
    // 이벤트 위임을 위한 단일 리스너 설정
    this.setupEventDelegation();
  }

  setMap(map: mapboxgl.Map) {
    this.map = map;
    this.setupZoomListener();
  }

  setOnMarkerClick(handler: (item: MarkerData) => void) {
    this.onMarkerClick = handler;
  }

  private setupEventDelegation() {
    // document.body에 이벤트 위임 (맵 컨테이너가 아직 없을 수 있으므로)
    document.addEventListener('mouseenter', this.handleMouseEnter, true);
    document.addEventListener('mouseleave', this.handleMouseLeave, true);
    document.addEventListener('click', this.handleClick, true);
  }

  private setupZoomListener() {
    if (!this.map) return;

    // 단일 zoom 리스너로 모든 마커 관리
    this.map.on('zoom', () => {
      const zoom = this.map!.getZoom();
      this.markers.forEach((data) => {
        this.updateMarkerVisibility(data, zoom);
      });
    });
  }

  private handleMouseEnter = (e: MouseEvent) => {
    const markerEl = (e.target as HTMLElement).closest('[data-circuit-id]');
    if (!markerEl) return;

    const circuitId = markerEl.getAttribute('data-circuit-id');
    if (!circuitId) return;

    const data = this.markers.get(circuitId);
    if (!data) return;

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

    // 300ms 지연 후 호버 효과 제거
    const timeout = setTimeout(() => {
      this.applyHoverEffect(data, false);
      this.hoverTimeouts.delete(circuitId);
    }, 300);

    this.hoverTimeouts.set(circuitId, timeout);
  };

  private handleClick = (e: MouseEvent) => {
    const markerEl = (e.target as HTMLElement).closest('[data-circuit-id]');
    if (!markerEl) return;

    const circuitId = markerEl.getAttribute('data-circuit-id');
    if (!circuitId) return;

    const data = this.markers.get(circuitId);
    if (!data || !this.onMarkerClick) return;

    const markerData: MarkerData = {
      type: 'circuit',
      id: data.circuit.id,
      name: data.circuit.name,
      grandPrix: data.circuit.grandPrix,
      length: data.circuit.length,
      laps: data.circuit.laps,
      corners: CIRCUIT_CORNERS[data.circuit.id] || 10,
      totalDistance: data.circuit.laps && data.circuit.length 
        ? Math.round((data.circuit.laps * data.circuit.length) * 10) / 10 
        : 0,
      location: `${data.circuit.location.city}, ${data.circuit.location.country}`
    };

    this.onMarkerClick(markerData);
  };

  private applyHoverEffect(data: CircuitMarkerData, isHover: boolean) {
    const { element } = data;
    // data-hover 속성으로 호버 상태 관리
    element.setAttribute('data-hover', isHover.toString());
  }

  private updateMarkerVisibility(data: CircuitMarkerData, zoom: number) {
    const { element } = data;

    if (zoom <= 5) {
      // 줌 5 이하
      element.setAttribute('data-zoom-level', 'low');
    } else if (zoom >= 13) {
      // 줌 13-15: 서서히 사라지기
      const fadeStart = 13;
      const fadeEnd = 15;
      const opacity = Math.max(0, 1 - (zoom - fadeStart) / (fadeEnd - fadeStart));
      
      if (opacity === 0) {
        element.setAttribute('data-zoom-level', 'high');
      } else {
        element.setAttribute('data-zoom-level', 'fade');
        element.style.opacity = opacity.toString();
      }
    } else {
      // 줌 5 초과 ~ 13 미만: 정상 표시
      element.setAttribute('data-zoom-level', 'normal');
      element.style.opacity = '1';
    }
  }

  addCircuitMarker(circuit: Circuit, isNextRace: boolean = false): mapboxgl.Marker | null {
    if (!this.map) return null;

    // DOM 요소 생성
    const { element, labelContainer, line, dot } = this.createMarkerElements(circuit, isNextRace);

    // 데이터 속성 추가 (이벤트 위임을 위한 식별자)
    element.setAttribute('data-circuit-id', circuit.id);

    // Mapbox 마커 생성
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
      isNextRace
    });

    // 초기 가시성 설정
    const zoom = this.map.getZoom();
    this.updateMarkerVisibility(this.markers.get(circuit.id)!, zoom);

    return marker;
  }

  private createMarkerElements(circuit: Circuit, isNextRace: boolean) {
    const mobile = window.innerWidth < 640;

    // 메인 컨테이너
    const element = document.createElement('div');
    element.className = 'circuit-marker';
    element.setAttribute('data-next-race', isNextRace.toString());
    element.setAttribute('data-zoom-level', 'normal');

    // 점 요소
    const dot = document.createElement('div');
    dot.className = `circuit-marker__dot circuit-marker__dot--${mobile ? 'mobile' : 'desktop'}`;

    // 다음 레이스 표시 (펄스 효과)
    if (isNextRace) {
      const pulse = document.createElement('div');
      pulse.className = 'circuit-marker__pulse';
      dot.appendChild(pulse);
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
    cityLabel.textContent = circuit.location.city;

    // 국가명
    const countryLabel = document.createElement('div');
    countryLabel.className = `circuit-marker__country circuit-marker__country--${mobile ? 'mobile' : 'desktop'}`;
    countryLabel.textContent = circuit.location.country.toUpperCase();

    labelContainer.appendChild(cityLabel);
    labelContainer.appendChild(countryLabel);

    // 요소 조립
    element.appendChild(dot);
    element.appendChild(line);
    element.appendChild(labelContainer);

    return { element, labelContainer, line, dot };
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

    // 이벤트 리스너 제거
    document.removeEventListener('mouseenter', this.handleMouseEnter, true);
    document.removeEventListener('mouseleave', this.handleMouseLeave, true);
    document.removeEventListener('click', this.handleClick, true);
  }
}