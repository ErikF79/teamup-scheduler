"use client";

import React, {
  useState,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { Session, Gym, Team, Coach } from "@/lib/teamup";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Building2,
  GripVertical,
  Users,
  CalendarDays,
  Clock,
  User,
  UserCheck,
  X,
  PanelLeft,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AppShell } from "@/components/teamup/AppShell";
import { useTeamUpData } from "@/hooks/use-teamup-data";
import { MultiSelect } from "react-multi-select-component";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// --- CONSTANTS ---
const MASTER_START_HOUR = 15;
const TIME_SLOT_HEIGHT_PX = 24;

const DAYS_OF_WEEK = [
  { key: 1, name: "Lunedì" },
  { key: 2, name: "Martedì" },
  { key: 3, name: "Mercoledì" },
  { key: 4, name: "Giovedì" },
  { key: 5, name: "Venerdì" },
  { key: 6, name: "Sabato" },
  { key: 7, name: "Domenica" },
];

// --- TYPES ---
interface PlacingSessionInfo {
  sessionId: string;
  gymId: string;
  dayKey: number;
}

interface SchedulerContextType {
  sessions: Session[];
  gyms: Gym[];
  teams: Team[];
  coaches: Coach[];
  teamColors: { [key: string]: string };
  moveSession: (
    sessionId: string,
    newGymId: string | null,
    newDay: number | null,
    newStartTime: number | null
  ) => boolean;
  assignCoachToSession: (coachId: string, sessionId: string) => void;
  updateSessionDetails: (
    sessionId: string,
    newStartTime: number,
    newCoachIds: string[]
  ) => boolean;
  getSessionsByGymAndDay: (gymId: string, day: number) => Session[];
  getUnassignedSessions: () => Session[];
  getUnassignedCoaches: () => Coach[];
  setEditingSession: (session: Session | null) => void;
  setPlacingSessionInfo: (info: PlacingSessionInfo | null) => void;
  placingSessionInfo: PlacingSessionInfo | null;
}

const SchedulerContext = createContext<SchedulerContextType | null>(null);

const useScheduler = () => {
  const context = useContext(SchedulerContext);
  if (!context) {
    throw new Error("useScheduler must be used within a SchedulerProvider");
  }
  return context;
};

// --- CONTAINER ---
export default function SchedulerContainer() {
  return <Scheduler />;
}

function Scheduler() {
  const { activeConfig: config, ready, updateActiveConfig, reload } =
    useTeamUpData();
  const { toast } = useToast();

  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [placingSessionInfo, setPlacingSessionInfo] =
    useState<PlacingSessionInfo | null>(null);
  const [view, setView] = useState<"gym" | "day">("gym");
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false);

  const updateSessions = (newSessions: Session[]) => {
    updateActiveConfig({ sessions: newSessions });
  };

  const validateMove = (
    sessionToMove: Session,
    newGymId: string,
    newDay: number,
    newStartTime: number
  ): boolean => {
    if (!config) return false;
    const sessionEndMinutes = newStartTime + sessionToMove.duration;

    const gym = config.gyms.find((g) => g.id === newGymId);
    if (!gym) return false;

    const dayConfig = gym.availability.find((d) => d.key === newDay);
    if (!dayConfig) {
      toast({
        title: "Errore",
        description: "Configurazione giorno non trovata.",
        variant: "destructive",
      });
      return false;
    }

    const isWithinAvailableSlot = dayConfig.slots.some(
      (slot) => newStartTime >= slot.start && sessionEndMinutes <= slot.end
    );

    if (!isWithinAvailableSlot) {
      toast({
        title: "Orario non valido!",
        description:
          "La sessione non rientra in una fascia oraria disponibile per la palestra.",
        variant: "destructive",
      });
      return false;
    }

    const collision = config.sessions.some((s) => {
      if (
        s.id === sessionToMove.id ||
        s.gymId !== newGymId ||
        s.day !== newDay ||
        s.startTime === null
      ) {
        return false;
      }
      const sStart = s.startTime;
      const sEnd = s.startTime + s.duration;
      return newStartTime < sEnd && sessionEndMinutes > sStart;
    });

    if (collision) {
      toast({
        title: "Collisione rilevata!",
        description: "Lo slot orario è già occupato da un'altra sessione.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const moveSession = (
    sessionId: string,
    newGymId: string | null,
    newDay: number | null,
    newStartTime: number | null
  ): boolean => {
    if (!config) return false;
    const sessionToMove = config.sessions.find((s) => s.id === sessionId);
    if (!sessionToMove) return false;

    if (newGymId === null || newDay === null || newStartTime === null) {
      const newSessions = config.sessions.map((s) =>
        s.id === sessionId
          ? { ...s, gymId: null, day: null, startTime: null }
          : s
      );
      updateSessions(newSessions);
      toast({ title: "Sessione rimossa dal calendario" });
      return true;
    }

    if (!validateMove(sessionToMove, newGymId, newDay, newStartTime)) {
      return false;
    }

    const updatedSession = {
      ...sessionToMove,
      gymId: newGymId,
      day: newDay,
      startTime: newStartTime,
    };
    const newSessions = config.sessions.map((s) =>
      s.id === sessionId ? updatedSession : s
    );
    updateSessions(newSessions);
    toast({ title: "Sessione spostata", description: "Modifica salvata." });
    return true;
  };

  const assignCoachToSession = (coachId: string, sessionId: string) => {
    if (!config) return;
    const newSessions = config.sessions.map((s) => {
      if (s.id === sessionId) {
        const newCoachIds = s.coachIds.includes(coachId)
          ? s.coachIds
          : [...s.coachIds, coachId];
        return { ...s, coachIds: newCoachIds };
      }
      return s;
    });
    updateSessions(newSessions);
    const coach = config.coaches.find((c) => c.id === coachId);
    const session = config.sessions.find((s) => s.id === sessionId);
    const team = config.teams.find((t) => t.id === session?.teamId);
    if (coach && team) {
      toast({
        title: "Coach assegnato",
        description: `${coach.name} assegnato alla sessione di ${team.name}.`,
      });
    }
  };

  const updateSessionDetails = (
    sessionId: string,
    newStartTime: number,
    newCoachIds: string[]
  ): boolean => {
    if (!config) return false;
    const sessionToUpdate = config.sessions.find((s) => s.id === sessionId);
    if (!sessionToUpdate || !sessionToUpdate.gymId || !sessionToUpdate.day)
      return false;

    if (newStartTime !== sessionToUpdate.startTime) {
      if (
        !validateMove(
          sessionToUpdate,
          sessionToUpdate.gymId,
          sessionToUpdate.day,
          newStartTime
        )
      ) {
        return false;
      }
    }

    const newSessions = config.sessions.map((s) =>
      s.id === sessionId
        ? { ...s, startTime: newStartTime, coachIds: newCoachIds }
        : s
    );
    updateSessions(newSessions);
    toast({ title: "Sessione aggiornata", description: "Modifiche salvate." });
    return true;
  };

  const getSessionsByGymAndDay = (gymId: string, day: number) => {
    if (!config) return [];
    return config.sessions.filter(
      (session) => session.gymId === gymId && session.day === day
    );
  };

  const getUnassignedSessions = () => {
    if (!config) return [];
    return config.sessions.filter((s) => s.gymId === null);
  };

  const getUnassignedCoaches = () => {
    if (!config) return [];
    const assignedCoachIds = new Set(
      config.sessions.flatMap((s) => s.coachIds || [])
    );
    return config.coaches.filter((c) => !assignedCoachIds.has(c.id));
  };

  const handleRefresh = () => {
    reload();
    toast({
      title: "Dati aggiornati",
      description: "La configurazione attiva è stata ricaricata.",
    });
  };

  if (!ready || !config) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-muted-foreground">
        Caricamento...
      </div>
    );
  }

  const unassignedCount = config.sessions.filter(
    (s) => s.gymId === null
  ).length;

  return (
    <AppShell configName={config.name} onRefresh={handleRefresh} fullBleed>
      <SchedulerContext.Provider
        value={{
          ...config,
          moveSession,
          assignCoachToSession,
          updateSessionDetails,
          getSessionsByGymAndDay,
          getUnassignedSessions,
          getUnassignedCoaches,
          setEditingSession,
          placingSessionInfo,
          setPlacingSessionInfo,
        }}
      >
        <Tabs
          value={view}
          onValueChange={(v) => setView(v as "gym" | "day")}
          className="flex h-full flex-col"
        >
          {/* Toolbar */}
          <div className="flex flex-shrink-0 items-center gap-2 border-b bg-card/60 px-3 py-2 lg:px-4">
            <Button
              variant="outline"
              size="sm"
              className="lg:hidden"
              onClick={() => setMobilePanelOpen(true)}
            >
              <PanelLeft className="mr-2 h-4 w-4" />
              Sessioni
              <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground">
                {unassignedCount}
              </span>
            </Button>
            <TabsList className="grid flex-1 grid-cols-2 sm:flex-none">
              <TabsTrigger value="gym">
                <Building2 className="mr-2 h-4 w-4" />
                Vista per Palestra
              </TabsTrigger>
              <TabsTrigger value="day">
                <CalendarDays className="mr-2 h-4 w-4" />
                Vista per Giorno
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex min-h-0 flex-1">
            {/* Colonna laterale desktop */}
            <aside className="scrollbar-thin hidden w-72 flex-shrink-0 flex-col gap-4 overflow-y-auto border-r p-4 lg:flex">
              <UnassignedSessionsColumn />
              <UnassignedCoachesColumn />
            </aside>

            {/* Vista calendario */}
            <div className="min-w-0 flex-1 overflow-hidden p-3 lg:p-4">
              <TabsContent value="gym" className="mt-0 h-full">
                <GymViewScheduler />
              </TabsContent>
              <TabsContent value="day" className="mt-0 h-full">
                <DayViewScheduler />
              </TabsContent>
            </div>
          </div>
        </Tabs>

        {/* Pannello mobile */}
        {mobilePanelOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setMobilePanelOpen(false)}
            />
            <div className="absolute inset-y-0 left-0 flex w-80 max-w-[88%] flex-col border-r bg-background shadow-xl">
              <div className="flex h-14 items-center justify-between border-b px-4">
                <span className="font-semibold">Da assegnare</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMobilePanelOpen(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <div className="scrollbar-thin flex-1 space-y-4 overflow-y-auto p-4">
                <UnassignedSessionsColumn />
                <UnassignedCoachesColumn />
              </div>
            </div>
          </div>
        )}

        {editingSession && <EditSessionDialog session={editingSession} />}
        {placingSessionInfo && (
          <PlaceSessionDialog info={placingSessionInfo} />
        )}
      </SchedulerContext.Provider>
    </AppShell>
  );
}

// --- VIEWS ---
const useScrollToTime = (viewportRef: React.RefObject<HTMLDivElement | null>) => {
  useEffect(() => {
    const scrollToHour = () => {
      if (viewportRef.current) {
        const scrollToPixel = MASTER_START_HOUR * 4 * TIME_SLOT_HEIGHT_PX;
        viewportRef.current.scrollTo({ top: scrollToPixel, behavior: "auto" });
      }
    };
    const animationFrameId = requestAnimationFrame(scrollToHour);
    return () => cancelAnimationFrame(animationFrameId);
  }, [viewportRef]);
};

function GymViewScheduler() {
  const { gyms } = useScheduler();
  const viewportRef = useRef<HTMLDivElement>(null);
  useScrollToTime(viewportRef);

  if (!gyms || gyms.length === 0) {
    return (
      <div className="pt-10 text-center text-muted-foreground">
        Nessuna palestra definita. Vai al pannello Admin per aggiungerne una.
      </div>
    );
  }

  return (
    <Tabs
      defaultValue={gyms[0].id}
      className="flex h-full flex-col overflow-hidden"
    >
      <div className="flex-shrink-0 pb-3">
        <TabsList className="h-auto flex-wrap justify-start">
          {gyms.map((gym) => (
            <TabsTrigger key={gym.id} value={gym.id} className="my-1 mx-1">
              {gym.name}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
      <ScrollArea className="h-full flex-1" viewportRef={viewportRef}>
        {gyms.map((gym) => (
          <TabsContent key={gym.id} value={gym.id} className="mt-0">
            <GymScheduleGrid gym={gym} />
          </TabsContent>
        ))}
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </Tabs>
  );
}

function DayViewScheduler() {
  const { gyms } = useScheduler();
  const viewportRef = useRef<HTMLDivElement>(null);
  useScrollToTime(viewportRef);

  const timeSlots = useMemo(() => {
    const slots = [];
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += 15) {
        const totalMinutes = h * 60 + m;
        if (m === 0) {
          slots.push({
            totalMinutes,
            time: `${h.toString().padStart(2, "0")}:00`,
            isHour: true,
          });
        } else {
          slots.push({
            totalMinutes,
            time: `${h.toString().padStart(2, "0")}:${m
              .toString()
              .padStart(2, "0")}`,
            isHour: false,
          });
        }
      }
    }
    return slots;
  }, []);

  if (!gyms || gyms.length === 0) {
    return (
      <div className="pt-10 text-center text-muted-foreground">
        Nessuna palestra definita. Vai al pannello Admin per aggiungerne una.
      </div>
    );
  }

  return (
    <Tabs defaultValue="1" className="flex h-full flex-col overflow-hidden">
      <div className="flex-shrink-0 pb-3">
        <TabsList className="grid w-full grid-cols-4 md:grid-cols-7">
          {DAYS_OF_WEEK.map((day) => (
            <TabsTrigger key={day.key} value={String(day.key)}>
              {day.name}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
      <ScrollArea className="h-full flex-1" viewportRef={viewportRef}>
        <div
          className="grid min-w-full grid-cols-[auto_repeat(var(--gym-count),1fr)]"
          style={
            {
              "--gym-count": gyms.length,
              minWidth: `${gyms.length * 150 + 60}px`,
            } as React.CSSProperties
          }
        >
          <div className="sticky top-0 z-20 col-span-1 row-span-1 border-r bg-card">
            <div className="flex h-12 items-center justify-center border-b font-semibold text-muted-foreground">
              Orario
            </div>
          </div>
          {DAYS_OF_WEEK.map((day) => (
            <TabsContent
              key={day.key}
              value={String(day.key)}
              className="contents mt-0"
            >
              {gyms.map((gym) => (
                <DayHeaderCell
                  key={`${gym.id}-${day.key}`}
                  gym={gym}
                  dayKey={day.key}
                />
              ))}
            </TabsContent>
          ))}

          <div className="sticky left-0 z-10 col-start-1 row-start-2 border-r bg-card">
            {timeSlots.map(({ time, isHour }) => (
              <div
                key={time}
                className={`flex h-6 items-center justify-center text-muted-foreground ${
                  isHour ? "border-t text-xs font-semibold" : "text-[10px]"
                }`}
              >
                {isHour && time}
              </div>
            ))}
          </div>
          {DAYS_OF_WEEK.map((day) => (
            <TabsContent
              key={day.key}
              value={String(day.key)}
              className="contents mt-0"
            >
              {gyms.map((gym) => (
                <DayGymScheduleCell
                  key={`${gym.id}-${day.key}`}
                  gym={gym}
                  dayKey={day.key}
                />
              ))}
            </TabsContent>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </Tabs>
  );
}

function DayHeaderCell({ gym, dayKey }: { gym: Gym; dayKey: number }) {
  const { getSessionsByGymAndDay } = useScheduler();
  const dayConfig = gym.availability.find((d) => d.key === dayKey);
  const totalAvailableMinutes = (dayConfig?.slots || []).reduce(
    (sum, slot) => sum + (slot.end - slot.start),
    0
  );
  const scheduledSessions = getSessionsByGymAndDay(gym.id, dayKey);
  const scheduledMinutes = scheduledSessions.reduce(
    (sum, session) => sum + session.duration,
    0
  );
  const remainingHours = (
    (totalAvailableMinutes - scheduledMinutes) /
    60
  ).toFixed(1);

  return (
    <div className="sticky top-0 z-20 col-span-1 flex h-12 flex-col items-center justify-center border-b bg-card px-2 text-center text-sm font-semibold">
      <span>{gym.name}</span>
      <span className="text-xs font-normal text-muted-foreground">
        {remainingHours}h libere
      </span>
    </div>
  );
}

// --- UTILITY FUNCTIONS ---
function formatTime(minutesFromDayStart: number | null) {
  if (minutesFromDayStart === null) return "";
  const hours = Math.floor(minutesFromDayStart / 60);
  const minutes = minutesFromDayStart % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}`;
}

function timeToMinutes(timeString: string) {
  const [hours, minutes] = timeString.split(":").map(Number);
  if (isNaN(hours) || isNaN(minutes)) return null;
  return hours * 60 + minutes;
}

// --- SESSION CARD ---
interface SessionCardProps {
  session: Session;
  isDraggable?: boolean;
}
const SessionCard = React.forwardRef<HTMLDivElement, SessionCardProps>(
  ({ session, isDraggable = true }, ref) => {
    const { teams, teamColors, setEditingSession, coaches } = useScheduler();
    const team = teams.find((t) => t.id === session.teamId);

    const assignedCoaches = useMemo(
      () => coaches.filter((c) => session.coachIds.includes(c.id)),
      [coaches, session.coachIds]
    );
    const coachNames = assignedCoaches.map((c) => c.name).join(", ");

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
      if (!isDraggable) {
        e.preventDefault();
        return;
      }
      e.dataTransfer.setData("sessionId", session.id);
      e.currentTarget.style.opacity = "0.5";
    };

    const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
      if (!isDraggable) return;
      e.currentTarget.style.opacity = "1";
    };

    const handleClick = () => {
      if (session.startTime !== null) {
        setEditingSession(session);
      }
    };

    if (!team) return null;

    const isPlaced = session.startTime !== null;
    const startTimeStr = formatTime(session.startTime);
    const endTimeStr = isPlaced
      ? formatTime(session.startTime! + session.duration)
      : "";
    const cursorClass = isPlaced
      ? "cursor-pointer hover:ring-2 hover:ring-primary/60"
      : "cursor-grab active:cursor-grabbing";

    return (
      <div
        ref={ref}
        draggable={isDraggable}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onClick={handleClick}
        className={`mx-1 flex h-full items-start gap-2 rounded-lg border border-border/60 bg-card px-2 py-1 shadow-sm ${
          isDraggable ? cursorClass : ""
        }`}
        style={{
          borderLeftWidth: "4px",
          borderLeftColor: teamColors[session.teamId] || "hsl(var(--muted))",
        }}
        aria-label={`Sessione per ${team?.name}`}
      >
        {isDraggable && (
          <GripVertical className="mt-1 h-5 w-5 shrink-0 text-muted-foreground" />
        )}
        <div className="flex w-full flex-col overflow-hidden">
          <p className="truncate text-sm font-bold text-card-foreground">
            {team?.name}
          </p>
          {isPlaced && (
            <p className="flex items-center gap-1 text-xs font-semibold text-primary">
              <Clock className="h-3 w-3" />
              {startTimeStr} - {endTimeStr}
            </p>
          )}
          <p className="text-xs text-muted-foreground">{session.duration} min</p>
          {coachNames && (
            <p
              className="mt-1 flex items-center gap-1 truncate text-xs text-muted-foreground"
              title={coachNames}
            >
              <User className="h-3 w-3" /> {coachNames}
            </p>
          )}
        </div>
      </div>
    );
  }
);
SessionCard.displayName = "SessionCard";

// --- UNASSIGNED SESSIONS COLUMN ---
const UnassignedSessionsColumn = () => {
  const { getUnassignedSessions, moveSession, teams } = useScheduler();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isOver, setIsOver] = useState(false);
  const unassignedSessions = getUnassignedSessions();

  const getCategoryFromTeamName = (name: string) => {
    return name.split(" ").pop() || name;
  };

  const categories = useMemo(() => {
    const unassignedTeamIds = new Set(unassignedSessions.map((s) => s.teamId));
    const relevantTeams = teams.filter((t) => unassignedTeamIds.has(t.id));
    const uniqueCategories = [
      ...new Set(relevantTeams.map((t) => getCategoryFromTeamName(t.name))),
    ];
    return uniqueCategories.sort();
  }, [unassignedSessions, teams]);

  const filteredSessions = useMemo(() => {
    if (selectedCategory === "all") return unassignedSessions;
    return unassignedSessions.filter((session) => {
      const team = teams.find((t) => t.id === session.teamId);
      return team && getCategoryFromTeamName(team.name) === selectedCategory;
    });
  }, [unassignedSessions, selectedCategory, teams]);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsOver(true);
  };
  const handleDragLeave = () => setIsOver(false);
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const sessionId = e.dataTransfer.getData("sessionId");
    if (sessionId) moveSession(sessionId, null, null, null);
    setIsOver(false);
  };

  return (
    <Card
      className={`flex max-h-72 w-full flex-shrink-0 flex-col transition-colors lg:max-h-[45%] ${
        isOver ? "bg-accent/10 ring-2 ring-accent/40" : ""
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <CardHeader className="flex-shrink-0 border-b p-4">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Users className="h-5 w-5 text-primary" />
          Sessioni da assegnare
          <span className="ml-auto flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
            {unassignedSessions.length}
          </span>
        </CardTitle>
        <div className="pt-2">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="h-9 w-full">
              <SelectValue placeholder="Filtra per categoria..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutte le categorie</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <ScrollArea className="flex-1">
        <CardContent className="space-y-3 p-4">
          {filteredSessions.length > 0 ? (
            filteredSessions.map((session) => (
              <div key={session.id} className="h-20">
                <SessionCard session={session} />
              </div>
            ))
          ) : (
            <div className="pt-10 text-center text-sm text-muted-foreground">
              {unassignedSessions.length === 0
                ? "Tutte le sessioni sono pianificate!"
                : "Nessuna sessione in questa categoria."}
            </div>
          )}
        </CardContent>
      </ScrollArea>
    </Card>
  );
};

// --- UNASSIGNED COACHES COLUMN ---
const UnassignedCoachesColumn = () => {
  const { coaches, sessions } = useScheduler();

  const assignedCoachIds = useMemo(
    () => new Set(sessions.flatMap((s) => s.coachIds || [])),
    [sessions]
  );

  const unassignedCoaches = useMemo(
    () => coaches.filter((c) => !assignedCoachIds.has(c.id)),
    [coaches, assignedCoachIds]
  );

  if (coaches.length === 0) return null;

  return (
    <Card className="flex max-h-72 w-full shrink-0 flex-col lg:max-h-[45%]">
      <CardHeader className="flex-shrink-0 border-b p-4">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <UserCheck className="h-5 w-5 text-primary" />
          Coach da assegnare
          <span className="ml-auto flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
            {unassignedCoaches.length}
          </span>
        </CardTitle>
      </CardHeader>
      <ScrollArea className="flex-1">
        <CardContent className="space-y-3 p-4">
          {unassignedCoaches.length > 0 ? (
            unassignedCoaches.map((coach) => (
              <CoachCard key={coach.id} coach={coach} />
            ))
          ) : (
            <div className="pt-10 text-center text-sm text-muted-foreground">
              Tutti i coach sono impegnati!
            </div>
          )}
        </CardContent>
      </ScrollArea>
    </Card>
  );
};

const CoachCard = ({ coach }: { coach: Coach }) => {
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData("coachId", coach.id);
    e.currentTarget.style.opacity = "0.5";
  };
  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.style.opacity = "1";
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className="flex h-12 cursor-grab items-center gap-2 rounded-lg border bg-card p-2 shadow-sm active:cursor-grabbing"
    >
      <GripVertical className="h-5 w-5 shrink-0 text-muted-foreground" />
      <p className="text-sm font-semibold text-card-foreground">{coach.name}</p>
    </div>
  );
};

// --- GYM SCHEDULE GRID (WEEK VIEW) ---
function GymDayHeaderCell({
  gym,
  day,
}: {
  gym: Gym;
  day: { key: number; name: string };
}) {
  const { getSessionsByGymAndDay } = useScheduler();
  const dayConfig = gym.availability.find((d) => d.key === day.key);
  const totalAvailableMinutes = (dayConfig?.slots || []).reduce(
    (sum, slot) => sum + (slot.end - slot.start),
    0
  );
  const scheduledSessions = getSessionsByGymAndDay(gym.id, day.key);
  const scheduledMinutes = scheduledSessions.reduce(
    (sum, session) => sum + session.duration,
    0
  );
  const remainingHours = (
    (totalAvailableMinutes - scheduledMinutes) /
    60
  ).toFixed(1);

  return (
    <div className="sticky top-0 z-20 col-span-1 flex h-12 flex-col items-center justify-center border-b bg-card px-2 text-center text-sm font-semibold">
      <span>{day.name}</span>
      <span className="text-xs font-normal text-muted-foreground">
        {remainingHours}h libere
      </span>
    </div>
  );
}

const GymScheduleGrid = ({ gym }: { gym: Gym }) => {
  const timeSlots = useMemo(() => {
    const slots = [];
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += 15) {
        const totalMinutes = h * 60 + m;
        if (m === 0) {
          slots.push({
            totalMinutes,
            time: `${h.toString().padStart(2, "0")}:00`,
            isHour: true,
          });
        } else {
          slots.push({
            totalMinutes,
            time: `${h.toString().padStart(2, "0")}:${m
              .toString()
              .padStart(2, "0")}`,
            isHour: false,
          });
        }
      }
    }
    return slots;
  }, []);

  return (
    <Card>
      <CardContent className="p-0">
        <div className="grid min-w-max grid-cols-[auto_repeat(7,1fr)]">
          <div className="sticky top-0 z-20 col-span-1 row-span-1 border-r bg-card">
            <div className="flex h-12 items-center justify-center border-b font-semibold text-muted-foreground">
              Orario
            </div>
          </div>
          {DAYS_OF_WEEK.map((day) => (
            <GymDayHeaderCell key={day.key} gym={gym} day={day} />
          ))}

          <div className="sticky left-0 z-10 col-start-1 row-start-2 border-r bg-card">
            {timeSlots.map(({ time, isHour }) => (
              <div
                key={time}
                className={`flex h-6 items-center justify-center text-muted-foreground ${
                  isHour ? "border-t text-xs font-semibold" : "text-[10px]"
                }`}
              >
                {isHour && time}
              </div>
            ))}
          </div>

          {DAYS_OF_WEEK.map((day) => (
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

  const dayAvailability = gym.availability.find((d) => d.key === dayKey);
  const slots = dayAvailability?.slots || [];
  const totalMinutesInView = 24 * 60;

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const sessionId = e.dataTransfer.getData("sessionId");
    e.currentTarget.classList.remove("bg-accent/10");
    if (!sessionId) return;
    setPlacingSessionInfo({ sessionId, gymId: gym.id, dayKey });
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.classList.add("bg-accent/10");
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.classList.remove("bg-accent/10");
  };

  return (
    <div
      className="relative col-start-auto row-start-2 min-w-[150px] border-b border-l bg-background transition-colors"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <div className="pointer-events-none absolute inset-0 z-0">
        {slots.map((slot, index) => {
          const top = (slot.start / totalMinutesInView) * 100;
          const height = ((slot.end - slot.start) / totalMinutesInView) * 100;
          return (
            <div
              key={`available-${index}`}
              className="absolute w-full bg-success/10"
              style={{ top: `${top}%`, height: `${height}%` }}
            />
          );
        })}
      </div>

      <div className="relative z-10 h-full">
        {getSessionsByGymAndDay(gym.id, dayKey).map((session) => {
          if (session.startTime === null || session.duration <= 0) return null;
          const top = (session.startTime / totalMinutesInView) * 100;
          const height = (session.duration / totalMinutesInView) * 100;
          if (top < 0 || top >= 100) return null;

          return (
            <SessionWrapper
              key={session.id}
              session={session}
              style={{ top: `${top}%`, height: `${height}%` }}
            >
              <SessionCard session={session} isDraggable={true} />
            </SessionWrapper>
          );
        })}
      </div>
    </div>
  );
};

const SessionWrapper = ({
  session,
  style,
  children,
}: {
  session: Session;
  style: React.CSSProperties;
  children: React.ReactNode;
}) => {
  const { assignCoachToSession } = useScheduler();
  const [isOver, setIsOver] = useState(false);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const coachId = e.dataTransfer.getData("coachId");
    if (coachId) assignCoachToSession(coachId, session.id);
    setIsOver(false);
  };
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOver(true);
  };
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.stopPropagation();
    setIsOver(false);
  };

  return (
    <div
      className={`absolute w-full transition-all duration-200 ${
        isOver ? "ring-2 ring-accent ring-offset-2" : ""
      }`}
      style={style}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <div className="h-full w-full">{children}</div>
    </div>
  );
};

// --- DIALOGS ---
function EditSessionDialog({ session }: { session: Session }) {
  const { teams, coaches, setEditingSession, updateSessionDetails } =
    useScheduler();
  const [newTime, setNewTime] = useState(formatTime(session.startTime));

  const coachOptions = useMemo(
    () => coaches.map((c) => ({ label: c.name, value: c.id })),
    [coaches]
  );

  const [selectedCoaches, setSelectedCoaches] = useState(
    coachOptions.filter((opt) => (session.coachIds || []).includes(opt.value))
  );

  const team = teams.find((t) => t.id === session.teamId);

  const handleSave = () => {
    const newStartTime = timeToMinutes(newTime);
    if (newStartTime !== null && session.gymId && session.day) {
      const newCoachIds = selectedCoaches.map((c) => c.value);
      const success = updateSessionDetails(session.id, newStartTime, newCoachIds);
      if (success) setEditingSession(null);
    }
  };

  if (!team) return null;

  return (
    <Dialog open={true} onOpenChange={() => setEditingSession(null)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Modifica dettagli sessione</DialogTitle>
          <DialogDescription>
            Sessione per <strong>{team.name}</strong>.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="start-time" className="text-right">
              Nuovo orario
            </Label>
            <Input
              id="start-time"
              type="time"
              step="900"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="coach-select" className="text-right">
              Coach
            </Label>
            <div className="col-span-3">
              <MultiSelect
                options={coachOptions}
                value={selectedCoaches}
                onChange={setSelectedCoaches}
                labelledBy="Seleziona Coach"
                overrideStrings={{
                  allItemsAreSelected: "Tutti i coach selezionati.",
                  noOptions: "Nessun coach disponibile",
                  search: "Cerca",
                  selectSomeItems: "Seleziona coach...",
                }}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setEditingSession(null)}>
            Annulla
          </Button>
          <Button onClick={handleSave}>Salva modifiche</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PlaceSessionDialog({ info }: { info: PlacingSessionInfo }) {
  const { teams, sessions, setPlacingSessionInfo, moveSession, gyms } =
    useScheduler();
  const [newTime, setNewTime] = useState("17:00");

  const { sessionId, gymId, dayKey } = info;

  const session = sessions.find((s) => s.id === sessionId);
  const team = session ? teams.find((t) => t.id === session.teamId) : null;
  const gym = gyms.find((g) => g.id === gymId);
  const day = DAYS_OF_WEEK.find((d) => d.key === dayKey);

  const handleSave = () => {
    const newStartTime = timeToMinutes(newTime);
    if (newStartTime !== null) {
      const success = moveSession(sessionId, gymId, dayKey, newStartTime);
      if (success) setPlacingSessionInfo(null);
    }
  };

  const handleClose = () => setPlacingSessionInfo(null);

  if (!session || !team || !gym || !day) return null;

  return (
    <Dialog open={true} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Inserisci orario sessione</DialogTitle>
          <DialogDescription>
            Assegnazione di <strong>{team.name}</strong> ({session.duration} min)
            a <strong>{gym.name}</strong> per <strong>{day.name}</strong>.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="place-time" className="text-right">
              Orario di inizio
            </Label>
            <Input
              id="place-time"
              type="time"
              step="900"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Annulla
          </Button>
          <Button onClick={handleSave}>Salva e posiziona</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
