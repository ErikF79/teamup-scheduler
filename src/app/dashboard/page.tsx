
"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { initialData as mockData, Gym, Team, Session, Config, AppData, Coach } from '@/lib/teamup';
import { Building2, Users, Calendar, ArrowLeft, LayoutDashboard, Hourglass, Percent, UserCheck } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Progress } from '@/components/ui/progress';


function getWeeksBetween(d1: Date, d2: Date) {
    if (d1 > d2) return 0;
    return Math.ceil((d2.getTime() - d1.getTime()) / (7 * 24 * 60 * 60 * 1000));
}

export default function DashboardPage() {
    const [data, setData] = useState<Config>({ ...mockData });

    const fetchData = useCallback(() => {
        if (typeof window !== 'undefined') {
            const savedData = localStorage.getItem('teamup_data');
            try {
                if (savedData) {
                    const parsedAppData: AppData = JSON.parse(savedData);
                    if (parsedAppData.configurations && parsedAppData.activeConfigurationId) {
                        const activeConfig = parsedAppData.configurations.find(c => c.id === parsedAppData.activeConfigurationId);
                        if (activeConfig) {
                             setData(activeConfig);
                             return;
                        }
                    }
                }
            } catch (e) {
                console.error("Failed to load data from localStorage, using mock data", e);
            }
        }
        setData(mockData); // Fallback to mockData if nothing in localStorage
    }, []);


    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const stats = useMemo(() => {
        const numGyms = data.gyms.length;
        const numTeams = data.teams.length;
        const numSessions = data.sessions.length;
        const numCoaches = (data.coaches || []).length;

        const totalHoursAvailablePerWeek = data.gyms.reduce((total, gym) => {
            const gymHours = (gym.availability || []).reduce((sum, day) => {
                const dayHours = (day.slots || []).reduce((daySum, slot) => daySum + ((slot.end - slot.start) / 60), 0);
                return sum + dayHours;
            }, 0);
            return total + gymHours;
        }, 0);

        const totalHoursRequiredPerWeek = data.sessions.reduce((total, session) => {
            return total + (session.duration / 60);
        }, 0);
        
        const seasonWeeks = data.teams.length > 0 && data.teams[0].seasonStartDate && data.teams[0].seasonEndDate
            ? getWeeksBetween(new Date(data.teams[0].seasonStartDate), new Date(data.teams[0].seasonEndDate))
            : 0;

        const totalHoursAvailablePerSeason = totalHoursAvailablePerWeek * seasonWeeks;
        const totalHoursRequiredPerSeason = totalHoursRequiredPerWeek * seasonWeeks;
        
        const teamDetails = data.teams.map(team => {
             const teamSessions = data.sessions.filter(s => s.teamId === team.id);
             const weeklyHours = teamSessions.reduce((sum, s) => sum + s.duration / 60, 0);
             const seasonHours = weeklyHours * seasonWeeks;
             return {
                 ...team,
                 weeklyHours,
                 seasonHours,
                 sessionCount: teamSessions.length
             }
        });
        
        const gymDetails = data.gyms.map(gym => {
            const weeklyHours = (gym.availability || []).reduce((sum, day) => {
                const dayHours = (day.slots || []).reduce((daySum, slot) => daySum + ((slot.end - slot.start) / 60), 0);
                return sum + dayHours;
            }, 0);
            return {
                ...gym,
                weeklyHours
            }
        });

         const coachDetails = (data.coaches || []).map(coach => {
            const coachSessions = data.sessions.filter(s => s.coachId === coach.id);
            const weeklyHours = coachSessions.reduce((sum, s) => sum + s.duration / 60, 0);
            const seasonHours = weeklyHours * seasonWeeks;
            return {
                ...coach,
                weeklyHours,
                seasonHours,
                sessionCount: coachSessions.length
            };
        });

        const weeklyChartData = [
            { name: 'Settimanale', 'Ore Disponibili': totalHoursAvailablePerWeek, 'Ore Richieste': totalHoursRequiredPerWeek }
        ];
        const seasonalChartData = [
            { name: 'Stagionale', 'Ore Disponibili': totalHoursAvailablePerSeason, 'Ore Richieste': totalHoursRequiredPerSeason }
        ];

        const usagePercentage = totalHoursAvailablePerWeek > 0 ? (totalHoursRequiredPerWeek / totalHoursAvailablePerWeek) * 100 : 0;

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
            gymDetails,
            coachDetails,
            weeklyChartData,
            seasonalChartData,
            usagePercentage
        };
    }, [data]);

    return (
        <div className="min-h-screen bg-background text-foreground">
             <header className="flex items-center justify-between p-4 border-b bg-card">
                <h1 className="text-xl font-bold text-primary flex items-center gap-2">
                    <LayoutDashboard/> Dashboard Statistiche per "{data.name}"
                </h1>
                <div className="flex items-center gap-2">
                    <Link href="/"><Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" /> Torna allo Scheduler</Button></Link>
                </div>
            </header>

            <main className="p-4 md:p-8">
                {/* General Stats */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 mb-8">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Palestre</CardTitle>
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.numGyms}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Squadre</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.numTeams}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Coach</CardTitle>
                            <UserCheck className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.numCoaches}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Allenamenti Sett.</CardTitle>
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.numSessions}</div>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Ore Richieste / Sett.</CardTitle>
                            <Hourglass className="h-4 w-4 text-destructive" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.totalHoursRequiredPerWeek.toFixed(2)} h</div>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Ore Disponibili / Sett.</CardTitle>
                            <Hourglass className="h-4 w-4 text-primary" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.totalHoursAvailablePerWeek.toFixed(2)} h</div>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Utilizzo Risorse</CardTitle>
                             <Percent className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold mb-2">{stats.usagePercentage.toFixed(1)}%</div>
                            <Progress value={stats.usagePercentage} className="h-2"/>
                        </CardContent>
                    </Card>
                </div>
                
                 {/* Resource Usage */}
                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle>Utilizzo Risorse Grafico</CardTitle>
                        <CardDescription>Confronto tra ore disponibili e ore richieste su base settimanale e stagionale.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-8 md:grid-cols-2">
                        <div className="flex flex-col">
                             <h4 className="font-semibold text-center mb-4">Riepilogo Settimanale (Ore)</h4>
                             <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={stats.weeklyChartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="Ore Disponibili" fill="#000080" />
                                    <Bar dataKey="Ore Richieste" fill="#800000" />
                                </BarChart>
                             </ResponsiveContainer>
                        </div>
                         <div className="flex flex-col">
                            <h4 className="font-semibold text-center mb-4">Riepilogo Stagionale (Ore)</h4>
                             <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={stats.seasonalChartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="Ore Disponibili" fill="#000080" />
                                    <Bar dataKey="Ore Richieste" fill="#800000" />
                                </BarChart>
                             </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
                     {/* Team Details */}
                    <Card className="xl:col-span-1">
                        <CardHeader>
                            <CardTitle>Dettaglio Squadre</CardTitle>
                            <CardDescription>Riepilogo del carico di lavoro per ogni squadra.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Squadra</TableHead>
                                        <TableHead>Allen./Sett.</TableHead>
                                        <TableHead className="text-right">Ore/Sett.</TableHead>
                                        <TableHead className="text-right">Ore/Stag.</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {stats.teamDetails.map(team => (
                                        <TableRow key={team.id}>
                                            <TableCell className="font-medium">{team.name}</TableCell>
                                            <TableCell>{team.sessionCount}</TableCell>
                                            <TableCell className="text-right">{team.weeklyHours.toFixed(2)} h</TableCell>
                                            <TableCell className="text-right">{team.seasonHours.toFixed(2)} h</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                     {/* Gym Details */}
                    <Card className="xl:col-span-1">
                        <CardHeader>
                            <CardTitle>Dettaglio Palestre</CardTitle>
                             <CardDescription>Riepilogo delle ore disponibili per ogni struttura.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Palestra</TableHead>
                                        <TableHead className="text-right">Ore Disp./Sett.</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {stats.gymDetails.map(gym => (
                                        <TableRow key={gym.id}>
                                            <TableCell className="font-medium">{gym.name}</TableCell>
                                            <TableCell className="text-right">{gym.weeklyHours.toFixed(2)} h</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                    {/* Coach Details */}
                    <Card className="xl:col-span-1">
                        <CardHeader>
                            <CardTitle>Dettaglio Coach</CardTitle>
                            <CardDescription>Riepilogo del carico di lavoro per ogni allenatore.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Coach</TableHead>
                                        <TableHead>Sess./Sett.</TableHead>
                                        <TableHead className="text-right">Ore/Sett.</TableHead>
                                        <TableHead className="text-right">Ore/Stag.</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {stats.coachDetails.map(coach => (
                                        <TableRow key={coach.id}>
                                            <TableCell className="font-medium">{coach.name}</TableCell>
                                            <TableCell>{coach.sessionCount}</TableCell>
                                            <TableCell className="text-right">{coach.weeklyHours.toFixed(2)} h</TableCell>
                                            <TableCell className="text-right">{coach.seasonHours.toFixed(2)} h</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>

            </main>
        </div>
    );
}

    
