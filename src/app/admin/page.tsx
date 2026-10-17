"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Building2,
  PlusCircle,
  Users,
  Download,
  Upload,
  Pencil,
  Trash2,
  X,
  Check,
  Save,
  Edit,
  TrashIcon,
  UserCheck,
  Trash,
  Plus,
} from "lucide-react";
import { Gym, Team, Session, Config, Coach, UserData } from "@/lib/teamup";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { AppShell } from "@/components/teamup/AppShell";
import { TextPromptDialog } from "@/components/teamup/text-prompt-dialog";
import { useTeamUpData } from "@/hooks/use-teamup-data";
type DialogType = "export" | "saveAs" | "rename" | null;

export default function AdminPage() {
  const { userData, activeConfig, ready, updateUserData, updateActiveConfig } =
    useTeamUpData();
  const { toast } = useToast();

  const [editingGymId, setEditingGymId] = useState<string | null>(null);
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [editingCoachId, setEditingCoachId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<DialogType>(null);

  // --- Gym Handlers ---
  const handleAddGym = () => {
    if (!activeConfig) return;
    const newGym: Gym = {
      id: `gym-${Date.now()}`,
      name: "Nuova Palestra",
      availability: [
        { key: 1, name: "Lunedì", slots: [{ start: 17 * 60, end: 23 * 60 }] },
        { key: 2, name: "Martedì", slots: [{ start: 17 * 60, end: 23 * 60 }] },
        { key: 3, name: "Mercoledì", slots: [{ start: 17 * 60, end: 23 * 60 }] },
        { key: 4, name: "Giovedì", slots: [{ start: 17 * 60, end: 23 * 60 }] },
        { key: 5, name: "Venerdì", slots: [{ start: 17 * 60, end: 23 * 60 }] },
        { key: 6, name: "Sabato", slots: [{ start: 14 * 60, end: 20 * 60 }] },
        { key: 7, name: "Domenica", slots: [{ start: 9 * 60, end: 20 * 60 }] },
      ],
    };
    updateActiveConfig({ gyms: [...activeConfig.gyms, newGym] });
    setEditingGymId(newGym.id);
  };

  const handleUpdateGym = (updatedGym: Gym) => {
    if (!activeConfig) return;
    updateActiveConfig({
      gyms: activeConfig.gyms.map((g) =>
        g.id === updatedGym.id ? updatedGym : g
      ),
    });
    setEditingGymId(null);
  };

  const handleDeleteGym = (gymId: string) => {
    if (!activeConfig) return;
    const newSessions = activeConfig.sessions.map((s) =>
      s.gymId === gymId ? { ...s, gymId: null, day: null, startTime: null } : s
    );
    updateActiveConfig({
      gyms: activeConfig.gyms.filter((g) => g.id !== gymId),
      sessions: newSessions,
    });
  };

  // --- Team Handlers ---
  const handleAddTeam = () => {
    if (!activeConfig) return;
    const newTeamId = `team-${Date.now()}`;
    const newTeam: Team = {
      id: newTeamId,
      name: "Nuova Squadra",
      seasonStartDate: "2025-09-05",
      seasonEndDate: "2026-05-30",
    };
    const newSession: Session = {
      id: `session-${newTeamId}-1`,
      teamId: newTeamId,
      duration: 90,
      coachIds: [],
      gymId: null,
      day: null,
      startTime: null,
    };
    const newTeamColors = {
      ...activeConfig.teamColors,
      [newTeamId]: `hsl(${Math.random() * 360}, 70%, 50%)`,
    };
    updateActiveConfig({
      teams: [...activeConfig.teams, newTeam],
      sessions: [...activeConfig.sessions, newSession],
      teamColors: newTeamColors,
    });
    setEditingTeamId(newTeamId);
  };

  const handleUpdateTeam = (updatedTeam: Team, teamSessions: Session[]) => {
    if (!activeConfig) return;
    const otherTeamsSessions = activeConfig.sessions.filter(
      (s) => s.teamId !== updatedTeam.id
    );
    updateActiveConfig({
      teams: activeConfig.teams.map((t) =>
        t.id === updatedTeam.id ? updatedTeam : t
      ),
      sessions: [...otherTeamsSessions, ...teamSessions],
    });
    setEditingTeamId(null);
  };

  const handleDeleteTeam = (teamId: string) => {
    if (!activeConfig) return;
    const newTeamColors = { ...activeConfig.teamColors };
    delete newTeamColors[teamId];
    updateActiveConfig({
      teams: activeConfig.teams.filter((t) => t.id !== teamId),
      sessions: activeConfig.sessions.filter((s) => s.teamId !== teamId),
      teamColors: newTeamColors,
    });
  };

  // --- Coach Handlers ---
  const handleAddCoach = () => {
    if (!activeConfig) return;
    const newCoach: Coach = { id: `coach-${Date.now()}`, name: "Nuovo Coach" };
    updateActiveConfig({ coaches: [...(activeConfig.coaches || []), newCoach] });
    setEditingCoachId(newCoach.id);
  };

  const handleUpdateCoach = (updatedCoach: Coach) => {
    if (!activeConfig) return;
    updateActiveConfig({
      coaches: (activeConfig.coaches || []).map((c) =>
        c.id === updatedCoach.id ? updatedCoach : c
      ),
    });
    setEditingCoachId(null);
  };

  const handleDeleteCoach = (coachId: string) => {
    if (!activeConfig) return;
    const newSessions = activeConfig.sessions.map((s) => ({
      ...s,
      coachIds: s.coachIds.filter((id) => id !== coachId),
    }));
    updateActiveConfig({
      coaches: (activeConfig.coaches || []).filter((c) => c.id !== coachId),
      sessions: newSessions,
    });
  };

  // --- Import/Export Handlers ---
  const doExport = (fileName: string) => {
    if (!userData || !activeConfig) return;
    const defaultFileName = `teamup_config_${activeConfig.name}_${new Date()
      .toISOString()
      .split("T")[0]}.json`;
    const finalName = fileName.trim()
      ? fileName.endsWith(".json")
        ? fileName
        : `${fileName}.json`
      : defaultFileName;

    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(userData, null, 2)
    )}`;
    const link = document.createElement("a");
    link.href = jsonString;
    link.download = finalName;
    link.click();
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== "string") return;
        const parsedData = JSON.parse(text);

        if (parsedData.configurations && parsedData.activeConfigurationId) {
          updateUserData(parsedData as UserData);
          toast({
            title: "Importazione completata",
            description: "Le configurazioni sono state caricate.",
          });
        } else if (parsedData.gyms && parsedData.teams && parsedData.sessions) {
          const convertedSessions = parsedData.sessions.map((s: any) => {
            const { coachId, ...rest } = s;
            return { ...rest, coachIds: coachId ? [coachId] : [] };
          });
          const newConfig: Config = {
            ...parsedData,
            sessions: convertedSessions,
            id: `config-imported-${Date.now()}`,
            name: "Configurazione Importata",
            coaches: parsedData.coaches || [],
          };
          updateUserData((prev) => ({
            ...prev,
            configurations: [...prev.configurations, newConfig],
            activeConfigurationId: newConfig.id,
          }));
          toast({
            title: "Importazione completata",
            description:
              "La vecchia configurazione è stata importata come nuova.",
          });
        } else {
          toast({
            title: "Errore",
            description: "File JSON non valido o malformato.",
            variant: "destructive",
          });
        }
      } catch (error) {
        toast({
          title: "Errore",
          description: "Errore nel parsing del file JSON.",
          variant: "destructive",
        });
        console.error("Import error:", error);
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  };

  // --- Configuration Handlers ---
  const handleSetActiveConfig = (configId: string) => {
    updateUserData((prev) => ({ ...prev, activeConfigurationId: configId }));
  };

  const handleSaveAs = (name: string) => {
    if (!userData || !activeConfig || !name.trim()) return;
    const newConfig: Config = {
      ...activeConfig,
      id: `config-${Date.now()}`,
      name: name.trim(),
    };
    updateUserData((prev) => ({
      ...prev,
      configurations: [...prev.configurations, newConfig],
      activeConfigurationId: newConfig.id,
    }));
    toast({
      title: "Configurazione salvata",
      description: `Creata nuova configurazione "${newConfig.name}".`,
    });
  };

  const handleRename = (name: string) => {
    if (!userData || !activeConfig || !name.trim()) return;
    updateUserData((prev) => ({
      ...prev,
      configurations: prev.configurations.map((c) =>
        c.id === activeConfig.id ? { ...c, name: name.trim() } : c
      ),
    }));
    toast({ title: "Configurazione rinominata" });
  };

  const handleDeleteConfig = () => {
    if (!userData || !activeConfig) return;
    if (userData.configurations.length <= 1) {
      toast({
        title: "Azione non consentita",
        description: "Non puoi eliminare l'unica configurazione esistente.",
        variant: "destructive",
      });
      return;
    }
    const newConfigurations = userData.configurations.filter(
      (c) => c.id !== activeConfig.id
    );
    updateUserData({
      configurations: newConfigurations,
      activeConfigurationId: newConfigurations[0].id,
    });
    toast({
      title: "Configurazione eliminata",
      description: `"${activeConfig.name}" è stata rimossa.`,
    });
  };

  if (!ready || !userData || !activeConfig) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-muted-foreground">
        Caricamento...
      </div>
    );
  }

  return (
    <TooltipProvider>
      <AppShell configName={activeConfig.name}>
        <div className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
          {/* Page header */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Admin Panel
              </h1>
              <p className="text-sm text-muted-foreground">
                Configura palestre, squadre e coach per la tua associazione.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setDialog("export")}>
                <Download className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Esporta</span>
              </Button>
              <Label htmlFor="import-json" className="cursor-pointer">
                <div className="inline-flex h-10 items-center justify-center whitespace-nowrap rounded-md border border-input bg-background px-4 py-2 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground">
                  <Upload className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Importa</span>
                </div>
              </Label>
              <Input
                id="import-json"
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleImport}
              />
            </div>
          </div>

          {/* Config management */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Gestione Configurazioni</CardTitle>
              <CardDescription>
                Salva, carica e gestisci diversi scenari di palestre e squadre.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <Label className="shrink-0">Configurazione attiva</Label>
              <Select
                value={activeConfig.id}
                onValueChange={handleSetActiveConfig}
              >
                <SelectTrigger className="w-full sm:w-[280px]">
                  <SelectValue placeholder="Seleziona una configurazione" />
                </SelectTrigger>
                <SelectContent>
                  {userData.configurations.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => setDialog("saveAs")}>
                  <Save className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Salva come...</span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDialog("rename")}
                  title="Rinomina"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      title="Elimina configurazione"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Sei sicuro?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Questa azione non può essere annullata. Verrà eliminata
                        permanentemente la configurazione
                        <span className="font-bold">
                          {" "}
                          &quot;{activeConfig.name}&quot;
                        </span>
                        .
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annulla</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteConfig}
                        className="bg-destructive hover:bg-destructive/90"
                      >
                        Elimina
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-2 xl:grid-cols-3">
            {/* GYMS */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Building2 className="h-4 w-4" />
                  </span>
                  Gestione Palestre
                </CardTitle>
                <CardDescription>
                  Strutture e orari di disponibilità.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {activeConfig.gyms.map((gym) =>
                    editingGymId === gym.id ? (
                      <GymEditForm
                        key={gym.id}
                        gym={gym}
                        onSave={handleUpdateGym}
                        onCancel={() => setEditingGymId(null)}
                      />
                    ) : (
                      <div
                        key={gym.id}
                        className="flex items-center justify-between rounded-lg border bg-card p-3"
                      >
                        <span className="font-medium">{gym.name}</span>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingGymId(gym.id)}
                            title="Modifica"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" title="Elimina">
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Eliminare {gym.name}?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Azione irreversibile. Le sessioni assegnate a
                                  questa palestra torneranno tra quelle da
                                  assegnare.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annulla</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteGym(gym.id)}
                                  className="bg-destructive hover:bg-destructive/90"
                                >
                                  Elimina
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    )
                  )}
                  {activeConfig.gyms.length === 0 && (
                    <p className="py-4 text-center text-sm text-muted-foreground">
                      Nessuna palestra definita.
                    </p>
                  )}
                </div>
                <Button className="w-full" onClick={handleAddGym}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Aggiungi Palestra
                </Button>
              </CardContent>
            </Card>

            {/* TEAMS */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/15 text-accent">
                    <Users className="h-4 w-4" />
                  </span>
                  Gestione Squadre
                </CardTitle>
                <CardDescription>
                  Squadre, stagione e sessioni settimanali.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {activeConfig.teams.map((team) =>
                    editingTeamId === team.id ? (
                      <TeamEditForm
                        key={team.id}
                        team={team}
                        sessions={activeConfig.sessions.filter(
                          (s) => s.teamId === team.id
                        )}
                        onSave={handleUpdateTeam}
                        onCancel={() => setEditingTeamId(null)}
                      />
                    ) : (
                      <div
                        key={team.id}
                        className="flex items-center justify-between rounded-lg border bg-card p-3"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="h-3 w-3 rounded-full"
                            style={{
                              backgroundColor:
                                activeConfig.teamColors[team.id] ||
                                "hsl(var(--muted-foreground))",
                            }}
                          />
                          <span className="font-medium">{team.name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingTeamId(team.id)}
                            title="Modifica"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" title="Elimina">
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Eliminare {team.name}?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Azione irreversibile. Verranno eliminate anche
                                  tutte le sessioni di allenamento associate.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annulla</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteTeam(team.id)}
                                  className="bg-destructive hover:bg-destructive/90"
                                >
                                  Elimina
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    )
                  )}
                  {activeConfig.teams.length === 0 && (
                    <p className="py-4 text-center text-sm text-muted-foreground">
                      Nessuna squadra definita.
                    </p>
                  )}
                </div>
                <Button className="w-full" onClick={handleAddTeam}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Aggiungi Squadra
                </Button>
              </CardContent>
            </Card>

            {/* COACHES */}
            <Card className="md:col-span-2 xl:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-success/15 text-success">
                    <UserCheck className="h-4 w-4" />
                  </span>
                  Gestione Coach
                </CardTitle>
                <CardDescription>Aggiungi o rimuovi gli allenatori.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {(activeConfig.coaches || []).map((coach) =>
                    editingCoachId === coach.id ? (
                      <CoachEditForm
                        key={coach.id}
                        coach={coach}
                        onSave={handleUpdateCoach}
                        onCancel={() => setEditingCoachId(null)}
                      />
                    ) : (
                      <div
                        key={coach.id}
                        className="flex items-center justify-between rounded-lg border bg-card p-3"
                      >
                        <span className="font-medium">{coach.name}</span>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingCoachId(coach.id)}
                            title="Modifica"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" title="Elimina">
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Eliminare {coach.name}?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Azione irreversibile. Il coach verrà rimosso
                                  da tutte le sessioni a cui è assegnato.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annulla</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteCoach(coach.id)}
                                  className="bg-destructive hover:bg-destructive/90"
                                >
                                  Elimina
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    )
                  )}
                  {(activeConfig.coaches || []).length === 0 && (
                    <p className="py-4 text-center text-sm text-muted-foreground">
                      Nessun coach definito.
                    </p>
                  )}
                </div>
                <Button className="w-full" onClick={handleAddCoach}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Aggiungi Coach
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </AppShell>

      <TextPromptDialog
        open={dialog === "export"}
        title="Esporta configurazioni"
        description="Verrà scaricato un file JSON con tutte le tue configurazioni."
        label="Nome del file"
        defaultValue={`teamup_config_${activeConfig.name}_${new Date()
          .toISOString()
          .split("T")[0]}.json`}
        confirmLabel="Esporta"
        onConfirm={doExport}
        onClose={() => setDialog(null)}
      />
      <TextPromptDialog
        open={dialog === "saveAs"}
        title="Salva come..."
        description="Crea una nuova configurazione partendo da quella attiva."
        label="Nome configurazione"
        placeholder="Es. Stagione Invernale"
        confirmLabel="Salva"
        onConfirm={handleSaveAs}
        onClose={() => setDialog(null)}
      />
      <TextPromptDialog
        open={dialog === "rename"}
        title="Rinomina configurazione"
        label="Nuovo nome"
        defaultValue={activeConfig.name}
        confirmLabel="Rinomina"
        onConfirm={handleRename}
        onClose={() => setDialog(null)}
      />
    </TooltipProvider>
  );
}

// --- Gym Edit Form ---
function GymEditForm({
  gym,
  onSave,
  onCancel,
}: {
  gym: Gym;
  onSave: (gym: Gym) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState(gym);

  const handleSlotChange = (
    dayKey: number,
    slotIndex: number,
    field: "start" | "end",
    value: string
  ) => {
    const intValue = parseInt(value, 10);
    const newAvailability = formData.availability.map((day) => {
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
    const newAvailability = formData.availability.map((day) => {
      if (day.key === dayKey) {
        const newSlots = [...(day.slots || []), { start: 9 * 60, end: 10 * 60 }];
        return { ...day, slots: newSlots };
      }
      return day;
    });
    setFormData({ ...formData, availability: newAvailability });
  };

  const handleRemoveSlot = (dayKey: number, slotIndex: number) => {
    const newAvailability = formData.availability.map((day) => {
      if (day.key === dayKey) {
        const newSlots = (day.slots || []).filter((_, i) => i !== slotIndex);
        return { ...day, slots: newSlots };
      }
      return day;
    });
    setFormData({ ...formData, availability: newAvailability });
  };

  const timeOptions = useMemo(() => {
    const options = [];
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += 15) {
        const totalMinutes = h * 60 + m;
        const timeString = `${h.toString().padStart(2, "0")}:${m
          .toString()
          .padStart(2, "0")}`;
        options.push(
          <option key={totalMinutes} value={totalMinutes}>
            {timeString}
          </option>
        );
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
          const timeString = `${h.toString().padStart(2, "0")}:${m
            .toString()
            .padStart(2, "0")}`;
          options.push(
            <option key={totalMinutes} value={totalMinutes}>
              {timeString}
            </option>
          );
        }
      }
    }
    options.push(
      <option key={24 * 60} value={24 * 60}>
        24:00
      </option>
    );
    return options;
  };

  return (
    <div className="space-y-4 rounded-lg border bg-secondary/30 p-4">
      <div className="space-y-2">
        <Label htmlFor={`gym-name-${gym.id}`}>Nome palestra</Label>
        <Input
          id={`gym-name-${gym.id}`}
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
      </div>
      <Separator />
      <div className="space-y-3">
        <h4 className="text-sm font-semibold">Orari di disponibilità</h4>
        {formData.availability.map((day) => (
          <div key={day.key} className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold">{day.name}</Label>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                onClick={() => handleAddSlot(day.key)}
                title="Aggiungi fascia"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {(!day.slots || day.slots.length === 0) && (
              <p className="py-1 text-center text-xs text-muted-foreground">
                Chiuso
              </p>
            )}
            {(day.slots || []).map((slot, index) => (
              <div
                key={index}
                className="grid grid-cols-[1fr_1fr_auto] items-center gap-2"
              >
                <select
                  value={slot.start}
                  onChange={(e) =>
                    handleSlotChange(day.key, index, "start", e.target.value)
                  }
                  className="h-9 w-full rounded-md border bg-card px-2 text-xs"
                >
                  {timeOptions}
                </select>
                <select
                  value={slot.end}
                  onChange={(e) =>
                    handleSlotChange(day.key, index, "end", e.target.value)
                  }
                  className="h-9 w-full rounded-md border bg-card px-2 text-xs"
                >
                  {endTimeOptions(slot.start)}
                </select>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-destructive"
                  onClick={() => handleRemoveSlot(day.key, index)}
                  title="Rimuovi fascia"
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-end gap-2">
        <Button variant="ghost" onClick={onCancel}>
          <X className="mr-2 h-4 w-4" /> Annulla
        </Button>
        <Button onClick={() => onSave(formData)}>
          <Check className="mr-2 h-4 w-4" /> Salva
        </Button>
      </div>
    </div>
  );
}

// --- Team Edit Form ---
function TeamEditForm({
  team,
  sessions,
  onSave,
  onCancel,
}: {
  team: Team;
  sessions: Session[];
  onSave: (team: Team, sessions: Session[]) => void;
  onCancel: () => void;
}) {
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
      startTime: null,
    };
    setSessionsData([...sessionsData, newSession]);
  };

  const handleSessionDurationChange = (sessionId: string, duration: number) => {
    setSessionsData(
      sessionsData.map((s) =>
        s.id === sessionId ? { ...s, duration: duration } : s
      )
    );
  };

  return (
    <div className="space-y-4 rounded-lg border bg-secondary/30 p-4">
      <div className="space-y-2">
        <Label htmlFor={`team-name-${team.id}`}>Nome squadra</Label>
        <Input
          id={`team-name-${team.id}`}
          value={teamData.name}
          onChange={(e) => setTeamData({ ...teamData, name: e.target.value })}
        />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`team-start-${team.id}`}>Inizio stagione</Label>
          <Input
            id={`team-start-${team.id}`}
            type="date"
            value={teamData.seasonStartDate}
            onChange={(e) =>
              setTeamData({ ...teamData, seasonStartDate: e.target.value })
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`team-end-${team.id}`}>Fine stagione</Label>
          <Input
            id={`team-end-${team.id}`}
            type="date"
            value={teamData.seasonEndDate}
            onChange={(e) =>
              setTeamData({ ...teamData, seasonEndDate: e.target.value })
            }
          />
        </div>
      </div>
      <Separator />
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold">Sessioni di allenamento</h4>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            onClick={handleAddSession}
            title="Aggiungi sessione"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {sessionsData.map((session, index) => (
          <div
            key={session.id}
            className="grid grid-cols-[1fr_auto] items-center gap-2 rounded-md border bg-card p-2"
          >
            <div className="flex items-center gap-2">
              <Label
                htmlFor={`session-duration-${session.id}`}
                className="text-xs"
              >
                Sessione {index + 1} (min)
              </Label>
              <Input
                id={`session-duration-${session.id}`}
                type="number"
                min="30"
                step="15"
                value={session.duration}
                onChange={(e) =>
                  handleSessionDurationChange(
                    session.id,
                    parseInt(e.target.value, 10) || 30
                  )
                }
                className="h-8 w-24"
              />
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-destructive"
              onClick={() =>
                setSessionsData(sessionsData.filter((s) => s.id !== session.id))
              }
              title="Rimuovi sessione"
            >
              <Trash className="h-4 w-4" />
            </Button>
          </div>
        ))}
        {sessionsData.length === 0 && (
          <p className="py-2 text-center text-xs text-muted-foreground">
            Nessuna sessione definita.
          </p>
        )}
      </div>
      <div className="mt-2 flex justify-end gap-2">
        <Button variant="ghost" onClick={onCancel}>
          <X className="mr-2 h-4 w-4" /> Annulla
        </Button>
        <Button onClick={() => onSave(teamData, sessionsData)}>
          <Check className="mr-2 h-4 w-4" /> Salva
        </Button>
      </div>
    </div>
  );
}

// --- Coach Edit Form ---
function CoachEditForm({
  coach,
  onSave,
  onCancel,
}: {
  coach: Coach;
  onSave: (coach: Coach) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(coach.name);

  return (
    <div className="space-y-4 rounded-lg border bg-secondary/30 p-4">
      <div className="space-y-2">
        <Label htmlFor={`coach-name-${coach.id}`}>Nome coach</Label>
        <Input
          id={`coach-name-${coach.id}`}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div className="mt-2 flex justify-end gap-2">
        <Button variant="ghost" onClick={onCancel}>
          <X className="mr-2 h-4 w-4" /> Annulla
        </Button>
        <Button onClick={() => onSave({ ...coach, name })}>
          <Check className="mr-2 h-4 w-4" /> Salva
        </Button>
      </div>
    </div>
  );
}
