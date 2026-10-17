"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const activeUser =
      typeof window !== "undefined"
        ? localStorage.getItem("teamup_active_user")
        : null;
    router.replace(activeUser ? "/scheduler" : "/login");
  }, [router]);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background text-muted-foreground">
      Reindirizzamento...
    </div>
  );
}
