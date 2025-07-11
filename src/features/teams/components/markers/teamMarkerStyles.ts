// 팀 마커 스타일 인터페이스
export interface TeamMarkerStyle {
  width: string;
  height: string;
  boxWidth: string;
  boxHeight: string;
  borderRadius: string;
  mobileWidth: string;
  mobileHeight: string;
  mobileBoxWidth: string;
  mobileBoxHeight: string;
}

// 기본 팀 마커 스타일 상수
export const DEFAULT_TEAM_MARKER_STYLE: TeamMarkerStyle = {
  width: '80px',
  height: '95px',
  boxWidth: '80px',
  boxHeight: '80px',
  borderRadius: '4px',
  mobileWidth: '60px',
  mobileHeight: '71px',
  mobileBoxWidth: '60px',
  mobileBoxHeight: '60px'
};

// 줌 레벨별 마커 스타일
export const ZOOM_MARKER_STYLES = {
  // 줌 5 이하에서 점으로 표시
  dot: {
    width: '12px',
    height: '12px',
    borderRadius: '50%'
  }
};