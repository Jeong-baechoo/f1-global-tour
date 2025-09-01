import { DriverTiming } from './types';
import { DriverTimingService } from '../../../services/DriverTimingService';

// 기존 정적 mock 데이터 (백업용)
export const staticMockDriverTimings: DriverTiming[] = [
  {
    position: 1,
    driverCode: 'PIA',
    teamColor: '#FF8000', // McLaren Orange
    interval: '--',
    intervalToAhead: '',
    currentLapTime: '1:14.119',
    bestLapTime: '1:13.965',
    miniSector: {
      sector1: 'normal',
      sector2: 'normal', 
      sector3: 'personal_best'
    },
    tireInfo: {
      pitStops: 1,
      lapCount: 20,
      compound: 'MEDIUM'
    }
  },
  {
    position: 2,
    driverCode: 'NOR',
    teamColor: '#FF8000', // McLaren Orange
    interval: '+1.290',
    intervalToAhead: '+1.290',
    currentLapTime: '1:14.170',
    bestLapTime: '1:13.908',
    miniSector: {
      sector1: 'normal',
      sector2: 'normal',
      sector3: 'slow'
    },
    tireInfo: {
      pitStops: 1,
      lapCount: 20,
      compound: 'MEDIUM'
    }
  },
  {
    position: 3,
    driverCode: 'VER',
    teamColor: '#3671C6', // Red Bull Blue
    interval: '+7.499',
    intervalToAhead: '+8.707',
    currentLapTime: '1:14.944',
    bestLapTime: '1:14.746',
    miniSector: {
      sector1: 'normal',
      sector2: 'normal',
      sector3: 'personal_best'
    },
    tireInfo: {
      pitStops: 1,
      lapCount: 20,
      compound: 'MEDIUM'
    }
  },
  {
    position: 4,
    driverCode: 'HAD',
    teamColor: '#3671C6', // Red Bull Blue  
    interval: '+1.877',
    intervalToAhead: '+10.584',
    currentLapTime: '1:15.063',
    bestLapTime: '1:14.533',
    miniSector: {
      sector1: 'normal',
      sector2: 'normal',
      sector3: 'personal_best'
    },
    tireInfo: {
      pitStops: 1,
      lapCount: 20,
      compound: 'MEDIUM'
    }
  },
  {
    position: 5,
    driverCode: 'LEC',
    teamColor: '#F91536', // Ferrari Red
    interval: '+2.057',
    intervalToAhead: '+12.574',
    currentLapTime: '1:14.982',
    bestLapTime: '1:14.557',
    miniSector: {
      sector1: 'normal',
      sector2: 'normal',
      sector3: 'slow'
    },
    tireInfo: {
      pitStops: 1,
      lapCount: 21,
      compound: 'MEDIUM'
    }
  },
  {
    position: 6,
    driverCode: 'ANT',
    teamColor: '#2ECC40', // Aston Martin Green
    interval: '+2.992',
    intervalToAhead: '+15.569',
    currentLapTime: '1:14.791',
    bestLapTime: '1:14.692',
    miniSector: {
      sector1: 'normal',
      sector2: 'normal',
      sector3: 'slow'
    },
    tireInfo: {
      pitStops: 1,
      lapCount: 20,
      compound: 'MEDIUM'
    }
  },
  {
    position: 7,
    driverCode: 'RUS',
    teamColor: '#2ECC40', // Mercedes Teal (approximated as green)
    interval: '+3.586',
    intervalToAhead: '+19.155',
    currentLapTime: '1:15.783',
    bestLapTime: '1:15.056',
    miniSector: {
      sector1: 'normal',
      sector2: 'normal',
      sector3: 'slow'
    },
    tireInfo: {
      pitStops: 1,
      lapCount: 20,
      compound: 'MEDIUM'
    }
  },
  {
    position: 8,
    driverCode: 'ALB',
    teamColor: '#3671C6', // Williams Blue
    interval: '+3.474',
    intervalToAhead: '+22.485',
    currentLapTime: '1:15.602',
    bestLapTime: '1:15.244',
    miniSector: {
      sector1: 'normal',
      sector2: 'normal',
      sector3: 'slow'
    },
    tireInfo: {
      pitStops: 1,
      lapCount: 20,
      compound: 'MEDIUM'
    }
  },
  {
    position: 9,
    driverCode: 'STR',
    teamColor: '#2ECC40', // Aston Martin Green
    interval: '+9.636',
    intervalToAhead: '+31.567',
    currentLapTime: '1:16.379',
    bestLapTime: '1:15.242',
    miniSector: {
      sector1: 'normal',
      sector2: 'slow',
      sector3: 'slow'
    },
    tireInfo: {
      pitStops: 1,
      lapCount: 35,
      compound: 'HARD'
    }
  },
  {
    position: 10,
    driverCode: 'OCO',
    teamColor: '#808080', // Alpine/Haas Gray
    interval: '+3.084',
    intervalToAhead: '+34.670',
    currentLapTime: '1:16.231',
    bestLapTime: '1:15.634',
    miniSector: {
      sector1: 'normal',
      sector2: 'slow',
      sector3: 'slow'
    },
    tireInfo: {
      pitStops: -1,
      lapCount: 43,
      compound: 'HARD'
    }
  },
  {
    position: 11,
    driverCode: 'BEA',
    teamColor: '#808080', // Haas Gray
    interval: '+0.750',
    intervalToAhead: '+35.420',
    currentLapTime: '1:16.593',
    bestLapTime: '1:15.744',
    miniSector: {
      sector1: 'normal',
      sector2: 'slow',
      sector3: 'slow'
    },
    tireInfo: {
      pitStops: 1,
      lapCount: 43,
      compound: 'HARD'
    }
  },
  {
    position: 12,
    driverCode: 'TSU',
    teamColor: '#3671C6', // AlphaTauri Blue
    interval: '+0.836',
    intervalToAhead: '+36.256',
    currentLapTime: '1:16.405',
    bestLapTime: '1:15.319',
    miniSector: {
      sector1: 'normal',
      sector2: 'slow',
      sector3: 'slow'
    },
    tireInfo: {
      pitStops: 1,
      lapCount: 24,
      compound: 'MEDIUM'
    }
  },
  {
    position: 13,
    driverCode: 'GAS',
    teamColor: '#3671C6', // Alpine Blue
    interval: '+0.610',
    intervalToAhead: '+36.866',
    currentLapTime: '1:16.536',
    bestLapTime: '1:15.800',
    miniSector: {
      sector1: 'normal',
      sector2: 'slow',
      sector3: 'slow'
    },
    tireInfo: {
      pitStops: 1,
      lapCount: 20,
      compound: 'MEDIUM'
    }
  },
  {
    position: 14,
    driverCode: 'COL',
    teamColor: '#3671C6', // Williams Blue
    interval: '+0.799',
    intervalToAhead: '+37.785',
    currentLapTime: '1:16.477',
    bestLapTime: '1:15.340',
    miniSector: {
      sector1: 'normal',
      sector2: 'personal_best',
      sector3: 'slow'
    },
    tireInfo: {
      pitStops: 1,
      lapCount: 24,
      compound: 'MEDIUM'
    }
  },
  {
    position: 15,
    driverCode: 'BOR',
    teamColor: '#2ECC40', // Kick Sauber Green
    interval: '+0.793',
    intervalToAhead: '+38.578',
    currentLapTime: '1:16.614',
    bestLapTime: '1:15.653',
    miniSector: {
      sector1: 'normal',
      sector2: 'personal_best',
      sector3: 'slow'
    },
    tireInfo: {
      pitStops: 1,
      lapCount: 21,
      compound: 'MEDIUM'
    }
  }
];

// 동적 드라이버 타이밍 데이터 생성 함수
export const getDriverTimings = (currentLap?: number): DriverTiming[] => {
  const driverTimingService = DriverTimingService.getInstance();
  
  try {
    // 현재 랩이 제공되면 서비스에 설정
    if (currentLap && currentLap > 0) {
      driverTimingService.setCurrentLap(currentLap);
    }
    
    // DriverTimingService에서 현재 랩 데이터를 기반으로 드라이버 타이밍 생성
    const dynamicTimings = driverTimingService.generateCurrentDriverTimings();
    
    // 동적 데이터가 있으면 반환, 없으면 정적 데이터 반환
    if (dynamicTimings.length > 0) {
      return dynamicTimings;
    }
  } catch (error) {
    console.warn('Dynamic driver timing generation failed, using static data:', error);
  }
  
  // 동적 데이터 생성에 실패하면 정적 데이터 반환
  return staticMockDriverTimings;
};

// 기본 export (하위 호환성을 위해)
export const mockDriverTimings = getDriverTimings();