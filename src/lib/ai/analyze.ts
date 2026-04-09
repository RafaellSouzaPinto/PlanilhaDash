import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createGroq } from "@ai-sdk/groq";
import { decryptApiKey } from "@/lib/crypto/apiKey";
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

function buildPrompt(
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

  const chartTitles = chartsConfig.map((c, i) => `### ${c.title}`).join("\n");

  return `Você é um analista de dados especialista.

REGRAS IMPORTANTES:
- NÃO invente informações
- NÃO faça suposições genéricas
- Use APENAS os dados fornecidos abaixo
- Se faltar informação, diga explicitamente
- Use números reais dos dados em cada análise

---

## Colunas detectadas (${columnsMeta.length} colunas):
${columnsDesc}

## Amostra de dados brutos (${sample.length} linhas):
${JSON.stringify(sample)}

## Os 4 gráficos gerados e seus dados reais:

${chartsDesc}

---

Analise profundamente os gráficos acima e responda EXATAMENTE nesta estrutura Markdown:

## Resumo Executivo
(2-3 frases diretas com os principais achados baseados nos dados reais)

## Análise por Gráfico

${chartTitles}
(Para cada gráfico: identifique padrões reais com números — picos, quedas, ciclos, categorias dominantes)

## Correlações entre os Gráficos
(Relacione o que acontece em um gráfico com o que acontece nos outros. Use números.)

## Insights e Recomendações
(3-5 ações práticas e específicas baseadas apenas nos dados fornecidos)`;
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
 * Analyzes spreadsheet data using the user's own AI provider API key.
 * Tries the default model first, then falls back to alternatives on failure.
 * NEVER log the API key or return it in any response.
 */
export async function analyzeWithAI(
  provider: string,
  encryptedKey: string,
  columnsMeta: ColumnMeta[],
  sampleRows: Record<string, unknown>[],
  chartsConfig: ChartConfig[] = []
): Promise<string> {
  // Decrypt key — used in memory only, never logged
  const apiKey = decryptApiKey(encryptedKey);

  const defaultModel = DEFAULT_MODELS[provider];
  if (!defaultModel) {
    throw new Error(`Provider não suportado: ${provider}`);
  }

  const prompt = buildPrompt(columnsMeta, sampleRows, chartsConfig);
  const modelsToTry = [defaultModel, ...(FALLBACK_MODELS[provider] ?? [])];

  let lastError: Error | null = null;

  const uniqueModels = Array.from(new Set(modelsToTry));
  for (const modelName of uniqueModels) {
    try {
      const model = createModel(provider, apiKey, modelName);
      const result = await generateText({ model, prompt, maxTokens: 2500 });
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
