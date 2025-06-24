/**
 * TeamMarkerFactory 사용 예제
 * 
 * 기존의 10개 개별 마커 파일을 대체하는 통합 솔루션
 */

import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import { TeamMarkerFactory } from '../factories/TeamMarkerFactory';
import { Team, MarkerData } from '../types';
import teamsData from '../../../data/teams.json';

interface TeamMarkerUsageProps {
  onMarkerClick?: (item: MarkerData) => void;
}

export const TeamMarkerUsage: React.FC<TeamMarkerUsageProps> = ({ onMarkerClick }) => {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  useEffect(() => {
    // 맵 초기화 (예제)
    if (!mapRef.current) {
      mapRef.current = new mapboxgl.Map({
        container: 'map', // 실제 맵 컨테이너 ID
        style: 'mapbox://styles/mapbox/satellite-v9',
        center: [0, 30],
        zoom: 2,
        projection: { name: 'globe' }
      });
    }

    const map = mapRef.current;
    
    // 팀 데이터 로드 및 마커 생성
    const teams: Team[] = teamsData.teams as Team[];
    
    // 방법 1: 개별 마커 생성
    teams.forEach(team => {
      const marker = TeamMarkerFactory.create({
        map,
        team,
        onMarkerClick
      });
      
      if (marker) {
        markersRef.current.push(marker);
      }
    });

    // 방법 2: 일괄 마커 생성 (권장)
    // const markers = TeamMarkerFactory.createMultiple(map, teams, onMarkerClick);
    // markersRef.current = markers;

    // 클린업
    return () => {
      const markers = markersRef.current;
      TeamMarkerFactory.removeAll(markers);
    };
  }, [onMarkerClick]);

  return null; // 실제로는 맵 컨테이너 반환
};

/**
 * 기존 코드 마이그레이션 가이드:
 * 
 * BEFORE (기존 방식):
 * ```typescript
 * import { createRedBullMarker } from './markers/RedBullMarker';
 * import { createFerrariMarker } from './markers/FerrariMarker';
 * // ... 8개 더
 * 
 * // 각각 개별 호출
 * const redBullMarker = createRedBullMarker({ map, team: redBullTeam, onMarkerClick });
 * const ferrariMarker = createFerrariMarker({ map, team: ferrariTeam, onMarkerClick });
 * // ... 8개 더
 * ```
 * 
 * AFTER (새로운 방식):
 * ```typescript
 * import { TeamMarkerFactory } from './factories/TeamMarkerFactory';
 * 
 * // 통합된 방식으로 모든 마커 생성
 * const markers = TeamMarkerFactory.createMultiple(map, allTeams, onMarkerClick);
 * ```
 * 
 * 장점:
 * 1. 코드 중복 제거: 1,320줄 → 200줄 (85% 감소)
 * 2. 일관성: 모든 마커가 동일한 로직으로 동작
 * 3. 유지보수성: 한 곳에서 모든 마커 로직 관리
 * 4. 확장성: 새 팀 추가시 설정만 추가하면 됨
 * 5. 타입 안전성: 강타입 기반 설정 관리
 */