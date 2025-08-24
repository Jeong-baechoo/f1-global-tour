import { 
  ReplaySessionData, 
  ReplayDriverData, 
  ReplayLapData,
  ApiResponse 
} from '../types';
import { mockSessions, mockDrivers, mockLaps } from '../data/mockData';

export class MockDataProvider {
  private static instance: MockDataProvider;

  static getInstance(): MockDataProvider {
    if (!MockDataProvider.instance) {
      MockDataProvider.instance = new MockDataProvider();
    }
    return MockDataProvider.instance;
  }

  async getSessions(year: number, countryName?: string): Promise<ApiResponse<ReplaySessionData[]>> {
    console.log('Using mock session data');
    return new Promise((resolve) => {
      setTimeout(() => {
        let filteredSessions = mockSessions.filter(session => session.year === year);
        
        if (countryName) {
          filteredSessions = filteredSessions.filter(session => 
            session.countryName.toLowerCase().includes(countryName.toLowerCase())
          );
        }
        
        resolve({
          data: filteredSessions,
          success: true
        });
      }, 500);
    });
  }

  async getDrivers(sessionKey: number): Promise<ApiResponse<ReplayDriverData[]>> {
    console.log('Using mock driver data for session:', sessionKey);
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          data: mockDrivers,
          success: true
        });
      }, 300);
    });
  }

  async getLaps(
    sessionKey: number,
    driverNumber?: number,
    lapNumber?: number
  ): Promise<ApiResponse<ReplayLapData[]>> {
    console.log('Using mock lap data for session:', sessionKey, 'driver:', driverNumber, 'lap:', lapNumber);
    return new Promise((resolve) => {
      setTimeout(() => {
        let filteredLaps = mockLaps;
        
        if (driverNumber !== undefined) {
          filteredLaps = filteredLaps.filter(lap => lap.driverNumber === driverNumber);
        }
        
        if (lapNumber !== undefined) {
          filteredLaps = filteredLaps.filter(lap => lap.lapNumber === lapNumber);
        }
        
        resolve({
          data: filteredLaps,
          success: true
        });
      }, 400);
    });
  }

  async getFullRaceData(sessionKey: number): Promise<ApiResponse<{
    drivers: ReplayDriverData[];
    laps: ReplayLapData[];
  }>> {
    try {
      const [driversResponse, lapsResponse] = await Promise.all([
        this.getDrivers(sessionKey),
        this.getLaps(sessionKey)
      ]);

      if (!driversResponse.success || !lapsResponse.success) {
        return {
          data: { drivers: [], laps: [] },
          success: false,
          error: {
            code: 'MOCK_DATA_ERROR',
            message: 'Failed to fetch mock race data',
            details: 'One or more data sources failed'
          }
        };
      }

      return {
        data: {
          drivers: driversResponse.data,
          laps: lapsResponse.data
        },
        success: true
      };
    } catch (error) {
      return {
        data: { drivers: [], laps: [] },
        success: false,
        error: {
          code: 'MOCK_DATA_ERROR',
          message: 'Failed to fetch mock race data',
          details: error
        }
      };
    }
  }
}