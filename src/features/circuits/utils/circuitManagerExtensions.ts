// 섹터 마커 cleanup 함수들을 저장할 배열
const sectorCleanupFunctions: (() => void)[] = [];


// 섹터 마커 정리 함수
export const cleanupSectorMarkers = () => {
  sectorCleanupFunctions.forEach(cleanup => cleanup());
  sectorCleanupFunctions.length = 0; // 배열 비우기
};