'use client';

import { useState, useEffect } from 'react';

export interface DriverStanding {
  classificationId: number;
  driverId: string;
  teamId: string;
  points: number;
  position: number;
  wins: number | null;
  driver: {
    name: string;
    surname: string;
    nationality: string;
    birthday: string;
    number: number;
    shortName: string;
    url: string;
  };
  team: {
    teamId: string;
    teamName: string;
    country: string;
    firstAppearance: number;
    constructorsChampionships: number | null;
    driversChampionships: number | null;
    url: string;
  };
}

interface ApiResponse {
  api: string;
  season: number;
  drivers_championship: DriverStanding[];
}

export function useDriversChampionship() {
  const [data, setData] = useState<DriverStanding[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDriversData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('https://f1api.dev/api/current/drivers-championship');
        
        if (!response.ok) {
          setError(`API 요청 실패: ${response.status}`);
          return;
        }
        
        const result: ApiResponse = await response.json();
        setData(result.drivers_championship);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '데이터를 불러오는데 실패했습니다';
        setError(errorMessage);
        if (process.env.NODE_ENV === 'development') {
          console.error('드라이버 챔피언십 데이터 로딩 실패:', err);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDriversData();
  }, []);

  return { data, loading, error };
}