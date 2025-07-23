
"use client";

import React, { useState, createContext, useContext, useEffect, useMemo, useCallback } from 'react';
import { initialData as mockData, Session, Gym, Team } from '@/lib/teamup';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, GripVertical, Users, CalendarDays, Eye, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';


// --- CONSTANTS ---
const MASTER_START_HOUR = 9;
const MASTER_END_HOUR = 23;
const TOTAL_MASTER_MINUTES = (MASTER_END_HOUR - MASTER_START_HOUR) * 60;
const DAYS_OF_WEEK = [
    { key: 1, name: 'Lunedì' },
    { key: 2, name: 'Martedì' },
    { key: 3, name: 'Mercoledì' },
    { key: 4, name: 'Giovedì' },
    { key: 5, name: 'Venerdì' },
    { key: 6, name: 'Sabato' },
    { key: 7, name: 'Domenica' },
];

// --- TYPES ---
interface PlacingSessionInfo {
    sessionId: string;
    gymId: string;
    dayKey: number;
}


// --- CONTEXT ---
interface SchedulerContextType {
  sessions: Session[];
  gyms: Gym[];
  teams: Team[];
  teamColors: { [key: string]: string };
  moveSession: (sessionId: string, newGymId: string | null, newDay: number | null, newStartTime: number | null) => boolean;
  getSessionsByGymAndDay: (gymId: string, day: number) => Session[];
  getUnassignedSessions: () => Session[];
  setEditingSession: (session: Session | null) => void;
  setPlacingSessionInfo: (info: PlacingSessionInfo | null) => void;
  placingSessionInfo: PlacingSessionInfo | null;
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
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [placingSessionInfo, setPlacingSessionInfo] = useState<PlacingSessionInfo | null>(null);
  
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


  const moveSession = (sessionId: string, newGymId: string | null, newDay: number | null, newStartTime: number | null): boolean => {
    const sessionToMove = appData.sessions.find(s => s.id === sessionId);
    if (!sessionToMove) return false;

    // If un-assigning, just do it.
    if (newGymId === null || newDay === null || newStartTime === null) {
        const newSessions = appData.sessions.map(s => 
            s.id === sessionId ? { ...s, gymId: null, day: null, startTime: null } : s
        );
        updateSessions(newSessions);
        toast({ title: "Sessione rimossa dal calendario" });
        return true;
    }
    
    const sessionEndMinutes = newStartTime + sessionToMove.duration;

    // --- VALIDATION 1: Check Gym Availability ---
    const gym = appData.gyms.find(g => g.id === newGymId);
    if (!gym) return false;
    
    const dayConfig = gym.availability.find(d => d.key === newDay);
    if (!dayConfig) {
         toast({ title: "Errore", description: "Configurazione giorno non trovata.", variant: "destructive" });
        return false;
    }
    
    // Check if the session falls entirely within any available slots
    const isWithinAvailableSlot = dayConfig.slots.some(slot =>
        newStartTime >= slot.start && sessionEndMinutes <= slot.end
    );

    if (!isWithinAvailableSlot) {
        toast({
            title: "Orario non valido!",
            description: "La sessione non rientra completamente in una fascia oraria disponibile per la palestra.",
            variant: "destructive"
        });
        return false;
    }

    // --- VALIDATION 2: Check for Collisions ---
    const collision = appData.sessions.some(s => {
        if (s.id === sessionId || s.gymId !== newGymId || s.day !== newDay || s.startTime === null) {
            return false;
        }
        const s_start = s.startTime;
        const s_end = s.startTime + s.duration;
        // Check for any overlap: (start1 < end2) and (end1 > start2)
        return newStartTime < s_end && sessionEndMinutes > s_start;
    });

    if (collision) {
        toast({
            title: "Collisione Rilevata!",
            description: "Impossibile spostare. Lo slot orario è già occupato.",
            variant: "destructive"
        });
        return false;
    }

    // --- All checks passed, update the session ---
    const updatedSession = { ...sessionToMove, gymId: newGymId, day: newDay, startTime: newStartTime };
    const newSessions = appData.sessions.map(s => s.id === sessionId ? updatedSession : s);
    updateSessions(newSessions);

    toast({
        title: "Sessione Spostata",
        description: "La modifica è stata salvata.",
    });
    return true;
  };

  const getSessionsByGymAndDay = (gymId: string, day: number) => {
    return appData.sessions.filter(session => session.gymId === gymId && session.day === day);
  };

  const getUnassignedSessions = () => {
      return appData.sessions.filter(s => s.gymId === null);
  }
  
  return (
    <SchedulerContext.Provider value={{ ...appData, moveSession, getSessionsByGymAndDay, getUnassignedSessions, setEditingSession, setPlacingSessionInfo, placingSessionInfo }}>
        <div className="flex-grow flex p-4 gap-4 overflow-hidden h-full">
            <UnassignedSessionsColumn />
             <div className="flex-grow flex flex-col h-full overflow-hidden">
                 <Tabs defaultValue="gym-view" className="flex-grow flex flex-col h-full overflow-hidden">
                    <div className="flex-shrink-0 flex items-center justify-between pb-4">
                         <TabsList>
                            <TabsTrigger value="gym-view"><Building2 className="mr-2 h-4 w-4"/>Vista per Palestra</TabsTrigger>
                            <TabsTrigger value="day-view"><CalendarDays className="mr-2 h-4 w-4"/>Vista per Giorno</TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="gym-view" className="flex-grow h-full overflow-hidden">
                       <GymViewScheduler />
                    </TabsContent>
                    <TabsContent value="day-view" className="flex-grow h-full overflow-hidden">
                       <DayViewScheduler />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
        {editingSession && <EditSessionDialog session={editingSession} />}
        {placingSessionInfo && <PlaceSessionDialog info={placingSessionInfo}/>}
    </SchedulerContext.Provider>
  );
};

// --- VIEWS ---

function GymViewScheduler() {
    const { gyms } = useScheduler();
    return (
        <ScrollArea className="flex-grow h-full pr-4">
            <div className="space-y-6">
            {gyms.map(gym => (
                <div key={gym.id} id={gym.id} className="scroll-mt-4">
                <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
                    <Building2 className="text-primary"/> {gym.name}
                </h2>
                <GymScheduleGrid gym={gym} />
                </div>
            ))}
            </div>
      </ScrollArea>
    )
}

function DayViewScheduler() {
    const { gyms, getSessionsByGymAndDay } = useScheduler();

    const timeSlots = useMemo(() => Array.from({ length: (MASTER_END_HOUR - MASTER_START_HOUR) * 4 }, (_, i) => {
        const totalMinutes = MASTER_START_HOUR * 60 + i * 15;
        const hour = Math.floor(totalMinutes / 60);
        const minute = totalMinutes % 60;
        if (minute === 0) {
            return { time: `${hour.toString().padStart(2, '0')}:00`, isHour: true };
        }
        return { time: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`, isHour: false };
    }), []);

    return (
         <Tabs defaultValue="1" className="flex-grow flex flex-col h-full overflow-hidden">
             <div className="flex-shrink-0 pb-4">
                <TabsList className="grid w-full grid-cols-7">
                    {DAYS_OF_WEEK.map(day => (
                        <TabsTrigger key={day.key} value={String(day.key)}>{day.name}</TabsTrigger>
                    ))}
                </TabsList>
             </div>
            <ScrollArea className="flex-grow h-full">
                 <div className="grid grid-cols-[auto_repeat(var(--gym-count),1fr)] min-w-full" style={{'--gym-count': gyms.length} as React.CSSProperties}>
                    {/* Time Column Header */}
                    <div className="row-span-1 col-span-1 bg-card border-r sticky top-0 z-20">
                         <div className="h-12 border-b flex items-center justify-center font-semibold text-muted-foreground">Orario</div>
                    </div>
                    {/* Gym Headers */}
                    {gyms.map(gym => {
                        return (
                             <TabsContent key={gym.id} value="1" className="contents">
                                <DayHeaderCell gym={gym} dayKey={1} />
                            </TabsContent>
                        )
                    })}
                     {gyms.map(gym => {
                        return (
                             <TabsContent key={gym.id} value="2" className="contents">
                                <DayHeaderCell gym={gym} dayKey={2} />
                            </TabsContent>
                        )
                    })}
                     {gyms.map(gym => {
                        return (
                             <TabsContent key={gym.id} value="3" className="contents">
                                <DayHeaderCell gym={gym} dayKey={3} />
                            </TabsContent>
                        )
                    })}
                     {gyms.map(gym => {
                        return (
                             <TabsContent key={gym.id} value="4" className="contents">
                                <DayHeaderCell gym={gym} dayKey={4} />
                            </TabsContent>
                        )
                    })}
                     {gyms.map(gym => {
                        return (
                             <TabsContent key={gym.id} value="5" className="contents">
                                <DayHeaderCell gym={gym} dayKey={5} />
                            </TabsContent>
                        )
                    })}
                     {gyms.map(gym => {
                        return (
                             <TabsContent key={gym.id} value="6" className="contents">
                                <DayHeaderCell gym={gym} dayKey={6} />
                            </TabsContent>
                        )
                    })}
                     {gyms.map(gym => {
                        return (
                             <TabsContent key={gym.id} value="7" className="contents">
                                <DayHeaderCell gym={gym} dayKey={7} />
                            </TabsContent>
                        )
                    })}


                    {/* Time Slots Column */}
                    <div className="row-start-2 col-start-1 bg-card border-r sticky left-0 z-10">
                        {timeSlots.map(({time, isHour}) => (
                            <div key={time} className={`h-6 flex items-center justify-center text-muted-foreground ${isHour ? 'font-semibold text-xs border-t' : 'text-[10px]'}`}>
                               {isHour && time}
                            </div>
                        ))}
                    </div>
                     {DAYS_OF_WEEK.map(day => (
                        <TabsContent key={day.key} value={String(day.key)} className="contents">
                            {gyms.map(gym => (
                               <DayGymScheduleCell key={`${gym.id}-${day.key}`} gym={gym} dayKey={day.key} />
                            ))}
                        </TabsContent>
                    ))}
                </div>
            </ScrollArea>
        </Tabs>
    )
}

function DayHeaderCell({ gym, dayKey }: { gym: Gym; dayKey: number }) {
  const { getSessionsByGymAndDay } = useScheduler();
  const dayConfig = gym.availability.find(d => d.key === dayKey);
  const totalAvailableMinutes = (dayConfig?.slots || []).reduce((sum, slot) => sum + (slot.end - slot.start), 0);
  const scheduledMinutes = getSessionsByGymAndDay(gym.id, dayKey).reduce((sum, session) => sum + session.duration, 0);
  const remainingHours = ((totalAvailableMinutes - scheduledMinutes) / 60).toFixed(1);

  return (
    <div className="col-span-1 h-12 flex flex-col items-center justify-center border-b font-semibold text-center text-sm px-2 sticky top-0 z-20 bg-card">
      <span>{gym.name}</span>
      <span className="font-normal text-xs text-muted-foreground">{remainingHours}h libere</span>
    </div>
  );
}


// --- UTILITY FUNCTIONS ---
function formatTime(minutesFromDayStart: number | null) {
    if (minutesFromDayStart === null) return '';
    const hours = Math.floor(minutesFromDayStart / 60);
    const minutes = minutesFromDayStart % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

function timeToMinutes(timeString: string) {
    const [hours, minutes] = timeString.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) return null;
    return hours * 60 + minutes;
}

// --- SESSION CARD ---
interface SessionCardProps {
  session: Session;
  isDraggable?: boolean;
}
const SessionCard = ({ session, isDraggable = true }: SessionCardProps) => {
    const { teams, teamColors, setEditingSession } = useScheduler();
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

    const handleClick = () => {
        if (session.startTime !== null) { // Only placed sessions are editable this way
            setEditingSession(session);
        }
    }

    if (!team) return null;
    
    const isPlaced = session.startTime !== null;
    const startTimeStr = formatTime(session.startTime);
    const endTimeStr = isPlaced ? formatTime(session.startTime! + session.duration) : '';
    const cursorClass = isPlaced ? 'cursor-pointer hover:ring-2 hover:ring-primary' : 'cursor-grab active:cursor-grabbing';

    return (
        <div
            draggable={isDraggable}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onClick={handleClick}
            className={`h-full rounded-lg shadow-md flex items-start gap-2 border-l-4 bg-card mx-1 py-1 px-2 ${isDraggable ? cursorClass : ''}`}
            style={{ borderLeftColor: teamColors[session.teamId] || 'hsl(var(--muted))' }}
            aria-label={`Session for ${team?.name}`}
        >
            {isDraggable && <GripVertical className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />}
            <div className="flex flex-col w-full">
                <p className="font-bold text-sm text-card-foreground">{team?.name}</p>
                {isPlaced && (
                     <p className="text-xs font-semibold text-primary flex items-center gap-1">
                        <Clock className="h-3 w-3"/>
                        {startTimeStr} - {endTimeStr}
                    </p>
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

// --- GYM SCHEDULE GRID (WEEK VIEW) ---
const GymScheduleGrid = ({ gym }: { gym: Gym }) => {
    const { getSessionsByGymAndDay } = useScheduler();
    
    const timeSlots = useMemo(() => Array.from({ length: (MASTER_END_HOUR - MASTER_START_HOUR) * 4 }, (_, i) => {
        const totalMinutes = MASTER_START_HOUR * 60 + i * 15;
        const hour = Math.floor(totalMinutes / 60);
        const minute = totalMinutes % 60;
        if (minute === 0) {
            return { time: `${hour.toString().padStart(2, '0')}:00`, isHour: true };
        }
        return { time: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`, isHour: false };
    }), []);


    return (
        <Card>
            <CardContent className="p-0">
                <div className="grid grid-cols-[auto_repeat(7,1fr)] min-w-full">
                    {/* Time Column Header */}
                    <div className="row-span-1 col-span-1 bg-card border-r sticky top-0 z-20">
                         <div className="h-12 border-b flex items-center justify-center font-semibold text-muted-foreground">Orario</div>
                    </div>
                    {/* Day Headers */}
                    {DAYS_OF_WEEK.map(day => {
                        const dayConfig = gym.availability.find(d => d.key === day.key);
                        const totalAvailableMinutes = (dayConfig?.slots || []).reduce((sum, slot) => sum + (slot.end - slot.start), 0);
                        const scheduledMinutes = getSessionsByGymAndDay(gym.id, day.key).reduce((sum, session) => sum + session.duration, 0);
                        const remainingHours = ((totalAvailableMinutes - scheduledMinutes) / 60).toFixed(1);

                        return (
                             <div key={day.key} className="col-span-1 h-12 flex flex-col items-center justify-center border-b font-semibold text-center text-sm sticky top-0 bg-card z-10">
                                <span>{day.name}</span>
                                <span className="font-normal text-xs text-muted-foreground">{remainingHours}h libere</span>
                            </div>
                        )
                    })}
                    
                    {/* Time Slots Column */}
                    <div className="row-start-2 col-start-1 bg-card border-r sticky left-0 z-10">
                        {timeSlots.map(({time, isHour}) => (
                            <div key={time} className={`h-6 flex items-center justify-center text-muted-foreground ${isHour ? 'font-semibold text-xs border-t' : 'text-[10px]'}`}>
                               {isHour && time}
                            </div>
                        ))}
                    </div>

                    {/* Schedule Cells */}
                    {DAYS_OF_WEEK.map(day => (
                        <DayGymScheduleCell key={day.key} gym={gym} dayKey={day.key} />
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};


// --- DAY-GYM CELL (FOR BOTH VIEWS) ---

interface DayGymScheduleCellProps {
    gym: Gym;
    dayKey: number;
}
const DayGymScheduleCell = ({ gym, dayKey }: DayGymScheduleCellProps) => {
    const { getSessionsByGymAndDay, setPlacingSessionInfo } = useScheduler();
    
    const dayAvailability = gym.availability.find(d => d.key === dayKey);
    const slots = dayAvailability?.slots || [];
    const totalMinutesInView = (MASTER_END_HOUR - MASTER_START_HOUR) * 60;
    
    const allIntervals = Array.from({length: totalMinutesInView / 15}, (_, i) => {
        const start = MASTER_START_HOUR * 60 + i * 15;
        const end = start + 15;
        return { start, end };
    });

    const totalHeightInPx = allIntervals.length * 24; // 24px per 15-min slot

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const sessionId = e.dataTransfer.getData('sessionId');
        e.currentTarget.classList.remove('bg-accent/10');
        
        if (!sessionId) return;
        
        setPlacingSessionInfo({ sessionId, gymId: gym.id, dayKey });
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.currentTarget.classList.add('bg-accent/10');
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.currentTarget.classList.remove('bg-accent/10');
    };
    
    return (
        <div
            className="row-start-2 col-start-auto relative border-b border-l transition-colors"
            style={{ height: `${totalHeightInPx}px`, background: 'white' }}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
        >
             {/* Grid lines */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                 {allIntervals.map((_, i) => (
                    <div key={i} className={`h-6 border-t ${i % 4 === 0 ? 'border-border' : 'border-border/50'}`}/>
                ))}
            </div>

             {/* Background for available times */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                {slots.map((slot, index) => {
                    const top = ((slot.start - MASTER_START_HOUR * 60) / totalMinutesInView) * 100;
                    const height = ((slot.end - slot.start) / totalMinutesInView) * 100;
                    return (
                        <div 
                            key={`available-${index}`} 
                            className="absolute w-full" 
                            style={{ top: `${top}%`, height: `${height}%`, background: 'hsl(130, 70%, 95%)' }}
                        />
                    );
                })}
            </div>

            {/* Unavailable time patterns */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                {allIntervals.map(interval => {
                    const isAvailable = slots.some(slot => interval.start >= slot.start && interval.end <= slot.end);
                    if (isAvailable) return null;

                    const top = ((interval.start - MASTER_START_HOUR * 60) / totalMinutesInView) * 100;
                    const height = (15 / totalMinutesInView) * 100;
                    
                    return (
                         <div 
                            key={`unavailable-${interval.start}`} 
                            className="absolute w-full" 
                            style={{ 
                                top: `${top}%`, 
                                height: `${height}%`,
                                backgroundImage: 'repeating-linear-gradient(-45deg, transparent, transparent 4px, hsla(0,0%,0%,0.04) 4px, hsla(0,0%,0%,0.04) 8px))'
                            }}
                        />
                    )
                })}
            </div>


            {/* Scheduled Sessions */}
            <div className="relative z-10 h-full">
                {getSessionsByGymAndDay(gym.id, dayKey).map(session => {
                    if (session.startTime === null || session.duration <= 0) return null;
                    const top = ((session.startTime - MASTER_START_HOUR * 60) / totalMinutesInView) * 100;
                    const height = (session.duration / totalMinutesInView) * 100;

                    if (top < 0 || top >= 100) return null;

                    return (
                        <div key={session.id} className="absolute w-full" style={{ top: `${top}%`, height: `${height}%` }}>
                            <SessionCard session={session} isDraggable={true} />
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// --- DIALOGS ---

interface EditSessionDialogProps {
    session: Session;
}
function EditSessionDialog({ session }: EditSessionDialogProps) {
    const { teams, setEditingSession, moveSession } = useScheduler();
    const [newTime, setNewTime] = useState(formatTime(session.startTime));
    const team = teams.find(t => t.id === session.teamId);

    const handleSave = () => {
        const newStartTime = timeToMinutes(newTime);
        if (newStartTime !== null && session.gymId && session.day) {
           const success = moveSession(session.id, session.gymId, session.day, newStartTime);
           if (success) {
               setEditingSession(null);
           }
        }
    }

    if (!team) return null;

    return (
         <Dialog open={true} onOpenChange={() => setEditingSession(null)}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Modifica Orario Sessione</DialogTitle>
                    <DialogDescription>
                        Stai modificando la sessione per <strong>{team.name}</strong>.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="start-time" className="text-right">Nuovo Orario</Label>
                        <Input
                            id="start-time"
                            type="time"
                            step="900" // 15 minuti
                            value={newTime}
                            onChange={(e) => setNewTime(e.target.value)}
                            className="col-span-3"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setEditingSession(null)}>Annulla</Button>
                    <Button onClick={handleSave}>Salva Modifiche</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

interface PlaceSessionDialogProps {
  info: PlacingSessionInfo;
}
function PlaceSessionDialog({ info }: PlaceSessionDialogProps) {
    const { teams, sessions, setPlacingSessionInfo, moveSession, gyms } = useScheduler();
    const [newTime, setNewTime] = useState("17:00");

    const { sessionId, gymId, dayKey } = info; 
    
    const session = sessions.find(s => s.id === sessionId);
    const team = session ? teams.find(t => t.id === session.teamId) : null;
    const gym = gyms.find(g => g.id === gymId);
    const day = DAYS_OF_WEEK.find(d => d.key === dayKey);


    const handleSave = () => {
        const newStartTime = timeToMinutes(newTime);
        if (newStartTime !== null) {
           const success = moveSession(sessionId, gymId, dayKey, newStartTime);
           if (success) {
               setPlacingSessionInfo(null);
           }
        }
    }
    
    const handleClose = () => setPlacingSessionInfo(null);

    if (!session || !team || !gym || !day) return null;

    return (
         <Dialog open={true} onOpenChange={handleClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Inserisci Orario Sessione</DialogTitle>
                    <DialogDescription>
                        Stai assegnando <strong>{team.name}</strong> ({session.duration} min) a <strong>{gym.name}</strong> per <strong>{day.name}</strong>.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="start-time" className="text-right">Orario di Inizio</Label>
                        <Input
                            id="start-time"
                            type="time"
                            step="900" // 15 minuti
                            value={newTime}
                            onChange={(e) => setNewTime(e.target.value)}
                            className="col-span-3"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={handleClose}>Annulla</Button>
                    <Button variant="default" onClick={handleSave}>Salva e Posiziona</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

    

    
