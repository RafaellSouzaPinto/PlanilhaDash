# T09 — Testes: Chart Engine

**Feature:** [F09_CHART_ENGINE.md](../runbooks/F09_CHART_ENGINE.md)
**Lib:** `src/lib/chartEngine.ts`

---

## Testes manuais

- [ ] Planilha com coluna de data + coluna numérica → gráfico de **linha** gerado
- [ ] Planilha com coluna categórica + coluna numérica → gráfico de **barras** gerado
- [ ] Coluna categórica com ≤ 8 únicos sem par numérico → gráfico de **pizza** gerado
- [ ] Planilha sem combinação reconhecida → **tabela** de fallback gerada
- [ ] Planilha com muitas colunas → **no máximo 4 gráficos** (nunca 5+)
- [ ] Gráficos renderizam sem erro no console (sem warnings do Recharts)
- [ ] `ResponsiveContainer` ajusta corretamente em mobile (testar em 375px de largura)
- [ ] Dashboard com 4 gráficos → grid 2×2 em desktop, 1 coluna em mobile

---

## Testes automatizados

```ts
// tests/unit/chartEngine.test.ts
import { buildChartConfigs } from "@/lib/chartEngine";
import type { ColumnMeta } from "@/types/spreadsheet";

const col = (name: string, type: ColumnMeta["type"], uniqueCount = 10): ColumnMeta => ({
  name, type, stats: { uniqueCount, sampleValues: [] }
});

describe("buildChartConfigs", () => {
  it("retorna gráfico de linha para date × number", () => {
    const configs = buildChartConfigs([col("data", "date"), col("valor", "number")]);
    expect(configs.some(c => c.type === "line")).toBe(true);
  });

  it("retorna gráfico de barras para categorical × number", () => {
    const configs = buildChartConfigs([col("dept", "categorical", 3), col("salario", "number")]);
    expect(configs.some(c => c.type === "bar")).toBe(true);
  });

  it("retorna pizza para categorical com ≤ 8 únicos", () => {
    const configs = buildChartConfigs([col("status", "categorical", 5)]);
    expect(configs.some(c => c.type === "pie")).toBe(true);
  });

  it("NÃO retorna pizza para categorical com > 8 únicos", () => {
    const configs = buildChartConfigs([col("cidade", "categorical", 50)]);
    expect(configs.some(c => c.type === "pie")).toBe(false);
  });

  it("retorna tabela como fallback quando não há combinação", () => {
    const configs = buildChartConfigs([col("nome", "text"), col("obs", "text")]);
    expect(configs[0].type).toBe("table");
  });

  it("NUNCA retorna mais de 4 gráficos", () => {
    const cols = [
      col("data",  "date"),
      col("v1",    "number"),
      col("v2",    "number"),
      col("v3",    "number"),
      col("v4",    "number"),
      col("cat",   "categorical", 3),
      col("pct",   "percentage"),
    ];
    const configs = buildChartConfigs(cols);
    expect(configs.length).toBeLessThanOrEqual(4);
  });

  it("prioriza linha temporal sobre barras", () => {
    const configs = buildChartConfigs([
      col("data", "date"),
      col("valor", "number"),
      col("cat", "categorical", 3),
    ]);
    expect(configs[0].type).toBe("line"); // linha aparece primeiro
  });

  it("retorna array vazio de configs apenas quando há 0 colunas", () => {
    const configs = buildChartConfigs([]);
    expect(configs.length).toBe(0);
  });
});
```
