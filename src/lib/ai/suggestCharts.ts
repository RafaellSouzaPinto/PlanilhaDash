import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createGroq } from "@ai-sdk/groq";
import { z } from "zod";
import type { ColumnMeta, ChartSuggestion, ChartType } from "@/types/spreadsheet";

const AI_SAMPLE_ROWS = Number(process.env.AI_SAMPLE_ROWS ?? 50);

const DEFAULT_MODELS: Record<string, string> = {
  openai:    "gpt-4o-mini",
  anthropic: "claude-3-haiku-20240307",
  google:    "gemini-2.5-flash",
  groq:      "llama-3.1-8b-instant",
};

const FALLBACK_MODELS: Record<string, string[]> = {
  google: ["gemini-2.5-flash", "gemini-flash-latest", "gemini-2.0-flash"],
};

const VALID_CHART_TYPES = new Set<ChartType>([
  "line",
  "bar",
  "pie",
  "barHorizontal",
  "table",
]);

const suggestionItemSchema = z.object({
  type: z.string(),
  xKey: z.string().min(1),
  yKey: z.string().optional(),
  title: z.string().min(1),
  rationale: z.string(),
  priority: z.number().int().positive(),
});

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

const SUGGEST_SYSTEM_PROMPT = `Você é um especialista em visualização de dados.

TAREFA: Analisar os metadados e dados de uma planilha e sugerir entre 2 e 6 gráficos contextuais relevantes.

REGRAS ABSOLUTAS:
1. Responda APENAS com um array JSON válido. Nenhum texto antes ou depois. Nenhum markdown.
2. Cada objeto deve ter: "type", "xKey", "title", "rationale", "priority". O campo "yKey" é obrigatório para types "line", "bar" e "barHorizontal".
3. "type" deve ser um dos seguintes valores EXATOS: "line", "bar", "pie", "barHorizontal", "table".
4. "xKey" e "yKey" devem ser nomes EXATOS de colunas da lista fornecida — nenhuma invenção.
5. "rationale" deve conter um fato concreto dos dados (número, proporção, ou padrão observado). Máximo 2 frases.
6. "priority" é um inteiro começando em 1 (mais relevante primeiro).
7. Máximo 6 sugestões. Não repita combinações de colunas idênticas.
8. Para "pie": use apenas colunas com uniqueCount <= 8.
9. Para "line": use apenas colunas do tipo "date" no xKey.
10. Se os dados não comportarem gráficos significativos, retorne um array com um único item do tipo "table".`;

function buildSuggestionsPrompt(
  columnsMeta: ColumnMeta[],
  sampleRows: Record<string, unknown>[]
): string {
  const colDesc = columnsMeta
    .map((c) => {
      const parts = [`${c.name} (${c.type})`, `únicos: ${c.stats.uniqueCount}`];
      if (c.stats.min !== undefined) parts.push(`min: ${c.stats.min}`);
      if (c.stats.max !== undefined) parts.push(`max: ${c.stats.max}`);
      if (c.stats.sampleValues.length > 0) {
        parts.push(`amostras: ${JSON.stringify(c.stats.sampleValues.slice(0, 3))}`);
      }
      return `- ${parts.join(" | ")}`;
    })
    .join("\n");

  const sample = sampleRows.slice(0, AI_SAMPLE_ROWS);

  return `## Colunas disponíveis (${columnsMeta.length}):\n${colDesc}\n\n## Amostra de dados (${sample.length} linhas):\n${JSON.stringify(sample)}`;
}

/**
 * Asks the AI provider to suggest contextually relevant charts.
 * Accepts a plaintext apiKey — caller is responsible for decrypting stored keys.
 * NEVER logs the apiKey.
 * Returns array of ChartSuggestion (may be empty — caller handles fallback).
 */
export async function suggestChartsWithAI(
  provider: string,
  apiKey: string,
  columnsMeta: ColumnMeta[],
  sampleRows: Record<string, unknown>[]
): Promise<ChartSuggestion[]> {
  const defaultModel = DEFAULT_MODELS[provider];
  if (!defaultModel) throw new Error(`Provider não suportado: ${provider}`);

  const dataPrompt = buildSuggestionsPrompt(columnsMeta, sampleRows);
  const columnNames = new Set(columnsMeta.map((c) => c.name));

  const modelsToTry = Array.from(
    new Set([defaultModel, ...(FALLBACK_MODELS[provider] ?? [])])
  );

  let lastError: Error | null = null;

  for (const modelName of modelsToTry) {
    try {
      const model = createModel(provider, apiKey, modelName);
      const result = await generateText({
        model,
        system: SUGGEST_SYSTEM_PROMPT,
        prompt: dataPrompt,
        maxTokens: 800,
      });

      let raw: unknown;
      try {
        raw = JSON.parse(result.text.trim());
      } catch {
        throw new Error("AI retornou JSON inválido");
      }

      if (!Array.isArray(raw)) {
        throw new Error("Formato de resposta inválido: esperado array");
      }

      const suggestions: ChartSuggestion[] = [];
      for (const item of raw) {
        const parsed = suggestionItemSchema.safeParse(item);
        if (!parsed.success) continue;

        const { type, xKey, yKey, title, rationale, priority } = parsed.data;

        if (!VALID_CHART_TYPES.has(type as ChartType)) continue;
        if (!columnNames.has(xKey)) continue;
        if (yKey !== undefined && !columnNames.has(yKey)) continue;

        suggestions.push({
          type: type as ChartType,
          xKey,
          yKey,
          title,
          rationale,
          priority,
        });
      }

      return suggestions.sort((a, b) => a.priority - b.priority);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      const msg = lastError.message.toLowerCase();

      // Retry only on model-not-found or transient service errors
      if (
        msg.includes("not found") ||
        msg.includes("not supported") ||
        msg.includes("service_unavailable") ||
        msg.includes("503")
      ) {
        continue;
      }

      // Auth, quota, billing, JSON parse errors — fail immediately
      throw lastError;
    }
  }

  throw lastError ?? new Error("Falha ao conectar com a IA");
}
