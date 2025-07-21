
"use client";

import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { initialData as mockData, Session, Gym, Team } from '@/lib/teamup';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, GripVertical, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// --- CONTEXT ---
interface SchedulerContextType {
  sessions: Session[];
  gyms: Gym[];
  teams: Team[];
  teamColors: { [key: string]: string };
  moveSession: (sessionId: string, newGymId: string | null, newStartTime: number | null) => void;
  getSessionsByGym: (gymId: string | null) => Session[];
  loading: boolean;
}

const SchedulerContext = createContext<SchedulerContextType | null>(null);

const useScheduler = () => {
  const context = useContext(SchedulerContext);
  if (!context) {
    throw new Error('useScheduler must be used within a SchedulerProvider');
  }
  return context;
};

// --- PROVIDER ---
export default function Scheduler() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false); // No more async loading
  const [sessions, setSessions] = useState<Session[]>(mockData.sessions);
  const [gyms, setGyms] = useState<Gym[]>(mockData.gyms);
  const [teams, setTeams] = useState<Team[]>(mockData.teams);
  const { teamColors } = mockData;

  const moveSession = (sessionId: string, newGymId: string | null, newStartTime: number | null) => {
    let sessionToMove = sessions.find(s => s.id === sessionId);
    if (!sessionToMove) return;

    const updatedSession = { ...sessionToMove, gymId: newGymId, startTime: newStartTime };

    const collision = sessions.some(s => 
        s.id !== sessionId &&
        s.gymId === newGymId &&
        newGymId !== null &&
        s.startTime !== null &&
        newStartTime !== null &&
        s.duration > 0 &&
        (
            (newStartTime >= s.startTime && newStartTime < s.startTime + s.duration) ||
            (s.startTime >= newStartTime && s.startTime < newStartTime + updatedSession.duration)
        )
    );

    if (collision) {
        toast({
            title: "Collisione Rilevata!",
            description: "Impossibile spostare la sessione in questo slot orario.",
            variant: "destructive"
        });
        return;
    }

    const newSessions = sessions.map(s => s.id === sessionId ? updatedSession : s);
    setSessions(newSessions);

    // In a real app with a backend, you would save this change here.
    toast({
        title: "Sessione Spostata",
        description: "La modifica è salvata in memoria per questa sessione.",
    });
  };

  const getSessionsByGym = (gymId: string | null) => {
    return sessions.filter(session => session.gymId === gymId);
  };
  
  return (
    <SchedulerContext.Provider value={{ sessions, gyms, teams, teamColors, moveSession, getSessionsByGym, loading }}>
        <div className="flex-grow flex p-4 gap-4 overflow-x-auto">
            <UnassignedSessionsColumn />
            {gyms.map(gym => (
                <GymScheduleColumn key={gym.id} gym={gym} />
            ))}
        </div>
    </SchedulerContext.Provider>
  );
};

// --- SESSION CARD ---
interface SessionCardProps {
  session: Session;
}
const SessionCard = ({ session }: SessionCardProps) => {
    const { teams, teamColors } = useScheduler();
    const team = teams.find(t => t.id === session.teamId);

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
        e.dataTransfer.setData('sessionId', session.id);
        e.currentTarget.style.opacity = '0.5';
    };

    const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
        e.currentTarget.style.opacity = '1';
    };

    if (!team) return null;

    return (
        <div
            draggable
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            className={`p-3 rounded-lg shadow-md cursor-grab active:cursor-grabbing flex items-center gap-3 border-l-4 bg-card`}
            style={{ borderLeftColor: teamColors[session.teamId] || 'hsl(var(--muted))' }}
            aria-label={`Session for ${team?.name}`}
        >
            <GripVertical className="h-5 w-5 text-muted-foreground shrink-0" />
            <div>
                <p className="font-bold text-sm text-card-foreground">{team?.name}</p>
                <p className="text-xs text-muted-foreground">{session.duration} min</p>
            </div>
        </div>
    );
};


// --- UNASSIGNED SESSIONS COLUMN ---
const UnassignedSessionsColumn = () => {
  const { getSessionsByGym, moveSession, sessions } = useScheduler();
  const unassignedSessions = getSessionsByGym(null);
  const [isOver, setIsOver] = useState(false);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsOver(true);
  };

  const handleDragLeave = () => setIsOver(false);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const sessionId = e.dataTransfer.getData('sessionId');
    if (sessionId) {
      moveSession(sessionId, null, null);
    }
    setIsOver(false);
  };
  
  const totalUnassigned = sessions.filter(s => s.gymId === null).length;

  return (
    <Card 
        className={`min-w-72 h-full flex flex-col transition-colors ${isOver ? 'bg-accent/10' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
    >
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Users className="h-5 w-5 text-primary" />
          Sessioni da Assegnare
          <span className="ml-auto font-bold text-white bg-primary rounded-full h-6 w-6 flex items-center justify-center text-xs">
            {totalUnassigned}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 flex-grow overflow-y-auto space-y-3">
        {unassignedSessions.length > 0 ? (
            unassignedSessions.map(session => <SessionCard key={session.id} session={session} />)
        ) : (
            <div className="text-center text-muted-foreground pt-10">Tutte le sessioni sono state pianificate!</div>
        )}
      </CardContent>
    </Card>
  );
};


// --- GYM SCHEDULE COLUMN ---
const START_HOUR = 17;
const END_HOUR = 23;
const TOTAL_MINUTES = (END_HOUR - START_HOUR) * 60;

const GymScheduleColumn = ({ gym }: { gym: Gym }) => {
    const { getSessionsByGym, moveSession } = useScheduler();
    const scheduledSessions = getSessionsByGym(gym.id);
    const [isOver, setIsOver] = useState(false);

    const timeSlots = Array.from({length: (END_HOUR - START_HOUR) * 2}, (_, i) => {
        const hour = START_HOUR + Math.floor(i / 2);
        const minute = (i % 2) * 30;
        return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    });

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsOver(true);
    };

    const handleDragLeave = () => {
        setIsOver(false);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const sessionId = e.dataTransfer.getData('sessionId');
        const contentRect = e.currentTarget.getBoundingClientRect();
        const dropY = e.clientY - contentRect.top;
        const totalHeight = e.currentTarget.offsetHeight;

        const minutesFromTop = (dropY / totalHeight) * TOTAL_MINUTES;
        const snappedMinutes = Math.round(minutesFromTop / 15) * 15;
        const newStartTime = (START_HOUR * 60) + snappedMinutes;

        if (sessionId) {
            moveSession(sessionId, gym.id, newStartTime);
        }
        setIsOver(false);
    };

    return (
        <Card className="min-w-80 h-full flex flex-col">
            <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                    <Building2 className="h-5 w-5 text-primary"/>
                    {gym.name}
                </CardTitle>
            </CardHeader>
            <CardContent 
                className={`p-0 flex-grow relative transition-colors ${isOver ? 'bg-accent/10' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                <div className="absolute inset-y-0 left-0 w-16 border-r flex flex-col">
                    {timeSlots.map(time => (
                        <div key={time} className="flex-grow border-b flex items-center justify-center text-xs text-muted-foreground last:border-b-0">
                           {time.endsWith('00') && time}
                        </div>
                    ))}
                </div>
                <div className="ml-16 h-full relative">
                    {scheduledSessions.map(session => {
                        if (session.startTime === null || session.duration <= 0) return null;
                        const top = ((session.startTime - START_HOUR * 60) / TOTAL_MINUTES) * 100;
                        const height = (session.duration / TOTAL_MINUTES) * 100;
                        
                        if (top < 0 || top >= 100) return null;

                        return (
                            <div key={session.id} className="absolute w-full pr-2" style={{ top: `${top}%`, height: `${height}%` }}>
                                <SessionCard session={session} />
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
};
