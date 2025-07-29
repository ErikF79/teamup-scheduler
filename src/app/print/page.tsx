
"use client";

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { initialData as mockData, Gym, Team, Session, Config, AppData, Coach } from '@/lib/teamup';
import { Printer, Building2, Users, AlertCircle, UserCheck, Menu, LayoutDashboard, Settings, CalendarDays, TableIcon, GanttChartSquare } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useRouter } from 'next/navigation';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


const DAYS_OF_WEEK = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];
const PLANNER_START_HOUR = 15;
const PLANNER_END_HOUR = 23;

const TIME_SLOTS_PLANNER = Array.from({ length: (PLANNER_END_HOUR - PLANNER_START_HOUR) * 4 + 1 }, (_, i) => {
    const totalMinutes = (PLANNER_START_HOUR * 60) + (i * 15);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return {
        totalMinutes,
        label: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
    };
});


function formatTime(minutesFromDayStart: number | null) {
    if (minutesFromDayStart === null) return 'N/A';
    const hours = Math.floor(minutesFromDayStart / 60);
    const minutes = minutesFromDayStart % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

export default function PrintPage() {
    const [data, setData] = useState<Config | null>(null);
    const [printMode, setPrintMode] = useState<'table' | 'planner'>('table');
    const [viewType, setViewType] = useState<'gym' | 'team' | 'day' | 'coach'>('gym');
    const [selectedId, setSelectedId] = useState<string>('all');
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

    // Reset selectedId when viewType changes
    useEffect(() => {
        setSelectedId('all');
    }, [viewType, printMode]);

    const renderContent = () => {
        if (!data) {
             return <div className="p-8 text-center text-gray-500"><AlertCircle className="mx-auto h-8 w-8 mb-4"/>Nessun dato da visualizzare. Controlla la configurazione nel pannello Admin.</div>;
        }
        
        const sortedSessions = [...data.sessions].sort((a, b) => {
            const daySort = (a.day ?? 8) - (b.day ?? 8);
            if (daySort !== 0) return daySort;
            const timeSort = (a.startTime ?? 9999) - (b.startTime ?? 9999);
            return timeSort;
        });

        if (printMode === 'table') {
            switch (viewType) {
                case 'gym':
                    const gymsToRender = selectedId === 'all' ? data.gyms : data.gyms.filter(g => g.id === selectedId);
                    return <TablePrintView items={gymsToRender} type="gym" sessions={sortedSessions} data={data} />;
                case 'team':
                    const teamsToRender = selectedId === 'all' ? data.teams : data.teams.filter(t => t.id === selectedId);
                    return <TablePrintView items={teamsToRender} type="team" sessions={sortedSessions} data={data} />;
                case 'day':
                    const daysToRender = selectedId === 'all' ? DAYS_OF_WEEK.map((d,i) => ({ id: String(i + 1), name: d })) : [{ id: selectedId, name: DAYS_OF_WEEK[parseInt(selectedId) - 1] }];
                    return <TablePrintView items={daysToRender} type="day" sessions={sortedSessions} data={data} />;
                case 'coach':
                     const coachesToRender = selectedId === 'all' ? (data.coaches || []) : (data.coaches || []).filter(c => c.id === selectedId);
                     return <TablePrintView items={coachesToRender} type="coach" sessions={sortedSessions} data={data} />;
                default:
                    return null;
            }
        } else { // Planner mode
             switch (viewType) {
                case 'gym':
                    const gymsToRender = selectedId === 'all' ? data.gyms : data.gyms.filter(g => g.id === selectedId);
                    return gymsToRender.map(gym => <PlannerPrintView key={gym.id} item={gym} type="gym" sessions={sortedSessions} data={data} />);
                case 'team':
                    const teamsToRender = selectedId === 'all' ? data.teams : data.teams.filter(t => t.id === selectedId);
                    return teamsToRender.map(team => <PlannerPrintView key={team.id} item={team} type="team" sessions={sortedSessions} data={data} />);
                 case 'day':
                    const daysToRender = selectedId === 'all' ? DAYS_OF_WEEK.map((d,i) => ({ id: String(i + 1), name: d })) : [{ id: selectedId, name: DAYS_OF_WEEK[parseInt(selectedId) - 1] }];
                    return daysToRender.map(day => <PlannerPrintView key={day.id} item={day} type="day" sessions={sortedSessions} data={data} />);
                case 'coach':
                    const coachesToRender = selectedId === 'all' ? (data.coaches || []) : (data.coaches || []).filter(c => c.id === selectedId);
                    return coachesToRender.map(coach => <PlannerPrintView key={coach.id} item={coach} type="coach" sessions={sortedSessions} data={data} />);
                default:
                    return null;
            }
        }
    };
    
    const renderFilterOptions = () => {
        if (!data) return null;

        let options = [];
        switch(viewType) {
            case 'gym':
                options = data.gyms.map(g => ({ value: g.id, label: g.name }));
                break;
            case 'team':
                options = data.teams.map(t => ({ value: t.id, label: t.name }));
                break;
            case 'day':
                options = DAYS_OF_WEEK.map((day, index) => ({ value: String(index + 1), label: day }));
                break;
            case 'coach':
                options = (data.coaches || []).map(c => ({ value: c.id, label: c.name}));
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
                    {options.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                </SelectContent>
            </Select>
        );
    }
    
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
                 <Card className="w-full max-w-5xl mb-8 no-print">
                    <CardHeader>
                        <CardTitle>Opzioni di Stampa</CardTitle>
                        <CardDescription>Scegli il tipo di vista e clicca il pulsante in basso per generare la pagina di stampa.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Tabs value={printMode} onValueChange={(v) => setPrintMode(v as any)} className="w-full">
                            <TabsList className="grid w-full grid-cols-2 mb-4">
                                <TabsTrigger value="table"><TableIcon className="mr-2 h-4 w-4"/>Stampa Tabellare</TabsTrigger>
                                <TabsTrigger value="planner"><GanttChartSquare className="mr-2 h-4 w-4"/>Stampa Planner</TabsTrigger>
                            </TabsList>
                             <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                <div className="w-full sm:w-auto">
                                    <label className="text-sm font-medium mb-1 block">Raggruppa per</label>
                                    <Select value={viewType} onValueChange={(value) => setViewType(value as any)}>
                                        <SelectTrigger className="w-full sm:w-[220px]">
                                            <SelectValue placeholder="Seleziona vista" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="gym"><Building2 className="mr-2 h-4 w-4"/>Palestra</SelectItem>
                                            <SelectItem value="team"><Users className="mr-2 h-4 w-4"/>Squadra</SelectItem>
                                            <SelectItem value="day"><CalendarDays className="mr-2 h-4 w-4"/>Giorno</SelectItem>
                                            <SelectItem value="coach"><UserCheck className="mr-2 h-4 w-4"/>Coach</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="w-full sm:w-auto">
                                     <label className="text-sm font-medium mb-1 block">Filtra per</label>
                                     {renderFilterOptions()}
                                </div>
                             </div>
                        </Tabs>

                         <div className="pt-6 border-t mt-6">
                            <Button onClick={() => window.print()} variant="outline" className="border-red-800 text-blue-800 hover:bg-red-50 hover:text-blue-900">
                                <Printer className="mr-2 h-4 w-4" />Stampa / Salva PDF
                            </Button>
                        </div>
                    </CardContent>
                </Card>
                
                <div className={`print-container bg-white w-full p-6 shadow-lg rounded-lg border border-gray-200 ${printMode === 'planner' ? 'print-planner' : 'print-table'}`}>
                    {renderContent()}
                </div>

            </main>
        </div>
    );
}

const PrintHeader = ({ title, subtitle }: { title: string, subtitle: string }) => (
    <div className="mb-6 text-center">
        <h1 className="text-3xl font-bold text-gray-800">{title}</h1>
        <p className="text-lg text-gray-600">{subtitle}</p>
        <Separator className="my-4" />
    </div>
);


const TablePrintView = ({ items, type, sessions, data }: { items: any[], type: 'gym' | 'team' | 'day' | 'coach', sessions: Session[], data: Config }) => {
    const { gyms, teams, coaches } = data;

    const getSubtitle = () => {
        switch(type) {
            case 'gym': return "Riepilogo per Palestra";
            case 'team': return "Riepilogo per Squadra";
            case 'day': return "Riepilogo per Giorno";
            case 'coach': return "Riepilogo per Coach";
        }
    }
    
    return (
        <div>
            <PrintHeader title="Palinsesto Allenamenti" subtitle={getSubtitle()} />
            {items.map(item => {
                let itemSessions: Session[] = [];
                let headers: string[] = [];
                let renderRow: (session: Session) => React.ReactNode;
                
                switch(type) {
                    case 'gym':
                        itemSessions = sessions.filter(s => s.gymId === item.id);
                        headers = ["Giorno", "Orario", "Squadra", "Coach", "Durata"];
                        renderRow = (s) => {
                            const team = teams.find(t => t.id === s.teamId);
                            const sCoaches = (coaches || []).filter(c => (s.coachIds || []).includes(c.id));
                            return (
                                <TableRow key={s.id}>
                                    <TableCell className="font-medium">{s.day ? DAYS_OF_WEEK[s.day - 1] : 'N/A'}</TableCell>
                                    <TableCell>{formatTime(s.startTime)} - {formatTime(s.startTime ? s.startTime + s.duration : null)}</TableCell>
                                    <TableCell>{team?.name || 'N/A'}</TableCell>
                                    <TableCell>{sCoaches.map(c => c.name).join(', ') || 'N/D'}</TableCell>
                                    <TableCell className="text-right">{s.duration} min</TableCell>
                                </TableRow>
                            );
                        };
                        break;
                    case 'team':
                        itemSessions = sessions.filter(s => s.teamId === item.id && s.gymId);
                         headers = ["Giorno", "Orario", "Palestra", "Coach", "Durata"];
                         renderRow = (s) => {
                             const gym = gyms.find(g => g.id === s.gymId);
                             const sCoaches = (coaches || []).filter(c => (s.coachIds || []).includes(c.id));
                             return (
                                 <TableRow key={s.id}>
                                     <TableCell className="font-medium">{s.day ? DAYS_OF_WEEK[s.day - 1] : 'N/A'}</TableCell>
                                     <TableCell>{formatTime(s.startTime)} - {formatTime(s.startTime ? s.startTime + s.duration : null)}</TableCell>
                                     <TableCell>{gym?.name || 'N/A'}</TableCell>
                                     <TableCell>{sCoaches.map(c => c.name).join(', ') || 'N/D'}</TableCell>
                                     <TableCell className="text-right">{s.duration} min</TableCell>
                                 </TableRow>
                             );
                         };
                        break;
                     case 'day':
                        itemSessions = sessions.filter(s => String(s.day) === item.id && s.gymId);
                        headers = ["Orario", "Squadra", "Palestra", "Coach", "Durata"];
                        renderRow = (s) => {
                            const team = teams.find(t => t.id === s.teamId);
                            const gym = gyms.find(g => g.id === s.gymId);
                            const sCoaches = (coaches || []).filter(c => (s.coachIds || []).includes(c.id));
                             return (
                                 <TableRow key={s.id}>
                                     <TableCell>{formatTime(s.startTime)} - {formatTime(s.startTime ? s.startTime + s.duration : null)}</TableCell>
                                     <TableCell className="font-medium">{team?.name || 'N/A'}</TableCell>
                                     <TableCell>{gym?.name || 'N/A'}</TableCell>
                                     <TableCell>{sCoaches.map(c => c.name).join(', ') || 'N/D'}</TableCell>
                                     <TableCell className="text-right">{s.duration} min</TableCell>
                                 </TableRow>
                             );
                        }
                        break;
                    case 'coach':
                         itemSessions = sessions.filter(s => (s.coachIds || []).includes(item.id) && s.gymId);
                         headers = ["Giorno", "Orario", "Squadra", "Palestra", "Durata"];
                         renderRow = (s) => {
                             const team = teams.find(t => t.id === s.teamId);
                             const gym = gyms.find(g => g.id === s.gymId);
                             return (
                                <TableRow key={s.id}>
                                    <TableCell className="font-medium">{s.day ? DAYS_OF_WEEK[s.day - 1] : 'N/A'}</TableCell>
                                    <TableCell>{formatTime(s.startTime)} - {formatTime(s.startTime ? s.startTime + s.duration : null)}</TableCell>
                                    <TableCell>{team?.name || 'N/A'}</TableCell>
                                    <TableCell>{gym?.name || 'N/A'}</TableCell>
                                    <TableCell className="text-right">{s.duration} min</TableCell>
                                </TableRow>
                             );
                         };
                        break;
                }

                if(itemSessions.length === 0) return (
                     <div key={item.id} className="mb-8 page-break-inside-avoid">
                        <h2 className="text-2xl font-semibold mb-3 border-b-2 pb-2 border-primary">{item.name}</h2>
                        <p className="text-muted-foreground text-center py-4">Nessun allenamento programmato.</p>
                    </div>
                );
    
                return (
                    <div key={item.id} className="mb-8 page-break-inside-avoid">
                        <h2 className="text-2xl font-semibold mb-3 border-b-2 pb-2 border-primary">{item.name}</h2>
                        <Table>
                            <TableHeader>
                                <TableRow>{headers.map(h => <TableHead key={h}>{h}</TableHead>)}</TableRow>
                            </TableHeader>
                            <TableBody>{itemSessions.map(renderRow)}</TableBody>
                        </Table>
                    </div>
                )
            })}
        </div>
    );
};


const PlannerPrintView = ({ item, type, sessions, data }: { item: any, type: 'gym' | 'team' | 'day' | 'coach', sessions: Session[], data: Config }) => {
    const { gyms, teams, coaches, teamColors } = data;
    
    let title = item.name;
    let columns: { id: string, name: string }[] = [];
    let getColumnSessions: (columnId: string) => Session[];

    switch (type) {
        case 'gym':
        case 'team':
        case 'coach':
            columns = DAYS_OF_WEEK.map((d, i) => ({ id: String(i + 1), name: d }));
            getColumnSessions = (columnId) => {
                const dayKey = parseInt(columnId);
                if(type === 'gym') return sessions.filter(s => s.gymId === item.id && s.day === dayKey);
                if(type === 'team') return sessions.filter(s => s.teamId === item.id && s.day === dayKey);
                if(type === 'coach') return sessions.filter(s => (s.coachIds || []).includes(item.id) && s.day === dayKey);
                return [];
            };
            break;
        case 'day':
             columns = gyms;
             title = `Planner per ${item.name}`;
             getColumnSessions = (columnId) => {
                 const dayKey = parseInt(item.id);
                 return sessions.filter(s => s.gymId === columnId && s.day === dayKey);
             }
            break;
    }

    // Determine the overall time range for the planner view
    const minTime = PLANNER_START_HOUR * 60;
    const timeIntervals = TIME_SLOTS_PLANNER.map(slot => slot.totalMinutes);

    return (
        <div className="mb-8 page-break-inside-avoid">
            <h2 className="text-2xl font-semibold mb-4 text-center">{title}</h2>
            <div className="flex border-t border-l border-gray-300">
                <div className="w-20 flex-shrink-0 border-r border-gray-300 bg-gray-50">
                    <div className="h-10 border-b border-gray-300"></div>
                     {TIME_SLOTS_PLANNER.map((slot, index) => (
                        index % 4 === 0 ? (
                             <div key={slot.label} className="h-12 border-b border-gray-200 text-center text-xs pt-1 font-semibold">{slot.label}</div>
                        ) : null
                    ))}
                </div>
                <div className="flex-grow grid" style={{ gridTemplateColumns: `repeat(${columns.length}, 1fr)` }}>
                    {columns.map(col => (
                        <div key={col.id} className="relative border-r border-gray-300">
                            <div className="h-10 border-b border-gray-300 bg-gray-50 flex items-center justify-center text-center font-semibold text-sm p-1">{col.name}</div>
                            <div className="relative" style={{ height: `${(timeIntervals.length - 1) * 3}px` }}>
                                {/* Background grid lines */}
                                {timeIntervals.map((time, index) => (
                                    <div key={time} className={`absolute w-full ${index % 4 === 0 ? 'border-t border-gray-200' : 'border-t border-gray-100'}`} style={{ top: `${index * 3}px`}}></div>
                                ))}

                                {getColumnSessions(col.id).map(session => {
                                    if (session.startTime === null || session.duration <= 0) return null;
                                    const topOffset = (session.startTime - minTime) / 15; // Number of 15-min intervals from start time
                                    const top = topOffset * 3; // 3px per 15min interval
                                    const height = (session.duration / 15) * 3;
                                    
                                    const team = teams.find(t => t.id === session.teamId);
                                    const sessionCoaches = (coaches || []).filter(c => (session.coachIds || []).includes(c.id));
                                    const gym = gyms.find(g => g.id === session.gymId);

                                    const color = teamColors[session.teamId] || '#ccc';
                                    const darkColor = `color-mix(in srgb, ${color} 80%, black)`;


                                    return (
                                        <div key={session.id} className="absolute w-full px-0.5" style={{ top: `${top}px`, height: `${height}px` }}>
                                            <div className="h-full rounded-sm border-l-4 p-1 text-white text-[10px] flex flex-col justify-start overflow-hidden leading-tight" style={{ backgroundColor: color, borderLeftColor: darkColor}}>
                                                 <p className="font-bold truncate">{team?.name || 'N/D'}</p>
                                                 {type !== 'gym' && <p className="truncate opacity-90">{gym?.name || 'N/D'}</p>}
                                                 <p className="truncate opacity-90">{sessionCoaches.map(c => c.name).join(', ') || 'N/D'}</p>
                                                 <p className="mt-auto opacity-90">{session.duration} min</p>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

    
