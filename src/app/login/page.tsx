"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { AppData, UserData, initialData } from "@/lib/teamup";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CalendarDays, ShieldCheck, WifiOff, Building2, Users, UserCheck } from "lucide-react";

export default function LoginPage() {
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [registerUsername, setRegisterUsername] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const router = useRouter();
  const { toast } = useToast();

  const getAppData = (): AppData => {
    if (typeof window !== "undefined") {
      const data = localStorage.getItem("teamup_data");
      if (data) {
        try {
          const parsedData = JSON.parse(data);
          if (
            parsedData &&
            typeof parsedData.users === "object" &&
            typeof parsedData.userData === "object"
          ) {
            return parsedData;
          }
        } catch (e) {
          console.error("Failed to parse AppData from localStorage", e);
        }
      }
    }
    return { users: {}, userData: {} };
  };

  const saveAppData = (data: AppData) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("teamup_data", JSON.stringify(data));
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const appData = getAppData();
    if (
      appData.users &&
      appData.users[loginUsername] &&
      appData.users[loginUsername] === loginPassword
    ) {
      if (typeof window !== "undefined") {
        localStorage.setItem("teamup_active_user", loginUsername);
      }
      toast({
        title: "Accesso eseguito",
        description: `Bentornato, ${loginUsername}!`,
      });
      router.push("/scheduler");
    } else {
      toast({
        title: "Errore di accesso",
        description: "Nome utente o password non corretti.",
        variant: "destructive",
      });
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerUsername.trim() || !registerPassword.trim()) {
      toast({
        title: "Errore di registrazione",
        description: "Nome utente e password non possono essere vuoti.",
        variant: "destructive",
      });
      return;
    }

    const appData = getAppData();
    if (appData.users && appData.users[registerUsername]) {
      toast({
        title: "Errore di registrazione",
        description: "Questo nome utente è già stato registrato.",
        variant: "destructive",
      });
    } else {
      if (!appData.users) appData.users = {};
      if (!appData.userData) appData.userData = {};

      appData.users[registerUsername] = registerPassword;
      appData.userData[registerUsername] = {
        configurations: [initialData],
        activeConfigurationId: initialData.id,
      };
      saveAppData(appData);
      toast({
        title: "Registrazione completata",
        description: "Ora puoi effettuare l'accesso con le tue credenziali.",
      });
    }
  };

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      {/* Branding panel */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-primary via-primary to-primary/70 p-12 text-primary-foreground lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
            <CalendarDays className="h-6 w-6" />
          </span>
          <span className="text-lg font-bold tracking-tight">TeamUp Scheduler</span>
        </div>
        <div className="relative z-10 max-w-md space-y-6">
          <h1 className="text-4xl font-bold leading-tight">
            Pianifica l&apos;intera stagione in pochi minuti.
          </h1>
          <p className="text-primary-foreground/80">
            Gestisci palestre, squadre e coach e assegna gli allenamenti con un
            calendario visuale. Tutto in locale, anche offline.
          </p>
          <ul className="space-y-3 text-sm">
            <li className="flex items-center gap-3">
              <Building2 className="h-5 w-5 shrink-0 opacity-90" />
              Disponibilità delle palestre per fascia oraria
            </li>
            <li className="flex items-center gap-3">
              <Users className="h-5 w-5 shrink-0 opacity-90" />
              Squadre, durate e sessioni settimanali
            </li>
            <li className="flex items-center gap-3">
              <UserCheck className="h-5 w-5 shrink-0 opacity-90" />
              Assegnazione dei coach senza conflitti
            </li>
          </ul>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-primary-foreground/80">
          <span className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" /> Dati al 100% locali
          </span>
          <span className="flex items-center gap-2">
            <WifiOff className="h-4 w-4" /> Funziona offline
          </span>
        </div>
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -top-16 right-10 h-56 w-56 rounded-full bg-black/10 blur-3xl" />
      </div>

      {/* Form panel */}
      <div className="app-gradient flex items-center justify-center p-5 sm:p-8">
        <div className="w-full max-w-md space-y-6">
          <div className="flex flex-col items-center gap-3 text-center lg:hidden">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-md">
              <CalendarDays className="h-7 w-7" />
            </span>
            <h1 className="text-2xl font-bold text-foreground">
              TeamUp Scheduler
            </h1>
          </div>

          <Alert className="border-amber-300/60 bg-amber-50 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Nota sulla sicurezza</AlertTitle>
            <AlertDescription>
              Il login serve solo a separare i dati tra utenti sulla stessa
              macchina. Le password sono salvate in chiaro: non usarne di
              importanti.
            </AlertDescription>
          </Alert>

          <Tabs defaultValue="login">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Accedi</TabsTrigger>
              <TabsTrigger value="register">Registrati</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin}>
                <Card className="border-border/70 shadow-sm">
                  <CardHeader>
                    <CardTitle>Bentornato</CardTitle>
                    <CardDescription>
                      Accedi al tuo planner per continuare.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-username">Nome utente</Label>
                      <Input
                        id="login-username"
                        autoComplete="username"
                        value={loginUsername}
                        onChange={(e) => setLoginUsername(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password">Password</Label>
                      <Input
                        id="login-password"
                        type="password"
                        autoComplete="current-password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        required
                      />
                    </div>
                    <Button className="w-full" type="submit">
                      Accedi
                    </Button>
                  </CardContent>
                </Card>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={handleRegister}>
                <Card className="border-border/70 shadow-sm">
                  <CardHeader>
                    <CardTitle>Crea un account</CardTitle>
                    <CardDescription>
                      Crea un nuovo profilo per salvare le tue configurazioni.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="register-username">Nome utente</Label>
                      <Input
                        id="register-username"
                        autoComplete="username"
                        value={registerUsername}
                        onChange={(e) => setRegisterUsername(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-password">Password</Label>
                      <Input
                        id="register-password"
                        type="password"
                        autoComplete="new-password"
                        value={registerPassword}
                        onChange={(e) => setRegisterPassword(e.target.value)}
                        required
                      />
                    </div>
                    <Button className="w-full" type="submit">
                      Registra nuovo utente
                    </Button>
                  </CardContent>
                </Card>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
