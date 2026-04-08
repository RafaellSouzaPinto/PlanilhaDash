# M03 — Chart Engine e Dashboard

**Status:** 🚧 Em desenvolvimento

---

## Arquivos envolvidos

| Arquivo | Responsabilidade |
|---------|-----------------|
| `src/lib/chartEngine.ts` | Seleciona quais gráficos gerar |
| `src/components/dashboard/ChartGrid.tsx` | Grid com até 4 gráficos |
| `src/components/dashboard/ChartCard.tsx` | Card individual de gráfico |
| `src/components/dashboard/DataTable.tsx` | Tabela de fallback |

---

## Chart Engine (`src/lib/chartEngine.ts`)

### Lógica de seleção

```ts
import type { ColumnMeta, ChartConfig, ChartType } from "@/types/spreadsheet";

const MAX_CHARTS = 4;

export function buildChartConfigs(columns: ColumnMeta[]): ChartConfig[] {
  const configs: ChartConfig[] = [];

  const dates         = columns.filter(c => c.type === "date");
  const numerics      = columns.filter(c => c.type === "number" || c.type === "currency");
  const categoricals  = columns.filter(c => c.type === "categorical");
  const percentages   = columns.filter(c => c.type === "percentage");

  // 1. Linha temporal: date × numeric
  for (const d of dates) {
    for (const n of numerics) {
      if (configs.length >= MAX_CHARTS) break;
      configs.push({ type: "line", xColumn: d.name, yColumn: n.name, title: `${n.name} ao longo do tempo` });
    }
  }

  // 2. Barras: categorical × numeric
  for (const c of categoricals) {
    for (const n of numerics) {
      if (configs.length >= MAX_CHARTS) break;
      configs.push({ type: "bar", xColumn: c.name, yColumn: n.name, title: `${n.name} por ${c.name}` });
    }
  }

  // 3. Pizza: categorical com poucos valores únicos (≤ 8)
  for (const c of categoricals.filter(col => col.stats.uniqueCount <= 8)) {
    if (configs.length >= MAX_CHARTS) break;
    if (!configs.some(cfg => cfg.xColumn === c.name)) {
      configs.push({ type: "pie", xColumn: c.name, title: `Distribuição de ${c.name}` });
    }
  }

  // 4. Barras horizontais: percentage
  for (const p of percentages) {
    if (configs.length >= MAX_CHARTS) break;
    configs.push({ type: "barHorizontal", xColumn: p.name, title: `${p.name} (%)` });
  }

  // 5. Fallback: tabela
  if (configs.length === 0) {
    configs.push({ type: "table", xColumn: columns[0]?.name ?? "", title: "Dados" });
  }

  return configs.slice(0, MAX_CHARTS);
}
```

### Tabela de decisão

| Condição | Gráfico |
|----------|---------|
| Coluna `date` + coluna `number`/`currency` | Linha temporal |
| Coluna `categorical` + coluna `number`/`currency` | Barras verticais |
| Coluna `categorical` com ≤ 8 únicos (sem par numérico) | Pizza |
| Coluna `percentage` | Barras horizontais |
| Nenhuma combinação encontrada | Tabela (fallback) |

**Máximo:** 4 gráficos por dashboard.

---

## Componentes Recharts

### ChartCard (`components/dashboard/ChartCard.tsx`)

```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip } from "recharts";
import type { ChartConfig } from "@/types/spreadsheet";

const COLORS = ["#2563eb", "#16a34a", "#dc2626", "#d97706", "#7c3aed", "#0891b2", "#be185d", "#65a30d"];

interface ChartCardProps {
  config: ChartConfig;
  data:   Record<string, unknown>[];
}

export function ChartCard({ config, data }: ChartCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">{config.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          {renderChart(config, data)}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
```

### Renderização por tipo

```ts
function renderChart(config: ChartConfig, data: Record<string, unknown>[]) {
  switch (config.type) {
    case "bar":
      return (
        <BarChart data={data}>
          <XAxis dataKey={config.xColumn} />
          <YAxis />
          <Tooltip />
          <Bar dataKey={config.yColumn!} fill={COLORS[0]} />
        </BarChart>
      );
    case "line":
      return (
        <LineChart data={data}>
          <XAxis dataKey={config.xColumn} />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey={config.yColumn!} stroke={COLORS[0]} dot={false} />
        </LineChart>
      );
    case "pie":
      return (
        <PieChart>
          <Pie data={data} dataKey="value" nameKey={config.xColumn} cx="50%" cy="50%" outerRadius={100}>
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
          <Tooltip />
        </PieChart>
      );
    // barHorizontal e table → implementar analogamente
  }
}
```

---

## Testes relacionados

Ver [../testes/T03_CHART_ENGINE.md](../testes/T03_CHART_ENGINE.md)
