import type { ColumnMeta, ChartSuggestion } from "@/types/spreadsheet";

export const sampleColumnsMeta: ColumnMeta[] = [
  {
    name: "data",
    type: "date",
    stats: {
      uniqueCount: 24,
      sampleValues: ["2024-01-01", "2024-02-01", "2024-03-01"],
    },
  },
  {
    name: "região",
    type: "categorical",
    stats: { uniqueCount: 6, sampleValues: ["Sul", "Norte", "Leste"] },
  },
  {
    name: "total_vendas",
    type: "number",
    stats: {
      min: 1000,
      max: 87200,
      uniqueCount: 24,
      sampleValues: [12000, 45000, 67000],
    },
  },
  {
    name: "margem",
    type: "percentage",
    stats: {
      min: 5,
      max: 42,
      uniqueCount: 20,
      sampleValues: ["12%", "28%", "35%"],
    },
  },
];

export const sampleRows: Record<string, unknown>[] = [
  { data: "2024-01-01", região: "Sul",   total_vendas: 45000, margem: "28%" },
  { data: "2024-02-01", região: "Norte", total_vendas: 32000, margem: "22%" },
  { data: "2024-03-01", região: "Leste", total_vendas: 67000, margem: "35%" },
];

export const mockAISuggestions: ChartSuggestion[] = [
  {
    type: "bar",
    xKey: "região",
    yKey: "total_vendas",
    title: "Total de Vendas por Região",
    rationale: "6 regiões com alta variação (max: 87.200). Barras facilitam comparação direta.",
    priority: 1,
  },
  {
    type: "line",
    xKey: "data",
    yKey: "total_vendas",
    title: "Evolução de Vendas ao Longo do Tempo",
    rationale: "Série temporal de 24 meses. Permite identificar tendências.",
    priority: 2,
  },
  {
    type: "pie",
    xKey: "região",
    title: "Distribuição por Região",
    rationale: "6 categorias distintas (≤ 8). Pizza revela participação relativa.",
    priority: 3,
  },
];

// Valid AI JSON response (no markdown)
export const validMockAIResponse = JSON.stringify(mockAISuggestions);

// Problematic responses for robustness tests
export const invalidJsonResponse =
  "Aqui estão os gráficos sugeridos: bar, line, pie.";

export const emptyArrayResponse = "[]";

export const responseWithInvalidColumns = JSON.stringify([
  {
    type: "bar",
    xKey: "coluna_inexistente",
    yKey: "total_vendas",
    title: "Gráfico Inválido",
    rationale: "Teste.",
    priority: 1,
  },
]);

export const responseWithInvalidChartType = JSON.stringify([
  {
    type: "scatter",
    xKey: "data",
    yKey: "total_vendas",
    title: "Scatter Plot",
    rationale: "Teste.",
    priority: 1,
  },
]);

export const mixedValidInvalidResponse = JSON.stringify([
  {
    type: "bar",
    xKey: "região",
    yKey: "total_vendas",
    title: "Bar Válido",
    rationale: "Válido.",
    priority: 1,
  },
  {
    type: "scatter",
    xKey: "data",
    yKey: "total_vendas",
    title: "Scatter Inválido",
    rationale: "Inválido.",
    priority: 2,
  },
]);
