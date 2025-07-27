'use client';

import React, { useEffect, useState } from 'react';
import { Cloud, CloudRain, Thermometer, Wind, Droplets, Gauge } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { weatherService } from '@/src/shared/services/WeatherService';
import { openF1ApiService } from '@/src/shared/services/F1ApiService';
import { WeatherState } from '@/src/shared/types/weather';
import { NextRaceData } from '../types';
import { ERROR_MESSAGES, DEFAULT_UPDATE_INTERVAL } from '@/src/shared/constants/weather';
import { 
  formatTimeAgo, 
  isOldWeatherData, 
  formatTime, 
  getWindIcon, 
  formatWindDirection, 
  isRainy 
} from '@/src/shared/utils/weatherUtils';

interface WeatherWidgetProps {
  meetingKey?: number;
  raceData?: NextRaceData;
  className?: string;
}

export const WeatherWidget: React.FC<WeatherWidgetProps> = ({ 
  meetingKey, 
  raceData,
  className = '' 
}) => {
  const { language } = useLanguage();
  const [weatherState, setWeatherState] = useState<WeatherState>({
    currentWeather: null,
    isLoading: false,
    error: null,
    lastUpdated: null
  });

  useEffect(() => {
    const unsubscribe = weatherService.subscribe(setWeatherState);
    
    // raceData에서 meeting_key 추출 시도
    let targetMeetingKey = meetingKey;
    if (!targetMeetingKey && raceData) {
      targetMeetingKey = openF1ApiService.getMeetingKeyByRaceData(raceData);
    }
    
    weatherService.startAutoUpdate(DEFAULT_UPDATE_INTERVAL, targetMeetingKey);

    return () => {
      unsubscribe();
      weatherService.stopAutoUpdate();
    };
  }, [meetingKey, raceData]);

  // 모든 유틸리티 함수들을 weatherUtils로 이동

  if (weatherState.error) {
    const isDataNotReady = weatherState.error === ERROR_MESSAGES.DATA_NOT_READY;
    
    return (
      <div className={`bg-[#1A1A1A]/40 backdrop-blur-sm rounded border border-[#FF1801]/10 p-4 ${className}`}>
        <div className="text-center">
          <Cloud className="w-8 h-8 text-[#C0C0C0] mx-auto mb-2" />
          <div className="text-sm text-[#C0C0C0]">
            {isDataNotReady 
              ? ERROR_MESSAGES.DATA_NOT_AVAILABLE_YET[language]
              : ERROR_MESSAGES.DATA_UNAVAILABLE[language]
            }
          </div>
        </div>
      </div>
    );
  }

  // 데이터가 오래된지 확인
  const isDataOld = weatherState.currentWeather && isOldWeatherData(weatherState.currentWeather.date);

  if (weatherState.isLoading && !weatherState.currentWeather) {
    return (
      <div className={`bg-[#1A1A1A]/40 backdrop-blur-sm rounded border border-[#FF1801]/10 p-4 ${className}`}>
        <div className="text-center">
          <div className="animate-spin w-6 h-6 border-2 border-[#FF1801] border-t-transparent rounded-full mx-auto mb-2" />
          <div className="text-sm text-[#C0C0C0]">
            {language === 'ko' ? '날씨 정보 로딩 중...' : 'Loading weather...'}
          </div>
        </div>
      </div>
    );
  }

  const weather = weatherState.currentWeather;
  if (!weather) return null;

  return (
    <div className={`bg-[#1A1A1A]/40 backdrop-blur-sm rounded border border-[#FF1801]/10 p-4 ${className}`}>
      <div className="text-center mb-4">
        <div className="text-[#C0C0C0] text-xs tracking-widest mb-2">
          {isDataOld ? 
            (language === 'ko' ? '과거 날씨 기록' : 'HISTORICAL WEATHER') : 
            (language === 'ko' ? '현재 날씨' : 'CURRENT WEATHER')
          }
        </div>
        {weatherState.lastUpdated && (
          <div className="text-[10px] text-[#C0C0C0]/70">
            {language === 'ko' ? '업데이트' : 'Updated'}: {formatTime(weatherState.lastUpdated, language)}
          </div>
        )}
        {weatherState.currentWeather && weatherState.currentWeather.date && (
          <div className={`text-[10px] ${isDataOld ? 'text-orange-400' : 'text-[#C0C0C0]/50'}`}>
            {language === 'ko' ? '데이터' : 'Data'}: {formatTimeAgo(weatherState.currentWeather.date, language)}
            {isDataOld && (
              <span className="ml-1">
                {language === 'ko' ? '(과거 기록)' : '(Historical)'}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* 기온 & 트랙온도 */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Thermometer className="w-4 h-4 text-[#FF1801]" />
            <div>
              <div className="text-sm text-[#C0C0C0]">
                {language === 'ko' ? '기온' : 'Air'}
              </div>
              <div className="text-lg font-bold text-white">
                {Math.round(weather.air_temperature)}°C
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 flex items-center justify-center">
              <div className="w-2 h-2 bg-[#FF1801] rounded-full" />
            </div>
            <div>
              <div className="text-sm text-[#C0C0C0]">
                {language === 'ko' ? '트랙' : 'Track'}
              </div>
              <div className="text-lg font-bold text-white">
                {Math.round(weather.track_temperature)}°C
              </div>
            </div>
          </div>
        </div>

        {/* 습도 & 강수 */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Droplets className="w-4 h-4 text-blue-400" />
            <div>
              <div className="text-sm text-[#C0C0C0]">
                {language === 'ko' ? '습도' : 'Humidity'}
              </div>
              <div className="text-lg font-bold text-white">
                {Math.round(weather.humidity)}%
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isRainy(weather.rainfall) ? (
              <CloudRain className="w-4 h-4 text-blue-500" />
            ) : (
              <Cloud className="w-4 h-4 text-[#C0C0C0]" />
            )}
            <div>
              <div className="text-sm text-[#C0C0C0]">
                {language === 'ko' ? '강수' : 'Rain'}
              </div>
              <div className="text-lg font-bold text-white">
                {isRainy(weather.rainfall) ? 
                  (language === 'ko' ? '있음' : 'Yes') : 
                  (language === 'ko' ? '없음' : 'No')
                }
              </div>
            </div>
          </div>
        </div>

        {/* 바람 */}
        <div className="col-span-2">
          <div className="flex items-center gap-2">
            <Wind className="w-4 h-4 text-[#C0C0C0]" />
            <div className="flex-1">
              <div className="text-sm text-[#C0C0C0]">
                {language === 'ko' ? '바람' : 'Wind'}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-white">
                  {Math.round(weather.wind_speed)} m/s
                </span>
                <span className="text-sm text-[#C0C0C0]">
                  {formatWindDirection(weather.wind_direction)}
                </span>
                <span className="text-lg">
                  {getWindIcon(weather.wind_speed)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 기압 */}
        <div className="col-span-2">
          <div className="flex items-center gap-2">
            <Gauge className="w-4 h-4 text-[#C0C0C0]" />
            <div>
              <div className="text-sm text-[#C0C0C0]">
                {language === 'ko' ? '기압' : 'Pressure'}
              </div>
              <div className="text-lg font-bold text-white">
                {Math.round(weather.pressure)} mbar
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};