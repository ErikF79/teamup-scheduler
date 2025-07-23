


// --- TYPES ---

export interface TimeSlot {
  start: number; // minutes from midnight
  end: number;   // minutes from midnight
}

export interface DayAvailability {
  key: number; // 1 for Monday, etc.
  name: string;
  slots: TimeSlot[];
}

export interface Gym {
  id: string;
  name: string;
  availability: DayAvailability[];
}

export interface Team {
  id: string;
  name: string;
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

export interface Config {
    id: string;
    name: string;
    gyms: Gym[];
    teams: Team[];
    sessions: Session[];
    teamColors: { [key: string]: string };
}

export interface AppData {
    configurations: Config[];
    activeConfigurationId: string;
}

// --- MOCK DATA ---
const teamColors: { [key: string]: string } = {
    'team-1': 'hsl(210 90% 60%)', // Blue
    'team-2': 'hsl(45 90% 55%)',  // Yellow
    'team-3': 'hsl(10 90% 60%)',  // Red
    'team-4': 'hsl(150 80% 50%)', // Green
    'team-5': 'hsl(300 80% 60%)', // Purple
    'team-6': 'hsl(25 85% 55%)',  // Orange
};

const createDefaultAvailability = (): DayAvailability[] => [
    { key: 1, name: 'Lunedì', slots: [{ start: 15 * 60 + 30, end: 23 * 60 }] },
    { key: 2, name: 'Martedì', slots: [{ start: 15 * 60 + 30, end: 23 * 60 }] },
    { key: 3, name: 'Mercoledì', slots: [{ start: 15 * 60 + 30, end: 23 * 60 }] },
    { key: 4, name: 'Giovedì', slots: [{ start: 15 * 60 + 30, end: 23 * 60 }] },
    { key: 5, name: 'Venerdì', slots: [{ start: 15 * 60 + 30, end: 23 * 60 }] },
    { key: 6, name: 'Sabato', slots: [{ start: 9 * 60, end: 20 * 60 }] },
    { key: 7, name: 'Domenica', slots: [{ start: 9 * 60, end: 20 * 60 }] },
];

const gyms: Gym[] = [
    { id: 'gym-1', name: 'Palestra Nord', availability: createDefaultAvailability() },
    { id: 'gym-2', name: 'Palestra Sud', availability: createDefaultAvailability() },
    { id: 'gym-3', name: 'Palestra Est', availability: createDefaultAvailability() },
];

const teams: Team[] = [
    { id: 'team-1', name: 'Leoni U12', seasonStartDate: '2025-09-05', seasonEndDate: '2026-05-30' },
    { id: 'team-2', name: 'Tigri U14', seasonStartDate: '2025-09-05', seasonEndDate: '2026-05-30' },
    { id: 'team-3', name: 'Aquile U16', seasonStartDate: '2025-09-05', seasonEndDate: '2026-05-30' },
    { id: 'team-4', name: 'Pantere U18', seasonStartDate: '2025-09-05', seasonEndDate: '2026-05-30' },
    { id: 'team-5', name: 'Scoiattoli U10', seasonStartDate: '2025-09-05', seasonEndDate: '2026-05-30' },
    { id: 'team-6', name: 'Pulcini U8', seasonStartDate: '2025-09-05', seasonEndDate: '2026-05-30' },
];

const sessions: Session[] = [
    // Leoni U12
    { id: 'session-team-1-1', teamId: 'team-1', duration: 75, gymId: null, day: null, startTime: null },
    { id: 'session-team-1-2', teamId: 'team-1', duration: 75, gymId: 'gym-1', day: 1, startTime: 1020 },
    
    // Tigri U14
    { id: 'session-team-2-1', teamId: 'team-2', duration: 90, gymId: null, day: null, startTime: null },
    { id: 'session-team-2-2', teamId: 'team-2', duration: 90, gymId: 'gym-1', day: 3, startTime: 1140 },
    { id: 'session-team-2-3', teamId: 'team-2', duration: 75, gymId: 'gym-2', day: 2, startTime: 1080 },

    // Aquile U16
    { id: 'session-team-3-1', teamId: 'team-3', duration: 90, gymId: null, day: null, startTime: null },
    { id: 'session-team-3-2', teamId: 'team-3', duration: 90, gymId: null, day: null, startTime: null },

    // Pantere U18
    { id: 'session-team-4-1', teamId: 'team-4', duration: 120, gymId: 'gym-3', day: 5, startTime: 1200 },

    // Scoiattoli U10
    { id: 'session-team-5-1', teamId: 'team-5', duration: 60, gymId: 'gym-2', day: 1, startTime: 1080 }, // Mon 18:00
    { id: 'session-team-5-2', teamId: 'team-5', duration: 75, gymId: null, day: null, startTime: null },

    // Pulcini U8
    { id: 'session-team-6-1', teamId: 'team-6', duration: 60, gymId: 'gym-2', day: 1, startTime: 1020 }, // Mon 17:00
];


export const initialData: Config = {
    id: 'config-initial-1',
    name: 'Configurazione di Default',
    gyms,
    teams,
    sessions,
    teamColors,
};
