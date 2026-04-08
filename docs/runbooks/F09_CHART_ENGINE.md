# F09 — Chart Engine (Seleção e Renderização de Gráficos)

**Lib:** `src/lib/chartEngine.ts`
**Componentes:** `ChartGrid.tsx`, `ChartCard.tsx`, `DataTable.tsx`
**Testes:** [T09_CHART_ENGINE.md](../testes/T09_CHART_ENGINE.md)

---

## Fluxo

```
inferTypes(rows) → ColumnMeta[]     ← ver F05
  │
  ▼
buildChartConfigs(columns) → ChartConfig[]
  │  Analisa combinações de colunas
  │  Seleciona até 4 gráficos
  │  Se nenhuma combinação → tabela de fallback
  ▼
ChartGrid renderiza ChartCard[] via Recharts
```

---

## Arquivos envolvidos

| Arquivo | Responsabilidade |
|---------|-----------------|
| `src/lib/chartEngine.ts` | Algoritmo de seleção de gráficos |
| `src/components/dashboard/ChartGrid.tsx` | Grid responsivo com até 4 cards |
| `src/components/dashboard/ChartCard.tsx` | Card individual por tipo de gráfico |
| `src/components/dashboard/DataTable.tsx` | Tabela de fallback |

---

## Lógica de seleção (`src/lib/chartEngine.ts`)

```ts
const MAX_CHARTS = 4;

export function buildChartConfigs(columns: ColumnMeta[]): ChartConfig[] {
  const configs: ChartConfig[] = [];

  const dates        = columns.filter(c => c.type === "date");
  const numerics     = columns.filter(c => c.type === "number" || c.type === "currency");
  const categoricals = columns.filter(c => c.type === "categorical");
  const percentages  = columns.filter(c => c.type === "percentage");

  // 1. Linha temporal (date × numeric)
  for (const d of dates) {
    for (const n of numerics) {
      if (configs.length >= MAX_CHARTS) break;
      configs.push({ type: "line", xColumn: d.name, yColumn: n.name, title: `${n.name} ao longo do tempo` });
    }
  }

  // 2. Barras verticais (categorical × numeric)
  for (const c of categoricals) {
    for (const n of numerics) {
      if (configs.length >= MAX_CHARTS) break;
      configs.push({ type: "bar", xColumn: c.name, yColumn: n.name, title: `${n.name} por ${c.name}` });
    }
  }

  // 3. Pizza (categorical com ≤ 8 únicos, sem par numérico já usado)
  for (const c of categoricals.filter(col => col.stats.uniqueCount <= 8)) {
    if (configs.length >= MAX_CHARTS) break;
    if (!configs.some(cfg => cfg.xColumn === c.name && cfg.type !== "bar")) {
      configs.push({ type: "pie", xColumn: c.name, title: `Distribuição de ${c.name}` });
    }
  }

  // 4. Barras horizontais (percentage)
  for (const p of percentages) {
    if (configs.length >= MAX_CHARTS) break;
    configs.push({ type: "barHorizontal", xColumn: p.name, title: `${p.name} (%)` });
  }

  // Fallback: tabela
  if (configs.length === 0) {
    configs.push({ type: "table", xColumn: columns[0]?.name ?? "", title: "Dados" });
  }

  return configs.slice(0, MAX_CHARTS);
}
```

## Tabela de decisão

| Prioridade | Tipo X | Tipo Y | Gráfico |
|:---:|--------|--------|---------|
| 1 | `date` | `number`/`currency` | Linha temporal |
| 2 | `categorical` | `number`/`currency` | Barras verticais |
| 3 | `categorical` (≤ 8 únicos) | — | Pizza |
| 4 | `percentage` | — | Barras horizontais |
| — | — | — | Tabela (fallback) |

**Limite:** máximo **4 gráficos** por dashboard — nunca ultrapassar.

---

## Código — ChartCard (Recharts)

```tsx
const COLORS = ["#2563eb", "#16a34a", "#dc2626", "#d97706", "#7c3aed", "#0891b2", "#be185d", "#65a30d"];

export function ChartCard({ config, data }: ChartCardProps) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-sm font-medium">{config.title}</CardTitle></CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          {renderChart(config, data, COLORS)}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
```

---

## Regras de negócio

1. **Máximo 4 gráficos** — `buildChartConfigs` nunca retorna mais que isso
2. Fallback de tabela **apenas** quando nenhuma combinação válida é encontrada
3. `ResponsiveContainer` obrigatório — nunca definir width/height fixo nos gráficos Recharts
4. Array de cores `COLORS` definido no componente — não em config global
