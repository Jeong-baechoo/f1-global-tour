import { Driver, Car } from '@/src/shared/types';

export interface TeamDetails {
  teamId: string;
  drivers2025: Driver[];
  car2025: Car;
}

export const TEAM_DETAILS: Record<string, TeamDetails> = {
  'red-bull': {
    teamId: 'red-bull',
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
    }
  },

  'ferrari': {
    teamId: 'ferrari',
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
    }
  },

  'mercedes': {
    teamId: 'mercedes',
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
    }
  },

  'mclaren': {
    teamId: 'mclaren',
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
    }
  },

  'aston-martin': {
    teamId: 'aston-martin',
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
    }
  },

  'alpine': {
    teamId: 'alpine',
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
    }
  },

  'williams': {
    teamId: 'williams',
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
    }
  },

  'racing-bulls': {
    teamId: 'racing-bulls',
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
    }
  },

  'sauber': {
    teamId: 'sauber',
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
    }
  },

  'haas': {
    teamId: 'haas',
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
    }
  }
};

export const getTeamDetails = (teamId: string): TeamDetails | undefined => {
  return TEAM_DETAILS[teamId];
};