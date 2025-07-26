
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Settings, LayoutDashboard, RefreshCw, Printer, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

export function Header({ onRefresh, configName }: { onRefresh: () => void, configName: string }) {
  const router = useRouter();

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('teamup_active_user');
    }
    router.push('/login');
  };

  return (
    <header className="flex items-center justify-between p-4 border-b bg-card">
      <h1 className="text-lg md:text-xl font-bold text-primary truncate">
        TeamUp: <span className="font-medium text-foreground">{configName}</span>
      </h1>
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={onRefresh} className="hidden md:inline-flex">
            <RefreshCw className="mr-2 h-4 w-4" />
            Aggiorna Dati
        </Button>
         <Link href="/print" className="hidden md:block">
            <Button variant="outline">
                <Printer className="mr-2 h-4 w-4" />
                Stampa
            </Button>
        </Link>
        <Link href="/dashboard" className="hidden md:block">
            <Button variant="outline">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Dashboard
            </Button>
        </Link>
        <Link href="/admin" className="hidden md:block">
            <Button variant="outline">
            <Settings className="mr-2 h-4 w-4" />
            Admin Panel
            </Button>
        </Link>
        <Button variant="destructive" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
        </Button>
      </div>
    </header>
  );
}
