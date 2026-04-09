import { describe, it, expect, vi, beforeAll } from "vitest";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { hashPassword } from "@/lib/auth/password";
import { encryptApiKey } from "@/lib/crypto/apiKey";
import { lucia } from "@/lib/auth/lucia";

beforeAll(() => {
  process.env.ENCRYPTION_KEY =
    "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
});

const mockSet = vi.fn();
const mockGet = vi.fn();

vi.mock("next/headers", () => ({
  cookies: () => ({
    set: mockSet,
    get: mockGet,
  }),
}));

// Mock the AI analysis function to avoid real API calls
vi.mock("@/lib/ai/analyze", () => ({
  analyzeWithAI: vi.fn().mockResolvedValue("## Análise\n\nInsights mock de teste."),
}));

async function setupUserWithKey(email: string, provider?: string, plainKey?: string) {
  const passwordHash = await hashPassword("testpass123");
  const encryptedKey = plainKey ? encryptApiKey(plainKey) : null;

  const [u] = await db
    .insert(users)
    .values({
      name: "AI User",
      email,
      passwordHash,
      aiProvider: provider ?? null,
      aiApiKey: encryptedKey,
    })
    .$returningId();

  const session = await lucia.createSession(u.id, {});
  mockGet.mockReturnValue({ value: session.id });
  return { userId: u.id, sessionId: session.id };
}

describe("POST /api/ai-analyze", () => {
  it("retorna 400 se usuário não tem chave de API configurada", async () => {
    await setupUserWithKey(`nokey-${Date.now()}@ai.com`);

    const { POST } = await import("@/app/api/ai-analyze/route");
    const res = await POST(
      new Request("http://localhost/api/ai-analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ columnsMeta: [], sampleRows: [] }),
      })
    );

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBeTruthy();
  });

  it("retorna insights quando chave está configurada", async () => {
    await setupUserWithKey(
      `withkey-${Date.now()}@ai.com`,
      "openai",
      "sk-test-fake-key"
    );

    const { POST } = await import("@/app/api/ai-analyze/route");
    const res = await POST(
      new Request("http://localhost/api/ai-analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          columnsMeta: [
            { name: "data", type: "date", stats: { uniqueCount: 5, sampleValues: [] } },
          ],
          sampleRows: [{ data: "2024-01-01", valor: 100 }],
        }),
      })
    );

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.insights).toBeTruthy();

    // CRITICAL: response must never contain the API key
    expect(JSON.stringify(data)).not.toContain("sk-test-fake-key");
  });

  it("retorna 401 sem sessão", async () => {
    mockGet.mockReturnValue(undefined);

    const { POST } = await import("@/app/api/ai-analyze/route");
    const res = await POST(
      new Request("http://localhost/api/ai-analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ columnsMeta: [], sampleRows: [] }),
      })
    );

    expect(res.status).toBe(401);
  });
});
