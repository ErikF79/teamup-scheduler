"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Session, Config } from "@/lib/teamup";
import {
  Printer,
  Building2,
  Users,
  AlertCircle,
  UserCheck,
  CalendarDays,
  TableIcon,
  GanttChartSquare,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppShell } from "@/components/teamup/AppShell";
import { useTeamUpData } from "@/hooks/use-teamup-data";

const DAYS_OF_WEEK = [
  "Lunedì",
  "Martedì",
  "Mercoledì",
  "Giovedì",
  "Venerdì",
  "Sabato",
  "Domenica",
];

function formatTime(minutesFromDayStart: number | null) {
  if (minutesFromDayStart === null) return "N/A";
  const hours = Math.floor(minutesFromDayStart / 60);
  const minutes = minutesFromDayStart % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}`;
}

export default function PrintPage() {
  const { activeConfig: data, ready } = useTeamUpData();
  const [printMode, setPrintMode] = useState<"table" | "planner">("table");
  const [viewType, setViewType] = useState<"gym" | "team" | "day" | "coach">(
    "gym"
  );
  const [selectedId, setSelectedId] = useState<string>("all");

  useEffect(() => {
    setSelectedId("all");
  }, [viewType, printMode]);

  const sortedSessions = useMemo(() => {
    if (!data) return [];
    return [...data.sessions].sort((a, b) => {
      const daySort = (a.day ?? 8) - (b.day ?? 8);
      if (daySort !== 0) return daySort;
      return (a.startTime ?? 9999) - (b.startTime ?? 9999);
    });
  }, [data]);

  const renderContent = () => {
    if (!data) {
      return (
        <div className="p-8 text-center text-muted-foreground">
          <AlertCircle className="mx-auto mb-4 h-8 w-8" />
          Nessun dato da visualizzare. Controlla la configurazione nel pannello
          Admin.
        </div>
      );
    }

    if (printMode === "table") {
      switch (viewType) {
        case "gym": {
          const items =
            selectedId === "all"
              ? data.gyms
              : data.gyms.filter((g) => g.id === selectedId);
          return (
            <TablePrintView
              items={items}
              type="gym"
              sessions={sortedSessions}
              data={data}
            />
          );
        }
        case "team": {
          const items =
            selectedId === "all"
              ? data.teams
              : data.teams.filter((t) => t.id === selectedId);
          return (
            <TablePrintView
              items={items}
              type="team"
              sessions={sortedSessions}
              data={data}
            />
          );
        }
        case "day": {
          const items =
            selectedId === "all"
              ? DAYS_OF_WEEK.map((d, i) => ({ id: String(i + 1), name: d }))
              : [
                  {
                    id: selectedId,
                    name: DAYS_OF_WEEK[parseInt(selectedId) - 1],
                  },
                ];
          return (
            <TablePrintView
              items={items}
              type="day"
              sessions={sortedSessions}
              data={data}
            />
          );
        }
        case "coach": {
          const items =
            selectedId === "all"
              ? data.coaches || []
              : (data.coaches || []).filter((c) => c.id === selectedId);
          return (
            <TablePrintView
              items={items}
              type="coach"
              sessions={sortedSessions}
              data={data}
            />
          );
        }
        default:
          return null;
      }
    }

    switch (viewType) {
      case "gym": {
        const items =
          selectedId === "all"
            ? data.gyms
            : data.gyms.filter((g) => g.id === selectedId);
        return items.map((gym) => (
          <PlannerPrintView
            key={gym.id}
            item={gym}
            type="gym"
            sessions={sortedSessions}
            data={data}
          />
        ));
      }
      case "team": {
        const items =
          selectedId === "all"
            ? data.teams
            : data.teams.filter((t) => t.id === selectedId);
        return items.map((team) => (
          <PlannerPrintView
            key={team.id}
            item={team}
            type="team"
            sessions={sortedSessions}
            data={data}
          />
        ));
      }
      case "day": {
        const items =
          selectedId === "all"
            ? DAYS_OF_WEEK.map((d, i) => ({ id: String(i + 1), name: d }))
            : [
                {
                  id: selectedId,
                  name: DAYS_OF_WEEK[parseInt(selectedId) - 1],
                },
              ];
        return items.map((day) => (
          <PlannerPrintView
            key={day.id}
            item={day}
            type="day"
            sessions={sortedSessions}
            data={data}
          />
        ));
      }
      case "coach": {
        const items =
          selectedId === "all"
            ? data.coaches || []
            : (data.coaches || []).filter((c) => c.id === selectedId);
        return items.map((coach) => (
          <PlannerPrintView
            key={coach.id}
            item={coach}
            type="coach"
            sessions={sortedSessions}
            data={data}
          />
        ));
      }
      default:
        return null;
    }
  };

  const renderFilterOptions = () => {
    if (!data) return null;
    let options: { value: string; label: string }[] = [];
    switch (viewType) {
      case "gym":
        options = data.gyms.map((g) => ({ value: g.id, label: g.name }));
        break;
      case "team":
        options = data.teams.map((t) => ({ value: t.id, label: t.name }));
        break;
      case "day":
        options = DAYS_OF_WEEK.map((day, index) => ({
          value: String(index + 1),
          label: day,
        }));
        break;
      case "coach":
        options = (data.coaches || []).map((c) => ({
          value: c.id,
          label: c.name,
        }));
        break;
      default:
        return null;
    }

    return (
      <Select value={selectedId} onValueChange={setSelectedId}>
        <SelectTrigger className="w-full sm:w-[220px]">
          <SelectValue placeholder="Seleziona un elemento" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tutti</SelectItem>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  };

  if (!ready || !data) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-muted-foreground">
        Caricamento...
      </div>
    );
  }

  return (
    <AppShell configName={data.name}>
      <div className="mx-auto w-full max-w-6xl p-4 sm:p-6 lg:p-8">
        <div className="no-print mb-6">
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight sm:text-3xl">
            <Printer className="h-6 w-6 text-primary" />
            Stampa planner allenamenti
          </h1>
          <p className="text-sm text-muted-foreground">
            Genera report tabellari o planner grafici pronti per la stampa o il
            salvataggio in PDF.
          </p>
        </div>

        <Card className="no-print mb-6">
          <CardHeader>
            <CardTitle>Opzioni di stampa</CardTitle>
            <CardDescription>
              Scegli il formato e i filtri, poi avvia la stampa.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs
              value={printMode}
              onValueChange={(v) => setPrintMode(v as "table" | "planner")}
              className="w-full"
            >
              <TabsList className="mb-4 grid w-full grid-cols-2">
                <TabsTrigger value="table">
                  <TableIcon className="mr-2 h-4 w-4" />
                  Stampa tabellare
                </TabsTrigger>
                <TabsTrigger value="planner">
                  <GanttChartSquare className="mr-2 h-4 w-4" />
                  Stampa planner
                </TabsTrigger>
              </TabsList>
              <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                <div className="w-full sm:w-auto">
                  <label className="mb-1 block text-sm font-medium">
                    Raggruppa per
                  </label>
                  <Select
                    value={viewType}
                    onValueChange={(value) =>
                      setViewType(value as typeof viewType)
                    }
                  >
                    <SelectTrigger className="w-full sm:w-[220px]">
                      <SelectValue placeholder="Seleziona vista" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gym">
                        <Building2 className="mr-2 h-4 w-4" />
                        Palestra
                      </SelectItem>
                      <SelectItem value="team">
                        <Users className="mr-2 h-4 w-4" />
                        Squadra
                      </SelectItem>
                      <SelectItem value="day">
                        <CalendarDays className="mr-2 h-4 w-4" />
                        Giorno
                      </SelectItem>
                      <SelectItem value="coach">
                        <UserCheck className="mr-2 h-4 w-4" />
                        Coach
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-full sm:w-auto">
                  <label className="mb-1 block text-sm font-medium">
                    Filtra per
                  </label>
                  {renderFilterOptions()}
                </div>
              </div>
            </Tabs>

            <div className="mt-6 border-t pt-6">
              <Button onClick={() => window.print()}>
                <Printer className="mr-2 h-4 w-4" />
                Stampa / Salva PDF
              </Button>
            </div>
          </CardContent>
        </Card>

        <div
          className={`print-container mx-auto w-full rounded-lg border border-border bg-white p-6 text-gray-900 shadow-sm ${
            printMode === "planner" ? "print-planner" : "print-table"
          }`}
        >
          {renderContent()}
        </div>
      </div>
    </AppShell>
  );
}

const PrintHeader = ({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) => (
  <div className="mb-6 text-center">
    <h1 className="text-3xl font-bold text-gray-800">{title}</h1>
    <p className="text-lg text-gray-600">{subtitle}</p>
    <Separator className="my-4" />
  </div>
);

const TablePrintView = ({
  items,
  type,
  sessions,
  data,
}: {
  items: any[];
  type: "gym" | "team" | "day" | "coach";
  sessions: Session[];
  data: Config;
}) => {
  const { gyms, teams, coaches } = data;

  const getSubtitle = () => {
    switch (type) {
      case "gym":
        return "Riepilogo per Palestra";
      case "team":
        return "Riepilogo per Squadra";
      case "day":
        return "Riepilogo per Giorno";
      case "coach":
        return "Riepilogo per Coach";
    }
  };

  return (
    <div>
      <PrintHeader title="Programma Allenamenti" subtitle={getSubtitle()} />
      {items.map((item) => {
        let itemSessions: Session[] = [];
        let headers: string[] = [];
        let renderRow: (session: Session) => React.ReactNode;

        switch (type) {
          case "gym":
            itemSessions = sessions.filter((s) => s.gymId === item.id);
            headers = ["Giorno", "Orario", "Squadra", "Coach", "Durata"];
            renderRow = (s) => {
              const team = teams.find((t) => t.id === s.teamId);
              const sCoaches = (coaches || []).filter((c) =>
                (s.coachIds || []).includes(c.id)
              );
              return (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">
                    {s.day ? DAYS_OF_WEEK[s.day - 1] : "N/A"}
                  </TableCell>
                  <TableCell>
                    {formatTime(s.startTime)} -{" "}
                    {formatTime(s.startTime ? s.startTime + s.duration : null)}
                  </TableCell>
                  <TableCell>{team?.name || "N/A"}</TableCell>
                  <TableCell>
                    {sCoaches.map((c) => c.name).join(", ") || "N/D"}
                  </TableCell>
                  <TableCell className="text-right">{s.duration} min</TableCell>
                </TableRow>
              );
            };
            break;
          case "team":
            itemSessions = sessions.filter(
              (s) => s.teamId === item.id && s.gymId
            );
            headers = ["Giorno", "Orario", "Palestra", "Coach", "Durata"];
            renderRow = (s) => {
              const gym = gyms.find((g) => g.id === s.gymId);
              const sCoaches = (coaches || []).filter((c) =>
                (s.coachIds || []).includes(c.id)
              );
              return (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">
                    {s.day ? DAYS_OF_WEEK[s.day - 1] : "N/A"}
                  </TableCell>
                  <TableCell>
                    {formatTime(s.startTime)} -{" "}
                    {formatTime(s.startTime ? s.startTime + s.duration : null)}
                  </TableCell>
                  <TableCell>{gym?.name || "N/A"}</TableCell>
                  <TableCell>
                    {sCoaches.map((c) => c.name).join(", ") || "N/D"}
                  </TableCell>
                  <TableCell className="text-right">{s.duration} min</TableCell>
                </TableRow>
              );
            };
            break;
          case "day":
            itemSessions = sessions.filter(
              (s) => String(s.day) === item.id && s.gymId
            );
            headers = ["Orario", "Squadra", "Palestra", "Coach", "Durata"];
            renderRow = (s) => {
              const team = teams.find((t) => t.id === s.teamId);
              const gym = gyms.find((g) => g.id === s.gymId);
              const sCoaches = (coaches || []).filter((c) =>
                (s.coachIds || []).includes(c.id)
              );
              return (
                <TableRow key={s.id}>
                  <TableCell>
                    {formatTime(s.startTime)} -{" "}
                    {formatTime(s.startTime ? s.startTime + s.duration : null)}
                  </TableCell>
                  <TableCell className="font-medium">
                    {team?.name || "N/A"}
                  </TableCell>
                  <TableCell>{gym?.name || "N/A"}</TableCell>
                  <TableCell>
                    {sCoaches.map((c) => c.name).join(", ") || "N/D"}
                  </TableCell>
                  <TableCell className="text-right">{s.duration} min</TableCell>
                </TableRow>
              );
            };
            break;
          case "coach":
            itemSessions = sessions.filter(
              (s) => (s.coachIds || []).includes(item.id) && s.gymId
            );
            headers = ["Giorno", "Orario", "Squadra", "Palestra", "Durata"];
            renderRow = (s) => {
              const team = teams.find((t) => t.id === s.teamId);
              const gym = gyms.find((g) => g.id === s.gymId);
              return (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">
                    {s.day ? DAYS_OF_WEEK[s.day - 1] : "N/A"}
                  </TableCell>
                  <TableCell>
                    {formatTime(s.startTime)} -{" "}
                    {formatTime(s.startTime ? s.startTime + s.duration : null)}
                  </TableCell>
                  <TableCell>{team?.name || "N/A"}</TableCell>
                  <TableCell>{gym?.name || "N/A"}</TableCell>
                  <TableCell className="text-right">{s.duration} min</TableCell>
                </TableRow>
              );
            };
            break;
        }

        if (itemSessions.length === 0)
          return (
            <div key={item.id} className="page-break-inside-avoid mb-8">
              <h2 className="mb-3 border-b-2 border-primary pb-2 text-2xl font-semibold">
                {item.name}
              </h2>
              <p className="py-4 text-center text-muted-foreground">
                Nessun allenamento programmato.
              </p>
            </div>
          );

        return (
          <div key={item.id} className="page-break-inside-avoid mb-8">
            <h2 className="mb-3 border-b-2 border-primary pb-2 text-2xl font-semibold">
              {item.name}
            </h2>
            <Table>
              <TableHeader>
                <TableRow>
                  {headers.map((h) => (
                    <TableHead key={h}>{h}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>{itemSessions.map(renderRow)}</TableBody>
            </Table>
          </div>
        );
      })}
    </div>
  );
};

const PlannerPrintView = ({
  item,
  type,
  sessions,
  data,
}: {
  item: any;
  type: "gym" | "team" | "day" | "coach";
  sessions: Session[];
  data: Config;
}) => {
  const { gyms, teams, coaches, teamColors } = data;

  let title = item.name;
  let columns: { id: string; name: string }[] = [];
  let getColumnSessions: (columnId: string) => Session[] = () => [];
  let allItemSessions: Session[] = [];

  switch (type) {
    case "gym":
      columns = DAYS_OF_WEEK.map((d, i) => ({ id: String(i + 1), name: d }));
      allItemSessions = sessions.filter((s) => s.gymId === item.id);
      getColumnSessions = (columnId) => {
        const dayKey = parseInt(columnId);
        return allItemSessions.filter((s) => s.day === dayKey);
      };
      break;
    case "team":
      columns = DAYS_OF_WEEK.map((d, i) => ({ id: String(i + 1), name: d }));
      allItemSessions = sessions.filter((s) => s.teamId === item.id);
      getColumnSessions = (columnId) => {
        const dayKey = parseInt(columnId);
        return allItemSessions.filter((s) => s.day === dayKey);
      };
      break;
    case "coach":
      columns = DAYS_OF_WEEK.map((d, i) => ({ id: String(i + 1), name: d }));
      allItemSessions = sessions.filter((s) =>
        (s.coachIds || []).includes(item.id)
      );
      getColumnSessions = (columnId) => {
        const dayKey = parseInt(columnId);
        return allItemSessions.filter((s) => s.day === dayKey);
      };
      break;
    case "day":
      columns = gyms;
      title = `Planner per ${item.name}`;
      {
        const dayKey = parseInt(item.id);
        allItemSessions = sessions.filter((s) => s.day === dayKey);
        getColumnSessions = (columnId) =>
          allItemSessions.filter((s) => s.gymId === columnId);
      }
      break;
  }

  const { timeSlots, totalDuration, minTime } = useMemo(() => {
    const placedSessions = allItemSessions.filter((s) => s.startTime !== null);
    if (placedSessions.length === 0) {
      return { timeSlots: [], totalDuration: 0, minTime: 15 * 60 };
    }

    let minT = Math.min(...placedSessions.map((s) => s.startTime!));
    let maxT = Math.max(...placedSessions.map((s) => s.startTime! + s.duration));

    minT = Math.floor((minT - 30) / 30) * 30;
    maxT = Math.ceil((maxT + 30) / 30) * 30;

    const slots = [];
    for (let t = minT; t < maxT; t += 15) {
      const hours = Math.floor(t / 60);
      const minutes = t % 60;
      slots.push({
        totalMinutes: t,
        label: `${hours.toString().padStart(2, "0")}:${minutes
          .toString()
          .padStart(2, "0")}`,
      });
    }

    return { timeSlots: slots, totalDuration: maxT - minT, minTime: minT };
  }, [allItemSessions]);

  if (allItemSessions.filter((s) => s.startTime !== null).length === 0) {
    return (
      <div className="page-break-inside-avoid mb-8">
        <h2 className="mb-4 text-center text-2xl font-semibold">{title}</h2>
        <p className="py-4 text-center text-muted-foreground">
          Nessun allenamento programmato per questa vista.
        </p>
      </div>
    );
  }

  const gridHeight = timeSlots.length * 12;

  return (
    <div className="page-break-inside-avoid mb-8">
      <h2 className="mb-4 text-center text-2xl font-semibold">{title}</h2>
      <div className="flex border-l border-t border-gray-300">
        <div className="w-20 flex-shrink-0 border-r border-gray-300 bg-gray-50">
          <div className="h-10 border-b border-gray-300"></div>
          {timeSlots.map((slot, index) =>
            index % 2 === 0 ? (
              <div
                key={slot.label}
                className="flex items-center justify-center pt-1 text-center text-xs font-semibold"
                style={{ height: "6px" }}
              >
                {slot.totalMinutes % 60 === 0 && (
                  <span className="-translate-y-1/2">{slot.label}</span>
                )}
              </div>
            ) : (
              <div key={slot.label} style={{ height: "6px" }} />
            )
          )}
        </div>
        <div
          className="grid flex-grow"
          style={{ gridTemplateColumns: `repeat(${columns.length}, 1fr)` }}
        >
          {columns.map((col) => (
            <div key={col.id} className="relative border-r border-gray-300">
              <div className="flex h-10 items-center justify-center border-b border-gray-300 bg-gray-50 p-1 text-center text-sm font-semibold">
                {col.name}
              </div>
              <div className="relative" style={{ height: `${gridHeight}px` }}>
                {timeSlots.map((time, index) => (
                  <div
                    key={time.totalMinutes}
                    className={`absolute w-full ${
                      time.totalMinutes % 60 === 0
                        ? "border-t border-gray-200"
                        : "border-t border-gray-100"
                    }`}
                    style={{ top: `${(index / timeSlots.length) * 100}%` }}
                  ></div>
                ))}

                {getColumnSessions(col.id).map((session) => {
                  if (session.startTime === null || session.duration <= 0)
                    return null;
                  const topPercent =
                    ((session.startTime - minTime) / totalDuration) * 100;
                  const heightPercent =
                    (session.duration / totalDuration) * 100;

                  const team = teams.find((t) => t.id === session.teamId);
                  const sessionCoaches = (coaches || []).filter((c) =>
                    (session.coachIds || []).includes(c.id)
                  );
                  const gym = gyms.find((g) => g.id === session.gymId);

                  const color = teamColors[session.teamId] || "#ccc";
                  const darkColor = `color-mix(in srgb, ${color} 80%, black)`;

                  return (
                    <div
                      key={session.id}
                      className="absolute w-full px-0.5"
                      style={{
                        top: `${topPercent}%`,
                        height: `${heightPercent}%`,
                      }}
                    >
                      <div
                        className="flex h-full flex-col justify-start overflow-hidden rounded-sm border-l-4 p-1 text-[10px] leading-tight text-white"
                        style={{
                          backgroundColor: color,
                          borderLeftColor: darkColor,
                        }}
                      >
                        <p className="truncate text-xs font-bold">
                          {team?.name || "N/D"}
                        </p>
                        {type !== "gym" && (
                          <p className="truncate text-[10px] opacity-90">
                            {gym?.name || "N/D"}
                          </p>
                        )}
                        <p className="truncate text-[10px] opacity-90">
                          {sessionCoaches.map((c) => c.name).join(", ") || "N/D"}
                        </p>
                        <p className="mt-auto text-[10px] opacity-90">
                          {session.duration} min
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
