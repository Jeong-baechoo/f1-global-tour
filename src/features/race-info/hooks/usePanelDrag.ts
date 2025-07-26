import { useState, useCallback, useRef } from 'react';

export type SheetState = 'closed' | 'peek' | 'half' | 'full';

export const SHEET_HEIGHTS = {
  closed: 0,
  peek: 80, // 80px - 핸들과 제목만 보임
  half: 50, // 50vh - 중간 상태 (5vh 더 높게)
  full: 90  // 90vh - 전체 상태 (5vh 더 높게)
} as const;

// 드래그 동작 임계값
export const DRAG_THRESHOLDS = {
  minDrag: 50,        // 최소 드래그 거리
  closeDistance: 100, // 패널 닫기 임계값
  snapThreshold: {
    peek: 20,         // peek 상태 스냅 임계값 (vh)
    half: 65          // half 상태 스냅 임계값 (vh)
  }
} as const;

export const usePanelDrag = (onClose?: () => void) => {
  const [sheetState, setSheetState] = useState<SheetState>('peek');
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const sheetRef = useRef<HTMLDivElement>(null);

  const handleDragStart = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    setIsDragging(true);
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setStartY(clientY);
  }, []);

  const handleDragMove = useCallback((e: React.TouchEvent | React.MouseEvent | TouchEvent) => {
    if (!isDragging || !sheetRef.current) return;

    // 터치 이벤트에서 기본 동작 방지
    if ('touches' in e) {
      e.preventDefault();
    }

    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const deltaY = startY - clientY;

    // 현재 높이 계산
    const windowHeight = window.innerHeight;
    let currentHeight = 0;

    if (sheetState === 'peek') currentHeight = SHEET_HEIGHTS.peek;
    else if (sheetState === 'half') currentHeight = (SHEET_HEIGHTS.half / 100) * windowHeight;
    else if (sheetState === 'full') currentHeight = (SHEET_HEIGHTS.full / 100) * windowHeight;

    const newHeight = currentHeight + deltaY;
    const heightPercent = (newHeight / windowHeight) * 100;

    // 높이 제한
    if (newHeight >= SHEET_HEIGHTS.peek && heightPercent <= SHEET_HEIGHTS.full) {
      sheetRef.current.style.height = `${newHeight}px`;
    }
  }, [isDragging, startY, sheetState]);

  const handleDragEnd = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (!isDragging || !sheetRef.current) return;
    setIsDragging(false);

    const clientY = 'touches' in e ? e.changedTouches[0].clientY : e.clientY;
    const deltaY = startY - clientY;
    const windowHeight = window.innerHeight;
    const currentHeightPx = sheetRef.current.offsetHeight;
    const currentHeightVh = (currentHeightPx / windowHeight) * 100;

    // 드래그 방향과 현재 높이에 따라 상태 결정
    if (deltaY > DRAG_THRESHOLDS.minDrag) { // 위로 드래그
      if (sheetState === 'peek') setSheetState('half');
      else if (sheetState === 'half') setSheetState('full');
    } else if (deltaY < -DRAG_THRESHOLDS.minDrag) { // 아래로 드래그
      if (sheetState === 'full') setSheetState('half');
      else if (sheetState === 'half') setSheetState('peek');
      else if (sheetState === 'peek' && deltaY < -DRAG_THRESHOLDS.closeDistance) {
        onClose?.();
        return;
      }
    } else {
      // 가장 가까운 snap point로 이동
      if (currentHeightVh < DRAG_THRESHOLDS.snapThreshold.peek) setSheetState('peek');
      else if (currentHeightVh < DRAG_THRESHOLDS.snapThreshold.half) setSheetState('half');
      else setSheetState('full');
    }
  }, [isDragging, startY, sheetState, onClose]);

  // 클릭으로 상태 전환
  const handleHeaderClick = useCallback(() => {
    if (sheetState === 'peek') setSheetState('half');
    else if (sheetState === 'half') setSheetState('full');
  }, [sheetState]);

  return {
    sheetRef,
    sheetState,
    setSheetState,
    isDragging,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
    handleHeaderClick
  };
};