
"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { initialData as mockData, Gym, Team, Session } from '@/lib/teamup';
import { Building2, Users, Calendar, ArrowLeft, LayoutDashboard } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

type AppData = {
    gyms: Gym[];
    teams: Team[];
    sessions: Session[];
};

function getWeeksBetween(d1: Date, d2: Date) {
    if (d1 > d2) return 0;
    return Math.ceil((d2.getTime() - d1.getTime()) / (7 * 24 * 60 * 60 * 1000));
}

export default function DashboardPage() {
    const [data, setData] = useState<AppData>({ gyms: [], teams: [], sessions: [] });

    const fetchData = useCallback(() => {
        if (typeof window !== 'undefined') {
            const savedData = localStorage.getItem('teamup_data');
            try {
                if (savedData) {
                    const parsedData = JSON.parse(savedData);
                    if (parsedData.gyms && parsedData.teams && parsedData.sessions) {
                        setData(parsedData);
                    }
                } else {
                    setData(mockData); // Fallback to mockData if nothing in localStorage
                }
            } catch (e) {
                console.error("Failed to load data from localStorage, using mock data", e);
                setData(mockData);
            }
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const stats = useMemo(() => {
        const numGyms = data.gyms.length;
        const numTeams = data.teams.length;
        const numSessions = data.sessions.length;

        const totalHoursAvailablePerWeek = data.gyms.reduce((total, gym) => {
            const gymHours = (gym.availability || []).reduce((sum, day) => {
                const dayHours = (day.slots || []).reduce((daySum, slot) => daySum + ((slot.end - slot.start) / 60), 0);
                return sum + dayHours;
            }, 0);
            return total + gymHours;
        }, 0);

        const totalHoursRequiredPerWeek = data.teams.reduce((total, team) => {
            const teamHours = (team.sessionDuration / 60) * team.sessionsPerWeek;
            return total + teamHours;
        }, 0);
        
        // Use the first team's season dates as representative for the calculation
        const seasonWeeks = data.teams.length > 0 && data.teams[0].seasonStartDate && data.teams[0].seasonEndDate
            ? getWeeksBetween(new Date(data.teams[0].seasonStartDate), new Date(data.teams[0].seasonEndDate))
            : 0;

        const totalHoursAvailablePerSeason = totalHoursAvailablePerWeek * seasonWeeks;
        const totalHoursRequiredPerSeason = totalHoursRequiredPerWeek * seasonWeeks;
        
        const teamDetails = data.teams.map(team => {
             const weeklyHours = (team.sessionDuration / 60) * team.sessionsPerWeek;
             const seasonHours = weeklyHours * seasonWeeks;
             return {
                 ...team,
                 weeklyHours,
                 seasonHours
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

        const weeklyChartData = [
            { name: 'Settimanale', 'Ore Disponibili': totalHoursAvailablePerWeek, 'Ore Richieste': totalHoursRequiredPerWeek }
        ];
        const seasonalChartData = [
            { name: 'Stagionale', 'Ore Disponibili': totalHoursAvailablePerSeason, 'Ore Richieste': totalHoursRequiredPerSeason }
        ];

        return {
            numGyms,
            numTeams,
            numSessions,
            totalHoursAvailablePerWeek,
            totalHoursRequiredPerWeek,
            totalHoursAvailablePerSeason,
            totalHoursRequiredPerSeason,
            teamDetails,
            gymDetails,
            weeklyChartData,
            seasonalChartData,
        };
    }, [data]);

    return (
        <div className="min-h-screen bg-background text-foreground">
             <header className="flex items-center justify-between p-4 border-b bg-card">
                <h1 className="text-xl font-bold text-primary flex items-center gap-2">
                    <LayoutDashboard/> Dashboard Statistiche
                </h1>
                <div className="flex items-center gap-2">
                    <Link href="/"><Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" /> Torna allo Scheduler</Button></Link>
                </div>
            </header>

            <main className="p-4 md:p-8">
                {/* General Stats */}
                <div className="grid gap-4 md:grid-cols-3 mb-8">
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
                            <CardTitle className="text-sm font-medium">Allenamenti Totali</CardTitle>
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.numSessions}</div>
                        </CardContent>
                    </Card>
                </div>
                
                 {/* Resource Usage */}
                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle>Utilizzo Risorse</CardTitle>
                        <CardDescription>Confronto grafico tra ore disponibili e ore richieste.</CardDescription>
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
                                    <Bar dataKey="Ore Disponibili" fill="hsl(var(--primary))" />
                                    <Bar dataKey="Ore Richieste" fill="hsl(var(--accent))" />
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
                                    <Bar dataKey="Ore Disponibili" fill="hsl(var(--primary))" />
                                    <Bar dataKey="Ore Richieste" fill="hsl(var(--accent))" />
                                </BarChart>
                             </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid gap-8 md:grid-cols-2">
                     {/* Team Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Dettaglio Squadre</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Squadra</TableHead>
                                        <TableHead className="text-right">Ore/Settimana</TableHead>
                                        <TableHead className="text-right">Ore/Stagione</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {stats.teamDetails.map(team => (
                                        <TableRow key={team.id}>
                                            <TableCell className="font-medium">{team.name}</TableCell>
                                            <TableCell className="text-right">{team.weeklyHours.toFixed(2)} h</TableCell>
                                            <TableCell className="text-right">{team.seasonHours.toFixed(2)} h</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                     {/* Gym Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Dettaglio Palestre</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Palestra</TableHead>
                                        <TableHead className="text-right">Ore Disponibili/Settimana</TableHead>
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
                </div>

            </main>
        </div>
    );
}
