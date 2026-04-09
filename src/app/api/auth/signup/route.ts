import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { lucia } from "@/lib/auth/lucia";
import { hashPassword } from "@/lib/auth/password";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { z } from "zod";

const signupSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Corpo da requisição inválido" }, { status: 400 });
  }

  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const { name, email, password } = parsed.data;

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing.length > 0) {
    return Response.json({ error: "Email já cadastrado" }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);

  const [inserted] = await db
    .insert(users)
    .values({ name, email, passwordHash })
    .$returningId();

  const session = await lucia.createSession(inserted.id, {});
  const sessionCookie = lucia.createSessionCookie(session.id);

  const cookieStore = cookies();
  cookieStore.set(
    sessionCookie.name,
    sessionCookie.value,
    sessionCookie.attributes
  );

  return Response.json({ ok: true });
}
