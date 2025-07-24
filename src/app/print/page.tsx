
"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { initialData as mockData, Gym, Team, Session, Config, AppData, Coach, UserData } from '@/lib/teamup';
import { ArrowLeft, Printer, Building2, Users, Calendar, AlertCircle, UserCheck } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useRouter } from 'next/navigation';

const DAYS_OF_WEEK = [
    { key: 1, name: 'Lunedì' },
    { key: 2, name: 'Martedì' },
    { key: 3, name: 'Mercoledì' },
    { key: 4, name: 'Giovedì' },
    { key: 5, name: 'Venerdì' },
    { key: 6, name: 'Sabato' },
    { key: 7, name: 'Domenica' },
];

function formatTime(minutesFromDayStart: number | null) {
    if (minutesFromDayStart === null) return 'N/A';
    const hours = Math.floor(minutesFromDayStart / 60);
    const minutes = minutesFromDayStart % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

export default function PrintPage() {
    const [data, setData] = useState<Config | null>(null);
    const [viewType, setViewType] = useState<'gym' | 'team' | 'day' | 'coach'>('gym');
    const [selectedId, setSelectedId] = useState<string | null>(null);
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
                            // Set initial selectedId based on viewType
                            if (viewType === 'gym' && activeConfig.gyms.length > 0) setSelectedId(activeConfig.gyms[0].id);
                            else if (viewType === 'team' && activeConfig.teams.length > 0) setSelectedId(activeConfig.teams[0].id);
                            else if (viewType === 'coach' && (activeConfig.coaches || []).length > 0) setSelectedId(activeConfig.coaches[0].id);
                            else if (viewType === 'day') setSelectedId('1');
                            else setSelectedId(null);
                            return;
                        }
                    }
                }
            } catch (e) {
                console.error("Failed to load data, using mock data", e);
            }
        }
        setData(mockData);
    }, [viewType, router]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);
    
    useEffect(() => {
        if (!data) return;
        // Reset selectedId when viewType changes
        if (viewType === 'gym' && data.gyms.length > 0) setSelectedId(data.gyms[0].id);
        else if (viewType === 'team' && data.teams.length > 0) setSelectedId(data.teams[0].id);
        else if (viewType === 'coach' && (data.coaches || []).length > 0) setSelectedId(data.coaches[0].id);
        else if (viewType === 'day') setSelectedId('1');
        else setSelectedId(null);
    }, [viewType, data]);
    
    useEffect(() => {
        const printButton = document.getElementById('print-button');
        if (printButton) {
            const handlePrint = () => window.print();
            printButton.addEventListener('click', handlePrint);

            // Cleanup
            return () => {
                printButton.removeEventListener('click', handlePrint);
            };
        }
    }, []);

    const renderContent = () => {
        if (!selectedId || !data) {
             return <div className="p-8 text-center text-muted-foreground"><AlertCircle className="mx-auto h-8 w-8 mb-4"/>Nessun elemento da visualizzare. Controlla la configurazione nel pannello Admin.</div>;
        }

        switch (viewType) {
            case 'gym':
                return <GymPrintView gymId={selectedId} data={data} />;
            case 'team':
                return <TeamPrintView teamId={selectedId} data={data} />;
            case 'day':
                return <DayPrintView dayKey={parseInt(selectedId, 10)} data={data} />;
            case 'coach':
                return <CoachPrintView coachId={selectedId} data={data} />;
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
                <h1 className="text-xl font-bold text-primary flex items-center gap-2">
                    <Printer /> Stampa planner allenamenti
                </h1>
                <div className="flex items-center gap-2">
                     <Link href="/scheduler"><Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" /> Torna allo Scheduler</Button></Link>
                </div>
            </header>

            <main className="p-4 md:p-8 flex flex-col items-center">
                 <Card className="w-full max-w-4xl mb-8 no-print">
                    <CardHeader>
                        <CardTitle>Opzioni di Stampa</CardTitle>
                        <CardDescription>Scegli cosa vuoi visualizzare. Il contenuto verrà generato qui sotto in un formato A4, pronto per la stampa o il salvataggio in PDF.</CardDescription>
                    </CardHeader>
                    <CardContent>
                       <div className="flex flex-wrap items-end gap-4">
                            <div>
                                <label className="text-sm font-medium mb-1 block">Tipo di Vista</label>
                                <Select value={viewType} onValueChange={(value) => setViewType(value as any)}>
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue placeholder="Seleziona vista" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="gym"><Building2 className="mr-2 h-4 w-4"/>Per Palestra</SelectItem>
                                        <SelectItem value="team"><Users className="mr-2 h-4 w-4"/>Per Squadra</SelectItem>
                                        <SelectItem value="coach"><UserCheck className="mr-2 h-4 w-4"/>Per Coach</SelectItem>
                                        <SelectItem value="day"><Calendar className="mr-2 h-4 w-4"/>Per Giorno</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                            <label className="text-sm font-medium mb-1 block">Seleziona Elemento</label>
                            {viewType === 'gym' && 
                                    <Select value={selectedId ?? ""} onValueChange={setSelectedId}>
                                        <SelectTrigger className="w-[280px]">
                                            <SelectValue placeholder="Seleziona palestra" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {data.gyms.map(gym => <SelectItem key={gym.id} value={gym.id}>{gym.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                            }
                            {viewType === 'team' && 
                                    <Select value={selectedId ?? ""} onValueChange={setSelectedId}>
                                        <SelectTrigger className="w-[280px]">
                                            <SelectValue placeholder="Seleziona squadra" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {data.teams.map(team => <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                            }
                             {viewType === 'coach' && 
                                    <Select value={selectedId ?? ""} onValueChange={setSelectedId}>
                                        <SelectTrigger className="w-[280px]">
                                            <SelectValue placeholder="Seleziona coach" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {(data.coaches || []).map(coach => <SelectItem key={coach.id} value={coach.id}>{coach.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                            }
                            {viewType === 'day' && 
                                    <Select value={selectedId ?? ""} onValueChange={setSelectedId}>
                                        <SelectTrigger className="w-[280px]">
                                            <SelectValue placeholder="Seleziona giorno" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {DAYS_OF_WEEK.map(day => <SelectItem key={day.key} value={String(day.key)}>{day.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                            }
                            </div>
                         </div>
                         <div className="pt-4 border-t mt-4">
                            <Button id="print-button" variant="outline" className="border-red-800 text-blue-800 hover:bg-red-50 hover:text-blue-900">
                                <Printer className="mr-2 h-4 w-4" />Stampa / Salva PDF
                            </Button>
                        </div>
                    </CardContent>
                </Card>
                
                <div className="print-container bg-white w-full p-8 shadow-lg rounded-lg" style={{ width: '210mm', minHeight: '297mm' }}>
                    {renderContent()}
                </div>
            </main>
        </div>
    );
}

// --- Print View Components ---

const PrintHeader = ({ title, subtitle }: { title: string, subtitle: string }) => (
    <div className="mb-6 text-center">
        <h1 className="text-3xl font-bold text-gray-800">{title}</h1>
        <p className="text-lg text-gray-600">{subtitle}</p>
        <Separator className="my-4" />
    </div>
);


const GymPrintView = ({ gymId, data }: { gymId: string, data: Config }) => {
    const gym = data.gyms.find(g => g.id === gymId);
    const sessions = data.sessions.filter(s => s.gymId === gymId);

    if (!gym) return <div>Palestra non trovata</div>;

    return (
        <div>
            <PrintHeader title={gym.name} subtitle="Palinsesto Settimanale" />
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[15%]">Giorno</TableHead>
                        <TableHead className="w-[15%]">Orario Inizio</TableHead>
                        <TableHead className="w-[15%]">Orario Fine</TableHead>
                        <TableHead>Squadra</TableHead>
                        <TableHead>Coach</TableHead>
                        <TableHead className="text-right w-[15%]">Durata</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {DAYS_OF_WEEK.map(day => {
                        const daySessions = sessions
                            .filter(s => s.day === day.key)
                            .sort((a, b) => (a.startTime ?? 0) - (b.startTime ?? 0));
                        
                        if (daySessions.length === 0) {
                            return (
                                <TableRow key={day.key}>
                                    <TableCell className="font-medium">{day.name}</TableCell>
                                    <TableCell colSpan={5} className="text-center text-muted-foreground">Nessun allenamento programmato</TableCell>
                                </TableRow>
                            );
                        }
                        
                        return daySessions.map((session, index) => {
                             const team = data.teams.find(t => t.id === session.teamId);
                             const coaches = (data.coaches || []).filter(c => (session.coachIds || []).includes(c.id));
                             const coachNames = coaches.map(c => c.name).join(', ');
                             return (
                                <TableRow key={session.id}>
                                    {index === 0 && <TableCell rowSpan={daySessions.length} className="font-medium align-top">{day.name}</TableCell>}
                                    <TableCell>{formatTime(session.startTime)}</TableCell>
                                    <TableCell>{formatTime(session.startTime! + session.duration)}</TableCell>
                                    <TableCell>{team?.name}</TableCell>
                                    <TableCell>{coachNames || 'N/D'}</TableCell>
                                    <TableCell className="text-right">{session.duration} min</TableCell>
                                </TableRow>
                             )
                        });
                    })}
                </TableBody>
            </Table>
        </div>
    );
};

const TeamPrintView = ({ teamId, data }: { teamId: string, data: Config }) => {
    const team = data.teams.find(t => t.id === teamId);
    const sessions = data.sessions.filter(s => s.teamId === teamId && s.gymId);

    if (!team) return <div>Squadra non trovata</div>;

    return (
        <div>
             <PrintHeader title={team.name} subtitle="Programma Allenamenti Settimanale" />
             <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Giorno</TableHead>
                        <TableHead>Orario Inizio</TableHead>
                        <TableHead>Orario Fine</TableHead>
                        <TableHead>Palestra</TableHead>
                        <TableHead>Coach</TableHead>
                        <TableHead className="text-right">Durata</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sessions.length > 0 ? (
                        sessions
                         .sort((a, b) => (a.day ?? 0) - (b.day ?? 0) || (a.startTime ?? 0) - (b.startTime ?? 0))
                         .map(session => {
                            const gym = data.gyms.find(g => g.id === session.gymId);
                            const day = DAYS_OF_WEEK.find(d => d.key === session.day);
                            const coaches = (data.coaches || []).filter(c => (session.coachIds || []).includes(c.id));
                            const coachNames = coaches.map(c => c.name).join(', ');
                            return (
                                <TableRow key={session.id}>
                                    <TableCell className="font-medium">{day?.name}</TableCell>
                                    <TableCell>{formatTime(session.startTime)}</TableCell>
                                    <TableCell>{formatTime(session.startTime! + session.duration)}</TableCell>
                                    <TableCell>{gym?.name}</TableCell>
                                    <TableCell>{coachNames || 'N/D'}</TableCell>
                                    <TableCell className="text-right">{session.duration} min</TableCell>
                                </TableRow>
                            )
                        })
                    ) : (
                         <TableRow>
                            <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                Nessun allenamento assegnato a una palestra per questa squadra.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
};


const DayPrintView = ({ dayKey, data }: { dayKey: number, data: Config }) => {
    const day = DAYS_OF_WEEK.find(d => d.key === dayKey);
    const sessions = data.sessions.filter(s => s.day === dayKey).sort((a,b) => (a.startTime ?? 0) - (b.startTime ?? 0));

    if (!day) return <div>Giorno non valido</div>;
    
    const sessionsByGym = data.gyms.map(gym => ({
        ...gym,
        sessions: sessions.filter(s => s.gymId === gym.id)
    })).filter(gym => gym.sessions.length > 0);

    return (
        <div>
            <PrintHeader title={`Palinsesto di ${day.name}`} subtitle="Riepilogo Attività per Palestra" />
            {sessionsByGym.length > 0 ? sessionsByGym.map(gym => (
                 <div key={gym.id} className="mb-8">
                    <h2 className="text-xl font-semibold mb-2 text-gray-700 border-b pb-2">{gym.name}</h2>
                    <Table>
                         <TableHeader>
                            <TableRow>
                                <TableHead className="w-[20%]">Orario Inizio</TableHead>
                                <TableHead className="w-[20%]">Orario Fine</TableHead>
                                <TableHead>Squadra</TableHead>
                                <TableHead>Coach</TableHead>
                                <TableHead className="text-right w-[20%]">Durata</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {gym.sessions.map(session => {
                                 const team = data.teams.find(t => t.id === session.teamId);
                                 const coaches = (data.coaches || []).filter(c => (session.coachIds || []).includes(c.id));
                                 const coachNames = coaches.map(c => c.name).join(', ');
                                 return (
                                    <TableRow key={session.id}>
                                        <TableCell>{formatTime(session.startTime)}</TableCell>
                                        <TableCell>{formatTime(session.startTime! + session.duration)}</TableCell>
                                        <TableCell className="font-medium">{team?.name}</TableCell>
                                        <TableCell>{coachNames || 'N/D'}</TableCell>
                                        <TableCell className="text-right">{session.duration} min</TableCell>
                                    </TableRow>
                                 )
                            })}
                        </TableBody>
                    </Table>
                 </div>
            )) : (
                 <div className="text-center h-48 flex items-center justify-center text-muted-foreground">
                    Nessuna attività programmata per {day.name}.
                </div>
            )}
        </div>
    );
};

const CoachPrintView = ({ coachId, data }: { coachId: string, data: Config }) => {
    const coach = (data.coaches || []).find(c => c.id === coachId);
    const sessions = data.sessions.filter(s => (s.coachIds || []).includes(coachId) && s.gymId);

    if (!coach) return <div>Coach non trovato</div>;

    return (
        <div>
             <PrintHeader title={coach.name} subtitle="Programma Allenamenti Settimanale" />
             <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Giorno</TableHead>
                        <TableHead>Orario Inizio</TableHead>
                        <TableHead>Orario Fine</TableHead>
                        <TableHead>Squadra</TableHead>
                        <TableHead>Palestra</TableHead>
                        <TableHead className="text-right">Durata</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sessions.length > 0 ? (
                        sessions
                         .sort((a, b) => (a.day ?? 0) - (b.day ?? 0) || (a.startTime ?? 0) - (b.startTime ?? 0))
                         .map(session => {
                            const gym = data.gyms.find(g => g.id === session.gymId);
                            const day = DAYS_OF_WEEK.find(d => d.key === session.day);
                            const team = data.teams.find(t => t.id === session.teamId);
                            return (
                                <TableRow key={session.id}>
                                    <TableCell className="font-medium">{day?.name}</TableCell>
                                    <TableCell>{formatTime(session.startTime)}</TableCell>
                                    <TableCell>{formatTime(session.startTime! + session.duration)}</TableCell>
                                    <TableCell>{team?.name}</TableCell>
                                    <TableCell>{gym?.name}</TableCell>
                                    <TableCell className="text-right">{session.duration} min</TableCell>
                                </TableRow>
                            )
                        })
                    ) : (
                         <TableRow>
                            <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                Nessun allenamento assegnato per questo coach.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
};
