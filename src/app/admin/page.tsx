
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Building2, PlusCircle, Users } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

// In a real app, you'd manage this state globally (e.g., with Context or Zustand)
// For simplicity, we'll just show a message.

export default function AdminPage() {
    const [newGymName, setNewGymName] = useState("");
    const [newTeamName, setNewTeamName] = useState("");

    const handleAction = () => {
        alert("La gestione dei dati in questa pagina è disabilitata per utilizzare i dati di esempio in memoria.");
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
                    Aggiungi, modifica o elimina le palestre. (Funzionalità disabilitata)
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <h3 className="font-semibold mb-2">Palestre Esistenti</h3>
                    <p className="text-sm text-muted-foreground">I dati sono gestiti in memoria nella pagina Scheduler.</p>
                </div>
                <Separator />
                <div className="space-y-2">
                    <h3 className="font-semibold">Aggiungi Nuova Palestra</h3>
                    <Label htmlFor="gymName">Nome Palestra</Label>
                    <Input id="gymName" placeholder="Es. Palestra Ovest" value={newGymName} onChange={(e) => setNewGymName(e.target.value)} />
                    <Button className="mt-2 w-full bg-accent hover:bg-accent/90" onClick={handleAction}>
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
                    Definisci le squadre e i loro allenamenti. (Funzionalità disabilitata)
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div>
                    <h3 className="font-semibold mb-2">Squadre Esistenti</h3>
                     <p className="text-sm text-muted-foreground">I dati sono gestiti in memoria nella pagina Scheduler.</p>
                </div>
                <Separator />
                <div className="space-y-2">
                    <h3 className="font-semibold">Aggiungi Nuova Squadra</h3>
                    <div className="space-y-2">
                        <Label htmlFor="teamName">Nome Squadra</Label>
                        <Input id="teamName" placeholder="Es. Delfini U10" value={newTeamName} onChange={(e) => setNewTeamName(e.target.value)} />
                    </div>
                     <Button className="mt-2 w-full bg-accent hover:bg-accent/90" onClick={handleAction}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Aggiungi Squadra
                    </Button>
                </div>
            </CardContent>
        </Card>
       </main>
    </div>
  )
}
