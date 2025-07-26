'use client';

import { useState, useEffect } from 'react';

export interface ConstructorStanding {
  classificationId: number;
  teamId: string;
  points: number;
  position: number;
  wins: number | null;
  team: {
    teamName: string;
    country: string;
    firstAppareance: number;
    constructorsChampionships: number | null;
    driversChampionships: number | null;
    url: string;
  };
}

interface ApiResponse {
  api: string;
  season: number;
  constructors_championship: ConstructorStanding[];
}

export function useConstructorsChampionship() {
  const [data, setData] = useState<ConstructorStanding[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchConstructorsData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('https://f1api.dev/api/current/constructors-championship');
        
        if (!response.ok) {
          setError(`API 요청 실패: ${response.status}`);
          return;
        }
        
        const result: ApiResponse = await response.json();
        setData(result.constructors_championship);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '데이터를 불러오는데 실패했습니다';
        setError(errorMessage);
        if (process.env.NODE_ENV === 'development') {
          console.error('컨스트럭터 챔피언십 데이터 로딩 실패:', err);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchConstructorsData();
  }, []);

  return { data, loading, error };
}