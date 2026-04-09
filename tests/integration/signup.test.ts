import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/lib/db";
import { users, sessions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { POST } from "@/app/api/auth/signup/route";

// Mock Next.js cookies
vi.mock("next/headers", () => ({
  cookies: () => ({
    set: vi.fn(),
    get: vi.fn(),
  }),
}));

async function callSignup(body: unknown) {
  const req = new Request("http://localhost/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return POST(req);
}

describe("POST /api/auth/signup", () => {
  it("cria usuário e sessão com dados válidos", async () => {
    const res = await callSignup({
      name: "Test User",
      email: "test@signup.com",
      password: "12345678",
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);

    // Verify user in DB
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, "test@signup.com"));
    expect(user).toBeDefined();
    expect(user.name).toBe("Test User");

    // Password must be hashed (bcrypt starts with $2b$)
    expect(user.passwordHash).toMatch(/^\$2b\$/);
    expect(user.passwordHash).not.toContain("12345678");

    // Session must be created
    const [session] = await db
      .select()
      .from(sessions)
      .where(eq(sessions.userId, user.id));
    expect(session).toBeDefined();
  });

  it("retorna 409 para email duplicado", async () => {
    await callSignup({
      name: "User A",
      email: "dup@signup.com",
      password: "12345678",
    });

    const res = await callSignup({
      name: "User B",
      email: "dup@signup.com",
      password: "87654321",
    });

    expect(res.status).toBe(409);
    const data = await res.json();
    expect(data.error).toContain("Email");
  });

  it("retorna 400 para senha com menos de 8 caracteres", async () => {
    const res = await callSignup({
      name: "Test",
      email: "short@signup.com",
      password: "1234567",
    });

    expect(res.status).toBe(400);

    // User must NOT be created
    const found = await db
      .select()
      .from(users)
      .where(eq(users.email, "short@signup.com"));
    expect(found).toHaveLength(0);
  });

  it("retorna 400 para email inválido", async () => {
    const res = await callSignup({
      name: "Test",
      email: "not-an-email",
      password: "12345678",
    });
    expect(res.status).toBe(400);
  });

  it("retorna 400 para nome vazio", async () => {
    const res = await callSignup({
      name: "",
      email: "name@signup.com",
      password: "12345678",
    });
    expect(res.status).toBe(400);
  });

  it("senha nunca salva em plaintext no banco", async () => {
    const secret = "minha_senha_super_secreta";
    await callSignup({
      name: "Sec User",
      email: "sec@signup.com",
      password: secret,
    });

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, "sec@signup.com"));

    expect(user.passwordHash).not.toContain(secret);
    expect(user.passwordHash).toMatch(/^\$2b\$/);
  });
});
