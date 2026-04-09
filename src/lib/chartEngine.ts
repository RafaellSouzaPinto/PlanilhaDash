import type { ChartConfig, ChartType, ColumnMeta } from "@/types/spreadsheet";

const MAX_CHARTS = 4;
const MAX_PIE_UNIQUE = 8;

// Chart colors palette
export const CHART_COLORS = [
  "#2563eb", // blue-600
  "#16a34a", // green-600
  "#dc2626", // red-600
  "#ca8a04", // yellow-600
  "#9333ea", // purple-600
  "#0891b2", // cyan-600
  "#ea580c", // orange-600
  "#be185d", // pink-600
];

export function buildChartConfigs(
  columns: ColumnMeta[],
  rows: Record<string, unknown>[] = []
): ChartConfig[] {
  if (columns.length === 0) return [];

  const configs: ChartConfig[] = [];

  const dateColumns = columns.filter((c) => c.type === "date");
  const numericColumns = columns.filter(
    (c) => c.type === "number" || c.type === "currency"
  );
  const categoricalColumns = columns.filter((c) => c.type === "categorical");
  const percentageColumns = columns.filter((c) => c.type === "percentage");

  // Priority 1: Line charts — date × numeric
  for (const dateCol of dateColumns) {
    for (const numCol of numericColumns) {
      if (configs.length >= MAX_CHARTS) break;
      configs.push({
        type: "line",
        xKey: dateCol.name,
        yKey: numCol.name,
        title: `${numCol.name} ao longo do tempo`,
        data: rows.map((r) => ({
          [dateCol.name]: r[dateCol.name],
          [numCol.name]: r[numCol.name],
        })),
      });
    }
    if (configs.length >= MAX_CHARTS) break;
  }

  // Priority 2: Bar charts — categorical × numeric
  if (configs.length < MAX_CHARTS) {
    for (const catCol of categoricalColumns) {
      for (const numCol of numericColumns) {
        if (configs.length >= MAX_CHARTS) break;
        // Avoid duplicating a column already used in a line chart
        const data = aggregateBarData(rows, catCol.name, numCol.name);
        configs.push({
          type: "bar",
          xKey: catCol.name,
          yKey: numCol.name,
          title: `${numCol.name} por ${catCol.name}`,
          data,
        });
      }
      if (configs.length >= MAX_CHARTS) break;
    }
  }

  // Priority 3: Pie charts — categorical with ≤ MAX_PIE_UNIQUE unique values
  if (configs.length < MAX_CHARTS) {
    for (const catCol of categoricalColumns) {
      if (configs.length >= MAX_CHARTS) break;
      if (catCol.stats.uniqueCount <= MAX_PIE_UNIQUE) {
        // Check we haven't already made a bar chart for this column
        const alreadyUsed = configs.some(
          (c) => c.xKey === catCol.name && c.type === "bar"
        );
        if (!alreadyUsed) {
          const data = countByCategory(rows, catCol.name);
          configs.push({
            type: "pie",
            xKey: catCol.name,
            title: `Distribuição de ${catCol.name}`,
            data,
          });
        }
      }
    }
  }

  // Priority 4: Horizontal bar — percentage columns
  if (configs.length < MAX_CHARTS) {
    for (const pctCol of percentageColumns) {
      if (configs.length >= MAX_CHARTS) break;
      // Pair with a categorical if available, otherwise use index
      const catCol = categoricalColumns[0];
      if (catCol) {
        const data = rows.slice(0, 20).map((r) => ({
          [catCol.name]: r[catCol.name],
          [pctCol.name]: parsePercentage(r[pctCol.name]),
        }));
        configs.push({
          type: "barHorizontal",
          xKey: pctCol.name,
          yKey: catCol.name,
          title: `${pctCol.name} (%)`,
          data,
        });
      }
    }
  }

  // Fallback: table when no chart was produced
  if (configs.length === 0) {
    configs.push({
      type: "table",
      xKey: columns[0]?.name ?? "",
      title: "Dados da planilha",
      data: rows.slice(0, 50),
    });
  }

  return configs.slice(0, MAX_CHARTS);
}

function aggregateBarData(
  rows: Record<string, unknown>[],
  catKey: string,
  numKey: string
): Record<string, unknown>[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const cat = String(row[catKey] ?? "N/A");
    const num = Number(row[numKey] ?? 0);
    map.set(cat, (map.get(cat) ?? 0) + num);
  }
  return Array.from(map.entries()).map(([k, v]) => ({
    [catKey]: k,
    [numKey]: Math.round(v * 100) / 100,
  }));
}

function countByCategory(
  rows: Record<string, unknown>[],
  catKey: string
): Record<string, unknown>[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const cat = String(row[catKey] ?? "N/A");
    map.set(cat, (map.get(cat) ?? 0) + 1);
  }
  return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
}

function parsePercentage(value: unknown): number {
  if (typeof value === "number") return value;
  const str = String(value).replace("%", "").trim();
  return parseFloat(str) || 0;
}
