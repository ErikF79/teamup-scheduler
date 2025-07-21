
"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Building2, PlusCircle, Users, Download, Upload, Pencil, Trash2, X, Check } from "lucide-react";
import Link from "next/link";
import { initialData as mockData, Session, Gym, Team } from '@/lib/teamup';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

type AppData = {
    gyms: Gym[];
    teams: Team[];
    sessions: Session[];
    teamColors: { [key: string]: string };
}

// --- Main Admin Page Component ---
export default function AdminPage() {
    const [data, setData] = useState<AppData>(() => {
        if (typeof window !== 'undefined') {
            const savedData = localStorage.getItem('teamup_data');
            try {
                if (savedData) return JSON.parse(savedData);
            } catch (e) {
                console.error("Failed to parse data from localStorage", e);
            }
        }
        return mockData;
    });

    const [editingGymId, setEditingGymId] = useState<string | null>(null);
    const [editingTeamId, setEditingTeamId] = useState<string | null>(null);

    const updateData = (newData: Partial<AppData>) => {
        const updatedData = { ...data, ...newData };
        setData(updatedData);
        if (typeof window !== 'undefined') {
            localStorage.setItem('teamup_data', JSON.stringify(updatedData));
        }
    };

    // --- Gym Handlers ---
    const handleAddGym = () => {
        const newGym: Gym = {
            id: `gym-${Date.now()}`,
            name: "Nuova Palestra",
            availability: [
                { key: 1, name: 'Lunedì', start: 17, end: 23 },
                { key: 2, name: 'Martedì', start: 17, end: 23 },
                { key: 3, name: 'Mercoledì', start: 17, end: 23 },
                { key: 4, name: 'Giovedì', start: 17, end: 23 },
                { key: 5, name: 'Venerdì', start: 17, end: 23 },
                { key: 6, name: 'Sabato', start: 14, end: 20 },
                { key: 7, name: 'Domenica', start: 9, end: 20 },
            ]
        };
        updateData({ gyms: [...data.gyms, newGym] });
    };

    const handleUpdateGym = (updatedGym: Gym) => {
        updateData({ gyms: data.gyms.map(g => g.id === updatedGym.id ? updatedGym : g) });
        setEditingGymId(null);
    };

    const handleDeleteGym = (gymId: string) => {
        // Also remove sessions assigned to this gym
        const newSessions = data.sessions.map(s => s.gymId === gymId ? { ...s, gymId: null, day: null, startTime: null } : s);
        updateData({
            gyms: data.gyms.filter(g => g.id !== gymId),
            sessions: newSessions
        });
    };

    // --- Team Handlers ---
    const handleAddTeam = () => {
        const newTeamId = `team-${Date.now()}`;
        const newTeam: Team = {
            id: newTeamId,
            name: "Nuova Squadra",
            sessionsPerWeek: 2,
            sessionDuration: 90,
            seasonStartDate: '2024-09-01',
            seasonEndDate: '2025-05-31',
        };
        const newSessions: Session[] = Array.from({ length: newTeam.sessionsPerWeek }, (_, i) => ({
            id: `session-${newTeamId}-${i + 1}`,
            teamId: newTeamId,
            duration: newTeam.sessionDuration,
            gymId: null,
            day: null,
            startTime: null,
        }));
        const newTeamColors = { ...data.teamColors, [newTeamId]: `hsl(${Math.random() * 360}, 70%, 50%)` };

        updateData({
            teams: [...data.teams, newTeam],
            sessions: [...data.sessions, ...newSessions],
            teamColors: newTeamColors,
        });
    };

    const handleUpdateTeam = (updatedTeam: Team) => {
        const oldTeam = data.teams.find(t => t.id === updatedTeam.id);
        let newSessions = [...data.sessions];

        if (oldTeam && (oldTeam.sessionsPerWeek !== updatedTeam.sessionsPerWeek || oldTeam.sessionDuration !== updatedTeam.sessionDuration)) {
            // Remove old sessions
            newSessions = newSessions.filter(s => s.teamId !== updatedTeam.id);
            // Add new sessions
            const sessionsToAdd: Session[] = Array.from({ length: updatedTeam.sessionsPerWeek }, (_, i) => ({
                id: `session-${updatedTeam.id}-${i + 1}`,
                teamId: updatedTeam.id,
                duration: updatedTeam.sessionDuration,
                gymId: null, day: null, startTime: null
            }));
            newSessions.push(...sessionsToAdd);
        }

        updateData({
            teams: data.teams.map(t => t.id === updatedTeam.id ? updatedTeam : t),
            sessions: newSessions,
        });
        setEditingTeamId(null);
    };

    const handleDeleteTeam = (teamId: string) => {
        const newTeams = data.teams.filter(t => t.id !== teamId);
        const newSessions = data.sessions.filter(s => s.teamId !== teamId);
        const newTeamColors = { ...data.teamColors };
        delete newTeamColors[teamId];

        updateData({
            teams: newTeams,
            sessions: newSessions,
            teamColors: newTeamColors
        });
    };


    // --- Import/Export Handlers ---
    const handleExport = () => {
        const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
        const link = document.createElement("a");
        link.href = jsonString;
        link.download = "teamup_data.json";
        link.click();
    };

    const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result;
                if (typeof (text) === 'string') {
                    const parsedData = JSON.parse(text);
                    // Basic validation
                    if (parsedData.gyms && parsedData.teams && parsedData.sessions && parsedData.teamColors) {
                        updateData(parsedData);
                    } else {
                        alert("File JSON non valido.");
                    }
                }
            } catch (error) {
                alert("Errore nel parsing del file JSON.");
                console.error("Import error:", error);
            }
        };
        reader.readAsText(file);
    };


    return (
        <TooltipProvider>
            <div className="min-h-screen bg-background">
                <header className="flex items-center justify-between p-4 border-b bg-card">
                    <h1 className="text-xl font-bold text-primary">Admin Panel</h1>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={handleExport}><Download className="mr-2 h-4 w-4" /> Esporta</Button>
                        <Label htmlFor="import-json" className="cursor-pointer">
                            <div className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
                               <Upload className="mr-2 h-4 w-4" /> Importa
                            </div>
                        </Label>
                        <Input id="import-json" type="file" accept=".json" className="hidden" onChange={handleImport} />
                        <Link href="/"><Button variant="outline">Torna allo Scheduler</Button></Link>
                    </div>
                </header>

                <main className="p-4 md:p-8 grid gap-8 md:grid-cols-2 items-start">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Building2 className="text-primary" /> Gestione Palestre</CardTitle>
                            <CardDescription>Aggiungi, modifica o elimina le palestre e i loro orari.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-3">
                                {data.gyms.map(gym =>
                                    editingGymId === gym.id ? (
                                        <GymEditForm key={gym.id} gym={gym} onSave={handleUpdateGym} onCancel={() => setEditingGymId(null)} />
                                    ) : (
                                        <div key={gym.id} className="flex items-center justify-between p-3 rounded-md border bg-card">
                                            <span className="font-medium">{gym.name}</span>
                                            <div className="flex items-center gap-2">
                                                <Button variant="ghost" size="icon" onClick={() => setEditingGymId(gym.id)}><Pencil className="h-4 w-4" /></Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleDeleteGym(gym.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                            </div>
                                        </div>
                                    )
                                )}
                            </div>
                            <Button className="mt-2 w-full bg-accent hover:bg-accent/90" onClick={handleAddGym}>
                                <PlusCircle className="mr-2 h-4 w-4" /> Aggiungi Palestra
                            </Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Users className="text-primary" /> Gestione Squadre</CardTitle>
                            <CardDescription>Definisci le squadre, le sessioni settimanali e il periodo.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-3">
                                {data.teams.map(team =>
                                    editingTeamId === team.id ? (
                                        <TeamEditForm key={team.id} team={team} onSave={handleUpdateTeam} onCancel={() => setEditingTeamId(null)} />
                                    ) : (
                                        <div key={team.id} className="flex items-center justify-between p-3 rounded-md border bg-card">
                                            <span className="font-medium">{team.name}</span>
                                            <div className="flex items-center gap-2">
                                                <Button variant="ghost" size="icon" onClick={() => setEditingTeamId(team.id)}><Pencil className="h-4 w-4" /></Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleDeleteTeam(team.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                            </div>
                                        </div>
                                    )
                                )}
                            </div>
                            <Button className="mt-2 w-full bg-accent hover:bg-accent/90" onClick={handleAddTeam}>
                                <PlusCircle className="mr-2 h-4 w-4" /> Aggiungi Squadra
                            </Button>
                        </CardContent>
                    </Card>
                </main>
            </div>
        </TooltipProvider>
    );
}

// --- Gym Edit Form Component ---
interface GymEditFormProps {
    gym: Gym;
    onSave: (gym: Gym) => void;
    onCancel: () => void;
}
function GymEditForm({ gym, onSave, onCancel }: GymEditFormProps) {
    const [formData, setFormData] = useState(gym);

    const handleDayChange = (dayKey: number, field: 'start' | 'end', value: string) => {
        const newAvailability = formData.availability.map(day =>
            day.key === dayKey ? { ...day, [field]: parseInt(value, 10) } : day
        );
        setFormData({ ...formData, availability: newAvailability });
    };

    const handleSave = () => {
        onSave(formData);
    };
    
    const timeOptions = useMemo(() => Array.from({ length: 24 }, (_, i) => 
        <option key={i} value={i}>{`${i.toString().padStart(2, '0')}:00`}</option>
    ), []);

    return (
        <div className="p-4 border rounded-lg space-y-4 bg-secondary/30">
            <div className="space-y-2">
                <Label htmlFor={`gym-name-${gym.id}`}>Nome Palestra</Label>
                <Input id={`gym-name-${gym.id}`} value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <Separator />
            <div className="space-y-3">
                <h4 className="font-semibold text-sm">Orari di Disponibilità</h4>
                {formData.availability.map(day => (
                    <div key={day.key} className="grid grid-cols-3 items-center gap-2">
                        <Label className="text-xs col-span-1">{day.name}</Label>
                        <div className="col-span-2 grid grid-cols-2 gap-2">
                            <select value={day.start} onChange={(e) => handleDayChange(day.key, 'start', e.target.value)} className="w-full h-8 px-2 border rounded-md text-xs bg-card">
                                {timeOptions}
                            </select>
                             <select value={day.end} onChange={(e) => handleDayChange(day.key, 'end', e.target.value)} className="w-full h-8 px-2 border rounded-md text-xs bg-card">
                                {timeOptions}
                            </select>
                        </div>
                    </div>
                ))}
            </div>
            <div className="flex justify-end gap-2 mt-4">
                 <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={onCancel}><X className="h-5 w-5"/></Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Annulla</p>
                    </TooltipContent>
                </Tooltip>
                 <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="outline" size="icon" onClick={handleSave} className="text-green-600 border-green-600 hover:bg-green-100 hover:text-green-700">
                            <Check className="h-5 w-5"/>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Salva</p>
                    </TooltipContent>
                </Tooltip>
            </div>
        </div>
    );
}

// --- Team Edit Form Component ---
interface TeamEditFormProps {
    team: Team;
    onSave: (team: Team) => void;
    onCancel: () => void;
}
function TeamEditForm({ team, onSave, onCancel }: TeamEditFormProps) {
    const [formData, setFormData] = useState(team);

    const handleSave = () => {
        onSave(formData);
    };

    return (
        <div className="p-4 border rounded-lg space-y-4 bg-secondary/30">
            <div className="space-y-2">
                <Label htmlFor={`team-name-${team.id}`}>Nome Squadra</Label>
                <Input id={`team-name-${team.id}`} value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor={`team-sessions-${team.id}`}>Allenamenti/sett.</Label>
                    <Input id={`team-sessions-${team.id}`} type="number" min="1" value={formData.sessionsPerWeek} onChange={(e) => setFormData({ ...formData, sessionsPerWeek: parseInt(e.target.value, 10) || 1 })} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor={`team-duration-${team.id}`}>Durata (min)</Label>
                    <Input id={`team-duration-${team.id}`} type="number" min="30" step="15" value={formData.sessionDuration} onChange={(e) => setFormData({ ...formData, sessionDuration: parseInt(e.target.value, 10) || 30 })} />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor={`team-start-${team.id}`}>Inizio Stagione</Label>
                    <Input id={`team-start-${team.id}`} type="date" value={formData.seasonStartDate} onChange={(e) => setFormData({ ...formData, seasonStartDate: e.target.value })} />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor={`team-end-${team.id}`}>Fine Stagione</Label>
                    <Input id={`team-end-${team.id}`} type="date" value={formData.seasonEndDate} onChange={(e) => setFormData({ ...formData, seasonEndDate: e.target.value })} />
                </div>
            </div>
             <div className="flex justify-end gap-2 mt-4">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={onCancel}><X className="h-5 w-5"/></Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Annulla</p>
                    </TooltipContent>
                </Tooltip>
                 <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="outline" size="icon" onClick={handleSave} className="text-green-600 border-green-600 hover:bg-green-100 hover:text-green-700">
                           <Check className="h-5 w-5"/>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Salva</p>
                    </TooltipContent>
                </Tooltip>
            </div>
        </div>
    );
}

    