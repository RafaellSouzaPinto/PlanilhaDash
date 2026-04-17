import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { validateSession } from "@/lib/auth/session";
import { eq } from "drizzle-orm";

const FREE_TIER_LIMIT = Number(process.env.FREE_TIER_LIMIT ?? 3);

/**
 * GET /api/user/ai-status
 * Returns AI availability status for the current user.
 * Includes free tier counters and whether AI is usable right now.
 * NEVER returns API keys.
 */
export async function GET() {
  const validated = await validateSession();
  if (!validated) {
    return Response.json({ error: "Não autorizado" }, { status: 401 });
  }

  const [user] = await db
    .select({
      aiApiKey: users.aiApiKey,
      aiProvider: users.aiProvider,
      freeAnalysesUsed: users.freeAnalysesUsed,
      freeAnalysesResetAt: users.freeAnalysesResetAt,
    })
    .from(users)
    .where(eq(users.id, validated.user.id))
    .limit(1);

  const hasServerKey = !!(process.env.PLANILHA_GROQ_KEY ?? process.env.PLANILHA_OPENAI_KEY);

  const now = new Date();
  const resetAt = user?.freeAnalysesResetAt ?? null;
  const freeTierUsed =
    resetAt && now > resetAt ? 0 : (user?.freeAnalysesUsed ?? 0);

  const hasOwnKey = !!user?.aiApiKey;
  const hasFreeTierAvailable = hasServerKey && freeTierUsed < FREE_TIER_LIMIT;

  return Response.json({
    hasOwnKey,
    aiProvider: user?.aiProvider ?? null,
    freeTierUsed,
    freeTierLimit: FREE_TIER_LIMIT,
    hasFreeTierAvailable,
    hasAiAvailable: hasOwnKey || hasFreeTierAvailable,
  });
}
