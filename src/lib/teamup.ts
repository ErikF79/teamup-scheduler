// --- TYPES ---
export interface Gym {
  id: string;
  name: string;
}

export interface Team {
  id: string;
  name: string;
  sessionsPerWeek: number;
  sessionDuration: number; // in minutes
}

export interface Session {
  id: string;
  teamId: string;
  duration: number; // in minutes
  // scheduling properties
  gymId: string | null;
  startTime: number | null; // minutes from the start of the day (e.g., 1020 for 17:00)
}

// --- MOCK DATA ---
const gyms: Gym[] = [
  { id: 'gym-1', name: 'Palestra Nord' },
  { id: 'gym-2', name: 'Palestra Sud' },
  { id: 'gym-3', name: 'Palestra Est' },
];

const teams: Team[] = [
  { id: 'team-1', name: 'Aquile U18', sessionsPerWeek: 2, sessionDuration: 90 },
  { id: 'team-2', name: 'Falchi U16', sessionsPerWeek: 3, sessionDuration: 75 },
  { id: 'team-3', name: 'Leoni U14', sessionsPerWeek: 2, sessionDuration: 60 },
  { id: 'team-4', name: 'Tigri U12', sessionsPerWeek: 2, sessionDuration: 60 },
];

const teamColors: { [key: string]: string } = {
    'team-1': 'hsl(210 90% 60%)', // Blue
    'team-2': 'hsl(45 90% 55%)',  // Yellow
    'team-3': 'hsl(10 90% 60%)',  // Red
    'team-4': 'hsl(150 80% 50%)', // Green
};

const sessions: Session[] = teams.flatMap(team => {
    return Array.from({ length: team.sessionsPerWeek }, (_, i) => ({
        id: `session-${team.id}-${i+1}`,
        teamId: team.id,
        duration: team.sessionDuration,
        gymId: null,
        startTime: null,
    }));
});

export const initialData = {
    gyms,
    teams,
    sessions,
    teamColors,
};
