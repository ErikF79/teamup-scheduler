
"use client";

import React, { useState, createContext, useContext } from 'react';
import { initialData as mockData, Session, Gym, Team } from '@/lib/teamup';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GripVertical, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// --- CONSTANTS ---
const START_HOUR = 17;
const END_HOUR = 23;
const TOTAL_MINUTES = (END_HOUR - START_HOUR) * 60;
const DAYS = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì'];

// --- CONTEXT ---
interface SchedulerContextType {
  sessions: Session[];
  gyms: Gym[];
  teams: Team[];
  teamColors: { [key: string]: string };
  moveSession: (sessionId: string, newGymId: string | null, newDay: number | null, newStartTime: number | null) => void;
  getSessionsByGymAndDay: (gymId: string, day: number) => Session[];
  getUnassignedSessions: () => Session[];
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
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState<Session[]>(mockData.sessions);
  const [gyms] = useState<Gym[]>(mockData.gyms);
  const [teams] = useState<Team[]>(mockData.teams);
  const { teamColors } = mockData;
  const [activeGym, setActiveGym] = useState(gyms[0]?.id || '');

  const moveSession = (sessionId: string, newGymId: string | null, newDay: number | null, newStartTime: number | null) => {
    let sessionToMove = sessions.find(s => s.id === sessionId);
    if (!sessionToMove) return;

    const updatedSession = { ...sessionToMove, gymId: newGymId, day: newDay, startTime: newStartTime };
    
    // Check for collisions only if moving to a scheduled slot
    if (newGymId && newDay && newStartTime) {
        const collision = sessions.some(s => 
            s.id !== sessionId &&
            s.gymId === newGymId &&
            s.day === newDay &&
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
    }


    const newSessions = sessions.map(s => s.id === sessionId ? updatedSession : s);
    setSessions(newSessions);

    toast({
        title: "Sessione Spostata",
        description: "La modifica è salvata in memoria per questa sessione.",
    });
  };

  const getSessionsByGymAndDay = (gymId: string, day: number) => {
    return sessions.filter(session => session.gymId === gymId && session.day === day);
  };

  const getUnassignedSessions = () => {
      return sessions.filter(s => s.gymId === null);
  }
  
  return (
    <SchedulerContext.Provider value={{ sessions, gyms, teams, teamColors, moveSession, getSessionsByGymAndDay, getUnassignedSessions, loading }}>
        <div className="flex-grow flex p-4 gap-4 overflow-hidden">
            <UnassignedSessionsColumn />
            <div className="flex-grow">
                 <Tabs value={activeGym} onValueChange={setActiveGym} className="w-full">
                    <TabsList>
                        {gyms.map(gym => (
                             <TabsTrigger key={gym.id} value={gym.id}>{gym.name}</TabsTrigger>
                        ))}
                    </TabsList>
                    {gyms.map(gym => (
                        <TabsContent key={gym.id} value={gym.id}>
                           <GymScheduleGrid gym={gym} />
                        </TabsContent>
                    ))}
                </Tabs>
            </div>
        </div>
    </SchedulerContext.Provider>
  );
};

// --- SESSION CARD ---
interface SessionCardProps {
  session: Session;
  isDraggable?: boolean;
}
const SessionCard = ({ session, isDraggable = true }: SessionCardProps) => {
    const { teams, teamColors } = useScheduler();
    const team = teams.find(t => t.id === session.teamId);

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
        if (!isDraggable) {
             e.preventDefault();
             return;
        }
        e.dataTransfer.setData('sessionId', session.id);
        e.currentTarget.style.opacity = '0.5';
    };

    const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
        if (!isDraggable) return;
        e.currentTarget.style.opacity = '1';
    };

    if (!team) return null;

    return (
        <div
            draggable={isDraggable}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            className={`p-3 rounded-lg shadow-md flex items-center gap-3 border-l-4 bg-card ${isDraggable ? 'cursor-grab active:cursor-grabbing' : ''}`}
            style={{ borderLeftColor: teamColors[session.teamId] || 'hsl(var(--muted))' }}
            aria-label={`Session for ${team?.name}`}
        >
            {isDraggable && <GripVertical className="h-5 w-5 text-muted-foreground shrink-0" />}
            <div className="overflow-hidden">
                <p className="font-bold text-sm text-card-foreground truncate">{team?.name}</p>
                <p className="text-xs text-muted-foreground">{session.duration} min</p>
            </div>
        </div>
    );
};


// --- UNASSIGNED SESSIONS COLUMN ---
const UnassignedSessionsColumn = () => {
  const { getUnassignedSessions, moveSession } = useScheduler();
  const unassignedSessions = getUnassignedSessions();
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
      moveSession(sessionId, null, null, null);
    }
    setIsOver(false);
  };
  
  const totalUnassigned = unassignedSessions.length;

  return (
    <Card 
        className={`w-72 h-full flex flex-col transition-colors shrink-0 ${isOver ? 'bg-accent/10' : ''}`}
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

// --- GYM SCHEDULE GRID ---
const GymScheduleGrid = ({ gym }: { gym: Gym }) => {
    const { getSessionsByGymAndDay, moveSession } = useScheduler();
    
    const timeSlots = Array.from({ length: (END_HOUR - START_HOUR) }, (_, i) => {
        const hour = START_HOUR + i;
        return `${hour.toString().padStart(2, '0')}:00`;
    });

    const handleDrop = (e: React.DragEvent<HTMLDivElement>, dayIndex: number) => {
        e.preventDefault();
        const sessionId = e.dataTransfer.getData('sessionId');
        const target = e.currentTarget;
        const contentRect = target.getBoundingClientRect();

        const dropY = e.clientY - contentRect.top;
        const totalHeight = target.offsetHeight;

        const minutesFromTop = (dropY / totalHeight) * TOTAL_MINUTES;
        const snappedMinutes = Math.round(minutesFromTop / 15) * 15;
        const newStartTime = (START_HOUR * 60) + snappedMinutes;

        if (sessionId) {
            moveSession(sessionId, gym.id, dayIndex + 1, newStartTime);
        }
        target.classList.remove('bg-accent/10');
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.currentTarget.classList.add('bg-accent/10');
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.currentTarget.classList.remove('bg-accent/10');
    };

    return (
        <Card className="mt-4">
            <CardContent className="p-0">
                <div className="grid grid-cols-[auto,1fr,1fr,1fr,1fr,1fr] min-w-full">
                    {/* Time Column */}
                    <div className="row-span-1 col-span-1 bg-card border-r">
                         <div className="h-12 border-b flex items-center justify-center font-semibold text-muted-foreground">Orario</div>
                    </div>
                    {/* Day Headers */}
                    {DAYS.map((day, index) => (
                        <div key={index} className="col-span-1 h-12 flex items-center justify-center border-b font-semibold">
                            {day}
                        </div>
                    ))}
                    
                    {/* Time Slots */}
                    <div className="row-start-2 col-start-1 bg-card border-r">
                        {timeSlots.map(time => (
                            <div key={time} className="h-24 flex items-center justify-center text-xs text-muted-foreground border-b last:border-b-0">
                               {time}
                            </div>
                        ))}
                    </div>

                    {/* Schedule Cells */}
                    {DAYS.map((_, dayIndex) => (
                        <div
                            key={dayIndex}
                            className="row-start-2 col-start-auto relative border-b border-l transition-colors"
                            onDrop={(e) => handleDrop(e, dayIndex)}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                        >
                            {/* Grid lines */}
                            {timeSlots.slice(1).map(time => (
                                <div key={time} className="h-24 border-b"></div>
                            ))}

                            {/* Scheduled Sessions */}
                            {getSessionsByGymAndDay(gym.id, dayIndex + 1).map(session => {
                                if (session.startTime === null || session.duration <= 0) return null;
                                const top = ((session.startTime - START_HOUR * 60) / TOTAL_MINUTES) * 100;
                                const height = (session.duration / TOTAL_MINUTES) * 100;

                                if (top < 0 || top >= 100) return null;

                                return (
                                    <div key={session.id} className="absolute w-full px-1" style={{ top: `${top}%`, height: `${height}%` }}>
                                        <SessionCard session={session} isDraggable={false} />
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};
