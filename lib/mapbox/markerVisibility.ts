import mapboxgl from 'mapbox-gl';

// 줌 레벨 임계값
const MARKER_VISIBILITY_THRESHOLD = 13; // 줌 레벨 8 이상에서는 마커 숨김

/**
 * 줌 레벨에 따라 마커 가시성을 관리하는 클래스
 */
export class MarkerVisibilityManager {
  private map: mapboxgl.Map;
  private markers: mapboxgl.Marker[] = [];
  private isVisible: boolean = true;
  private initialized: boolean = false;
  private zoomHandler?: () => void;

  constructor(map: mapboxgl.Map) {
    this.map = map;
  }

  /**
   * 관리할 마커들 설정
   */
  setMarkers(markers: mapboxgl.Marker[]) {
    this.markers = markers;
    this.updateVisibility();
  }

  /**
   * 마커 추가
   */
  addMarker(marker: mapboxgl.Marker) {
    this.markers.push(marker);
    if (!this.isVisible) {
      this.hideMarker(marker);
    }
  }

  /**
   * 마커 제거
   */
  removeMarker(marker: mapboxgl.Marker) {
    const index = this.markers.indexOf(marker);
    if (index > -1) {
      this.markers.splice(index, 1);
    }
  }

  /**
   * 현재 줌 레벨에 따라 마커 가시성 업데이트
   */
  updateVisibility() {
    const zoom = this.map.getZoom();
    const shouldBeVisible = zoom < MARKER_VISIBILITY_THRESHOLD;

    // 초기화되지 않았거나 상태가 변경되었을 때 업데이트
    if (!this.initialized || shouldBeVisible !== this.isVisible) {
      this.isVisible = shouldBeVisible;
      this.initialized = true;

      if (this.isVisible) {
        this.showAllMarkers();
      } else {
        this.hideAllMarkers();
      }
    }
    
    // 프로덕션 환경에서 초기 렌더링 시 강제 표시
    if (!this.initialized && this.markers.length > 0) {
      console.log('[MarkerVisibility] Force showing markers on initial load');
      this.showAllMarkers();
      this.initialized = true;
    }
  }

  /**
   * 모든 마커 표시
   */
  private showAllMarkers() {
    this.markers.forEach(marker => this.showMarker(marker));
  }

  /**
   * 모든 마커 숨김
   */
  private hideAllMarkers() {
    this.markers.forEach(marker => this.hideMarker(marker));
  }

  /**
   * 개별 마커 표시
   */
  private showMarker(marker: mapboxgl.Marker) {
    const element = marker.getElement();
    if (element) {
      // 강제로 스타일 적용
      element.style.setProperty('opacity', '1', 'important');
      element.style.setProperty('pointer-events', 'auto', 'important');
      element.style.setProperty('display', 'block', 'important');
      element.style.setProperty('visibility', 'visible', 'important');
      element.style.transition = 'opacity 0.3s ease-in-out';

      // 자식 요소들도 표시
      const children = element.querySelectorAll('*');
      children.forEach(child => {
        (child as HTMLElement).style.setProperty('opacity', '1', 'important');
      });
    }
  }

  /**
   * 개별 마커 숨김
   */
  private hideMarker(marker: mapboxgl.Marker) {
    const element = marker.getElement();
    if (element) {
      // 마커 요소와 모든 자식 요소에 스타일 적용
      element.style.setProperty('opacity', '0', 'important');
      element.style.setProperty('pointer-events', 'none', 'important');
      element.style.setProperty('visibility', 'hidden', 'important');
      element.style.transition = 'opacity 0.3s ease-in-out';

      // 자식 요소들도 숨김
      const children = element.querySelectorAll('*');
      children.forEach(child => {
        (child as HTMLElement).style.setProperty('opacity', '0', 'important');
      });

      // 애니메이션 후 display none
      setTimeout(() => {
        if (element) {
          element.style.setProperty('display', 'none', 'important');
        }
      }, 300);
    }
  }

  /**
   * 줌 핸들러 설정
   */
  setZoomHandler(handler: () => void) {
    this.zoomHandler = handler;
  }

  /**
   * 줌 핸들러 가져오기
   */
  getZoomHandler(): (() => void) | undefined {
    return this.zoomHandler;
  }

  /**
   * 정리
   */
  cleanup() {
    this.markers = [];
    this.zoomHandler = undefined;
  }
}

/**
 * 줌 레벨에 따라 마커 가시성을 설정하는 헬퍼 함수
 */
export const setupMarkerVisibility = (
  map: mapboxgl.Map,
  markers: mapboxgl.Marker[]
): MarkerVisibilityManager => {
  const manager = new MarkerVisibilityManager(map);
  manager.setMarkers(markers);

  // 줌 이벤트 리스너 등록
  const handleZoom = () => {
    manager.updateVisibility();
  };
  map.on('zoom', handleZoom);

  // 초기 가시성 설정
  manager.updateVisibility();

  // cleanup 함수 반환을 위해 이벤트 핸들러 저장
  manager.setZoomHandler(handleZoom);

  return manager;
};

/**
 * 마커 가시성 매니저 정리
 */
export const cleanupMarkerVisibility = (
  map: mapboxgl.Map,
  manager: MarkerVisibilityManager
) => {
  const handleZoom = manager.getZoomHandler();
  if (handleZoom) {
    map.off('zoom', handleZoom);
  }
  manager.cleanup();
};
