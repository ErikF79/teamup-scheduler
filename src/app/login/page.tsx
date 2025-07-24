
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { AppData, UserData, initialData } from "@/lib/teamup";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default function LoginPage() {
    const [loginUsername, setLoginUsername] = useState("");
    const [loginPassword, setLoginPassword] = useState("");
    const [registerUsername, setRegisterUsername] = useState("");
    const [registerPassword, setRegisterPassword] = useState("");
    const router = useRouter();
    const { toast } = useToast();

    const getAppData = (): AppData => {
        if (typeof window !== 'undefined') {
            const data = localStorage.getItem('teamup_data');
            return data ? JSON.parse(data) : { users: {}, userData: {} };
        }
        return { users: {}, userData: {} };
    };

    const saveAppData = (data: AppData) => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('teamup_data', JSON.stringify(data));
        }
    };

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        const appData = getAppData();
        if (appData.users[loginUsername] && appData.users[loginUsername] === loginPassword) {
            if (typeof window !== 'undefined') {
                localStorage.setItem('teamup_active_user', loginUsername);
            }
            toast({ title: "Accesso Eseguito", description: `Bentornato, ${loginUsername}!` });
            router.push('/scheduler');
        } else {
            toast({ title: "Errore di Accesso", description: "Nome utente o password non corretti.", variant: "destructive" });
        }
    };

    const handleRegister = (e: React.FormEvent) => {
        e.preventDefault();
        if (!registerUsername.trim() || !registerPassword.trim()) {
            toast({ title: "Errore di Registrazione", description: "Nome utente e password non possono essere vuoti.", variant: "destructive" });
            return;
        }

        const appData = getAppData();
        if (appData.users[registerUsername]) {
            toast({ title: "Errore di Registrazione", description: "Questo nome utente è già stato registrato.", variant: "destructive" });
        } else {
            appData.users[registerUsername] = registerPassword;
            appData.userData[registerUsername] = {
                configurations: [initialData],
                activeConfigurationId: initialData.id,
            };
            saveAppData(appData);
            toast({ title: "Registrazione Completata", description: "Ora puoi effettuare l'accesso con le tue credenziali." });
            // Optionally, switch to login tab
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-background">
            <div className="flex flex-col gap-4 items-center">
                 <h1 className="text-3xl font-bold text-primary mb-4">TeamUp Scheduler</h1>
                 <Alert variant="destructive" className="max-w-md">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Attenzione: Sicurezza</AlertTitle>
                    <AlertDescription>
                        Questo sistema di login non è sicuro. Le password sono salvate in chiaro e serve solo a separare i dati tra diversi utenti sulla stessa macchina. Non usare password importanti.
                    </AlertDescription>
                </Alert>
                <Tabs defaultValue="login" className="w-[400px]">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="login">Accedi</TabsTrigger>
                        <TabsTrigger value="register">Registrati</TabsTrigger>
                    </TabsList>
                    <TabsContent value="login">
                        <form onSubmit={handleLogin}>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Login</CardTitle>
                                    <CardDescription>Accedi al tuo planner per continuare.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="login-username">Nome Utente</Label>
                                        <Input id="login-username" value={loginUsername} onChange={(e) => setLoginUsername(e.target.value)} required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="login-password">Password</Label>
                                        <Input id="login-password" type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required />
                                    </div>
                                </CardContent>
                                <CardFooter>
                                    <Button className="w-full border-red-800 text-blue-800 hover:bg-red-50 hover:text-blue-900" variant="outline" type="submit">Accedi</Button>
                                </CardFooter>
                            </Card>
                        </form>
                    </TabsContent>
                    <TabsContent value="register">
                        <form onSubmit={handleRegister}>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Registrati</CardTitle>
                                    <CardDescription>Crea un nuovo account per salvare le tue configurazioni.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                     <div className="space-y-2">
                                        <Label htmlFor="register-username">Nome Utente</Label>
                                        <Input id="register-username" value={registerUsername} onChange={(e) => setRegisterUsername(e.target.value)} required/>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="register-password">Password</Label>
                                        <Input id="register-password" type="password" value={registerPassword} onChange={(e) => setRegisterPassword(e.target.value)} required/>
                                    </div>
                                </CardContent>
                                <CardFooter>
                                    <Button className="w-full border-red-800 text-blue-800 hover:bg-red-50 hover:text-blue-900" variant="outline" type="submit">Registra Nuovo Utente</Button>
                                </CardFooter>
                            </Card>
                        </form>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
