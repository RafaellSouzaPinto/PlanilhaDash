import { describe, it, expect, vi, beforeAll } from "vitest";
import { db } from "@/lib/db";
import { users, sessions } from "@/lib/db/schema";
import { hashPassword } from "@/lib/auth/password";
import { lucia } from "@/lib/auth/lucia";
import { decryptApiKey } from "@/lib/crypto/apiKey";
import { eq } from "drizzle-orm";

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

async function setupUserWithSession() {
  const passwordHash = await hashPassword("testpass123");
  const [u] = await db
    .insert(users)
    .values({ name: "ApiKey User", email: `apikey-${Date.now()}@test.com`, passwordHash })
    .$returningId();
  const session = await lucia.createSession(u.id, {});
  mockGet.mockReturnValue({ value: session.id });
  return { userId: u.id, sessionId: session.id };
}

describe("GET /api/user/api-key", () => {
  it("retorna hasApiKey=false quando chave não configurada", async () => {
    await setupUserWithSession();

    const { GET } = await import("@/app/api/user/api-key/route");
    const req = new Request("http://localhost/api/user/api-key");
    const res = await GET(req);

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.hasApiKey).toBe(false);
    expect(data.aiProvider).toBeNull();

    // CRITICAL: response must NOT contain any key
    expect(JSON.stringify(data)).not.toContain("apiKey");
    expect(JSON.stringify(data)).not.toContain("ai_api_key");
  });
});

describe("POST /api/user/api-key — auto-detecção de provider", () => {
  it("detecta Google (AIza...) e salva criptografado", async () => {
    const { userId } = await setupUserWithSession();
    const plainKey = "AIzaSyFakeGeminiKey12345";

    const { POST } = await import("@/app/api/user/api-key/route");
    const req = new Request("http://localhost/api/user/api-key", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiKey: plainKey }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);

    const resData = await res.json();
    expect(resData.provider).toBe("google");

    const [user] = await db
      .select({ aiApiKey: users.aiApiKey, aiProvider: users.aiProvider })
      .from(users)
      .where(eq(users.id, userId));

    expect(user.aiApiKey).not.toBeNull();
    expect(user.aiApiKey).not.toBe(plainKey);
    expect(user.aiProvider).toBe("google");

    const decrypted = decryptApiKey(user.aiApiKey!);
    expect(decrypted).toBe(plainKey);
  });

  it("detecta OpenAI (sk-...) e salva criptografado", async () => {
    const { userId } = await setupUserWithSession();
    const plainKey = "sk-test-myapikey-12345";

    const { POST } = await import("@/app/api/user/api-key/route");
    const req = new Request("http://localhost/api/user/api-key", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiKey: plainKey }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);

    const [user] = await db
      .select({ aiApiKey: users.aiApiKey, aiProvider: users.aiProvider })
      .from(users)
      .where(eq(users.id, userId));

    expect(user.aiProvider).toBe("openai");
    expect(decryptApiKey(user.aiApiKey!)).toBe(plainKey);
  });

  it("detecta Anthropic (sk-ant-...) e salva corretamente", async () => {
    const { userId } = await setupUserWithSession();
    const plainKey = "sk-ant-api03-TestKey";

    const { POST } = await import("@/app/api/user/api-key/route");
    const res = await POST(
      new Request("http://localhost/api/user/api-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: plainKey }),
      })
    );

    const [user] = await db
      .select({ aiProvider: users.aiProvider })
      .from(users)
      .where(eq(users.id, userId));

    expect(res.status).toBe(200);
    expect(user.aiProvider).toBe("anthropic");
  });

  it("detecta Groq (gsk_...) e salva corretamente", async () => {
    const { userId } = await setupUserWithSession();

    const { POST } = await import("@/app/api/user/api-key/route");
    const res = await POST(
      new Request("http://localhost/api/user/api-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: "gsk_TestGroqKey123" }),
      })
    );

    const [user] = await db
      .select({ aiProvider: users.aiProvider })
      .from(users)
      .where(eq(users.id, userId));

    expect(res.status).toBe(200);
    expect(user.aiProvider).toBe("groq");
  });

  it("chave com prefixo desconhecido cai em openai", async () => {
    const { userId } = await setupUserWithSession();

    const { POST } = await import("@/app/api/user/api-key/route");
    await POST(
      new Request("http://localhost/api/user/api-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: "unknown-format-key-xyz" }),
      })
    );

    const [user] = await db
      .select({ aiProvider: users.aiProvider })
      .from(users)
      .where(eq(users.id, userId));

    expect(user.aiProvider).toBe("openai");
  });

  it("GET após POST retorna hasApiKey=true (sem retornar a chave)", async () => {
    await setupUserWithSession();

    const { POST, GET } = await import("@/app/api/user/api-key/route");

    await POST(
      new Request("http://localhost/api/user/api-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: "sk-ant-test" }),
      })
    );

    const getRes = await GET(new Request("http://localhost/api/user/api-key"));
    const data = await getRes.json();

    expect(data.hasApiKey).toBe(true);
    expect(data.aiProvider).toBe("anthropic");

    // CRITICAL: decrypted key must NOT appear in response
    expect(JSON.stringify(data)).not.toContain("sk-ant-test");
  });

  it("retorna 400 para body inválido", async () => {
    await setupUserWithSession();

    const { POST } = await import("@/app/api/user/api-key/route");
    const res = await POST(
      new Request("http://localhost/api/user/api-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: "" }),
      })
    );

    expect(res.status).toBe(400);
  });

  it("retorna 401 sem sessão válida", async () => {
    mockGet.mockReturnValue(undefined);

    const { POST } = await import("@/app/api/user/api-key/route");
    const res = await POST(
      new Request("http://localhost/api/user/api-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: "sk-test-key" }),
      })
    );

    expect(res.status).toBe(401);
  });
});

// Suppress unused import warning — sessions used indirectly by lucia
void sessions;
