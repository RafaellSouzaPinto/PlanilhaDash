import { describe, it, expect } from "vitest";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { hashPassword } from "@/lib/auth/password";
import { POST } from "@/app/api/auth/login/route";

vi.mock("next/headers", () => ({
  cookies: () => ({
    set: vi.fn(),
    get: vi.fn(),
  }),
}));

async function createUser(email: string, password: string) {
  const passwordHash = await hashPassword(password);
  const [u] = await db
    .insert(users)
    .values({ name: "Login Test", email, passwordHash })
    .$returningId();
  return u;
}

async function callLogin(body: unknown) {
  const req = new Request("http://localhost/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return POST(req);
}

describe("POST /api/auth/login", () => {
  it("login válido retorna 200", async () => {
    await createUser("valid@login.com", "mypassword123");
    const res = await callLogin({
      email: "valid@login.com",
      password: "mypassword123",
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
  });

  it("senha incorreta retorna 401 com mensagem genérica", async () => {
    await createUser("wrong@login.com", "correctpassword");
    const res = await callLogin({
      email: "wrong@login.com",
      password: "wrongpassword",
    });
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe("Credenciais inválidas");
  });

  it("email inexistente retorna 401 com a mesma mensagem genérica", async () => {
    const res = await callLogin({
      email: "nonexistent@login.com",
      password: "anypassword",
    });
    expect(res.status).toBe(401);
    const data = await res.json();
    // Same message as wrong password — never reveal which is wrong
    expect(data.error).toBe("Credenciais inválidas");
  });

  it("email inválido retorna 400", async () => {
    const res = await callLogin({ email: "not-email", password: "pass" });
    expect(res.status).toBe(400);
  });

  it("mensagem de erro de email e senha são idênticas (segurança)", async () => {
    await createUser("timing@login.com", "correctpassword");

    const wrongPassRes = await callLogin({
      email: "timing@login.com",
      password: "wrongpassword",
    });
    const noUserRes = await callLogin({
      email: "nobody@login.com",
      password: "wrongpassword",
    });

    const wrongPassData = await wrongPassRes.json();
    const noUserData = await noUserRes.json();

    expect(wrongPassData.error).toBe(noUserData.error);
  });
});
