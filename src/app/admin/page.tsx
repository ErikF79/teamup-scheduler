
"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Building2, PlusCircle, Users, Download, Upload, Pencil, Trash2, X, Check, LayoutDashboard, Plus, Trash, Save, FilePlus, Edit, TrashIcon, UserCheck, Settings, Menu } from "lucide-react";
import Link from "next/link";
import { initialData as mockData, Session, Gym, Team, DayAvailability, TimeSlot, Config, AppData, UserData, Coach } from '@/lib/teamup';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";


// --- Main Admin Page Component ---
export default function AdminPage() {
    const [userData, setUserData] = useState<UserData | null>(null);
    const [activeUser, setActiveUser] = useState<string | null>(null);
    const { toast } = useToast();
    const router = useRouter();

    // --- Data Fetching ---
    const fetchData = useCallback(() => {
        if (typeof window !== 'undefined') {
            const loggedInUser = localStorage.getItem('teamup_active_user');
            if (!loggedInUser) {
                router.replace('/login');
                return;
            }
            setActiveUser(loggedInUser);

            const savedData = localStorage.getItem('teamup_data');
            try {
                if (savedData) {
                    const parsedData: AppData = JSON.parse(savedData);
                    if (parsedData.userData && parsedData.userData[loggedInUser]) {
                        setUserData(parsedData.userData[loggedInUser]);
                        return;
                    }
                }
            } catch (e) {
                console.error("Failed to parse data from localStorage", e);
            }
            // Fallback to initial structure if nothing valid is found
            setUserData({ configurations: [mockData], activeConfigurationId: mockData.id });
        }
    }, [router]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);


    const [editingGymId, setEditingGymId] = useState<string | null>(null);
    const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
    const [editingCoachId, setEditingCoachId] = useState<string | null>(null);


    const activeConfig = useMemo(() => {
        if (!userData) return null;
        return userData.configurations.find(c => c.id === userData.activeConfigurationId) || userData.configurations[0];
    }, [userData]);


    const updateUserData = (newUserData: UserData) => {
        setUserData(newUserData);
        if (typeof window !== 'undefined' && activeUser) {
             const savedData = localStorage.getItem('teamup_data');
             const appData: AppData = savedData ? JSON.parse(savedData) : { users: {}, userData: {} };
             appData.userData[activeUser] = newUserData;
             localStorage.setItem('teamup_data', JSON.stringify(appData));
        }
    };

    const updateActiveConfig = (newConfigData: Partial<Omit<Config, 'id' | 'name'>>) => {
        if (!userData) return;
        const newConfigurations = userData.configurations.map(c => {
            if (c.id === userData.activeConfigurationId) {
                const currentConfig = { ...c, ...newConfigData };
                // Ensure coaches array exists
                if (!currentConfig.coaches) {
                    currentConfig.coaches = [];
                }
                 // Ensure coachIds is an array for every session
                currentConfig.sessions = currentConfig.sessions.map(s => ({...s, coachIds: Array.isArray(s.coachIds) ? s.coachIds : []}));

                return currentConfig;
            }
            return c;
        });
        const newUserData = { ...userData, configurations: newConfigurations };
        updateUserData(newUserData);
    };


    // --- Gym Handlers ---
    const handleAddGym = () => {
        if (!activeConfig) return;
        const newGym: Gym = {
            id: `gym-${Date.now()}`,
            name: "Nuova Palestra",
            availability: [
                { key: 1, name: 'Lunedì', slots: [{ start: 17 * 60, end: 23 * 60 }] },
                { key: 2, name: 'Martedì', slots: [{ start: 17 * 60, end: 23 * 60 }] },
                { key: 3, name: 'Mercoledì', slots: [{ start: 17 * 60, end: 23 * 60 }] },
                { key: 4, name: 'Giovedì', slots: [{ start: 17 * 60, end: 23 * 60 }] },
                { key: 5, name: 'Venerdì', slots: [{ start: 17 * 60, end: 23 * 60 }] },
                { key: 6, name: 'Sabato', slots: [{ start: 14 * 60, end: 20 * 60 }] },
                { key: 7, name: 'Domenica', slots: [{ start: 9 * 60, end: 20 * 60 }] },
            ]
        };
        updateActiveConfig({ gyms: [...activeConfig.gyms, newGym] });
    };

    const handleUpdateGym = (updatedGym: Gym) => {
        if (!activeConfig) return;
        updateActiveConfig({ gyms: activeConfig.gyms.map(g => g.id === updatedGym.id ? updatedGym : g) });
        setEditingGymId(null);
    };

    const handleDeleteGym = (gymId: string) => {
        if (!activeConfig) return;
        // Also remove sessions assigned to this gym
        const newSessions = activeConfig.sessions.map(s => s.gymId === gymId ? { ...s, gymId: null, day: null, startTime: null } : s);
        updateActiveConfig({
            gyms: activeConfig.gyms.filter(g => g.id !== gymId),
            sessions: newSessions
        });
    };

    // --- Team Handlers ---
    const handleAddTeam = () => {
        if (!activeConfig) return;
        const newTeamId = `team-${Date.now()}`;
        const newTeam: Team = {
            id: newTeamId,
            name: "Nuova Squadra",
            seasonStartDate: '2025-09-05',
            seasonEndDate: '2026-05-30',
        };
        // Add one default session
        const newSession: Session = {
            id: `session-${newTeamId}-1`,
            teamId: newTeamId,
            duration: 90, // default duration
            coachIds: [],
            gymId: null,
            day: null,
            startTime: null,
        };
        const newTeamColors = { ...activeConfig.teamColors, [newTeamId]: `hsl(${Math.random() * 360}, 70%, 50%)` };

        updateActiveConfig({
            teams: [...activeConfig.teams, newTeam],
            sessions: [...activeConfig.sessions, newSession],
            teamColors: newTeamColors,
        });
    };

    const handleUpdateTeam = (updatedTeam: Team, teamSessions: Session[]) => {
        if (!activeConfig) return;
        // Get all sessions that do NOT belong to the team being updated
        const otherTeamsSessions = activeConfig.sessions.filter(s => s.teamId !== updatedTeam.id);
        
        updateActiveConfig({
            teams: activeConfig.teams.map(t => (t.id === updatedTeam.id ? updatedTeam : t)),
            sessions: [...otherTeamsSessions, ...teamSessions],
        });
        setEditingTeamId(null);
    };

    const handleDeleteTeam = (teamId: string) => {
        if (!activeConfig) return;
        const newTeams = activeConfig.teams.filter(t => t.id !== teamId);
        const newSessions = activeConfig.sessions.filter(s => s.teamId !== teamId);
        const newTeamColors = { ...activeConfig.teamColors };
        delete newTeamColors[teamId];

        updateActiveConfig({
            teams: newTeams,
            sessions: newSessions,
            teamColors: newTeamColors
        });
    };

    // --- Coach Handlers ---
    const handleAddCoach = () => {
        if (!activeConfig) return;
        const newCoach: Coach = { id: `coach-${Date.now()}`, name: "Nuovo Coach" };
        updateActiveConfig({ coaches: [...(activeConfig.coaches || []), newCoach] });
    };

    const handleUpdateCoach = (updatedCoach: Coach) => {
        if (!activeConfig) return;
        updateActiveConfig({ coaches: (activeConfig.coaches || []).map(c => c.id === updatedCoach.id ? updatedCoach : c) });
        setEditingCoachId(null);
    };

    const handleDeleteCoach = (coachId: string) => {
        if (!activeConfig) return;
        // Unassign coach from any sessions
        const newSessions = activeConfig.sessions.map(s => {
            const newCoachIds = s.coachIds.filter(id => id !== coachId);
            return { ...s, coachIds: newCoachIds };
        });
        updateActiveConfig({
            coaches: (activeConfig.coaches || []).filter(c => c.id !== coachId),
            sessions: newSessions,
        });
    };


    // --- Import/Export Handlers ---
    const handleExport = () => {
        if (!userData || !activeUser) return;
        
        const defaultFileName = `teamup_config_${activeUser}_${new Date().toISOString().split('T')[0]}.json`;
        const fileName = prompt("Inserisci il nome per il file di esportazione:", defaultFileName);

        if (fileName === null) { // User clicked cancel
            return;
        }
        
        const finalFileName = fileName.trim() ? (fileName.endsWith('.json') ? fileName : `${fileName}.json`) : defaultFileName;

        const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(userData, null, 2))}`;
        const link = document.createElement("a");
        link.href = jsonString;
        link.download = finalFileName;
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
                    
                    // NEW: Check for new format (UserData)
                    if (parsedData.configurations && parsedData.activeConfigurationId) {
                        updateUserData(parsedData);
                        toast({ title: "Importazione completata", description: "Le configurazioni sono state caricate." });
                    } 
                    // OLD format check (Config)
                    else if (parsedData.gyms && parsedData.teams && parsedData.sessions) {
                         const convertedSessions = parsedData.sessions.map((s: any) => {
                            const { coachId, ...rest } = s;
                            return { ...rest, coachIds: coachId ? [coachId] : [] };
                        });
                        const newConfig: Config = {
                            ...parsedData,
                            sessions: convertedSessions,
                            id: `config-imported-${Date.now()}`,
                            name: "Configurazione Importata",
                            coaches: parsedData.coaches || [], // Ensure coaches is present
                        };
                         if (!userData) return;
                        const newUserConfigurations = [...userData.configurations, newConfig];
                        updateUserData({ ...userData, configurations: newUserConfigurations, activeConfigurationId: newConfig.id });
                        toast({ title: "Importazione completata", description: "La vecchia configurazione è stata importata e salvata come una nuova." });
                    }
                    else {
                         toast({ title: "Errore", description: "File JSON non valido o malformato.", variant: "destructive" });
                    }
                }
            } catch (error) {
                toast({ title: "Errore", description: "Errore nel parsing del file JSON.", variant: "destructive" });
                console.error("Import error:", error);
            }
        };
        reader.readAsText(file);
    };
    
    // --- Configuration Handlers ---
    const handleSetActiveConfig = (configId: string) => {
        if (!userData) return;
        updateUserData({ ...userData, activeConfigurationId: configId });
    }

    const handleSaveAs = () => {
        if (!userData || !activeConfig) return;
        const newName = prompt("Inserisci un nome per la nuova configurazione:");
        if (newName) {
            const newConfig: Config = {
                ...activeConfig,
                id: `config-${Date.now()}`,
                name: newName
            };
            const newUserConfigurations = [...userData.configurations, newConfig];
            updateUserData({ ...userData, configurations: newUserConfigurations, activeConfigurationId: newConfig.id });
            toast({ title: "Configurazione salvata", description: `Creata nuova configurazione "${newName}".` });
        }
    }
    
    const handleRename = () => {
        if (!userData || !activeConfig) return;
        const newName = prompt(`Inserisci il nuovo nome per "${activeConfig.name}":`, activeConfig.name);
        if (newName) {
            const newConfigurations = userData.configurations.map(c => 
                c.id === activeConfig.id ? {...c, name: newName } : c
            );
            updateUserData({ ...userData, configurations: newConfigurations });
            toast({ title: "Configurazione rinominata" });
        }
    }
    
    const handleDeleteConfig = () => {
         if (!userData || !activeConfig) return;
         if (userData.configurations.length <= 1) {
             toast({ title: "Azione non consentita", description: "Non puoi eliminare l'unica configurazione esistente.", variant: "destructive" });
            return;
        }
        if (!confirm(`Sei sicuro di voler eliminare la configurazione "${activeConfig.name}"?`)) {
            return;
        }
        const newConfigurations = userData.configurations.filter(c => c.id !== activeConfig.id);
        const newActiveId = newConfigurations[0].id;
        updateUserData({ configurations: newConfigurations, activeConfigurationId: newActiveId });
        toast({ title: "Configurazione eliminata", description: `"${activeConfig.name}" è stata rimossa.` });
    }

    if (!userData || !activeConfig) {
        return <div className="flex items-center justify-center min-h-screen">Loading or redirecting...</div>;
    }

    return (
        <TooltipProvider>
            <div className="min-h-screen bg-background">
                 <header className="flex items-center justify-between p-4 border-b bg-card sticky top-0 z-10">
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
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <h1 className="text-lg md:text-xl font-bold text-primary">Admin Panel</h1>
                    </div>
                    <div className="flex items-center gap-2">
                         <Tooltip>
                            <TooltipTrigger asChild><Button variant="outline" onClick={handleExport}><Download className="mr-2 h-4 w-4" /> <span className="hidden sm:inline">Esporta</span></Button></TooltipTrigger>
                            <TooltipContent><p>Esporta tutte le configurazioni in un unico file.</p></TooltipContent>
                         </Tooltip>
                         <Label htmlFor="import-json" className="cursor-pointer">
                             <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
                                       <Upload className="mr-2 h-4 w-4" /> <span className="hidden sm:inline">Importa</span>
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent><p>Importa un file con una o più configurazioni.</p></TooltipContent>
                            </Tooltip>
                        </Label>
                        <Input id="import-json" type="file" accept=".json" className="hidden" onChange={handleImport} />
                    </div>
                </header>

                <main className="p-4 md:p-8 grid gap-8 items-start">
                    <Card>
                        <CardHeader>
                            <CardTitle>Gestione Configurazioni</CardTitle>
                            <CardDescription>Salva, carica e gestisci diverse configurazioni di palestre e squadre.</CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                             <Label>Configurazione Attiva:</Label>
                            <Select value={activeConfig.id} onValueChange={handleSetActiveConfig}>
                                <SelectTrigger className="w-full sm:w-[280px]">
                                    <SelectValue placeholder="Seleziona una configurazione" />
                                </SelectTrigger>
                                <SelectContent>
                                    {userData.configurations.map(c => (
                                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <div className="flex items-center gap-2">
                                <Button variant="outline" onClick={handleSaveAs}><Save className="mr-2 h-4 w-4" /> <span className="hidden sm:inline">Salva come...</span></Button>
                                <Button variant="ghost" size="icon" onClick={handleRename}><Edit className="h-4 w-4" /></Button>
                               <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/90 hover:bg-destructive/10">
                                            <TrashIcon className="h-4 w-4" />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                        <AlertDialogTitle>Sei sicuro?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Questa azione non può essere annullata. Eliminerà permanentemente la configurazione
                                            <span className="font-bold"> "{activeConfig.name}"</span>.
                                        </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                        <AlertDialogCancel>Annulla</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleDeleteConfig} className="bg-destructive hover:bg-destructive/90">Elimina</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-start">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><Building2 className="text-primary" /> Gestione Palestre</CardTitle>
                                <CardDescription>Aggiungi, modifica o elimina le palestre e i loro orari per la configurazione <span className="font-bold">"{activeConfig.name}"</span>.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-3">
                                    {activeConfig.gyms.map(gym =>
                                        editingGymId === gym.id ? (
                                            <GymEditForm key={gym.id} gym={gym} onSave={handleUpdateGym} onCancel={() => setEditingGymId(null)} />
                                        ) : (
                                            <div key={gym.id} className="flex items-center justify-between p-3 rounded-md border bg-card">
                                                <span className="font-medium">{gym.name}</span>
                                                <div className="flex items-center gap-2">
                                                    <Button variant="ghost" size="icon" onClick={() => setEditingGymId(gym.id)}><Pencil className="h-4 w-4" /></Button>
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                          <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                            <AlertDialogTitle>Sei sicuro di voler eliminare {gym.name}?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                Questa azione è irreversibile. Tutte le sessioni assegnate a questa palestra verranno spostate tra quelle "da assegnare".
                                                            </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                            <AlertDialogCancel>Annulla</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleDeleteGym(gym.id)} className="bg-destructive hover:bg-destructive/90">Elimina</AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </div>
                                            </div>
                                        )
                                    )}
                                </div>
                                <Button className="mt-2 w-full" onClick={handleAddGym}>
                                    <PlusCircle className="mr-2 h-4 w-4" /> Aggiungi Palestra
                                </Button>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><Users className="text-primary" /> Gestione Squadre</CardTitle>
                                <CardDescription>Definisci le squadre e le loro sessioni per la configurazione <span className="font-bold">"{activeConfig.name}"</span>.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-3">
                                    {activeConfig.teams.map(team =>
                                        editingTeamId === team.id ? (
                                            <TeamEditForm 
                                                key={team.id} 
                                                team={team} 
                                                sessions={activeConfig.sessions.filter(s => s.teamId === team.id)}
                                                onSave={handleUpdateTeam} 
                                                onCancel={() => setEditingTeamId(null)} 
                                            />
                                        ) : (
                                            <div key={team.id} className="flex items-center justify-between p-3 rounded-md border bg-card">
                                                <span className="font-medium">{team.name}</span>
                                                <div className="flex items-center gap-2">
                                                    <Button variant="ghost" size="icon" onClick={() => setEditingTeamId(team.id)}><Pencil className="h-4 w-4" /></Button>
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                          <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                            <AlertDialogTitle>Sei sicuro di voler eliminare {team.name}?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                Questa azione è irreversibile. Verranno eliminate anche tutte le sessioni di allenamento associate.
                                                            </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                            <AlertDialogCancel>Annulla</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleDeleteTeam(team.id)} className="bg-destructive hover:bg-destructive/90">Elimina</AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </div>
                                            </div>
                                        )
                                    )}
                                </div>
                                <Button className="mt-2 w-full" onClick={handleAddTeam}>
                                    <PlusCircle className="mr-2 h-4 w-4" /> Aggiungi Squadra
                                </Button>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><UserCheck className="text-primary" /> Gestione Coach</CardTitle>
                                <CardDescription>Aggiungi o rimuovi gli allenatori per la configurazione <span className="font-bold">"{activeConfig.name}"</span>.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-3">
                                    {(activeConfig.coaches || []).map(coach =>
                                        editingCoachId === coach.id ? (
                                            <CoachEditForm key={coach.id} coach={coach} onSave={handleUpdateCoach} onCancel={() => setEditingCoachId(null)} />
                                        ) : (
                                            <div key={coach.id} className="flex items-center justify-between p-3 rounded-md border bg-card">
                                                <span className="font-medium">{coach.name}</span>
                                                <div className="flex items-center gap-2">
                                                    <Button variant="ghost" size="icon" onClick={() => setEditingCoachId(coach.id)}><Pencil className="h-4 w-4" /></Button>
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                          <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                            <AlertDialogTitle>Sei sicuro di voler eliminare {coach.name}?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                Questa azione è irreversibile. Il coach verrà rimosso da tutte le sessioni a cui è assegnato.
                                                            </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                            <AlertDialogCancel>Annulla</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleDeleteCoach(coach.id)} className="bg-destructive hover:bg-destructive/90">Elimina</AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </div>
                                            </div>
                                        )
                                    )}
                                </div>
                                <Button className="mt-2 w-full" onClick={handleAddCoach}>
                                    <PlusCircle className="mr-2 h-4 w-4" /> Aggiungi Coach
                                </Button>
                            </CardContent>
                        </Card>

                    </div>
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

    const handleSlotChange = (dayKey: number, slotIndex: number, field: 'start' | 'end', value: string) => {
        const intValue = parseInt(value, 10);
        const newAvailability = formData.availability.map(day => {
            if (day.key === dayKey) {
                const newSlots = day.slots.map((slot, i) =>
                    i === slotIndex ? { ...slot, [field]: intValue } : slot
                );
                return { ...day, slots: newSlots };
            }
            return day;
        });
        setFormData({ ...formData, availability: newAvailability });
    };
    
    const handleAddSlot = (dayKey: number) => {
        const newAvailability = formData.availability.map(day => {
            if (day.key === dayKey) {
                const newSlots = [...(day.slots || []), {start: 9*60, end: 10*60}];
                return { ...day, slots: newSlots };
            }
            return day;
        });
        setFormData({ ...formData, availability: newAvailability });
    };

    const handleRemoveSlot = (dayKey: number, slotIndex: number) => {
        const newAvailability = formData.availability.map(day => {
            if (day.key === dayKey) {
                 const newSlots = (day.slots || []).filter((_, i) => i !== slotIndex);
                 return { ...day, slots: newSlots };
            }
            return day;
        });
        setFormData({ ...formData, availability: newAvailability });
    };


    const handleSave = () => {
        onSave(formData);
    };
    
    const timeOptions = useMemo(() => {
        const options = [];
         for (let h = 0; h < 24; h++) {
             for (let m = 0; m < 60; m += 15) {
                const totalMinutes = h * 60 + m;
                const timeString = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
                options.push(<option key={totalMinutes} value={totalMinutes}>{timeString}</option>);
             }
        }
        return options;
    }, []);

    const endTimeOptions = (startMinutes: number) => {
        const options = [];
         for (let h = 0; h < 24; h++) {
             for (let m = 0; m < 60; m += 15) {
                const totalMinutes = h * 60 + m;
                if (totalMinutes > startMinutes) {
                    const timeString = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
                    options.push(<option key={totalMinutes} value={totalMinutes}>{timeString}</option>);
                }
             }
        }
        options.push(<option key={24*60} value={24*60}>24:00</option>)
        return options;
    }


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
                    <div key={day.key} className="space-y-2">
                        <div className="flex items-center justify-between">
                             <Label className="text-xs font-bold">{day.name}</Label>
                             <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleAddSlot(day.key)}>
                                <Plus className="h-4 w-4"/>
                             </Button>
                        </div>
                        {(!day.slots || day.slots.length === 0) && <p className="text-xs text-muted-foreground text-center py-2">Chiuso</p>}
                        {(day.slots || []).map((slot, index) => (
                             <div key={index} className="grid grid-cols-[1fr_1fr_auto] items-center gap-2">
                                <select value={slot.start} onChange={(e) => handleSlotChange(day.key, index, 'start', e.target.value)} className="w-full h-8 px-2 border rounded-md text-xs bg-card">
                                    {timeOptions}
                                </select>
                                <select value={slot.end} onChange={(e) => handleSlotChange(day.key, index, 'end', e.target.value)} className="w-full h-8 px-2 border rounded-md text-xs bg-card">
                                    {endTimeOptions(slot.start)}
                                </select>
                                <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => handleRemoveSlot(day.key, index)}>
                                    <Trash className="h-4 w-4"/>
                                </Button>
                            </div>
                        ))}
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
                        <Button variant="outline" size="icon" onClick={handleSave} className="border-primary text-primary hover:bg-primary/10">
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
    sessions: Session[];
    onSave: (team: Team, sessions: Session[]) => void;
    onCancel: () => void;
}
function TeamEditForm({ team, sessions, onSave, onCancel }: TeamEditFormProps) {
    const [teamData, setTeamData] = useState(team);
    const [sessionsData, setSessionsData] = useState(sessions);

    const handleAddSession = () => {
        const newSession: Session = {
            id: `session-${team.id}-${Date.now()}`,
            teamId: team.id,
            duration: 90,
            coachIds: [],
            gymId: null,
            day: null,
            startTime: null
        };
        setSessionsData([...sessionsData, newSession]);
    };

    const handleRemoveSession = (sessionId: string) => {
        setSessionsData(sessionsData.filter(s => s.id !== sessionId));
    };
    
    const handleSessionDurationChange = (sessionId: string, duration: number) => {
         setSessionsData(sessionsData.map(s => s.id === sessionId ? {...s, duration: duration} : s));
    }

    const handleSave = () => {
        onSave(teamData, sessionsData);
    };

    return (
        <div className="p-4 border rounded-lg space-y-4 bg-secondary/30">
            <div className="space-y-2">
                <Label htmlFor={`team-name-${team.id}`}>Nome Squadra</Label>
                <Input id={`team-name-${team.id}`} value={teamData.name} onChange={(e) => setTeamData({ ...teamData, name: e.target.value })} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor={`team-start-${team.id}`}>Inizio Stagione</Label>
                    <Input id={`team-start-${team.id}`} type="date" value={teamData.seasonStartDate} onChange={(e) => setTeamData({ ...teamData, seasonStartDate: e.target.value })} />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor={`team-end-${team.id}`}>Fine Stagione</Label>
                    <Input id={`team-end-${team.id}`} type="date" value={teamData.seasonEndDate} onChange={(e) => setTeamData({ ...teamData, seasonEndDate: e.target.value })} />
                </div>
            </div>

            <Separator />

            <div className="space-y-3">
                 <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-sm">Sessioni di Allenamento</h4>
                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleAddSession}>
                        <Plus className="h-4 w-4"/>
                    </Button>
                </div>
                {sessionsData.map((session, index) => (
                    <div key={session.id} className="grid grid-cols-[1fr_auto] items-center gap-2 p-2 border rounded-md">
                         <div className="flex items-center gap-2">
                            <Label htmlFor={`session-duration-${session.id}`} className="text-xs">
                                Sessione {index + 1} (min)
                            </Label>
                            <Input 
                                id={`session-duration-${session.id}`} 
                                type="number" 
                                min="30" 
                                step="15" 
                                value={session.duration}
                                onChange={(e) => handleSessionDurationChange(session.id, parseInt(e.target.value, 10) || 30)}
                                className="h-8 w-24"
                             />
                        </div>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => handleRemoveSession(session.id)}>
                            <Trash className="h-4 w-4"/>
                        </Button>
                    </div>
                ))}
                 {sessionsData.length === 0 && <p className="text-xs text-muted-foreground text-center py-2">Nessuna sessione definita.</p>}
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
                        <Button variant="outline" size="icon" onClick={handleSave} className="border-primary text-primary hover:bg-primary/10">
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

// --- Coach Edit Form ---
interface CoachEditFormProps {
    coach: Coach;
    onSave: (coach: Coach) => void;
    onCancel: () => void;
}
function CoachEditForm({ coach, onSave, onCancel }: CoachEditFormProps) {
    const [name, setName] = useState(coach.name);

    return (
         <div className="p-4 border rounded-lg space-y-4 bg-secondary/30">
            <div className="space-y-2">
                <Label htmlFor={`coach-name-${coach.id}`}>Nome Coach</Label>
                <Input id={`coach-name-${coach.id}`} value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2 mt-4">
                 <Button variant="ghost" size="icon" onClick={onCancel}><X className="h-5 w-5"/></Button>
                 <Button variant="outline" size="icon" onClick={() => onSave({...coach, name})} className="border-primary text-primary hover:bg-primary/10">
                    <Check className="h-5 w-5"/>
                 </Button>
            </div>
        </div>
    )
}

    

    
