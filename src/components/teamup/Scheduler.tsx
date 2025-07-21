
"use client";

import React, { useState, createContext, useContext, useEffect, useMemo } from 'react';
import { initialData as mockData, Session, Gym, Team } from '@/lib/teamup';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, GripVertical, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';

// --- CONSTANTS ---
const MASTER_START_HOUR = 9;
const MASTER_END_HOUR = 23;
const TOTAL_MASTER_MINUTES = (MASTER_END_HOUR - MASTER_START_HOUR) * 60;

// --- CONTEXT ---
interface SchedulerContextType {
  sessions: Session[];
  gyms: Gym[];
  teams: Team[];
  teamColors: { [key: string]: string };
  moveSession: (sessionId: string, newGymId: string | null, newDay: number | null, newStartTime: number | null) => void;
  getSessionsByGymAndDay: (gymId: string, day: number) => Session[];
  getUnassignedSessions: () => Session[];
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
  const [appData, setAppData] = useState(mockData);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
        const savedData = localStorage.getItem('teamup_data');
        try {
            if (savedData) {
                const parsedData = JSON.parse(savedData);
                if (parsedData.gyms && parsedData.teams && parsedData.sessions) {
                    setAppData(parsedData);
                }
            }
        } catch (e) {
            console.error("Failed to load data from localStorage", e);
        }
    }
  }, []);

  const updateSessions = (newSessions: Session[]) => {
      const newAppData = { ...appData, sessions: newSessions };
      setAppData(newAppData);
      if (typeof window !== 'undefined') {
          localStorage.setItem('teamup_data', JSON.stringify(newAppData));
      }
  };


  const moveSession = (sessionId: string, newGymId: string | null, newDay: number | null, newStartTime: number | null) => {
    let sessionToMove = appData.sessions.find(s => s.id === sessionId);
    if (!sessionToMove) return;

    const updatedSession = { ...sessionToMove, gymId: newGymId, day: newDay, startTime: newStartTime };
    
    if (newGymId && newDay !== null && newStartTime !== null) {
        const gym = appData.gyms.find(g => g.id === newGymId);
        const dayConfig = gym?.availability.find(d => d.key === newDay);

        if (gym && dayConfig) {
             const slotStartMinutes = dayConfig.start * 60;
             const slotEndMinutes = dayConfig.end * 60;

             // Check for "Closed" day
             if (dayConfig.start === 0 && dayConfig.end === 0) {
                 toast({
                    title: "Palestra Chiusa!",
                    description: "La palestra non è disponibile in questo giorno.",
                    variant: "destructive"
                });
                return;
             }
             
             const sessionEndMinutes = newStartTime + updatedSession.duration;

            if (newStartTime < slotStartMinutes || sessionEndMinutes > slotEndMinutes) {
                 toast({
                    title: "Orario non valido!",
                    description: "La sessione è fuori dagli orari disponibili per la palestra in questo giorno.",
                    variant: "destructive"
                });
                return;
            }
        }

        const collision = appData.sessions.some(s => 
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

    const newSessions = appData.sessions.map(s => s.id === sessionId ? updatedSession : s);
    updateSessions(newSessions);

    toast({
        title: "Sessione Spostata",
        description: "La modifica è salvata in memoria per questa sessione.",
    });
  };

  const getSessionsByGymAndDay = (gymId: string, day: number) => {
    return appData.sessions.filter(session => session.gymId === gymId && session.day === day);
  };

  const getUnassignedSessions = () => {
      return appData.sessions.filter(s => s.gymId === null);
  }
  
  return (
    <SchedulerContext.Provider value={{ ...appData, moveSession, getSessionsByGymAndDay, getUnassignedSessions }}>
        <div className="flex-grow flex p-4 gap-4 overflow-hidden h-full">
            <UnassignedSessionsColumn />
             <div className="flex-grow flex flex-col h-full overflow-hidden">
                <div className="flex-shrink-0 pb-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Navigazione Rapida Palestre</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-wrap gap-2">
                             {appData.gyms.map(gym => (
                                <a key={gym.id} href={`#${gym.id}`} onClick={(e) => {
                                    e.preventDefault();
                                    document.getElementById(gym.id)?.scrollIntoView({ behavior: 'smooth' });
                                }}>
                                    <Button variant="outline">{gym.name}</Button>
                                </a>
                            ))}
                        </CardContent>
                    </Card>
                </div>
                <ScrollArea className="flex-grow h-full pr-4">
                  <div className="space-y-6">
                    {appData.gyms.map(gym => (
                      <div key={gym.id} id={gym.id} className="scroll-mt-4">
                        <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
                           <Building2 className="text-primary"/> {gym.name}
                        </h2>
                        <GymScheduleGrid gym={gym} />
                      </div>
                    ))}
                  </div>
                </ScrollArea>
            </div>
        </div>
    </SchedulerContext.Provider>
  );
};

// --- UTILITY FUNCTIONS ---
function formatTime(minutesFromDayStart: number) {
    const hours = Math.floor(minutesFromDayStart / 60);
    const minutes = minutesFromDayStart % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}


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
    
    const isPlaced = session.startTime !== null;
    const startTimeStr = isPlaced ? formatTime(session.startTime!) : '';
    const endTimeStr = isPlaced ? formatTime(session.startTime! + session.duration) : '';

    return (
        <div
            draggable={isDraggable}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            className={`p-2 rounded-lg shadow-md flex items-center gap-2 border-l-4 bg-card ${isDraggable ? 'cursor-grab active:cursor-grabbing' : ''}`}
            style={{ borderLeftColor: teamColors[session.teamId] || 'hsl(var(--muted))' }}
            aria-label={`Session for ${team?.name}`}
        >
            {isDraggable && <GripVertical className="h-5 w-5 text-muted-foreground shrink-0" />}
            <div className="overflow-hidden w-full">
                <p className="font-bold text-sm text-card-foreground truncate">{team?.name}</p>
                {isPlaced && (
                     <p className="text-xs font-semibold text-primary">{startTimeStr} - {endTimeStr}</p>
                )}
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
      <ScrollArea>
        <CardContent className="p-4 space-y-3">
          {unassignedSessions.length > 0 ? (
              unassignedSessions.map(session => <SessionCard key={session.id} session={session} />)
          ) : (
              <div className="text-center text-muted-foreground pt-10">Tutte le sessioni sono state pianificate!</div>
          )}
        </CardContent>
      </ScrollArea>
    </Card>
  );
};

// --- GYM SCHEDULE GRID ---
const GymScheduleGrid = ({ gym }: { gym: Gym }) => {
    const { getSessionsByGymAndDay, moveSession } = useScheduler();
    
    const timeSlots = useMemo(() => Array.from({ length: (MASTER_END_HOUR - MASTER_START_HOUR) }, (_, i) => {
        const hour = MASTER_START_HOUR + i;
        return `${hour.toString().padStart(2, '0')}:00`;
    }), []);

    const handleDrop = (e: React.DragEvent<HTMLDivElement>, dayIndex: number) => {
        e.preventDefault();
        const sessionId = e.dataTransfer.getData('sessionId');
        const target = e.currentTarget;
        target.classList.remove('bg-accent/10');
        const contentRect = target.getBoundingClientRect();

        const dropY = e.clientY - contentRect.top;
        const totalHeight = target.offsetHeight;

        const minutesFromTop = (dropY / totalHeight) * TOTAL_MASTER_MINUTES;
        const snappedMinutes = Math.round(minutesFromTop / 15) * 15;
        const newStartTime = (MASTER_START_HOUR * 60) + snappedMinutes;
        
        const dayKey = dayIndex + 1;

        if (sessionId) {
            moveSession(sessionId, gym.id, dayKey, newStartTime);
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.currentTarget.classList.add('bg-accent/10');
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.currentTarget.classList.remove('bg-accent/10');
    };

    return (
        <Card>
            <CardContent className="p-0">
                <div className="grid grid-cols-[auto_repeat(7,1fr)] min-w-full">
                    {/* Time Column Header */}
                    <div className="row-span-1 col-span-1 bg-card border-r">
                         <div className="h-12 border-b flex items-center justify-center font-semibold text-muted-foreground">Orario</div>
                    </div>
                    {/* Day Headers */}
                    {gym.availability.map(({name}, index) => (
                        <div key={index} className="col-span-1 h-12 flex items-center justify-center border-b font-semibold text-center text-sm">
                            {name}
                        </div>
                    ))}
                    
                    {/* Time Slots Column */}
                    <div className="row-start-2 col-start-1 bg-card border-r">
                        {timeSlots.map(time => (
                            <div key={time} className="h-24 flex items-center justify-center text-xs text-muted-foreground border-b last:border-b-0">
                               {time}
                            </div>
                        ))}
                    </div>

                    {/* Schedule Cells */}
                    {gym.availability.map(({key: dayKey, start, end}, dayIndex) => (
                        <div
                            key={dayIndex}
                            className="row-start-2 col-start-auto relative border-b border-l transition-colors"
                            onDrop={(e) => handleDrop(e, dayIndex)}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                        >
                             {/* Background masks for unavailable times */}
                             <div className="absolute inset-0 z-0 pointer-events-none">
                                {timeSlots.map((_, hourIndex) => {
                                    const currentHour = MASTER_START_HOUR + hourIndex;
                                    const isAvailable = currentHour >= start && currentHour < end;
                                    const isClosed = start === 0 && end === 0;
                                    return (
                                        <div 
                                            key={hourIndex}
                                            className={`h-24 border-b ${(!isAvailable || isClosed) ? 'bg-muted/30' : ''}`}
                                        ></div>
                                    )
                                })}
                            </div>

                            {/* Scheduled Sessions */}
                            <div className="relative z-10 h-full">
                                {getSessionsByGymAndDay(gym.id, dayKey).map(session => {
                                    if (session.startTime === null || session.duration <= 0) return null;
                                    const top = ((session.startTime - MASTER_START_HOUR * 60) / TOTAL_MASTER_MINUTES) * 100;
                                    const height = (session.duration / TOTAL_MASTER_MINUTES) * 100;

                                    if (top < 0 || top >= 100) return null;

                                    return (
                                        <div key={session.id} className="absolute w-full px-1" style={{ top: `${top}%`, height: `${height}%` }}>
                                            <SessionCard session={session} isDraggable={true} />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};
