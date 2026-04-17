"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Dropzone } from "@/components/upload/Dropzone";
import { FilePreview } from "@/components/upload/FilePreview";
import { ChartGrid } from "@/components/dashboard/ChartGrid";
import { InsightsPanel } from "@/components/ai/InsightsPanel";
import { ChartModeSelector } from "@/components/modals/ChartModeSelector";
import { ExportButton } from "@/components/pdf/ExportButton";
import { ApiKeyModal } from "@/components/modals/ApiKeyModal";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { parseFile } from "@/lib/parser";
import { inferTypes } from "@/lib/inferTypes";
import { buildChartConfigs, buildChartFromSuggestion } from "@/lib/chartEngine";
import type { ColumnMeta, ChartConfig } from "@/types/spreadsheet";
import { Sparkles, Save, Loader2 } from "lucide-react";

const AI_SAMPLE_ROWS = 50;

type AiStatus = {
  hasOwnKey: boolean;
  hasFreeTierAvailable: boolean;
  freeTierUsed: number;
  freeTierLimit: number;
  hasAiAvailable: boolean;
};

export default function UploadPage() {
  const router = useRouter();

  // File & parse state
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [columnsMeta, setColumnsMeta] = useState<ColumnMeta[]>([]);

  // Chart state — AI charts and auto charts are separate
  const [aiCharts, setAiCharts] = useState<ChartConfig[]>([]);
  const [autoCharts, setAutoCharts] = useState<ChartConfig[]>([]);

  // AI insights (text analysis)
  const [aiInsights, setAiInsights] = useState<string | null>(null);

  // Loading / action states
  const [parsing, setParsing] = useState(false);
  const [generatingAiCharts, setGeneratingAiCharts] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);

  // UI state
  const [error, setError] = useState("");
  const [showModeSelector, setShowModeSelector] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [aiStatus, setAiStatus] = useState<AiStatus | null>(null);

  const hasDashboard = aiCharts.length > 0 || autoCharts.length > 0;
  const allCharts = [...aiCharts, ...autoCharts];

  const refreshAiStatus = useCallback(async (): Promise<AiStatus | null> => {
    try {
      const res = await fetch("/api/user/ai-status");
      const data: AiStatus = await res.json();
      setAiStatus(data);
      return data;
    } catch {
      return null;
    }
  }, []);

  const handleFileAccepted = useCallback(
    async (f: File) => {
      setFile(f);
      setRows([]);
      setColumnsMeta([]);
      setAiCharts([]);
      setAutoCharts([]);
      setAiInsights(null);
      setError("");
      setParsing(true);

      try {
        const parsed = await parseFile(f);
        const cols = inferTypes(parsed);
        setRows(parsed);
        setColumnsMeta(cols);
        await refreshAiStatus();
        setShowModeSelector(true);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Erro ao processar arquivo"
        );
      } finally {
        setParsing(false);
      }
    },
    [refreshAiStatus]
  );

  async function handleSelectAI() {
    setGeneratingAiCharts(true);
    setError("");

    try {
      const res = await fetch("/api/ai-chart-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          columnsMeta,
          sampleRows: rows.slice(0, AI_SAMPLE_ROWS),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error === "FREE_TIER_EXHAUSTED") {
          setShowModeSelector(false);
          setShowApiKeyModal(true);
          return;
        }
        // Any other error — fall through to auto only
      } else {
        const suggestions = (data.suggestions ?? []).slice(0, 4);
        setAiCharts(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          suggestions.map((s: any) => buildChartFromSuggestion(s, rows))
        );
      }
    } catch {
      // Network error — fall through to auto only
    } finally {
      setAutoCharts(buildChartConfigs(columnsMeta, rows));
      setShowModeSelector(false);
      await refreshAiStatus();
      setGeneratingAiCharts(false);
    }
  }

  function handleSelectAuto() {
    setAiCharts([]);
    setAutoCharts(buildChartConfigs(columnsMeta, rows));
    setShowModeSelector(false);
  }

  async function handleAnalyzeAI() {
    setError("");
    setAnalyzing(true);

    try {
      const statusData = await refreshAiStatus();

      if (!statusData?.hasAiAvailable) {
        setShowApiKeyModal(true);
        setAnalyzing(false);
        return;
      }

      const res = await fetch("/api/ai-analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          columnsMeta,
          sampleRows: rows.slice(0, AI_SAMPLE_ROWS),
          chartsConfig: allCharts,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.error === "FREE_TIER_EXHAUSTED") {
          setShowApiKeyModal(true);
          setAnalyzing(false);
          return;
        }
        const keyErrorKeywords = [
          "Chave de API",
          "expirada",
          "inválida",
          "Permissão negada",
        ];
        if (
          res.status === 400 &&
          keyErrorKeywords.some((k) => data.error?.includes(k))
        ) {
          setShowApiKeyModal(true);
          return;
        }
        setError(data.error ?? "Erro na análise de IA");
        return;
      }

      setAiInsights(data.insights);
      await refreshAiStatus();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro de conexão com a IA"
      );
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleSaveReport() {
    if (!file || allCharts.length === 0) return;

    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          rowCount: rows.length,
          columnsMeta,
          chartsConfig: allCharts,
          aiInsights: aiInsights ?? undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao salvar relatório");
        return;
      }

      router.push(`/dashboard`);
    } catch {
      setError("Erro ao salvar relatório");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Nova planilha</h1>
        <p className="text-muted-foreground">
          Faça upload de um arquivo CSV, XLSX ou ODS para gerar o dashboard
        </p>
      </div>

      {!file ? (
        <Dropzone onFileAccepted={handleFileAccepted} disabled={parsing} />
      ) : (
        <FilePreview
          file={file}
          rowCount={rows.length > 0 ? rows.length : undefined}
          onRemove={() => {
            setFile(null);
            setRows([]);
            setColumnsMeta([]);
            setAiCharts([]);
            setAutoCharts([]);
            setAiInsights(null);
            setShowModeSelector(false);
          }}
        />
      )}

      {parsing && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Processando planilha...
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Mode selector dialog — appears after file is parsed */}
      <ChartModeSelector
        open={showModeSelector}
        aiStatus={aiStatus}
        loading={generatingAiCharts}
        onSelectAI={handleSelectAI}
        onSelectAuto={handleSelectAuto}
      />

      {/* Dashboard actions and charts */}
      {hasDashboard && (
        <>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={handleAnalyzeAI}
                disabled={analyzing}
                className="flex items-center gap-2"
              >
                {analyzing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                {analyzing ? "Analisando..." : "Analisar com IA"}
              </Button>
              {aiStatus && !aiStatus.hasOwnKey && (
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                    aiStatus.hasFreeTierAvailable
                      ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                      : "border-red-300 bg-red-50 text-red-700"
                  }`}
                >
                  {aiStatus.hasFreeTierAvailable
                    ? `${aiStatus.freeTierLimit - aiStatus.freeTierUsed} gratuita${aiStatus.freeTierLimit - aiStatus.freeTierUsed !== 1 ? "s" : ""} restante${aiStatus.freeTierLimit - aiStatus.freeTierUsed !== 1 ? "s" : ""}`
                    : "Sem análises gratuitas"}
                </span>
              )}
            </div>

            <Button
              onClick={handleSaveReport}
              disabled={saving}
              className="flex items-center gap-2"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {saving ? "Salvando..." : "Salvar relatório"}
            </Button>

            <ExportButton
              dashboardElementId="dashboard-export"
              fileName={file?.name ?? "dashboard"}
            />
          </div>

          {aiInsights && (
            <InsightsPanel insights={aiInsights} loading={analyzing} />
          )}
          {analyzing && <InsightsPanel insights={null} loading={true} />}

          <div id="dashboard-export" className="space-y-6">
            {aiCharts.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-base font-semibold flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Gráficos com IA
                </h2>
                <ChartGrid configs={aiCharts} id="dashboard-ai" />
              </div>
            )}

            {autoCharts.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-base font-semibold text-muted-foreground">
                  Gráficos automáticos
                </h2>
                <ChartGrid configs={autoCharts} id="dashboard-auto" />
              </div>
            )}
          </div>
        </>
      )}

      <ApiKeyModal
        open={showApiKeyModal}
        onOpenChange={setShowApiKeyModal}
        onSaved={() => {
          handleAnalyzeAI();
        }}
      />
    </div>
  );
}
