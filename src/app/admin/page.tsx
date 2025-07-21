
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Building2, PlusCircle, Users, Trash2, Edit, Save, X, Calendar as CalendarIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import type { Gym, Team } from "@/lib/teamup";
import { addGym, getGyms, updateGym, deleteGym, addTeam, getTeams, updateTeam, deleteTeam } from "@/lib/firebase/firestore";
import { useToast } from "@/hooks/use-toast";

const getDefaultDates = () => {
    const today = new Date();
    const septemberFirst = new Date(today.getFullYear(), 8, 1);
    const mayThirtyFirst = new Date(today.getFullYear() + 1, 4, 31);
    
    if (today > mayThirtyFirst) {
        septemberFirst.setFullYear(today.getFullYear());
        mayThirtyFirst.setFullYear(today.getFullYear() + 1);
    } else if (today < septemberFirst && today.getMonth() < 8) {
         septemberFirst.setFullYear(today.getFullYear() - 1);
         mayThirtyFirst.setFullYear(today.getFullYear());
    }

    return {
        startDate: septemberFirst.toISOString().split('T')[0],
        endDate: mayThirtyFirst.toISOString().split('T')[0]
    };
}

const formatDateForInput = (dateString: string | undefined): string => {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
    } catch (e) {
        return '';
    }
}


export default function AdminPage() {
    const { toast } = useToast();
    const [gyms, setGyms] = useState<Gym[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);

    const [editingGymId, setEditingGymId] = useState<string | null>(null);
    const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
    
    const [editingGymName, setEditingGymName] = useState("");
    const [editingTeamState, setEditingTeamState] = useState<Partial<Team>>({});

    const [newGymName, setNewGymName] = useState("");
    const [newTeamName, setNewTeamName] = useState("");
    const [newSessionsPerWeek, setNewSessionsPerWeek] = useState<number>(2);
    const [newSessionDuration, setNewSessionDuration] = useState<number>(60);
    const [newSeasonStartDate, setNewSeasonStartDate] = useState(getDefaultDates().startDate);
    const [newSeasonEndDate, setNewSeasonEndDate] = useState(getDefaultDates().endDate);
    
    const fetchData = useCallback(async () => {
        try {
            const gymsData = await getGyms();
            const teamsData = await getTeams();
            setGyms(gymsData);
            setTeams(teamsData);
        } catch(error) {
            console.error("Error fetching data: ", error);
            toast({ title: "Errore", description: "Impossibile caricare i dati.", variant: "destructive" });
        }
    }, [toast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleAddGym = async () => {
        if (!newGymName.trim()) {
            toast({ title: "Errore", description: "Il nome della palestra non può essere vuoto.", variant: "destructive" });
            return;
        }
        try {
            await addGym({ name: newGymName });
            setNewGymName("");
            toast({ title: "Successo", description: "Palestra aggiunta." });
            fetchData();
        } catch (error) {
            console.error("Error adding gym: ", error);
            toast({ title: "Errore", description: "Impossibile aggiungere la palestra.", variant: "destructive" });
        }
    };

    const startEditingGym = (gym: Gym) => {
        setEditingGymId(gym.id);
        setEditingGymName(gym.name);
    }

    const cancelEditingGym = () => {
        setEditingGymId(null);
        setEditingGymName("");
    }

    const handleUpdateGym = async (gymId: string) => {
        if (!editingGymName.trim()) {
            toast({ title: "Errore", description: "Il nome della palestra non può essere vuoto.", variant: "destructive" });
            return;
        }
        await updateGym(gymId, { name: editingGymName });
        cancelEditingGym();
        toast({ title: "Successo", description: "Palestra aggiornata." });
        fetchData();
    };

    const handleDeleteGym = async (id: string) => {
        await deleteGym(id);
        toast({ title: "Successo", description: "Palestra eliminata." });
        fetchData();
    };
    
    const handleAddTeam = async () => {
        if (!newTeamName.trim()) {
            toast({ title: "Errore", description: "Il nome della squadra non può essere vuoto.", variant: "destructive" });
            return;
        }
        if(!newSeasonStartDate || !newSeasonEndDate) {
            toast({ title: "Errore", description: "Le date di inizio e fine stagione sono obbligatorie.", variant: "destructive" });
            return;
        }
        try {
            await addTeam({ 
                name: newTeamName, 
                sessionsPerWeek: newSessionsPerWeek || 0, 
                sessionDuration: newSessionDuration || 0,
                seasonStartDate: newSeasonStartDate,
                seasonEndDate: newSeasonEndDate,
            });
            setNewTeamName("");
            setNewSessionsPerWeek(2);
            setNewSessionDuration(60);
            setNewSeasonStartDate(getDefaultDates().startDate);
            setNewSeasonEndDate(getDefaultDates().endDate);
            toast({ title: "Successo", description: "Squadra aggiunta." });
            fetchData();
        } catch (error) {
            console.error("Error adding team: ", error);
            toast({ title: "Errore", description: "Impossibile aggiungere la squadra.", variant: "destructive" });
        }
    };

    const startEditingTeam = (team: Team) => {
        setEditingTeamId(team.id);
        setEditingTeamState({
            ...team,
            seasonStartDate: formatDateForInput(team.seasonStartDate),
            seasonEndDate: formatDateForInput(team.seasonEndDate)
        });
    }

    const cancelEditingTeam = () => {
        setEditingTeamId(null);
        setEditingTeamState({});
    }

    const handleUpdateTeam = async () => {
        if (!editingTeamId || !editingTeamState.name?.trim()) {
             toast({ title: "Errore", description: "Il nome della squadra non può essere vuoto.", variant: "destructive" });
            return;
        }
         if(!editingTeamState.seasonStartDate || !editingTeamState.seasonEndDate) {
            toast({ title: "Errore", description: "Le date di inizio e fine stagione sono obbligatorie.", variant: "destructive" });
            return;
        }
        
        const { id, ...teamDataToUpdate } = editingTeamState;
        await updateTeam(editingTeamId, teamDataToUpdate);

        cancelEditingTeam();
        toast({ title: "Successo", description: "Squadra aggiornata." });
        fetchData();
    };

    const handleDeleteTeam = async (id: string) => {
        await deleteTeam(id);
        toast({ title: "Successo", description: "Squadra eliminata." });
        fetchData();
    };

    const handleEditingTeamStateChange = (field: keyof Omit<Team, 'id'>, value: string | number) => {
        setEditingTeamState(s => ({...s, [field]: value}));
    }

  return (
    <div className="min-h-screen bg-background">
       <header className="flex items-center justify-between p-4 border-b bg-card">
         <h1 className="text-xl font-bold text-primary">
            Admin Panel
         </h1>
         <Link href="/">
           <Button variant="outline">Torna allo Scheduler</Button>
         </Link>
       </header>

       <main className="p-4 md:p-8 grid gap-8 md:grid-cols-2">
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Building2 className="text-primary"/>
                    Gestione Palestre
                </CardTitle>
                <CardDescription>
                    Aggiungi, modifica o elimina le palestre.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <h3 className="font-semibold mb-2">Palestre Esistenti</h3>
                    <ul className="space-y-2 text-sm">
                        {gyms.map(gym => (
                            <li key={gym.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
                                {editingGymId === gym.id ? (
                                    <Input 
                                        value={editingGymName}
                                        onChange={(e) => setEditingGymName(e.target.value)}
                                        className="flex-grow mr-2"
                                    />
                                ) : (
                                    <span className="text-muted-foreground">{gym.name}</span>
                                )}
                                <div className="flex items-center gap-2">
                                     {editingGymId === gym.id ? (
                                        <>
                                            <Button size="icon" variant="ghost" onClick={() => handleUpdateGym(gym.id)}><Save className="h-4 w-4 text-green-500" /></Button>
                                            <Button size="icon" variant="ghost" onClick={cancelEditingGym}><X className="h-4 w-4 text-red-500" /></Button>
                                        </>
                                     ) : (
                                        <>
                                            <Button size="icon" variant="ghost" onClick={() => startEditingGym(gym)}><Edit className="h-4 w-4 text-primary" /></Button>
                                            <Button size="icon" variant="ghost" onClick={() => handleDeleteGym(gym.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                        </>
                                     )}
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
                <Separator />
                <div className="space-y-2">
                    <h3 className="font-semibold">Aggiungi Nuova Palestra</h3>
                    <Label htmlFor="gymName">Nome Palestra</Label>
                    <Input id="gymName" placeholder="Es. Palestra Ovest" value={newGymName} onChange={(e) => setNewGymName(e.target.value)} />
                    <Button className="mt-2 w-full bg-accent hover:bg-accent/90" onClick={handleAddGym}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Aggiungi Palestra
                    </Button>
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Users className="text-primary"/>
                    Gestione Squadre
                </CardTitle>
                <CardDescription>
                    Definisci le squadre e i loro allenamenti.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div>
                    <h3 className="font-semibold mb-2">Squadre Esistenti</h3>
                    <ul className="space-y-2 text-sm">
                        {teams.map(team => (
                           <li key={team.id} className="flex flex-col p-2 rounded-md hover:bg-muted/50 space-y-2">
                                <div className="flex items-center justify-between">
                                    {editingTeamId === team.id ? (
                                        <Input 
                                            value={editingTeamState.name || ''}
                                            onChange={(e) => handleEditingTeamStateChange('name', e.target.value)}
                                            className="flex-grow mr-2"
                                        />
                                    ) : (
                                       <span className="text-muted-foreground font-semibold">{team.name}</span>
                                    )}
                                    <div className="flex items-center gap-2">
                                        {editingTeamId === team.id ? (
                                             <>
                                                <Button size="icon" variant="ghost" onClick={handleUpdateTeam}><Save className="h-4 w-4 text-green-500" /></Button>
                                                <Button size="icon" variant="ghost" onClick={cancelEditingTeam}><X className="h-4 w-4 text-red-500" /></Button>
                                            </>
                                        ) : (
                                            <>
                                                <Button size="icon" variant="ghost" onClick={() => startEditingTeam(team)}><Edit className="h-4 w-4 text-primary" /></Button>
                                                <Button size="icon" variant="ghost" onClick={() => handleDeleteTeam(team.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <div className="text-muted-foreground text-xs flex items-center gap-4">
                                    <span>{team.sessionsPerWeek} x {team.sessionDuration}min</span>
                                    {team.seasonStartDate && team.seasonEndDate && (
                                    <span className="flex items-center gap-1">
                                        <CalendarIcon className="h-3 w-3" />
                                        {new Date(team.seasonStartDate).toLocaleDateString()} - {new Date(team.seasonEndDate).toLocaleDateString()}
                                    </span>
                                    )}
                                </div>

                                {editingTeamId === team.id && (
                                     <div className="grid grid-cols-2 gap-4 mt-2">
                                        <div>
                                            <Label htmlFor={`sessions-${team.id}`}>Allenamenti/sett.</Label>
                                            <Input id={`sessions-${team.id}`} type="number" value={editingTeamState.sessionsPerWeek} onChange={(e) => handleEditingTeamStateChange('sessionsPerWeek', parseInt(e.target.value) || 0)} />
                                        </div>
                                        <div>
                                            <Label htmlFor={`duration-${team.id}`}>Durata (min)</Label>
                                            <Input id={`duration-${team.id}`} type="number" value={editingTeamState.sessionDuration} onChange={(e) => handleEditingTeamStateChange('sessionDuration', parseInt(e.target.value) || 0)} />
                                        </div>
                                        <div>
                                           <Label htmlFor={`start-date-${team.id}`}>Inizio Stagione</Label>
                                           <Input id={`start-date-${team.id}`} type="date" value={editingTeamState.seasonStartDate} onChange={(e) => handleEditingTeamStateChange('seasonStartDate', e.target.value)} />
                                        </div>
                                        <div>
                                            <Label htmlFor={`end-date-${team.id}`}>Fine Stagione</Label>
                                            <Input id={`end-date-${team.id}`} type="date" value={editingTeamState.seasonEndDate} onChange={(e) => handleEditingTeamStateChange('seasonEndDate', e.target.value)} />
                                        </div>
                                    </div>
                                )}
                           </li>
                        ))}
                    </ul>
                </div>
                <Separator />
                <div className="space-y-2">
                    <h3 className="font-semibold">Aggiungi Nuova Squadra</h3>
                    <div className="space-y-2">
                        <Label htmlFor="teamName">Nome Squadra</Label>
                        <Input id="teamName" placeholder="Es. Delfini U10" value={newTeamName} onChange={(e) => setNewTeamName(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="sessionsPerWeek">Allenamenti/settimana</Label>
                            <Input id="sessionsPerWeek" type="number" placeholder="2" value={newSessionsPerWeek} onChange={(e) => setNewSessionsPerWeek(parseInt(e.target.value) || 0)}/>
                        </div>
                        <div>
                            <Label htmlFor="sessionDuration">Durata (min)</Label>
                            <Input id="sessionDuration" type="number" placeholder="60" value={newSessionDuration} onChange={(e) => setNewSessionDuration(parseInt(e.target.value) || 0)}/>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                         <div>
                            <Label htmlFor="newSeasonStartDate">Inizio Stagione</Label>
                            <Input id="newSeasonStartDate" type="date" value={newSeasonStartDate} onChange={(e) => setNewSeasonStartDate(e.target.value)} />
                        </div>
                        <div>
                            <Label htmlFor="newSeasonEndDate">Fine Stagione</Label>
                            <Input id="newSeasonEndDate" type="date" value={newSeasonEndDate} onChange={(e) => setNewSeasonEndDate(e.target.value)} />
                        </div>
                    </div>
                     <Button className="mt-2 w-full bg-accent hover:bg-accent/90" onClick={handleAddTeam}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Aggiungi Squadra
                    </Button>
                </div>
            </CardContent>
        </Card>
       </main>
    </div>
  )
}
