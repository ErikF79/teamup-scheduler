
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Building2, PlusCircle, Users, Trash2, Edit, Save, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { Gym, Team } from "@/lib/teamup";
import { addGym, getGyms, updateGym, deleteGym, addTeam, getTeams, updateTeam, deleteTeam } from "@/lib/firebase/firestore";
import { useToast } from "@/hooks/use-toast";

export default function AdminPage() {
    const { toast } = useToast();
    const [gyms, setGyms] = useState<Gym[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);

    const [editingGymId, setEditingGymId] = useState<string | null>(null);
    const [editingTeamId, setEditingTeamId] = useState<string | null>(null);

    const [newGymName, setNewGymName] = useState("");
    const [newTeamName, setNewTeamName] = useState("");
    const [newSessionsPerWeek, setNewSessionsPerWeek] = useState<number>(2);
    const [newSessionDuration, setNewSessionDuration] = useState<number>(60);
    
    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        const gymsData = await getGyms();
        const teamsData = await getTeams();
        setGyms(gymsData);
        setTeams(teamsData);
    };

    const handleAddGym = async () => {
        if (!newGymName.trim()) {
            toast({ title: "Errore", description: "Il nome della palestra non può essere vuoto.", variant: "destructive" });
            return;
        }
        await addGym({ name: newGymName });
        setNewGymName("");
        toast({ title: "Successo", description: "Palestra aggiunta." });
        fetchData();
    };

    const handleUpdateGym = async (gym: Gym) => {
        if (!gym.name.trim()) {
            toast({ title: "Errore", description: "Il nome della palestra non può essere vuoto.", variant: "destructive" });
            return;
        }
        await updateGym(gym.id, { name: gym.name });
        setEditingGymId(null);
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
        await addTeam({ 
            name: newTeamName, 
            sessionsPerWeek: newSessionsPerWeek, 
            sessionDuration: newSessionDuration 
        });
        setNewTeamName("");
        setNewSessionsPerWeek(2);
        setNewSessionDuration(60);
        toast({ title: "Successo", description: "Squadra aggiunta." });
        fetchData();
    };

    const handleUpdateTeam = async (team: Team) => {
        if (!team.name.trim()) {
             toast({ title: "Errore", description: "Il nome della squadra non può essere vuoto.", variant: "destructive" });
            return;
        }
        await updateTeam(team.id, { 
            name: team.name, 
            sessionsPerWeek: team.sessionsPerWeek, 
            sessionDuration: team.sessionDuration 
        });
        setEditingTeamId(null);
        toast({ title: "Successo", description: "Squadra aggiornata." });
        fetchData();
    };

    const handleDeleteTeam = async (id: string) => {
        await deleteTeam(id);
        toast({ title: "Successo", description: "Squadra eliminata." });
        fetchData();
    };

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
                                        value={gym.name}
                                        onChange={(e) => setGyms(gyms.map(g => g.id === gym.id ? {...g, name: e.target.value} : g))}
                                        className="flex-grow mr-2"
                                    />
                                ) : (
                                    <span className="text-muted-foreground">{gym.name}</span>
                                )}
                                <div className="flex items-center gap-2">
                                     {editingGymId === gym.id ? (
                                        <>
                                            <Button size="icon" variant="ghost" onClick={() => handleUpdateGym(gym)}><Save className="h-4 w-4 text-green-500" /></Button>
                                            <Button size="icon" variant="ghost" onClick={() => { setEditingGymId(null); fetchData(); }}><X className="h-4 w-4 text-red-500" /></Button>
                                        </>
                                     ) : (
                                        <>
                                            <Button size="icon" variant="ghost" onClick={() => setEditingGymId(gym.id)}><Edit className="h-4 w-4 text-primary" /></Button>
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
                           <li key={team.id} className="flex flex-col p-2 rounded-md hover:bg-muted/50">
                                <div className="flex items-center justify-between">
                                    {editingTeamId === team.id ? (
                                        <Input 
                                            value={team.name}
                                            onChange={(e) => setTeams(teams.map(t => t.id === team.id ? {...t, name: e.target.value} : t))}
                                            className="flex-grow mr-2"
                                        />
                                    ) : (
                                       <span className="text-muted-foreground">{team.name} ({team.sessionsPerWeek} x {team.sessionDuration}min)</span>
                                    )}
                                    <div className="flex items-center gap-2">
                                        {editingTeamId === team.id ? (
                                             <>
                                                <Button size="icon" variant="ghost" onClick={() => handleUpdateTeam(team)}><Save className="h-4 w-4 text-green-500" /></Button>
                                                <Button size="icon" variant="ghost" onClick={() => { setEditingTeamId(null); fetchData(); }}><X className="h-4 w-4 text-red-500" /></Button>
                                            </>
                                        ) : (
                                            <>
                                                <Button size="icon" variant="ghost" onClick={() => setEditingTeamId(team.id)}><Edit className="h-4 w-4 text-primary" /></Button>
                                                <Button size="icon" variant="ghost" onClick={() => handleDeleteTeam(team.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                            </>
                                        )}
                                    </div>
                                </div>
                                {editingTeamId === team.id && (
                                     <div className="grid grid-cols-2 gap-4 mt-2">
                                        <div>
                                            <Label htmlFor={`sessions-${team.id}`}>Allenamenti/sett.</Label>
                                            <Input id={`sessions-${team.id}`} type="number" value={team.sessionsPerWeek} onChange={(e) => setTeams(teams.map(t => t.id === team.id ? {...t, sessionsPerWeek: parseInt(e.target.value)} : t))} />
                                        </div>
                                        <div>
                                            <Label htmlFor={`duration-${team.id}`}>Durata (min)</Label>
                                            <Input id={`duration-${team.id}`} type="number" value={team.sessionDuration} onChange={(e) => setTeams(teams.map(t => t.id === team.id ? {...t, sessionDuration: parseInt(e.target.value)} : t))} />
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
                    <Label htmlFor="teamName">Nome Squadra</Label>
                    <Input id="teamName" placeholder="Es. Delfini U10" value={newTeamName} onChange={(e) => setNewTeamName(e.target.value)} />
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
