import { ReplaySessionData, ReplayDriverData, ReplayLapData } from '../types';

export const mockSessions: ReplaySessionData[] = [
  {
    sessionKey: 9161,
    sessionName: 'Race',
    sessionType: 'Race',
    circuitShortName: 'Monaco',
    countryName: 'Monaco',
    year: 2024,
    dateStart: '2024-05-26T13:00:00Z',
    dateEnd: '2024-05-26T15:30:00Z'
  },
  {
    sessionKey: 9159,
    sessionName: 'Qualifying',
    sessionType: 'Qualifying',
    circuitShortName: 'Monaco',
    countryName: 'Monaco',
    year: 2024,
    dateStart: '2024-05-25T14:00:00Z',
    dateEnd: '2024-05-25T15:00:00Z'
  },
  {
    sessionKey: 9160,
    sessionName: 'Practice 3',
    sessionType: 'Practice',
    circuitShortName: 'Monaco',
    countryName: 'Monaco',
    year: 2024,
    dateStart: '2024-05-25T10:30:00Z',
    dateEnd: '2024-05-25T11:30:00Z'
  }
];

export const mockDrivers: ReplayDriverData[] = [
  {
    driverNumber: 1,
    name: 'Max Verstappen',
    nameAcronym: 'VER',
    teamName: 'Red Bull Racing',
    teamColor: '3671C6',
    broadcastName: 'M VERSTAPPEN',
    countryCode: 'NED'
  },
  {
    driverNumber: 11,
    name: 'Sergio Perez',
    nameAcronym: 'PER',
    teamName: 'Red Bull Racing',
    teamColor: '3671C6',
    broadcastName: 'S PEREZ',
    countryCode: 'MEX'
  },
  {
    driverNumber: 16,
    name: 'Charles Leclerc',
    nameAcronym: 'LEC',
    teamName: 'Ferrari',
    teamColor: 'E8002D',
    broadcastName: 'C LECLERC',
    countryCode: 'MON'
  },
  {
    driverNumber: 55,
    name: 'Carlos Sainz',
    nameAcronym: 'SAI',
    teamName: 'Ferrari',
    teamColor: 'E8002D',
    broadcastName: 'C SAINZ',
    countryCode: 'ESP'
  },
  {
    driverNumber: 44,
    name: 'Lewis Hamilton',
    nameAcronym: 'HAM',
    teamName: 'Mercedes',
    teamColor: '27F4D2',
    broadcastName: 'L HAMILTON',
    countryCode: 'GBR'
  },
  {
    driverNumber: 63,
    name: 'George Russell',
    nameAcronym: 'RUS',
    teamName: 'Mercedes',
    teamColor: '27F4D2',
    broadcastName: 'G RUSSELL',
    countryCode: 'GBR'
  },
  {
    driverNumber: 4,
    name: 'Lando Norris',
    nameAcronym: 'NOR',
    teamName: 'McLaren',
    teamColor: 'FF8000',
    broadcastName: 'L NORRIS',
    countryCode: 'GBR'
  },
  {
    driverNumber: 81,
    name: 'Oscar Piastri',
    nameAcronym: 'PIA',
    teamName: 'McLaren',
    teamColor: 'FF8000',
    broadcastName: 'O PIASTRI',
    countryCode: 'AUS'
  }
];

export const mockLaps: ReplayLapData[] = [
  // Max Verstappen 랩 데이터
  {
    driverNumber: 1,
    lapNumber: 1,
    lapDuration: 85.123,
    lapStartTime: 0,
    sectorTimes: [28.345, 29.123, 27.655],
    isPitOutLap: false
  },
  {
    driverNumber: 1,
    lapNumber: 2,
    lapDuration: 82.456,
    lapStartTime: 85.123,
    sectorTimes: [27.123, 28.456, 26.877],
    isPitOutLap: false
  },
  {
    driverNumber: 1,
    lapNumber: 3,
    lapDuration: 81.987,
    lapStartTime: 167.579,
    sectorTimes: [26.987, 28.234, 26.766],
    isPitOutLap: false
  },
  // Charles Leclerc 랩 데이터
  {
    driverNumber: 16,
    lapNumber: 1,
    lapDuration: 86.234,
    lapStartTime: 0,
    sectorTimes: [28.567, 29.345, 28.322],
    isPitOutLap: false
  },
  {
    driverNumber: 16,
    lapNumber: 2,
    lapDuration: 83.123,
    lapStartTime: 86.234,
    sectorTimes: [27.345, 28.678, 27.100],
    isPitOutLap: false
  },
  {
    driverNumber: 16,
    lapNumber: 3,
    lapDuration: 82.567,
    lapStartTime: 169.357,
    sectorTimes: [27.123, 28.234, 27.210],
    isPitOutLap: false
  },
  // Lewis Hamilton 랩 데이터
  {
    driverNumber: 44,
    lapNumber: 1,
    lapDuration: 87.345,
    lapStartTime: 0,
    sectorTimes: [29.123, 29.567, 28.655],
    isPitOutLap: false
  },
  {
    driverNumber: 44,
    lapNumber: 2,
    lapDuration: 84.234,
    lapStartTime: 87.345,
    sectorTimes: [27.789, 28.890, 27.555],
    isPitOutLap: false
  },
  {
    driverNumber: 44,
    lapNumber: 3,
    lapDuration: 83.678,
    lapStartTime: 171.579,
    sectorTimes: [27.456, 28.567, 27.655],
    isPitOutLap: false
  }
];

// 개발 모드 체크 함수
export const isDevelopmentMode = (): boolean => {
  return process.env.NODE_ENV === 'development';
};

// Mock 데이터를 강제로 사용할지 결정 (실제 API 호출 전에 체크)
export const shouldForceMockData = (): boolean => {
  // 환경변수로 강제 목 데이터 사용 설정 가능
  return process.env.NEXT_PUBLIC_FORCE_MOCK_DATA === 'true';
};