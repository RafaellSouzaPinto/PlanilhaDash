import { describe, it, expect } from "vitest";
import { inferTypes } from "@/lib/inferTypes";

function makeRows(key: string, values: unknown[]): Record<string, unknown>[] {
  return values.map((v) => ({ [key]: v }));
}

describe("inferTypes", () => {
  it("retorna array vazio para rows vazio", () => {
    expect(inferTypes([])).toEqual([]);
  });

  it("detecta tipo currency (R$)", () => {
    const rows = makeRows("valor", [
      "R$ 1.000,00",
      "R$ 2.500,00",
      "R$ 500,00",
      "R$ 750,00",
      "R$ 1.200,00",
    ]);
    const [col] = inferTypes(rows);
    expect(col.type).toBe("currency");
  });

  it("detecta tipo percentage (%)", () => {
    const rows = makeRows("taxa", ["10%", "25%", "5.5%", "100%", "0%"]);
    const [col] = inferTypes(rows);
    expect(col.type).toBe("percentage");
  });

  it("detecta tipo date (ISO)", () => {
    const rows = makeRows("data", [
      "2024-01-15",
      "2024-02-20",
      "2024-03-10",
      "2024-04-05",
      "2024-05-01",
    ]);
    const [col] = inferTypes(rows);
    expect(col.type).toBe("date");
  });

  it("detecta tipo date (BR)", () => {
    const rows = makeRows("data", [
      "15/01/2024",
      "20/02/2024",
      "10/03/2024",
      "05/04/2024",
      "01/05/2024",
    ]);
    const [col] = inferTypes(rows);
    expect(col.type).toBe("date");
  });

  it("detecta tipo number (numérico puro)", () => {
    const rows = makeRows("quantidade", [100, 200, 300, 400, 500]);
    const [col] = inferTypes(rows);
    expect(col.type).toBe("number");
  });

  it("detecta tipo categorical (poucos únicos)", () => {
    // 3 valores únicos / 20 linhas = 15% < 20%
    const values = Array(20)
      .fill(0)
      .map((_, i) => ["Sul", "Norte", "Centro"][i % 3]);
    const rows = makeRows("regiao", values);
    const [col] = inferTypes(rows);
    expect(col.type).toBe("categorical");
  });

  it("tipo text como fallback", () => {
    const rows = makeRows("obs", [
      "Nota fiscal processada com sucesso",
      "Cliente aguardando aprovação",
      "Pedido cancelado pelo usuário",
      "Pagamento confirmado via PIX",
      "Entrega realizada no prazo",
    ]);
    const [col] = inferTypes(rows);
    expect(col.type).toBe("text");
  });

  it("ignora valores null/undefined ao calcular tipo", () => {
    const rows = makeRows("valor", [100, null, 200, undefined, 300]);
    const [col] = inferTypes(rows);
    expect(col.type).toBe("number");
  });

  it("retorna uniqueCount correto", () => {
    const rows = makeRows("status", ["A", "B", "A", "C", "B"]);
    const [col] = inferTypes(rows);
    expect(col.stats.uniqueCount).toBe(3);
  });

  it("retorna min e max para tipo number", () => {
    const rows = makeRows("num", [10, 20, 5, 100, 50]);
    const [col] = inferTypes(rows);
    expect(col.stats.min).toBe(5);
    expect(col.stats.max).toBe(100);
  });

  it("analisa múltiplas colunas", () => {
    const rows = [
      { data: "2024-01-01", valor: 100, status: "A" },
      { data: "2024-01-02", valor: 200, status: "B" },
      { data: "2024-01-03", valor: 300, status: "A" },
    ];
    const cols = inferTypes(rows);
    expect(cols).toHaveLength(3);
    expect(cols.find((c) => c.name === "data")?.type).toBe("date");
    expect(cols.find((c) => c.name === "valor")?.type).toBe("number");
  });
});
