"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Dropzone } from "@/components/upload/Dropzone";
import { FilePreview } from "@/components/upload/FilePreview";
import { ChartGrid } from "@/components/dashboard/ChartGrid";
import { InsightsPanel } from "@/components/ai/InsightsPanel";
import { ChartSuggestionSelector } from "@/components/ai/ChartSuggestionSelector";
import { ExportButton } from "@/components/pdf/ExportButton";
import { ApiKeyModal } from "@/components/modals/ApiKeyModal";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { parseFile } from "@/lib/parser";
import { inferTypes } from "@/lib/inferTypes";
import { buildChartConfigs, buildChartFromSuggestion } from "@/lib/chartEngine";
import type {
  ColumnMeta,
  ChartConfig,
  ChartSuggestion,
  ChartSuggestionsResponse,
} from "@/types/spreadsheet";
import { Sparkles, Save, Loader2 } from "lucide-react";

const AI_SAMPLE_ROWS = 50;

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [columnsMeta, setColumnsMeta] = useState<ColumnMeta[]>([]);
  const [chartsConfig, setChartsConfig] = useState<ChartConfig[]>([]);
  const [aiInsights, setAiInsights] = useState<string | null>(null);

  const [parsing, setParsing] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);

  // AI chart suggestion state
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<ChartSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionsFallback, setSuggestionsFallback] = useState(false);

  const handleFileAccepted = useCallback(async (f: File) => {
    setFile(f);
    setRows([]);
    setColumnsMeta([]);
    setChartsConfig([]);
    setAiInsights(null);
    setError("");
    setSuggestions([]);
    setShowSuggestions(false);
    setSuggestionsFallback(false);
    setParsing(true);

    try {
      const parsed = await parseFile(f);
      const cols = inferTypes(parsed);
      setRows(parsed);
      setColumnsMeta(cols);

      // Check if user has AI key configured
      const keyRes = await fetch("/api/user/api-key");
      const keyData = await keyRes.json();

      if (!keyData.hasApiKey) {
        // No AI key — use deterministic chart engine immediately
        setChartsConfig(buildChartConfigs(cols, parsed));
      } else {
        // AI key present — request contextual suggestions
        setSuggestionsLoading(true);
        setShowSuggestions(true);

        try {
          const suggestRes = await fetch("/api/ai-chart-suggestions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              columnsMeta: cols,
              sampleRows: parsed.slice(0, AI_SAMPLE_ROWS),
            }),
          });

          if (!suggestRes.ok) {
            // 400/401 — fall back silently
            setChartsConfig(buildChartConfigs(cols, parsed));
            setShowSuggestions(false);
          } else {
            const suggestData: ChartSuggestionsResponse = await suggestRes.json();

            if (suggestData.fallback) {
              // Remote fallback — build charts directly from deterministic suggestions
              const charts = suggestData.suggestions
                .slice(0, 4)
                .map((s) => buildChartFromSuggestion(s, parsed));
              setChartsConfig(charts);
              setSuggestionsFallback(true);
              setShowSuggestions(false);
            } else {
              // Show selector for user to choose
              setSuggestions(suggestData.suggestions);
            }
          }
        } catch {
          // Network error during suggestions — fall back to deterministic
          setChartsConfig(buildChartConfigs(cols, parsed));
          setShowSuggestions(false);
        } finally {
          setSuggestionsLoading(false);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao processar arquivo");
    } finally {
      setParsing(false);
    }
  }, []);

  async function handleAnalyzeAI() {
    setError("");
    setAnalyzing(true);

    try {
      const keyRes = await fetch("/api/user/api-key");
      const keyData = await keyRes.json();

      if (!keyData.hasApiKey) {
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
          chartsConfig,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        const keyErrorKeywords = ["Chave de API", "expirada", "inválida", "Permissão negada"];
        if (res.status === 400 && keyErrorKeywords.some((k) => data.error?.includes(k))) {
          setShowApiKeyModal(true);
          return;
        }
        setError(data.error ?? "Erro na análise de IA");
        return;
      }

      setAiInsights(data.insights);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro de conexão com a IA");
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleSaveReport() {
    if (!file || chartsConfig.length === 0) return;

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
          chartsConfig,
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
            setChartsConfig([]);
            setAiInsights(null);
            setSuggestions([]);
            setShowSuggestions(false);
            setSuggestionsFallback(false);
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

      {/* AI Suggestion Selector — shown while waiting for/choosing suggestions */}
      {showSuggestions && (
        <ChartSuggestionSelector
          suggestions={suggestions}
          loading={suggestionsLoading}
          onConfirm={(selected) => {
            const charts = selected.map((s) => buildChartFromSuggestion(s, rows));
            setChartsConfig(charts);
            setShowSuggestions(false);
          }}
        />
      )}

      {/* Fallback notice when AI returned no suggestions */}
      {suggestionsFallback && chartsConfig.length > 0 && (
        <Alert>
          <AlertDescription>
            A IA não gerou sugestões para esta planilha. Exibindo gráficos automáticos.
          </AlertDescription>
        </Alert>
      )}

      {chartsConfig.length > 0 && (
        <>
          <div className="flex items-center gap-3 flex-wrap">
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

          <ChartGrid configs={chartsConfig} id="dashboard-export" />
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
