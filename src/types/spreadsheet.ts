export type ColumnType =
  | "number"
  | "currency"
  | "percentage"
  | "date"
  | "categorical"
  | "text";

export type ChartType = "line" | "bar" | "pie" | "barHorizontal" | "table";

export interface ColumnStats {
  min?: number;
  max?: number;
  uniqueCount: number;
  sampleValues: unknown[];
}

export interface ColumnMeta {
  name: string;
  type: ColumnType;
  stats: ColumnStats;
}

export interface ChartConfig {
  type: ChartType;
  xKey: string;
  yKey?: string;
  title: string;
  data: Record<string, unknown>[];
}

/**
 * Uma sugestão de gráfico gerada pela IA.
 * Tipo transiente — nunca persistido no banco.
 */
export interface ChartSuggestion {
  type: ChartType;
  xKey: string;
  yKey?: string;
  title: string;
  /** Justificativa factual da IA. String vazia quando vem do fallback determinístico. */
  rationale: string;
  /** Prioridade da sugestão — 1 = mais relevante. */
  priority: number;
}

/** Resposta da API POST /api/ai-chart-suggestions */
export interface ChartSuggestionsResponse {
  suggestions: ChartSuggestion[];
  /** true se houve fallback por erro ou resposta vazia da IA */
  fallback: boolean;
  fallbackReason: string | null;
}
