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

const gyms: Gym[] = [];
const teams: Team[] = [];
const sessions: Session[] = [];

export const initialData = {
    gyms,
    teams,
    sessions,
    teamColors,
};
