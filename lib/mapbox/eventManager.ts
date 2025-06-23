import mapboxgl from 'mapbox-gl';

type EventHandler = () => void;
type EventMap = { [event: string]: EventHandler };

export class MapEventManager {
  private map: mapboxgl.Map;
  private events: EventMap = {};

  constructor(map: mapboxgl.Map) {
    this.map = map;
  }

  /**
   * 여러 이벤트를 한 번에 등록
   */
  registerEvents(events: EventMap) {
    Object.entries(events).forEach(([event, handler]) => {
      this.events[event] = handler;
      // Mapbox GL의 on 메서드는 string 타입의 이벤트명을 받습니다
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (this.map as any).on(event, handler);
    });
  }

  /**
   * 단일 이벤트 등록
   */
  registerEvent(event: string, handler: EventHandler) {
    this.events[event] = handler;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this.map as any).on(event, handler);
  }

  /**
   * 모든 등록된 이벤트 해제
   */
  unregisterEvents() {
    Object.entries(this.events).forEach(([event, handler]) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (this.map as any).off(event, handler);
    });
    this.events = {};
  }

  /**
   * 특정 이벤트만 해제
   */
  unregisterEvent(event: string) {
    if (this.events[event]) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (this.map as any).off(event, this.events[event]);
      delete this.events[event];
    }
  }

  /**
   * 특정 이벤트의 핸들러 업데이트
   */
  updateEvent(event: string, newHandler: EventHandler) {
    this.unregisterEvent(event);
    this.registerEvent(event, newHandler);
  }

  /**
   * 등록된 이벤트 목록 반환
   */
  getRegisteredEvents(): string[] {
    return Object.keys(this.events);
  }

  /**
   * 특정 이벤트가 등록되어 있는지 확인
   */
  hasEvent(event: string): boolean {
    return event in this.events;
  }
}

// 일반적인 맵 이벤트 그룹을 위한 헬퍼 함수
export const createCommonEventHandlers = (actions: {
  onDragStart?: () => void;
  onDragEnd?: () => void;
  onZoomStart?: () => void;
  onZoomEnd?: () => void;
  onPitchStart?: () => void;
  onPitchEnd?: () => void;
  onRotateStart?: () => void;
  onRotateEnd?: () => void;
  onMoveStart?: () => void;
  onMoveEnd?: () => void;
}): EventMap => {
  const handlers: EventMap = {};

  if (actions.onDragStart) handlers.dragstart = actions.onDragStart;
  if (actions.onDragEnd) handlers.dragend = actions.onDragEnd;
  if (actions.onZoomStart) handlers.zoomstart = actions.onZoomStart;
  if (actions.onZoomEnd) handlers.zoomend = actions.onZoomEnd;
  if (actions.onPitchStart) handlers.pitchstart = actions.onPitchStart;
  if (actions.onPitchEnd) handlers.pitchend = actions.onPitchEnd;
  if (actions.onRotateStart) handlers.rotatestart = actions.onRotateStart;
  if (actions.onRotateEnd) handlers.rotateend = actions.onRotateEnd;
  if (actions.onMoveStart) handlers.movestart = actions.onMoveStart;
  if (actions.onMoveEnd) handlers.moveend = actions.onMoveEnd;

  return handlers;
};