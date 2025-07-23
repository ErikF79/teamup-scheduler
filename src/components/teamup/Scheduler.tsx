
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
    let sessionToMove = appData.sessions.find(s => s.id === sessionId);
    if (!sessionToMove) return false;

    const updatedSession = { ...sessionToMove, gymId: newGymId, day: newDay, startTime: newStartTime };
    
    if (newGymId && newDay !== null && newStartTime !== null) {
        const gym = appData.gyms.find(g => g.id === newGymId);
        const dayConfig = gym?.availability.find(d => d.key === newDay);
        const availabilitySlots = dayConfig?.slots || [];
        const sessionEndMinutes = newStartTime + updatedSession.duration;

        if (gym && availabilitySlots.length > 0) {
             let isWithinAvailableSlot = true;
             for (let minute = newStartTime; minute < sessionEndMinutes; minute++) {
                 const isMinuteAvailable = availabilitySlots.some(slot => minute >= slot.start && minute < slot.end);
                 if (!isMinuteAvailable) {
                     isWithinAvailableSlot = false;
                     break;
                 }
             }

             if (!isWithinAvailableSlot) {
                 toast({
                    title: "Orario non valido!",
                    description: "La sessione è fuori dagli orari disponibili o si estende su una fascia non disponibile.",
                    variant: "destructive"
                });
                return false;
             }
        } else if (gym) { // No slots defined for the day
             toast({
                title: "Orario non valido!",
                description: `La palestra ${gym.name} è chiusa in questo giorno.`,
                variant: "destructive"
            });
            return false;
        }

        const collision = appData.sessions.some(s => {
            if (s.id === sessionId || s.gymId !== newGymId || s.day !== newDay || s.startTime === null) {
                return false;
            }
            const s_start = s.startTime;
            const s_end = s.startTime + s.duration;
            const new_start = newStartTime;
            const new_end = newStartTime + updatedSession.duration;
            
            return new_start < s_end && new_end > s_start;
        });

        if (collision) {
            toast({
                title: "Collisione Rilevata!",
                description: "Impossibile spostare la sessione in questo slot orario, è già occupato.",
                variant: "destructive"
            });
            return false;
        }
    }

    const newSessions = appData.sessions.map(s => s.id === sessionId ? updatedSession : s);
    updateSessions(newSessions);

    toast({
        title: "Sessione Spostata",
        description: "La modifica è salvata in memoria per questa sessione.",
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
    <SchedulerContext.Provider value={{ ...appData, moveSession, getSessionsByGymAndDay, getUnassignedSessions, setEditingSession }}>
        <div className="flex-grow flex p-4 gap-4 overflow-hidden h-full">
            <UnassignedSessionsColumn />
             <div className="flex-grow flex flex-col h-full overflow-hidden">
                 <Tabs defaultValue="gym-view" className="flex-grow flex flex-col h-full overflow-hidden">
                    <div className="flex-shrink-0 flex items-center justify-between pb-4">
                         <TabsList>
                            <TabsTrigger value="gym-view"><Building2 className="mr-2 h-4 w-4"/>Vista per Palestra</TabsTrigger>
                            <TabsTrigger value="day-view"><CalendarDays className="mr-2 h-4 w-4"/>Vista per Giorno</TabsTrigger>
                        </TabsList>
                        <Card className="hidden">
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
    const { gyms } = useScheduler();

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
                    {gyms.map(gym => (
                        <div key={gym.id} className="col-span-1 h-12 flex items-center justify-center border-b font-semibold text-center text-sm px-2 sticky top-0 z-20 bg-card">
                            {gym.name}
                        </div>
                    ))}

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
            className={`p-2 rounded-lg shadow-md flex items-start gap-2 border-l-4 bg-card ${isDraggable ? cursorClass : ''}`}
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
                    {DAYS_OF_WEEK.map(day => (
                        <div key={day.key} className="col-span-1 h-12 flex items-center justify-center border-b font-semibold text-center text-sm sticky top-0 bg-card z-10">
                            {day.name}
                        </div>
                    ))}
                    
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
    const { getSessionsByGymAndDay, moveSession } = useScheduler();
    
    const dayAvailability = gym.availability.find(d => d.key === dayKey);
    const slots = dayAvailability?.slots || [];
    const totalMinutesInView = (MASTER_END_HOUR - MASTER_START_HOUR) * 60;
    
    // Create an array representing all 15-minute intervals in the view
    const allIntervals = Array.from({length: totalMinutesInView / 15}, (_, i) => {
        const start = MASTER_START_HOUR * 60 + i * 15;
        const end = start + 15;
        return { start, end };
    });

    // Determine which of these intervals are unavailable
    const unavailableIntervals = allIntervals.filter(interval => 
        !slots.some(slot => interval.start >= slot.start && interval.end <= slot.end)
    );

    const totalHeightInPx = allIntervals.length * 24; // 24px per 15-min slot

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const sessionId = e.dataTransfer.getData('sessionId');
        const target = e.currentTarget;
        target.classList.remove('bg-accent/10');
        
        if (!sessionId) return;

        const contentRect = target.getBoundingClientRect();
        const dropY = e.clientY - contentRect.top;
        
        if (contentRect.height <= 0) return;

        const minutesFromCellTop = (dropY / contentRect.height) * totalMinutesInView;
        const snappedMinutes = Math.floor(minutesFromCellTop / 15) * 15;
        const newStartTime = (MASTER_START_HOUR * 60) + snappedMinutes;

        moveSession(sessionId, gym.id, dayKey, newStartTime);
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
            className="row-start-2 col-start-auto relative border-b border-l transition-colors bg-background"
            style={{ height: `${totalHeightInPx}px` }}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
        >
            {/* Grid lines */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                 {allIntervals.map((_, i) => (
                    <div key={i} className={`h-6 border-t ${i % 4 === 0 ? 'border-gray-300 dark:border-gray-700' : 'border-gray-200/70 dark:border-gray-800/70'}`}/>
                ))}
            </div>
             {/* Background masks for unavailable times */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                {unavailableIntervals.map((interval, index) => {
                    const top = ((interval.start - MASTER_START_HOUR * 60) / totalMinutesInView) * 100;
                    const height = (15 / totalMinutesInView) * 100;
                    return (
                        <div 
                            key={index} 
                            className="absolute w-full bg-muted/50" 
                            style={{ top: `${top}%`, height: `${height}%` }}
                        />
                    );
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
                        <div key={session.id} className="absolute w-full px-1" style={{ top: `${top}%`, height: `${height}%` }}>
                            <SessionCard session={session} isDraggable={true} />
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// --- EDIT SESSION DIALOG ---
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

    



    



    
