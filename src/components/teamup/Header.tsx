
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Settings, LayoutDashboard, RefreshCw, Printer } from "lucide-react";

export function Header({ onRefresh, configName }: { onRefresh: () => void, configName: string }) {
  return (
    <header className="flex items-center justify-between p-4 border-b bg-card">
      <h1 className="text-xl font-bold text-primary">
        TeamUp Scheduler: <span className="font-medium text-foreground">{configName}</span>
      </h1>
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={onRefresh}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Aggiorna Dati
        </Button>
         <Link href="/print">
            <Button variant="outline">
                <Printer className="mr-2 h-4 w-4" />
                Stampa
            </Button>
        </Link>
        <Link href="/dashboard">
            <Button variant="outline">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Dashboard
            </Button>
        </Link>
        <Link href="/admin">
            <Button variant="outline">
            <Settings className="mr-2 h-4 w-4" />
            Admin Panel
            </Button>
        </Link>
      </div>
    </header>
  );
}
