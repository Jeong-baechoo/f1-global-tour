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
        name: "Isack Hadjar",
        number: 6,
        nationality: "French",
        image: "/drivers/isack-hadjar.jpg"
      }
    ],
    car2025: {
      name: "RB22",
      image: "/cars/RB22.png"
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
      name: "SF-26",
      image: "/cars/SF-26.png"
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
      name: "W17",
      image: "/cars/W17.png"
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
      name: "MCL40",
      image: "/cars/MCL40.png"
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
      name: "AMR26",
      image: "/cars/AMR26.png"
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
      name: "A526",
      image: "/cars/A526.png"
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
      name: "FW48",
      image: "/cars/FW48.png"
    }
  },

  'racing-bulls': {
    teamId: 'racing-bulls',
    drivers2025: [
      {
        name: "Arvid Lindblad",
        number: 27,
        nationality: "British",
        image: "/drivers/arvid-lindblad.jpg"
      },
      {
        name: "Liam Lawson",
        number: 30,
        nationality: "New Zealand",
        image: "/drivers/liam-lawson.jpg"
      }
    ],
    car2025: {
      name: "VCARB 03",
      image: "/cars/VCARB03.png"
    }
  },

  'audi': {
    teamId: 'audi',
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
      name: "R26",
      image: "/cars/AudiR26.png"
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
      name: "VF-26",
      image: "/cars/VF-26.png"
    }
  },

  'cadillac': {
    teamId: 'cadillac',
    drivers2025: [
      {
        name: "Sergio Perez",
        number: 11,
        nationality: "Mexican",
        image: "/drivers/sergio-perez.jpg"
      },
      {
        name: "Valtteri Bottas",
        number: 77,
        nationality: "Finnish",
        image: "/drivers/valtteri-bottas.jpg"
      }
    ],
    car2025: {
      name: "MAC-26",
      image: "/cars/MAC-26.png"
    }
  }
};

export const getTeamDetails = (teamId: string): TeamDetails | undefined => {
  return TEAM_DETAILS[teamId];
};