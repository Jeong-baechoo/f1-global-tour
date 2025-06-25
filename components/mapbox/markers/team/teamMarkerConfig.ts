import { Driver, Car } from '../../types';

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
      logoUrl: '/team-logos/red-bull-racing.png',
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
        image: "/drivers/max-verstappen.jpg"
      },
      {
        name: "Yuki Tsunoda",
        number: 22,
        nationality: "Japanese",
        image: "/drivers/yuki-tsunoda.jpg"
      }
    ],
    car2025: {
      name: "RB21",
      image: "/cars/rb21.jpg"
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
      logoUrl: '/team-logos/ferrari.png',
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
        image: "/drivers/charles-leclerc.jpg"
      },
      {
        name: "Lewis Hamilton",
        number: 44,
        nationality: "British",
        image: "/drivers/lewis-hamilton.jpg"
      }
    ],
    car2025: {
      name: "SF-25",
      image: "/cars/SF-25.jpg"
    },
    flyTo: DEFAULT_FLY_TO
  },

  'mercedes': {
    teamId: 'mercedes',
    style: {
      className: 'mercedes-marker',
      logoUrl: '/team-logos/mercedes.png',
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
        image: "/drivers/george-russell.jpg"
      },
      {
        name: "Kimi Antonelli",
        number: 12,
        nationality: "Italian",
        image: "/drivers/kimi-antonelli.jpg"
      }
    ],
    car2025: {
      name: "W16",
      image: "/cars/w16.jpg"
    },
    flyTo: DEFAULT_FLY_TO
  },

  'mclaren': {
    teamId: 'mclaren',
    style: {
      className: 'mclaren-marker',
      logoUrl: '/team-logos/mclaren.png',
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
        image: "/drivers/lando-norris.jpg"
      },
      {
        name: "Oscar Piastri",
        number: 81,
        nationality: "Australian",
        image: "/drivers/oscar-piastri.jpg"
      }
    ],
    car2025: {
      name: "MCL39",
      image: "/cars/MCL39.jpg"
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
      logoUrl: '/team-logos/Aston_Martin_Aramco-Mercedes_logo.png',
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
        image: "/drivers/fernando-alonso.jpg"
      },
      {
        name: "Lance Stroll",
        number: 18,
        nationality: "Canadian",
        image: "/drivers/lance-stroll.jpg"
      }
    ],
    car2025: {
      name: "AMR25",
      image: "/cars/amr25.jpg"
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
      logoUrl: '/team-logos/Logo_of_alpine_f1_team_2022.png',
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
        image: "/drivers/pierre-gasly.jpg"
      },
      {
        name: "Franco Colapinto",
        number: 43,
        nationality: "Argentine",
        image: "/drivers/franco-colapinto.jpg"
      }
    ],
    car2025: {
      name: "A525",
      image: "/cars/a525.jpg"
    },
    flyTo: DEFAULT_FLY_TO
  },

  'williams': {
    teamId: 'williams',
    style: {
      className: 'williams-marker',
      logoUrl: '/team-logos/Williams_Racing_2022_logo.svg.png',
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
        image: "/drivers/alex-albon.jpg"
      },
      {
        name: "Carlos Sainz Jr.",
        number: 55,
        nationality: "Spanish",
        image: "/drivers/carlos-sainz.jpg"
      }
    ],
    car2025: {
      name: "FW47",
      image: "/cars/fw47.jpg"
    },
    flyTo: DEFAULT_FLY_TO
  },

  'racing-bulls': {
    teamId: 'racing-bulls',
    style: {
      className: 'racing-bulls-marker',
      logoUrl: '/team-logos/VCARB_F1_logo.svg',
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
        image: "/drivers/isack-hadjar.jpg"
      },
      {
        name: "Liam Lawson",
        number: 30,
        nationality: "New Zealand",
        image: "/drivers/liam-lawson.jpg"
      }
    ],
    car2025: {
      name: "VCARB02",
      image: "/cars/vcarb02.jpg"
    },
    flyTo: DEFAULT_FLY_TO
  },

  'alfa-romeo': {
    teamId: 'alfa-romeo',
    style: {
      className: 'sauber-marker',
      logoUrl: '/team-logos/2023_Stake_F1_Team_Kick_Sauber_logo.png',
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
        image: "/drivers/nico-hulkenberg.jpg"
      },
      {
        name: "Gabriel Bortoleto",
        number: 5,
        nationality: "Brazilian",
        image: "/drivers/gabriel-bortoleto.jpg"
      }
    ],
    car2025: {
      name: "C45",
      image: "/cars/c45.jpg"
    },
    flyTo: DEFAULT_FLY_TO
  },

  'haas': {
    teamId: 'haas',
    style: {
      className: 'haas-marker',
      logoUrl: '/team-logos/MoneyGram_Haas_F1_Team_Logo.svg.png',
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
        image: "/drivers/esteban-ocon.jpg"
      },
      {
        name: "Oliver Bearman",
        number: 87,
        nationality: "British",
        image: "/drivers/oliver-bearman.jpg"
      }
    ],
    car2025: {
      name: "VF-25",
      image: "/cars/vf-25.jpg"
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