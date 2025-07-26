
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Settings, LayoutDashboard, RefreshCw, Printer, LogOut, Menu } from "lucide-react";
import { useRouter } from "next/navigation";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

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
      <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                    <Menu className="h-4 w-4"/>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
                <DropdownMenuLabel>Funzioni</DropdownMenuLabel>
                <DropdownMenuItem onSelect={onRefresh}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    <span>Aggiorna Dati</span>
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => router.push('/print')}>
                    <Printer className="mr-2 h-4 w-4" />
                    <span>Stampa</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Pannelli</DropdownMenuLabel>
                 <DropdownMenuItem onSelect={() => router.push('/dashboard')}>
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    <span>Dashboard</span>
                </DropdownMenuItem>
                 <DropdownMenuItem onSelect={() => router.push('/admin')}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Admin Panel</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={handleLogout} className="text-destructive focus:text-destructive">
                     <LogOut className="mr-2 h-4 w-4" />
                     <span>Logout</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <h1 className="text-lg md:text-xl font-bold text-primary truncate">
            TeamUp: <span className="font-medium text-foreground">{configName}</span>
          </h1>
       </div>
    </header>
  );
}

    