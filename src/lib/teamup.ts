
// --- TYPES ---

export interface DayAvailability {
  key: number; // 1 for Monday, etc.
  name: string;
  start: number; // minutes from midnight
  end: number; // minutes from midnight
}

export interface Gym {
  id: string;
  name: string;
  availability: DayAvailability[];
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
};

const defaultAvailability: DayAvailability[] = [
    { key: 1, name: 'Lunedì', start: 17 * 60, end: 23 * 60 },
    { key: 2, name: 'Martedì', start: 17 * 60, end: 23 * 60 },
    { key: 3, name: 'Mercoledì', start: 17 * 60, end: 23 * 60 },
    { key: 4, name: 'Giovedì', start: 17 * 60, end: 23 * 60 },
    { key: 5, name: 'Venerdì', start: 17 * 60, end: 23 * 60 },
    { key: 6, name: 'Sabato', start: 14 * 60, end: 20 * 60 },
    { key: 7, name: 'Domenica', start: 9 * 60, end: 20 * 60 },
];

const gyms: Gym[] = [
    { id: 'gym-1', name: 'Palestra Nord', availability: defaultAvailability },
    { id: 'gym-2', name: 'Palestra Sud', availability: defaultAvailability },
    { id: 'gym-3', name: 'Palestra Est', availability: defaultAvailability },
];

const teams: Team[] = [
    { id: 'team-1', name: 'Leoni U12', sessionsPerWeek: 2, sessionDuration: 75, seasonStartDate: '2025-09-05', seasonEndDate: '2026-05-30' },
    { id: 'team-2', name: 'Tigri U14', sessionsPerWeek: 3, sessionDuration: 90, seasonStartDate: '2025-09-05', seasonEndDate: '2026-05-30' },
    { id: 'team-3', name: 'Aquile U16', sessionsPerWeek: 2, sessionDuration: 90, seasonStartDate: '2025-09-05', seasonEndDate: '2026-05-30' },
    { id: 'team-4', name: 'Pantere U18', sessionsPerWeek: 1, sessionDuration: 120, seasonStartDate: '2025-09-05', seasonEndDate: '2026-05-30' },
];

const generateInitialSessions = (teams: Team[]): Session[] => {
    let allSessions: Session[] = [];
    teams.forEach(team => {
        for (let i = 0; i < team.sessionsPerWeek; i++) {
            allSessions.push({
                id: `session-${team.id}-${i + 1}`,
                teamId: team.id,
                duration: team.sessionDuration,
                gymId: null,
                day: null,
                startTime: null,
            });
        }
    });
    // Add some pre-assigned sessions for demo
    const assignedSession1 = allSessions.find(s => s.id === 'session-team-1-2');
    if(assignedSession1) {
      assignedSession1.gymId = 'gym-1';
      assignedSession1.day = 1;
      assignedSession1.startTime = 1020; // Mon 17:00
    }
     const assignedSession2 = allSessions.find(s => s.id === 'session-team-2-2');
    if(assignedSession2) {
      assignedSession2.gymId = 'gym-1';
      assignedSession2.day = 3;
      assignedSession2.startTime = 1140; // Wed 19:00
    }
     const assignedSession3 = allSessions.find(s => s.id === 'session-team-2-3');
    if(assignedSession3) {
      assignedSession3.gymId = 'gym-2';
      assignedSession3.day = 2;
      assignedSession3.startTime = 1080; // Tue 18:00
    }
     const assignedSession4 = allSessions.find(s => s.id === 'session-team-4-1');
    if(assignedSession4) {
      assignedSession4.gymId = 'gym-3';
      assignedSession4.day = 5;
      assignedSession4.startTime = 1200; // Fri 20:00
    }
    return allSessions;
};

const sessions = generateInitialSessions(teams);

export const initialData = {
    gyms,
    teams,
    sessions,
    teamColors,
};

    

    