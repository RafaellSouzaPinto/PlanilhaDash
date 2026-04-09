import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { validateSession } from "@/lib/auth/session";
import { encryptApiKey } from "@/lib/crypto/apiKey";
import { detectProvider } from "@/lib/ai/detectProvider";
import { eq } from "drizzle-orm";
import { z } from "zod";

const saveKeySchema = z.object({
  apiKey: z.string().min(1),
});

/**
 * GET /api/user/api-key
 * Returns only { hasApiKey: boolean, aiProvider: string | null }
 * NEVER returns the decrypted or encrypted key
 */
export async function GET() {
  const validated = await validateSession();
  if (!validated) {
    return Response.json({ error: "Não autorizado" }, { status: 401 });
  }

  const [user] = await db
    .select({ aiApiKey: users.aiApiKey, aiProvider: users.aiProvider })
    .from(users)
    .where(eq(users.id, validated.user.id))
    .limit(1);

  return Response.json({
    hasApiKey: !!user?.aiApiKey,
    aiProvider: user?.aiProvider ?? null,
  });
}

/**
 * POST /api/user/api-key
 * Auto-detects provider from key prefix, encrypts and saves.
 * userId always comes from session — never from the request body.
 * Provider is auto-detected server-side — never trusted from the client.
 */
export async function POST(req: Request) {
  const validated = await validateSession();
  if (!validated) {
    return Response.json({ error: "Não autorizado" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Corpo da requisição inválido" }, { status: 400 });
  }

  const parsed = saveKeySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const { apiKey } = parsed.data;

  // Detect provider from key prefix — server-side, never trusts client
  const provider = detectProvider(apiKey);

  // Encrypt before persisting — key never stored in plaintext
  const encryptedKey = encryptApiKey(apiKey);

  await db
    .update(users)
    .set({ aiProvider: provider, aiApiKey: encryptedKey })
    .where(eq(users.id, validated.user.id));

  return Response.json({ ok: true, provider });
}
