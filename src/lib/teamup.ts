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
  seasonStartDate: string; // YYYY-MM-DD
  seasonEndDate: string; // YYYY-MM-DD
}

export interface Session {
  id: string;
  teamId: string;
  duration: number; // in minutes
  // scheduling properties
  gymId: string | null;
  day: number | null; // 1 for Monday, 2 for Tuesday, etc.
  startTime: number | null; // minutes from the start of the day (e.g., 1020 for 17:00)
}

// --- MOCK DATA ---
const teamColors: { [key: string]: string } = {
    'team-1': 'hsl(210 90% 60%)', // Blue
    'team-2': 'hsl(45 90% 55%)',  // Yellow
    'team-3': 'hsl(10 90% 60%)',  // Red
    'team-4': 'hsl(150 80% 50%)', // Green
    'team-5': 'hsl(260 80% 65%)', // Purple
    'team-6': 'hsl(330 80% 60%)', // Pink
};

const gyms: Gym[] = [
    { id: 'gym-1', name: 'Palestra Nord' },
    { id: 'gym-2', name: 'Palestra Sud' },
    { id: 'gym-3', name: 'Palestra Est' },
];

const teams: Team[] = [
    { id: 'team-1', name: 'Leoni U12', sessionsPerWeek: 2, sessionDuration: 75, seasonStartDate: '2023-09-01', seasonEndDate: '2024-05-31' },
    { id: 'team-2', name: 'Tigri U14', sessionsPerWeek: 3, sessionDuration: 90, seasonStartDate: '2023-09-01', seasonEndDate: '2024-05-31' },
    { id: 'team-3', name: 'Aquile U16', sessionsPerWeek: 2, sessionDuration: 90, seasonStartDate: '2023-09-01', seasonEndDate: '2024-05-31' },
    { id: 'team-4', name: 'Pantere U18', sessionsPerWeek: 1, sessionDuration: 120, seasonStartDate: '2023-09-01', seasonEndDate: '2024-05-31' },
];

const sessions: Session[] = [
    // Team 1
    { id: 'session-1-1', teamId: 'team-1', duration: 75, gymId: null, day: null, startTime: null },
    { id: 'session-1-2', teamId: 'team-1', duration: 75, gymId: 'gym-1', day: 1, startTime: 1020 }, // Mon 17:00
    // Team 2
    { id: 'session-2-1', teamId: 'team-2', duration: 90, gymId: null, day: null, startTime: null },
    { id: 'session-2-2', teamId: 'team-2', duration: 90, gymId: 'gym-1', day: 3, startTime: 1140 }, // Wed 19:00
    { id: 'session-2-3', teamId: 'team-2', duration: 90, gymId: 'gym-2', day: 2, startTime: 1080 }, // Tue 18:00
    // Team 3
    { id: 'session-3-1', teamId: 'team-3', duration: 90, gymId: null, day: null, startTime: null },
    { id: 'session-3-2', teamId: 'team-3', duration: 90, gymId: null, day: null, startTime: null },
    // Team 4
    { id: 'session-4-1', teamId: 'team-4', duration: 120, gymId: 'gym-3', day: 5, startTime: 1200 }, // Fri 20:00
];


export const initialData = {
    gyms,
    teams,
    sessions,
    teamColors,
};
