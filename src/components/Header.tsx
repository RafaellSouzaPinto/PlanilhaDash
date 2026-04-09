"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BarChart2, LogOut, Upload, LayoutDashboard, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ApiKeyModal } from "@/components/modals/ApiKeyModal";

export function Header() {
  const router = useRouter();
  const [showKeyModal, setShowKeyModal] = useState(false);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      <header className="border-b bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-2">
              <BarChart2 className="h-6 w-6 text-primary" />
              <span className="font-bold text-lg">PlanilhaDash</span>
            </Link>

            <nav className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <LayoutDashboard className="h-4 w-4" />
                Histórico
              </Link>
              <Link
                href="/upload"
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Upload className="h-4 w-4" />
                Nova planilha
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowKeyModal(true)}
                className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
                title="Configurar chave de IA"
              >
                <KeyRound className="h-4 w-4" />
                <span className="hidden sm:inline">Config. IA</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="flex items-center gap-1.5"
              >
                <LogOut className="h-4 w-4" />
                Sair
              </Button>
            </nav>
          </div>
        </div>
      </header>

      <ApiKeyModal
        open={showKeyModal}
        onOpenChange={setShowKeyModal}
      />
    </>
  );
}
