import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Building2, PlusCircle, Users } from "lucide-react";
import Link from "next/link";

export default function AdminPage() {
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
                    Aggiungi o modifica le palestre e le loro fasce orarie disponibili.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <h3 className="font-semibold mb-2">Palestre Esistenti</h3>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                        <li>Palestra Nord</li>
                        <li>Palestra Sud</li>
                        <li>Palestra Est</li>
                    </ul>
                </div>
                <Separator />
                <div className="space-y-2">
                    <h3 className="font-semibold">Aggiungi Nuova Palestra</h3>
                    <Label htmlFor="gymName">Nome Palestra</Label>
                    <Input id="gymName" placeholder="Es. Palestra Ovest" />
                    <Label htmlFor="timeSlots">Fasce Orarie</Label>
                    <Input id="timeSlots" placeholder="Es. Lun 17:00-22:00, Mar 18:00-21:00" />
                    <Button className="mt-2 w-full bg-accent hover:bg-accent/90">
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
                    Definisci le squadre, il numero e la durata degli allenamenti settimanali.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div>
                    <h3 className="font-semibold mb-2">Squadre Esistenti</h3>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                        <li>Aquile U18 (2 x 90min)</li>
                        <li>Falchi U16 (3 x 75min)</li>
                        <li>Leoni U14 (2 x 60min)</li>
                        <li>Tigri U12 (2 x 60min)</li>
                    </ul>
                </div>
                <Separator />
                <div className="space-y-2">
                    <h3 className="font-semibold">Aggiungi Nuova Squadra</h3>
                    <Label htmlFor="teamName">Nome Squadra</Label>
                    <Input id="teamName" placeholder="Es. Delfini U10" />
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="sessionsPerWeek">Allenamenti/settimana</Label>
                            <Input id="sessionsPerWeek" type="number" placeholder="2" />
                        </div>
                        <div>
                            <Label htmlFor="sessionDuration">Durata (min)</Label>
                            <Input id="sessionDuration" type="number" placeholder="60" />
                        </div>
                    </div>
                     <Button className="mt-2 w-full bg-accent hover:bg-accent/90">
                        <PlusCircle className="mr-2 h-4 w-4" /> Aggiungi Squadra
                    </Button>
                </div>
            </CardContent>
        </Card>
       </main>
    </div>
  )
}
