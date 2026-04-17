"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Sparkles, BarChart2, Loader2 } from "lucide-react";

type AiStatus = {
  hasOwnKey: boolean;
  hasFreeTierAvailable: boolean;
  freeTierUsed: number;
  freeTierLimit: number;
  hasAiAvailable: boolean;
};

interface ChartModeSelectorProps {
  open: boolean;
  aiStatus: AiStatus | null;
  loading: boolean;
  onSelectAI: () => void;
  onSelectAuto: () => void;
}

export function ChartModeSelector({
  open,
  aiStatus,
  loading,
  onSelectAI,
  onSelectAuto,
}: ChartModeSelectorProps) {
  const aiAvailable = aiStatus?.hasAiAvailable ?? false;
  const hasOwnKey = aiStatus?.hasOwnKey ?? false;
  const remaining = aiStatus
    ? aiStatus.freeTierLimit - aiStatus.freeTierUsed
    : 0;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-md"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Como gerar seu dashboard?</DialogTitle>
          <DialogDescription>
            Escolha o modo de geração dos gráficos para esta planilha.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 pt-2">
          {/* Opção AI + Auto */}
          <button
            type="button"
            onClick={onSelectAI}
            disabled={!aiAvailable || loading}
            className={`relative flex items-start gap-4 rounded-lg border p-4 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              aiAvailable && !loading
                ? "border-primary bg-primary/5 hover:bg-primary/10 cursor-pointer"
                : "border-border bg-muted/40 cursor-not-allowed opacity-60"
            }`}
          >
            {loading ? (
              <Loader2 className="mt-0.5 h-5 w-5 shrink-0 animate-spin text-primary" />
            ) : (
              <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">
                4 gráficos com IA + 4 automáticos
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {loading
                  ? "Gerando gráficos com IA..."
                  : aiAvailable
                  ? hasOwnKey
                    ? "Usa sua chave de API própria"
                    : `Usa 1 análise gratuita`
                  : "Sem análises gratuitas disponíveis"}
              </p>
            </div>
            {!hasOwnKey && aiStatus && (
              <span
                className={`shrink-0 self-center text-xs font-medium px-2 py-0.5 rounded-full border ${
                  aiAvailable
                    ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                    : "border-red-300 bg-red-50 text-red-700"
                }`}
              >
                {aiAvailable ? `${remaining} restante${remaining !== 1 ? "s" : ""}` : "Esgotado"}
              </span>
            )}
          </button>

          {/* Opção Só Auto */}
          <button
            type="button"
            onClick={onSelectAuto}
            disabled={loading}
            className={`flex items-start gap-4 rounded-lg border p-4 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              !loading
                ? "border-border hover:border-primary/50 hover:bg-accent cursor-pointer"
                : "border-border bg-muted/40 cursor-not-allowed opacity-60"
            }`}
          >
            <BarChart2 className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">Só 4 gráficos automáticos</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Gerado sem IA — gratuito e instantâneo
              </p>
            </div>
            <span className="shrink-0 self-center text-xs font-medium px-2 py-0.5 rounded-full border border-gray-200 bg-gray-50 text-gray-600">
              Grátis
            </span>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
