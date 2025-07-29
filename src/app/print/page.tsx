
"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { initialData as mockData, Gym, Team, Session, Config, AppData, Coach, UserData } from '@/lib/teamup';
import { Printer, Building2, Users, Calendar, AlertCircle, UserCheck, Menu, LayoutDashboard, Settings, Clock, GripVertical } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useRouter } from 'next/navigation';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const DAYS_OF_WEEK = [
    { key: 1, name: 'Lunedì' },
    { key: 2, name: 'Martedì' },
    { key: 3, name: 'Mercoledì' },
    { key: 4, name: 'Giovedì' },
    { key: 5, name: 'Venerdì' },
    { key: 6, name: 'Sabato' },
    { key: 7, name: 'Domenica' },
];
const PRINT_START_HOUR = 8;
const PRINT_END_HOUR = 23;

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
    
    const renderContent = () => {
        if (!selectedId || !data) {
             return <div className="p-8 text-center text-gray-500"><AlertCircle className="mx-auto h-8 w-8 mb-4"/>Nessun elemento da visualizzare. Controlla la configurazione nel pannello Admin.</div>;
        }

        switch (viewType) {
            case 'gym':
                return <GymPrintView gymId={selectedId} data={data} />;
            case 'team':
                return <TeamOrCoachPrintView id={selectedId} type="team" data={data} />;
            case 'day':
                return <DayPrintView dayKey={parseInt(selectedId, 10)} data={data} />;
            case 'coach':
                 return <TeamOrCoachPrintView id={selectedId} type="coach" data={data} />;
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
                        <CardDescription>Scegli cosa vuoi visualizzare. Il contenuto verrà generato qui sotto in un formato A4 orizzontale, pronto per la stampa o il salvataggio in PDF.</CardDescription>
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
                            <Button onClick={() => window.print()} variant="outline" className="border-red-800 text-blue-800 hover:bg-red-50 hover:text-blue-900">
                                <Printer className="mr-2 h-4 w-4" />Stampa / Salva PDF
                            </Button>
                        </div>
                    </CardContent>
                </Card>
                
                <div className="print-container bg-white w-full p-6 shadow-lg rounded-lg border border-gray-200" style={{ width: '297mm', height: '200mm' }}>
                    {renderContent()}
                </div>
            </main>
        </div>
    );
}

// --- Generic Print Components ---

const PrintHeader = ({ title, subtitle }: { title: string, subtitle: string }) => (
    <div className="mb-4 text-center no-print-content">
        <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
        <p className="text-md text-gray-600">{subtitle}</p>
        <Separator className="my-3" />
    </div>
);


const TimeAxis = () => (
    <div className="relative h-full">
        {Array.from({ length: PRINT_END_HOUR - PRINT_START_HOUR + 1 }).map((_, i) => {
            const hour = PRINT_START_HOUR + i;
            return (
                <div key={hour} className="h-16 relative">
                    <span className="absolute -top-2 -left-8 text-xs text-gray-500 w-8 text-right pr-1">{`${hour.toString().padStart(2, '0')}:00`}</span>
                    <div className="h-full border-t border-gray-200"></div>
                </div>
            )
        })}
    </div>
);

const PrintSessionCard = ({ session, data }: {session: Session, data: Config}) => {
     const team = data.teams.find(t => t.id === session.teamId);
     const coaches = (data.coaches || []).filter(c => (session.coachIds || []).includes(c.id));
     const coachNames = coaches.map(c => c.name).join(', ') || 'N/D';

    if (!team || session.startTime === null) return null;

    const totalMinutes = (PRINT_END_HOUR - PRINT_START_HOUR) * 60;
    const top = ((session.startTime - PRINT_START_HOUR * 60) / totalMinutes) * 100;
    const height = (session.duration / totalMinutes) * 100;

    const startTimeStr = formatTime(session.startTime);
    const endTimeStr = formatTime(session.startTime + session.duration);

    return (
         <div
            className="absolute w-[95%] left-[2.5%] rounded-md shadow-md flex flex-col gap-1 border-l-4 text-black p-1.5 overflow-hidden"
            style={{ 
                top: `${top}%`, 
                height: `${height}%`,
                backgroundColor: `${data.teamColors[team.id]}40`, // 40 for ~25% opacity
                borderLeftColor: data.teamColors[team.id]
             }}
        >
            <p className="font-bold text-[10px] leading-tight">{team.name}</p>
            <p className="text-[9px] leading-tight">{startTimeStr} - {endTimeStr} ({session.duration} min)</p>
            <p className="text-[9px] leading-tight mt-auto truncate">C: {coachNames}</p>
        </div>
    )
}

// --- Main Print Views ---

const GymPrintView = ({ gymId, data }: { gymId: string, data: Config }) => {
    const gym = data.gyms.find(g => g.id === gymId);
    if (!gym) return <div>Palestra non trovata</div>;

    return (
        <div className="flex flex-col h-full">
            <PrintHeader title={gym.name} subtitle="Palinsesto Settimanale Allenamenti" />
            <div className="flex-grow grid grid-cols-[40px_repeat(7,1fr)] gap-x-1">
                {/* Time Axis */}
                <div className="col-span-1 h-full">
                   <TimeAxis />
                </div>
                {/* Day Columns */}
                {DAYS_OF_WEEK.map(day => (
                     <div key={day.key} className="col-span-1 h-full relative">
                        <div className="text-center font-bold text-sm h-6 mb-1">{day.name}</div>
                        <div className="relative h-full bg-gray-50/50 rounded-md">
                            {data.sessions
                                .filter(s => s.gymId === gymId && s.day === day.key)
                                .map(session => <PrintSessionCard key={session.id} session={session} data={data} />)
                            }
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};


const DayPrintView = ({ dayKey, data }: { dayKey: number, data: Config }) => {
    const day = DAYS_OF_WEEK.find(d => d.key === dayKey);
    const sessions = data.sessions.filter(s => s.day === dayKey).sort((a,b) => (a.startTime ?? 0) - (b.startTime ?? 0));
    const relevantGyms = data.gyms.filter(gym => sessions.some(s => s.gymId === gym.id));

    if (!day || relevantGyms.length === 0) return (
         <div>
            <PrintHeader title={`Palinsesto di ${day?.name || 'Giorno non valido'}`} subtitle="Riepilogo Attività per Palestra" />
            <div className="text-center text-gray-500 mt-16">Nessuna attività programmata per questo giorno.</div>
         </div>
    );
    
    return (
        <div className="flex flex-col h-full">
            <PrintHeader title={`Palinsesto di ${day.name}`} subtitle="Riepilogo Attività per Palestra" />
             <div className="flex-grow grid grid-cols-[40px_repeat(var(--gym-count),1fr)] gap-x-1" style={{'--gym-count': relevantGyms.length} as React.CSSProperties}>
                {/* Time Axis */}
                <div className="col-span-1 h-full">
                   <TimeAxis />
                </div>
                {/* Gym Columns */}
                {relevantGyms.map(gym => (
                     <div key={gym.id} className="col-span-1 h-full relative">
                        <div className="text-center font-bold text-sm h-6 mb-1 truncate px-1">{gym.name}</div>
                        <div className="relative h-full bg-gray-50/50 rounded-md">
                            {sessions
                                .filter(s => s.gymId === gym.id)
                                .map(session => <PrintSessionCard key={session.id} session={session} data={data} />)
                            }
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};


const TeamOrCoachPrintView = ({ id, type, data }: { id: string, type: 'team' | 'coach', data: Config }) => {
    const item = type === 'team'
        ? data.teams.find(t => t.id === id)
        : (data.coaches || []).find(c => c.id === id);

    const sessions = type === 'team'
        ? data.sessions.filter(s => s.teamId === id)
        : data.sessions.filter(s => (s.coachIds || []).includes(id));
    
    if (!item) return <div>{type === 'team' ? 'Squadra' : 'Coach'} non trovato/a</div>;

    const title = item.name;
    const subtitle = `Programma Allenamenti Settimanale`;

    return (
         <div className="flex flex-col h-full">
            <PrintHeader title={title} subtitle={subtitle} />
            <div className="flex-grow grid grid-cols-[40px_repeat(7,1fr)] gap-x-1">
                {/* Time Axis */}
                <div className="col-span-1 h-full">
                   <TimeAxis />
                </div>
                {/* Day Columns */}
                {DAYS_OF_WEEK.map(day => (
                     <div key={day.key} className="col-span-1 h-full relative">
                        <div className="text-center font-bold text-sm h-6 mb-1">{day.name}</div>
                        <div className="relative h-full bg-gray-50/50 rounded-md">
                            <div className="absolute inset-0 text-center text-xs text-gray-400 font-semibold pt-1">
                                {data.gyms.find(g => sessions.find(s => s.day === day.key)?.gymId === g.id)?.name}
                            </div>
                            {sessions
                                .filter(s => s.day === day.key)
                                .map(session => <PrintSessionCard key={session.id} session={session} data={data} />)
                            }
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
