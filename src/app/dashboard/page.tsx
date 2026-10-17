"use client";

import { useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { AppShell } from "@/components/teamup/AppShell";
import { useTeamUpData } from "@/hooks/use-teamup-data";
import {
  Building2,
  Users,
  Calendar,
  Hourglass,
  Percent,
  UserCheck,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const AVAILABLE_COLOR = "#0d7fb8";
const REQUIRED_COLOR = "#800000";

function getWeeksBetween(d1: Date, d2: Date) {
  if (d1 > d2) return 0;
  return Math.ceil((d2.getTime() - d1.getTime()) / (7 * 24 * 60 * 60 * 1000));
}

function StatCard({
  icon: Icon,
  label,
  value,
  tint = "primary",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
  tint?: "primary" | "accent" | "success" | "destructive" | "muted";
}) {
  const tintClass: Record<string, string> = {
    primary: "bg-primary/10 text-primary",
    accent: "bg-accent/15 text-accent",
    success: "bg-success/15 text-success",
    destructive: "bg-destructive/10 text-destructive",
    muted: "bg-muted text-muted-foreground",
  };
  return (
    <Card className="flex items-center gap-4 p-4">
      <span
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${tintClass[tint]}`}
      >
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-xs font-medium text-muted-foreground">
          {label}
        </p>
        <p className="text-xl font-bold">{value}</p>
      </div>
    </Card>
  );
}

export default function DashboardPage() {
  const { activeConfig: data, ready } = useTeamUpData();

  const stats = useMemo(() => {
    if (!data) return null;

    const numGyms = data.gyms.length;
    const numTeams = data.teams.length;
    const numSessions = data.sessions.length;
    const numCoaches = (data.coaches || []).length;

    const totalHoursAvailablePerWeek = data.gyms.reduce((total, gym) => {
      const gymHours = (gym.availability || []).reduce((sum, day) => {
        const dayHours = (day.slots || []).reduce(
          (daySum, slot) => daySum + (slot.end - slot.start) / 60,
          0
        );
        return sum + dayHours;
      }, 0);
      return total + gymHours;
    }, 0);

    const totalHoursRequiredPerWeek = data.sessions.reduce(
      (total, session) => total + session.duration / 60,
      0
    );

    const seasonWeeks =
      data.teams.length > 0 &&
      data.teams[0].seasonStartDate &&
      data.teams[0].seasonEndDate
        ? getWeeksBetween(
            new Date(data.teams[0].seasonStartDate),
            new Date(data.teams[0].seasonEndDate)
          )
        : 0;

    const totalHoursAvailablePerSeason = totalHoursAvailablePerWeek * seasonWeeks;
    const totalHoursRequiredPerSeason = totalHoursRequiredPerWeek * seasonWeeks;

    const teamDetails = data.teams.map((team) => {
      const teamSessions = data.sessions.filter((s) => s.teamId === team.id);
      const weeklyHours = teamSessions.reduce(
        (sum, s) => sum + s.duration / 60,
        0
      );
      return {
        ...team,
        weeklyHours,
        seasonHours: weeklyHours * seasonWeeks,
        sessionCount: teamSessions.length,
      };
    });

    const gymDetails = data.gyms.map((gym) => {
      const weeklyHours = (gym.availability || []).reduce((sum, day) => {
        const dayHours = (day.slots || []).reduce(
          (daySum, slot) => daySum + (slot.end - slot.start) / 60,
          0
        );
        return sum + dayHours;
      }, 0);
      return { ...gym, weeklyHours };
    });

    const coachDetails = (data.coaches || []).map((coach) => {
      const coachSessions = data.sessions.filter((s) =>
        (s.coachIds || []).includes(coach.id)
      );
      const weeklyHours = coachSessions.reduce(
        (sum, s) => sum + s.duration / 60,
        0
      );
      return {
        ...coach,
        weeklyHours,
        seasonHours: weeklyHours * seasonWeeks,
        sessionCount: coachSessions.length,
      };
    });

    const usagePercentage =
      totalHoursAvailablePerWeek > 0
        ? (totalHoursRequiredPerWeek / totalHoursAvailablePerWeek) * 100
        : 0;

    return {
      numGyms,
      numTeams,
      numSessions,
      numCoaches,
      totalHoursAvailablePerWeek,
      totalHoursRequiredPerWeek,
      totalHoursAvailablePerSeason,
      totalHoursRequiredPerSeason,
      teamDetails,
      coachDetails,
      gymDetails,
      weeklyChartData: [
        {
          name: "Settimanale",
          "Ore Disponibili": Number(totalHoursAvailablePerWeek.toFixed(2)),
          "Ore Richieste": Number(totalHoursRequiredPerWeek.toFixed(2)),
        },
      ],
      seasonalChartData: [
        {
          name: "Stagionale",
          "Ore Disponibili": Number(totalHoursAvailablePerSeason.toFixed(2)),
          "Ore Richieste": Number(totalHoursRequiredPerSeason.toFixed(2)),
        },
      ],
      usagePercentage,
      teamChartData: teamDetails.map((t) => ({
        name: t.name,
        "Ore Settimanali": Number(t.weeklyHours.toFixed(2)),
      })),
      gymChartData: gymDetails.map((g) => ({
        name: g.name,
        "Ore Disponibili": Number(g.weeklyHours.toFixed(2)),
      })),
      coachChartData: coachDetails.map((c) => ({
        name: c.name,
        "Ore Settimanali": Number(c.weeklyHours.toFixed(2)),
      })),
    };
  }, [data]);

  if (!ready || !data || !stats) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-muted-foreground">
        Caricamento...
      </div>
    );
  }

  return (
    <AppShell configName={data.name}>
      <div className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            Panoramica statistica della configurazione{" "}
            <span className="font-medium text-foreground">
              &quot;{data.name}&quot;
            </span>
            .
          </p>
        </div>

        {/* KPI */}
        <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          <StatCard icon={Building2} label="Palestre" value={stats.numGyms} />
          <StatCard
            icon={Users}
            label="Squadre"
            value={stats.numTeams}
            tint="accent"
          />
          <StatCard
            icon={UserCheck}
            label="Coach"
            value={stats.numCoaches}
            tint="success"
          />
          <StatCard
            icon={Calendar}
            label="Allenamenti / sett."
            value={stats.numSessions}
          />
          <StatCard
            icon={Hourglass}
            label="Ore richieste / sett."
            value={`${stats.totalHoursRequiredPerWeek.toFixed(2)} h`}
            tint="destructive"
          />
          <StatCard
            icon={Hourglass}
            label="Ore disponibili / sett."
            value={`${stats.totalHoursAvailablePerWeek.toFixed(2)} h`}
          />
          <Card className="col-span-2 flex items-center gap-4 p-4 md:col-span-1 xl:col-span-2">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <Percent className="h-5 w-5" />
            </span>
            <div className="w-full min-w-0">
              <p className="text-xs font-medium text-muted-foreground">
                Utilizzo risorse
              </p>
              <p className="text-xl font-bold">
                {stats.usagePercentage.toFixed(1)}%
              </p>
              <Progress value={stats.usagePercentage} className="mt-1 h-2" />
            </div>
          </Card>
        </div>

        {/* Usage charts */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Utilizzo risorse</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-8 md:grid-cols-2">
            <div>
              <h4 className="mb-4 text-center text-sm font-semibold">
                Riepilogo settimanale (ore)
              </h4>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={stats.weeklyChartData}
                  margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.4} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="Ore Disponibili"
                    fill={AVAILABLE_COLOR}
                    radius={[6, 6, 0, 0]}
                  />
                  <Bar
                    dataKey="Ore Richieste"
                    fill={REQUIRED_COLOR}
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div>
              <h4 className="mb-4 text-center text-sm font-semibold">
                Riepilogo stagionale (ore)
              </h4>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={stats.seasonalChartData}
                  margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.4} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="Ore Disponibili"
                    fill={AVAILABLE_COLOR}
                    radius={[6, 6, 0, 0]}
                  />
                  <Bar
                    dataKey="Ore Richieste"
                    fill={REQUIRED_COLOR}
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Detail tables */}
        <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Dettaglio squadre</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Squadra</TableHead>
                    <TableHead>Allen./sett.</TableHead>
                    <TableHead className="text-right">Ore/sett.</TableHead>
                    <TableHead className="text-right">Ore/stag.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.teamDetails.map((team) => (
                    <TableRow key={team.id}>
                      <TableCell className="font-medium">{team.name}</TableCell>
                      <TableCell>{team.sessionCount}</TableCell>
                      <TableCell className="text-right">
                        {team.weeklyHours.toFixed(2)} h
                      </TableCell>
                      <TableCell className="text-right">
                        {team.seasonHours.toFixed(2)} h
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Dettaglio palestre</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Palestra</TableHead>
                    <TableHead className="text-right">Ore disp./sett.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.gymDetails.map((gym) => (
                    <TableRow key={gym.id}>
                      <TableCell className="font-medium">{gym.name}</TableCell>
                      <TableCell className="text-right">
                        {gym.weeklyHours.toFixed(2)} h
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2 xl:col-span-1">
            <CardHeader>
              <CardTitle>Dettaglio coach</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Coach</TableHead>
                    <TableHead>Sess./sett.</TableHead>
                    <TableHead className="text-right">Ore/sett.</TableHead>
                    <TableHead className="text-right">Ore/stag.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.coachDetails.map((coach) => (
                    <TableRow key={coach.id}>
                      <TableCell className="font-medium">{coach.name}</TableCell>
                      <TableCell>{coach.sessionCount}</TableCell>
                      <TableCell className="text-right">
                        {coach.weeklyHours.toFixed(2)} h
                      </TableCell>
                      <TableCell className="text-right">
                        {coach.seasonHours.toFixed(2)} h
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Detailed charts */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Riepilogo grafico dettagliato</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-8 lg:grid-cols-3">
            <div>
              <h4 className="mb-4 text-center text-sm font-semibold">
                Carico squadre (ore/sett.)
              </h4>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={stats.teamChartData}
                  margin={{ top: 5, right: 20, left: -10, bottom: 75 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.4} />
                  <XAxis
                    dataKey="name"
                    angle={-45}
                    textAnchor="end"
                    interval={0}
                    height={1}
                  />
                  <YAxis />
                  <Tooltip />
                  <Bar
                    dataKey="Ore Settimanali"
                    fill={REQUIRED_COLOR}
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div>
              <h4 className="mb-4 text-center text-sm font-semibold">
                Disponibilità palestre (ore/sett.)
              </h4>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={stats.gymChartData}
                  margin={{ top: 5, right: 20, left: -10, bottom: 75 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.4} />
                  <XAxis
                    dataKey="name"
                    angle={-45}
                    textAnchor="end"
                    interval={0}
                    height={1}
                  />
                  <YAxis />
                  <Tooltip />
                  <Bar
                    dataKey="Ore Disponibili"
                    fill={AVAILABLE_COLOR}
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div>
              <h4 className="mb-4 text-center text-sm font-semibold">
                Carico coach (ore/sett.)
              </h4>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={stats.coachChartData}
                  margin={{ top: 5, right: 20, left: -10, bottom: 75 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.4} />
                  <XAxis
                    dataKey="name"
                    angle={-45}
                    textAnchor="end"
                    interval={0}
                    height={1}
                  />
                  <YAxis />
                  <Tooltip />
                  <Bar
                    dataKey="Ore Settimanali"
                    fill={REQUIRED_COLOR}
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
