import { describe, it, expect } from "vitest";
import { buildChartFromSuggestion } from "@/lib/chartEngine";
import { sampleRows } from "../fixtures/m08";
import type { ChartSuggestion } from "@/types/spreadsheet";

describe("buildChartFromSuggestion()", () => {
  it("T-B01: converte sugestão bar em ChartConfig com dados agregados", () => {
    const suggestion: ChartSuggestion = {
      type: "bar",
      xKey: "região",
      yKey: "total_vendas",
      title: "Vendas por Região",
      rationale: "Teste.",
      priority: 1,
    };

    const result = buildChartFromSuggestion(suggestion, sampleRows);

    expect(result.type).toBe("bar");
    expect(result.xKey).toBe("região");
    expect(result.yKey).toBe("total_vendas");
    expect(result.title).toBe("Vendas por Região");

    // 3 distinct regions
    expect(result.data).toHaveLength(3);
    const sul = result.data.find((d) => d["região"] === "Sul");
    const norte = result.data.find((d) => d["região"] === "Norte");
    const leste = result.data.find((d) => d["região"] === "Leste");
    expect(sul?.["total_vendas"]).toBe(45000);
    expect(norte?.["total_vendas"]).toBe(32000);
    expect(leste?.["total_vendas"]).toBe(67000);
  });

  it("T-B02: converte sugestão line em ChartConfig com dados brutos não agregados", () => {
    const suggestion: ChartSuggestion = {
      type: "line",
      xKey: "data",
      yKey: "total_vendas",
      title: "Evolução de Vendas",
      rationale: "Teste.",
      priority: 2,
    };

    const result = buildChartFromSuggestion(suggestion, sampleRows);

    expect(result.type).toBe("line");
    expect(result.xKey).toBe("data");
    expect(result.yKey).toBe("total_vendas");
    // Line chart is NOT aggregated — one entry per row
    expect(result.data).toHaveLength(sampleRows.length);
    expect(result.data[0]["data"]).toBe("2024-01-01");
    expect(result.data[0]["total_vendas"]).toBe(45000);
  });

  it("T-B03: converte sugestão pie em ChartConfig com contagens por categoria", () => {
    const suggestion: ChartSuggestion = {
      type: "pie",
      xKey: "região",
      title: "Distribuição por Região",
      rationale: "Teste.",
      priority: 3,
    };

    const result = buildChartFromSuggestion(suggestion, sampleRows);

    expect(result.type).toBe("pie");
    expect(result.xKey).toBe("região");
    expect(result.yKey).toBeUndefined();
    // 3 distinct regions → 3 pie slices
    expect(result.data).toHaveLength(3);
    const sulSlice = result.data.find((d) => d["name"] === "Sul");
    expect(sulSlice?.["value"]).toBe(1);
  });

  it("T-B04: não lança erro para coluna inexistente em bar", () => {
    const suggestion: ChartSuggestion = {
      type: "bar",
      xKey: "coluna_fantasma",
      yKey: "total_vendas",
      title: "Teste Coluna Inexistente",
      rationale: "",
      priority: 1,
    };

    expect(() => buildChartFromSuggestion(suggestion, sampleRows)).not.toThrow();

    const result = buildChartFromSuggestion(suggestion, sampleRows);
    expect(result.type).toBe("bar");
    // aggregateBarData handles missing columns gracefully (uses "N/A")
    expect(Array.isArray(result.data)).toBe(true);
  });

  it("T-B05: tipo table retorna slice de no máximo 50 linhas", () => {
    const hundredRows = Array.from({ length: 100 }, (_, i) => ({
      id: i,
      value: i * 10,
    }));

    const suggestion: ChartSuggestion = {
      type: "table",
      xKey: "id",
      title: "Dados Completos",
      rationale: "",
      priority: 1,
    };

    const result = buildChartFromSuggestion(suggestion, hundredRows);

    expect(result.type).toBe("table");
    expect(result.data).toHaveLength(50);
    expect(result.data[0]["id"]).toBe(0);
    expect(result.data[49]["id"]).toBe(49);
  });
});
