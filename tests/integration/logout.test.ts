import { describe, it, expect, vi } from "vitest";
import { db } from "@/lib/db";
import { users, sessions } from "@/lib/db/schema";
import { hashPassword } from "@/lib/auth/password";
import { lucia } from "@/lib/auth/lucia";
import { eq } from "drizzle-orm";

const mockSet = vi.fn();
const mockGet = vi.fn();

vi.mock("next/headers", () => ({
  cookies: () => ({
    set: mockSet,
    get: mockGet,
  }),
}));

async function setupUser() {
  const passwordHash = await hashPassword("testpass123");
  const [u] = await db
    .insert(users)
    .values({ name: "Logout User", email: "logout@test.com", passwordHash })
    .$returningId();

  const session = await lucia.createSession(u.id, {});
  return { userId: u.id, sessionId: session.id };
}

describe("POST /api/auth/logout", () => {
  it("invalida a sessão no banco", async () => {
    const { sessionId } = await setupUser();

    // Mock cookie to return the session
    mockGet.mockReturnValue({ value: sessionId });

    const { POST } = await import("@/app/api/auth/logout/route");
    const req = new Request("http://localhost/api/auth/logout", {
      method: "POST",
    });
    const res = await POST(req);
    expect(res.status).toBe(200);

    // Session must be deleted from DB
    const remaining = await db
      .select()
      .from(sessions)
      .where(eq(sessions.id, sessionId));
    expect(remaining).toHaveLength(0);
  });

  it("retorna 200 mesmo sem cookie de sessão (idempotente)", async () => {
    mockGet.mockReturnValue(undefined);

    const { POST } = await import("@/app/api/auth/logout/route");
    const req = new Request("http://localhost/api/auth/logout", {
      method: "POST",
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
  });
});
