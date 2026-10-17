"use client";

import { useEffect } from "react";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }
    const register = () => {
      navigator.serviceWorker
        .register(`${BASE_PATH}/sw.js`)
        .catch((err) => console.warn("Service worker non registrato:", err));
    };
    window.addEventListener("load", register);
    return () => window.removeEventListener("load", register);
  }, []);

  return null;
}
