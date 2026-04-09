import { describe, it, expect, vi } from "vitest";
import { db } from "@/lib/db";
import { users, sessions } from "@/lib/db/schema";
import { hashPassword } from "@/lib/auth/password";
import { lucia } from "@/lib/auth/lucia";
import type { ColumnMeta, ChartConfig } from "@/types/spreadsheet";

const mockSet = vi.fn();
const mockGet = vi.fn();

vi.mock("next/headers", () => ({
  cookies: () => ({
    set: mockSet,
    get: mockGet,
  }),
}));

const sampleColumnsMeta: ColumnMeta[] = [
  { name: "data", type: "date", stats: { uniqueCount: 10, sampleValues: [] } },
  { name: "valor", type: "number", stats: { uniqueCount: 10, sampleValues: [] } },
];

const sampleCharts: ChartConfig[] = [
  {
    type: "line",
    xKey: "data",
    yKey: "valor",
    title: "Valor ao longo do tempo",
    data: [],
  },
];

async function setupUser(email: string) {
  const passwordHash = await hashPassword("testpass123");
  const [u] = await db
    .insert(users)
    .values({ name: "Reports User", email, passwordHash })
    .$returningId();
  const session = await lucia.createSession(u.id, {});
  return { userId: u.id, sessionId: session.id };
}

async function callSaveReport(sessionId: string, body: unknown) {
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

describe("POST /api/reports", () => {
  it("salva relatório com userId da sessão (não do body)", async () => {
    const { sessionId } = await setupUser(`save-${Date.now()}@reports.com`);

    const res = await callSaveReport(sessionId, {
      fileName: "vendas.csv",
      rowCount: 100,
      columnsMeta: sampleColumnsMeta,
      chartsConfig: sampleCharts,
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.id).toBeTruthy();
  });

  it("retorna 401 sem sessão", async () => {
    mockGet.mockReturnValue(undefined);
    const { POST } = await import("@/app/api/reports/route");
    const res = await POST(
      new Request("http://localhost/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: "test.csv",
          rowCount: 1,
          columnsMeta: [],
          chartsConfig: [],
        }),
      })
    );
    expect(res.status).toBe(401);
  });
});

describe("GET /api/reports/[id]", () => {
  it("retorna 403 quando outro usuário tenta acessar o relatório", async () => {
    const { sessionId: ownerSession } = await setupUser(
      `owner-${Date.now()}@reports.com`
    );
    const { sessionId: otherSession } = await setupUser(
      `other-${Date.now()}@reports.com`
    );

    // Owner saves a report
    const saveRes = await callSaveReport(ownerSession, {
      fileName: "private.csv",
      rowCount: 50,
      columnsMeta: sampleColumnsMeta,
      chartsConfig: sampleCharts,
    });
    const { id: reportId } = await saveRes.json();

    // Other user tries to access
    mockGet.mockReturnValue({ value: otherSession });
    const { GET } = await import("@/app/api/reports/[id]/route");
    const res = await GET(
      new Request(`http://localhost/api/reports/${reportId}`),
      { params: { id: String(reportId) } }
    );

    expect(res.status).toBe(403);
  });

  it("retorna o relatório para o dono", async () => {
    const { sessionId } = await setupUser(`owner2-${Date.now()}@reports.com`);

    const saveRes = await callSaveReport(sessionId, {
      fileName: "mine.csv",
      rowCount: 30,
      columnsMeta: sampleColumnsMeta,
      chartsConfig: sampleCharts,
    });
    const { id: reportId } = await saveRes.json();

    mockGet.mockReturnValue({ value: sessionId });
    const { GET } = await import("@/app/api/reports/[id]/route");
    const res = await GET(
      new Request(`http://localhost/api/reports/${reportId}`),
      { params: { id: String(reportId) } }
    );

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.fileName).toBe("mine.csv");
  });

  it("retorna 404 para relatório inexistente", async () => {
    const { sessionId } = await setupUser(`notfound-${Date.now()}@reports.com`);

    mockGet.mockReturnValue({ value: sessionId });
    const { GET } = await import("@/app/api/reports/[id]/route");
    const res = await GET(
      new Request("http://localhost/api/reports/999999"),
      { params: { id: "999999" } }
    );

    expect(res.status).toBe(404);
  });
});

describe("GET /api/reports (list)", () => {
  it("retorna apenas os relatórios do usuário autenticado", async () => {
    const { sessionId: s1 } = await setupUser(`list1-${Date.now()}@reports.com`);
    const { sessionId: s2 } = await setupUser(`list2-${Date.now()}@reports.com`);

    // User 1 saves 2 reports
    await callSaveReport(s1, {
      fileName: "user1-a.csv",
      rowCount: 10,
      columnsMeta: [],
      chartsConfig: [],
    });
    await callSaveReport(s1, {
      fileName: "user1-b.csv",
      rowCount: 20,
      columnsMeta: [],
      chartsConfig: [],
    });

    // User 2 saves 1 report
    await callSaveReport(s2, {
      fileName: "user2-a.csv",
      rowCount: 5,
      columnsMeta: [],
      chartsConfig: [],
    });

    // User 1 lists — should only see 2
    mockGet.mockReturnValue({ value: s1 });
    const { GET } = await import("@/app/api/reports/route");
    const res = await GET(new Request("http://localhost/api/reports"));
    const data = await res.json();

    expect(data).toHaveLength(2);
    expect(data.every((r: { fileName: string }) => r.fileName.startsWith("user1"))).toBe(true);
  });
});
