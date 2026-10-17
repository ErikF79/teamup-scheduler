"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  LayoutDashboard,
  Menu,
  Moon,
  Printer,
  RefreshCw,
  Settings2,
  Sun,
  User as UserIcon,
  X,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/teamup/theme-provider";
import { useTeamUpData } from "@/hooks/use-teamup-data";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const NAV_ITEMS = [
  { href: "/scheduler", label: "Scheduler", icon: CalendarDays },
  { href: "/admin", label: "Admin", icon: Settings2 },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/print", label: "Stampa", icon: Printer },
] as const;

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/scheduler" className="flex items-center gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-sm">
        <CalendarDays className="h-5 w-5" />
      </span>
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className="text-sm font-bold tracking-tight text-foreground">
            TeamUp
          </span>
          <span className="text-[11px] font-medium text-muted-foreground">
            Scheduler
          </span>
        </span>
      )}
    </Link>
  );
}

function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, toggleTheme } = useTheme();
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className={className}
      aria-label="Cambia tema"
      title={resolvedTheme === "dark" ? "Tema chiaro" : "Tema scuro"}
    >
      <Sun className="h-[18px] w-[18px] dark:hidden" />
      <Moon className="hidden h-[18px] w-[18px] dark:block" />
    </Button>
  );
}

interface NavListProps {
  onNavigate?: () => void;
}

function NavList({ onNavigate }: NavListProps) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1">
      {NAV_ITEMS.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground"
            )}
          >
            <Icon
              className={cn(
                "h-[18px] w-[18px]",
                active ? "text-primary" : "text-muted-foreground"
              )}
            />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export interface AppShellProps {
  children: React.ReactNode;
  configName?: string | null;
  onRefresh?: () => void;
  contentClassName?: string;
  fullBleed?: boolean;
}

export function AppShell({
  children,
  configName,
  onRefresh,
  contentClassName,
  fullBleed = false,
}: AppShellProps) {
  const { activeUser, logout } = useTeamUpData();
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  const handleRefresh = () => {
    if (onRefresh) onRefresh();
    else if (typeof window !== "undefined") window.location.reload();
  };

  return (
    <div className="min-h-screen bg-background app-gradient">
      {/* Sidebar desktop */}
      <aside className="no-print fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r bg-sidebar lg:flex">
        <div className="flex h-16 items-center px-5">
          <Logo />
        </div>
        <div className="scrollbar-thin flex-1 overflow-y-auto px-3 pb-4">
          <NavList />
        </div>
        <div className="border-t p-3">
          <div className="rounded-xl bg-sidebar-accent/50 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Configurazione attiva
            </p>
            <p className="mt-1 truncate text-sm font-semibold text-foreground">
              {configName ?? "—"}
            </p>
          </div>
          <div className="mt-3 flex items-center justify-between gap-1">
            <span className="flex min-w-0 items-center gap-2 px-1 text-xs text-muted-foreground">
              <UserIcon className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{activeUser ?? "—"}</span>
            </span>
            <span className="flex items-center">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRefresh}
                title="Aggiorna dati"
                aria-label="Aggiorna dati"
              >
                <RefreshCw className="h-[18px] w-[18px]" />
              </Button>
              <ThemeToggle />
              <Button
                variant="ghost"
                size="icon"
                onClick={logout}
                title="Logout"
                aria-label="Logout"
                className="text-destructive hover:text-destructive"
              >
                <LogOut className="h-[18px] w-[18px]" />
              </Button>
            </span>
          </div>
        </div>
      </aside>

      {/* Header mobile / tablet */}
      <header className="no-print sticky top-0 z-40 flex h-16 items-center justify-between gap-3 border-b bg-card/85 px-4 backdrop-blur lg:hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setDrawerOpen(true)}
          aria-label="Apri menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="flex min-w-0 flex-col items-center">
          <span className="truncate text-sm font-bold text-foreground">
            TeamUp Scheduler
          </span>
          <span className="truncate text-[11px] text-muted-foreground">
            {configName ?? ""}
          </span>
        </div>
        <div className="flex items-center">
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Account">
                <UserIcon className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{activeUser ?? "Utente"}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={handleRefresh}>
                <RefreshCw className="mr-2 h-4 w-4" /> Aggiorna dati
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={logout}
                className="text-destructive focus:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" /> Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Drawer mobile */}
      {drawerOpen && (
        <div className="no-print fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
            aria-hidden
          />
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[82%] flex-col border-r bg-sidebar shadow-xl">
            <div className="flex h-16 items-center justify-between px-4">
              <Logo />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDrawerOpen(false)}
                aria-label="Chiudi menu"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="scrollbar-thin flex-1 overflow-y-auto px-3 py-2">
              <NavList onNavigate={() => setDrawerOpen(false)} />
            </div>
            <div className="border-t p-3">
              <Button
                variant="outline"
                className="w-full justify-start text-destructive"
                onClick={logout}
              >
                <LogOut className="mr-2 h-4 w-4" /> Logout
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Contenuto */}
      <div className="lg:pl-64 print:pl-0">
        <main
          className={cn(
            fullBleed
              ? "h-[calc(100svh-8rem)] overflow-hidden lg:h-svh"
              : "min-h-screen pb-24 lg:pb-0 print:min-h-0 print:pb-0",
            contentClassName
          )}
        >
          {children}
        </main>
      </div>

      {/* Bottom navigation mobile */}
      <nav className="no-print fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t bg-card/95 backdrop-blur lg:hidden">
        {NAV_ITEMS.map((item) => (
          <BottomNavLink key={item.href} {...item} />
        ))}
      </nav>
    </div>
  );
}

function BottomNavLink({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      className={cn(
        "flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
        active ? "text-primary" : "text-muted-foreground"
      )}
    >
      <Icon className="h-5 w-5" />
      {label}
    </Link>
  );
}
