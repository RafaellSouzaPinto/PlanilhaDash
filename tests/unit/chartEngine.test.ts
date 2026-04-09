import { describe, it, expect } from "vitest";
import { buildChartConfigs } from "@/lib/chartEngine";
import type { ColumnMeta } from "@/types/spreadsheet";

function col(
  name: string,
  type: ColumnMeta["type"],
  uniqueCount = 10
): ColumnMeta {
  return {
    name,
    type,
    stats: { uniqueCount, sampleValues: [] },
  };
}

describe("buildChartConfigs", () => {
  it("retorna array vazio quando não há colunas", () => {
    expect(buildChartConfigs([])).toEqual([]);
  });

  it("retorna gráfico de linha para date × number", () => {
    const configs = buildChartConfigs([col("data", "date"), col("valor", "number")]);
    expect(configs.some((c) => c.type === "line")).toBe(true);
  });

  it("retorna gráfico de barras para categorical × number", () => {
    const configs = buildChartConfigs([
      col("dept", "categorical", 3),
      col("salario", "number"),
    ]);
    expect(configs.some((c) => c.type === "bar")).toBe(true);
  });

  it("retorna pizza para categorical com ≤ 8 únicos", () => {
    const configs = buildChartConfigs([col("status", "categorical", 5)]);
    expect(configs.some((c) => c.type === "pie")).toBe(true);
  });

  it("NÃO retorna pizza para categorical com > 8 únicos", () => {
    const configs = buildChartConfigs([col("cidade", "categorical", 50)]);
    expect(configs.some((c) => c.type === "pie")).toBe(false);
  });

  it("retorna tabela como fallback quando não há combinação reconhecida", () => {
    const configs = buildChartConfigs([col("nome", "text"), col("obs", "text")]);
    expect(configs.length).toBeGreaterThan(0);
    expect(configs[0].type).toBe("table");
  });

  it("NUNCA retorna mais de 4 gráficos", () => {
    const cols = [
      col("data", "date"),
      col("v1", "number"),
      col("v2", "number"),
      col("v3", "number"),
      col("v4", "number"),
      col("cat", "categorical", 3),
      col("pct", "percentage"),
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
    expect(configs[0].type).toBe("line");
  });

  it("retorna barHorizontal para coluna de percentage com categorical", () => {
    const configs = buildChartConfigs([
      col("regiao", "categorical", 4),
      col("taxa", "percentage"),
    ]);
    expect(configs.some((c) => c.type === "barHorizontal")).toBe(true);
  });

  it("título de gráfico é uma string não vazia", () => {
    const configs = buildChartConfigs([col("data", "date"), col("valor", "number")]);
    for (const c of configs) {
      expect(c.title).toBeTruthy();
      expect(typeof c.title).toBe("string");
    }
  });
});
