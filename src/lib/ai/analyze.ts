import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createGroq } from "@ai-sdk/groq";
import type { ColumnMeta, ChartConfig } from "@/types/spreadsheet";

const AI_SAMPLE_ROWS = Number(process.env.AI_SAMPLE_ROWS ?? 50);

// Default models per provider — pinned to stable versions
const DEFAULT_MODELS: Record<string, string> = {
  openai:    "gpt-4o-mini",
  anthropic: "claude-3-haiku-20240307",
  google:    "gemini-2.5-flash",
  groq:      "llama-3.1-8b-instant",
};

// Fallback models if the default fails (tried in order)
const FALLBACK_MODELS: Record<string, string[]> = {
  google: ["gemini-2.5-flash", "gemini-flash-latest", "gemini-2.0-flash"],
};

const PROMPT_SAMPLE_ROWS  = 20;
const MAX_CHART_ROWS_LINE = 15;
const MAX_CHART_ROWS_AGG  = 20;

function summarizeChartData(chart: ChartConfig): string {
  const isTimeSeries = chart.type === "line";
  const limit = isTimeSeries ? MAX_CHART_ROWS_LINE : MAX_CHART_ROWS_AGG;
  const data = chart.data.slice(0, limit);

  if (chart.type === "line" && chart.yKey) {
    const values = chart.data
      .map((r) => Number(r[chart.yKey!]))
      .filter((v) => !isNaN(v));
    if (values.length > 0) {
      const min   = Math.min(...values).toLocaleString("pt-BR");
      const max   = Math.max(...values).toLocaleString("pt-BR");
      const avg   = (values.reduce((a, b) => a + b, 0) / values.length).toLocaleString("pt-BR", { maximumFractionDigits: 2 });
      const total = values.reduce((a, b) => a + b, 0).toLocaleString("pt-BR", { maximumFractionDigits: 2 });
      const stats = `  Stats(${values.length}pts): min=${min}|max=${max}|avg=${avg}|total=${total}`;
      const sample = `  Amostra(${data.length}/${chart.data.length}pts):${JSON.stringify(data)}`;
      return `${stats}\n${sample}`;
    }
  }

  return `  Dados(${data.length}):${JSON.stringify(data)}`;
}

const SYSTEM_PROMPT = `Você é um analista de dados sênior reportando diretamente ao CEO.

REGRAS ABSOLUTAS — desobedecer invalida a análise:
1. USE apenas números reais dos dados fornecidos. Zero invenção.
2. PROIBIDO tempo futuro: nunca use "vai", "irá", "tende", "poderá", "pode crescer" ou qualquer forma preditiva.
3. PROIBIDO generalizar sem número: "alta variação" sem valor exato = inválido.
4. PROIBIDO encher linguiça: cada frase deve conter um fato ou um número concreto.
5. Se um dado não estiver presente nos dados, escreva "Dado não disponível" — nunca suponha.
6. Tom: técnico, direto, sem elogios, sem prefácios, sem conclusões motivacionais.`;

function buildDataPrompt(
  columnsMeta: ColumnMeta[],
  sampleRows: Record<string, unknown>[],
  chartsConfig: ChartConfig[]
): string {
  const columnsDesc = columnsMeta
    .map((c) => {
      const stats = c.stats;
      const extra: string[] = [`valores únicos: ${stats.uniqueCount}`];
      if (stats.min !== undefined) extra.push(`min: ${stats.min}`);
      if (stats.max !== undefined) extra.push(`max: ${stats.max}`);
      return `- ${c.name} (${c.type}) — ${extra.join(", ")}`;
    })
    .join("\n");

  const sample = sampleRows.slice(0, PROMPT_SAMPLE_ROWS);

  const chartsDesc = chartsConfig
    .map((chart, i) => {
      const typeLabel: Record<string, string> = {
        line:          "Gráfico de Linha",
        bar:           "Gráfico de Barras",
        pie:           "Gráfico de Pizza",
        barHorizontal: "Gráfico de Barras Horizontal",
        table:         "Tabela",
      };
      const label = typeLabel[chart.type] ?? chart.type;
      return `### Gráfico ${i + 1}: "${chart.title}" (${label})
- Eixo X: ${chart.xKey}${chart.yKey ? ` | Eixo Y: ${chart.yKey}` : ""}
${summarizeChartData(chart)}`;
    })
    .join("\n\n");

  const chartSections = chartsConfig.map((c) => `### ${c.title}\n[1-2 frases com padrão real + número exato dos dados acima]`).join("\n\n");

  return `## Colunas detectadas (${columnsMeta.length} colunas):
${columnsDesc}

## Amostra de dados brutos (${sample.length} linhas):
${JSON.stringify(sample)}

## Gráficos gerados e seus dados reais:

${chartsDesc}

---

Responda EXATAMENTE nesta estrutura Markdown, sem adicionar ou remover seções:

## Resumo Executivo
• [fato principal com número real]
• [segundo fato com número real]
• [terceiro fato com número real — máximo 3 bullets]

## Análise dos Dados

${chartSections}

## Pontos de Atenção
• [anomalia, concentração ou outlier real detectado nos dados — sem prescrever ação futura]
• [máximo 3 bullets — descreva só o que os dados mostram]`;
}

function createModel(provider: string, apiKey: string, modelName: string) {
  switch (provider) {
    case "openai":
      return createOpenAI({ apiKey })(modelName);
    case "anthropic":
      return createAnthropic({ apiKey })(modelName);
    case "google":
      return createGoogleGenerativeAI({ apiKey })(modelName);
    case "groq":
      return createGroq({ apiKey })(modelName);
    default:
      throw new Error(`Provider não suportado: ${provider}`);
  }
}

/**
 * Analyzes spreadsheet data using a plaintext AI provider API key.
 * Caller is responsible for decrypting stored keys before passing them here.
 * Tries the default model first, then falls back to alternatives on failure.
 * NEVER log the apiKey or return it in any response.
 */
export async function analyzeWithAI(
  provider: string,
  apiKey: string,
  columnsMeta: ColumnMeta[],
  sampleRows: Record<string, unknown>[],
  chartsConfig: ChartConfig[] = []
): Promise<string> {
  const defaultModel = DEFAULT_MODELS[provider];
  if (!defaultModel) {
    throw new Error(`Provider não suportado: ${provider}`);
  }

  const dataPrompt = buildDataPrompt(columnsMeta, sampleRows, chartsConfig);
  const modelsToTry = [defaultModel, ...(FALLBACK_MODELS[provider] ?? [])];

  let lastError: Error | null = null;

  const uniqueModels = Array.from(new Set(modelsToTry));
  for (const modelName of uniqueModels) {
    try {
      const model = createModel(provider, apiKey, modelName);
      const result = await generateText({ model, system: SYSTEM_PROMPT, prompt: dataPrompt, maxTokens: 1200 });
      return result.text;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      const msg = lastError.message.toLowerCase();

      // Retry only on model-not-found or transient service errors.
      // Do NOT use broad terms like "model" — quota errors mention "model" and should fail fast.
      if (
        msg.includes("not found") ||
        msg.includes("not supported") ||
        msg.includes("service_unavailable") ||
        msg.includes("503")
      ) {
        continue;
      }

      // Auth, quota, expired, billing — fail immediately
      throw lastError;
    }
  }

  throw lastError ?? new Error("Falha ao conectar com a IA");
}
