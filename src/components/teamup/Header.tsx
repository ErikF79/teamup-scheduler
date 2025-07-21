"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Settings, LayoutDashboard } from "lucide-react";

export function Header() {
  return (
    <header className="flex items-center justify-between p-4 border-b bg-card">
      <h1 className="text-xl font-bold text-primary">
        TeamUp Scheduler
      </h1>
      <div className="flex items-center gap-2">
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
