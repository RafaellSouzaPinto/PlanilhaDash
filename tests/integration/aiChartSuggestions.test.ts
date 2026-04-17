import { describe, it, expect, vi, beforeAll } from "vitest";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { hashPassword } from "@/lib/auth/password";
import { encryptApiKey } from "@/lib/crypto/apiKey";
import { lucia } from "@/lib/auth/lucia";
import { sampleColumnsMeta, sampleRows, mockAISuggestions } from "../fixtures/m08";

beforeAll(() => {
  process.env.ENCRYPTION_KEY =
    "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
});

// Mock the suggestChartsWithAI function to avoid real AI calls
vi.mock("@/lib/ai/suggestCharts", () => ({
  suggestChartsWithAI: vi.fn(),
}));

const mockSet = vi.fn();
const mockGet = vi.fn();

vi.mock("next/headers", () => ({
  cookies: () => ({
    set: mockSet,
    get: mockGet,
  }),
}));

async function createUserWithApiKey(email: string) {
  const passwordHash = await hashPassword("testpass123");
  const [u] = await db
    .insert(users)
    .values({
      name: "Test User",
      email,
      passwordHash,
      aiProvider: "openai",
      aiApiKey: encryptApiKey("sk-test-key-integration"),
    })
    .$returningId();
  const session = await lucia.createSession(u.id, {});
  mockGet.mockReturnValue({ value: session.id });
  return { userId: u.id, sessionId: session.id };
}

async function createUserWithoutApiKey(email: string) {
  const passwordHash = await hashPassword("testpass123");
  const [u] = await db
    .insert(users)
    .values({ name: "No Key User", email, passwordHash })
    .$returningId();
  const session = await lucia.createSession(u.id, {});
  mockGet.mockReturnValue({ value: session.id });
  return { userId: u.id };
}

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/ai-chart-suggestions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const validBody = { columnsMeta: sampleColumnsMeta, sampleRows };

describe("POST /api/ai-chart-suggestions", () => {
  it("T-R01: retorna 401 sem sessão válida", async () => {
    mockGet.mockReturnValue(undefined);

    const { POST } = await import("@/app/api/ai-chart-suggestions/route");
    const res = await POST(makeRequest(validBody));

    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBeTruthy();
  });

  it("T-R02: retorna 400 com body JSON malformado", async () => {
    await createUserWithApiKey(`r02-${Date.now()}@test.com`);

    const { POST } = await import("@/app/api/ai-chart-suggestions/route");
    const res = await POST(
      new Request("http://localhost/api/ai-chart-suggestions", {
        method: "POST",
        body: "invalid json{",
      })
    );

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBeTruthy();
  });

  it("T-R03: usuário sem chave recebe fallback determinístico (sem chamar IA)", async () => {
    await createUserWithoutApiKey(`r03-${Date.now()}@test.com`);

    const { suggestChartsWithAI } = await import("@/lib/ai/suggestCharts");

    const { POST } = await import("@/app/api/ai-chart-suggestions/route");
    const res = await POST(makeRequest(validBody));

    // No key and no server key in test env → silent deterministic fallback (200)
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.fallback).toBe(true);
    expect(data.suggestions.length).toBeGreaterThan(0);
    // Must NOT have called the AI function
    expect(vi.mocked(suggestChartsWithAI)).not.toHaveBeenCalled();
  });

  it("T-R04: retorna 200 com sugestões quando IA responde corretamente", async () => {
    await createUserWithApiKey(`r04-${Date.now()}@test.com`);

    const { suggestChartsWithAI } = await import("@/lib/ai/suggestCharts");
    vi.mocked(suggestChartsWithAI).mockResolvedValue(mockAISuggestions);

    const { POST } = await import("@/app/api/ai-chart-suggestions/route");
    const res = await POST(makeRequest(validBody));

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.fallback).toBe(false);
    expect(data.fallbackReason).toBeNull();
    expect(data.suggestions).toHaveLength(3);
    expect(data.suggestions[0].type).toBe("bar");

    // CRITICAL: response must not contain the API key
    const raw = JSON.stringify(data);
    expect(raw).not.toContain("sk-");
    expect(raw).not.toContain("apiKey");
    expect(raw).not.toContain("ai_api_key");
  });

  it("T-R05: retorna 200 com fallback quando suggestChartsWithAI lança erro", async () => {
    await createUserWithApiKey(`r05-${Date.now()}@test.com`);

    const { suggestChartsWithAI } = await import("@/lib/ai/suggestCharts");
    vi.mocked(suggestChartsWithAI).mockRejectedValue(
      new Error("timeout after 30s")
    );

    const { POST } = await import("@/app/api/ai-chart-suggestions/route");
    const res = await POST(makeRequest(validBody));

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.fallback).toBe(true);
    expect(data.fallbackReason).toContain("timeout");
    expect(data.suggestions.length).toBeGreaterThan(0);
    // Fallback suggestions have empty rationale
    for (const s of data.suggestions) {
      expect(s.rationale).toBe("");
    }
  });

  it("T-R06: retorna 200 com fallback quando IA retorna array vazio", async () => {
    await createUserWithApiKey(`r06-${Date.now()}@test.com`);

    const { suggestChartsWithAI } = await import("@/lib/ai/suggestCharts");
    vi.mocked(suggestChartsWithAI).mockResolvedValue([]);

    const { POST } = await import("@/app/api/ai-chart-suggestions/route");
    const res = await POST(makeRequest(validBody));

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.fallback).toBe(true);
    expect(data.fallbackReason).toContain("não retornou sugestões");
    expect(data.suggestions.length).toBeGreaterThan(0);
  });

  it("T-R07: retorna 400 para violação do Zod schema (columnsMeta vazio)", async () => {
    await createUserWithApiKey(`r07-${Date.now()}@test.com`);

    const { POST } = await import("@/app/api/ai-chart-suggestions/route");
    const res = await POST(
      makeRequest({ columnsMeta: [], sampleRows: [] })
    );

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("Dados inválidos");
  });
});
