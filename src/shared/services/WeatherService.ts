import { WeatherState, WeatherData } from '@/src/shared/types/weather';
import { openF1ApiService } from './F1ApiService';
import { 
  DEFAULT_UPDATE_INTERVAL,
  FALLBACK_MEETING_KEY,
  ERROR_MESSAGES,
  TIME_CONSTANTS
} from '../constants/weather';

class WeatherService {
  private static instance: WeatherService;
  private intervalId: NodeJS.Timeout | null = null;
  private subscribers: Array<(state: WeatherState) => void> = [];
  private state: WeatherState = {
    currentWeather: null,
    isLoading: false,
    error: null,
    lastUpdated: null
  };

  static getInstance(): WeatherService {
    if (!WeatherService.instance) {
      WeatherService.instance = new WeatherService();
    }
    return WeatherService.instance;
  }

  subscribe(callback: (state: WeatherState) => void): () => void {
    this.subscribers.push(callback);
    callback(this.state);
    
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }

  private notifySubscribers(): void {
    this.subscribers.forEach(callback => callback(this.state));
  }

  private updateState(updates: Partial<WeatherState>): void {
    this.state = { ...this.state, ...updates };
    this.notifySubscribers();
  }

  async fetchWeatherData(meetingKey?: number): Promise<void> {
    this.updateState({ isLoading: true, error: null });

    try {
      let currentMeetingKey = meetingKey;
      
      if (!currentMeetingKey) {
        // API 타임아웃 시 조용히 처리하고 중단
        try {
          currentMeetingKey = await openF1ApiService.getCurrentMeetingKey();
        } catch {
          console.warn('Weather service: OpenF1 API unavailable, skipping weather update');
          this.updateState({
            currentWeather: null,
            isLoading: false,
            error: ERROR_MESSAGES.DATA_NOT_READY,
            lastUpdated: new Date()
          });
          return;
        }
      }

      // meeting_key가 없으면 에러 처리
      if (!currentMeetingKey) {
        this.updateState({
          currentWeather: null,
          isLoading: false,
          error: ERROR_MESSAGES.NO_RACE_INFO,
          lastUpdated: new Date()
        });
        return;
      }

      const weatherData = await openF1ApiService.getWeatherData(currentMeetingKey);
      const errorMessage = this.determineErrorMessage(weatherData, currentMeetingKey);
      
      this.updateState({
        currentWeather: weatherData,
        isLoading: false,
        error: errorMessage,
        lastUpdated: new Date()
      });
    } catch (error) {
      this.updateState({
        isLoading: false,
        error: error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN_ERROR
      });
    }
  }

  /**
   * 날씨 데이터 상태에 따른 에러 메시지 결정
   */
  private determineErrorMessage(weatherData: WeatherData | null, meetingKey: number): string | null {
    if (!weatherData) {
      return meetingKey !== FALLBACK_MEETING_KEY 
        ? ERROR_MESSAGES.DATA_NOT_READY
        : ERROR_MESSAGES.F1_WEEKEND_ONLY;
    }
    return null;
  }

  startAutoUpdate(intervalMinutes: number = DEFAULT_UPDATE_INTERVAL, meetingKey?: number): void {
    this.stopAutoUpdate();
    
    this.fetchWeatherData(meetingKey);
    
    this.intervalId = setInterval(() => {
      this.fetchWeatherData(meetingKey);
    }, intervalMinutes * TIME_CONSTANTS.MINUTES_IN_MILLISECOND);
  }

  stopAutoUpdate(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  getCurrentState(): WeatherState {
    return this.state;
  }

  // 유틸리티 함수들은 별도 파일로 분리되었으므로 제거
  // formatWindDirection, isRainy는 weatherUtils에서 import해서 사용
}

export const weatherService = WeatherService.getInstance();