"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AppData,
  Config,
  Session,
  UserData,
  initialData,
} from "@/lib/teamup";

export const ACTIVE_USER_KEY = "teamup_active_user";
export const APP_DATA_KEY = "teamup_data";

type SessionWithLegacyCoach = Session & { coachId?: string };

/**
 * Normalizza una configurazione garantendo la retro-compatibilità:
 * - `coaches` sempre array
 * - `coachIds` sempre array (converte il vecchio `coachId` singolo)
 */
export function normalizeConfig(config: Config): Config {
  const coaches = config.coaches ?? [];
  const sessions: Session[] = (config.sessions ?? []).map((raw) => {
    const session = raw as SessionWithLegacyCoach;
    const legacy = session.coachId ? [session.coachId] : [];
    const { coachId, ...rest } = session;
    const coachIds = Array.isArray(session.coachIds)
      ? session.coachIds
      : legacy;
    return { ...(rest as Session), coachIds };
  });
  return { ...config, coaches, sessions };
}

/**
 * Hook unico, condiviso da tutte le pagine, per accedere ai dati local-first
 * salvati in localStorage. Centralizza lettura/scrittura e gestione utente.
 */
export function useTeamUpData() {
  const router = useRouter();
  const [activeUser, setActiveUser] = useState<string | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [ready, setReady] = useState(false);
  const [reloadTick, setReloadTick] = useState(0);

  const load = useCallback(() => {
    if (typeof window === "undefined") return;
    const loggedInUser = localStorage.getItem(ACTIVE_USER_KEY);
    if (!loggedInUser) {
      router.replace("/login");
      return;
    }
    setActiveUser(loggedInUser);
    try {
      const saved = localStorage.getItem(APP_DATA_KEY);
      const parsed: AppData | null = saved ? JSON.parse(saved) : null;
      if (parsed?.userData?.[loggedInUser]) {
        setUserData(parsed.userData[loggedInUser]);
        setReady(true);
        return;
      }
    } catch (e) {
      console.error("Failed to load data from localStorage", e);
    }
    setUserData({
      configurations: [initialData],
      activeConfigurationId: initialData.id,
    });
    setReady(true);
  }, [router]);

  useEffect(() => {
    load();
  }, [load, reloadTick]);

  const activeConfig = useMemo<Config | null>(() => {
    if (!userData) return null;
    const found =
      userData.configurations.find(
        (c) => c.id === userData.activeConfigurationId
      ) ||
      userData.configurations[0] ||
      initialData;
    return normalizeConfig(found);
  }, [userData]);

  const updateUserData = useCallback(
    (updater: UserData | ((prev: UserData) => UserData)) => {
      setUserData((prev) => {
        if (!prev) return prev;
        const next =
          typeof updater === "function" ? updater(prev) : updater;
        if (typeof window !== "undefined") {
          const loggedInUser = localStorage.getItem(ACTIVE_USER_KEY);
          if (loggedInUser) {
            const saved = localStorage.getItem(APP_DATA_KEY);
            const appData: AppData = saved
              ? JSON.parse(saved)
              : { users: {}, userData: {} };
            appData.userData = appData.userData ?? {};
            appData.userData[loggedInUser] = next;
            localStorage.setItem(APP_DATA_KEY, JSON.stringify(appData));
          }
        }
        return next;
      });
    },
    []
  );

  const updateActiveConfig = useCallback(
    (patch: Partial<Omit<Config, "id" | "name">>) => {
      updateUserData((prev) => {
        const configurations = prev.configurations.map((c) =>
          c.id === prev.activeConfigurationId ? { ...c, ...patch } : c
        );
        return { ...prev, configurations };
      });
    },
    [updateUserData]
  );

  const reload = useCallback(() => setReloadTick((t) => t + 1), []);

  const logout = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(ACTIVE_USER_KEY);
    }
    router.push("/login");
  }, [router]);

  return {
    activeUser,
    userData,
    activeConfig,
    ready,
    reload,
    updateUserData,
    updateActiveConfig,
    logout,
  };
}
