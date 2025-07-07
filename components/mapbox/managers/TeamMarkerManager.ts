import mapboxgl from 'mapbox-gl';
import { Team } from '@/types/f1';
import { MarkerData } from '../types';
import { type Language } from '@/utils/i18n';
import { TeamMarkerFactory } from '../markers/team/TeamMarkerFactory';

interface TeamMarkerData {
  team: Team;
  marker: mapboxgl.Marker;
  cleanup: () => void;
}

/**
 * TeamMarkerManager - 팀 마커의 전체 생명주기를 관리
 * 
 * 책임:
 * - 팀 마커 생성 및 파괴
 * - 마커 상태 추적
 * - 이벤트 관리
 * - 메모리 정리
 */
export class TeamMarkerManager {
  private map: mapboxgl.Map | null = null;
  private markers: Map<string, TeamMarkerData> = new Map();
  private onMarkerClick?: (item: MarkerData) => void;
  private language: Language = 'en';

  /**
   * 맵 인스턴스 설정
   */
  setMap(map: mapboxgl.Map): void {
    this.map = map;
  }

  /**
   * 마커 클릭 핸들러 설정
   */
  setOnMarkerClick(handler: (item: MarkerData) => void): void {
    this.onMarkerClick = handler;
  }

  /**
   * 언어 설정
   */
  setLanguage(language: Language): void {
    this.language = language;
  }

  /**
   * 팀 마커 추가
   */
  addTeamMarker(team: Team): void {
    if (!this.map) {
      console.error('Map is not initialized');
      return;
    }

    // 이미 존재하는 마커는 제거
    if (this.markers.has(team.id)) {
      this.removeTeamMarker(team.id);
    }

    // 팀 마커 생성
    const markerWithCleanup = TeamMarkerFactory.create({
      map: this.map,
      team,
      language: this.language,
      onMarkerClick: this.onMarkerClick
    });

    if (markerWithCleanup) {
      this.markers.set(team.id, {
        team,
        marker: markerWithCleanup.marker,
        cleanup: markerWithCleanup.cleanup
      });
    }
  }

  /**
   * 여러 팀 마커 일괄 추가
   */
  addAllTeamMarkers(teams: Team[]): void {
    teams.forEach(team => this.addTeamMarker(team));
  }

  /**
   * 특정 팀 마커 제거
   */
  removeTeamMarker(teamId: string): void {
    const markerData = this.markers.get(teamId);
    if (markerData) {
      markerData.cleanup();
      this.markers.delete(teamId);
    }
  }

  /**
   * 모든 팀 마커 제거
   */
  removeAllTeamMarkers(): void {
    this.markers.forEach(markerData => {
      markerData.cleanup();
    });
    this.markers.clear();
  }

  /**
   * 팀 마커 가져오기
   */
  getTeamMarker(teamId: string): mapboxgl.Marker | undefined {
    return this.markers.get(teamId)?.marker;
  }

  /**
   * 모든 팀 마커 가져오기
   */
  getAllTeamMarkers(): mapboxgl.Marker[] {
    return Array.from(this.markers.values()).map(data => data.marker);
  }

  /**
   * 팀 마커 표시/숨김
   */
  setTeamMarkerVisibility(teamId: string, visible: boolean): void {
    const markerData = this.markers.get(teamId);
    if (markerData) {
      const element = markerData.marker.getElement();
      if (element) {
        element.style.display = visible ? 'block' : 'none';
      }
    }
  }

  /**
   * 모든 팀 마커 표시/숨김
   */
  setAllTeamMarkersVisibility(visible: boolean): void {
    this.markers.forEach((_, teamId) => {
      this.setTeamMarkerVisibility(teamId, visible);
    });
  }

  /**
   * 언어 변경 시 모든 마커 업데이트
   */
  updateLanguage(language: Language): void {
    this.language = language;
    
    // 현재 팀 목록 저장
    const teams = Array.from(this.markers.values()).map(data => data.team);
    
    // 모든 마커 제거 후 재생성
    this.removeAllTeamMarkers();
    this.addAllTeamMarkers(teams);
  }

  /**
   * 전체 정리
   */
  cleanup(): void {
    this.removeAllTeamMarkers();
    this.map = null;
    this.onMarkerClick = undefined;
  }

  /**
   * 활성 마커 수 반환
   */
  getMarkerCount(): number {
    return this.markers.size;
  }

  /**
   * 특정 팀 마커 존재 여부 확인
   */
  hasTeamMarker(teamId: string): boolean {
    return this.markers.has(teamId);
  }
}