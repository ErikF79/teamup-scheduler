
"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { initialData as mockData, Gym, Team, Session, Config, AppData, Coach, UserData } from '@/lib/teamup';
import { Printer, Building2, Users, Calendar, AlertCircle, UserCheck, Menu, LayoutDashboard, Settings } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useRouter } from 'next/navigation';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';


const DAYS_OF_WEEK = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];

function formatTime(minutesFromDayStart: number | null) {
    if (minutesFromDayStart === null) return 'N/A';
    const hours = Math.floor(minutesFromDayStart / 60);
    const minutes = minutesFromDayStart % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

export default function PrintPage() {
    const [data, setData] = useState<Config | null>(null);
    const [viewType, setViewType] = useState<'gym' | 'team'>('gym');
    const router = useRouter();


    const fetchData = useCallback(() => {
        if (typeof window !== 'undefined') {
            const loggedInUser = localStorage.getItem('teamup_active_user');
            if (!loggedInUser) {
                router.replace('/login');
                return;
            }

            const savedData = localStorage.getItem('teamup_data');
            try {
                if (savedData) {
                    const parsedAppData: AppData = JSON.parse(savedData);
                    const userData = parsedAppData.userData[loggedInUser];
                    if (userData && userData.configurations) {
                        const activeConfig = userData.configurations.find(c => c.id === userData.activeConfigurationId);
                        if (activeConfig) {
                             setData(activeConfig);
                             return;
                        }
                    }
                }
            } catch (e) {
                console.error("Failed to load data, using mock data", e);
            }
        }
        setData(mockData);
    }, [router]);


    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const renderContent = () => {
        if (!data) {
             return <div className="p-8 text-center text-gray-500"><AlertCircle className="mx-auto h-8 w-8 mb-4"/>Nessun dato da visualizzare. Controlla la configurazione nel pannello Admin.</div>;
        }

        switch (viewType) {
            case 'gym':
                return <GymPrintView gyms={data.gyms} sessions={data.sessions} teams={data.teams} coaches={data.coaches} />;
            case 'team':
                return <TeamPrintView teams={data.teams} sessions={data.sessions} gyms={data.gyms} coaches={data.coaches}/>;
            default:
                return null;
        }
    };
    
    if (!data) {
        return <div className="flex items-center justify-center min-h-screen">Loading or redirecting...</div>;
    }


    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
            <header className="flex items-center justify-between p-4 border-b bg-card no-print">
                 <div className="flex items-center gap-4">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="icon">
                                <Menu className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem onSelect={() => router.push('/scheduler')}>
                                <LayoutDashboard className="mr-2 h-4 w-4" />
                                <span>Scheduler</span>
                            </DropdownMenuItem>
                             <DropdownMenuItem onSelect={() => router.push('/dashboard')}>
                                <LayoutDashboard className="mr-2 h-4 w-4" />
                                <span>Dashboard</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => router.push('/admin')}>
                                <Settings className="mr-2 h-4 w-4" />
                                <span>Admin Panel</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <h1 className="text-xl font-bold text-primary flex items-center gap-2">
                        <Printer /> Stampa planner allenamenti
                    </h1>
                </div>
            </header>

            <main className="p-4 md:p-8 flex flex-col items-center">
                 <Card className="w-full max-w-4xl mb-8 no-print">
                    <CardHeader>
                        <CardTitle>Opzioni di Stampa</CardTitle>
                        <CardDescription>Scegli cosa vuoi stampare e clicca il pulsante in basso per generare la vista di stampa.</CardDescription>
                    </CardHeader>
                    <CardContent>
                       <div className="flex items-center gap-4">
                            <div>
                                <label className="text-sm font-medium mb-1 block">Raggruppa per</label>
                                <Select value={viewType} onValueChange={(value) => setViewType(value as any)}>
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue placeholder="Seleziona vista" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="gym"><Building2 className="mr-2 h-4 w-4"/>Palestra</SelectItem>
                                        <SelectItem value="team"><Users className="mr-2 h-4 w-4"/>Squadra</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                         </div>
                         <div className="pt-4 border-t mt-4">
                            <Button onClick={() => window.print()} variant="outline" className="border-red-800 text-blue-800 hover:bg-red-50 hover:text-blue-900">
                                <Printer className="mr-2 h-4 w-4" />Stampa / Salva PDF
                            </Button>
                        </div>
                    </CardContent>
                </Card>
                
                <div className="print-container bg-white w-full p-6 shadow-lg rounded-lg border border-gray-200">
                    {renderContent()}
                </div>

            </main>
        </div>
    );
}

const PrintHeader = ({ title, subtitle }: { title: string, subtitle: string }) => (
    <div className="mb-6 text-center no-print-content">
        <h1 className="text-3xl font-bold text-gray-800">{title}</h1>
        <p className="text-lg text-gray-600">{subtitle}</p>
        <Separator className="my-4" />
    </div>
);


const GymPrintView = ({ gyms, sessions, teams, coaches }: { gyms: Gym[], sessions: Session[], teams: Team[], coaches: Coach[] }) => {
    return (
        <div>
            <PrintHeader title="Palinsesto Allenamenti" subtitle="Riepilogo per Palestra" />
            {gyms.map(gym => {
                const gymSessions = sessions.filter(s => s.gymId === gym.id);
                if(gymSessions.length === 0) return null;

                return (
                    <div key={gym.id} className="mb-8 page-break-inside-avoid">
                        <h2 className="text-2xl font-semibold mb-3 border-b-2 pb-2 border-primary">{gym.name}</h2>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[15%]">Giorno</TableHead>
                                    <TableHead className="w-[15%]">Orario</TableHead>
                                    <TableHead>Squadra</TableHead>
                                    <TableHead>Coach</TableHead>
                                    <TableHead className="text-right w-[10%]">Durata</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {gymSessions
                                    .sort((a,b) => (a.day ?? 0) - (b.day ?? 0) || (a.startTime ?? 0) - (b.startTime ?? 0))
                                    .map(session => {
                                        const team = teams.find(t => t.id === session.teamId);
                                        const sessionCoaches = coaches.filter(c => session.coachIds.includes(c.id));
                                        return (
                                            <TableRow key={session.id}>
                                                <TableCell className="font-medium">{session.day ? DAYS_OF_WEEK[session.day - 1] : 'N/A'}</TableCell>
                                                <TableCell>{formatTime(session.startTime)} - {formatTime(session.startTime ? session.startTime + session.duration : null)}</TableCell>
                                                <TableCell>{team?.name || 'N/A'}</TableCell>
                                                <TableCell>{sessionCoaches.map(c => c.name).join(', ') || 'N/D'}</TableCell>
                                                <TableCell className="text-right">{session.duration} min</TableCell>
                                            </TableRow>
                                        );
                                    })}
                            </TableBody>
                        </Table>
                    </div>
                )
            })}
        </div>
    )
};

const TeamPrintView = ({ teams, sessions, gyms, coaches }: { teams: Team[], sessions: Session[], gyms: Gym[], coaches: Coach[] }) => {
    return (
         <div>
            <PrintHeader title="Palinsesto Allenamenti" subtitle="Riepilogo per Squadra" />
            {teams.map(team => {
                const teamSessions = sessions.filter(s => s.teamId === team.id && s.gymId);
                 if(teamSessions.length === 0) return null;

                return (
                    <div key={team.id} className="mb-8 page-break-inside-avoid">
                        <h2 className="text-2xl font-semibold mb-3 border-b-2 pb-2 border-primary">{team.name}</h2>
                         <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[15%]">Giorno</TableHead>
                                    <TableHead className="w-[15%]">Orario</TableHead>
                                    <TableHead>Palestra</TableHead>
                                    <TableHead>Coach</TableHead>
                                    <TableHead className="text-right w-[10%]">Durata</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {teamSessions
                                    .sort((a,b) => (a.day ?? 0) - (b.day ?? 0) || (a.startTime ?? 0) - (b.startTime ?? 0))
                                    .map(session => {
                                        const gym = gyms.find(g => g.id === session.gymId);
                                        const sessionCoaches = coaches.filter(c => session.coachIds.includes(c.id));
                                        return (
                                            <TableRow key={session.id}>
                                                <TableCell className="font-medium">{session.day ? DAYS_OF_WEEK[session.day - 1] : 'N/A'}</TableCell>
                                                <TableCell>{formatTime(session.startTime)} - {formatTime(session.startTime ? session.startTime + session.duration : null)}</TableCell>
                                                <TableCell>{gym?.name || 'N/A'}</TableCell>
                                                <TableCell>{sessionCoaches.map(c => c.name).join(', ') || 'N/D'}</TableCell>
                                                <TableCell className="text-right">{session.duration} min</TableCell>
                                            </TableRow>
                                        );
                                    })}
                            </TableBody>
                        </Table>
                    </div>
                )

            })}
        </div>
    )
}

    