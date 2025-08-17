'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Calendar, MapPin, Clock, ChevronDown } from 'lucide-react';
import { useReplayActions } from '../store/useReplayStore';
import { replayDataService } from '../services';
import { ReplaySessionData } from '../types';
import { cn } from '@/lib/utils';

interface SessionSelectorProps {
  className?: string;
  onSessionSelect?: (session: ReplaySessionData) => void;
}

export const SessionSelector: React.FC<SessionSelectorProps> = ({ 
  className, 
  onSessionSelect 
}) => {
  const [sessions, setSessions] = useState<ReplaySessionData[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(2024);
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { setCurrentSession, setDrivers } = useReplayActions();

  // 사용 가능한 연도 목록
  const availableYears = useMemo(() => [2024, 2023, 2022, 2021, 2020], []);

  // 세션 데이터 로드
  const loadSessions = useCallback(async (year: number, country?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await replayDataService.getCachedSessions(year, country);
      
      if (response.success) {
        setSessions(response.data);
      } else {
        setError(response.error?.message || 'Failed to load sessions');
        setSessions([]);
      }
    } catch {
      setError('Failed to load sessions');
      setSessions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 연도 변경 시 세션 로드
  useEffect(() => {
    loadSessions(selectedYear, selectedCountry || undefined);
  }, [selectedYear, selectedCountry, loadSessions]);

  const handleYearChange = useCallback((year: number) => {
    setSelectedYear(year);
    setSelectedCountry(''); // 연도 변경 시 국가 필터 초기화
  }, []);

  const handleCountryChange = useCallback((country: string) => {
    setSelectedCountry(country);
  }, []);

  const handleSessionSelect = useCallback(async (session: ReplaySessionData) => {
    setCurrentSession(session);
    
    // 세션 선택 시 자동으로 드라이버 데이터 로드
    try {
      console.log(`Loading drivers for session ${session.sessionKey}...`);
      const driversResponse = await replayDataService.getDrivers(session.sessionKey);
      
      if (driversResponse.success) {
        // Store에 드라이버 데이터 저장
        setDrivers(driversResponse.data);
        console.log(`✅ Loaded ${driversResponse.data.length} drivers for ${session.sessionName}`);
      } else {
        console.error('❌ Failed to load drivers:', driversResponse.error);
      }
    } catch (error) {
      console.error('❌ Error loading drivers:', error);
    }
    
    onSessionSelect?.(session);
  }, [setCurrentSession, setDrivers, onSessionSelect]);

  // 국가 목록 추출
  const availableCountries = useMemo(() => {
    const countries = [...new Set(sessions.map(s => s.countryName))].sort();
    return countries;
  }, [sessions]);

  const filteredSessions = useMemo(() => {
    return sessions.filter(session => 
      !selectedCountry || session.countryName === selectedCountry
    );
  }, [sessions, selectedCountry]);

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  }, []);

  return (
    <div className={cn(
      "bg-black/80 backdrop-blur-sm rounded-lg p-4 text-white",
      "border border-white/10",
      className
    )}>
      {/* 헤더 */}
      <div className="flex items-center mb-4">
        <Calendar className="w-5 h-5 mr-2" />
        <h3 className="text-lg font-semibold">Select Session</h3>
      </div>

      {/* 필터 컨트롤 */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* 연도 선택 */}
        <div className="relative">
          <label className="block text-sm text-gray-400 mb-1">Year</label>
          <div className="relative">
            <select
              value={selectedYear}
              onChange={(e) => handleYearChange(parseInt(e.target.value))}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2
                         focus:outline-none focus:ring-2 focus:ring-red-600
                         appearance-none cursor-pointer"
            >
              {availableYears.map(year => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none" />
          </div>
        </div>

        {/* 국가 선택 */}
        <div className="relative">
          <label className="block text-sm text-gray-400 mb-1">Country</label>
          <div className="relative">
            <select
              value={selectedCountry}
              onChange={(e) => handleCountryChange(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2
                         focus:outline-none focus:ring-2 focus:ring-red-600
                         appearance-none cursor-pointer"
              disabled={isLoading}
            >
              <option value="">All Countries</option>
              {availableCountries.map(country => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* 세션 목록 */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {isLoading ? (
          <div className="text-center py-4 text-gray-400">
            Loading sessions...
          </div>
        ) : error ? (
          <div className="text-center py-4 text-red-400">
            {error}
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="text-center py-4 text-gray-400">
            No sessions found
          </div>
        ) : (
          filteredSessions.map(session => (
            <div
              key={session.sessionKey}
              onClick={() => handleSessionSelect(session)}
              className="p-3 rounded border border-gray-700 hover:border-gray-600
                         hover:bg-white/5 cursor-pointer transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium">{session.sessionName}</div>
                <div className="text-sm text-gray-400">
                  {formatDate(session.dateStart)}
                </div>
              </div>
              
              <div className="flex items-center text-sm text-gray-400">
                <MapPin className="w-4 h-4 mr-1" />
                <span>{session.circuitShortName}</span>
                <span className="mx-2">•</span>
                <span>{session.countryName}</span>
              </div>
              
              <div className="flex items-center text-xs text-gray-500 mt-1">
                <Clock className="w-3 h-3 mr-1" />
                <span>{session.sessionType}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};