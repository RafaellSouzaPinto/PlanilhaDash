/**
 * T10 — Histórico de Relatórios
 *
 * Cruza: M06_HISTORICO.md × Regras de Negócio × Código
 *
 * Cobertura:
 *  - GET /api/reports  (listagem com hasAiInsights, isolamento, ordenação, lista vazia)
 *  - POST /api/reports (userId da sessão, Zod validation, aiInsights null/string)
 *  - GET /api/reports/[id] (ownership, 404, 400 ID inválido, aiInsights completo)
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { db } from "@/lib/db";
import { users, sessions, reports } from "@/lib/db/schema";
import { hashPassword } from "@/lib/auth/password";
import { lucia } from "@/lib/auth/lucia";
import { eq } from "drizzle-orm";
import type { ColumnMeta, ChartConfig } from "@/types/spreadsheet";

// --------------------------------------------------------------------------
// Mocks de cookies (next/headers já mockado pelo setup de outros testes)
// --------------------------------------------------------------------------
const mockSet = vi.fn();
const mockGet = vi.fn();

vi.mock("next/headers", () => ({
  cookies: () => ({
    set: mockSet,
    get: mockGet,
  }),
}));

// --------------------------------------------------------------------------
// Dados de exemplo
// --------------------------------------------------------------------------
const baseMeta: ColumnMeta[] = [
  { name: "mes", type: "categorical", stats: { uniqueCount: 12, sampleValues: [] } },
  { name: "vendas", type: "number", stats: { uniqueCount: 100, sampleValues: [] } },
];

const baseCharts: ChartConfig[] = [
  { type: "bar", xKey: "mes", yKey: "vendas", title: "Vendas por Mês", data: [] },
];

// --------------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------------
async function createAndLoginUser(email: string) {
  const passwordHash = await hashPassword("senha12345");
  const [u] = await db
    .insert(users)
    .values({ name: "Teste Hist", email, passwordHash })
    .$returningId();
  const session = await lucia.createSession(u.id, {});
  return { userId: u.id, sessionId: session.id };
}

async function postReport(sessionId: string, body: unknown) {
  mockGet.mockReturnValue({ value: sessionId });
  const { POST } = await import("@/app/api/reports/route");
  return POST(
    new Request("http://localhost/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
  );
}

async function getReports(sessionId: string) {
  mockGet.mockReturnValue({ value: sessionId });
  const { GET } = await import("@/app/api/reports/route");
  return GET(new Request("http://localhost/api/reports"));
}

async function getReportById(sessionId: string, id: string | number) {
  mockGet.mockReturnValue({ value: sessionId });
  const { GET } = await import("@/app/api/reports/[id]/route");
  return GET(
    new Request(`http://localhost/api/reports/${id}`),
    { params: { id: String(id) } }
  );
}

// --------------------------------------------------------------------------
// POST /api/reports
// --------------------------------------------------------------------------
describe("POST /api/reports — salvar relatório", () => {
  it("RN-8: userId salvo é o da sessão, nunca o do body", async () => {
    const { userId, sessionId } = await createAndLoginUser(`rn8-${Date.now()}@h.com`);

    const res = await postReport(sessionId, {
      userId: 99999, // tentativa de injeção — deve ser ignorada
      fileName: "injecao.csv",
      rowCount: 50,
      columnsMeta: baseMeta,
      chartsConfig: baseCharts,
    });

    expect(res.status).toBe(200);
    const { id } = await res.json();
    const [saved] = await db.select().from(reports).where(eq(reports.id, id));
    expect(saved.userId).toBe(userId);    // sempre da sessão
    expect(saved.userId).not.toBe(99999); // nunca do body
  });

  it("salva aiInsights quando fornecido", async () => {
    const { sessionId } = await createAndLoginUser(`ai-${Date.now()}@h.com`);

    const res = await postReport(sessionId, {
      fileName: "com-ia.csv",
      rowCount: 200,
      columnsMeta: baseMeta,
      chartsConfig: baseCharts,
      aiInsights: "## Resumo\n\n- Tendência de alta em Q3",
    });

    expect(res.status).toBe(200);
    const { id } = await res.json();
    const [saved] = await db.select().from(reports).where(eq(reports.id, id));
    expect(saved.aiInsights).toBe("## Resumo\n\n- Tendência de alta em Q3");
  });

  it("salva aiInsights como null quando omitido", async () => {
    const { sessionId } = await createAndLoginUser(`noai-${Date.now()}@h.com`);

    const res = await postReport(sessionId, {
      fileName: "sem-ia.csv",
      rowCount: 10,
      columnsMeta: [],
      chartsConfig: [],
    });

    expect(res.status).toBe(200);
    const { id } = await res.json();
    const [saved] = await db.select().from(reports).where(eq(reports.id, id));
    expect(saved.aiInsights).toBeNull();
  });

  it("RN-4: retorna 400 para fileName vazio (Zod)", async () => {
    const { sessionId } = await createAndLoginUser(`zod1-${Date.now()}@h.com`);
    const res = await postReport(sessionId, {
      fileName: "",
      rowCount: 100,
      columnsMeta: [],
      chartsConfig: [],
    });
    expect(res.status).toBe(400);
  });

  it("RN-4: retorna 400 para rowCount negativo (Zod)", async () => {
    const { sessionId } = await createAndLoginUser(`zod2-${Date.now()}@h.com`);
    const res = await postReport(sessionId, {
      fileName: "valido.csv",
      rowCount: -5,
      columnsMeta: [],
      chartsConfig: [],
    });
    expect(res.status).toBe(400);
  });

  it("RN-4: retorna 400 para rowCount zero (Zod — positive() exige > 0)", async () => {
    const { sessionId } = await createAndLoginUser(`zod3-${Date.now()}@h.com`);
    const res = await postReport(sessionId, {
      fileName: "valido.csv",
      rowCount: 0,
      columnsMeta: [],
      chartsConfig: [],
    });
    expect(res.status).toBe(400);
  });

  it("retorna 401 sem sessão", async () => {
    mockGet.mockReturnValue(undefined);
    const { POST } = await import("@/app/api/reports/route");
    const res = await POST(
      new Request("http://localhost/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: "x.csv", rowCount: 1, columnsMeta: [], chartsConfig: [] }),
      })
    );
    expect(res.status).toBe(401);
  });
});

// --------------------------------------------------------------------------
// GET /api/reports — listagem
// --------------------------------------------------------------------------
describe("GET /api/reports — listagem do histórico", () => {
  it("retorna lista vazia quando usuário não tem relatórios", async () => {
    const { sessionId } = await createAndLoginUser(`empty-${Date.now()}@h.com`);
    const res = await getReports(sessionId);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveLength(0);
    expect(Array.isArray(data)).toBe(true);
  });

  it("hasAiInsights = true quando relatório tem insights", async () => {
    const { sessionId } = await createAndLoginUser(`hai-t-${Date.now()}@h.com`);

    await postReport(sessionId, {
      fileName: "com-ia.csv",
      rowCount: 100,
      columnsMeta: [],
      chartsConfig: [],
      aiInsights: "## Insights\n\n- Item 1",
    });

    const res = await getReports(sessionId);
    const [report] = await res.json();

    expect(report.hasAiInsights).toBe(true);
  });

  it("hasAiInsights = false quando relatório não tem insights", async () => {
    const { sessionId } = await createAndLoginUser(`hai-f-${Date.now()}@h.com`);

    await postReport(sessionId, {
      fileName: "sem-ia.csv",
      rowCount: 50,
      columnsMeta: [],
      chartsConfig: [],
    });

    const res = await getReports(sessionId);
    const [report] = await res.json();

    expect(report.hasAiInsights).toBe(false);
  });

  it("RN: texto de aiInsights NUNCA retornado na listagem (apenas boolean)", async () => {
    const { sessionId } = await createAndLoginUser(`notext-${Date.now()}@h.com`);

    await postReport(sessionId, {
      fileName: "seguro.csv",
      rowCount: 30,
      columnsMeta: [],
      chartsConfig: [],
      aiInsights: "conteúdo secreto dos insights",
    });

    const res = await getReports(sessionId);
    const [report] = await res.json();

    // O campo aiInsights em plaintext nunca deve aparecer na listagem
    expect(report.aiInsights).toBeUndefined();
    // Só o boolean
    expect(typeof report.hasAiInsights).toBe("boolean");
  });

  it("ordenação: mais recente primeiro (created_at DESC)", async () => {
    const { sessionId } = await createAndLoginUser(`ord-${Date.now()}@h.com`);

    await postReport(sessionId, { fileName: "primeiro.csv", rowCount: 1, columnsMeta: [], chartsConfig: [] });
    // MariaDB DATETIME tem granularidade de 1s — aguardar para garantir created_at diferente
    await new Promise((r) => setTimeout(r, 1100));
    await postReport(sessionId, { fileName: "segundo.csv", rowCount: 2, columnsMeta: [], chartsConfig: [] });

    const res = await getReports(sessionId);
    const data = await res.json();

    expect(data).toHaveLength(2);
    expect(data[0].fileName).toBe("segundo.csv"); // mais recente primeiro
    expect(data[1].fileName).toBe("primeiro.csv");
  });

  it("RN: isolamento — usuário vê apenas seus próprios relatórios", async () => {
    const { sessionId: sA } = await createAndLoginUser(`isol-a-${Date.now()}@h.com`);
    const { sessionId: sB } = await createAndLoginUser(`isol-b-${Date.now()}@h.com`);

    await postReport(sA, { fileName: "de-A.csv", rowCount: 10, columnsMeta: [], chartsConfig: [] });
    await postReport(sB, { fileName: "de-B.csv", rowCount: 20, columnsMeta: [], chartsConfig: [] });

    const res = await getReports(sA);
    const data = await res.json();

    expect(data).toHaveLength(1);
    expect(data[0].fileName).toBe("de-A.csv");
    expect(data.some((r: { fileName: string }) => r.fileName === "de-B.csv")).toBe(false);
  });

  it("retorna 401 sem sessão", async () => {
    mockGet.mockReturnValue(undefined);
    const { GET } = await import("@/app/api/reports/route");
    const res = await GET(new Request("http://localhost/api/reports"));
    expect(res.status).toBe(401);
  });

  it("retorna campos corretos: id, fileName, rowCount, hasAiInsights, createdAt", async () => {
    const { sessionId } = await createAndLoginUser(`fields-${Date.now()}@h.com`);

    await postReport(sessionId, {
      fileName: "campos.csv",
      rowCount: 77,
      columnsMeta: [],
      chartsConfig: [],
    });

    const res = await getReports(sessionId);
    const [report] = await res.json();

    expect(report).toHaveProperty("id");
    expect(report).toHaveProperty("fileName", "campos.csv");
    expect(report).toHaveProperty("rowCount", 77);
    expect(report).toHaveProperty("hasAiInsights");
    expect(report).toHaveProperty("createdAt");
  });
});

// --------------------------------------------------------------------------
// GET /api/reports/[id] — busca por ID
// --------------------------------------------------------------------------
describe("GET /api/reports/[id] — relatório completo", () => {
  it("retorna relatório completo para o dono com todos os campos", async () => {
    const { sessionId } = await createAndLoginUser(`full-${Date.now()}@h.com`);

    const saveRes = await postReport(sessionId, {
      fileName: "completo.xlsx",
      rowCount: 500,
      columnsMeta: baseMeta,
      chartsConfig: baseCharts,
      aiInsights: "## Análise\n\n- Alta em Q2",
    });
    const { id } = await saveRes.json();

    const res = await getReportById(sessionId, id);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.id).toBe(id);
    expect(data.fileName).toBe("completo.xlsx");
    expect(data.rowCount).toBe(500);
    expect(data.aiInsights).toBe("## Análise\n\n- Alta em Q2"); // texto completo no GET /[id]
    expect(Array.isArray(data.columnsMeta)).toBe(true);
    expect(Array.isArray(data.chartsConfig)).toBe(true);
  });

  it("aiInsights é null quando relatório não tem insights", async () => {
    const { sessionId } = await createAndLoginUser(`null-ai-${Date.now()}@h.com`);

    const saveRes = await postReport(sessionId, {
      fileName: "sem-ia.csv",
      rowCount: 10,
      columnsMeta: [],
      chartsConfig: [],
    });
    const { id } = await saveRes.json();

    const res = await getReportById(sessionId, id);
    const data = await res.json();
    expect(data.aiInsights).toBeNull();
  });

  it("RN: retorna 403 quando outro usuário tenta acessar relatório alheio", async () => {
    const { sessionId: sOwner } = await createAndLoginUser(`own-${Date.now()}@h.com`);
    const { sessionId: sOther } = await createAndLoginUser(`oth-${Date.now()}@h.com`);

    const saveRes = await postReport(sOwner, {
      fileName: "privado.csv",
      rowCount: 5,
      columnsMeta: [],
      chartsConfig: [],
    });
    const { id } = await saveRes.json();

    const res = await getReportById(sOther, id);
    expect(res.status).toBe(403);
  });

  it("retorna 404 para ID inexistente", async () => {
    const { sessionId } = await createAndLoginUser(`nf-${Date.now()}@h.com`);
    const res = await getReportById(sessionId, 999999999);
    expect(res.status).toBe(404);
  });

  it("retorna 400 para ID não numérico (letras)", async () => {
    const { sessionId } = await createAndLoginUser(`nan-${Date.now()}@h.com`);
    const res = await getReportById(sessionId, "abc");
    expect(res.status).toBe(400);
  });

  it("retorna 400 para ID negativo", async () => {
    const { sessionId } = await createAndLoginUser(`neg-${Date.now()}@h.com`);
    const res = await getReportById(sessionId, -1);
    expect(res.status).toBe(400);
  });

  it("retorna 400 para ID zero", async () => {
    const { sessionId } = await createAndLoginUser(`zero-${Date.now()}@h.com`);
    const res = await getReportById(sessionId, 0);
    expect(res.status).toBe(400);
  });

  it("retorna 401 sem sessão", async () => {
    mockGet.mockReturnValue(undefined);
    const { GET } = await import("@/app/api/reports/[id]/route");
    const res = await GET(
      new Request("http://localhost/api/reports/1"),
      { params: { id: "1" } }
    );
    expect(res.status).toBe(401);
  });
});

// --------------------------------------------------------------------------
// Cruzamento Feature × RN — fluxo completo ponta a ponta
// --------------------------------------------------------------------------
describe("Fluxo completo: salvar → listar → visualizar", () => {
  it("relatório com IA: salvar → badge visible na lista → texto completo no detalhe", async () => {
    const { sessionId } = await createAndLoginUser(`e2e-ai-${Date.now()}@h.com`);

    // 1. Salvar com insights de IA
    const saveRes = await postReport(sessionId, {
      fileName: "e2e.csv",
      rowCount: 300,
      columnsMeta: baseMeta,
      chartsConfig: baseCharts,
      aiInsights: "## E2E\n\n- Tendência positiva",
    });
    expect(saveRes.status).toBe(200);
    const { id } = await saveRes.json();

    // 2. Listar — deve ter hasAiInsights=true e NÃO ter o texto
    const listRes = await getReports(sessionId);
    const list = await listRes.json();
    expect(list).toHaveLength(1);
    expect(list[0].hasAiInsights).toBe(true);
    expect(list[0].aiInsights).toBeUndefined(); // RN: texto não exposto na listagem

    // 3. Detalhe — deve ter o texto completo e chartsConfig para reconstruir dashboard
    const detailRes = await getReportById(sessionId, id);
    const detail = await detailRes.json();
    expect(detail.aiInsights).toBe("## E2E\n\n- Tendência positiva");
    expect(detail.chartsConfig).toHaveLength(1);
    expect(detail.columnsMeta).toHaveLength(2);
  });

  it("relatório sem IA: salvar → hasAiInsights=false na lista → aiInsights null no detalhe", async () => {
    const { sessionId } = await createAndLoginUser(`e2e-noai-${Date.now()}@h.com`);

    const saveRes = await postReport(sessionId, {
      fileName: "noai.csv",
      rowCount: 50,
      columnsMeta: baseMeta,
      chartsConfig: baseCharts,
    });
    const { id } = await saveRes.json();

    const listRes = await getReports(sessionId);
    const [item] = await listRes.json();
    expect(item.hasAiInsights).toBe(false);

    const detailRes = await getReportById(sessionId, id);
    const detail = await detailRes.json();
    expect(detail.aiInsights).toBeNull();
  });
});
