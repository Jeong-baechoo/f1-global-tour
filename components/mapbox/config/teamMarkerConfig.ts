import { Driver, Car } from '../types';

// 팀 마커 시각적 설정
export interface TeamMarkerStyle {
  className: string;
  logoUrl: string;
  backgroundColor: string;
  borderColor: string;
  shadowColor: string;
  shadowColorHover: string;
}

// 팀 플라이투 설정
export interface TeamFlyToConfig {
  center?: [number, number]; // undefined면 팀 본부 좌표 사용
  zoom?: number;
  pitch?: number;
  bearing?: number;
  speed?: number;
  curve?: number;
  duration?: number;
}

// 팀 마커 전체 설정
export interface TeamMarkerConfig {
  teamId: string;
  style: TeamMarkerStyle;
  drivers2025: Driver[];
  car2025: Car;
  flyTo: TeamFlyToConfig;
}

// 기본 플라이투 설정
const DEFAULT_FLY_TO: TeamFlyToConfig = {
  zoom: 15.68,
  pitch: 45,
  bearing: 0,
  speed: 0.4,
  curve: 0.8,
  duration: 6000,
};

// 모든 팀 마커 설정
export const TEAM_MARKER_CONFIGS: Record<string, TeamMarkerConfig> = {
  'red-bull': {
    teamId: 'red-bull',
    style: {
      className: 'redbull-marker',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/de/thumb/c/c4/Red_Bull_Racing_logo.svg/200px-Red_Bull_Racing_logo.svg.png',
      backgroundColor: 'white',
      borderColor: '#1e3a8a',
      shadowColor: 'rgba(0,0,0,0.3)',
      shadowColorHover: 'rgba(0,0,0,0.4)',
    },
    drivers2025: [
      {
        name: "Max Verstappen",
        number: 1,
        nationality: "Dutch",
        image: "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/M/MAXVER01_Max_Verstappen/maxver01.png"
      },
      {
        name: "Yuki Tsunoda",
        number: 22,
        nationality: "Japanese",
        image: "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/Y/YUKTSU01_Yuki_Tsunoda/yuktsu01.png"
      }
    ],
    car2025: {
      name: "RB21",
      image: "https://media.formula1.com/d_team_car_fallback_image.png/content/dam/fom-website/teams/2024/red-bull-racing.png"
    },
    flyTo: {
      ...DEFAULT_FLY_TO,
      center: [-0.689, 52.0092], // 커스텀 좌표
    }
  },

  'ferrari': {
    teamId: 'ferrari',
    style: {
      className: 'ferrari-marker',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/de/thumb/c/c0/Scuderia_Ferrari_Logo.svg/200px-Scuderia_Ferrari_Logo.svg.png',
      backgroundColor: '#DC0000',
      borderColor: '#8B0000',
      shadowColor: 'rgba(220,0,0,0.4)',
      shadowColorHover: 'rgba(220,0,0,0.6)',
    },
    drivers2025: [
      {
        name: "Charles Leclerc",
        number: 16,
        nationality: "Monégasque",
        image: "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/C/CHALEC01_Charles_Leclerc/chalec01.png"
      },
      {
        name: "Lewis Hamilton",
        number: 44,
        nationality: "British",
        image: "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/L/LEWHAM01_Lewis_Hamilton/lewham01.png"
      }
    ],
    car2025: {
      name: "SF-25",
      image: "https://media.formula1.com/d_team_car_fallback_image.png/content/dam/fom-website/teams/2024/ferrari.png"
    },
    flyTo: DEFAULT_FLY_TO
  },

  'mercedes': {
    teamId: 'mercedes',
    style: {
      className: 'mercedes-marker',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fb/Mercedes_AMG_Petronas_F1_Logo.svg/200px-Mercedes_AMG_Petronas_F1_Logo.svg.png',
      backgroundColor: '#00D2BE',
      borderColor: '#008B8B',
      shadowColor: 'rgba(0,210,190,0.4)',
      shadowColorHover: 'rgba(0,210,190,0.6)',
    },
    drivers2025: [
      {
        name: "George Russell",
        number: 63,
        nationality: "British",
        image: "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/G/GEORUS01_George_Russell/georus01.png"
      },
      {
        name: "Kimi Antonelli",
        number: 12,
        nationality: "Italian",
        image: "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/2024/KIMANT01_Kimi_Antonelli/kimant01.png"
      }
    ],
    car2025: {
      name: "W16",
      image: "https://media.formula1.com/d_team_car_fallback_image.png/content/dam/fom-website/teams/2024/mercedes.png"
    },
    flyTo: DEFAULT_FLY_TO
  },

  'mclaren': {
    teamId: 'mclaren',
    style: {
      className: 'mclaren-marker',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/6/66/McLaren_Racing_logo.svg/200px-McLaren_Racing_logo.svg.png',
      backgroundColor: '#FF8700',
      borderColor: '#CC6600',
      shadowColor: 'rgba(255,135,0,0.4)',
      shadowColorHover: 'rgba(255,135,0,0.6)',
    },
    drivers2025: [
      {
        name: "Lando Norris",
        number: 4,
        nationality: "British",
        image: "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/L/LANNOR01_Lando_Norris/lannor01.png"
      },
      {
        name: "Oscar Piastri",
        number: 81,
        nationality: "Australian",
        image: "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/O/OSCPIA01_Oscar_Piastri/oscpia01.png"
      }
    ],
    car2025: {
      name: "MCL39",
      image: "https://media.formula1.com/d_team_car_fallback_image.png/content/dam/fom-website/teams/2024/mclaren.png"
    },
    flyTo: {
      ...DEFAULT_FLY_TO,
      center: [-0.5459, 51.3446],
      pitch: 49.5,
      bearing: 48.8,
    }
  },

  'aston-martin': {
    teamId: 'aston-martin',
    style: {
      className: 'aston-martin-marker',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Aston_Martin_Aramco_Cognizant_F1.svg/200px-Aston_Martin_Aramco_Cognizant_F1.svg.png',
      backgroundColor: '#006F62',
      borderColor: '#004d43',
      shadowColor: 'rgba(0,111,98,0.4)',
      shadowColorHover: 'rgba(0,111,98,0.6)',
    },
    drivers2025: [
      {
        name: "Fernando Alonso",
        number: 14,
        nationality: "Spanish",
        image: "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/F/FERALO01_Fernando_Alonso/feralo01.png"
      },
      {
        name: "Lance Stroll",
        number: 18,
        nationality: "Canadian",
        image: "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/L/LANSTR01_Lance_Stroll/lanstr01.png"
      }
    ],
    car2025: {
      name: "AMR25",
      image: "https://media.formula1.com/d_team_car_fallback_image.png/content/dam/fom-website/teams/2024/aston-martin.png"
    },
    flyTo: {
      ...DEFAULT_FLY_TO,
      center: [-1.0288, 52.0762],
      pitch: 49,
      bearing: 136,
    }
  },

  'alpine': {
    teamId: 'alpine',
    style: {
      className: 'alpine-marker',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/7/7e/Alpine_F1_Team_2021_Logo.svg/200px-Alpine_F1_Team_2021_Logo.svg.png',
      backgroundColor: '#0090FF',
      borderColor: '#0066CC',
      shadowColor: 'rgba(0,144,255,0.4)',
      shadowColorHover: 'rgba(0,144,255,0.6)',
    },
    drivers2025: [
      {
        name: "Pierre Gasly",
        number: 10,
        nationality: "French",
        image: "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/P/PIEGAS01_Pierre_Gasly/piegas01.png"
      },
      {
        name: "Franco Colapinto",
        number: 43,
        nationality: "Argentine",
        image: "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/2024/FRACOL01_Franco_Colapinto/fracol01.png"
      }
    ],
    car2025: {
      name: "A525",
      image: "https://media.formula1.com/d_team_car_fallback_image.png/content/dam/fom-website/teams/2024/alpine.png"
    },
    flyTo: DEFAULT_FLY_TO
  },

  'williams': {
    teamId: 'williams',
    style: {
      className: 'williams-marker',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/Williams_Racing_logo.svg/200px-Williams_Racing_logo.svg.png',
      backgroundColor: '#005AFF',
      borderColor: '#0044CC',
      shadowColor: 'rgba(0,90,255,0.4)',
      shadowColorHover: 'rgba(0,90,255,0.6)',
    },
    drivers2025: [
      {
        name: "Alex Albon",
        number: 23,
        nationality: "Thai",
        image: "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/A/ALEALB01_Alexander_Albon/alealb01.png"
      },
      {
        name: "Carlos Sainz Jr.",
        number: 55,
        nationality: "Spanish",
        image: "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/C/CARSAI01_Carlos_Sainz/carsai01.png"
      }
    ],
    car2025: {
      name: "FW47",
      image: "https://media.formula1.com/d_team_car_fallback_image.png/content/dam/fom-website/teams/2024/williams.png"
    },
    flyTo: DEFAULT_FLY_TO
  },

  'racing-bulls': {
    teamId: 'racing-bulls',
    style: {
      className: 'racing-bulls-marker',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/RB_F1_Team_logo.svg/200px-RB_F1_Team_logo.svg.png',
      backgroundColor: '#2B4562',
      borderColor: '#1a2b3d',
      shadowColor: 'rgba(43,69,98,0.4)',
      shadowColorHover: 'rgba(43,69,98,0.6)',
    },
    drivers2025: [
      {
        name: "Isack Hadjar",
        number: 6,
        nationality: "French",
        image: "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/2024/ISAHAD01_Isack_Hadjar/isahad01.png"
      },
      {
        name: "Liam Lawson",
        number: 30,
        nationality: "New Zealand",
        image: "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/L/LIALAW01_Liam_Lawson/lialaw01.png"
      }
    ],
    car2025: {
      name: "VCARB02",
      image: "https://media.formula1.com/d_team_car_fallback_image.png/content/dam/fom-website/teams/2024/rb.png"
    },
    flyTo: DEFAULT_FLY_TO
  },

  'alfa-romeo': {
    teamId: 'alfa-romeo',
    style: {
      className: 'sauber-marker',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Stake_F1_Team_Kick_Sauber_logo.svg/200px-Stake_F1_Team_Kick_Sauber_logo.svg.png',
      backgroundColor: '#57a316',
      borderColor: '#3d7010',
      shadowColor: 'rgba(87,163,22,0.4)',
      shadowColorHover: 'rgba(87,163,22,0.6)',
    },
    drivers2025: [
      {
        name: "Nico Hulkenberg",
        number: 27,
        nationality: "German",
        image: "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/N/NICHUL01_Nico_Hulkenberg/nichul01.png"
      },
      {
        name: "Gabriel Bortoleto",
        number: 5,
        nationality: "Brazilian",
        image: "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/2024/GABORT01_Gabriel_Bortoleto/gabort01.png"
      }
    ],
    car2025: {
      name: "C45",
      image: "https://media.formula1.com/d_team_car_fallback_image.png/content/dam/fom-website/teams/2024/kick-sauber.png"
    },
    flyTo: DEFAULT_FLY_TO
  },

  'haas': {
    teamId: 'haas',
    style: {
      className: 'haas-marker',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/01/Haas_F1_Team_logo.svg/200px-Haas_F1_Team_logo.svg.png',
      backgroundColor: '#B6BABD',
      borderColor: '#8a8e91',
      shadowColor: 'rgba(182,186,189,0.4)',
      shadowColorHover: 'rgba(182,186,189,0.6)',
    },
    drivers2025: [
      {
        name: "Esteban Ocon",
        number: 31,
        nationality: "French",
        image: "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/E/ESTOCO01_Esteban_Ocon/estoco01.png"
      },
      {
        name: "Oliver Bearman",
        number: 87,
        nationality: "British",
        image: "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/2024/OLIBEA01_Oliver_Bearman/olibea01.png"
      }
    ],
    car2025: {
      name: "VF-25",
      image: "https://media.formula1.com/d_team_car_fallback_image.png/content/dam/fom-website/teams/2024/haas.png"
    },
    flyTo: DEFAULT_FLY_TO
  }
};

// 팀 ID로 설정 가져오기
export const getTeamMarkerConfig = (teamId: string): TeamMarkerConfig | undefined => {
  return TEAM_MARKER_CONFIGS[teamId];
};

// 모든 팀 ID 목록
export const getAllTeamIds = (): string[] => {
  return Object.keys(TEAM_MARKER_CONFIGS);
};