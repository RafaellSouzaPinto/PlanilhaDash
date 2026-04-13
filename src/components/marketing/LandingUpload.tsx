"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { Loader2, RotateCcw } from "lucide-react";
import { Dropzone } from "@/components/upload/Dropzone";
import { ChartGrid } from "@/components/dashboard/ChartGrid";
import { Button } from "@/components/ui/button";
import { parseFile } from "@/lib/parser";
import { inferTypes } from "@/lib/inferTypes";
import { buildChartConfigs } from "@/lib/chartEngine";
import type { ChartConfig } from "@/types/spreadsheet";

const TRIAL_KEY = "pd_trial_used";

type UploadState = "idle" | "parsing" | "result" | "gated";

export function LandingUpload() {
  const [state, setState] = useState<UploadState>("idle");
  const [fileName, setFileName] = useState("");
  const [charts, setCharts] = useState<ChartConfig[]>([]);
  const [error, setError] = useState("");

  // Checar trial no cliente (localStorage não existe no servidor)
  useEffect(() => {
    if (localStorage.getItem(TRIAL_KEY)) {
      setState("gated");
    }
  }, []);

  const handleFile = useCallback(async (file: File) => {
    setFileName(file.name);
    setState("parsing");
    setError("");

    try {
      const rows = await parseFile(file);
      const cols = inferTypes(rows);
      const configs = buildChartConfigs(cols, rows);
      setCharts(configs);
      setState("result");
      localStorage.setItem(TRIAL_KEY, "1");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao processar arquivo");
      setState("idle");
    }
  }, []);

  function handleReset() {
    setCharts([]);
    setError("");
    // Se já usou o trial, vai para gated; senão volta ao idle
    setState(localStorage.getItem(TRIAL_KEY) ? "gated" : "idle");
  }

  // ── Estado: gated ──────────────────────────────────────────────────────────
  if (state === "gated") {
    return (
      <div
        className="w-full rounded-xl border-2 border-dashed border-border px-8 py-16 text-center space-y-6"
        data-testid="landing-gated"
      >
        <p className="text-lg font-medium text-foreground">
          Gostou? Crie uma conta para continuar usando.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button size="lg" asChild>
            <Link href="/signup">Criar conta grátis</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/login">Entrar</Link>
          </Button>
        </div>
      </div>
    );
  }

  // ── Estado: parsing ────────────────────────────────────────────────────────
  if (state === "parsing") {
    return (
      <div
        className="w-full rounded-xl border-2 border-dashed border-border px-8 py-16 text-center space-y-3"
        data-testid="landing-parsing"
      >
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto" />
        <p className="text-sm font-medium text-foreground">{fileName}</p>
        <p className="text-sm text-muted-foreground">Processando...</p>
      </div>
    );
  }

  // ── Estado: result ─────────────────────────────────────────────────────────
  if (state === "result") {
    return (
      <div className="w-full space-y-6" data-testid="landing-result">
        {/* Banner de conversão */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-lg border bg-muted/30 px-5 py-4">
          <div>
            <p className="text-sm font-medium text-foreground">
              Seu dashboard está pronto.
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Salvar, usar IA e exportar PDF exigem conta — é grátis.
            </p>
          </div>
          <Button size="sm" asChild className="shrink-0">
            <Link href="/signup">Criar conta grátis</Link>
          </Button>
        </div>

        {/* Gráficos reais */}
        <ChartGrid configs={charts} />

        {/* Reset */}
        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mx-auto"
          data-testid="landing-reset"
        >
          <RotateCcw className="h-3 w-3" aria-hidden="true" />
          Processar outra planilha
        </button>
      </div>
    );
  }

  // ── Estado: idle ───────────────────────────────────────────────────────────
  return (
    <div className="w-full space-y-2" data-testid="landing-idle">
      {error && (
        <p className="text-sm text-destructive text-center" role="alert">
          {error}
        </p>
      )}
      <Dropzone onFileAccepted={handleFile} />
    </div>
  );
}
