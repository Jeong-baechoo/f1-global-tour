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
  },
  {
    driverNumber: 14,
    name: 'Fernando Alonso',
    nameAcronym: 'ALO',
    teamName: 'Aston Martin',
    teamColor: '229971',
    broadcastName: 'F ALONSO',
    countryCode: 'ESP'
  },
  {
    driverNumber: 18,
    name: 'Lance Stroll',
    nameAcronym: 'STR',
    teamName: 'Aston Martin',
    teamColor: '229971',
    broadcastName: 'L STROLL',
    countryCode: 'CAN'
  },
  {
    driverNumber: 10,
    name: 'Pierre Gasly',
    nameAcronym: 'GAS',
    teamName: 'Alpine',
    teamColor: '0093CC',
    broadcastName: 'P GASLY',
    countryCode: 'FRA'
  },
  {
    driverNumber: 31,
    name: 'Esteban Ocon',
    nameAcronym: 'OCO',
    teamName: 'Alpine',
    teamColor: '0093CC',
    broadcastName: 'E OCON',
    countryCode: 'FRA'
  },
  {
    driverNumber: 23,
    name: 'Alexander Albon',
    nameAcronym: 'ALB',
    teamName: 'Williams',
    teamColor: '64C4FF',
    broadcastName: 'A ALBON',
    countryCode: 'THA'
  },
  {
    driverNumber: 2,
    name: 'Logan Sargeant',
    nameAcronym: 'SAR',
    teamName: 'Williams',
    teamColor: '64C4FF',
    broadcastName: 'L SARGEANT',
    countryCode: 'USA'
  },
  {
    driverNumber: 77,
    name: 'Valtteri Bottas',
    nameAcronym: 'BOT',
    teamName: 'Alfa Romeo',
    teamColor: 'C92D4B',
    broadcastName: 'V BOTTAS',
    countryCode: 'FIN'
  },
  {
    driverNumber: 24,
    name: 'Zhou Guanyu',
    nameAcronym: 'ZHO',
    teamName: 'Alfa Romeo',
    teamColor: 'C92D4B',
    broadcastName: 'G ZHOU',
    countryCode: 'CHN'
  },
  {
    driverNumber: 20,
    name: 'Kevin Magnussen',
    nameAcronym: 'MAG',
    teamName: 'Haas',
    teamColor: 'FFFFFF',
    broadcastName: 'K MAGNUSSEN',
    countryCode: 'DEN'
  },
  {
    driverNumber: 27,
    name: 'Nico Hulkenberg',
    nameAcronym: 'HUL',
    teamName: 'Haas',
    teamColor: 'FFFFFF',
    broadcastName: 'N HULKENBERG',
    countryCode: 'GER'
  },
  {
    driverNumber: 3,
    name: 'Daniel Ricciardo',
    nameAcronym: 'RIC',
    teamName: 'AlphaTauri',
    teamColor: '4E7C9B',
    broadcastName: 'D RICCIARDO',
    countryCode: 'AUS'
  },
  {
    driverNumber: 22,
    name: 'Yuki Tsunoda',
    nameAcronym: 'TSU',
    teamName: 'AlphaTauri',
    teamColor: '4E7C9B',
    broadcastName: 'Y TSUNODA',
    countryCode: 'JPN'
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
  },
  
  // Sergio Perez 랩 데이터
  {
    driverNumber: 11,
    lapNumber: 1,
    lapDuration: 86.789,
    lapStartTime: 0,
    sectorTimes: [28.789, 29.456, 28.544],
    isPitOutLap: false
  },
  {
    driverNumber: 11,
    lapNumber: 2,
    lapDuration: 83.567,
    lapStartTime: 86.789,
    sectorTimes: [27.456, 28.789, 27.322],
    isPitOutLap: false
  },
  {
    driverNumber: 11,
    lapNumber: 3,
    lapDuration: 82.890,
    lapStartTime: 170.356,
    sectorTimes: [27.234, 28.456, 27.200],
    isPitOutLap: false
  },

  // Carlos Sainz 랩 데이터
  {
    driverNumber: 55,
    lapNumber: 1,
    lapDuration: 87.123,
    lapStartTime: 0,
    sectorTimes: [29.012, 29.678, 28.433],
    isPitOutLap: false
  },
  {
    driverNumber: 55,
    lapNumber: 2,
    lapDuration: 84.567,
    lapStartTime: 87.123,
    sectorTimes: [27.678, 28.945, 27.944],
    isPitOutLap: false
  },
  {
    driverNumber: 55,
    lapNumber: 3,
    lapDuration: 83.234,
    lapStartTime: 171.690,
    sectorTimes: [27.345, 28.567, 27.322],
    isPitOutLap: false
  },

  // George Russell 랩 데이터
  {
    driverNumber: 63,
    lapNumber: 1,
    lapDuration: 86.567,
    lapStartTime: 0,
    sectorTimes: [28.678, 29.234, 28.655],
    isPitOutLap: false
  },
  {
    driverNumber: 63,
    lapNumber: 2,
    lapDuration: 83.890,
    lapStartTime: 86.567,
    sectorTimes: [27.567, 28.678, 27.645],
    isPitOutLap: false
  },
  {
    driverNumber: 63,
    lapNumber: 3,
    lapDuration: 83.123,
    lapStartTime: 170.457,
    sectorTimes: [27.234, 28.445, 27.444],
    isPitOutLap: false
  },

  // Lando Norris 랩 데이터
  {
    driverNumber: 4,
    lapNumber: 1,
    lapDuration: 85.890,
    lapStartTime: 0,
    sectorTimes: [28.456, 29.012, 28.422],
    isPitOutLap: false
  },
  {
    driverNumber: 4,
    lapNumber: 2,
    lapDuration: 82.789,
    lapStartTime: 85.890,
    sectorTimes: [27.234, 28.345, 27.210],
    isPitOutLap: false
  },
  {
    driverNumber: 4,
    lapNumber: 3,
    lapDuration: 82.456,
    lapStartTime: 168.679,
    sectorTimes: [27.123, 28.123, 27.210],
    isPitOutLap: false
  },

  // Oscar Piastri 랩 데이터
  {
    driverNumber: 81,
    lapNumber: 1,
    lapDuration: 87.567,
    lapStartTime: 0,
    sectorTimes: [29.234, 29.789, 28.544],
    isPitOutLap: false
  },
  {
    driverNumber: 81,
    lapNumber: 2,
    lapDuration: 84.890,
    lapStartTime: 87.567,
    sectorTimes: [27.789, 29.012, 28.089],
    isPitOutLap: false
  },
  {
    driverNumber: 81,
    lapNumber: 3,
    lapDuration: 84.123,
    lapStartTime: 172.457,
    sectorTimes: [27.456, 28.678, 27.989],
    isPitOutLap: false
  },

  // Fernando Alonso 랩 데이터
  {
    driverNumber: 14,
    lapNumber: 1,
    lapDuration: 87.890,
    lapStartTime: 0,
    sectorTimes: [29.123, 30.234, 28.533],
    isPitOutLap: false
  },
  {
    driverNumber: 14,
    lapNumber: 2,
    lapDuration: 85.234,
    lapStartTime: 87.890,
    sectorTimes: [28.123, 29.456, 27.655],
    isPitOutLap: false
  },
  {
    driverNumber: 14,
    lapNumber: 3,
    lapDuration: 84.567,
    lapStartTime: 173.124,
    sectorTimes: [27.890, 28.945, 27.732],
    isPitOutLap: false
  },

  // Lance Stroll 랩 데이터
  {
    driverNumber: 18,
    lapNumber: 1,
    lapDuration: 88.456,
    lapStartTime: 0,
    sectorTimes: [29.456, 30.567, 28.433],
    isPitOutLap: false
  },
  {
    driverNumber: 18,
    lapNumber: 2,
    lapDuration: 85.789,
    lapStartTime: 88.456,
    sectorTimes: [28.345, 29.678, 27.766],
    isPitOutLap: false
  },
  {
    driverNumber: 18,
    lapNumber: 3,
    lapDuration: 85.123,
    lapStartTime: 174.245,
    sectorTimes: [28.123, 29.234, 27.766],
    isPitOutLap: false
  },

  // Pierre Gasly 랩 데이터
  {
    driverNumber: 10,
    lapNumber: 1,
    lapDuration: 88.123,
    lapStartTime: 0,
    sectorTimes: [29.234, 30.345, 28.544],
    isPitOutLap: false
  },
  {
    driverNumber: 10,
    lapNumber: 2,
    lapDuration: 85.456,
    lapStartTime: 88.123,
    sectorTimes: [28.234, 29.567, 27.655],
    isPitOutLap: false
  },
  {
    driverNumber: 10,
    lapNumber: 3,
    lapDuration: 84.890,
    lapStartTime: 173.579,
    sectorTimes: [27.967, 29.123, 27.800],
    isPitOutLap: false
  },

  // Esteban Ocon 랩 데이터
  {
    driverNumber: 31,
    lapNumber: 1,
    lapDuration: 88.567,
    lapStartTime: 0,
    sectorTimes: [29.345, 30.456, 28.766],
    isPitOutLap: false
  },
  {
    driverNumber: 31,
    lapNumber: 2,
    lapDuration: 85.890,
    lapStartTime: 88.567,
    sectorTimes: [28.456, 29.789, 27.645],
    isPitOutLap: false
  },
  {
    driverNumber: 31,
    lapNumber: 3,
    lapDuration: 85.234,
    lapStartTime: 174.457,
    sectorTimes: [28.234, 29.345, 27.655],
    isPitOutLap: false
  },

  // Alexander Albon 랩 데이터
  {
    driverNumber: 23,
    lapNumber: 1,
    lapDuration: 89.123,
    lapStartTime: 0,
    sectorTimes: [29.567, 30.678, 28.878],
    isPitOutLap: false
  },
  {
    driverNumber: 23,
    lapNumber: 2,
    lapDuration: 86.456,
    lapStartTime: 89.123,
    sectorTimes: [28.567, 29.890, 27.999],
    isPitOutLap: false
  },
  {
    driverNumber: 23,
    lapNumber: 3,
    lapDuration: 85.789,
    lapStartTime: 175.579,
    sectorTimes: [28.345, 29.456, 27.988],
    isPitOutLap: false
  },

  // Logan Sargeant 랩 데이터
  {
    driverNumber: 2,
    lapNumber: 1,
    lapDuration: 89.789,
    lapStartTime: 0,
    sectorTimes: [29.789, 30.890, 29.110],
    isPitOutLap: false
  },
  {
    driverNumber: 2,
    lapNumber: 2,
    lapDuration: 87.123,
    lapStartTime: 89.789,
    sectorTimes: [28.789, 30.123, 28.211],
    isPitOutLap: false
  },
  {
    driverNumber: 2,
    lapNumber: 3,
    lapDuration: 86.567,
    lapStartTime: 176.912,
    sectorTimes: [28.567, 29.789, 28.211],
    isPitOutLap: false
  },

  // Valtteri Bottas 랩 데이터
  {
    driverNumber: 77,
    lapNumber: 1,
    lapDuration: 88.234,
    lapStartTime: 0,
    sectorTimes: [29.345, 30.234, 28.655],
    isPitOutLap: false
  },
  {
    driverNumber: 77,
    lapNumber: 2,
    lapDuration: 85.567,
    lapStartTime: 88.234,
    sectorTimes: [28.345, 29.678, 27.544],
    isPitOutLap: false
  },
  {
    driverNumber: 77,
    lapNumber: 3,
    lapDuration: 85.123,
    lapStartTime: 173.801,
    sectorTimes: [28.123, 29.345, 27.655],
    isPitOutLap: false
  },

  // Zhou Guanyu 랩 데이터
  {
    driverNumber: 24,
    lapNumber: 1,
    lapDuration: 89.456,
    lapStartTime: 0,
    sectorTimes: [29.678, 30.567, 29.211],
    isPitOutLap: false
  },
  {
    driverNumber: 24,
    lapNumber: 2,
    lapDuration: 86.789,
    lapStartTime: 89.456,
    sectorTimes: [28.678, 29.890, 28.221],
    isPitOutLap: false
  },
  {
    driverNumber: 24,
    lapNumber: 3,
    lapDuration: 86.234,
    lapStartTime: 176.245,
    sectorTimes: [28.456, 29.567, 28.211],
    isPitOutLap: false
  },

  // Kevin Magnussen 랩 데이터
  {
    driverNumber: 20,
    lapNumber: 1,
    lapDuration: 88.890,
    lapStartTime: 0,
    sectorTimes: [29.456, 30.345, 29.089],
    isPitOutLap: false
  },
  {
    driverNumber: 20,
    lapNumber: 2,
    lapDuration: 86.234,
    lapStartTime: 88.890,
    sectorTimes: [28.456, 29.789, 27.989],
    isPitOutLap: false
  },
  {
    driverNumber: 20,
    lapNumber: 3,
    lapDuration: 85.678,
    lapStartTime: 175.124,
    sectorTimes: [28.234, 29.456, 27.988],
    isPitOutLap: false
  },

  // Nico Hulkenberg 랩 데이터
  {
    driverNumber: 27,
    lapNumber: 1,
    lapDuration: 88.567,
    lapStartTime: 0,
    sectorTimes: [29.234, 30.123, 29.210],
    isPitOutLap: false
  },
  {
    driverNumber: 27,
    lapNumber: 2,
    lapDuration: 85.890,
    lapStartTime: 88.567,
    sectorTimes: [28.345, 29.567, 27.978],
    isPitOutLap: false
  },
  {
    driverNumber: 27,
    lapNumber: 3,
    lapDuration: 85.456,
    lapStartTime: 174.457,
    sectorTimes: [28.123, 29.234, 28.099],
    isPitOutLap: false
  },

  // Daniel Ricciardo 랩 데이터
  {
    driverNumber: 3,
    lapNumber: 1,
    lapDuration: 88.678,
    lapStartTime: 0,
    sectorTimes: [29.345, 30.234, 29.099],
    isPitOutLap: false
  },
  {
    driverNumber: 3,
    lapNumber: 2,
    lapDuration: 86.123,
    lapStartTime: 88.678,
    sectorTimes: [28.456, 29.678, 27.989],
    isPitOutLap: false
  },
  {
    driverNumber: 3,
    lapNumber: 3,
    lapDuration: 85.789,
    lapStartTime: 174.801,
    sectorTimes: [28.234, 29.345, 28.210],
    isPitOutLap: false
  },

  // Yuki Tsunoda 랩 데이터
  {
    driverNumber: 22,
    lapNumber: 1,
    lapDuration: 88.345,
    lapStartTime: 0,
    sectorTimes: [29.123, 30.012, 29.210],
    isPitOutLap: false
  },
  {
    driverNumber: 22,
    lapNumber: 2,
    lapDuration: 85.678,
    lapStartTime: 88.345,
    sectorTimes: [28.234, 29.456, 27.988],
    isPitOutLap: false
  },
  {
    driverNumber: 22,
    lapNumber: 3,
    lapDuration: 85.234,
    lapStartTime: 174.023,
    sectorTimes: [28.012, 29.123, 28.099],
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